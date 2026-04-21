// ========================================
// Speakease — Score Chart (Chart.js wrapper)
// ========================================

import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export class ScoreChart {
    constructor() {
        this.charts = {};
    }

    createRadar(canvasId, labels, data, label = 'Score') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#94a3b8' : '#64748b';
        const gridColor = isDark ? 'rgba(148,163,184,0.1)' : 'rgba(148,163,184,0.2)';

        this.charts[canvasId] = new Chart(canvas, {
            type: 'radar',
            data: {
                labels,
                datasets: [{
                    label,
                    data,
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    borderColor: 'rgba(99, 102, 241, 0.8)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(99, 102, 241, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    r: {
                        beginAtZero: true, max: 100,
                        ticks: { stepSize: 20, color: textColor, backdropColor: 'transparent', font: { size: 10 } },
                        grid: { color: gridColor },
                        pointLabels: { color: textColor, font: { size: 12, weight: 600 } },
                        angleLines: { color: gridColor }
                    }
                },
                plugins: { legend: { display: false } },
                animation: { duration: 1500, easing: 'easeOutQuart' }
            }
        });
    }

    createLine(canvasId, labels, datasets) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#94a3b8' : '#64748b';
        const gridColor = isDark ? 'rgba(148,163,184,0.1)' : 'rgba(148,163,184,0.15)';

        this.charts[canvasId] = new Chart(canvas, {
            type: 'line',
            data: { labels, datasets: datasets.map(ds => ({ ...ds, tension: 0.4, fill: true, pointRadius: 0, borderWidth: 2 })) },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: textColor, maxTicksLimit: 10 }, grid: { color: gridColor } },
                    y: { beginAtZero: true, max: 100, ticks: { color: textColor }, grid: { color: gridColor } }
                },
                plugins: { legend: { labels: { color: textColor, usePointStyle: true, padding: 16 } } },
                animation: { duration: 1500 },
                interaction: { mode: 'index', intersect: false }
            }
        });
    }

    createBar(canvasId, labels, data, colors) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#94a3b8' : '#64748b';
        const gridColor = isDark ? 'rgba(148,163,184,0.1)' : 'rgba(148,163,184,0.15)';

        this.charts[canvasId] = new Chart(canvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [{ data, backgroundColor: colors || 'rgba(99,102,241,0.6)', borderRadius: 8, borderSkipped: false }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: textColor }, grid: { display: false } },
                    y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor } }
                },
                plugins: { legend: { display: false } },
                animation: { duration: 1200, easing: 'easeOutQuart' }
            }
        });
    }

    createDoughnut(canvasId, value, color = '#6366f1') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        this.charts[canvasId] = new Chart(canvas, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [value, 100 - value],
                    backgroundColor: [color, 'rgba(148,163,184,0.1)'],
                    borderWidth: 0, cutout: '78%'
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: true,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                animation: { duration: 1500, easing: 'easeOutQuart' }
            }
        });
    }

    destroyAll() {
        Object.values(this.charts).forEach(c => c?.destroy());
        this.charts = {};
    }
}
