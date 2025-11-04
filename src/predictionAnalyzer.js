// Prediction analysis and interpretation utilities

// Analyze prediction results and generate human-readable insights
export const analyzePrediction = (
  predictedData,
  historicalData,
  params,
  selectedData
) => {
  if (!predictedData || predictedData.length === 0) {
    return null;
  }

  if (!historicalData || historicalData.length === 0) {
    return null;
  }

  if (!selectedData || selectedData.length === 0) {
    return null;
  }

  const predictions = predictedData.map(d => d.temperature).filter(t => t != null);
  const historical = historicalData.map(d => d.temperature).filter(t => t != null);
  const selected = selectedData.map(d => d.temperature).filter(t => t != null);

  if (predictions.length === 0 || historical.length === 0 || selected.length === 0) {
    return null;
  }

  // Calculate key metrics
  const currentTemp = historical[historical.length - 1];
  const predictedMax = Math.max(...predictions);
  const predictedMin = Math.min(...predictions);
  const predictedAvg = predictions.reduce((a, b) => a + b, 0) / predictions.length;
  const predictedEnd = predictions[predictions.length - 1];
  
  const selectedMax = Math.max(...selected);
  const selectedAvg = selected.reduce((a, b) => a + b, 0) / selected.length;

  // Determine burn phase and trajectory
  const initialTrend = predictions.slice(0, 12).reduce((a, b) => a + b, 0) / 12; // First hour
  const midTrend = predictions.slice(12, 48).reduce((a, b) => a + b, 0) / 36; // Hours 2-4
  const lateTrend = predictions.slice(48).reduce((a, b) => a + b, 0) / (predictions.length - 48); // Rest

  // Analyze pattern
  const isRising = initialTrend > currentTemp * 1.05;
  const isSteady = Math.abs(predictedMax - predictedMin) < 50;
  const isFalling = lateTrend < currentTemp * 0.8;
  const hasReload = predictions.some((temp, i) => i > 0 && temp > predictions[i - 1] + 50);

  // Calculate burn duration (time above 400°F, typical active burn threshold)
  const activeBurnThreshold = 400;
  const activeBurnHours = predictions.filter(t => t > activeBurnThreshold).length * 5 / 60;
  
  // Calculate coaling phase (below 400°F but above 200°F)
  const coalingThreshold = 200;
  const coalingHours = predictions.filter(t => t <= activeBurnThreshold && t > coalingThreshold).length * 5 / 60;

  // Time until reload needed (when temp drops below 300°F)
  const reloadThreshold = 300;
  const reloadIndex = predictions.findIndex(t => t < reloadThreshold);
  const hoursUntilReload = reloadIndex > 0 ? (reloadIndex * 5 / 60) : params.predictionHours;

  // Compare to selected pattern
  const patternSimilarity = Math.abs(predictedAvg - selectedAvg) / selectedAvg;
  const isSimilarPattern = patternSimilarity < 0.15; // Within 15%

  return {
    metrics: {
      currentTemp: Math.round(currentTemp),
      predictedMax: Math.round(predictedMax),
      predictedMin: Math.round(predictedMin),
      predictedAvg: Math.round(predictedAvg),
      predictedEnd: Math.round(predictedEnd),
      activeBurnHours: Math.round(activeBurnHours * 10) / 10,
      coalingHours: Math.round(coalingHours * 10) / 10,
      hoursUntilReload: Math.round(hoursUntilReload * 10) / 10
    },
    analysis: {
      isRising,
      isSteady,
      isFalling,
      hasReload,
      isSimilarPattern,
      patternSimilarity: Math.round(patternSimilarity * 100)
    },
    params
  };
};

