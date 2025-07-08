# RowCast - Intelligent Rowing Weather Analytics

A modern, feature-rich weather analytics platform designed specifically for rowing conditions on the Schuylkill River. Built with a beautiful liquid glass UI inspired by iOS 26, this website provides comprehensive weather data, intelligent scoring, and advanced forecasting capabilities.

![RowCast Demo](screenshot.png)

## 🌟 Features

### 🏠 Home Page
- **Hero Section**: Beautiful animated gradient text and floating elements
- **Live Conditions**: Real-time RowCast score, temperature, wind speed, and river flow
- **Feature Overview**: Three key capabilities highlighted with icons
- **Call-to-Action**: Direct navigation to Dashboard and Weather pages

### 🌤️ Weather Page
- **Current Weather Widget**: Comprehensive current conditions display
- **12-Hour Forecast**: Visual timeline showing -3 to +9 hours from now
- **Weather Radar**: Embedded Windy.com radar for real-time precipitation
- **Wind Map**: Interactive wind speed and direction visualization
- **UV Index & Air Quality**: Health-related atmospheric conditions
- **Weather Advisories**: Real-time alerts and warnings

### 📊 Dashboard Page
- **Main RowCast Score**: Large prominent display with colored progress bar (1-10 scale)
- **Risk Factor Analysis**: Intelligent identification of conditions affecting score
- **Forecast Timeline**: Interactive timeline with multiple time ranges (Now, 12H, 24H, 7D)
- **Wind Direction Widget**: Visual representation of wind vs. river course (220°)
- **Current Conditions Summary**: Key metrics at a glance
- **Interactive Charts**: Score trends and weather condition charts

### 📡 API Documentation Page
- **Comprehensive Overview**: API statistics and capabilities
- **Key Endpoints**: Most important API calls with descriptions
- **Example Responses**: Real JSON response samples
- **Direct Link**: Full documentation access

## 🎨 Design Features

### Liquid Glass Aesthetic
- **Glassmorphism**: Frosted glass effects with backdrop blur
- **Gradient Backgrounds**: Animated gradient backgrounds
- **Smooth Animations**: Floating elements and smooth transitions
- **Dark Theme**: Elegant dark mode throughout

### Background System
- **Rotating Backgrounds**: Automatic cycling through asset images
- **Smooth Transitions**: Fade effects between background changes
- **Asset Integration**: Uses images from `/public/assets/images/`

### Responsive Design
- **Mobile-First**: Optimized for all screen sizes
- **Touch-Friendly**: Large interactive elements
- **Grid Layouts**: Adaptive widget grids
- **Navigation**: Collapsible mobile menu

## 🚀 Technology Stack

- **Frontend**: Vanilla JavaScript ES6+, TailwindCSS, HTML5
- **Charts**: Chart.js for interactive data visualization
- **Icons**: Font Awesome 6
- **Build Tool**: Vite for development and building
- **Backend API**: Python Flask/Gunicorn (existing)

## 📁 Project Structure

```
/
├── index.html              # Main application page
├── js/
│   └── app.js             # Main application JavaScript
├── public/
│   └── assets/
│       ├── images/        # Background rotation images
│       └── svg/
│           └── favicon.svg # Custom RowCast favicon
├── api/                   # Backend API (Python)
├── package.json           # Dependencies and scripts
├── vite.config.js         # Vite configuration
└── README.md             # This file
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- Python 3.8+ (for API)
- Redis (for API data caching)

### Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/swdrow/swdrow.github.io.git
cd swdrow.github.io
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the API server**
```bash
npm run api:prod  # or api:dev for development
```

4. **Start the development server**
```bash
npm run dev
```

5. **Access the application**
- Website: http://localhost:3000
- API: http://localhost:5000

### Production Build

```bash
npm run build     # Build for production
npm run preview   # Preview production build
```

## 📊 API Integration

The website connects to a comprehensive weather and water conditions API:

### Key Endpoints
- `/api/complete` - All current data and forecasts
- `/api/rowcast` - Current RowCast score
- `/api/rowcast/forecast` - 24-hour forecast
- `/api/weather/current` - Current weather conditions
- `/api/water/current` - Current water conditions

### Data Flow
1. **Initial Load**: Fetch complete data set
2. **Auto-refresh**: Update every 5 minutes
3. **Error Handling**: Graceful fallbacks and retry logic
4. **Real-time Updates**: Live score and condition updates

## 🎯 Key Features Explained

### RowCast Scoring Algorithm
- **Scale**: 1-10 (10 = perfect rowing conditions)
- **Factors**: Wind speed, temperature, water flow, UV index, precipitation
- **Real-time**: Updated every 5 minutes
- **Risk Analysis**: Automatic identification of poor conditions

### Weather Integration
- **Current Conditions**: Real-time weather data
- **Forecasting**: 12-hour, 24-hour, and 7-day forecasts
- **Alerts**: Weather advisories and warnings
- **Radar**: Live precipitation and wind mapping

### Wind Direction Analysis
- **Course Awareness**: Schuylkill River course heading (220°)
- **Relative Wind**: Visual representation of wind vs. course
- **Impact Assessment**: Headwind, tailwind, and crosswind analysis

### Time Range Navigation
- **Current**: Real-time conditions
- **12H/24H**: Short-term forecasting
- **7D**: Extended outlook
- **Interactive**: Easy switching between time ranges

## 🌐 Deployment

### Cloudflare Pages (Recommended)
1. Connect GitHub repository
2. Build command: `npm run build`
3. Output directory: `dist`
4. Environment: Node.js 18+

### GitHub Pages
1. Build locally: `npm run build`
2. Deploy `dist/` folder to gh-pages branch

### Custom Server
1. Build: `npm run build`
2. Serve `dist/` folder with any web server
3. Ensure API is accessible at `/api/*`

## 🔧 Configuration

### API Base URL
The application automatically detects the environment:
- **Development**: `http://localhost:5000/api`
- **Production**: `/api` (proxied through web server)

### Background Images
Add images to `/public/assets/images/` and they will automatically be included in the rotation.

### Styling
- Primary colors defined in Tailwind config
- Glass effects in custom CSS
- Responsive breakpoints follow Tailwind defaults

## 📱 Browser Support

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (with backdrop-filter)
- **Mobile**: Optimized for iOS and Android

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

**Sam Duncan**
- GitHub: [@swdrow](https://github.com/swdrow)
- Email: sam@samwduncan.com
- Website: [samwduncan.com](https://samwduncan.com)

## 🙏 Acknowledgments

- Weather data provided by OpenWeather API
- Water conditions from USGS/NOAA
- Icons by Font Awesome
- Charts by Chart.js
- Weather visualization by Windy.com

---

Built with ❤️ for the rowing community on the Schuylkill River
