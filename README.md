# 🏟️ SVES — Smart Venue Experience System

SVES is a real-time venue management platform built for the **PromptWars challenge**. It provides situational awareness for large-scale venues using AI-powered crowd predictions and IoT sensor monitoring.

## 🏁 Challenge Details
- **Chosen Vertical**: Smart Venue Management
- **Approach**: Modular microservices architecture combining real-time WebSocket streaming (Socket.io) with predictive AI analytics.
- **Logic**: Uses statistical models (logistic growth and M/M/c queueing theory) to transform raw sensor data into actionable throughput predictions.
- **Assumptions**: 1 simulation-minute = 2 real-world seconds (for demo acceleration).

## 🏗️ Project Architecture
- **Web Dashboard**: Next.js 15 frontend with real-time analytics and interactive venue heatmaps.
- **Backend API**: Node.js & Express server managing data persistence and WebSocket broadcasting.
- **AI Service**: Python FastAPI microservice dedicated to ML predictions and anomaly detection.
- **IoT Simulator**: Standalone Node.js worker simulating real-world sensor arrays.

## 🛠️ Tech Stack & Features
- **Frontend**: Next.js 15, Recharts (Data Viz), Lucide-React (Icons), Framer Motion (Animations), Socket.io-client.
- **Backend**: Node.js, Express, Socket.io (WebSockets), Mongoose (Optional MongoDB), Helmet & Rate-Limit (Security).
- **AI/ML**: Python 3.11, FastAPI, NumPy (Crowd trajectory and Queueing models).
- **Security**: JWT Authentication, Security Headers (Helmet), API Rate Limiting.
- **Accessibility**: ARIA labels and semantic HTML landmarks (main, nav, header) in the dashboard.

## 🧠 Implemented Logic
- **Crowd Trajectory**: Sinusoidal/Logistic model for predicting entry, peak, and exit patterns.
- **Wait-Time Estimation**: M/M/c queueing theory (Erlang-C) for restaurant and gate queue modeling.
- **Anomaly Detection**: Z-Score and Interquartile Range (IQR) analysis for flagging sensor spikes.
- **Flow Analysis**: Automated zone-density scoring for bottleneck identification.

## 🧪 Testing
- **AI Service**: Unit tests in `ai-service/tests` using `pytest`.
- **Backend**: Integration tests in `backend/tests` using `jest` and `supertest`.

## 🐳 Deployment & Cloud
The project is fully live on **Google Cloud Run**:
- **Microservices**: 4 Independent services scaled on Cloud Run.
- **Docker**: Multi-stage production builds for all components.
- **Build Flow**: `gcloud run deploy` with environment-variable injection.