// Generate a natural language summary of the prediction
export const generatePredictionSummary = (analysis) => {
  if (!analysis) return '';
  if (!analysis.metrics || !analysis.analysis || !analysis.params) return '';

  const { metrics, analysis: patterns, params } = analysis;
  
  let summary = `## Burn Prediction Analysis\n\n`;
  
  // Current state
  summary += `**Current Conditions:**\n`;
  summary += `- Current Temperature: ${metrics.currentTemp}°F\n`;
  summary += `- Outdoor Temperature: ${params.outdoorTemp}°F\n`;
  summary += `- Firebox Fill Level: ${params.fillLevel}%\n`;
  summary += `- Prediction Window: ${params.predictionHours} hours\n\n`;

  // Predicted trajectory
  summary += `**Predicted Trajectory:**\n`;
  
  if (patterns.isRising) {
    summary += `- 🔥 **Rising Phase**: Temperature expected to climb initially, reaching a peak of ${metrics.predictedMax}°F\n`;
  } else if (patterns.isSteady) {
    summary += `- 🔄 **Steady Burn**: Temperature should remain relatively stable around ${metrics.predictedAvg}°F\n`;
  } else if (patterns.isFalling) {
    summary += `- 📉 **Declining Phase**: Temperature expected to gradually decrease\n`;
  }

  summary += `- Temperature Range: ${metrics.predictedMin}°F - ${metrics.predictedMax}°F\n`;
  summary += `- Average Temperature: ${metrics.predictedAvg}°F\n`;
  summary += `- End Temperature: ${metrics.predictedEnd}°F\n\n`;

  // Burn phases
  summary += `**Burn Phases:**\n`;
  summary += `- Active Burn (>400°F): ${metrics.activeBurnHours} hours\n`;
  summary += `- Coaling Phase (200-400°F): ${metrics.coalingHours} hours\n`;
  
  if (metrics.hoursUntilReload < params.predictionHours) {
    summary += `- ⏰ **Reload Recommended**: In approximately ${metrics.hoursUntilReload} hours (when temp drops below 300°F)\n\n`;
  } else {
    summary += `- ✅ **No Reload Needed**: Should maintain temperature throughout the ${params.predictionHours}-hour window\n\n`;
  }

  // Pattern comparison
  if (patterns.isSimilarPattern) {
    summary += `**Pattern Match:**\n`;
    summary += `- ✅ Prediction closely matches your selected historical pattern (${patterns.patternSimilarity}% difference)\n`;
    summary += `- This suggests consistent burning conditions\n\n`;
  } else {
    summary += `**Pattern Match:**\n`;
    summary += `- ⚠️ Prediction differs from selected pattern by ${patterns.patternSimilarity}%\n`;
    summary += `- This could be due to different outdoor temps, fill levels, or wood species\n\n`;
  }

  // Recommendations
  summary += `**Recommendations:**\n`;
  
  if (metrics.hoursUntilReload < 2) {
    summary += `- 🔴 Consider reloading soon to maintain heat\n`;
  } else if (metrics.hoursUntilReload < 4) {
    summary += `- 🟡 Plan to reload in the next few hours\n`;
  } else {
    summary += `- 🟢 Current load should last comfortably\n`;
  }

  if (params.outdoorTemp < 20) {
    summary += `- ❄️ Cold outdoor temps may increase heat loss - monitor closely\n`;
  }

  if (params.fillLevel < 50) {
    summary += `- 📦 Partial load will burn faster - consider fuller loads for longer burns\n`;
  }

  summary += `\n**Note:** This is an experimental ML prediction. Actual results may vary based on draft settings, wood moisture, and other factors.`;

  return summary;
};

// Generate a concise one-line summary
export const generateQuickSummary = (analysis) => {
  if (!analysis) return '';
  if (!analysis.metrics || !analysis.params) return '';

  const { metrics, params } = analysis;
  
  if (metrics.hoursUntilReload < params.predictionHours) {
    return `Predicted to burn for ${metrics.hoursUntilReload} hours, reaching ${metrics.predictedMax}°F before reload needed.`;
  } else {
    return `Predicted to maintain ${metrics.predictedAvg}°F average over ${params.predictionHours} hours, no reload needed.`;
  }
};

// Format analysis for chat assistant
export const formatForChatAssistant = (analysis, historicalData, predictedData) => {
  const summary = generatePredictionSummary(analysis);
  
  const contextMessage = `I just generated a burn prediction using machine learning. Here are the results:\n\n${summary}\n\nCan you provide additional insights or recommendations based on this prediction?`;
  
  return contextMessage;
};

