/**
 * UVGuard - Main JavaScript
 * Handles UV tracking, data visualization, and skin type analysis
 */

// Global state
let currentUV = null;
let userLocation = null;
let skinTypesData = null;
let cancerData = null;
let uvTrendsData = null;
let sunProtectionData = null;

// Chart instances
let incidenceChart = null;
let stateChart = null;
let uvTrendsChart = null;
let ageChart = null;
let protectionChart = null;

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

/**
 * Initialize application
 */
async function initApp() {
    // Get user location and UV data
    getUserLocation();
    
    // Load all data
    await Promise.all([
        loadSkinTypes(),
        loadCancerStatistics(),
        loadUVTrends(),
        loadSunProtectionData(),
        loadCitiesUV()
    ]);
    
    // Initialize charts
    initCharts();
    
    // Setup event listeners
    setupEventListeners();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            getUserLocation();
        });
    }
    
    // City select for UV trends chart
    const citySelect = document.getElementById('city-select');
    if (citySelect) {
        citySelect.addEventListener('change', (e) => {
            updateUVTrendsChart(e.target.value);
        });
    }
    
    // Mobile menu
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            document.querySelector('.nav-links').classList.toggle('show');
        });
    }
    
    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

/**
 * Get user's geolocation
 */
function getUserLocation() {
    updateLocationDisplay('Detecting location...');
    
    if (!navigator.geolocation) {
        // Fallback to Sydney
        userLocation = { lat: -33.8688, lng: 151.2093 };
        updateLocationDisplay('Sydney, NSW (default)');
        fetchUVData(userLocation.lat, userLocation.lng);
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            reverseGeocode(userLocation.lat, userLocation.lng);
            fetchUVData(userLocation.lat, userLocation.lng);
        },
        (error) => {
            console.warn('Geolocation error:', error);
            // Fallback to Sydney
            userLocation = { lat: -33.8688, lng: 151.2093 };
            updateLocationDisplay('Sydney, NSW (default)');
            fetchUVData(userLocation.lat, userLocation.lng);
        },
        { timeout: 10000 }
    );
}

/**
 * Reverse geocode coordinates to location name
 */
