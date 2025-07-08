# app/routes.py

from flask import Blueprint, jsonify, request, render_template, redirect, send_from_directory
import json
import os
from datetime import datetime, timedelta
import pytz
import logging
# Import the redis_client instance from the extensions file
from app.extensions import redis_client
from app.rowcast import compute_rowcast, merge_params

# EST timezone
EST = pytz.timezone('America/New_York')

bp = Blueprint("api", __name__)

@bp.after_request
def after_request(response):
    """Add CORS headers to all responses"""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response



def get_data_from_redis(key):
    """Helper function to get and decode data from Redis."""
    data_str = redis_client.get(key)
    if data_str:
        return json.loads(data_str)
    return None

def find_forecast_by_time(forecast_data, target_time):
    """Helper function to find forecast data for a specific time."""
    if not forecast_data:
        return None
    
    target_dt = datetime.fromisoformat(target_time.replace('Z', '+00:00'))
    
    closest_forecast = None
    min_diff = float('inf')
    
    for forecast in forecast_data:
        forecast_dt = datetime.fromisoformat(forecast['timestamp'].replace('Z', '+00:00'))
        diff = abs((target_dt - forecast_dt).total_seconds())
        if diff < min_diff:
            min_diff = diff
            closest_forecast = forecast
    
    return closest_forecast

@bp.route("/api/weather")
def weather():
    data = get_data_from_redis('weather_data')
    if data:
        return jsonify(data)
    return jsonify({"error": "Weather data not available yet."}), 404

@bp.route("/api/weather/current")
def current_weather():
    data = get_data_from_redis('weather_data')
    if data and 'current' in data:
        return jsonify(data['current'])
    return jsonify({"error": "Current weather data not available yet."}), 404

@bp.route("/api/weather/forecast")
def weather_forecast():
    data = get_data_from_redis('weather_data')
    if data and 'forecast' in data:
        return jsonify(data['forecast'])
    return jsonify({"error": "Weather forecast data not available yet."}), 404

@bp.route("/api/water")
def water():
    data = get_data_from_redis('water_data')
    if data:
        return jsonify(data)
    return jsonify({"error": "Water data not available yet."}), 404

@bp.route("/api/water/current")
def current_water():
    data = get_data_from_redis('water_data')
    if data and 'current' in data:
        return jsonify(data['current'])
    return jsonify({"error": "Current water data not available yet."}), 404

@bp.route("/api/water/predictions")
def water_predictions():
    data = get_data_from_redis('water_data')
    if data and 'predictions' in data:
        return jsonify(data['predictions'])
    return jsonify({"error": "Water prediction data not available yet."}), 404

@bp.route("/api/rowcast")
def rowcast():
    # Always fetch the latest data from Redis
    weather_data = get_data_from_redis('weather_data')
    water_data = get_data_from_redis('water_data')
    
    if not weather_data or not water_data:
        return jsonify({"error": "Data not available yet, please try again shortly."}), 404

    # Use current data for current rowcast score
    current_weather = weather_data.get('current', {})
    current_water = water_data.get('current', {})
    # Defensive: if current_weather or current_water is empty, force a fresh fetch (if possible)
    if not current_weather or not current_water:
        return jsonify({"error": "Current weather or water data not available yet. Please try again shortly."}), 404
    
    params = merge_params(current_weather, current_water)
    result = compute_rowcast(params)
    return jsonify({ "rowcastScore": result['score'], "factors": result['factors'], "params": params })

@bp.route("/api/rowcast/forecast")
def rowcast_forecast():
    forecast_scores = get_data_from_redis('forecast_scores')
    if forecast_scores:
        return jsonify(forecast_scores)
    return jsonify({"error": "Forecast scores not available yet."}), 404

@bp.route("/api/rowcast/forecast/simple")
def rowcast_forecast_simple():
    """Get simplified rowcast forecast with just timestamps and scores"""
    simple_scores = get_data_from_redis('forecast_scores_simple')
    if simple_scores:
        return jsonify(simple_scores)
    return jsonify({"error": "Simple forecast scores not available yet."}), 404

