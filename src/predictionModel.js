// TensorFlow.js model for burn prediction
import * as tf from '@tensorflow/tfjs';

// Ensure TensorFlow.js is ready
let tfReady = false;
const ensureTFReady = async () => {
  if (!tfReady) {
    await tf.ready();
    tfReady = true;
  }
};

// Model configuration
const MODEL_CONFIG = {
  lstmUnits: 48,
  denseUnits: 24,
  learningRate: 0.01,
  epochs: 50,
  batchSize: 8,
  sequenceLength: 60, // Number of historical points to use (5 hours at 5min intervals)
  predictionLength: 96 // Number of points to predict (8 hours at 5min intervals)
};

// Feature engineering: calculate derived features from temperature sequence
export const engineerFeatures = (temperatures) => {
  if (!temperatures || temperatures.length === 0) return [];
  
  const features = [];
  
  for (let i = 0; i < temperatures.length; i++) {
    const temp = temperatures[i];
    
    // Rate of change (difference from previous point)
    const rateOfChange = i > 0 ? temp - temperatures[i - 1] : 0;
    
    // Rolling average (last 3 points = 15 minutes)
    const windowSize = Math.min(3, i + 1);
    const rollingAvg = temperatures.slice(Math.max(0, i - windowSize + 1), i + 1)
      .reduce((sum, t) => sum + t, 0) / windowSize;
    
    // Normalized temperature (0-1 scale, assuming 0-800°F range)
    const normalizedTemp = Math.max(0, Math.min(1, temp / 800));
    
    features.push({
      temperature: normalizedTemp,
      rateOfChange: rateOfChange / 100, // Normalize rate
      rollingAvg: Math.max(0, Math.min(1, rollingAvg / 800))
    });
  }
  
  return features;
};

// Prepare training data from selected historical sequence
export const prepareTrainingData = (selectedData) => {
  if (!selectedData || selectedData.length < MODEL_CONFIG.sequenceLength + 10) {
    throw new Error(`Need at least ${MODEL_CONFIG.sequenceLength + 10} data points for training`);
  }
  
  const temperatures = selectedData.map(d => d.temperature);
  const features = engineerFeatures(temperatures);
  
  // Create sequences for training
  const sequences = [];
  const targets = [];
  
  // Use sliding window to create training examples
  for (let i = 0; i < features.length - MODEL_CONFIG.sequenceLength - 1; i++) {
    const sequence = features.slice(i, i + MODEL_CONFIG.sequenceLength);
    const target = features[i + MODEL_CONFIG.sequenceLength].temperature;
    
    sequences.push(sequence.map(f => [f.temperature, f.rateOfChange, f.rollingAvg]));
    targets.push([target]);
  }
  
  return { sequences, targets };
};

// Create the LSTM model
export const createModel = (contextInputSize = 4) => {
  // Sequence input (temperature history)
  const sequenceInput = tf.input({ 
    shape: [MODEL_CONFIG.sequenceLength, 3], // 3 features per timestep
    name: 'sequence_input' 
  });
  
  // Context input (outdoor temp, fill level, wood BTU, hour of day)
  const contextInput = tf.input({ 
    shape: [contextInputSize], 
    name: 'context_input' 
  });
  
  // LSTM layer for sequence processing
  const lstm = tf.layers.lstm({ 
    units: MODEL_CONFIG.lstmUnits,
    returnSequences: false,
    name: 'lstm_layer'
  }).apply(sequenceInput);
  
  // Concatenate LSTM output with context
  const concat = tf.layers.concatenate({ name: 'concat_layer' })
    .apply([lstm, contextInput]);
  
  // Dense layers
  const dense1 = tf.layers.dense({ 
    units: MODEL_CONFIG.denseUnits, 
    activation: 'relu',
    name: 'dense_1'
  }).apply(concat);
  
  const dropout = tf.layers.dropout({ rate: 0.2, name: 'dropout' })
    .apply(dense1);
  
  const output = tf.layers.dense({ 
    units: 1, 
    activation: 'linear',
    name: 'output'
  }).apply(dropout);
  
  // Create and compile model
  const model = tf.model({ 
    inputs: [sequenceInput, contextInput], 
    outputs: output 
  });
  
  model.compile({
    optimizer: tf.train.adam(MODEL_CONFIG.learningRate),
    loss: 'meanSquaredError',
    metrics: ['mae']
  });
  
  return model;
};

