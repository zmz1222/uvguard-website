# UVGuard - UV Awareness Website

A web-based platform designed to help young adults understand UV exposure risks and promote better sun-protection behaviour in Australia.

## Features

### Epic 1 - Track UV Levels
- Real-time UV index based on user location
- Color-coded UV risk indicators (Low, Moderate, High, Very High, Extreme)
- Human-language warnings when UV levels are high
- Protective action recommendations

### Epic 2 - Raise Awareness
- Melanoma incidence trends in Australia (1982-2017)
- Melanoma statistics by state/territory
- Monthly UV index trends for 8 Australian capital cities
- Age-based melanoma risk visualization
- Sun protection behaviours survey data (ABS 2023-2024)

### Epic 3 - Skin Colour Customisation
- Select from 6 skin types (Fitzpatrick scale)
- UV absorption information for each skin tone
- Personalized sun protection recommendations
- Burn time and SPF recommendations

## Data Sources

Based on the **Onboarding Open Dataset**:
- Cancer Australia - Melanoma statistics
- Australian Institute of Health and Welfare - Cancer incidence/mortality
- Bureau of Meteorology / data.gov.au - UV index data
- Australian Bureau of Statistics - Sun protection behaviours survey
- OpenWeatherMap API - Real-time UV index

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript, Chart.js
- **Backend**: Node.js, Express.js
- **API**: OpenWeatherMap One Call API 3.0

## Setup & Installation

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. Clone or download the project

2. Navigate to the project directory:
```bash
cd onboarding
```

3. Install dependencies:
```bash
npm install
```

4. (Optional) Set your OpenWeatherMap API key:
```bash
# Windows PowerShell
$env:OPENWEATHER_API_KEY="your-api-key"

# Windows CMD
set OPENWEATHER_API_KEY=your-api-key

# Linux/Mac
export OPENWEATHER_API_KEY=your-api-key
```

5. Start the server:
```bash
npm start
```

6. Open your browser and visit:
```
http://localhost:3000
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/uv?lat=&lng=` | Get UV index for coordinates |
| `GET /api/uv/cities` | Get UV data for Australian capital cities |
| `GET /api/statistics/cancer` | Get cancer statistics |
| `GET /api/statistics/uv-trends` | Get UV trend data |
| `GET /api/statistics/sun-protection` | Get sun protection behaviour data |
| `GET /api/skin-types` | Get skin type information |

## Project Structure

```
onboarding/
├── package.json
├── server.js
├── README.md
└── public/
    ├── index.html
    ├── css/
    │   └── style.css
    └── js/
        └── main.js
```

## UV Index Scale

| UV Index | Risk Level | Protection |
|----------|------------|------------|
| 0-2 | Low | Minimal protection needed |
| 3-5 | Moderate | Protection recommended |
| 6-7 | High | Protection essential |
| 8-10 | Very High | Extra protection needed |
| 11+ | Extreme | Avoid sun exposure |

## License

MIT License

## Attribution

Data sourced from:
- Cancer Australia (CC BY 3.0 AU)
- Australian Institute of Health and Welfare
- Australian Bureau of Statistics (CC BY 3.0 AU)
- Bureau of Meteorology / data.gov.au (CC BY 2.5 AU)
- OpenWeatherMap (CC BY-SA 4.0)