@bp.route("/api/rowcast/forecast/<time_offset>")
def rowcast_forecast_offset(time_offset):
    """Get rowcast score for a specific time offset (e.g., '2h', '30m', '1d')"""
    try:
        # Parse time offset using EST timezone
        now_est = datetime.now(EST)
        if time_offset.endswith('h'):
            hours = int(time_offset[:-1])
            target_time = now_est + timedelta(hours=hours)
        elif time_offset.endswith('m'):
            minutes = int(time_offset[:-1])
            target_time = now_est + timedelta(minutes=minutes)
        elif time_offset.endswith('d'):
            days = int(time_offset[:-1])
            target_time = now_est + timedelta(days=days)
        else:
            return jsonify({"error": "Invalid time format. Use format like '2h', '30m', '1d'"}), 400
        
        forecast_scores = get_data_from_redis('forecast_scores')
        if not forecast_scores:
            return jsonify({"error": "Forecast scores not available yet."}), 404
        
        # Find closest forecast to target time
        closest_forecast = find_forecast_by_time(forecast_scores, target_time.isoformat())
        
        if closest_forecast:
            return jsonify(closest_forecast)
        else:
            return jsonify({"error": "No forecast data available for requested time"}), 404
            
    except ValueError:
        return jsonify({"error": "Invalid time format. Use format like '2h', '30m', '1d'"}), 400

@bp.route("/api/rowcast/at/<timestamp>")
def rowcast_at_time(timestamp):
    """Get rowcast score for a specific timestamp"""
    try:
        forecast_scores = get_data_from_redis('forecast_scores')
        if not forecast_scores:
            return jsonify({"error": "Forecast scores not available yet."}), 404
        
        # Find closest forecast to specified timestamp
        closest_forecast = find_forecast_by_time(forecast_scores, timestamp)
        
        if closest_forecast:
            return jsonify(closest_forecast)
        else:
            return jsonify({"error": "No forecast data available for requested time"}), 404
            
    except Exception as e:
        return jsonify({"error": f"Invalid timestamp format: {str(e)}"}), 400

@bp.route("/api/complete")
def complete_data():
    """Get all current data, forecasts, and scores in one response"""
    weather_data = get_data_from_redis('weather_data')
    water_data = get_data_from_redis('water_data')
    forecast_scores = get_data_from_redis('forecast_scores')
    
    # Calculate current rowcast score
    current_rowcast = None
    if weather_data and water_data:
        current_weather = weather_data.get('current', {})
        current_water = water_data.get('current', {})
        params = merge_params(current_weather, current_water)
        current_rowcast = compute_rowcast(params)
    
    response = {
        "current": {
            "weather": weather_data.get('current') if weather_data else None,
            "water": water_data.get('current') if water_data else None,
            "rowcast": current_rowcast
        },
        "forecast": {
            "weather": weather_data.get('forecast') if weather_data else None,
            "water": water_data.get('predictions') if water_data else None,
            "rowcastScores": forecast_scores
        },
        "lastUpdated": datetime.now().isoformat()
    }
    
    return jsonify(response)

@bp.route("/api/rowcast/forecast/short-term")
def rowcast_short_term_forecast():
    """Get 15-minute interval rowcast forecast for the next 3 hours"""
    short_term_scores = get_data_from_redis('short_term_forecast')
    if short_term_scores:
        return jsonify(short_term_scores)
    return jsonify({"error": "Short-term forecast scores not available yet."}), 404

@bp.route("/api/rowcast/forecast/short-term/simple")
def rowcast_short_term_forecast_simple():
    """Get simplified 15-minute interval rowcast forecast with just timestamps and scores"""
    simple_short_term = get_data_from_redis('short_term_forecast_simple')
    if simple_short_term:
        return jsonify(simple_short_term)
    return jsonify({"error": "Simple short-term forecast scores not available yet."}), 404

@bp.route("/api/noaa/stageflow")
def noaa_stageflow():
    """Returns NOAA NWPS stageflow forecast data."""
    data = get_data_from_redis('noaa_stageflow_data')
    if data:
        return jsonify(data)
    return jsonify({"error": "NOAA stageflow data not available yet."}), 404

@bp.route("/api/noaa/stageflow/current")
def noaa_stageflow_current():
    """Returns current observed NOAA stageflow data."""
    data = get_data_from_redis('noaa_stageflow_data')
    if data and data.get('current'):
        return jsonify(data['current'])
    return jsonify({"error": "Current NOAA stageflow data not available yet."}), 404

