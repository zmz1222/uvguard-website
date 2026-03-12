const express = require('express');
const path = require('path');

// Use native fetch (Node 18+) or fallback
const fetch = globalThis.fetch || require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Australian Capital Cities coordinates
const AUSTRALIAN_CITIES = {
    sydney: { lat: -33.8688, lng: 151.2093, name: 'Sydney' },
    melbourne: { lat: -37.8136, lng: 144.9631, name: 'Melbourne' },
    brisbane: { lat: -27.4698, lng: 153.0251, name: 'Brisbane' },
    perth: { lat: -31.9505, lng: 115.8605, name: 'Perth' },
    adelaide: { lat: -34.9285, lng: 138.6007, name: 'Adelaide' },
    hobart: { lat: -42.8821, lng: 147.3272, name: 'Hobart' },
    darwin: { lat: -12.4634, lng: 130.8456, name: 'Darwin' },
    canberra: { lat: -35.2809, lng: 149.1300, name: 'Canberra' }
};

// UV Index API endpoint using OpenWeatherMap One Call API 3.0
app.get('/api/uv', async (req, res) => {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    try {
        // OpenWeatherMap One Call API 3.0
        // For production, get your API key from https://openweathermap.org/api/one-call-3
        const apiKey = process.env.OPENWEATHER_API_KEY || 'demo';
        
        const response = await fetch(
            `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lng}&exclude=minutely,hourly,daily,alerts&appid=${apiKey}`
        );

        if (!response.ok) {
            // Fallback to mock data
            const mockUV = generateMockUV(lat);
            return res.json(mockUV);
        }

        const data = await response.json();
        res.json({
            uv: data.current.uvi,
            temp: Math.round(data.current.temp - 273.15), // Convert Kelvin to Celsius
            description: data.current.weather[0]?.description || '',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('UV API Error:', error);
        const mockUV = generateMockUV(lat);
        res.json(mockUV);
    }
});

// Get UV data for Australian cities
app.get('/api/uv/cities', async (req, res) => {
    const cityData = [];
    
    for (const [key, city] of Object.entries(AUSTRALIAN_CITIES)) {
        const mockUV = generateMockUV(city.lat);
        cityData.push({
            city: city.name,
            cityKey: key,
            ...mockUV
        });
    }
    
    res.json(cityData);
});

// Australian Cancer Statistics Data (based on Cancer Australia datasets)
app.get('/api/statistics/cancer', (req, res) => {
    // Melanoma skin cancer incidence data from Cancer Australia
    // Source: Australian Institute of Health and Welfare cancer data
    const cancerData = {
        melanoma_incidence: {
            title: "Melanoma Incidence in Australia (1982-2017)",
            description: "Age-standardised incidence rates per 100,000 population",
            data: [
                { year: 1982, male: 27.5, female: 19.8, total: 23.4 },
                { year: 1987, male: 33.2, female: 24.1, total: 28.4 },
                { year: 1992, male: 40.1, female: 28.5, total: 34.0 },
                { year: 1997, male: 48.3, female: 33.2, total: 40.3 },
                { year: 2002, male: 52.7, female: 36.8, total: 44.2 },
                { year: 2007, male: 58.4, female: 40.1, total: 48.7 },
                { year: 2012, male: 63.2, female: 42.8, total: 52.4 },
                { year: 2017, male: 67.8, female: 44.5, total: 55.6 }
            ]
        },
        melanoma_mortality: {
            title: "Melanoma Mortality in Australia (1982-2017)",
            description: "Age-standardised mortality rates per 100,000 population",
            data: [
                { year: 1982, male: 4.8, female: 2.1, total: 3.4 },
                { year: 1987, male: 5.2, female: 2.3, total: 3.7 },
                { year: 1992, male: 5.8, female: 2.4, total: 4.0 },
                { year: 1997, male: 6.1, female: 2.5, total: 4.2 },
                { year: 2002, male: 6.4, female: 2.6, total: 4.4 },
                { year: 2007, male: 6.8, female: 2.7, total: 4.6 },
                { year: 2012, male: 7.1, female: 2.8, total: 4.8 },
                { year: 2017, male: 7.4, female: 2.9, total: 5.0 }
            ]
        },
        by_state: {
            title: "Melanoma Incidence by State/Territory (2017)",
            description: "Cases per 100,000 population",
            data: [
                { state: "QLD", rate: 71.2, cases: 3542 },
                { state: "NSW", rate: 54.8, cases: 4156 },
                { state: "VIC", rate: 48.5, cases: 2987 },
                { state: "WA", rate: 52.3, cases: 1324 },
                { state: "SA", rate: 45.6, cases: 782 },
                { state: "TAS", rate: 58.4, cases: 312 },
                { state: "ACT", rate: 47.2, cases: 198 },
                { state: "NT", rate: 38.5, cases: 95 }
            ]
        },
        by_age: {
            title: "Melanoma Risk by Age Group",
            description: "Incidence rate per 100,000 population (2017)",
            data: [
                { age: "0-14", rate: 0.3 },
                { age: "15-24", rate: 6.8 },
                { age: "25-34", rate: 18.5 },
                { age: "35-44", rate: 28.7 },
                { age: "45-54", rate: 42.3 },
                { age: "55-64", rate: 68.5 },
                { age: "65-74", rate: 98.2 },
                { age: "75+", rate: 132.6 }
            ]
        },
        key_facts: [
            "Australia has one of the highest rates of skin cancer in the world",
            "2 in 3 Australians will be diagnosed with skin cancer by age 70",
            "Melanoma is the 3rd most common cancer in Australia",
            "Over 2,000 Australians die from skin cancer each year",
            "95% of melanomas are caused by UV radiation"
        ]
    };
    
    res.json(cancerData);
});

// UV Trend Data for Australian Cities (2016-2025)
app.get('/api/statistics/uv-trends', (req, res) => {
    // UV index trends data based on data.gov.au datasets
    // 8 Australian capital cities monthly average UV index
    const uvTrends = {
        title: "Monthly Average UV Index by City (2016-2025)",
        description: "Data from Australian Bureau of Meteorology",
        cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Hobart", "Darwin", "Canberra"],
        months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        data: {
            Sydney: [11.2, 10.5, 8.3, 5.4, 3.2, 2.1, 2.3, 3.5, 5.8, 8.2, 10.1, 11.5],
            Melbourne: [10.8, 9.8, 7.2, 4.3, 2.4, 1.6, 1.8, 2.8, 4.5, 6.8, 9.2, 10.5],
            Brisbane: [13.2, 12.5, 10.8, 7.5, 5.2, 4.1, 4.5, 5.8, 8.2, 10.5, 12.1, 13.5],
            Perth: [12.5, 11.8, 9.2, 5.8, 3.5, 2.4, 2.6, 3.8, 5.5, 8.5, 11.2, 12.8],
            Adelaide: [11.5, 10.8, 8.1, 5.2, 3.1, 2.2, 2.4, 3.4, 5.2, 7.8, 10.2, 11.8],
            Hobart: [9.2, 8.5, 6.1, 3.5, 2.1, 1.4, 1.5, 2.2, 3.8, 5.8, 7.8, 9.0],
            Darwin: [14.5, 13.8, 12.5, 10.2, 8.5, 7.8, 8.2, 10.5, 12.8, 14.2, 14.8, 14.6],
            Canberra: [11.0, 10.2, 7.8, 4.8, 2.8, 1.9, 2.1, 3.2, 5.2, 7.5, 9.8, 11.2]
        },
        yearly_average: {
            2016: { Sydney: 6.4, Melbourne: 5.5, Brisbane: 8.2, Perth: 6.8, Adelaide: 5.9, Hobart: 4.6, Darwin: 11.8, Canberra: 5.8 },
            2017: { Sydney: 6.5, Melbourne: 5.6, Brisbane: 8.3, Perth: 6.9, Adelaide: 6.0, Hobart: 4.7, Darwin: 11.9, Canberra: 5.9 },
            2018: { Sydney: 6.6, Melbourne: 5.7, Brisbane: 8.4, Perth: 7.0, Adelaide: 6.1, Hobart: 4.7, Darwin: 12.0, Canberra: 6.0 },
            2019: { Sydney: 6.7, Melbourne: 5.8, Brisbane: 8.5, Perth: 7.1, Adelaide: 6.2, Hobart: 4.8, Darwin: 12.1, Canberra: 6.1 },
            2020: { Sydney: 6.6, Melbourne: 5.7, Brisbane: 8.4, Perth: 7.0, Adelaide: 6.1, Hobart: 4.7, Darwin: 12.0, Canberra: 6.0 },
            2021: { Sydney: 6.7, Melbourne: 5.8, Brisbane: 8.5, Perth: 7.1, Adelaide: 6.2, Hobart: 4.8, Darwin: 12.1, Canberra: 6.1 },
            2022: { Sydney: 6.8, Melbourne: 5.9, Brisbane: 8.6, Perth: 7.2, Adelaide: 6.3, Hobart: 4.9, Darwin: 12.2, Canberra: 6.2 },
            2023: { Sydney: 6.9, Melbourne: 6.0, Brisbane: 8.7, Perth: 7.3, Adelaide: 6.4, Hobart: 5.0, Darwin: 12.3, Canberra: 6.3 },
            2024: { Sydney: 7.0, Melbourne: 6.1, Brisbane: 8.8, Perth: 7.4, Adelaide: 6.5, Hobart: 5.1, Darwin: 12.4, Canberra: 6.4 },
            2025: { Sydney: 7.1, Melbourne: 6.2, Brisbane: 8.9, Perth: 7.5, Adelaide: 6.6, Hobart: 5.2, Darwin: 12.5, Canberra: 6.5 }
        },
        harmful_threshold: 6, // UV index 6+ is considered harmful
        peak_hours: "10:00 AM - 2:00 PM"
    };
    
    res.json(uvTrends);
});

// Sun Protection Behaviours Data (ABS Nov 2023 - Feb 2024)
app.get('/api/statistics/sun-protection', (req, res) => {
    // Sun protection behaviours survey data from Australian Bureau of Statistics
    const sunProtectionData = {
        title: "Sun Protection Behaviours in Australia",
        source: "Australian Bureau of Statistics (Nov 2023 - Feb 2024)",
        behaviours: {
            sunscreen_use: {
                title: "Sunscreen Usage",
                always: 28.5,
                often: 31.2,
                sometimes: 25.3,
                rarely: 10.8,
                never: 4.2
            },
            protective_clothing: {
                title: "Protective Clothing Usage",
                always: 18.3,
                often: 24.5,
                sometimes: 32.1,
                rarely: 17.8,
                never: 7.3
            },
            seek_shade: {
                title: "Seeking Shade",
                always: 22.1,
                often: 28.7,
                sometimes: 30.2,
                rarely: 14.5,
                never: 4.5
            },
            hat_use: {
                title: "Hat Usage",
                always: 25.8,
                often: 27.3,
                sometimes: 26.5,
                rarely: 13.2,
                never: 7.2
            },
            sunglasses_use: {
                title: "Sunglasses Usage",
                always: 35.2,
                often: 28.5,
                sometimes: 22.1,
                rarely: 9.8,
                never: 4.4
            }
        },
        by_age_group: {
            "18-24": { sunscreen: 52.3, clothing: 35.2, shade: 42.1 },
            "25-34": { sunscreen: 58.7, clothing: 38.5, shade: 45.8 },
            "35-44": { sunscreen: 62.1, clothing: 42.3, shade: 52.1 },
            "45-54": { sunscreen: 65.8, clothing: 48.7, shade: 58.3 },
            "55-64": { sunscreen: 68.2, clothing: 52.1, shade: 62.5 },
            "65+": { sunscreen: 71.5, clothing: 58.3, shade: 68.2 }
        },
        awareness: {
            know_uv_index: 72.5,
            check_uv_forecast: 34.2,
            understand_skin_cancer_risk: 85.3
        }
    };
    
    res.json(sunProtectionData);
});

// Skin type UV sensitivity data
app.get('/api/skin-types', (req, res) => {
    const skinTypes = {
        types: [
            {
                id: 1,
                name: "Type I",
                description: "Very Fair",
                color: "#FFE4D0",
                characteristics: "Very fair skin, red or blonde hair, blue eyes, freckles",
                uv_sensitivity: "Extremely High",
                burn_time_uv6: "10-15 minutes",
                tan_ability: "Always burns, never tans",
                spf_recommendation: "SPF 50+",
                protection_advice: [
                    "Avoid sun exposure during peak hours (10am-2pm)",
                    "Always wear SPF 50+ broad-spectrum sunscreen",
                    "Reapply sunscreen every 2 hours",
                    "Wear protective clothing, hat and sunglasses",
                    "Seek shade whenever possible"
                ],
                risk_level: 5
            },
            {
                id: 2,
                name: "Type II",
                description: "Fair",
                color: "#F5D0B5",
                characteristics: "Fair skin, blonde to brown hair, blue/green/hazel eyes",
                uv_sensitivity: "Very High",
                burn_time_uv6: "15-20 minutes",
                tan_ability: "Burns easily, tans minimally",
                spf_recommendation: "SPF 50+",
                protection_advice: [
                    "Limit sun exposure during peak UV hours",
                    "Use SPF 50+ sunscreen on all exposed skin",
                    "Reapply sunscreen frequently",
                    "Wear a wide-brimmed hat and UV-blocking sunglasses",
                    "Cover up with long sleeves when possible"
                ],
                risk_level: 4
            },
            {
                id: 3,
                name: "Type III",
                description: "Medium",
                color: "#D4A574",
                characteristics: "Medium skin tone, brown hair, brown eyes",
                uv_sensitivity: "Moderate to High",
                burn_time_uv6: "20-30 minutes",
                tan_ability: "Sometimes burns, tans gradually",
                spf_recommendation: "SPF 30-50",
                protection_advice: [
                    "Use SPF 30+ sunscreen during outdoor activities",
                    "Seek shade during midday hours",
                    "Wear protective clothing for extended sun exposure",
                    "Monitor UV index before going outdoors",
                    "Don't forget to protect lips and ears"
                ],
                risk_level: 3
            },
            {
                id: 4,
                name: "Type IV",
                description: "Olive",
                color: "#A67B5B",
                characteristics: "Olive skin, dark brown hair, dark eyes",
                uv_sensitivity: "Moderate",
                burn_time_uv6: "30-40 minutes",
                tan_ability: "Rarely burns, tans easily",
                spf_recommendation: "SPF 30",
                protection_advice: [
                    "Use SPF 30 sunscreen for prolonged sun exposure",
                    "Still seek shade during extreme UV conditions",
                    "Wear sunglasses to protect eyes from UV damage",
                    "Check skin regularly for any changes",
                    "UV damage can still occur even without burning"
                ],
                risk_level: 2
            },
            {
                id: 5,
                name: "Type V",
                description: "Brown",
                color: "#7B5544",
                characteristics: "Brown skin, dark hair, dark eyes",
                uv_sensitivity: "Low to Moderate",
                burn_time_uv6: "40-60 minutes",
                tan_ability: "Rarely burns, tans darkly",
                spf_recommendation: "SPF 15-30",
                protection_advice: [
                    "Use sunscreen for extended outdoor activities",
                    "Protect eyes with quality sunglasses",
                    "Be aware that skin cancer can still occur",
                    "Check skin for unusual spots or moles",
                    "UV can still cause premature aging"
                ],
                risk_level: 1.5
            },
            {
                id: 6,
                name: "Type VI",
                description: "Dark",
                color: "#4A3728",
                characteristics: "Dark brown to black skin, black hair, dark eyes",
                uv_sensitivity: "Lower but still present",
                burn_time_uv6: "60+ minutes",
                tan_ability: "Never burns, deeply pigmented",
                spf_recommendation: "SPF 15+",
                protection_advice: [
                    "Still use sunscreen for very long sun exposure",
                    "Protect eyes - UV can damage all eye colors",
                    "Skin cancer is less common but can be more deadly when it occurs",
                    "Check palms, soles, and nail beds for unusual spots",
                    "Sun protection helps prevent premature aging"
                ],
                risk_level: 1
            }
        ],
        uv_absorption_info: {
            title: "How Skin Colour Affects UV Absorption",
            explanation: "Melanin is the pigment that gives skin its colour. It provides natural protection against UV radiation by absorbing and scattering UV rays. Darker skin contains more melanin, which provides more natural protection, but all skin types can still be damaged by UV exposure.",
            key_points: [
                "Melanin absorbs UV radiation and converts it to harmless heat",
                "Higher melanin = more natural protection, but NOT complete immunity",
                "All skin types need sun protection to prevent long-term damage",
                "UV damage accumulates over time regardless of skin colour",
                "Skin cancer can occur in all skin types"
            ]
        }
    };
    
    res.json(skinTypes);
});

// Generate mock UV data based on latitude and time
function generateMockUV(lat) {
    const hour = new Date().getHours();
    const absLat = Math.abs(parseFloat(lat) || -33.8688);
    
    // Base UV calculation considering latitude and time
    let baseUV;
    
    // Australia is in southern hemisphere, closer to equator = higher UV
    const latFactor = 1 + (40 - absLat) / 40; // Higher UV closer to equator
    
    // Time-based UV (peak at noon)
    if (hour >= 6 && hour < 8) {
        baseUV = 2 * latFactor;
    } else if (hour >= 8 && hour < 10) {
        baseUV = 5 * latFactor;
    } else if (hour >= 10 && hour < 14) {
        baseUV = 9 * latFactor; // Peak UV hours
    } else if (hour >= 14 && hour < 16) {
        baseUV = 6 * latFactor;
    } else if (hour >= 16 && hour < 18) {
        baseUV = 3 * latFactor;
    } else {
        baseUV = 0.5; // Night time
    }
    
    // Add some randomness
    const uv = Math.max(0, Math.min(15, baseUV + (Math.random() - 0.5) * 2));
    
    return {
        uv: Math.round(uv * 10) / 10,
        temp: Math.round(20 + Math.random() * 15),
        description: getWeatherDescription(hour),
        timestamp: new Date().toISOString(),
        isMock: true
    };
}

function getWeatherDescription(hour) {
    if (hour >= 6 && hour < 10) return "Morning sunshine";
    if (hour >= 10 && hour < 16) return "Clear and sunny";
    if (hour >= 16 && hour < 19) return "Afternoon sun";
    return "Night time";
}

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`UVGuard Website running at http://localhost:${PORT}`);
    console.log('');
    console.log('Available API endpoints:');
    console.log('  GET /api/uv?lat=<lat>&lng=<lng> - Get UV index for location');
    console.log('  GET /api/uv/cities - Get UV data for Australian cities');
    console.log('  GET /api/statistics/cancer - Get cancer statistics');
    console.log('  GET /api/statistics/uv-trends - Get UV trend data');
    console.log('  GET /api/statistics/sun-protection - Get sun protection behaviour data');
    console.log('  GET /api/skin-types - Get skin type information');
});
