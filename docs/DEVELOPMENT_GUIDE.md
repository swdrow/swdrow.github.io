# Development Guide - Integrated Website & API

## 🏗️ Project Structure

This repository contains both the main website and the RowCast API as an integrated monorepo:

```
swdrow.github.io/
├── 🏠 Website Files (Root)       # Main website - served by Cloudflare/GitHub Pages
│   ├── index.html               # Homepage
│   ├── contact.html             # Contact page
│   ├── services.html            # Services page
│   ├── Weather.html             # Weather page
│   ├── css/                     # Stylesheets
│   ├── js/                      # JavaScript
│   └── img/                     # Images
├── 
├── ⚙️ api/                       # RowCast API Backend
│   ├── app/                     # Flask application
│   ├── requirements.txt         # Python dependencies
│   ├── wsgi.py                  # WSGI entry point
│   └── *.sh                     # Server management scripts
├── 
├── 📚 docs/                     # Documentation
├── .vscode-workspace/           # VS Code configuration
├── package.json                 # Project metadata
├── .gitignore                   # Git ignore rules
└── README.md                    # Project overview
```

## 🚀 Development Setup

### Website Development (Frontend)

The main website runs directly from the HTML/CSS/JS files in the root directory:

```bash
# Option 1: Use VS Code Live Server extension
# Right-click on index.html → "Open with Live Server"

# Option 2: Use VS Code task
# Ctrl+Shift+P → "Tasks: Run Task" → "🏠 Serve Website (Live Server)"

# Option 3: Manual live server
npm install -g live-server
live-server --port=3000
```

**Website Development URL**: http://localhost:3000

### API Development (Backend)

The RowCast API requires Python setup:

```bash
# Navigate to API directory
cd api/

# Set up Python virtual environment
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Start the API server
./start_server.sh
```

**API Development URLs**:
- API: http://localhost:8000/api/*
- Dashboard: http://localhost:8000/dashboard
- Documentation: http://localhost:8000/documentation

### Full Development Environment

Start both website and API together:

```bash
# Using VS Code tasks (recommended)
Ctrl+Shift+P → "Tasks: Run Task" → "🚀 Start Full Development Environment"

# Manual approach
# Terminal 1: Website
live-server --port=3000

# Terminal 2: API
cd api && ./start_server.sh
```

## 🛠️ Development Workflow

### Website Changes
1. Edit HTML/CSS/JS files in the root directory
2. Changes are immediately visible with live reload
3. Test responsive design and functionality
4. Commit and push - Cloudflare will auto-deploy

### API Changes
1. Edit Python files in `api/` directory
2. Restart the Flask server to see changes
3. Test endpoints using `api/test_api.py`
4. Deploy manually to production server

### VS Code Tasks Available

| Task | Description |
|------|-------------|
| 🏠 Serve Website | Start live server for main website |
| ⚙️ Start API Server | Start Flask development server |
| 🚀 Start Full Environment | Start both website and API |
| 🧪 Test API | Run API test suite |
| 📊 Open Dashboard | Open RowCast dashboard in browser |
| 📝 View Logs | Show API server logs |
| 🛑 Stop API Server | Stop the Flask server |

## 🌐 Deployment

### Website Deployment
- **Automatic**: Push to `main` branch → Cloudflare/GitHub Pages deploys automatically
- **No build process**: Static files served directly
- **URL**: https://swdrow.github.io

### API Deployment
- **Manual**: Copy `api/` directory contents to production server
- **Production URL**: https://api.samwduncan.com
- **Process**:
  1. Upload `api/` directory to server
  2. Install Python dependencies
  3. Configure WSGI server (Gunicorn, uWSGI)
  4. Set up reverse proxy (Nginx)

## 🔧 Configuration

### Environment Variables
Create `api/.env` file for local development:

```bash
# API Configuration
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-secret-key-here

# Data Sources
WEATHER_API_KEY=your-weather-api-key
USGS_API_URL=https://waterservices.usgs.gov
NOAA_API_URL=https://water.weather.gov
```

### Production Configuration
- Update `api/wsgi.py` for production WSGI server
- Configure proper logging in production
- Set up SSL certificates for HTTPS
- Configure CORS settings for cross-origin requests

## 📊 RowCast API Features

### Endpoints
- **Complete Data**: `/api/complete` - All current data and forecasts
- **Current Score**: `/api/rowcast` - Current rowing conditions score
- **24h Forecast**: `/api/rowcast/forecast` - Hourly forecast
- **Extended Forecast**: `/api/rowcast/forecast/extended` - 7-day forecast
- **NOAA Data**: `/api/noaa/stageflow` - River flow data

### Dashboard Features
- Real-time condition monitoring
- Interactive charts and graphs
- Daily forecast navigation
- Safety alerts and warnings
- Mobile-responsive design

## 🧪 Testing

### Website Testing
- Test in multiple browsers (Chrome, Firefox, Safari, Edge)
- Verify responsive design on different screen sizes
- Check all links and navigation
- Validate HTML/CSS

### API Testing
```bash
# Run API test suite
cd api && python test_api.py

# Test specific endpoints
curl http://localhost:8000/api/complete
curl http://localhost:8000/api/rowcast/forecast

# Load test dashboard
open http://localhost:8000/dashboard
```

## 🔍 Troubleshooting

### Common Issues

**Website not loading**:
- Check if live server is running on correct port
- Verify file paths in HTML files
- Check browser console for errors

**API server won't start**:
- Ensure Python virtual environment is activated
- Check if all dependencies are installed: `pip install -r requirements.txt`
- Verify port 8000 is not in use: `lsof -i :8000`

**API returns errors**:
- Check API logs: `cd api && ./view_logs.sh`
- Verify external API keys are set correctly
- Test network connectivity to data sources

**VS Code tasks not working**:
- Ensure you've opened the root directory in VS Code
- Check that shell scripts have execute permissions: `chmod +x api/*.sh`
- Verify task definitions in `.vscode-workspace/tasks.json`

## 🎨 Builder.io Fusion Integration

This repository is optimized for Builder.io Fusion visual editing:

1. **Install Extension**: VS Code will recommend Builder.io Fusion extension
2. **Start Development**: Use "🚀 Start Full Development Environment" task
3. **Visual Editing**: Edit website files visually at http://localhost:3000
4. **Live Updates**: Changes appear instantly with hot reload

## 📝 Best Practices

### Development
- Keep website files simple and clean (no complex build process)
- Use semantic HTML and modern CSS
- Test API changes thoroughly before deployment
- Document any configuration changes

### Git Workflow
- Use descriptive commit messages
- Test changes locally before pushing
- Keep website and API changes in separate commits when possible
- Use `.gitignore` to exclude logs and temporary files

### Performance
- Optimize images and assets for web
- Minimize HTTP requests
- Use browser caching appropriately
- Monitor API response times

---

**Happy coding! 🚀 This integrated setup gives you the best of both worlds: simple website development with powerful API capabilities.**
