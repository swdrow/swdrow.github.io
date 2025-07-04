#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.rowcast import compute_rowcast

# Current conditions
params = {
    'apparentTemp': 81.7,
    'windSpeed': 8.5,
    'windGust': 11.2,
    'discharge': 4880,
    'waterTemp': 75.38,
    'precipitation': 0.0,
    'uvIndex': 7.65,
    'weatherAlerts': [],
    'visibility': 50000.0,
    'lightningPotential': None,
    'precipitationProbability': None
}

print("=== ROWCAST SCORING DEBUG ===")
print(f"Input Parameters:")
print(f"  Apparent Temp: {params['apparentTemp']}°F")
print(f"  Wind Speed: {params['windSpeed']} mph")
print(f"  Wind Gust: {params['windGust']} mph")
print(f"  Discharge: {params['discharge']} cfs")
print(f"  Water Temp: {params['waterTemp']}°F")
print(f"  Precipitation: {params['precipitation']} inches")
print(f"  UV Index: {params['uvIndex']}")

# Calculate individual scores
temp = params['apparentTemp']
wind_speed = params['windSpeed']
wind_gust = params['windGust']
effective_wind = max(wind_speed, wind_gust * 0.7)

print(f"\n=== INDIVIDUAL SCORE CALCULATIONS ===")
print(f"Effective Wind: {effective_wind:.1f} mph (max of {wind_speed} mph wind, {wind_gust * 0.7:.1f} mph gust factor)")

# Wind score
if effective_wind <= 3:
    windSc = 1.0
elif effective_wind <= 6:
    windSc = 0.95
elif effective_wind <= 10:
    windSc = 0.9
elif effective_wind <= 15:
    windSc = 0.8
elif effective_wind <= 20:
    windSc = 0.6 - (effective_wind - 15) * 0.06
else:
    windSc = 0.01

print(f"Wind Score: {windSc:.3f}")

# Temperature score
if 68 <= temp <= 78:
    tempSc = 1.0
elif 62 <= temp < 68:
    tempSc = 0.95
elif 78 < temp <= 82:
    tempSc = 0.95
elif 58 <= temp < 62:
    tempSc = 0.85
elif 82 < temp <= 88:
    tempSc = 0.85
elif temp < 52:
    tempSc = max(0.2, 0.7 - (52 - temp) * 0.05)
else:  # temp > 95
    tempSc = max(0.1, 0.7 - (temp - 95) * 0.1)

print(f"Temperature Score: {tempSc:.3f}")

# Flow score
flow = params['discharge']
if flow >= 15000:
    flowSc = 0.1
elif flow >= 12000:
    flowSc = 0.3
elif flow >= 10000:
    flowSc = 0.6
elif 1500 <= flow <= 8000:
    flowSc = 1.0
elif 8000 < flow < 10000:
    flowSc = 0.9
elif 1000 <= flow < 1500:
    flowSc = 0.8
elif 500 <= flow < 1000:
    flowSc = 0.6
elif flow < 500:
    flowSc = 0.4
else:
    flowSc = 0.5

print(f"Flow Score: {flowSc:.3f}")

# Final score
score = compute_rowcast(params)
print(f"\n=== FINAL RESULT ===")
print(f"RowCast Score: {score}")

# Let's test some better conditions
print(f"\n=== TESTING IMPROVED CONDITIONS ===")
better_params = params.copy()
better_params['apparentTemp'] = 72.0  # Perfect rowing temp
better_params['windSpeed'] = 5.0      # Light wind
better_params['windGust'] = 7.0       # Light gusts

better_score = compute_rowcast(better_params)
print(f"Better conditions score: {better_score}")
print(f"  Temp: 72°F, Wind: 5 mph, Gust: 7 mph")

# Test with minimal wind
minimal_wind_params = params.copy()
minimal_wind_params['apparentTemp'] = 72.0
minimal_wind_params['windSpeed'] = 2.0
minimal_wind_params['windGust'] = 3.0

minimal_score = compute_rowcast(minimal_wind_params)
print(f"Minimal wind score: {minimal_score}")
print(f"  Temp: 72°F, Wind: 2 mph, Gust: 3 mph")
