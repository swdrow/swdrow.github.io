
function openPage(pageName, elmnt, color) {
  // Hide all elements with class="tabcontent" by default */
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Remove the background color of all tablinks/buttons
  tablinks = document.getElementsByClassName("tablink");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].style.backgroundColor = "";
  }

  // Show the specific tab content
  document.getElementById(pageName).style.display = "block";

  // Add the specific color to the button used to open the tab content
  elmnt.style.backgroundColor = color;
}

// Get the element with id="defaultOpen" and click on it
document.getElementById("defaultOpen").click();

function windowH() {
  var wH = $(window).height();

  $('.tabcontent').css({ height: wH });
}

windowH();

async function fetchWaterData() {
  const siteId = "01474500";
  const parameters = "00010,00065,00060"; // Water temperature, gauge height, discharge
  const url = `https://waterservices.usgs.gov/nwis/iv/?sites=${siteId}&parameterCd=${parameters}&format=json`;

  try {
      const response = await fetch(url);
      if (!response.ok) {
          throw new Error(`Error fetching data: ${response.statusText}`);
      }
      const data = await response.json();

      // Initialize default values
      let gaugeHeight = "N/A";
      let waterTemp = "N/A";
      let discharge = "N/A";

      // Extract the time series data
      const timeSeries = data.value.timeSeries;

      // Loop through each time series to extract data
      timeSeries.forEach(series => {
          const variableName = series.variable.variableName.toLowerCase();
          const latestValue = series.values[0]?.value[0]?.value || "N/A";

          // Check for each parameter and assign the corresponding value
          if (variableName.includes("gage height")) {
              gaugeHeight = latestValue;
          } else if (variableName.includes("temperature")) {
              waterTemp = latestValue;
          } else if (variableName.includes("discharge") || variableName.includes("flow")) {
              discharge = latestValue;
          }
      });

      // Update the respective containers in the HTML
      document.getElementById("R-Height").textContent = `${gaugeHeight} ft`;
      document.getElementById("R-Temp").textContent = `${(waterTemp*1.8+32).toFixed(1)}°F`;
      document.getElementById("R-Discharge").textContent = `${discharge} ft³/s`;

  } catch (error) {
      console.error("Error:", error);
      // Update the containers with error messages
      document.getElementById("R-Height").textContent = "Error";
      document.getElementById("R-Temp").textContent = "Error";
      document.getElementById("R-Discharge").textContent = "Error";
  }
}

async function getAverageWindDataBoathouseRow() {
  const lat = 39.9696; // Latitude for Boathouse Row, Philadelphia
  const lon = -75.1834; // Longitude for Boathouse Row, Philadelphia
  const noaaEndpoint = `https://api.weather.gov/points/${lat},${lon}`;

  try {
      // Step 1: Get the grid data endpoint
      const pointResponse = await fetch(noaaEndpoint);
      if (!pointResponse.ok) throw new Error('Failed to fetch NOAA point data');
      const pointData = await pointResponse.json();
      const gridDataUrl = pointData.properties.forecastGridData;

      // Step 2: Fetch the forecast grid data
      const gridResponse = await fetch(gridDataUrl);
      if (!gridResponse.ok) throw new Error('Failed to fetch NOAA grid data');
      const gridData = await gridResponse.json();

      // Step 3: Extract wind data
      const windSpeedData = gridData.properties.windSpeed.values;
      const windGustData = gridData.properties.windGust.values;
      const windDirectionData = gridData.properties.windDirection.values;

      // Step 4: Calculate average for the past 20 minutes or nearest timeframe
      const currentTime = new Date();
      const past5Minutes = new Date(currentTime.getTime() - 5 * 60 * 1000);

      const filterByTime = (data) =>
          data.filter(entry => new Date(entry.validTime.split('/')[0]) >= past5Minutes);

      const filteredWindSpeeds = filterByTime(windSpeedData);
      const filteredWindGusts = filterByTime(windGustData);
      const filteredWindDirections = filterByTime(windDirectionData);

      // Helper function to calculate average value
      const calculateAverage = (data) => {
          if (data.length === 0) return null;
          const total = data.reduce((sum, entry) => sum + entry.value, 0);
          return total / data.length;
      };

      // Calculate average wind speed and gust
      const avgWindSpeed = calculateAverage(filteredWindSpeeds);
      const avgWindGust = calculateAverage(filteredWindGusts);

      // Calculate average wind direction using vector math
      if (filteredWindDirections.length > 0) {
          const sinSum = filteredWindDirections.reduce((sum, entry) => sum + Math.sin((entry.value * Math.PI) / 180), 0);
          const cosSum = filteredWindDirections.reduce((sum, entry) => sum + Math.cos((entry.value * Math.PI) / 180), 0);

          // Convert the averaged components back to degrees
          const avgWindDirection = (Math.atan2(sinSum, cosSum) * (180 / Math.PI) + 360) % 360;
          document.getElementById("R-WindSpeed").textContent = `${avgWindSpeed.toFixed(1)} mph`;
          document.getElementById("R-Gusts").textContent = `${avgWindGust.toFixed(1)} mph`;
          document.getElementById("R-Direction").textContent = `${avgWindDirection.toFixed(1)}°`;
          console.log(`Average Wind Speed: ${avgWindSpeed || 'No data available'} mph`);
          console.log(`Average Wind Gust: ${avgWindGust || 'No data available'} mph`);
          console.log(`Average Wind Direction: ${avgWindDirection || 'No data available'}°`);

          return { avgWindSpeed, avgWindGust, avgWindDirection };
      } else {
          console.log('No data available for wind direction.');
          return { avgWindSpeed, avgWindGust, avgWindDirection: null };
      }
  } catch (error) {
      console.error('Error fetching NOAA wind data:', error);
      return { avgWindSpeed: null, avgWindGust: null, avgWindDirection: null };
  }
}


