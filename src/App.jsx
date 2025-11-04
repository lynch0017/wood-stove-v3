import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
  Area
} from 'recharts';
import { fetchTemperatureData, getTemperatureStats } from './influxService';
import ChatWidget from './ChatWidget';
import PredictionPanel from './PredictionPanel';
import { trainModel, generatePrediction, formatPredictions, calculateConfidenceBands, disposeModel } from './predictionModel';
import { analyzePrediction, generatePredictionSummary, generateQuickSummary, formatForChatAssistant } from './predictionAnalyzer';

function App() {
  const [temperatureData, setTemperatureData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(30); // seconds
  const [isPolling, setIsPolling] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [timeWindow, setTimeWindow] = useState(24); // hours
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Prediction state
  const [isPredictionMode, setIsPredictionMode] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [selectedData, setSelectedData] = useState(null);
  const [predictedData, setPredictedData] = useState([]);
  const [confidenceBands, setConfidenceBands] = useState([]);
  const [trainedModel, setTrainedModel] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(null);
  const [mouseDownTimestamp, setMouseDownTimestamp] = useState(null);
  const [predictionAnalysis, setPredictionAnalysis] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isPredictionPanelExpanded, setIsPredictionPanelExpanded] = useState(false);

  // Fetch real data from InfluxDB
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchTemperatureData(timeWindow); // Use selected time window
      setTemperatureData(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch data:', err);
      setTemperatureData([]); // Clear data on error
    }
  }, [timeWindow]);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    await fetchData();
    setLoading(false);
  }, [fetchData]);

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

  // Handle chart selection for prediction
  const handleMouseDown = (e) => {
    if (!isPredictionMode || !e || !e.activeLabel) return;
    const dataPoint = temperatureData.find(d => d.time === e.activeLabel);
    if (dataPoint && dataPoint.timestamp) {
      setMouseDownTimestamp(dataPoint.timestamp);
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  };

  const handleMouseMove = (e) => {
    if (!isPredictionMode || !mouseDownTimestamp || !e || !e.activeLabel) return;
    const dataPoint = temperatureData.find(d => d.time === e.activeLabel);
    if (dataPoint && dataPoint.timestamp) {
      setSelectionStart(Math.min(mouseDownTimestamp, dataPoint.timestamp));
      setSelectionEnd(Math.max(mouseDownTimestamp, dataPoint.timestamp));
    }
  };

  const handleMouseUp = () => {
    if (!isPredictionMode || !selectionStart || !selectionEnd) {
      setMouseDownTimestamp(null);
      return;
    }
    
    // Extract selected data
    const selected = temperatureData.filter(
      d => d.timestamp >= selectionStart && d.timestamp <= selectionEnd
    );
    
    if (selected.length >= 60) { // Need at least 60 points (5 hours)
      setSelectedData(selected);
    } else {
      alert('Please select at least 5 hours of data (60 points)');
      setSelectionStart(null);
      setSelectionEnd(null);
    }
    
    setMouseDownTimestamp(null);
  };

  const handleTogglePredictionMode = () => {
    setIsPredictionMode(!isPredictionMode);
    setSelectionStart(null);
    setSelectionEnd(null);
    setSelectedData(null);
    setPredictedData([]);
    setConfidenceBands([]);
    setMouseDownTimestamp(null);
    
    // Dispose of old model
    if (trainedModel) {
      disposeModel(trainedModel);
      setTrainedModel(null);
    }
  };

  const handleGeneratePrediction = async (params) => {
    if (!selectedData || selectedData.length < 60) {
      alert('Please select at least 5 hours of historical data');
      return;
    }

    setIsTraining(true);
    setTrainingProgress({ epoch: 0, totalEpochs: 50 });
    setPredictedData([]);
    setConfidenceBands([]);

    try {
      // Dispose of old model
      if (trainedModel) {
        disposeModel(trainedModel);
      }

      // Train model on selected data
      const model = await trainModel(selectedData, (progress) => {
        setTrainingProgress(progress);
      });
      
      setTrainedModel(model);

      // Generate prediction
      const predictions = await generatePrediction(
        model,
        temperatureData,
        params.outdoorTemp,
        params.fillLevel,
        params.woodBTU,
        params.predictionHours
      );

      // Format predictions for chart
      const lastDataPoint = temperatureData[temperatureData.length - 1];
      const intervalMs = 5 * 60 * 1000; // 5 minutes
      const formattedPredictions = formatPredictions(
        predictions,
        lastDataPoint.timestamp + intervalMs // Start from next interval
      );

      setPredictedData(formattedPredictions);

      // Calculate confidence bands
      const bands = calculateConfidenceBands(predictions);
      setConfidenceBands(bands);

      // Generate analysis
      try {
        const analysis = analyzePrediction(
          formattedPredictions,
          temperatureData,
          params,
          selectedData
        );
        if (analysis) {
          setPredictionAnalysis(analysis);
          setShowAnalysis(true);
        }
      } catch (analysisError) {
        console.error('Analysis generation error:', analysisError);
        // Continue without analysis if it fails
      }

    } catch (error) {
      console.error('Prediction error:', error);
      alert(`Prediction failed: ${error.message}`);
    } finally {
      setIsTraining(false);
      setTrainingProgress(null);
    }
  };

  const handleAskAI = () => {
    if (!predictionAnalysis) return;
    
    const message = formatForChatAssistant(
      predictionAnalysis,
      temperatureData,
      predictedData
    );
    
    // Copy to clipboard for now
    navigator.clipboard.writeText(message).then(() => {
      alert('Analysis copied to clipboard! You can paste it into the chat widget.');
    }).catch(() => {
      alert('Please copy this analysis and paste it into the chat:\n\n' + message.substring(0, 200) + '...');
    });
  };

  // Merge historical and predicted data for chart
  const chartData = temperatureData.map(d => ({
    ...d,
    historicalTemp: d.temperature,
    predictedTemp: null,
    confidenceLower: null,
    confidenceUpper: null
  }));

  // Add predicted data points
  if (predictedData.length > 0) {
    predictedData.forEach((pred, index) => {
      chartData.push({
        time: pred.time,
        timestamp: pred.timestamp,
        temperature: null,
        historicalTemp: null,
        predictedTemp: pred.temperature,
        confidenceLower: confidenceBands[index]?.lower || pred.temperature,
        confidenceUpper: confidenceBands[index]?.upper || pred.temperature,
        isPrediction: true
      });
    });
  }

  // Theme colors
  const theme = {
    background: isDarkMode ? '#1a1a1a' : '#f8f9fa',
    cardBackground: isDarkMode ? '#2d2d2d' : 'white',
    text: isDarkMode ? '#e0e0e0' : '#2c3e50',
    textSecondary: isDarkMode ? '#a0a0a0' : '#666',
    border: isDarkMode ? '#404040' : '#dee2e6',
    chartGrid: isDarkMode ? '#404040' : '#e0e0e0',
    chartText: isDarkMode ? '#a0a0a0' : '#666'
  };

  return (
    <div style={{ padding: '15px', backgroundColor: theme.background, minHeight: '100vh', fontFamily: 'Arial, sans-serif', transition: 'background-color 0.3s' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{
            textAlign: 'center',
            color: theme.text,
            margin: 0,
            fontSize: '2em',
            fontWeight: '300',
            flex: 1
          }}>
            Wood Stove Temperature Monitor
          </h1>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{
              padding: '8px 16px',
              backgroundColor: theme.cardBackground,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '20px',
              transition: 'all 0.3s'
            }}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Controls */}
        <div style={{
          backgroundColor: theme.cardBackground,
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px',
          boxShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '15px',
          alignItems: 'center',
          color: theme.text,
          transition: 'all 0.3s'
        }}>

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
            <span style={{ fontSize: '0.9em', color: theme.textSecondary }}>
              Last update: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            backgroundColor: isDarkMode ? '#4a2020' : '#f8d7da',
            color: isDarkMode ? '#ffb3b3' : '#721c24',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '20px',
            border: `1px solid ${isDarkMode ? '#6a3030' : '#f5c6cb'}`
          }}>
            ⚠️ Error loading real data: {error}
            <br />
            <small>Falling back to mock data. Check your InfluxDB configuration.</small>
          </div>
        )}

        {/* Prediction Panel */}
        <div style={{
          backgroundColor: theme.cardBackground,
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px',
          boxShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
          transition: 'all 0.3s'
        }}>
          <div 
            onClick={() => setIsPredictionPanelExpanded(!isPredictionPanelExpanded)}
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <h2 style={{ margin: 0, color: theme.text }}>🔮 ML Prediction</h2>
            <span style={{ fontSize: '24px', color: theme.text }}>
              {isPredictionPanelExpanded ? '▼' : '▶'}
            </span>
          </div>
          
          {isPredictionPanelExpanded && (
            <div style={{ marginTop: '15px' }}>
              <PredictionPanel
                onGeneratePrediction={handleGeneratePrediction}
                isTraining={isTraining}
                trainingProgress={trainingProgress}
                isPredictionMode={isPredictionMode}
                onTogglePredictionMode={handleTogglePredictionMode}
                hasSelection={selectedData !== null}
                theme={theme}
                isDarkMode={isDarkMode}
              />
            </div>
          )}
        </div>

        {/* Prediction Analysis */}
        {showAnalysis && predictionAnalysis && (
          <div style={{
            backgroundColor: theme.cardBackground,
            borderRadius: '8px',
            padding: '20px',
            boxShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '20px',
            transition: 'all 0.3s'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ margin: 0, color: theme.text }}>Prediction Analysis</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleAskAI}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Copy for AI Chat
                </button>
                <button
                  onClick={() => setShowAnalysis(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Hide
                </button>
              </div>
            </div>

            {/* Quick Summary */}
            {generateQuickSummary(predictionAnalysis) && (
              <div style={{
                padding: '15px',
                backgroundColor: isDarkMode ? '#1a3a4a' : '#e7f3ff',
                borderRadius: '4px',
                marginBottom: '15px',
                borderLeft: '4px solid #007bff',
                color: theme.text
              }}>
                <strong>Quick Summary:</strong> {generateQuickSummary(predictionAnalysis)}
              </div>
            )}

            {/* Detailed Metrics */}
            {predictionAnalysis.metrics && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                <div style={{ padding: '12px', backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa', borderRadius: '4px' }}>
                  <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '4px' }}>Peak Temperature</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fd7e14' }}>
                    {predictionAnalysis.metrics.predictedMax}°F
                  </div>
                </div>
                <div style={{ padding: '12px', backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa', borderRadius: '4px' }}>
                  <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '4px' }}>Average Temperature</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
                    {predictionAnalysis.metrics.predictedAvg}°F
                  </div>
                </div>
                <div style={{ padding: '12px', backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa', borderRadius: '4px' }}>
                  <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '4px' }}>Active Burn Time</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                    {predictionAnalysis.metrics.activeBurnHours}h
                  </div>
                </div>
                <div style={{ padding: '12px', backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa', borderRadius: '4px' }}>
                  <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '4px' }}>Reload In</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: predictionAnalysis.metrics.hoursUntilReload < 4 ? '#dc3545' : '#28a745' }}>
                    {predictionAnalysis.metrics.hoursUntilReload}h
                  </div>
                </div>
              </div>
            )}

            {/* Full Summary */}
            <details style={{ marginTop: '15px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', padding: '10px', backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa', borderRadius: '4px', color: theme.text }}>
                View Detailed Analysis
              </summary>
              <div style={{
                marginTop: '10px',
                padding: '15px',
                backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa',
                borderRadius: '4px',
                whiteSpace: 'pre-wrap',
                fontSize: '14px',
                lineHeight: '1.6',
                color: theme.text
              }}>
                {generatePredictionSummary(predictionAnalysis)}
              </div>
            </details>
          </div>
        )}

        {/* Temperature Chart */}
        <div style={{
          backgroundColor: theme.cardBackground,
          borderRadius: '8px',
          padding: '20px',
          boxShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px',
          transition: 'all 0.3s'
        }}>
          <h2 style={{ marginTop: 0, color: theme.text }}>
            Temperature Trend
            {isPredictionMode && (
              <span style={{ fontSize: '14px', color: '#28a745', marginLeft: '15px' }}>
                (Selection Mode: Drag to select historical pattern)
              </span>
            )}
          </h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart 
                data={chartData} 
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11, fill: theme.chartText }}
                  interval="preserveStartEnd"
                  stroke={theme.chartText}
                />
                <YAxis
                  label={{ value: '°F', angle: -90, position: 'insideLeft', fill: theme.chartText }}
                  domain={['dataMin - 10', 'dataMax + 10']}
                  tick={{ fontSize: 11, fill: theme.chartText }}
                  stroke={theme.chartText}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'Historical') return [`${value}°F`, 'Historical'];
                    if (name === 'Predicted') return [`${value}°F`, 'Predicted'];
                    if (name === 'Confidence Lower') return [`${value}°F`, 'Lower Bound'];
                    if (name === 'Confidence Upper') return [`${value}°F`, 'Upper Bound'];
                    return [`${value}°F`, 'Temperature'];
                  }}
                  labelFormatter={(label) => `Time: ${label}`}
                  contentStyle={{
                    backgroundColor: theme.cardBackground,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '4px',
                    color: theme.text
                  }}
                />
                <Legend />
                
                {/* Selection area */}
                {isPredictionMode && selectionStart && selectionEnd && (
                  <ReferenceArea
                    x1={temperatureData.find(d => d.timestamp === selectionStart)?.time}
                    x2={temperatureData.find(d => d.timestamp === selectionEnd)?.time}
                    strokeOpacity={0.3}
                    fill="#28a745"
                    fillOpacity={0.3}
                  />
                )}
                
                {/* Confidence bands */}
                {predictedData.length > 0 && (
                  <>
                    <Area
                      type="monotone"
                      dataKey="confidenceUpper"
                      stroke="none"
                      fill="#ffc107"
                      fillOpacity={0.2}
                      name="Confidence Band"
                    />
                    <Area
                      type="monotone"
                      dataKey="confidenceLower"
                      stroke="none"
                      fill="#ffc107"
                      fillOpacity={0.2}
                      name=""
                    />
                  </>
                )}
                
                {/* Historical temperature line */}
                <Line
                  type="monotone"
                  dataKey="historicalTemp"
                  stroke="#007bff"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, stroke: '#007bff', strokeWidth: 2 }}
                  animationDuration={1000}
                  animationEasing="ease-in-out"
                  name="Historical"
                  connectNulls={false}
                />
                
                {/* Predicted temperature line */}
                {predictedData.length > 0 && (
                  <Line
                    type="monotone"
                    dataKey="predictedTemp"
                    stroke="#dc3545"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={{ r: 5, stroke: '#dc3545', strokeWidth: 2 }}
                    name="Predicted"
                    connectNulls={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '50px', color: theme.textSecondary }}>
              {loading ? 'Loading temperature data...' : 'No data available'}
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div style={{
            backgroundColor: theme.cardBackground,
            padding: '20px',
            borderRadius: '8px',
            boxShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center',
            transition: 'all 0.3s'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: theme.text, fontSize: '1.1em' }}>Current</h3>
            <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#007bff' }}>
              {stats.current}°F
            </div>
          </div>

          <div style={{
            backgroundColor: theme.cardBackground,
            padding: '20px',
            borderRadius: '8px',
            boxShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center',
            transition: 'all 0.3s'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: theme.text, fontSize: '1.1em' }}>Peak</h3>
            <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#fd7e14' }}>
              {stats.peak}°F
            </div>
          </div>

          <div style={{
            backgroundColor: theme.cardBackground,
            padding: '20px',
            borderRadius: '8px',
            boxShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center',
            transition: 'all 0.3s'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: theme.text, fontSize: '1.1em' }}>Average</h3>
            <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#007bff' }}>
              {stats.average}°F
            </div>
          </div>

          <div style={{
            backgroundColor: theme.cardBackground,
            padding: '20px',
            borderRadius: '8px',
            boxShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center',
            transition: 'all 0.3s'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: theme.text, fontSize: '1.1em' }}>Data Points</h3>
            <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#28a745' }}>
              {stats.count}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '30px', color: theme.textSecondary, fontSize: '0.9em' }}>
          <p>Wood Stove Temperature Monitor | Deployed on GitHub Pages</p>
          <p>Data source: InfluxDB Cloud</p>
        </div>
      </div>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}

export default App;
