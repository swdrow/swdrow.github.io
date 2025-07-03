# Sam Duncan - Professional Website & RowCast API

🚣‍♂️ **Professional portfolio website with integrated RowCast API for intelligent rowing condition analysis.**

## 🌟 Project Overview

This repository contains both the main professional website and the RowCast API backend, organized as a monorepo for easy development and deployment.

### 🏠 **Main Website** (Root Directory)
- **Professional Portfolio**: Showcasing skills, services, and projects
- **Contact Information**: Easy ways to get in touch
- **Weather Integration**: Current conditions and forecasts
- **Responsive Design**: Modern, mobile-friendly interface

### ⚙️ **RowCast API** (`/api/` Directory)
- **Intelligent Scoring**: 0-10 scale for rowing conditions
- **Real-time Data**: Weather, water, and NOAA integration
- **Interactive Dashboard**: Visual condition analysis
- **RESTful API**: Clean endpoints for external integration

## 🚀 Live URLs

- **Main Website**: https://swdrow.github.io
- **RowCast Dashboard**: https://api.samwduncan.com/dashboard
- **RowCast API**: https://api.samwduncan.com/api/*

## 📁 Repository Structure

```
swdrow.github.io/
├── index.html              # 🏠 Main homepage
├── contact.html             # 📞 Contact page
├── services.html            # 🛠️ Services page
├── Weather.html             # 🌤️ Weather page
├── css/                     # 🎨 Stylesheets
├── js/                      # ⚡ JavaScript
├── img/                     # 🖼️ Images
├── fontawesome/             # 🔤 Font icons
├── Data/                    # 📊 Data processing
├── Python/                  # 🐍 Python utilities
├── 
├── api/                     # ⚙️ RowCast API Backend
│   ├── app/                 # Flask application
│   │   ├── templates/       # Dashboard & API docs
│   │   ├── static/          # Dashboard assets
│   │   ├── routes.py        # API endpoints
│   │   ├── rowcast.py       # Scoring algorithm
│   │   └── ...              # Other backend files
│   ├── requirements.txt     # Python dependencies
│   ├── wsgi.py              # WSGI entry point
│   └── *.sh                 # Server scripts
├── 
├── docs/                    # 📚 Documentation
└── .vscode-workspace/       # 💻 Development config
```

## 🛠️ Development Setup

### Website Development (Frontend)
The main website files are in the root directory and work directly with Cloudflare Pages or GitHub Pages - no build process needed.

### API Development (Backend)
```bash
# Navigate to API directory
cd api/

# Set up Python environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start development server
./start_server.sh
```

### Development URLs
- **Website**: https://swdrow.github.io (live)
- **API Local**: http://localhost:8000 (development)
- **Dashboard Local**: http://localhost:8000/dashboard (development)

## 🔧 Technologies Used

### Frontend (Main Website)
- **HTML5/CSS3**: Modern web standards
- **Bootstrap**: Responsive framework
- **JavaScript/jQuery**: Interactive functionality
- **Font Awesome**: Beautiful icons

### Backend (RowCast API)
- **Python 3.9+**: Core language
- **Flask**: Web framework
- **NOAA APIs**: Weather and water data
- **Chart.js**: Data visualization

## 📊 RowCast Features

### Smart Scoring Algorithm
- **Wind Analysis**: Speed, gusts, and direction
- **Water Conditions**: Flow rate and temperature
- **Safety Factors**: Combined risk assessment
- **Real-time Updates**: Fresh data every 5 minutes

### Interactive Dashboard
- **Visual Charts**: Score trends and forecasts
- **Daily Navigation**: Quick day selection
- **Color-coded Alerts**: Safety warnings
- **Mobile Responsive**: Works on all devices

### Comprehensive API
- **Current Conditions**: `/api/complete`
- **24-hour Forecast**: `/api/rowcast/forecast`
- **Extended Forecast**: `/api/rowcast/forecast/extended`
- **NOAA Integration**: `/api/noaa/stageflow`

## 🚀 Deployment

### Main Website
Automatically deployed via Cloudflare Pages or GitHub Pages when pushed to the `main` branch.

### RowCast API
Deployed separately to `api.samwduncan.com` using the files in the `/api/` directory.

## 📝 Contact

- **Website**: [swdrow.github.io](https://swdrow.github.io)
- **Email**: Contact form on website
- **RowCast API**: [api.samwduncan.com](https://api.samwduncan.com)

---

**🌊 Building innovative solutions for web development and data analysis.**
