import React, { useState, useEffect } from 'react';
import { getCurrentOutdoorTemp, formatCacheAge, clearWeatherCache } from './weatherService';
import { getSpeciesList, calculateMixBTU, normalizeBTU, getDefaultMix } from './woodDatabase';

function PredictionPanel({ 
  onGeneratePrediction, 
  isTraining, 
  trainingProgress,
  isPredictionMode,
  onTogglePredictionMode,
  hasSelection,
  theme = { text: '#2c3e50', textSecondary: '#666', cardBackground: 'white', border: '#dee2e6' },
  isDarkMode = false
}) {
  const [outdoorTemp, setOutdoorTemp] = useState(32);
  const [outdoorTempManual, setOutdoorTempManual] = useState(false);
  const [fetchingWeather, setFetchingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState(null);
  const [weatherTimestamp, setWeatherTimestamp] = useState(null);
  
  const [fillLevel, setFillLevel] = useState(75);
  const [predictionHours, setPredictionHours] = useState(8);
  
  // Wood mix state
  const [species1, setSpecies1] = useState('Sugar Maple');
  const [percentage1, setPercentage1] = useState(50);
  const [species2, setSpecies2] = useState('Yellow Birch');
  const [percentage2, setPercentage2] = useState(50);
  
  const speciesList = getSpeciesList();

  // Auto-fetch weather on mount
  useEffect(() => {
    if (!outdoorTempManual) {
      fetchWeather();
    }
  }, []);

  const fetchWeather = async () => {
    setFetchingWeather(true);
    setWeatherError(null);
    
    try {
      const weather = await getCurrentOutdoorTemp();
      setOutdoorTemp(weather.temperature);
      setWeatherTimestamp(weather.timestamp);
      setOutdoorTempManual(false);
    } catch (error) {
      setWeatherError(error.message);
      console.error('Weather fetch error:', error);
    } finally {
      setFetchingWeather(false);
    }
  };

  const handleRefreshWeather = async () => {
    clearWeatherCache();
    await fetchWeather();
  };

  const handleGeneratePrediction = () => {
    const woodMix = [
      { species: species1, percentage: percentage1 },
      { species: species2, percentage: percentage2 }
    ];
    
    const mixBTU = calculateMixBTU(woodMix);
    const normalizedBTU = normalizeBTU(mixBTU);
    
    onGeneratePrediction({
      outdoorTemp,
      fillLevel,
      woodBTU: normalizedBTU,
      predictionHours
    });
  };

  // Auto-adjust percentages to maintain 100% total
  const handlePercentage1Change = (value) => {
    const val = Math.max(0, Math.min(100, value));
    setPercentage1(val);
    setPercentage2(100 - val);
  };

  const handlePercentage2Change = (value) => {
    const val = Math.max(0, Math.min(100, value));
    setPercentage2(val);
    setPercentage1(100 - val);
  };

  const mixBTU = calculateMixBTU([
    { species: species1, percentage: percentage1 },
    { species: species2, percentage: percentage2 }
  ]);

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px' 
      }}>
        <h2 style={{ margin: 0, color: theme.text }}>Burn Prediction</h2>
        <button
          onClick={onTogglePredictionMode}
          style={{
            padding: '8px 16px',
            backgroundColor: isPredictionMode ? '#28a745' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isPredictionMode ? 'Selection Mode Active' : 'Enable Selection Mode'}
        </button>
      </div>

      {!isPredictionMode && (
        <div style={{
          padding: '15px',
          backgroundColor: isDarkMode ? '#1a3a4a' : '#e7f3ff',
          borderRadius: '4px',
          marginBottom: '20px',
          border: `1px solid ${isDarkMode ? '#2a5a6a' : '#b3d9ff'}`,
          color: theme.text
        }}>
          Click "Enable Selection Mode" then drag on the chart to select a historical burn pattern for training.
        </div>
      )}

      {isPredictionMode && !hasSelection && (
        <div style={{
          padding: '15px',
          backgroundColor: isDarkMode ? '#4a3a1a' : '#fff3cd',
          borderRadius: '4px',
          marginBottom: '20px',
          border: `1px solid ${isDarkMode ? '#6a5a2a' : '#ffc107'}`,
          color: theme.text
        }}>
          Drag on the chart above to select a time range (at least 5 hours recommended).
        </div>
      )}

      {hasSelection && (
        <div style={{
          padding: '15px',
          backgroundColor: isDarkMode ? '#1a4a2a' : '#d4edda',
          borderRadius: '4px',
          marginBottom: '20px',
          border: `1px solid ${isDarkMode ? '#2a6a3a' : '#c3e6cb'}`,
          color: theme.text
        }}>
          Historical pattern selected! Configure parameters below and generate prediction.
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
      }}>
        {/* Outdoor Temperature */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: theme.text }}>
            Outdoor Temperature
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="number"
              value={outdoorTemp}
              onChange={(e) => {
                setOutdoorTemp(parseFloat(e.target.value) || 0);
                setOutdoorTempManual(true);
              }}
              style={{
                flex: 1,
                padding: '8px',
                border: `1px solid ${theme.border}`,
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: theme.cardBackground,
                color: theme.text
              }}
            />
            <span style={{ color: theme.textSecondary }}>°F</span>
          </div>
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
            <button
              onClick={handleRefreshWeather}
              disabled={fetchingWeather}
              style={{
                padding: '6px 12px',
                backgroundColor: fetchingWeather ? '#ccc' : '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: fetchingWeather ? 'not-allowed' : 'pointer',
                fontSize: '12px'
              }}
            >
              {fetchingWeather ? 'Fetching...' : 'Auto-Fetch'}
            </button>
            {weatherTimestamp && (
              <span style={{ fontSize: '11px', color: theme.textSecondary, alignSelf: 'center' }}>
                {formatCacheAge(weatherTimestamp)}
              </span>
            )}
          </div>
          {weatherError && (
            <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '4px' }}>
              {weatherError}
            </div>
          )}
        </div>

        {/* Firebox Fill Level */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: theme.text }}>
            Firebox Fill Level: {fillLevel}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={fillLevel}
            onChange={(e) => setFillLevel(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: theme.textSecondary }}>
            <span>Empty</span>
            <span>Half</span>
            <span>Full</span>
          </div>
        </div>

        {/* Prediction Window */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: theme.text }}>
            Prediction Window
          </label>
          <select
            value={predictionHours}
            onChange={(e) => setPredictionHours(parseInt(e.target.value))}
            style={{
              width: '100%',
              padding: '8px',
              border: `1px solid ${theme.border}`,
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: theme.cardBackground,
              color: theme.text
            }}
          >
            <option value={4}>4 hours</option>
            <option value={6}>6 hours</option>
            <option value={8}>8 hours</option>
            <option value={10}>10 hours</option>
            <option value={12}>12 hours</option>
          </select>
        </div>
      </div>

      {/* Wood Species Mix */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', color: theme.text, fontSize: '1.1em' }}>
          Wood Species Mix
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Species 1 */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: theme.text }}>
              Primary Species
            </label>
            <select
              value={species1}
              onChange={(e) => setSpecies1(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: `1px solid ${theme.border}`,
                borderRadius: '4px',
                fontSize: '14px',
                marginBottom: '8px',
                backgroundColor: theme.cardBackground,
                color: theme.text
              }}
            >
              {speciesList.map(species => (
                <option key={species} value={species}>{species}</option>
              ))}
            </select>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: theme.textSecondary }}>
                Percentage: {percentage1}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={percentage1}
                onChange={(e) => handlePercentage1Change(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Species 2 */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: theme.text }}>
              Secondary Species
            </label>
            <select
              value={species2}
              onChange={(e) => setSpecies2(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: `1px solid ${theme.border}`,
                borderRadius: '4px',
                fontSize: '14px',
                marginBottom: '8px',
                backgroundColor: theme.cardBackground,
                color: theme.text
              }}
            >
              {speciesList.map(species => (
                <option key={species} value={species}>{species}</option>
              ))}
            </select>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: theme.textSecondary }}>
                Percentage: {percentage2}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={percentage2}
                onChange={(e) => handlePercentage2Change(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>

        <div style={{ 
          marginTop: '12px', 
          padding: '10px', 
          backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa', 
          borderRadius: '4px',
          fontSize: '13px',
          color: theme.text
        }}>
          Mix BTU Rating: <strong>{mixBTU.toFixed(1)} MBTU/cord</strong>
        </div>
      </div>

      {/* Generate Button */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={handleGeneratePrediction}
          disabled={!hasSelection || isTraining}
          style={{
            padding: '12px 32px',
            backgroundColor: (!hasSelection || isTraining) ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: (!hasSelection || isTraining) ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {isTraining ? 'Training Model...' : 'Generate Prediction'}
        </button>
      </div>

      {/* Training Progress */}
      {isTraining && trainingProgress && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '13px',
            color: theme.textSecondary
          }}>
            <span>Training Progress</span>
            <span>Epoch {trainingProgress.epoch} / {trainingProgress.totalEpochs}</span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: isDarkMode ? '#404040' : '#e9ecef',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(trainingProgress.epoch / trainingProgress.totalEpochs) * 100}%`,
              height: '100%',
              backgroundColor: '#007bff',
              transition: 'width 0.3s ease'
            }} />
          </div>
          {trainingProgress.loss && (
            <div style={{ fontSize: '11px', color: theme.textSecondary, marginTop: '4px' }}>
              Loss: {trainingProgress.loss.toFixed(4)} | Val Loss: {trainingProgress.valLoss?.toFixed(4)}
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div style={{
        marginTop: '20px',
        padding: '12px',
        backgroundColor: isDarkMode ? '#4a3a1a' : '#fff3cd',
        borderRadius: '4px',
        border: `1px solid ${isDarkMode ? '#6a5a2a' : '#ffc107'}`,
        fontSize: '12px',
        color: isDarkMode ? '#ffcc80' : '#856404'
      }}>
        <strong>Experimental Feature:</strong> Predictions are based on machine learning and may not be accurate. 
        Use for entertainment and learning purposes only. Actual burn patterns depend on many factors.
      </div>
    </div>
  );
}

export default PredictionPanel;

