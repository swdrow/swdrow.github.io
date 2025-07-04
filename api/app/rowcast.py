from math import exp
from app.utils import clamp, fmt


def temp_score(temp):
    t = [74, 80, 85, 90, 95, 100, 105]
    k = [0.02, 0.03, 0.09, 0.13, 0.28, 0.40]
    if temp is None or temp < 20 or temp >= 105:
        return 0
    s = 1
    for i in range(len(t) - 1):
        if temp <= t[i + 1]:
            return s * exp(-k[i] * (temp - t[i]))
        s *= exp(-k[i] * (t[i + 1] - t[i]))
    return s


def exp_fall(val, lo, hi):
    if val is None:
        return 1
    if val <= lo:
        return 1
    if val >= hi:
        return 0
    return exp(-2.5 * (val - lo) / (hi - lo))


def safety_alert_score(weather_alerts, visibility, lightning_potential, precip_prob):
    """Calculate safety score based on dangerous weather conditions."""
    # Start with perfect safety score
    safety_score = 1.0
    
    # Check for dangerous weather alerts
    if weather_alerts:
        for alert in weather_alerts:
            alert_type = alert.get('type', '').lower()
            severity = alert.get('severity', '').lower()
            urgency = alert.get('urgency', '').lower()
            
            # Immediate danger conditions that should zero out the score
            immediate_danger = [
                'tornado', 'severe thunderstorm', 'flash flood', 
                'flood warning', 'hurricane', 'tropical storm', 
                'gale warning', 'storm warning'
            ]
            
            # High danger conditions
            high_danger = [
                'high wind', 'small craft advisory', 'wind advisory',
                'flood watch', 'thunderstorm watch'
            ]
            
            if any(danger in alert_type for danger in immediate_danger):
                if severity in ['extreme', 'severe'] or urgency == 'immediate':
                    return 0  # Zero score for immediate danger
                elif severity == 'moderate':
                    safety_score *= 0.05  # Almost zero for moderate immediate danger
                else:
                    safety_score *= 0.1  # Very low for minor immediate danger
                    
            elif any(danger in alert_type for danger in high_danger):
                if severity in ['extreme', 'severe']:
                    safety_score *= 0.1  # Very low score for severe high danger
                elif severity == 'moderate':
                    safety_score *= 0.3  # Low score for moderate high danger
                else:
                    safety_score *= 0.6  # Reduced score for minor high danger
    
    # Visibility score - critical for safety on water
    if visibility is not None:
        if visibility < 0.25:  # Less than 1/4 mile - extremely dangerous
            return 0  # Zero score for extremely poor visibility
        elif visibility < 0.5:  # Less than 1/2 mile - very dangerous
            safety_score *= 0.05
        elif visibility < 1.0:  # Less than 1 mile - dangerous
            safety_score *= 0.2
        elif visibility < 2.0:  # Less than 2 miles - reduced visibility
            safety_score *= 0.5
        elif visibility < 5.0:  # Less than 5 miles - slightly reduced
            safety_score *= 0.8
    
    # Lightning potential score - extremely dangerous on water
    if lightning_potential is not None:
        if lightning_potential > 80:  # Very high lightning risk
            return 0  # Zero score - lightning is deadly on water
        elif lightning_potential > 60:  # High lightning risk
            safety_score *= 0.02  # Almost zero score
        elif lightning_potential > 40:  # Moderate lightning risk
            safety_score *= 0.1
        elif lightning_potential > 20:  # Low lightning risk
            safety_score *= 0.4
        elif lightning_potential > 10:  # Very low lightning risk
            safety_score *= 0.7
    
    # Precipitation probability - affects conditions and safety
    if precip_prob is not None:
        if precip_prob > 90:  # Very high chance of precipitation
            safety_score *= 0.3
        elif precip_prob > 70:  # High chance of precipitation
            safety_score *= 0.5
        elif precip_prob > 50:  # Moderate chance of precipitation
            safety_score *= 0.7
    
    return safety_score