async function reverseGeocode(lat, lng) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`,
            {
                headers: {
                    'Accept-Language': 'en-US,en;q=0.9'
                }
            }
        );
        const data = await response.json();
        const city = data.address?.city || data.address?.town || data.address?.suburb || 'Unknown Location';
        const state = data.address?.state || data.address?.country || '';
        updateLocationDisplay(`${city}, ${state}`);
    } catch (error) {
        updateLocationDisplay('Your location');
    }
}

/**
 * Update location display elements
 */
function updateLocationDisplay(text) {
    const locationDisplay = document.getElementById('location-display');
    const heroLocation = document.getElementById('hero-location');
    
    if (locationDisplay) locationDisplay.textContent = text;
    if (heroLocation) heroLocation.innerHTML = `<span>📍</span> ${text}`;
}

/**
 * Fetch UV data from API
 */
async function fetchUVData(lat, lng) {
    try {
        const response = await fetch(`/api/uv?lat=${lat}&lng=${lng}`);
        const data = await response.json();
        
        currentUV = data.uv;
        updateUVDisplay(data);
    } catch (error) {
        console.error('Error fetching UV data:', error);
        updateUVDisplay({ uv: '--', error: true });
    }
}

/**
 * Update UV display with fetched data
 */
function updateUVDisplay(data) {
    const uvValue = document.getElementById('uv-value');
    const heroUVValue = document.getElementById('hero-uv-value');
    const riskBadge = document.getElementById('risk-badge');
    const heroRiskLevel = document.getElementById('hero-risk-level');
    const uvMessage = document.getElementById('uv-message');
    const uvAlert = document.getElementById('uv-alert');
    const alertTitle = document.getElementById('alert-title');
    const alertMessage = document.getElementById('alert-message');
    const recList = document.getElementById('rec-list');
    const uvRingProgress = document.getElementById('uv-ring-progress');
    
    const uv = data.uv;
    const uvRounded = typeof uv === 'number' ? Math.round(uv * 10) / 10 : '--';
    
    // Update UV values
    if (uvValue) uvValue.textContent = uvRounded;
    if (heroUVValue) heroUVValue.textContent = uvRounded;
    
    // Get risk info
    const riskInfo = getUVRiskInfo(uv);
    
    // Update risk badges
    if (riskBadge) {
        riskBadge.textContent = riskInfo.level;
        riskBadge.className = `risk-badge ${riskInfo.class}`;
    }
    
    if (heroRiskLevel) {
        heroRiskLevel.textContent = riskInfo.level;
        heroRiskLevel.style.background = riskInfo.color;
        heroRiskLevel.style.color = riskInfo.textColor;
    }
    
    // Update UV number color
    if (uvValue) uvValue.style.color = riskInfo.color;
    if (heroUVValue) heroUVValue.style.color = riskInfo.color;
    
    // Update ring progress
    if (uvRingProgress && typeof uv === 'number') {
        const progress = Math.min(uv / 12, 1); // Cap at UV 12
        const dashoffset = 565.48 * (1 - progress);
        uvRingProgress.style.strokeDashoffset = dashoffset;
        uvRingProgress.style.stroke = riskInfo.color;
    }
    
    // Update message
    if (uvMessage) {
        uvMessage.textContent = riskInfo.message;
    }
    
    // Show/hide alert
    if (uvAlert) {
        if (uv >= 6) {
            uvAlert.classList.add('show');
            if (alertTitle) alertTitle.textContent = riskInfo.alertTitle;
            if (alertMessage) alertMessage.textContent = riskInfo.alertMessage;
        } else {
            uvAlert.classList.remove('show');
        }
    }
    
    // Update recommendations
    if (recList) {
        recList.innerHTML = riskInfo.recommendations
            .map(rec => `<li>${rec}</li>`)
            .join('');
    }
}

/**
 * Get UV risk information based on UV index
 */
function getUVRiskInfo(uv) {
    if (typeof uv !== 'number') {
        return {
            level: 'Unknown',
            class: '',
            color: '#A0A0B0',
            textColor: '#0A0A0F',
            message: 'Unable to retrieve UV data',
            alertTitle: '',
            alertMessage: '',
            recommendations: ['Please try again later']
        };
    }
    
    if (uv <= 2) {
        return {
            level: 'Low',
            class: 'low',
            color: '#2DC653',
            textColor: '#0A0A0F',
            message: 'Low UV levels. Minimal sun protection needed for most people.',
            alertTitle: '',
            alertMessage: '',
            recommendations: [
                'Wear sunglasses on bright days',
                'Use sunscreen if you burn easily',
                'Enjoy outdoor activities safely'
            ]
        };
    } else if (uv <= 5) {
        return {
            level: 'Moderate',
            class: 'moderate',
            color: '#F9C74F',
            textColor: '#0A0A0F',
            message: 'Moderate UV levels. Sun protection recommended during midday hours.',
            alertTitle: '',
            alertMessage: '',
            recommendations: [
                'Apply SPF 30+ sunscreen',
                'Wear protective clothing and hat',
                'Seek shade during peak hours (10am-2pm)',
                'Wear UV-blocking sunglasses'
            ]
        };
    } else if (uv <= 7) {
        return {
            level: 'High',
            class: 'high',
            color: '#F8961E',
            textColor: '#0A0A0F',
            message: 'High UV levels. Protection is essential. Reduce sun exposure between 10am and 2pm.',
            alertTitle: '⚠️ High UV Warning',
            alertMessage: 'UV levels are high. Take protective measures to avoid skin damage.',
            recommendations: [
                'Apply SPF 50+ sunscreen every 2 hours',
                'Wear long-sleeved clothing and wide-brimmed hat',
                'Seek shade whenever possible',
                'Avoid direct sun during peak hours',
                'Wear UV400 sunglasses'
            ]
        };
    } else if (uv <= 10) {
        return {
            level: 'Very High',
            class: 'very-high',
            color: '#F3722C',
            textColor: '#FFFFFF',
            message: 'Very high UV levels. Extra protection needed. Unprotected skin can burn in minutes.',
            alertTitle: '🔴 Very High UV Alert',
            alertMessage: 'Unprotected skin and eyes can burn quickly. Take extra precautions!',
            recommendations: [
                'Apply SPF 50+ sunscreen generously and often',
                'Cover up with protective clothing',
                'Stay in shade during 10am-4pm',
                'Wear a wide-brimmed hat and UV sunglasses',
                'Check UV levels before outdoor activities',
                'Limit time outdoors during peak UV'
            ]
        };
    } else {
        return {
            level: 'Extreme',
            class: 'extreme',
            color: '#9D4EDD',
            textColor: '#FFFFFF',
            message: 'Extreme UV levels! Avoid sun exposure. Unprotected skin can burn in just a few minutes.',
            alertTitle: '🚨 Extreme UV Danger',
            alertMessage: 'UV levels are dangerous. Avoid outdoor exposure if possible!',
            recommendations: [
                'AVOID sun exposure between 10am-4pm',
                'Apply SPF 50+ sunscreen every hour if outdoors',
                'Wear full coverage clothing and hat',
                'Stay indoors or in full shade',
                'Wear high-quality UV-blocking sunglasses',
                'Postpone outdoor activities if possible'
            ]
        };
    }
}

/**
 * Load UV data for Australian cities
 */
async function loadCitiesUV() {
    try {
        const response = await fetch('/api/uv/cities');
        const cities = await response.json();
        
        const citiesGrid = document.getElementById('cities-grid');
        if (!citiesGrid) return;
        
        citiesGrid.innerHTML = cities.map(city => {
            const riskInfo = getUVRiskInfo(city.uv);
            return `
                <div class="city-item">
                    <div class="city-uv" style="background: ${riskInfo.color}; color: ${riskInfo.textColor}">
                        ${Math.round(city.uv * 10) / 10}
                    </div>
                    <div>
                        <div class="city-name">${city.city}</div>
                        <div class="city-risk">${riskInfo.level}</div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading cities UV:', error);
    }
}

