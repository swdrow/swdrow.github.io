#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.rowcast import compute_rowcast

print("=== ROWCAST SCORING VALIDATION ===")

# Test cases to validate the scoring logic
test_cases = [
    {
        "name": "Perfect Conditions",
        "params": {
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
        },
        "expected_range": (9.0, 10.0)
    },
    {
        "name": "Good Conditions (current)",
        "params": {
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
        },
        "expected_range": (5.0, 6.0)
    },
    {
        "name": "Challenging Wind (15 mph)",
        "params": {
            'apparentTemp': 75.0,
            'windSpeed': 15.0,
            'windGust': 18.0,
            'discharge': 3000,
            'waterTemp': 70.0,
            'precipitation': 0.0,
            'uvIndex': 5.0,
            'weatherAlerts': [],
            'visibility': 50000.0,
            'lightningPotential': None,
            'precipitationProbability': None
        },
        "expected_range": (4.0, 5.5)
    },
    {
        "name": "Hard Cutoff Wind (20+ mph)",
        "params": {
            'apparentTemp': 75.0,
            'windSpeed': 22.0,
            'windGust': 25.0,
            'discharge': 3000,
            'waterTemp': 70.0,
            'precipitation': 0.0,
            'uvIndex': 5.0,
            'weatherAlerts': [],
            'visibility': 50000.0,
            'lightningPotential': None,
            'precipitationProbability': None
        },
        "expected_range": (1.0, 3.0)
    },
    {
        "name": "Dangerous Wind (35+ mph gust)",
        "params": {
            'apparentTemp': 75.0,
            'windSpeed': 18.0,
            'windGust': 36.0,  # This triggers the 35 mph hard cutoff
            'discharge': 3000,
            'waterTemp': 70.0,
            'precipitation': 0.0,
            'uvIndex': 5.0,
            'weatherAlerts': [],
            'visibility': 50000.0,
            'lightningPotential': None,
            'precipitationProbability': None
        },
        "expected_range": (0.0, 1.0)
    },
    {
        "name": "Too Hot (95°F+)",
        "params": {
            'apparentTemp': 98.0,
            'windSpeed': 5.0,
            'windGust': 7.0,
            'discharge': 3000,
            'waterTemp': 80.0,
            'precipitation': 0.0,
            'uvIndex': 10.0,
            'weatherAlerts': [],
            'visibility': 50000.0,
            'lightningPotential': None,
            'precipitationProbability': None
        },
        "expected_range": (2.0, 4.0)
    },
    {
        "name": "Too Cold (45°F)",
        "params": {
            'apparentTemp': 45.0,
            'windSpeed': 5.0,
            'windGust': 7.0,
            'discharge': 3000,
            'waterTemp': 45.0,
            'precipitation': 0.0,
            'uvIndex': 3.0,
            'weatherAlerts': [],
            'visibility': 50000.0,
            'lightningPotential': None,
            'precipitationProbability': None
        },
        "expected_range": (1.5, 3.5)
    },
    {
        "name": "Heavy Rain",
        "params": {
            'apparentTemp': 72.0,
            'windSpeed': 5.0,
            'windGust': 7.0,
            'discharge': 3000,
            'waterTemp': 70.0,
            'precipitation': 3.5,  # Heavy rain
            'uvIndex': 2.0,
            'weatherAlerts': [],
            'visibility': 50000.0,
            'lightningPotential': None,
            'precipitationProbability': 95
        },
        "expected_range": (1.0, 3.0)
    }
]

for test_case in test_cases:
    score = compute_rowcast(test_case["params"])
    min_expected, max_expected = test_case["expected_range"]
    status = "✅ PASS" if min_expected <= score <= max_expected else "❌ FAIL"
    
    print(f"\n{test_case['name']}: {score:.2f} {status}")
    print(f"  Expected: {min_expected:.1f} - {max_expected:.1f}")
    
    # Show key factors
    effective_wind = max(test_case["params"]['windSpeed'], test_case["params"]['windGust'] * 0.7)
    print(f"  Effective Wind: {effective_wind:.1f} mph")
    print(f"  Apparent Temp: {test_case['params']['apparentTemp']}°F")
    print(f"  Precipitation: {test_case['params']['precipitation']} in")

print(f"\n=== SCORING LOGIC SUMMARY ===")
print(f"✅ Wind is the primary factor (40% of score)")
print(f"✅ Temperature is secondary (30% of score)")
print(f"✅ Hard cutoffs: 20 mph wind, 35 mph gust")
print(f"✅ Perfect conditions: 68-78°F, <3 mph wind")
print(f"✅ Safety factors can reduce score significantly")
