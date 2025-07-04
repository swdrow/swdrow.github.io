#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.rowcast import compute_rowcast

# Exact API parameters
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

print("=== EXACT API PARAMETERS TEST ===")
score = compute_rowcast(params)
print(f"Computed RowCast Score: {score}")
print(f"API Returned Score: 0.22")
print(f"Difference: {score - 0.22:.2f}")

# Test step-by-step to find the issue
effective_wind = max(params['windSpeed'], params['windGust'] * 0.7)
print(f"\nEffective Wind: {effective_wind} mph")

# Check if it's a safety score issue
from app.rowcast import safety_alert_score
safety_score = safety_alert_score(
    params.get('weatherAlerts', []),
    params.get('visibility'),
    params.get('lightningPotential'),
    params.get('precipitationProbability')
)
print(f"Safety Score: {safety_score}")

# Maybe there's an old version cached?
print(f"\nChecking if server needs to be restarted...")

# Test with perfect conditions to see range
perfect_params = {
    'apparentTemp': 72.0,
    'windSpeed': 2.0,
    'windGust': 3.0,
    'discharge': 3000,
    'waterTemp': 70.0,
    'precipitation': 0.0,
    'uvIndex': 3.0,
    'weatherAlerts': [],
    'visibility': 50000.0,
    'lightningPotential': 0,
    'precipitationProbability': 0
}

perfect_score = compute_rowcast(perfect_params)
print(f"Perfect conditions score: {perfect_score}")
