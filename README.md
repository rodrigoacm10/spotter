# Spotter AI — Weather-Aware Truck Routing

An intelligent dispatch and safe routing system for heavy commercial freight trucks. Spotter AI evaluates real-time weather forecasts (Open-Meteo), cargo weight stability rules (GVW), and temporal corridor evolution across a 0-to-48-hour planning window.

---

## 🏛 Architecture Overview

The project is structured as a monorepo with strict separation of concerns:

- **Frontend (`/frontend`)**:
  - React 19 + TypeScript + Vite
  - Material UI (MUI v7) with a responsive dark theme
  - MapLibre GL JS (`react-map-gl/maplibre`) for high-performance vector mapping
  - 0–48h temporal corridor slider with animated simulation (Play/Pause) and native GL risk heatmap
  - Debounced city autocomplete powered by OpenStreetMap Nominatim
- **Backend (`/backend`)**:
  - Python 3.12+ with Django 6 and Django REST Framework (DRF)
  - Domain-Driven Design (DDD) architecture with pure, decoupled domain models
  - OSRM integration providing 3 distinct route alternatives
  - Open-Meteo weather integration sampling checkpoints along each route at their exact transit ETA
  - Interactive OpenAPI 3.0 documentation (Swagger UI & ReDoc via `drf-spectacular`)
  - Automated test suite with `pytest` achieving **99% test coverage**

---

## 🛠️ Getting Started & Local Development

### Prerequisites
Ensure you have the following installed:
- **Python 3.12+**
- **Node.js 18+** and **npm**

---

### 1. Running the Backend (Django API)

Open a terminal at the project root:

#### a) Navigate to the backend directory:
```bash
cd backend
```

#### b) Create the environment configuration file:
```bash
cp .env.example .env
```
*(The defaults are already pre-configured for local development).*

#### c) Create and activate a Python virtual environment:
- **Linux/macOS:**
  ```bash
  python -m venv venv
  source venv/bin/activate
  ```
- **Windows (PowerShell):**
  ```powershell
  python -m venv venv
  .\venv\Scripts\Activate.ps1
  ```
- **Windows (Command Prompt):**
  ```cmd
  python -m venv venv
  .\venv\Scripts\activate.bat
  ```

#### d) Install dependencies:
```bash
pip install -r requirements.txt
```

#### e) Run database migrations (SQLite):
```bash
python manage.py migrate
```

#### f) Start the development server:
```bash
python manage.py runserver 8000
```

The backend API will be available at: **`http://127.0.0.1:8000`**

* **Interactive API Documentation & Endpoints:**
  - **Swagger UI:** `http://127.0.0.1:8000/api/docs/`
  - **ReDoc:** `http://127.0.0.1:8000/api/redoc/`
  - **OpenAPI Schema (JSON):** `http://127.0.0.1:8000/api/schema/`
  - **Health Check:** `http://127.0.0.1:8000/api/health/`

---

### 2. Running the Frontend (React + Vite)

Open a **second terminal** at the project root:

#### a) Navigate to the frontend directory:
```bash
cd frontend
```

#### b) Install npm dependencies:
```bash
npm install
```

#### c) Start the Vite development server:
```bash
npm run dev
```

Open your browser at:
👉 **`http://localhost:5173`**

> **Note on API Communication:**  
> The Vite development server is configured with a reverse proxy in `vite.config.ts`. All `/api/*` HTTP requests made by the frontend are seamlessly forwarded to `http://127.0.0.1:8000`, eliminating CORS issues during local development.

---

## 🧪 Running Automated Tests

### Backend Tests (`pytest`)

The backend includes a comprehensive automated test suite with **83 tests** and **~99% code coverage**:

```bash
cd backend
source venv/bin/activate  # or .\venv\Scripts\activate on Windows

# Run all tests with coverage report
pytest

# Run only unit tests (domain entities, risk rules, sampling, recommenders)
pytest -m unit

# Run integration tests (OSRM, Open-Meteo, Nominatim, DRF endpoints)
pytest -m integration

# Run end-to-end trip analysis tests
pytest -m e2e

# Validate OpenAPI schema contract without running the server
python manage.py spectacular --validate --fail-on-warn
```

### Frontend Type-Checking & Linting

```bash
cd frontend

# TypeScript compilation & production bundle validation
npm run build

# Run ESLint checks
npm run lint
```

---

## 📋 Business Logic & Risk Classification

### 1. Meteorological Thresholds per Checkpoint
| Condition | Low | Moderate | High | Severe | No Travel |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Wind Speed (mph)** | < 25 mph | 25 – 34 mph | 35 – 44 mph | 45 – 54 mph | ≥ 55 mph |
| **Rain (in/hr)** | < 0.10 in/hr | 0.10 – 0.25 in/hr | 0.25 – 0.50 in/hr | 0.50 – 1.00 in/hr | > 1.00 in/hr |
| **Snowfall (in/hr)** | < 0.5 in/hr | 0.5 – 1.0 in/hr | 1.0 – 2.0 in/hr | 2.0 – 3.0 in/hr | > 3.0 in/hr |

### 2. Cargo Load Weight Escalation Rules
- **Wind ≥ 55 mph:** Dispatches `No Travel` regardless of cargo weight.
- **Wind 45–54 mph + Load > 30,000 lbs:** Escalates to `No Travel`.
- **Wind 35–44 mph + Load > 40,000 lbs:** Escalates to `Severe`.

### 3. Route Recommendation Ranking Hierarchy
Routes are ranked and the best recommendation is chosen according to the following strict priority order:
1. Disqualification of routes with any `No Travel` sections (ranked last).
2. Fewest miles under `Severe` weather conditions.
3. Fewest miles under `High` weather conditions.
4. Lowest weighted average risk score (`average_risk_score`).
5. Shortest travel duration (`duration_seconds`).

---

## 📁 Repository Structure

```text
spotter/
├── backend/
│   ├── config/              # Django settings, URLs, WSGI/ASGI
│   ├── routing/             # Core routing application
│   │   ├── domain/          # Pure Domain-Driven Design (DDD) business logic
│   │   │   ├── entities.py  # Value objects and domain aggregates
│   │   │   ├── risk.py      # Weather thresholds and cargo weight escalation
│   │   │   ├── sampling.py  # Haversine distance sampling and ETA calculation
│   │   │   └── recommend.py # Multi-criteria route ranking algorithm
│   │   ├── integrations/    # External API clients (OSRM, Open-Meteo, Nominatim)
│   │   ├── services/        # Application orchestrators & use cases
│   │   ├── views.py         # REST API view endpoints
│   │   └── tests/           # Unit, Integration, and E2E test suite (99% coverage)
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── features/        # Feature-driven modular components
│   │   │   ├── route-map/       # MapLibre GL map, layers, and checkpoint popups
│   │   │   ├── trip-planning/   # Form, location autocomplete, cargo weight, route cards
│   │   │   ├── weather-timeline/# Heatmap layer, 0-48h slider, playback controls
│   │   │   └── checkpoints/     # Detailed checkpoint breakdown table modal
│   │   ├── services/        # API clients (Axios & TanStack Query)
│   │   ├── types/           # Shared TypeScript interfaces & types
│   │   └── App.tsx
│   ├── vite.config.ts
│   └── package.json
└── README.md
```
