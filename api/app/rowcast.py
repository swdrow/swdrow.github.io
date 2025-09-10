from math import exp
from app.utils import clamp, fmt


def wind_score(wind_speed, wind_gust):
    # Use the higher of wind speed or 70% of gust
    w = max(wind_speed or 0, (wind_gust or 0) * 0.7)
    # Stepwise exponential decay (JS logic):
    # 0-4: ideal, 4-8: mild, 8-12: moderate, 12-16: strong, 16-20: dangerous, >20: very dangerous
    if w <= 4:
        return 1.0
    elif w <= 8:
        return exp(-0.12 * (w - 4))
    elif w <= 12:
        return exp(-0.25 * (w - 8)) * exp(-0.12 * 4)
    elif w <= 16:
        return exp(-0.4 * (w - 12)) * exp(-0.25 * 4) * exp(-0.12 * 4)
    elif w <= 20:
        return exp(-0.7 * (w - 16)) * exp(-0.4 * 4) * exp(-0.25 * 4) * exp(-0.12 * 4)
    else:
        return 0


def temp_score(temp):
    # Temperature scoring with smooth continuous decay for hot temperatures
    # Eliminates abrupt transitions by using temperature-dependent exponential rate
    # Cold threshold: <40°F = 0, Hot threshold: >=105°F = 0
    # Targets: 85-90°F ≈ 5-6 score, 100-105°F < 1 score
    if temp is None:
        return 0.7
    if temp < 40 or temp >= 105:
        return 0.0
    if temp <= 74:
        return 1.0
    
    # Smooth exponential decay with temperature-dependent rate
    # Rate increases smoothly with temperature for natural curve
    t = temp - 74  # Temperature above 74°F
    
    # Dynamic rate that increases smoothly with temperature
    # Lower rate at moderate temps, higher rate at extreme temps
    base_rate = 0.019
    rate_multiplier = 1 + (t / 31) ** 2.3 * 7.5  # Smooth acceleration
    dynamic_rate = base_rate * rate_multiplier
    
    score = exp(-dynamic_rate * t)
    return max(0, score)


def flow_score(flow):
    # Stepwise exponential decay (JS logic):
    # <500: 0, 500-1500: sharp rise, 1500-8000: ideal, 8000-12000: moderate, 12000-15000: strong, >15000: 0
    if flow is None:
        return 0.7
    if flow < 500:
        return 0
    elif flow < 1500:
        return exp(-0.18 * (1500 - flow) / 1000)
    elif flow <= 8000:
        return 1.0
    elif flow <= 12000:
        return exp(-0.12 * (flow - 8000) / 1000)
    elif flow <= 15000:
        return exp(-0.25 * (flow - 12000) / 1000) * exp(-0.12 * 4)
    else:
        return 0


def precip_score(prec):
    # Stepwise exponential decay (JS logic):
    # 0-0.1: ideal, 0.1-0.5: mild, 0.5-1.0: moderate, 1.0-2.5: strong, >2.5: 0
    if prec is None:
        return 1.0
    if prec <= 0.1:
        return 1.0
    elif prec <= 0.5:
        return exp(-1.5 * (prec - 0.1))
    elif prec <= 1.0:
        return exp(-1.0 * (prec - 0.5)) * exp(-1.5 * 0.4)
    elif prec <= 2.5:
        return exp(-0.7 * (prec - 1.0)) * exp(-1.0 * 0.5) * exp(-1.5 * 0.4)
    else:
        return 0


def water_temp_score(water_temp):
    # Stepwise exponential decay (JS logic):
    # <32: 0, 32-50: sharp rise, 50-65: moderate, 65+: ideal
    if water_temp is None:
        return 0.8
    if water_temp < 32:
        return 0
    elif water_temp < 50:
        return exp(-0.18 * (50 - water_temp) / 18)
    elif water_temp < 65:
        return exp(-0.08 * (65 - water_temp) / 15) * exp(-0.18 * (50 - 32) / 18)
    else:
        return 1.0


def uv_score(uv):
    # Stepwise exponential decay (JS logic):
    # 0-6: ideal, 6-8: mild, 8-10: moderate, 10-12: strong, >12: 0
    if uv is None:
        return 1.0
    if uv <= 6:
        return 1.0
    elif uv <= 8:
        return exp(-0.25 * (uv - 6))
    elif uv <= 10:
        return exp(-0.4 * (uv - 8)) * exp(-0.25 * 2)
    elif uv <= 12:
        return exp(-0.7 * (uv - 10)) * exp(-0.4 * 2) * exp(-0.25 * 2)
    else:
        return 0


