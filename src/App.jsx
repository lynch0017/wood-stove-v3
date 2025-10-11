import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

function App() {
  // Sample temperature data - you can replace this with real data from your InfluxDB
  const [temperatureData, setTemperatureData] = useState([
    { time: '00:00', temperature: 72.5 },
    { time: '01:00', temperature: 71.8 },
    { time: '02:00', temperature: 70.2 },
    { time: '03:00', temperature: 69.5 },
    { time: '04:00', temperature: 68.9 },
    { time: '05:00', temperature: 69.1 },
    { time: '06:00', temperature: 70.5 },
    { time: '07:00', temperature: 72.8 },
    { time: '08:00', temperature: 75.2 },
    { time: '09:00', temperature: 78.5 },
    { time: '10:00', temperature: 82.1 },
    { time: '11:00', temperature: 85.6 },
    { time: '12:00', temperature: 88.9 },
    { time: '13:00', temperature: 92.3 },
    { time: '14:00', temperature: 94.7 },
    { time: '15:00', temperature: 96.8 },
    { time: '16:00', temperature: 98.2 },
    { time: '17:00', temperature: 95.6 },
    { time: '18:00', temperature: 91.4 },
    { time: '19:00', temperature: 87.2 },
    { time: '20:00', temperature: 83.5 },
    { time: '21:00', temperature: 79.8 },
    { time: '22:00', temperature: 76.3 },
    { time: '23:00', temperature: 74.1 },
  ]);

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTemperatureData(prevData => {
        const newData = [...prevData.slice(1)]; // Remove first element
        const lastTemp = newData[newData.length - 1].temperature;
        // Add small random variation to simulate real sensor data
        const variation = (Math.random() - 0.5) * 2;
        const newTemp = Math.max(65, Math.min(100, lastTemp + variation));
        newData.push({
          time: new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
          }),
          temperature: Math.round(newTemp * 10) / 10
        });
        return newData;
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', height: '100vh' }}>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>
        Wood Stove Temperature Monitor
      </h1>

      <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h2>Temperature Over Time</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={temperatureData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              label={{ value: 'Temperature (°F)', angle: -90, position: 'insideLeft' }}
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            <Tooltip
              formatter={(value) => [`${value}°F`, 'Temperature']}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#ff7300"
              strokeWidth={3}
              dot={{ fill: '#ff7300', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#ff7300', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-around' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <h3>Current Temperature</h3>
          <p style={{ fontSize: '2em', color: '#ff7300', fontWeight: 'bold' }}>
            {temperatureData[temperatureData.length - 1]?.temperature}°F
          </p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <h3>Peak Temperature</h3>
          <p style={{ fontSize: '2em', color: '#ff4444', fontWeight: 'bold' }}>
            {Math.max(...temperatureData.map(d => d.temperature))}°F
          </p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <h3>Average Temperature</h3>
          <p style={{ fontSize: '2em', color: '#4444ff', fontWeight: 'bold' }}>
            {(temperatureData.reduce((sum, d) => sum + d.temperature, 0) / temperatureData.length).toFixed(1)}°F
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
