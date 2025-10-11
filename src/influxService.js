// InfluxDB API service for querying temperature data
// This queries InfluxDB directly from the frontend (requires CORS configuration)

const INFLUXDB_CONFIG = {
  url: import.meta.env.VITE_INFLUXDB_URL || 'https://us-east-1-1.aws.cloud2.influxdata.com',
  token: import.meta.env.VITE_INFLUXDB_TOKEN,
  org: import.meta.env.VITE_INFLUXDB_ORG,
  bucket: import.meta.env.VITE_INFLUXDB_BUCKET || 'temperature_bucket'
};

// InfluxDB API query to get temperature data
export const fetchTemperatureData = async (hoursBack = 24) => {
  try {
    // Calculate time range
    const startTime = new Date(Date.now() - (hoursBack * 60 * 60 * 1000)).toISOString();

    // InfluxDB Flux query
    const fluxQuery = `
      from(bucket: "${INFLUXDB_CONFIG.bucket}")
        |> range(start: ${startTime})
        |> filter(fn: (r) => r["_measurement"] == "temperature_measurement")
        |> filter(fn: (r) => r["location"] == "catalyst")
        |> filter(fn: (r) => r["_field"] == "temperature")
        |> aggregateWindow(every: 5m, fn: mean, createEmpty: false)
        |> yield(name: "mean")
    `;

    const response = await fetch(`${INFLUXDB_CONFIG.url}/api/v2/query?org=${INFLUXDB_CONFIG.org}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${INFLUXDB_CONFIG.token}`,
        'Content-Type': 'application/vnd.flux',
        'Accept': 'application/csv'
      },
      body: fluxQuery
    });

    if (!response.ok) {
      throw new Error(`InfluxDB query failed: ${response.status} ${response.statusText}`);
    }

    const csvData = await response.text();
    return parseInfluxCSV(csvData);
  } catch (error) {
    console.error('Error fetching temperature data:', error);
    throw error;
  }
};

// Parse InfluxDB CSV response into chart-friendly format
const parseInfluxCSV = (csvText) => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // Skip header lines and parse data
  const dataLines = lines.filter(line => !line.startsWith('#') && line.trim());

  return dataLines.slice(1).map(line => {
    const columns = line.split(',');

    if (columns.length < 7) { // Need at least 7 columns now
      console.warn('Not enough columns:', columns.length, columns);
      return null;
    }

    const timestamp = columns[5]; // _time column
    const temperature = parseFloat(columns[6]); // _value column (corrected index)

    if (!timestamp || isNaN(temperature)) {
      console.warn('Invalid data - timestamp:', timestamp, 'temperature:', temperature);
      return null;
    }

    // Convert timestamp to readable format
    const date = new Date(timestamp);
    const timeString = date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    return {
      time: timeString,
      temperature: Math.round(temperature * 10) / 10, // Round to 1 decimal
      timestamp: date.getTime()
    };
  }).filter(item => item !== null)
  .sort((a, b) => a.timestamp - b.timestamp); // Sort by time
};

// Get current temperature (latest reading)
export const fetchCurrentTemperature = async () => {
  try {
    const data = await fetchTemperatureData(1); // Last hour
    if (data.length === 0) return null;

    // Return the latest temperature
    return data[data.length - 1];
  } catch (error) {
    console.error('Error fetching current temperature:', error);
    return null;
  }
};

// Get temperature statistics
export const getTemperatureStats = (data) => {
  if (!data || data.length === 0) {
    return {
      current: 0,
      peak: 0,
      average: 0,
      count: 0
    };
  }

  const temperatures = data.map(d => d.temperature);
  const current = temperatures[temperatures.length - 1];
  const peak = Math.max(...temperatures);
  const average = temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length;

  return {
    current: Math.round(current * 10) / 10,
    peak: Math.round(peak * 10) / 10,
    average: Math.round(average * 10) / 10,
    count: temperatures.length
  };
};
