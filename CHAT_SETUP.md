# Wood Stove Chat UI Setup

This guide will help you run the AI chat interface integrated with your wood stove temperature monitoring app.

## Architecture

- **Frontend**: React app (existing) with new ChatWidget component
- **Backend**: Flask API server that queries InfluxDB and communicates with OpenAI
- **Data Flow**: React → Flask API → InfluxDB + OpenAI → React

## Prerequisites

Make sure you have the following in your `.env` file:

```env
# InfluxDB Configuration
INFLUXDB_URL=your_influxdb_url
INFLUXDB_TOKEN=your_influxdb_token
INFLUXDB_ORG=your_org
INFLUXDB_BUCKET=your_bucket

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
```

## Installation

### 1. Install Python Dependencies

```bash
pip install flask-cors
```

Or install all dependencies from requirements.txt:

```bash
pip install -r requirements.txt
```

### 2. No Additional React Dependencies Needed

Your existing React setup already has everything needed!

## Running the Application

You need to run **TWO** servers simultaneously:

### Terminal 1: Flask Backend (API Server)

```bash
python stove_chat_app.py
```

This will start the Flask API server on `http://localhost:5000`

You should see output like:
```
 * Running on http://127.0.0.1:5000
```

### Terminal 2: React Frontend (Development Server)

```bash
npm run dev
```

This will start your Vite development server (usually on `http://localhost:5173`)

## Using the Chat Interface

1. Open your browser to the React app (usually `http://localhost:5173`)
2. You'll see your existing temperature monitoring dashboard
3. Look for the purple chat button (💬) in the bottom-right corner
4. Click it to open the chat interface
5. Try asking questions like:
   - "What is the current temperature?"
   - "Show me temperature stats for the last 24 hours"
   - "How hot has the stove been today?"
   - "What's the average temperature over the last 12 hours?"

## How It Works

1. **User asks a question** in the chat widget
2. **React app sends** the question to Flask backend at `localhost:5000/api/chat`
3. **Flask backend** uses OpenAI's function calling to determine what data is needed
4. **OpenAI decides** which function to call (current temp, history, or stats)
5. **Flask queries InfluxDB** to get the requested data
6. **OpenAI generates** a natural language response based on the data
7. **React displays** the response in the chat interface

## Troubleshooting

### "Failed to connect to chat service"
- Make sure Flask backend is running on port 5000
- Check that your `.env` file has the correct credentials
- Verify CORS is enabled in the Flask app

### "No recent data found"
- Check that your temperature sensor is running and logging data
- Verify InfluxDB connection settings in `.env`
- Try a longer time window (e.g., "last 48 hours")

### OpenAI API Errors
- Verify your `OPENAI_API_KEY` is set correctly in `.env`
- Check your OpenAI account has available credits
- Make sure you're using a model you have access to (gpt-4o)

## Deploying to Production

### Frontend (GitHub Pages)
Your React app can be deployed to GitHub Pages as usual:
```bash
npm run build
# Push to GitHub
```

### Backend (Flask API)
The Flask backend needs to be deployed separately to a service like:
- **Railway**: Easy Python deployment
- **Heroku**: Classic PaaS
- **Render**: Free tier available
- **DigitalOcean App Platform**: Simple deployment

Once deployed, update the fetch URL in `ChatWidget.jsx` from:
```javascript
fetch('http://localhost:5000/api/chat', ...)
```
to:
```javascript
fetch('https://your-backend-url.com/api/chat', ...)
```

## Files Created

- `stove_chat_app.py` - Flask backend API server
- `src/ChatWidget.jsx` - React chat component
- `src/App.jsx` - Updated to include ChatWidget
- `requirements.txt` - Python dependencies
- `CHAT_SETUP.md` - This file

## Features

- 💬 Natural language queries about your wood stove data
- 📊 Automatic function calling to query InfluxDB
- 🎨 Beautiful, modern chat interface
- 🔥 Context-aware responses about wood stove operation
- ⚡ Real-time data integration
- 📱 Responsive design

Enjoy chatting with your wood stove data!