@bp.route("/api/noaa/stageflow/forecast")
def noaa_stageflow_forecast():
    """Returns NOAA stageflow forecast data only."""
    data = get_data_from_redis('noaa_stageflow_data')
    if data and data.get('forecast'):
        return jsonify(data['forecast'])
    return jsonify({"error": "NOAA stageflow forecast data not available yet."}), 404

@bp.route("/api/weather/extended")
def weather_extended():
    """Returns extended weather forecast data (7 days)."""
    data = get_data_from_redis('extended_weather_data')
    if data:
        return jsonify(data)
    return jsonify({"error": "Extended weather data not available yet."}), 404

@bp.route("/api/rowcast/forecast/extended")
def rowcast_forecast_extended():
    """Returns extended RowCast forecast scores (up to 7 days) using NOAA stageflow data."""
    data = get_data_from_redis('extended_forecast_scores')
    if data:
        return jsonify(data)
    return jsonify({"error": "Extended forecast scores not available yet."}), 404

@bp.route("/api/rowcast/forecast/extended/simple")
def rowcast_forecast_extended_simple():
    """Returns simplified extended RowCast forecast scores (timestamp and score only)."""
    data = get_data_from_redis('extended_forecast_scores_simple')
    if data:
        return jsonify(data)
    return jsonify({"error": "Extended forecast scores not available yet."}), 404

@bp.route("/api/complete/extended")
def complete_extended():
    """Returns all data including extended forecasts for comprehensive dashboard."""
    try:
        logging.info("Attempting to fetch complete extended data.")
        # Get all data sources
        weather_data = get_data_from_redis('weather_data')
        logging.info(f"Weather data fetched: {'found' if weather_data else 'not found'}")
        
        extended_weather_data = get_data_from_redis('extended_weather_data')
        logging.info(f"Extended weather data fetched: {'found' if extended_weather_data else 'not found'}")
        
        water_data = get_data_from_redis('water_data')
        logging.info(f"Water data fetched: {'found' if water_data else 'not found'}")
        
        noaa_stageflow_data = get_data_from_redis('noaa_stageflow_data')
        logging.info(f"NOAA stageflow data fetched: {'found' if noaa_stageflow_data else 'not found'}")
        
        forecast_scores = get_data_from_redis('forecast_scores')
        logging.info(f"Forecast scores fetched: {'found' if forecast_scores else 'not found'}")
        
        extended_forecast_scores = get_data_from_redis('extended_forecast_scores')
        logging.info(f"Extended forecast scores fetched: {'found' if extended_forecast_scores else 'not found'}")
        
        short_term_forecast = get_data_from_redis('short_term_forecast')
        logging.info(f"Short term forecast fetched: {'found' if short_term_forecast else 'not found'}")
        
        response = {
            'weather': {
                'current': weather_data.get('current') if weather_data else None,
                'forecast': weather_data.get('forecast') if weather_data else [],
                'extended': extended_weather_data.get('forecast') if extended_weather_data else [],
                'alerts': weather_data.get('alerts') if weather_data else []
            },
            'water': {
                'current': water_data.get('current') if water_data else None,
                'historical': water_data.get('historical') if water_data else {}
            },
            'noaa': {
                'current': noaa_stageflow_data.get('current') if noaa_stageflow_data else None,
                'observed': noaa_stageflow_data.get('observed') if noaa_stageflow_data else [],
                'forecast': noaa_stageflow_data.get('forecast') if noaa_stageflow_data else [],
                'metadata': noaa_stageflow_data.get('metadata') if noaa_stageflow_data else {}
            },
            'rowcast': {
                'current': None,
                'forecast': forecast_scores or [],
                'extendedForecast': extended_forecast_scores or [],
                'shortTerm': short_term_forecast or []
            },
            'metadata': {
                'lastUpdated': datetime.now(EST).isoformat(),
                'timezone': 'America/New_York',
                'dataAvailability': {
                    'weather': weather_data is not None,
                    'extendedWeather': extended_weather_data is not None,
                    'water': water_data is not None,
                    'noaaStageflow': noaa_stageflow_data is not None,
                    'forecast': forecast_scores is not None,
                    'extendedForecast': extended_forecast_scores is not None,
                    'shortTermForecast': short_term_forecast is not None
                }
            }
        }
        
        # Calculate current rowcast if we have current data
        if weather_data and weather_data.get('current'):
            logging.info("Calculating current rowcast.")
            current_water = water_data.get('current') if water_data else {}
            noaa_current = noaa_stageflow_data.get('current') if noaa_stageflow_data else {}
            
            # Use NOAA data if available, otherwise use current water data
            current_params = {
                'windSpeed': weather_data['current'].get('windSpeed'),
                'windGust': weather_data['current'].get('windGust'),
                'apparentTemp': weather_data['current'].get('apparentTemp'),
                'uvIndex': weather_data['current'].get('uvIndex'),
                'precipitation': weather_data['current'].get('precipitation'),
                'discharge': noaa_current.get('discharge') or current_water.get('discharge'),
                'waterTemp': current_water.get('waterTemp'),  # NOAA doesn't provide water temp
                'gaugeHeight': noaa_current.get('gaugeHeight') or current_water.get('gaugeHeight'),
                'weatherAlerts': weather_data['current'].get('weatherAlerts', []),
                'visibility': weather_data['current'].get('visibility'),
                'lightningPotential': 0,  # Not available in current weather
                'precipitationProbability': 0  # Not available in current weather
            }
            
            current_rowcast = compute_rowcast(current_params)
            response['rowcast']['current'] = {
                'score': current_rowcast['score'],
                'factors': current_rowcast['factors'],
                'conditions': current_params,
                'timestamp': weather_data['current'].get('timestamp'),
                'noaaDataUsed': noaa_current.get('discharge') is not None or noaa_current.get('gaugeHeight') is not None
            }
            logging.info("Current rowcast calculated successfully.")
        else:
            logging.warning("Could not calculate current rowcast due to missing current weather data.")
        
        logging.info("Successfully compiled extended data response.")
        return jsonify(response)
        
    except Exception as e:
        logging.error(f"Error in /api/complete/extended: {str(e)}", exc_info=True)
        return jsonify({"error": f"Failed to compile extended data: {str(e)}"}), 500