def compute_rowcast(params):
    # Safely extract parameters, defaulting appropriately
    temp = params.get('apparentTemp')
    wind_speed = params.get('windSpeed', 0)
    wind_gust = params.get('windGust', 0)
    flow = params.get('discharge', 0)
    water_temp = params.get('waterTemp')
    prec = params.get('precipitation', 0)
    uv = params.get('uvIndex', 0)
    
    # Safety parameters
    weather_alerts = params.get('weatherAlerts', [])
    visibility = params.get('visibility')
    lightning_potential = params.get('lightningPotential')
    precip_prob = params.get('precipitationProbability')

    # === PRIMARY FACTORS (Most Important) ===
    
    # 1. WIND CONDITIONS - Most critical for rowing safety and performance
    # Use the higher of wind speed or 70% of gust speed
    effective_wind = max(wind_speed, wind_gust * 0.7)
    
    if effective_wind <= 2:  # Perfect conditions - mirror-like water
        windSc = 1.0
    elif effective_wind <= 5:  # Excellent conditions - very light breeze
        windSc = 0.95
    elif effective_wind <= 8:  # Very good conditions - light breeze
        windSc = 0.85
    elif effective_wind <= 12:  # Good conditions - manageable breeze
        windSc = 0.7
    elif effective_wind <= 16:  # Fair conditions - getting choppy
        windSc = 0.5
    elif effective_wind <= 20:  # Challenging - experienced rowers only
        windSc = 0.15
    elif effective_wind <= 25:  # Difficult - small craft advisory conditions
        windSc = 0.05
    elif effective_wind <= 35:  # Very dangerous - hard cutoff for gusts
        windSc = 0.02
    else:  # Extremely dangerous - absolute no-go
        windSc = 0.005

    # 2. APPARENT TEMPERATURE - Critical for rowing comfort and safety
    if temp is None:
        tempSc = 0.3  # Unknown temp penalty
    elif 68 <= temp <= 78:  # Perfect rowing temperature range
        tempSc = 1.0
    elif 62 <= temp < 68:  # Cool but excellent
        tempSc = 0.9
    elif 78 < temp <= 82:  # Warm but still excellent
        tempSc = 0.9
    elif 58 <= temp < 62:  # Cool but very good
        tempSc = 0.75
    elif 82 < temp <= 88:  # Getting warm but good
        tempSc = 0.75
    elif 52 <= temp < 58:  # Cool but acceptable with gear
        tempSc = 0.5
    elif 88 < temp <= 95:  # Hot but manageable with precautions
        tempSc = 0.4
    elif 45 <= temp < 52:  # Cold - hypothermia risk
        tempSc = 0.2
    elif 95 < temp <= 100:  # Very hot - heat exhaustion risk
        tempSc = 0.15
    elif temp < 45:  # Very cold - dangerous
        tempSc = 0.05
    else:  # temp > 100 - extremely dangerous heat
        tempSc = 0.02

    # === SECONDARY FACTORS (Important but not primary) ===

    # 3. FLOW (discharge) - Updated with more realistic ranges
    if flow >= 15000:  # Very high flow - dangerous
        flowSc = 0.1
    elif flow >= 12000:  # High flow - challenging
        flowSc = 0.3
    elif flow >= 10000:  # Elevated flow - more difficult
        flowSc = 0.6
    elif 1500 <= flow <= 8000:  # Optimal flow range for rowing
        flowSc = 1.0
    elif 8000 < flow < 10000:  # Higher flow but still good
        flowSc = 0.9
    elif 1000 <= flow < 1500:  # Lower flow but acceptable
        flowSc = 0.8
    elif 500 <= flow < 1000:  # Low flow - may be shallow
        flowSc = 0.6
    elif flow < 500:  # Very low flow - navigation issues
        flowSc = 0.4
    else:  # Fallback
        flowSc = 0.5

    # 4. PRECIPITATION - Immediate impact on conditions
    if prec >= 3:  # Heavy rain - dangerous and very uncomfortable
        precipSc = 0.1
    elif prec >= 1:  # Moderate rain - poor conditions
        precipSc = 0.3
    elif prec >= 0.5:  # Light rain - manageable but not ideal
        precipSc = 0.6
    elif prec >= 0.1:  # Very light rain/drizzle
        precipSc = 0.85
    else:  # No precipitation
        precipSc = 1.0

    # === MINOR FACTORS (Secondary considerations) ===

    # 5. Water temperature - safety consideration for immersion
    if water_temp is None:
        waterTempSc = 0.8  # Unknown - assume reasonable
    elif water_temp >= 65:  # Warm water - safe for immersion
        waterTempSc = 1.0
    elif water_temp >= 55:  # Cool but safe with proper gear
        waterTempSc = 0.9
    elif water_temp >= 45:  # Cold - hypothermia risk increases
        waterTempSc = 0.7
    elif water_temp >= 35:  # Very cold - serious safety concern
        waterTempSc = 0.4
    else:  # Extremely cold water - life-threatening if immersed
        waterTempSc = 0.2

    # 6. UV index - comfort consideration
    if uv <= 3:  # Low UV - ideal
        uvSc = 1.0
    elif uv <= 6:  # Moderate UV - good conditions
        uvSc = 0.95
    elif uv <= 8:  # High UV - need sun protection
        uvSc = 0.85
    elif uv <= 10:  # Very high UV - significant sun protection needed
        uvSc = 0.7
    else:  # Extreme UV - dangerous exposure
        uvSc = 0.5
    
    # 7. Safety score - can override all other factors if dangerous
    safetySc = safety_alert_score(weather_alerts, visibility, lightning_potential, precip_prob)

    # === WEIGHTED SCORING SYSTEM ===
    # Prioritize the most important factors for rowing
    
    # Primary factors (80% of score) - wind and temperature are critical
    primary_score = windSc * 0.5 + tempSc * 0.3
    
    # Secondary factors (15% of score) 
    secondary_score = flowSc * 0.08 + precipSc * 0.07
    
    # Minor factors (5% of score)
    minor_score = waterTempSc * 0.03 + uvSc * 0.02
    
    # Combined base score (0-1 range)
    base_score = primary_score + secondary_score + minor_score
    
    # Safety can dramatically reduce the score
    final_score = base_score * safetySc
    
    # Scale to 0-10 with better distribution
    # Use a curve that gives higher scores for good conditions
    if final_score >= 0.9:
        scaled_score = 8.5 + (final_score - 0.9) * 15  # 8.5-10 for excellent
    elif final_score >= 0.8:
        scaled_score = 7.0 + (final_score - 0.8) * 15  # 7-8.5 for very good
    elif final_score >= 0.7:
        scaled_score = 5.0 + (final_score - 0.7) * 20  # 5-7 for good
    elif final_score >= 0.5:
        scaled_score = 2.5 + (final_score - 0.5) * 12.5  # 2.5-5 for fair
    else:
        scaled_score = final_score * 5  # 0-2.5 for poor
    
    score = clamp(round(scaled_score, 2), 0, 10)
    return score


def merge_params(weather, water):
    return { **weather, **water }