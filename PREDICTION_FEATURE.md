# Burn Prediction Feature

## Overview

The Wood Stove Temperature Monitor now includes an experimental machine learning feature that predicts future burn patterns based on historical data. The prediction runs entirely in your browser using TensorFlow.js.

## How It Works

1. **Select Historical Pattern**: Choose a past burn cycle that's similar to what you're planning (e.g., overnight burn, daytime maintenance burn)
2. **Configure Conditions**: Input current outdoor temperature, how full you plan to load the firebox, and what wood species you're burning
3. **Generate Prediction**: The ML model trains on your selected data and predicts the next 4-12 hours of temperature

## Usage Instructions

### Step 1: Enable Selection Mode
- Click the "Enable Selection Mode" button in the Prediction Panel
- The button will turn green and say "Selection Mode Active"

### Step 2: Select Historical Data
- Click and drag on the temperature chart to select a time range
- You need at least 5 hours of data (recommended: 6-8 hours)
- The selected area will be highlighted in green
- Choose a pattern that matches your planned burn (e.g., if loading before bed, select a previous overnight burn)

### Step 3: Configure Parameters

**Outdoor Temperature**
- Click "Auto-Fetch" to get current weather via geolocation
- Or manually enter the temperature
- Colder outdoor temps typically mean faster heat loss

**Firebox Fill Level**
- Use the slider to indicate how full you plan to load (0-100%)
- 100% = packed full, 50% = half full, etc.
- Higher fill levels generally mean longer, hotter burns

**Wood Species Mix**
- Select up to 2 wood species and their percentages
- Default is 50% Sugar Maple / 50% Yellow Birch
- The system calculates BTU rating automatically
- Higher BTU woods (Oak, Hickory) burn hotter and longer

**Prediction Window**
- Choose how far ahead to predict (4-12 hours)
- Longer predictions are less accurate

### Step 4: Generate Prediction
- Click "Generate Prediction"
- The model will train for 10-30 seconds (progress bar shows status)
- Once complete, a red dashed line shows the predicted temperature curve
- Yellow shaded area shows confidence bands (uncertainty range)

## Understanding the Results

### Chart Elements
- **Blue solid line**: Historical temperature data
- **Red dashed line**: Predicted temperature
- **Yellow shaded area**: Confidence bands (±15% uncertainty)
- **Green highlight**: Your selected training data (when in selection mode)

### Training Progress
- Shows epoch count and loss metrics
- Lower loss = better model fit
- Training typically takes 20-50 epochs

### Prediction Accuracy
- **Experimental feature** - predictions may not be accurate
- Best for relative comparisons (e.g., "will this load last 8 hours?")
- Accuracy depends on:
  - Quality of selected historical data
  - Similarity between past and current conditions
  - Consistency of your burning technique

## Technical Details

### Model Architecture
- LSTM (Long Short-Term Memory) neural network
- 48 LSTM units + 24 dense units
- Inputs: temperature sequence + context (outdoor temp, fill level, wood BTU, time of day)
- Outputs: predicted temperature at 5-minute intervals

### Features Used
- Temperature history (normalized 0-1)
- Rate of change (temperature delta)
- Rolling average (15-minute window)
- Outdoor temperature (normalized)
- Firebox fill percentage
- Wood BTU rating (normalized)
- Hour of day (for circadian patterns)

### Training Process
- Uses selected historical data to create training sequences
- 50 epochs with 20% validation split
- Adam optimizer with learning rate 0.01
- Mean squared error loss function

## Tips for Best Results

1. **Select Similar Patterns**: Choose historical data that matches your planned burn
   - Overnight burn? Select a previous overnight burn
   - Quick hot fire? Select similar quick burns

2. **Use Recent Data**: Patterns from yesterday are more relevant than last week
   - Weather conditions change
   - Wood moisture content varies

3. **Account for Variables**: The model can't know everything
   - Draft settings
   - Wood moisture content
   - How tightly you pack the load
   - Wind conditions

4. **Experiment**: Try different selections and parameters
   - Compare predictions with actual results
   - Learn which historical patterns work best

5. **Use for Planning**: Best use cases
   - "Will this load last through the night?"
   - "When should I reload?"
   - "What's the difference between 75% vs 100% full?"

## Limitations

- **Not a guarantee**: Actual results will vary
- **Data dependent**: Needs good historical data
- **Context limited**: Can't account for all variables (draft, wood moisture, etc.)
- **Computational**: Training takes 10-30 seconds
- **Experimental**: This is a learning/fun feature, not a safety tool

## Troubleshooting

**"Please select at least 5 hours of data"**
- Your selection is too small
- Drag a longer range on the chart

**"Prediction failed: Not enough columns"**
- Historical data may be incomplete
- Try selecting a different time range

**Weather auto-fetch fails**
- Grant location permission in your browser
- Or manually enter outdoor temperature

**Prediction seems way off**
- Try selecting different historical data
- Verify your input parameters are correct
- Remember: this is experimental!

## Future Improvements

Potential enhancements:
- Save/load favorite wood mixes
- Compare multiple predictions side-by-side
- Track prediction accuracy over time
- Pre-trained models for common scenarios
- Mobile-optimized interface

## Privacy & Data

- All processing happens in your browser
- No data is sent to external servers (except weather API)
- Model is trained fresh each time (not saved)
- Weather data from Open-Meteo (free, no API key)

---

**Remember**: This is an experimental feature for fun and learning. Always monitor your stove and follow proper safety practices!