@bp.route("/api")
@bp.route("/docs")
def api_documentation():
    """API Documentation - Shows all available endpoints and usage"""
    docs = {
        "title": "RowCast API Documentation",
        "description": "API for rowing condition scores based on weather, water conditions, and safety factors",
        "timezone": "America/New_York (EST/EDT)",
        "version": "1.0",
        "documentation": {
            "html": "Visit /documentation or /docs/html for beautifully formatted documentation",
            "json": "This endpoint provides machine-readable API documentation"
        },
        "endpoints": {
            "current_conditions": {
                "/api/weather": "Current weather data",
                "/api/weather/current": "Current weather only",
                "/api/water": "Current water data with historical",
                "/api/water/current": "Current water conditions only",
                "/api/rowcast": "Current rowcast score with conditions"
            },
            "forecasts": {
                "/api/weather/forecast": "Weather forecast (24 hours, hourly)",
                "/api/weather/extended": "Extended weather forecast (7 days)",
                "/api/rowcast/forecast": "Detailed rowcast forecast (24 hours, hourly)",
                "/api/rowcast/forecast/simple": "Simple rowcast forecast - timestamps and scores only",
                "/api/rowcast/forecast/extended": "Extended RowCast forecast using NOAA data (up to 7 days)",
                "/api/rowcast/forecast/extended/simple": "Simple extended RowCast forecast - timestamps and scores only",
                "/api/rowcast/forecast/short-term": "Detailed 15-minute forecast (3 hours)",
                "/api/rowcast/forecast/short-term/simple": "Simple 15-minute forecast - timestamps and scores only"
            },
            "noaa_data": {
                "/api/noaa/stageflow": "Full NOAA NWPS stageflow data (observed and forecast)",
                "/api/noaa/stageflow/current": "Current observed stageflow from NOAA",
                "/api/noaa/stageflow/forecast": "NOAA stageflow forecast data only"
            },
            "time_based_queries": {
                "/api/rowcast/forecast/<time_offset>": {
                    "description": "Get forecast for specific time offset from now",
                    "examples": [
                        "/api/rowcast/forecast/2h - 2 hours from now",
                        "/api/rowcast/forecast/30m - 30 minutes from now", 
                        "/api/rowcast/forecast/1d - 1 day from now"
                    ]
                },
                "/api/rowcast/at/<timestamp>": {
                    "description": "Get forecast for specific timestamp",
                    "format": "YYYY-MM-DDTHH:MM",
                    "example": "/api/rowcast/at/2025-07-01T16:00"
                }
            },
            "complete_data": {
                "/api/complete": "All current data, forecasts, and scores in one response",
                "/api/complete/extended": "All data including extended forecasts and NOAA stageflow for comprehensive dashboard"
            },
            "dashboard": {
                "/dashboard": "Visual dashboard showing all data in easy-to-read format",
                "/data": "Alternative URL for the visual dashboard"
            },
            "dashboard": {
                "/dashboard": "Interactive web dashboard showing all data and forecasts",
                "/data": "Alias for dashboard - comprehensive data visualization"
            }
        },
        "scoring_factors": {
            "weather": ["Temperature (74-85°F optimal)", "Wind speed/gusts", "Precipitation", "UV index", "Visibility"],
            "water": ["Discharge/flow rate", "Water temperature", "Gauge height"],
            "safety": ["Weather alerts", "Lightning potential", "Severe weather conditions"]
        },
        "score_range": "0-10 (10 = perfect conditions, 0 = dangerous/unsuitable)",
        "data_updates": {
            "weather": "Every 10 minutes",
            "extended_weather": "Every 60 minutes",
            "water": "Every 15 minutes", 
            "noaa_stageflow": "Every 30 minutes",
            "forecasts": "Every 10 minutes",
            "extended_forecasts": "Every 30 minutes"
        },
        "response_formats": {
            "detailed": "Includes all conditions and parameters used in scoring",
            "simple": "Timestamps and scores only for lightweight applications"
        }
    }
    
    return jsonify(docs)

