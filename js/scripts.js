
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
      document.getElementById("R-Temp").textContent = `${waterTemp}°C`;
      document.getElementById("R-Discharge").textContent = `${discharge} ft³/s`;

  } catch (error) {
      console.error("Error:", error);
      // Update the containers with error messages
      document.getElementById("R-Height").textContent = "Error";
      document.getElementById("R-Temp").textContent = "Error";
      document.getElementById("R-Discharge").textContent = "Error";
  }
}