def exp_fall(val, lo, hi):
    if val is None:
        return 1
    if val <= lo:
        return 1
    if val >= hi:
        return 0
    return exp(-2.5 * (val - lo) / (hi - lo))


def safety_alert_score(weather_alerts, visibility, lightning_potential, precip_prob, forecast_scores=None):
    """Calculate safety score based on dangerous weather conditions, using forecasted river data for watches."""
    safety_score = 1.0
    flood_watch_penalty = 1.0
    # If forecast_scores provided, check for dangerous river conditions in the near future
    def river_danger_in_forecast():
        if not forecast_scores:
            return False
        for forecast in forecast_scores:
            # Danger thresholds (customize as needed)
            if forecast.get('conditions', {}).get('discharge', 0) >= 12000 or forecast.get('conditions', {}).get('gaugeHeight', 0) >= 13:
                return True
        return False
    if weather_alerts:
        for alert in weather_alerts:
            alert_type = alert.get('type', '').lower()
            severity = alert.get('severity', '').lower()
            urgency = alert.get('urgency', '').lower()
            # Immediate danger conditions
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
            if 'flood watch' in alert_type:
                # Only penalize if river is forecasted to be dangerous
                if river_danger_in_forecast():
                    flood_watch_penalty *= 0.7  # Mild penalty if danger is forecasted
                else:
                    flood_watch_penalty *= 1.0  # No penalty if river is not forecasted to be dangerous
            elif any(danger in alert_type for danger in immediate_danger):
                if severity in ['extreme', 'severe'] or urgency == 'immediate':
                    return 0
                elif severity == 'moderate':
                    safety_score *= 0.05
                else:
                    safety_score *= 0.1
            elif any(danger in alert_type for danger in high_danger):
                if severity in ['extreme', 'severe']:
                    safety_score *= 0.1
                elif severity == 'moderate':
                    safety_score *= 0.3
                else:
                    safety_score *= 0.6
    
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
    
    safety_score *= flood_watch_penalty
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
    forecast_scores = params.get('forecastScores')

    # === PRIMARY FACTORS (Most Important) ===
    factors = {
        'wind': wind_score(wind_speed, wind_gust),
        'temp': temp_score(temp),
        'flow': flow_score(flow),
        'precip': precip_score(prec),
        'water_temp': water_temp_score(water_temp),
        'uv': uv_score(uv),
        'safety': safety_alert_score(weather_alerts, visibility, lightning_potential, precip_prob, forecast_scores)
    }

    # === WEIGHTED SCORING SYSTEM ===
    # Temperature and wind are primary factors, others are secondary modifiers
    
    # 1. Critical safety override - can cause immediate 0 or very low scores
    if factors['safety'] == 0:
        return {'score': 0, 'factors': factors}
    elif factors['safety'] < 0.1:
        # Critical safety issue - override everything with very low score
        return {'score': round(factors['safety'] * 10, 3), 'factors': factors}
    
    # 2. Primary score calculation (temperature 80%, wind 20%)
    # Adjust weighting to reduce wind's positive impact
    primary_score = (factors['temp'] * 0.8) + (factors['wind'] * 0.2)
    
    # 3. Secondary factors as modifiers (flow, precip, water_temp, uv)
    # These can reduce the score but have limited impact unless critical
    secondary_factors = {
        'flow': factors['flow'],
        'precip': factors['precip'], 
        'water_temp': factors['water_temp'],
        'uv': factors['uv']
    }
    
    # Apply secondary factor modifiers
    secondary_modifier = 1.0
    for factor_value in secondary_factors.values():
        if factor_value == 0:
            # Secondary factor is critical - significant impact
            secondary_modifier *= 0.1
        elif factor_value < 0.3:
            # Secondary factor is problematic - moderate impact
            secondary_modifier *= (0.7 + (factor_value * 0.3))  # Scale from 0.7 to 1.0
        else:
            # Secondary factor is okay - minimal impact
            secondary_modifier *= (0.85 + (factor_value * 0.15))  # Scale from 0.85 to 1.0
    
    # 4. Apply safety modifier (if not critical)
    if factors['safety'] < 0.3:
        safety_modifier = 0.5 + (factors['safety'] * 0.5)  # Scale from 0.5 to 1.0
    else:
        safety_modifier = 0.90 + (factors['safety'] * 0.10)  # Scale from 0.90 to 1.0
    
    # 5. Calculate final score
    base_score = primary_score * secondary_modifier * safety_modifier
    
    # Clamp and scale to 0-10
    score = clamp(round(base_score * 10, 3), 0, 10)
    return {'score': score, 'factors': factors}


def merge_params(weather, water):
    return { **weather, **water }