// Train the model on selected data
export const trainModel = async (selectedData, onProgress = null) => {
  // Ensure TensorFlow.js is initialized
  await ensureTFReady();
  
  const { sequences, targets } = prepareTrainingData(selectedData);
  
  // Convert to tensors
  const sequenceTensor = tf.tensor3d(sequences);
  const targetTensor = tf.tensor2d(targets);
  
  // Create dummy context for training (we'll use real context during prediction)
  const contextTensor = tf.zeros([sequences.length, 4]);
  
  const model = createModel();
  
  // Train the model
  await model.fit(
    [sequenceTensor, contextTensor],
    targetTensor,
    {
      epochs: MODEL_CONFIG.epochs,
      batchSize: MODEL_CONFIG.batchSize,
      validationSplit: 0.2,
      shuffle: true,
      verbose: 0,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (onProgress) {
            onProgress({
              epoch: epoch + 1,
              totalEpochs: MODEL_CONFIG.epochs,
              loss: logs.loss,
              valLoss: logs.val_loss
            });
          }
        }
      }
    }
  );
  
  // Clean up tensors
  sequenceTensor.dispose();
  targetTensor.dispose();
  contextTensor.dispose();
  
  return model;
};

// Generate prediction for next N hours
export const generatePrediction = async (
  model,
  recentData,
  outdoorTemp,
  fillLevel,
  woodBTU,
  predictionHours = 8
) => {
  // Ensure TensorFlow.js is initialized
  await ensureTFReady();
  
  return tf.tidy(() => {
    // Get the most recent sequence
    const temperatures = recentData.slice(-MODEL_CONFIG.sequenceLength).map(d => d.temperature);
    
    if (temperatures.length < MODEL_CONFIG.sequenceLength) {
      throw new Error(`Need at least ${MODEL_CONFIG.sequenceLength} recent data points`);
    }
    
    const features = engineerFeatures(temperatures);
    let currentSequence = features.map(f => [f.temperature, f.rateOfChange, f.rollingAvg]);
    
    // Prepare context features
    const currentHour = new Date().getHours();
    const normalizedOutdoorTemp = Math.max(0, Math.min(1, (outdoorTemp + 20) / 120)); // Assume -20 to 100°F range
    const normalizedFillLevel = fillLevel / 100;
    const normalizedBTU = woodBTU; // Already normalized
    const normalizedHour = currentHour / 24;
    
    const contextFeatures = [normalizedOutdoorTemp, normalizedFillLevel, normalizedBTU, normalizedHour];
    
    // Generate predictions iteratively
    const predictions = [];
    const pointsToPredict = Math.floor((predictionHours * 60) / 5); // 5-minute intervals
    
    for (let i = 0; i < pointsToPredict; i++) {
      // Prepare input tensors
      const sequenceTensor = tf.tensor3d([currentSequence]);
      const contextTensor = tf.tensor2d([contextFeatures]);
      
      // Predict next point
      const prediction = model.predict([sequenceTensor, contextTensor]);
      const predictedValue = prediction.dataSync()[0];
      
      // Convert back to temperature (denormalize)
      const predictedTemp = predictedValue * 800;
      predictions.push(predictedTemp);
      
      // Update sequence for next prediction
      const newRateOfChange = i > 0 ? 
        (predictedValue - currentSequence[currentSequence.length - 1][0]) / 100 : 0;
      
      const newRollingAvg = currentSequence.slice(-2).concat([[predictedValue]])
        .reduce((sum, f) => sum + f[0], 0) / 3;
      
      currentSequence.push([predictedValue, newRateOfChange, newRollingAvg]);
      currentSequence.shift(); // Remove oldest point
      
      // Clean up tensors
      sequenceTensor.dispose();
      contextTensor.dispose();
      prediction.dispose();
    }
    
    return predictions;
  });
};

// Format predictions as chart data
export const formatPredictions = (predictions, startTime) => {
  const formattedData = [];
  const intervalMs = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  predictions.forEach((temp, index) => {
    const timestamp = startTime + (index * intervalMs);
    const date = new Date(timestamp);
    const timeString = date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    
    formattedData.push({
      time: timeString,
      temperature: Math.round(temp * 10) / 10,
      timestamp: timestamp,
      isPrediction: true
    });
  });
  
  return formattedData;
};

// Calculate confidence bands (simple approach: ±10% of predicted value)
export const calculateConfidenceBands = (predictions, confidenceLevel = 0.15) => {
  return predictions.map(temp => ({
    lower: Math.max(0, temp * (1 - confidenceLevel)),
    upper: temp * (1 + confidenceLevel)
  }));
};

// Dispose of model to free memory
export const disposeModel = (model) => {
  if (model) {
    model.dispose();
  }
};

