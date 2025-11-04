// Weather service for fetching outdoor temperature
// Uses Open-Meteo API (free, no API key required)

const WEATHER_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

let cachedWeather = null;
let cacheTimestamp = null;

// Get user's geolocation
const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        timeout: 10000,
        enableHighAccuracy: false
      }
    );
  });
};

// Fetch weather data from Open-Meteo API
const fetchWeatherData = async (latitude, longitude) => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=fahrenheit`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.current_weather;
  } catch (error) {
    throw new Error(`Failed to fetch weather: ${error.message}`);
  }
};

// Get current outdoor temperature with caching
export const getCurrentOutdoorTemp = async () => {
  // Check cache first
  if (cachedWeather && cacheTimestamp && (Date.now() - cacheTimestamp < WEATHER_CACHE_DURATION)) {
    return {
      temperature: cachedWeather.temperature,
      cached: true,
      timestamp: cacheTimestamp
    };
  }

  try {
    // Get user location
    const location = await getUserLocation();
    
    // Fetch weather data
    const weather = await fetchWeatherData(location.latitude, location.longitude);
    
    // Cache the result
    cachedWeather = weather;
    cacheTimestamp = Date.now();
    
    return {
      temperature: Math.round(weather.temperature * 10) / 10, // Round to 1 decimal
      windSpeed: weather.windspeed,
      cached: false,
      timestamp: cacheTimestamp,
      location: location
    };
  } catch (error) {
    console.error('Error fetching outdoor temperature:', error);
    throw error;
  }
};

// Clear the weather cache (useful for manual refresh)
export const clearWeatherCache = () => {
  cachedWeather = null;
  cacheTimestamp = null;
};

// Get cached temperature without making a new request
export const getCachedTemp = () => {
  if (cachedWeather && cacheTimestamp && (Date.now() - cacheTimestamp < WEATHER_CACHE_DURATION)) {
    return {
      temperature: cachedWeather.temperature,
      cached: true,
      timestamp: cacheTimestamp
    };
  }
  return null;
};

// Check if cache is still valid
export const isCacheValid = () => {
  return cachedWeather && cacheTimestamp && (Date.now() - cacheTimestamp < WEATHER_CACHE_DURATION);
};

// Format timestamp for display
export const formatCacheAge = (timestamp) => {
  if (!timestamp) return 'Unknown';
  
  const ageMinutes = Math.floor((Date.now() - timestamp) / 60000);
  
  if (ageMinutes < 1) return 'Just now';
  if (ageMinutes === 1) return '1 minute ago';
  if (ageMinutes < 60) return `${ageMinutes} minutes ago`;
  
  const ageHours = Math.floor(ageMinutes / 60);
  if (ageHours === 1) return '1 hour ago';
  return `${ageHours} hours ago`;
};

