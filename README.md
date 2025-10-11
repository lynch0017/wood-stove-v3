# 🔥 Wood Stove Temperature Monitor

A lightweight, configurable React dashboard for monitoring wood stove temperature data. Deployed on GitHub Pages with direct InfluxDB integration and customizable polling intervals.

🌐 **Live Demo**: [https://lynch0017.github.io/wood-stove-v3/](https://lynch0017.github.io/wood-stove-v3/)

## ✨ Features

- **📊 Interactive Charts**: Beautiful temperature trend visualization using Recharts
- **🔄 Configurable Polling**: Choose polling intervals from 10 seconds to 10 minutes
- **🎛️ Real-time Controls**: Toggle between mock data and live InfluxDB data
- **📱 Responsive Design**: Works perfectly on desktop and mobile devices
- **⚡ GitHub Pages Ready**: Lightweight and optimized for static hosting
- **🔧 Easy Configuration**: Simple controls for data source and refresh settings

## 🚀 Quick Start

### Prerequisites
- Node.js and npm installed
- InfluxDB Cloud account (for real data)

### Installation & Development

1. **Clone and setup**:
```bash
git clone https://github.com/lynch0017/wood-stove-v3.git
cd wood-stove-v3
npm install
```

2. **Configure InfluxDB** (optional, for real data):
   - Copy `influxdb-config-example.js` to `influxdb-config.js`
   - Fill in your InfluxDB Cloud credentials

3. **Start development**:
```bash
npm run dev
```
Visit `http://localhost:5173`

### Deploy to GitHub Pages

```bash
# Build and deploy
npm run deploy
```

Your dashboard will be live at: `https://[username].github.io/wood-stove-v3/`

## 🎮 Dashboard Controls

### Data Source Toggle
- **Mock Data**: Uses simulated temperature data for testing
- **Real InfluxDB Data**: Connects directly to your InfluxDB Cloud instance

### Polling Configuration
- **Auto-refresh**: Enable/disable automatic data updates
- **Interval Options**: 10s, 30s, 1m, 5m, 10m
- **Manual Refresh**: Click refresh button anytime

### Statistics Display
- **Current**: Latest temperature reading
- **Peak**: Highest temperature in the dataset
- **Average**: Mean temperature across all data points
- **Data Points**: Total number of readings displayed

## 🏗️ Project Structure

```
├── src/
│   ├── App.jsx              # Main dashboard component
│   ├── influxService.js     # InfluxDB API client
│   ├── main.jsx            # React app entry point
│   └── index.css           # Global styles
├── public/
│   └── index.html          # HTML template
├── influxdb-config-example.js  # Configuration template
├── streamingtemp_influxdb.py   # Python data collector
├── vite.config.js          # Vite configuration
└── package.json            # Dependencies and scripts
```

## 🔧 InfluxDB Setup

### 1. Create InfluxDB Cloud Account
- Sign up at [InfluxDB Cloud](https://cloud2.influxdata.com/)
- Create a new bucket (e.g., `temperature_bucket`)
- Generate an API token with read/write permissions

### 2. Configure Dashboard
Create `influxdb-config.js`:
```javascript
export const INFLUXDB_CONFIG = {
  url: 'https://us-east-1-1.aws.cloud2.influxdata.com',
  token: 'your_api_token_here',
  org: 'your_org_name',
  bucket: 'temperature_bucket'
};
```

### 3. Data Structure
Your Python script should write data with:
- **Measurement**: `temperature_measurement`
- **Tag**: `location = "catalyst"`
- **Field**: `temperature` (in °F)

## 📊 Data Flow

```
Python Sensor → InfluxDB Cloud → React Dashboard
     ↑                ↑                ↑
 MAX31855      temperature_     Interactive charts
 Thermocouple  measurement      & statistics
```

## 🛠️ Development Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run deploy   # Deploy to GitHub Pages
```

## 🔒 Security Notes

- InfluxDB credentials are stored client-side (visible in browser)
- For production use, consider a proxy server or serverless functions
- The dashboard works with mock data by default for security

## 🎯 Use Cases

- **🏠 Home Monitoring**: Track wood stove temperature remotely
- **🔬 Research**: Monitor environmental conditions
- **📈 Analytics**: Analyze temperature patterns over time
- **🔔 Alerts**: Visual monitoring for safety thresholds

## 🤝 Integration Options

### Current Setup (Direct API)
- ✅ No server required
- ✅ GitHub Pages compatible
- ⚠️ Credentials visible in browser

### Future Enhancements
- [ ] Serverless API proxy
- [ ] Real-time WebSocket updates
- [ ] Alert notifications
- [ ] Historical data export
- [ ] Multiple sensor support

## 📝 License

ISC License - feel free to use and modify!

---

**Built with ❤️ using React, Recharts, and InfluxDB**
