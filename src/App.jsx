import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { fetchTemperatureData, getTemperatureStats } from './influxService';

function App() {
  const [temperatureData, setTemperatureData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useRealData, setUseRealData] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(30); // seconds
  const [isPolling, setIsPolling] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [timeWindow, setTimeWindow] = useState(24); // hours

  // Generate mock data for testing
  const generateMockData = useCallback(() => {
    const now = new Date();
    const data = [];
    const hoursBack = timeWindow;
    const dataPoints = Math.min(hoursBack * 4, 96); // Max 96 points (15 min intervals for 24h)

    for (let i = dataPoints - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - (i * hoursBack * 60 * 60 * 1000) / dataPoints);
      const baseTemp = 75 + Math.sin(i / (dataPoints / 6)) * 15; // Sine wave pattern
      const variation = (Math.random() - 0.5) * 3; // Random variation
      const temperature = Math.max(65, Math.min(100, baseTemp + variation));

      data.push({
        time: time.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        }),
        temperature: Math.round(temperature * 10) / 10,
        timestamp: time.getTime()
      });
    }
    return data;
  }, [timeWindow]);

  // Fetch real data from InfluxDB
  const fetchRealData = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchTemperatureData(timeWindow); // Use selected time window
      setTemperatureData(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch real data:', err);
      // Fallback to mock data on error
      setTemperatureData(generateMockData());
    }
  }, [generateMockData, timeWindow]);

  // Load data based on current mode
  const loadData = useCallback(async () => {
    setLoading(true);
    if (useRealData) {
      await fetchRealData();
    } else {
      setTemperatureData(generateMockData());
      setLastUpdate(new Date());
    }
    setLoading(false);
  }, [useRealData, fetchRealData, generateMockData]);

  // Initial data load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Polling effect
  useEffect(() => {
    if (!isPolling) return;

    const interval = setInterval(() => {
      loadData();
    }, pollingInterval * 1000);

    return () => clearInterval(interval);
  }, [loadData, isPolling, pollingInterval]);

  // Get statistics
  const stats = getTemperatureStats(temperatureData);

  return (
    <div style={{ padding: '15px', backgroundColor: '#f8f9fa', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{
          textAlign: 'center',
          color: '#2c3e50',
          marginBottom: '20px',
          fontSize: '2em',
          fontWeight: '300'
        }}>
          🔥 Wood Stove Temperature Monitor
        </h1>

        {/* Controls */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '15px',
          alignItems: 'center'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={useRealData}
              onChange={(e) => setUseRealData(e.target.checked)}
            />
            Use Real InfluxDB Data
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={isPolling}
              onChange={(e) => setIsPolling(e.target.checked)}
            />
            Auto-refresh
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Interval:</span>
            <select
              value={pollingInterval}
              onChange={(e) => setPollingInterval(Number(e.target.value))}
              disabled={!isPolling}
            >
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
              <option value={300}>5m</option>
              <option value={600}>10m</option>
            </select>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Time Window:</span>
            <select
              value={timeWindow}
              onChange={(e) => setTimeWindow(Number(e.target.value))}
            >
              <option value={48}>2 days</option>
              <option value={24}>1 day</option>
              <option value={12}>12 hours</option>
              <option value={8}>8 hours</option>
              <option value={4}>4 hours</option>
              <option value={1}>1 hour</option>
              <option value={0.5}>30 min</option>
              <option value={0.25}>15 min</option>
            </select>
          </label>

          <button
            onClick={loadData}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: loading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>

          {lastUpdate && (
            <span style={{ fontSize: '0.9em', color: '#666' }}>
              Last update: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            ⚠️ Error loading real data: {error}
            <br />
            <small>Falling back to mock data. Check your InfluxDB configuration.</small>
          </div>
        )}

        {/* Temperature Chart */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h2 style={{ marginTop: 0, color: '#2c3e50' }}>Temperature Trend</h2>
          {temperatureData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={temperatureData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11, fill: '#666' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  label={{ value: '°F', angle: -90, position: 'insideLeft' }}
                  domain={['dataMin - 2', 'dataMax + 2']}
                  tick={{ fontSize: 11, fill: '#666' }}
                />
                <Tooltip
                  formatter={(value) => [`${value}°F`, 'Temperature']}
                  labelFormatter={(label) => `Time: ${label}`}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#dc3545"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, stroke: '#dc3545', strokeWidth: 2 }}
                  animationDuration={1000}
                  animationEasing="ease-in-out"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
              {loading ? 'Loading temperature data...' : 'No data available'}
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '1.1em' }}>Current</h3>
            <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#dc3545' }}>
              {stats.current}°F
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '1.1em' }}>Peak</h3>
            <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#fd7e14' }}>
              {stats.peak}°F
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '1.1em' }}>Average</h3>
            <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#007bff' }}>
              {stats.average}°F
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '1.1em' }}>Data Points</h3>
            <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#28a745' }}>
              {stats.count}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '30px', color: '#666', fontSize: '0.9em' }}>
          <p>🔥 Wood Stove Temperature Monitor | Deployed on GitHub Pages</p>
          <p>Data source: {useRealData ? 'InfluxDB Cloud' : 'Mock Data'}</p>
        </div>
      </div>
    </div>
  );
}

export default App;
