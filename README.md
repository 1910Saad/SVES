# 🏟️ SVES — Smart Venue Experience System

A real-time venue management platform that transforms the physical event experience at large-scale sporting venues through AI-powered crowd management, intelligent navigation, and seamless coordination.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-20+-green.svg)
![Python](https://img.shields.io/badge/python-3.11+-yellow.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)

## 🎯 Key Features

| Feature | Description |
|---------|-------------|
| 🗺️ **Live Venue Heatmap** | Real-time crowd density visualization across 17 venue zones |
| ⏱️ **Smart Queue Management** | AI-predicted wait times for concessions, restrooms, gates |
| 📊 **Predictive Analytics** | ML-powered crowd flow predictions & trajectory modeling |
| 📡 **IoT Sensor Dashboard** | Real-time monitoring of temperature, noise, air quality, occupancy |
| 🚨 **Alert System** | Automated & manual alerts with severity levels and zone targeting |
| 🧠 **AI/ML Engine** | Crowd prediction, anomaly detection, wait-time estimation (M/M/c model) |
| 🔄 **Real-Time Data** | Socket.IO WebSocket streaming with 2-second update intervals |
| 🔐 **JWT Authentication** | Secure API access with role-based permissions |

## 🏗️ Architecture

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  Next.js Dashboard  │────▶│  Node.js + Express   │────▶│  Python FastAPI  │
│  (Tailwind + React) │◀────│  + Socket.IO         │◀────│  AI/ML Service   │
│  Port: 3000         │     │  Port: 5000          │     │  Port: 8000      │
└─────────────────────┘     └──────────────────────┘     └─────────────────┘
                                     │                           │
                              ┌──────┴──────┐            ┌──────┴──────┐
                              │   MongoDB   │            │  Simulation │
                              │   Redis     │            │   Engine    │
                              └─────────────┘            └─────────────┘
```

## 📦 Tech Stack

| Layer | Technology | Cost |
|-------|-----------|------|
| Frontend | Next.js 15 + Tailwind CSS + Recharts | Free |
| Backend | Node.js + Express + Socket.IO | Free |
| AI/ML | Python + FastAPI + NumPy + Scikit-learn | Free |
| Database | MongoDB (Atlas 512MB free tier) | Free |
| Cache | Redis | Free |
| Maps | Leaflet.js + OpenStreetMap | Free |
| Auth | JWT + bcrypt | Free |
| Charts | Recharts | Free |
| Icons | Lucide React | Free |
| Animations | Framer Motion | Free |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.10+ (optional, for AI service)
- MongoDB (optional — runs without it in demo mode)

### 1. Clone & Install

```bash
git clone https://github.com/your-repo/SVES.git
cd SVES

# Install backend
cd backend && npm install

# Install frontend
cd ../web-dashboard && npm install
```

### 2. Start Backend (Terminal 1)

```bash
cd backend
npm run dev
```

> ✅ Server starts at http://localhost:5000
> ✅ Simulation engine auto-starts generating real-time data
> ⚠️ MongoDB is optional — runs in demo mode without it

### 3. Start Frontend (Terminal 2)

```bash
cd web-dashboard
npm run dev
```

> ✅ Dashboard opens at http://localhost:3000

### 4. (Optional) Start AI Service (Terminal 3)

```bash
cd ai-service
pip install -r requirements.txt
python main.py
```

> ✅ AI API at http://localhost:8000
> 📚 Swagger docs at http://localhost:8000/docs

### 5. (Optional) Start IoT Simulator (Terminal 4)

```bash
cd iot-simulator
node simulator.js
```

## 🐳 Docker Deployment

```bash
docker-compose up -d
```

Access:
- Dashboard: http://localhost:3000
- Backend API: http://localhost:5000
- AI Service: http://localhost:8000
- API Health: http://localhost:5000/api/health

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/demo` | Demo login (no DB needed) |
| GET | `/api/auth/me` | Get current user |

### Venue & Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/venues` | List all venues |
| GET | `/api/events` | List all events |
| GET | `/api/zones` | Get zone data |
| GET | `/api/queues` | Get queue data |
| GET | `/api/sensors` | Get sensor data |
| GET | `/api/alerts` | Get alerts |
| GET | `/api/analytics/dashboard` | Dashboard analytics |

### AI Service
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/predict/crowd` | Crowd attendance prediction |
| POST | `/predict/wait-time` | Queue wait time estimation |
| POST | `/detect/anomaly` | Sensor anomaly detection |
| POST | `/analyze/flow` | Crowd flow analysis |

## 🎮 Simulation Engine

The built-in simulation engine generates realistic venue data:

- **Crowd Movement**: Logistic growth model simulating entry/peak/halftime/exit patterns
- **Queue Dynamics**: Real-time queue lengths with auto-calculated wait times
- **Sensor Readings**: Temperature, humidity, noise, air quality, occupancy
- **Alert Generation**: Automatic alerts for crowd density, queue overflow, environmental thresholds
- **Event Timeline**: 4-hour simulated event cycle (1 sim-minute = 2 real seconds)

## 📁 Project Structure

```
SVES/
├── backend/                # Node.js Express API
│   └── src/
│       ├── server.js       # Express + Socket.IO server
│       ├── middleware/      # JWT auth
│       ├── models/          # MongoDB schemas
│       ├── routes/          # REST API routes
│       ├── sockets/         # WebSocket handlers
│       └── simulation/      # Real-time data generator
├── web-dashboard/          # Next.js 15 Dashboard
│   └── src/
│       ├── app/            # Pages & layouts
│       └── lib/            # Socket.IO hook
├── ai-service/             # Python FastAPI ML Service
│   ├── main.py             # API + ML models
│   └── requirements.txt
├── iot-simulator/          # IoT Device Simulator
│   └── simulator.js
├── docker-compose.yml      # Container orchestration
└── README.md
```

## 🔐 Security

- **Authentication**: JWT tokens with 7-day expiry
- **Password Hashing**: bcrypt with 12 salt rounds
- **CORS**: Configurable origin whitelist
- **Role-Based Access**: Admin, Operator, Attendee roles
- **API Protection**: Auth middleware on sensitive routes

## 📄 License

MIT License — free for educational and commercial use.