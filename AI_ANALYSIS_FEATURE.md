# AI Analysis Feature

## Overview

After generating a burn prediction, the system now automatically analyzes the results and provides human-readable insights. You can also send this analysis to the AI chat assistant for additional recommendations.

## What Gets Analyzed

The prediction analyzer examines:

### Key Metrics
- **Current Temperature**: Starting point for prediction
- **Peak Temperature**: Highest predicted temperature
- **Average Temperature**: Mean temperature over prediction window
- **End Temperature**: Temperature at end of prediction
- **Active Burn Time**: Hours above 400°F (active burning)
- **Coaling Time**: Hours between 200-400°F (coaling phase)
- **Time Until Reload**: When temperature drops below 300°F

### Burn Patterns
- **Rising Phase**: Temperature climbing (fresh load igniting)
- **Steady Burn**: Stable temperature (well-established burn)
- **Declining Phase**: Temperature falling (coaling down)
- **Pattern Similarity**: How closely prediction matches selected historical data

### Contextual Factors
- Outdoor temperature impact
- Firebox fill level effects
- Wood species BTU rating
- Time of day patterns

## How to Use

### 1. Generate Prediction
- Select historical data
- Configure parameters
- Click "Generate Prediction"

### 2. View Analysis
After prediction completes, an **Analysis Panel** appears automatically showing:

#### Quick Summary
A one-line overview like:
> "Predicted to burn for 6.5 hours, reaching 625°F before reload needed."

#### Key Metrics Cards
Visual cards showing:
- Peak Temperature (orange)
- Average Temperature (blue)
- Active Burn Time (green)
- Time Until Reload (red/green based on urgency)

#### Detailed Analysis (Expandable)
Click "View Detailed Analysis" to see:
- Current conditions summary
- Predicted trajectory description
- Burn phase breakdown
- Pattern match assessment
- Recommendations

### 3. Ask AI Assistant
Click the **"Ask AI Assistant"** button to:
- Automatically open the chat widget
- Send the full analysis to the AI
- Get additional insights and recommendations

The AI assistant will receive the complete analysis and can provide:
- Interpretation of the results
- Recommendations for optimization
- Comparisons to typical burn patterns
- Safety considerations
- Tips for achieving desired results

## Example Analysis Output

```
## Burn Prediction Analysis

**Current Conditions:**
- Current Temperature: 425°F
- Outdoor Temperature: 28°F
- Firebox Fill Level: 80%
- Prediction Window: 8 hours

**Predicted Trajectory:**
- 🔥 Rising Phase: Temperature expected to climb initially, reaching a peak of 650°F
- Temperature Range: 280°F - 650°F
- Average Temperature: 475°F
- End Temperature: 285°F

**Burn Phases:**
- Active Burn (>400°F): 5.5 hours
- Coaling Phase (200-400°F): 2.5 hours
- ⏰ Reload Recommended: In approximately 7.2 hours (when temp drops below 300°F)

**Pattern Match:**
- ✅ Prediction closely matches your selected historical pattern (8% difference)
- This suggests consistent burning conditions

**Recommendations:**
- 🟢 Current load should last comfortably
- ❄️ Cold outdoor temps may increase heat loss - monitor closely
```

## What the AI Can Tell You

When you click "Ask AI Assistant", the AI receives the full analysis and can help with:

### Interpretation
- "What does this pattern mean for my overnight burn?"
- "Is this a good result for my conditions?"
- "Why is the temperature predicted to drop so quickly?"

### Optimization
- "How can I extend the burn time?"
- "What would happen with a fuller load?"
- "Should I adjust my draft settings?"

### Comparisons
- "Is this typical for 28°F outdoor temps?"
- "How does this compare to optimal burns?"
- "What's different from my selected pattern?"

### Planning
- "When should I reload?"
- "Will this keep my house warm overnight?"
- "Should I use different wood species?"

## Understanding the Metrics

### Active Burn Time (>400°F)
- **High (6+ hours)**: Long, sustained burn - good for overnight
- **Medium (3-6 hours)**: Standard daytime burn
- **Low (<3 hours)**: Quick, hot fire or small load

### Time Until Reload
- **🟢 Green (>6 hours)**: Plenty of time, no rush
- **🟡 Yellow (4-6 hours)**: Plan reload in next few hours
- **🔴 Red (<4 hours)**: Reload soon to maintain heat

### Pattern Similarity
- **<15% difference**: Very similar - reliable prediction
- **15-30% difference**: Somewhat different - use caution
- **>30% difference**: Very different - prediction less reliable

## Tips for Better Analysis

1. **Select Similar Patterns**: Choose historical data that matches your current situation
2. **Consider All Factors**: Outdoor temp, fill level, and wood species all matter
3. **Use Recent Data**: Yesterday's burn is more relevant than last week's
4. **Experiment**: Try different parameters to see how they affect predictions
5. **Verify Results**: Compare predictions to actual outcomes over time

## Privacy & Data

- Analysis happens entirely in your browser
- No data sent to external servers (except when using AI chat)
- AI chat uses your configured backend (see `VITE_API_URL`)
- Analysis is regenerated fresh each time (not stored)

## Limitations

- Analysis is based on ML predictions (experimental)
- Cannot account for all variables (draft, wood moisture, etc.)
- Best used for relative comparisons, not absolute guarantees
- Recommendations are general guidelines, not specific to your stove

## Future Enhancements

Potential improvements:
- Historical accuracy tracking
- Comparison with actual results
- Learning from your feedback
- Personalized recommendations based on your stove
- Export analysis reports

---

**Remember**: This is an experimental feature for learning and planning. Always monitor your stove and follow proper safety practices!

