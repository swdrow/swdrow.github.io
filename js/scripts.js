
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
};

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
};

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
    console.log('Grid data:', gridData);
    // Step 3: Extract wind data
    const windSpeedData = gridData.properties.windSpeed.values;
    const windGustData = gridData.properties.windGust.values;
    const windDirectionData = gridData.properties.windDirection.values;

    // Step 4: Get the current time
    const currentTime = new Date();

    // Step 5: Find the forecasted data at the current moment in time
    const filteredWindSpeeds = windSpeedData.filter(entry => new Date(entry.validTime.split('/')[0]) <= currentTime);
    const filteredWindGusts = windGustData.filter(entry => new Date(entry.validTime.split('/')[0]) <= currentTime);
    const filteredWindDirections = windDirectionData.filter(entry => new Date(entry.validTime.split('/')[0]) <= currentTime);

    // Helper function to calculate average value
    const calculateAverage = (data) => {
      if (data.length === 0) return null;
      const total = data.reduce((sum, entry) => sum + entry.value, 0);
      return total / data.length;
    };

    // Calculate average wind speed and gust
    const avgWindSpeed  = calculateAverage(filteredWindSpeeds)* 0.62;
    const avgWindGust  = calculateAverage(filteredWindGusts)* 0.62;

    // Calculate average wind direction using vector math
    if (filteredWindDirections.length > 0) {
      const sinSum = filteredWindDirections.reduce((sum, entry) => sum + Math.sin((entry.value * Math.PI) / 180), 0);
      const cosSum = filteredWindDirections.reduce((sum, entry) => sum + Math.cos((entry.value * Math.PI) / 180), 0);

      // Convert the averaged components back to degrees
      const avgWindDirection = (Math.atan2(sinSum, cosSum) * (180 / Math.PI) + 360) % 360;
      document.getElementById("R-WindSpeed").textContent = `${avgWindSpeed.toFixed(2)} mph`;
      document.getElementById("R-Gusts").textContent = `${avgWindGust.toFixed(2)} mph`;
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

const arrow = document.getElementById("arrow");
async function getCurrentWindData () {
  const apiUrl =
    'https://api.open-meteo.com/v1/forecast?latitude=39.9696&longitude=-75.1876&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=uv_index&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FNew_York'
  const latitude = 39.9696 // Latitude for Boathouse Row, Philadelphia
  const longitude = -75.1876 // Longitude for Boathouse Row, Philadelphia
  const parameters = [
    'current_weather=true',
    'latitude=' + latitude,
    'longitude=' + longitude,
    'wind_speed_unit=mph', // Use mph as the wind speed unit
    'timezone=America/New_York'
  ]

  try {
    // Construct the full API URL with parameters
    const url = `${apiUrl}`

    // Fetch data from the API
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch wind data')

    // Parse the JSON response
    const data = await response.json()
    console.log(data)
    // Extract current weather details
    const currentWeather = data.current
    const windSpeed = currentWeather.wind_speed_10m // Wind speed in mph
    const windGust = currentWeather.wind_gusts_10m || 'N/A' // Wind gusts in mph, if available
    const windDirection = currentWeather.wind_direction_10m || 'N/A'

    console.log(`Wind Direction: ${windDirection || 'N/A'}°`)
    console.log(`Current Wind Speed: ${windSpeed} mph`)
    console.log(`Current Wind Gust Speed: ${windGust} mph`)
    document.getElementById('R-WindSpeed').textContent = `${windSpeed} mph`
    document.getElementById('R-Gusts').textContent = `${windGust || 'N/A'} mph`
    document.getElementById('R-Direction').textContent = `${
      windDirection || 'N/A'
    }°`
    return { windSpeed, windGust }
  } catch (error) {
    console.error('Error fetching wind data:', error)
    return { windSpeed: null, windGust: null }
  }
}

function handleCooldown (button, cooldownTime) {
  let remainingTime = cooldownTime
  const totalTime = cooldownTime

  // Disable the button
  button.disabled = true

  const interval = setInterval(() => {
    remainingTime--

    // Calculate percentage filled
    const percentage = ((totalTime - remainingTime) / totalTime) * 100

    // Update the button's background gradient
    button.style.background = `linear-gradient(to right, #007BFF ${percentage}%, #d6d6d6 ${percentage}%)`

    if (remainingTime <= 0) {
      clearInterval(interval)
      button.disabled = false
      button.style.background =
        'linear-gradient(to right, #007BFF 100%, #007BFF 100%)'
      button.textContent = 'Fetch Current Wind Data'
    } else {
      button.textContent = `Cooldown: ${remainingTime}s`
    }
  }, 1000)
}


function setRotation(angle) {
  let arrow = document.getElementById("arrow");
  arrow.setAttribute(
    "transform", 
    `translate(8.4 137.1) scale(.24) rotate(${angle}, 333.5, 334)`
  );
}

// Easing function for smooth transitions
function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// Function to animate the arrow
function animateArrow(targetAngle) {
  let currentAngle = 0; // Starting angle
  const fullRotation = 360; // Full circle

  function animatePhase(startAngle, endAngle, duration, easing, onComplete) {
    const phaseStartTime = performance.now();

    function animate(time) {
      const elapsedTime = time - phaseStartTime;
      const progress = Math.min(elapsedTime / duration, 1); // Progress of the animation (0 to 1)
      const easedProgress = easing(progress); // Apply easing function

      const newAngle = startAngle + (endAngle - startAngle) * easedProgress;
      setRotation(newAngle % fullRotation); // Ensure angle is within 0-360 range

      if (progress < 1) {
        requestAnimationFrame(animate); // Continue animation
      } else {
        onComplete(newAngle % fullRotation); // Call the next phase with the current angle
      }
    }

    requestAnimationFrame(animate); // Start animation
  }

  function startAnimation() {
    // Phase 1: Initial 360-degree counterclockwise spin at a constant rate
    animatePhase(currentAngle, currentAngle-1.5*fullRotation, 2000, t => t, (newAngle) => {
      // Phase 2: Accelerate until reaching 30 degrees past the target angle
      animatePhase(newAngle, targetAngle + 30, 700, easeInOutQuad, (newAngle) => {
        // Phase 4: Accelerate until reaching 30 degrees before the target angle
        animatePhase(newAngle, targetAngle - 30, 500, easeInOutQuad, (newAngle) => {
          // Phase 5: Decelerate counterclockwise to stop at the target angle
          animatePhase(newAngle, targetAngle, 1000, easeInOutQuad, () => {
            // Final set to ensure exact target angle
            setRotation(targetAngle);
          });
        });
      });
    });
  }

  startAnimation();
}

// Example usage
const calculatedAngle = 120; // Replace with your calculated angle
animateArrow(calculatedAngle);
// function setRotation(angle) {
//   let arrow = document.getElementById("arrow");
//   arrow.setAttribute(
//       "transform", 
//       `translate(8.4 137.1) scale(.24) rotate(${angle}, 333.5, 334)`
//   );
// }

// // Function to animate the arrow
// function animateArrow(targetAngle) {
//   let arrow = document.getElementById("arrow");
//   let currentAngle = 0; // Starting angle
//   const fullRotation = 360; // Full circle
//   const originalSpinSpeed = 2; // Original speed during the spin
//   const slowSpeed = 2; // Speed during approach phases
//   const s_slowSpeed = 1; // Threshold for snapping to the target angle
//   const threshold = 2; // Threshold for snapping to the target angle

//   let phase = 1; // 1 = full spin, 2 = approach x+10, 3 = approach x-10, 4 = final stop
//   let fullRotationCompleted = false;

//   function updateSpinSpeed() {
//       if (phase !== 1) {
//           fullRotationCompleted = true;
//       }
//       let newspeed = originalSpinSpeed;
//       const angleDifference = (Math.abs((currentAngle % fullRotation) - targetAngle));
//       const within30Degrees = (angleDifference <= 30);
//       // console.log(currentAngle)
//       if (fullRotationCompleted && within30Degrees) {
//           newspeed = originalSpinSpeed + 2*(angleDifference/30);
//           console.log(newspeed)
//           return newspeed;
//       } else {
//           return originalSpinSpeed;
//       }
//   }
// const fps = 500;
//   function animate() {
//       spinSpeed = updateSpinSpeed();
//       // console.log(spinSpeed)
//       if (phase === 1) {
//           // Full 360-degree spin
//           currentAngle += spinSpeed;
//           if (currentAngle % fullRotation >= targetAngle + 30) {
//               phase = 2; // Transition to phase 2
//               console.log('phase 2')
//           }
//       } else if (phase === 2) {
//           // Spin clockwise until x+20
//           if (Math.abs((currentAngle % fullRotation) - (targetAngle + 30)) <= threshold) {
//               phase = 3; // Transition to phase 3
//               console.log('phase 3')
//           } else {
//               currentAngle += spinSpeed;
//           }
//       } else if (phase === 3) {
//           // Spin counterclockwise until x-10
//           if (Math.abs((currentAngle % fullRotation) - (targetAngle - 30)) <= threshold) {
//               phase = 4; // Transition to phase 4
//               console.log('phase 4')

//           } else {
//               currentAngle -= spinSpeed;
//           }
//       } else if (phase === 4) {
//           // Spin clockwise to x
//           if (Math.abs((currentAngle % fullRotation) - targetAngle) <= threshold) {
//               currentAngle = targetAngle; // Snap to target
//               setRotation(currentAngle);
//               return; // Stop animation
//           } else {
//               currentAngle += spinSpeed;
//           }
//       }

//       setRotation((currentAngle) % fullRotation); // Ensure angle is positive
//       requestAnimationFrame(animate); // Continue animation
//   }

//   requestAnimationFrame(animate); // Start animation
// }

// // Example usage
// const calculatedAngle = 120; // Replace with your calculated angle
// animateArrow(calculatedAngle);

