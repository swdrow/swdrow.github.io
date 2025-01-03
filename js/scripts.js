function openPage (pageName, elmnt, color) {
  // Hide all elements with class="tabcontent" by default */
  var i, tabcontent, tablinks
  tabcontent = document.getElementsByClassName('tabcontent')
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = 'none'
  }

  // Remove the background color of all tablinks/buttons
  tablinks = document.getElementsByClassName('tablink')
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].style.backgroundColor = ''
  }

  // Show the specific tab content
  document.getElementById(pageName).style.display = 'block'

  // Add the specific color to the button used to open the tab content
  elmnt.style.backgroundColor = color
}

// Get the element with id="defaultOpen" and click on it
document.getElementById('defaultOpen').click()

function windowH () {
  var wH = $(window).height()

  $('.tabcontent').css({ height: wH })
}

windowH()

async function fetchWaterData () {
  const siteId = '01474500'
  const parameters = '00010,00065,00060' // Water temperature, gauge height, discharge
  const url = `https://waterservices.usgs.gov/nwis/iv/?sites=${siteId}&parameterCd=${parameters}&format=json`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText}`)
    }
    const data = await response.json()

    // Initialize default values
    let gaugeHeight = 'N/A'
    let waterTemp = 'N/A'
    let discharge = 'N/A'

    // Extract the time series data
    const timeSeries = data.value.timeSeries

    // Loop through each time series to extract data
    timeSeries.forEach(series => {
      const variableName = series.variable.variableName.toLowerCase()
      const latestValue = series.values[0]?.value[0]?.value || 'N/A'

      // Check for each parameter and assign the corresponding value
      if (variableName.includes('gage height')) {
        gaugeHeight = latestValue
      } else if (variableName.includes('temperature')) {
        waterTemp = latestValue
      } else if (
        variableName.includes('discharge') ||
        variableName.includes('flow')
      ) {
        discharge = latestValue
      }
    })

    // Update the respective containers in the HTML
    document.getElementById('R-Height').textContent = `${gaugeHeight} ft`
    document.getElementById('R-Temp').textContent = `${(
      waterTemp * 1.8 +
      32
    ).toFixed(1)}°F`
    document.getElementById('R-Discharge').textContent = `${discharge} ft³/s`
  } catch (error) {
    console.error('Error:', error)
    // Update the containers with error messages
    document.getElementById('R-Height').textContent = 'Error'
    document.getElementById('R-Temp').textContent = 'Error'
    document.getElementById('R-Discharge').textContent = 'Error'
  }
}

function checkAndLoadWindData() {
  const localStorageKey = 'currentWindData';
  const storedData = localStorage.getItem(localStorageKey);
  const storedTimestamp = localStorage.getItem('timestamp');
  const now = new Date().getTime();
  const tenMinutes = 10 * 60 * 1000; // 15 minutes in milliseconds
  const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

  if (storedData && storedTimestamp) {
    const timeElapsed = now - parseInt(storedTimestamp, 10);

    if (timeElapsed < tenMinutes) {
      const windData = JSON.parse(storedData);
      console.log('Loaded data from localStorage:', windData);
      updateUI(windData.data);
      return;
    }

    if (timeElapsed > fiveMinutes) {
      getAverageWindDataBoathouseRow();
    }
  }

  fetchAndStoreWindData();
}

async function fetchAndStoreWindData() {
  const windData = await getCurrentWindData();
  const now = new Date().getTime();
  const localStorageKey = 'currentWindData';
  const timestamp = new Date().toISOString();
  localStorage.setItem(localStorageKey, JSON.stringify({ data: windData, timestamp: timestamp }));
  console.log("fetchAndStoreWindData", windData);
  localStorage.setItem(localStorageKey, JSON.stringify(windData));
  localStorage.setItem('timestamp', now.toString());

  updateUI(windData.data);
}

async function getAverageWindDataBoathouseRow () {
  const lat = 39.9696 // Latitude for Boathouse Row, Philadelphia
  const lon = -75.1834 // Longitude for Boathouse Row, Philadelphia
  const endpoint = `https://api.weather.gov/points/${lat},${lon}`

  try {
    // Step 1: Get the grid data endpoint
    const response = await fetch(endpoint)
    if (!response.ok) throw new Error('Failed to fetch point data')
    const data = await response.json()
    console.log('Point data:', data)
    const gridDataUrl = data.properties.forecastGridData

    // Step 2: Fetch the forecast grid data
    const gridResponse = await fetch(gridDataUrl)
    if (!gridResponse.ok) throw new Error('Failed to fetch grid data')
    const gridData = await gridResponse.json()
    console.log('Grid data:', gridData)
    // Step 3: Extract wind data
    const windSpeedData = gridData.properties.windSpeed.values
    const windGustData = gridData.properties.windGust.values
    const windDirectionData = gridData.properties.windDirection.values

    // Step 4: Get the current time
    const currentTime = new Date()

    // Step 5: Find the forecasted data at the current moment in time
    const filteredWindSpeeds = windSpeedData.filter(
      entry => new Date(entry.validTime.split('/')[0]) <= currentTime
    )
    const filteredWindGusts = windGustData.filter(
      entry => new Date(entry.validTime.split('/')[0]) <= currentTime
    )
    const filteredWindDirections = windDirectionData.filter(
      entry => new Date(entry.validTime.split('/')[0]) <= currentTime
    )
    function avgFilter(arr) {
      if (arr.length >= 2) {
        const seclast = arr.slice(-2);
        avgL2 = (seclast[1].value);
        console.log(avgL2);
        return avgL2;
      } else {
        console.log('Not enough data to calculate the average wind speed.');
      }
    };

    console.log('Filtered wind speeds:', filteredWindSpeeds)
    console.log('Filtered wind gusts:', filteredWindGusts)
    console.log('Filtered wind directions:', filteredWindDirections)
    // Helper function to calculate average value
    const calculateAverage = data => {
      if (data.length === 0) return null
      const total = data.reduce((sum, entry) => sum + entry.value, 0)
      return total / data.length
    }

    // Calculate average wind speed and gust
    const windSpeed = avgFilter(filteredWindSpeeds) * 0.62
    const windGust = avgFilter(filteredWindGusts) * 0.62
    const windDirection = avgFilter(filteredWindDirections)
    
      console.log('Wind Correction:', ((windDirection + 90)%360));
      const windCorrection = ((windDirection + 90)%360);
      animateArrow(windCorrection);
      const localStorageKey = 'currentWindData';
      const windData = {windSpeed, windGust, windDirection};
      const timestamp = new Date().toISOString();

      // Store data in localStorage
      localStorage.setItem(localStorageKey, JSON.stringify({ data: windData, timestamp: timestamp }));
      updateUI(windData);
      return { windSpeed, windGust, windDirection }
    } catch (error) {
      console.error('Error fetching wind data:', error)
      return { windSpeed: null, windGust: null, windDirection: null }
    }
}

