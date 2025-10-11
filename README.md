# Wood Stove Temperature Monitor Dashboard

A React-based dashboard for monitoring wood stove temperature data using Recharts for beautiful data visualization.

## Features

- **Real-time Temperature Monitoring**: Interactive line chart showing temperature over time
- **Live Data Updates**: Simulated real-time data updates every 5 seconds
- **Statistics Dashboard**: Current, peak, and average temperature displays
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, professional interface with intuitive controls

## Technologies Used

- **React**: Frontend framework for building the user interface
- **Recharts**: Charting library for data visualization
- **Vite**: Fast build tool and development server
- **InfluxDB**: Backend database for storing temperature data (in your Python script)

## Getting Started

### Prerequisites

Make sure you have Node.js and npm installed:

```bash
npm --version
node --version
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/lynch0017/wood-stove-v3.git
cd wood-stove-v3
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── App.jsx          # Main React component with temperature dashboard
├── main.jsx         # React app entry point
└── index.css        # Global styles

public/
├── index.html       # HTML template

streamingtemp_influxdb.py  # Python script for temperature data collection
```

## Integration with Python Backend

This React dashboard works alongside your Python temperature monitoring script (`streamingtemp_influxdb.py`). The Python script collects data from the MAX31855 temperature sensor and stores it in InfluxDB.

To connect real data to this dashboard, you'll need to:

1. Modify the Python script to expose an API endpoint
2. Update the React app to fetch data from the API instead of using mock data
3. Consider using WebSocket or Server-Sent Events for real-time updates

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests (currently not configured)

## Future Enhancements

- [ ] Real-time data connection to InfluxDB
- [ ] Multiple sensor support
- [ ] Historical data analysis
- [ ] Alert system for temperature thresholds
- [ ] Export data to CSV/PDF
- [ ] Mobile app version

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the ISC License.