/**
 * Load skin types data
 */
async function loadSkinTypes() {
    try {
        const response = await fetch('/api/skin-types');
        skinTypesData = await response.json();
        renderSkinTypes();
        renderAbsorptionInfo();
    } catch (error) {
        console.error('Error loading skin types:', error);
    }
}

/**
 * Render skin type selector
 */
function renderSkinTypes() {
    const grid = document.getElementById('skin-types-grid');
    if (!grid || !skinTypesData) return;
    
    grid.innerHTML = skinTypesData.types.map(type => `
        <button class="skin-type-btn" data-type="${type.id}">
            <div class="skin-color-circle" style="background: ${type.color}"></div>
            <span class="skin-type-name">${type.name}</span>
            <span class="skin-type-desc">${type.description}</span>
        </button>
    `).join('');
    
    // Add click handlers
    grid.querySelectorAll('.skin-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove previous selection
            grid.querySelectorAll('.skin-type-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            
            const typeId = parseInt(btn.dataset.type);
            showSkinResult(typeId);
        });
    });
}

/**
 * Show skin type result
 */
function showSkinResult(typeId) {
    const resultContainer = document.getElementById('skin-result');
    if (!resultContainer || !skinTypesData) return;
    
    const skinType = skinTypesData.types.find(t => t.id === typeId);
    if (!skinType) return;
    
    // Determine sensitivity class
    let sensitivityClass = 'moderate';
    if (skinType.risk_level >= 4) sensitivityClass = 'high';
    else if (skinType.risk_level <= 1.5) sensitivityClass = 'low';
    
    resultContainer.innerHTML = `
        <div class="result-content">
            <div class="result-header">
                <div class="skin-color-circle" style="background: ${skinType.color}"></div>
                <div class="result-title">
                    <h3>${skinType.name} - ${skinType.description}</h3>
                    <p>${skinType.characteristics}</p>
                </div>
            </div>
            
            <div class="result-sensitivity">
                <span class="sensitivity-badge ${sensitivityClass}">UV Sensitivity: ${skinType.uv_sensitivity}</span>
                <p style="color: var(--text-secondary); margin-top: 8px;">
                    ${skinType.tan_ability}
                </p>
            </div>
            
            <div class="result-details">
                <div class="detail-item">
                    <label>Burn Time (UV 6)</label>
                    <span>${skinType.burn_time_uv6}</span>
                </div>
                <div class="detail-item">
                    <label>Recommended SPF</label>
                    <span>${skinType.spf_recommendation}</span>
                </div>
            </div>
            
            <div class="result-advice">
                <h4>☀️ Protection Recommendations</h4>
                <ul class="advice-list">
                    ${skinType.protection_advice.map(advice => `<li>${advice}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}