const arrow = document.getElementById('arrow')
function setRotation (angle) {
  let arrow = document.getElementById('arrow')
  arrow.setAttribute(
    'transform',
    `translate(8.4 137.1) scale(.24) rotate(${angle}, 333.5, 334)`
  )
}

// Easing function for smooth transitions
function easeInOutQuad (t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

// Function to animate the arrow
function animateArrow (targetAngle) {
  let currentAngle = 0 // Starting angle
  const fullRotation = 360 // Full circle
  function animatePhase (startAngle, endAngle, duration, easing, onComplete) {
    const phaseStartTime = performance.now();
    if ((endAngle-360) >= 0) {
      endAngle = 359;
    };
    console.log('Animating from', startAngle, 'to', endAngle)
    function animate (time) {
      const elapsedTime = time - phaseStartTime
      const progress = Math.min(elapsedTime / duration, 1) // Progress of the animation (0 to 1)
      const easedProgress = easing(progress) // Apply easing function

      const newAngle = startAngle + (endAngle - startAngle) * easedProgress
      setRotation(newAngle % fullRotation) // Ensure angle is within 0-360 range

      if (progress < 1) {
        requestAnimationFrame(animate) // Continue animation
      } else {
        onComplete(newAngle % fullRotation) // Call the next phase with the current angle
      }
    }

    requestAnimationFrame(animate) // Start animation
  }

  function startAnimation () {
    // Phase 1: Initial 360-degree counterclockwise spin at a constant rate
    animatePhase(
      currentAngle,
      currentAngle - 3 * fullRotation,
      1500,
      easeInOutQuad,
      newAngle => {
        // Phase 2: Accelerate until reaching 30 degrees past the target angle
        animatePhase(
          newAngle,
          (targetAngle + 25),
          700,
          easeInOutQuad,
          newAngle => {
            // Phase 4: Accelerate until reaching 30 degrees before the target angle
            animatePhase(
              newAngle,
              (targetAngle - 8),
              500,
              easeInOutQuad,
              newAngle => {
                // Phase 5: Decelerate counterclockwise to stop at the target angle
                animatePhase(
                  newAngle,
                  targetAngle + 3,
                  300,
                  easeInOutQuad,
                  newAngle => {
                    animatePhase(
                      newAngle,
                      targetAngle,
                      300,
                      easeInOutQuad,
                      () => {
                        // Final set to ensure exact target angle
                        setRotation(targetAngle)
                      }
                    )
                  }
                )
              }
            )
          }
        )
      }
    )
  }

  startAnimation()
}

async function getCurrentWindData(ignoreLocalStorage = false) {
  const apiUrl =
    'https://api.open-meteo.com/v1/forecast?latitude=39.9696&longitude=-75.1876&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=uv_index&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FNew_York';
  const latitude = 39.9696; // Latitude for Boathouse Row, Philadelphia
  const longitude = -75.1876; // Longitude for Boathouse Row, Philadelphia
  const parameters = [
    'current_weather=true',
    'latitude=' + latitude,
    'longitude=' + longitude,
    'wind_speed_unit=mph', // Use mph as the wind speed unit
    'timezone=America/New_York'
  ];

  const localStorageKey = 'currentWindData';

  try {
    // Check if data is already in localStorage and ignoreLocalStorage is false
    if (!ignoreLocalStorage) {
      const storedData = localStorage.getItem(localStorageKey);
      if (storedData) {
        const data = JSON.parse(storedData);
        console.log('Loaded data from localStorage:', data);
        updateUI(data.data);
        return data.data;
      }
    }

    // Construct the full API URL with parameters
    const url = `${apiUrl}`;

    // Fetch data from the API
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch wind data');

    // Parse the JSON response
    const data = await response.json();
    console.log(data);

    // Extract current weather details
    const currentWeather = data.current;
    const windSpeed = currentWeather.wind_speed_10m; // Wind speed in mph
    const windGust = currentWeather.wind_gusts_10m || 'N/A'; // Wind gusts in mph, if available
    const windDirection = currentWeather.wind_direction_10m || 'N/A';

    const windData = { windSpeed, windGust, windDirection };
    const timestamp = new Date().toISOString();

    // Store data in localStorage
    localStorage.setItem(localStorageKey, JSON.stringify({ data: windData, timestamp: timestamp }));

    console.log(`Wind Direction: ${windDirection || 'N/A'}°`);
    console.log(`Current Wind Speed: ${windSpeed} mph`);
    console.log(`Current Wind Gust Speed: ${windGust} mph`);
    updateUI(windData);
    return windData;
  } catch (error) {
    console.error('Error fetching wind data:', error);
    return { windSpeed: null, windGust: null, windDirection: null };
  }
}

function updateUI(data) {
  const { windSpeed, windGust, windDirection } = data;
  console.log('Updating UI with:', windSpeed, windGust, windDirection);
  document.getElementById('R-WindSpeed').textContent = `${windSpeed.toFixed(0)} mph`;
  document.getElementById('R-Gusts').textContent = `${windGust.toFixed(1) || 'N/A'} mph`;
  document.getElementById('R-Direction').textContent = `${windDirection.toFixed(1) || 'N/A'}°`;
  const windDirectionCorrection = ((windDirection + 90)%360);
  console.log('Wind Correction:', windDirectionCorrection);
  animateArrow(windDirectionCorrection);
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

async function getCurrentWindDataHr(lat, lon) {
  try {
      // Step 1: Fetch the latest observation from the specified station (KPHL)
      const stationId = 'KPHL';
      const observationResponse = await fetch(`https://api.weather.gov/points/${lat},${lon}`);
      if (!observationResponse.ok) throw new Error('Failed to fetch latest observation');
      const observationData = await observationResponse.json();
      console.log('Observation data:', observationData);
      const newrep =  await fetch("https://api.weather.gov/gridpoints/PHI/49,76")
      const newrepData = await newrep.json();
      console.log('newrepData:', newrepData);
      // Step 2: Extract wind data
      const windSpeed = observationData.properties.windSpeed.value; // in m/s
      const windGust = observationData.properties.windGust?.value; // in m/s
      const windDirection = observationData.properties.windDirection.value; // in degrees

      // Convert wind speed to km/h
      const windSpeedKmH = windSpeed ? (windSpeed * 3.6).toFixed(2) : null;
      const windGustKmH = windGust ? (windGust * 3.6).toFixed(2) : null;

      console.log(`Wind Speed: ${windSpeedKmH || 'N/A'} km/h`);
      console.log(`Wind Gust: ${windGustKmH || 'N/A'} km/h`);
      console.log(`Wind Direction: ${windDirection || 'N/A'}°`);

      return { windSpeed: windSpeedKmH, windGust: windGustKmH, windDirection };
  } catch (error) {
      console.error('Error fetching current wind data:', error);
      return { windSpeed: null, windGust: null, windDirection: null };
  }
}
