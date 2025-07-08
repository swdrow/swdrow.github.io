// Dashboard functionality - integrated with RowCastApp
// This file provides dashboard-specific utilities and enhancements

class DashboardUtils {
    static formatScore(score) {
        return Math.round(score * 10) / 10;
    }

    static getScoreColor(score) {
        if (score <= 3) return 'var(--accent-red)';
        if (score <= 5) return 'var(--accent-orange)';
        if (score <= 7) return 'var(--accent-orange)';
        return 'var(--accent-green)';
    }

    static getScoreDescription(score) {
        if (score <= 2) return 'Poor conditions - not recommended';
        if (score <= 4) return 'Fair conditions - experienced rowers only';
        if (score <= 6) return 'Good conditions - suitable for most rowers';
        if (score <= 8) return 'Excellent conditions - ideal for rowing';
        return 'Perfect conditions - optimal rowing weather';
    }

    static calculateWindRelativeToRiver(windDirection, riverCourse = 220) {
        const relative = Math.abs(windDirection - riverCourse);
        return Math.min(relative, 360 - relative);
    }

    static getWindImpact(windDirection, riverCourse = 220) {
        const relative = this.calculateWindRelativeToRiver(windDirection, riverCourse);
        
        if (relative <= 15) return { impact: 'tailwind/headwind', severity: 'high' };
        if (relative <= 45) return { impact: 'quartering wind', severity: 'moderate' };
        if (relative <= 75) return { impact: 'crosswind', severity: 'low' };
        return { impact: 'perpendicular wind', severity: 'minimal' };
    }

    static createScoreChart(container, timelineData) {
        if (!window.Chart) return;
        
        const canvas = document.createElement('canvas');
        canvas.style.height = '200px';
        container.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: timelineData.map(d => new Date(d.time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})),
                datasets: [{
                    label: 'RowCast Score',
                    data: timelineData.map(d => d.score),
                    borderColor: 'var(--accent-blue)',
                    backgroundColor: 'rgba(0, 122, 255, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: timelineData.map(d => this.getScoreColor(d.score)),
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.6)',
                            maxTicksLimit: 8
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        min: 0,
                        max: 10,
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.6)',
                            stepSize: 2
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    static renderRiskFactorsList(factors) {
        if (!factors || factors.length === 0) {
            return '<div class="caption">No current risk factors detected</div>';
        }

        return `
            <div class="risk-factors">
                <h4 class="heading-3 status-warning">⚠️ Risk Factors:</h4>
                <ul style="margin-top: 8px; color: var(--text-secondary); list-style: none; padding: 0;">
                    ${factors.map(factor => `
                        <li style="margin-bottom: 4px; padding: 4px 8px; background: rgba(255, 149, 0, 0.1); border-radius: 4px;">
                            ${factor}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    static createWindCompass(container, windDirection, riverCourse = 220) {
        const relative = this.calculateWindRelativeToRiver(windDirection, riverCourse);
        const impact = this.getWindImpact(windDirection, riverCourse);
        
        container.innerHTML = `
            <div class="wind-compass">
                <div class="compass-center"></div>
                <div class="river-course" style="transform: rotate(${riverCourse}deg)"></div>
                <div class="wind-arrow" style="transform: rotate(${windDirection}deg)"></div>
                
                <!-- Compass directions -->
                <div style="position: absolute; top: 5px; left: 50%; transform: translateX(-50%); font-size: 12px; color: var(--text-tertiary);">N</div>
                <div style="position: absolute; right: 5px; top: 50%; transform: translateY(-50%); font-size: 12px; color: var(--text-tertiary);">E</div>
                <div style="position: absolute; bottom: 5px; left: 50%; transform: translateX(-50%); font-size: 12px; color: var(--text-tertiary);">S</div>
                <div style="position: absolute; left: 5px; top: 50%; transform: translateY(-50%); font-size: 12px; color: var(--text-tertiary);">W</div>
            </div>
            <div style="text-align: center; margin-top: 16px;">
                <div class="caption">Wind: ${Math.round(windDirection)}° • River: ${riverCourse}°</div>
                <div class="caption">Relative: ${Math.round(relative)}° • ${impact.impact}</div>
                <div class="caption" style="color: ${impact.severity === 'high' ? 'var(--accent-red)' : impact.severity === 'moderate' ? 'var(--accent-orange)' : 'var(--accent-green)'}">
                    Impact: ${impact.severity}
                </div>
            </div>
        `;
    }

    static createTimeSelector(container, onTimeChange) {
        const now = new Date();
        const times = [];
        
        // Generate time options (-3 to +9 hours)
        for (let i = -3; i <= 9; i++) {
            const time = new Date(now.getTime() + i * 60 * 60 * 1000);
            times.push({
                value: i,
                label: time.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
                date: time.toLocaleDateString([], {month: 'short', day: 'numeric'}),
                isCurrent: i === 0
            });
        }

        container.innerHTML = `
            <div class="time-selector">
                <div class="time-selector-label">View Time Period:</div>
                <div class="time-selector-buttons">
                    ${times.map(time => `
                        <button class="time-btn ${time.isCurrent ? 'active' : ''}" data-offset="${time.value}">
                            <div class="time-btn-time">${time.label}</div>
                            <div class="time-btn-date">${time.date}</div>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        // Add event listeners
        container.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                onTimeChange(parseInt(btn.dataset.offset));
            });
        });
    }

    static animateScore(element, targetScore, duration = 1000) {
        let startScore = 0;
        const startTime = performance.now();
        
        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const currentScore = startScore + (targetScore - startScore) * easeOutCubic;
            
            element.textContent = currentScore.toFixed(1);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        
        requestAnimationFrame(animate);
    }
}

// Additional CSS for dashboard components
const dashboardStyles = `
    .time-selector {
        margin: 16px 0;
    }
    
    .time-selector-label {
        font-size: 14px;
        color: var(--text-secondary);
        margin-bottom: 8px;
    }
    
    .time-selector-buttons {
        display: flex;
        gap: 4px;
        overflow-x: auto;
        padding: 4px 0;
    }
    
    .time-btn {
        min-width: 80px;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.3s ease;
        text-align: center;
    }
    
    .time-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-1px);
    }
    
    .time-btn.active {
        background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
        border-color: var(--accent-blue);
        color: white;
    }
    
    .time-btn-time {
        font-size: 12px;
        font-weight: 500;
    }
    
    .time-btn-date {
        font-size: 10px;
        opacity: 0.8;
        margin-top: 2px;
    }
    
    .risk-factors {
        margin-top: 16px;
    }
`;

// Inject dashboard styles
if (!document.querySelector('#dashboard-styles')) {
    const style = document.createElement('style');
    style.id = 'dashboard-styles';
    style.textContent = dashboardStyles;
    document.head.appendChild(style);
}

// Export for use in main app
window.DashboardUtils = DashboardUtils;