/**
 * Render UV absorption information
 */
function renderAbsorptionInfo() {
    const content = document.getElementById('absorption-content');
    if (!content || !skinTypesData) return;
    
    const info = skinTypesData.uv_absorption_info;
    
    content.innerHTML = `
        <p class="info-explanation">${info.explanation}</p>
        <div class="info-points">
            ${info.key_points.map(point => `
                <div class="info-point">
                    <span>${point}</span>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Load cancer statistics
 */
async function loadCancerStatistics() {
    try {
        const response = await fetch('/api/statistics/cancer');
        cancerData = await response.json();
        renderKeyFacts();
    } catch (error) {
        console.error('Error loading cancer statistics:', error);
    }
}

/**
 * Render key facts
 */
function renderKeyFacts() {
    const container = document.getElementById('key-facts');
    if (!container || !cancerData) return;
    
    container.innerHTML = cancerData.key_facts.map(fact => `
        <div class="fact-item">${fact}</div>
    `).join('');
}

/**
 * Load UV trends data
 */
async function loadUVTrends() {
    try {
        const response = await fetch('/api/statistics/uv-trends');
        uvTrendsData = await response.json();
    } catch (error) {
        console.error('Error loading UV trends:', error);
    }
}

/**
 * Load sun protection data
 */
async function loadSunProtectionData() {
    try {
        const response = await fetch('/api/statistics/sun-protection');
        sunProtectionData = await response.json();
    } catch (error) {
        console.error('Error loading sun protection data:', error);
    }
}

/**
 * Initialize all charts
 */
function initCharts() {
    // Chart.js default config
    Chart.defaults.color = '#A0A0B0';
    Chart.defaults.font.family = "'DM Sans', sans-serif";
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    
    initIncidenceChart();
    initStateChart();
    initUVTrendsChart();
    initAgeChart();
    initProtectionChart();
}

/**
 * Initialize melanoma incidence chart
 */
function initIncidenceChart() {
    const ctx = document.getElementById('incidence-chart');
    if (!ctx || !cancerData) return;
    
    const data = cancerData.melanoma_incidence.data;
    
    incidenceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.year),
            datasets: [
                {
                    label: 'Male',
                    data: data.map(d => d.male),
                    borderColor: '#F3722C',
                    backgroundColor: 'rgba(243, 114, 44, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Female',
                    data: data.map(d => d.female),
                    borderColor: '#4CC9F0',
                    backgroundColor: 'rgba(76, 201, 240, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Total',
                    data: data.map(d => d.total),
                    borderColor: '#F9C74F',
                    backgroundColor: 'transparent',
                    borderDash: [5, 5],
                    tension: 0.3,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    title: {
                        display: true,
                        text: 'Rate per 100,000'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

/**
 * Initialize state chart
 */
function initStateChart() {
    const ctx = document.getElementById('state-chart');
    if (!ctx || !cancerData) return;
    
    const data = cancerData.by_state.data;
    
    // Color gradient based on rate
    const colors = data.map(d => {
        if (d.rate >= 60) return '#9D4EDD';
        if (d.rate >= 50) return '#F3722C';
        if (d.rate >= 45) return '#F8961E';
        return '#F9C74F';
    });
    
    stateChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.state),
            datasets: [{
                label: 'Incidence Rate',
                data: data.map(d => d.rate),
                backgroundColor: colors,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        afterLabel: (context) => {
                            const stateData = data[context.dataIndex];
                            return `Cases: ${stateData.cases.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    title: {
                        display: true,
                        text: 'Rate per 100,000'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

/**
 * Initialize UV trends chart
 */
function initUVTrendsChart() {
    const ctx = document.getElementById('uv-trends-chart');
    if (!ctx || !uvTrendsData) return;
    
    // Default to all cities
    updateUVTrendsChart('all');
}

/**
 * Update UV trends chart based on city selection
 */
function updateUVTrendsChart(city) {
    const ctx = document.getElementById('uv-trends-chart');
    if (!ctx || !uvTrendsData) return;
    
    // Destroy existing chart
    if (uvTrendsChart) {
        uvTrendsChart.destroy();
    }
    
    const datasets = [];
    const cityColors = {
        Sydney: '#E85D04',
        Melbourne: '#0077B6',
        Brisbane: '#F48C06',
        Perth: '#2DC653',
        Adelaide: '#9D4EDD',
        Hobart: '#4CC9F0',
        Darwin: '#D00000',
        Canberra: '#F9C74F'
    };
    
    if (city === 'all') {
        // Show all cities
        uvTrendsData.cities.forEach(cityName => {
            datasets.push({
                label: cityName,
                data: uvTrendsData.data[cityName],
                borderColor: cityColors[cityName],
                backgroundColor: 'transparent',
                tension: 0.3,
                pointRadius: 3,
                pointHoverRadius: 5,
                borderWidth: 2
            });
        });
    } else {
        // Show single city with filled area
        datasets.push({
            label: city,
            data: uvTrendsData.data[city],
            borderColor: cityColors[city],
            backgroundColor: `${cityColors[city]}20`,
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 3
        });
    }
    
    // Add harmful threshold line
    datasets.push({
        label: 'Harmful Threshold (UV 6)',
        data: Array(12).fill(6),
        borderColor: '#F8961E',
        borderDash: [10, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: false
    });
    
    uvTrendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: uvTrendsData.months,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        afterLabel: (context) => {
                            const uv = context.raw;
                            if (uv >= 11) return '⚠️ Extreme';
                            if (uv >= 8) return '⚠️ Very High';
                            if (uv >= 6) return '⚠️ High';
                            if (uv >= 3) return 'Moderate';
                            return 'Low';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 16,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    title: {
                        display: true,
                        text: 'UV Index'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

/**
 * Initialize age risk chart
 */
function initAgeChart() {
    const ctx = document.getElementById('age-chart');
    if (!ctx || !cancerData) return;
    
    const data = cancerData.by_age.data;
    
    // Create gradient colors
    const colors = data.map((d, i) => {
        const intensity = (i / data.length);
        return `rgba(243, 114, 44, ${0.4 + intensity * 0.6})`;
    });
    
    ageChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.age),
            datasets: [{
                label: 'Incidence Rate',
                data: data.map(d => d.rate),
                backgroundColor: colors,
                borderRadius: 6
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
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    title: {
                        display: true,
                        text: 'Rate per 100,000'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Age Group'
                    }
                }
            }
        }
    });
}

/**
 * Initialize protection behaviours chart
 */
function initProtectionChart() {
    const ctx = document.getElementById('protection-chart');
    if (!ctx || !sunProtectionData) return;
    
    const behaviours = sunProtectionData.behaviours;
    const labels = ['Sunscreen', 'Clothing', 'Seek Shade', 'Hat', 'Sunglasses'];
    const data = [
        behaviours.sunscreen_use.always + behaviours.sunscreen_use.often,
        behaviours.protective_clothing.always + behaviours.protective_clothing.often,
        behaviours.seek_shade.always + behaviours.seek_shade.often,
        behaviours.hat_use.always + behaviours.hat_use.often,
        behaviours.sunglasses_use.always + behaviours.sunglasses_use.often
    ];
    
    protectionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#E85D04',
                    '#F48C06',
                    '#FFBA08',
                    '#2DC653',
                    '#0077B6'
                ],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            return `${context.label}: ${context.raw.toFixed(1)}%`;
                        }
                    }
                }
            }
        }
    });
}