@bp.route("/docs/html")
@bp.route("/documentation")
def api_documentation_html():
    """Redirect to standalone API documentation page"""
    return redirect('/api-documentation.html')

@bp.route("/dashboard")
@bp.route("/data")
def data_dashboard():
    """Redirect to standalone dashboard page"""
    return redirect('/dashboard.html')

@bp.route("/")
def index():
    """Serve the main application"""
    # In production, serve from dist directory
    env = os.getenv('FLASK_ENV', 'development')
    if env == 'production':
        return send_from_directory('../dist', 'index.html')
    else:
        # In development, redirect to dev server
        return redirect('http://localhost:8000')

@bp.route("/<path:filename>")
def serve_static(filename):
    """Serve static files in production"""
    env = os.getenv('FLASK_ENV', 'development')
    if env == 'production':
        try:
            return send_from_directory('../dist', filename)
        except:
            # If file not found, serve index.html for SPA routing
            return send_from_directory('../dist', 'index.html')
    else:
        # In development, let the dev server handle it
        return redirect(f'http://localhost:8000/{filename}')

@bp.route("/api/rowcast/test", methods=["GET"])
def rowcast_test():
    """Test endpoint: compute RowCast score for arbitrary parameters via query string (for automated testing/debugging)."""
    import json
    # Parse query parameters
    def parse_float(key, default=None):
        val = request.args.get(key, default)
        try:
            return float(val) if val is not None else None
        except Exception:
            return default
    def parse_int(key, default=None):
        val = request.args.get(key, default)
        try:
            return int(val) if val is not None else None
        except Exception:
            return default
    def parse_json(key, default=None):
        val = request.args.get(key)
        if val:
            try:
                return json.loads(val)
            except Exception:
                return default
        return default

    params = {
        'apparentTemp': parse_float('apparentTemp'),
        'windSpeed': parse_float('windSpeed', 0),
        'windGust': parse_float('windGust', 0),
        'discharge': parse_float('discharge', 0),
        'waterTemp': parse_float('waterTemp'),
        'precipitation': parse_float('precipitation', 0),
        'uvIndex': parse_float('uvIndex', 0),
        'weatherAlerts': parse_json('weatherAlerts', []),
        'visibility': parse_float('visibility'),
        'lightningPotential': parse_float('lightningPotential'),
        'precipitationProbability': parse_float('precipitationProbability'),
        'forecastScores': parse_json('forecastScores', None)
    }
    
    result = compute_rowcast(params)
    min_factor = min(result['factors'], key=result['factors'].get) if result['factors'] else None
    
    return jsonify({
        'score': result['score'],
        'factors': result['factors'],
        'biggestLimitingFactor': min_factor,
        'params': params
    })

@bp.route("/dashboard.html")
def dashboard():
    """Serve the dashboard with cache busting"""
    import time
    cache_buster = str(int(time.time()))
    return render_template('dashboard.html', cache_buster=cache_buster)