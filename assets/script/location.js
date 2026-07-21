async function fetchCurrentCity() {
  try {
    const response = await fetch(`https://api.github.com/gists/42051d18cb5b93287ff0251ba7e66f4c`);
    const data = await response.json();

    if (data.files && data.files['location.json']) {
      const locationContent = JSON.parse(data.files['location.json'].content);
      document.getElementById('city-display').textContent = `| Currently in ${locationContent.city}`;
      updateLocalTime(locationContent.city);
      startLiveClock(locationContent.city);
    } else {
      console.warn('File location.json not found in Gist.');
    }
  } catch (error) {
    console.error('Error retrieving location:', error);
  }
}

fetchCurrentCity();

async function updateLocalTime(cityName) {
  try {
    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1`);
    const geoData = await geoResponse.json();

    if (geoData.results && geoData.results[0]) {
      const timezone = geoData.results[0].timezone;

      const now = new Date();
      const localTimeStr = new Intl.DateTimeFormat('nl-NL', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit'
      }).format(now);

      const timeElement = document.getElementById('time-display');
      if (timeElement) {
        timeElement.textContent = `(${localTimeStr})`;
      }
    }
  } catch (error) {
    console.error('Error retrieving new time:', error);
  }
}

let clockInterval = null;

async function startLiveClock(cityName) {
  let timezone = 'Europe/Amsterdam';

  try {
    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1`);
    const geoData = await geoResponse.json();

    if (geoData.results && geoData.results[0] && geoData.results[0].timezone) {
      timezone = geoData.results[0].timezone;
    }
  } catch (err) {
    console.warn('Geocoding failed, fallback to default timezone (AMS):', err);
  }

  if (clockInterval) clearInterval(clockInterval);

  const tick = () => {
    const now = new Date();
    const localTimeStr = new Intl.DateTimeFormat('nl-NL', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit'
    }).format(now);

    const timeElement = document.getElementById('time-display');
    if (timeElement) {
      timeElement.textContent = `(${localTimeStr})`;
    }
  };

  tick();
  clockInterval = setInterval(tick, 1000);
}