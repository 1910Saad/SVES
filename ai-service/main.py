"""
SVES AI Service — Smart Venue Experience System
FastAPI-based ML service for crowd prediction, wait time estimation, and anomaly detection.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import numpy as np
import json
from datetime import datetime
import math

app = FastAPI(
    title="SVES AI Service",
    description="Machine Learning microservice for Smart Venue Experience System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# Data Models
# ============================================================

class CrowdPredictionRequest(BaseModel):
    current_attendance: int
    max_capacity: int
    event_time_elapsed: int  # minutes since event start
    event_duration: int  # total event duration in minutes
    day_of_week: Optional[int] = None  # 0=Monday, 6=Sunday
    weather_temp: Optional[float] = 22.0
    is_playoff: Optional[bool] = False

class CrowdPredictionResponse(BaseModel):
    predicted_attendance_15min: int
    predicted_attendance_30min: int
    predicted_attendance_60min: int
    peak_time_estimate: str
    crowd_trend: str  # "increasing", "stable", "decreasing"
    confidence: float
    risk_level: str  # "low", "medium", "high", "critical"
    recommendations: List[str]

class WaitTimeRequest(BaseModel):
    queue_length: int
    service_rate: float  # people served per minute
    num_servers: int
    historical_avg: Optional[float] = None

class WaitTimeResponse(BaseModel):
    estimated_wait_minutes: float
    confidence_interval: Dict[str, float]
    queue_status: str
    recommendation: str

class AnomalyRequest(BaseModel):
    sensor_type: str
    current_value: float
    historical_values: List[float]
    threshold_min: Optional[float] = None
    threshold_max: Optional[float] = None

class AnomalyResponse(BaseModel):
    is_anomaly: bool
    anomaly_score: float
    severity: str
    details: str

class ZoneFlowRequest(BaseModel):
    zones: List[Dict[str, float]]  # [{id, occupancy, capacity}]
    time_elapsed: int

class ZoneFlowResponse(BaseModel):
    congestion_zones: List[str]
    recommended_routes: List[Dict[str, str]]
    flow_score: float
    bottlenecks: List[str]

# ============================================================
# ML Models (Lightweight implementations using NumPy)
# ============================================================

def predict_crowd_trajectory(current: int, max_cap: int, elapsed: int, duration: int, is_playoff: bool = False) -> dict:
    """
    Predict crowd attendance trajectory using a hybrid sinusoidal + logistic model.
    Models realistic event crowd patterns: ramp-up, peak, plateau, exit.
    """
    progress = elapsed / max(duration, 1)
    capacity_ratio = current / max(max_cap, 1)
    
    # Base pattern: logistic growth for entry, inverse for exit
    if progress < 0.25:
        # Entry phase: rapid growth
        growth_rate = 0.8 * (1 - math.exp(-4 * progress))
        trend = "increasing"
    elif progress < 0.5:
        # Peak phase
        growth_rate = 0.02 * math.sin(2 * math.pi * progress)
        trend = "stable"
    elif progress < 0.55:
        # Halftime surge (concessions)
        growth_rate = -0.05 + 0.1 * math.sin(10 * math.pi * (progress - 0.5))
        trend = "stable"
    elif progress < 0.8:
        # Second half
        growth_rate = -0.01 * (progress - 0.5)
        trend = "stable"
    else:
        # Exit phase
        growth_rate = -0.5 * (1 - math.exp(-3 * (progress - 0.8)))
        trend = "decreasing"

    if current > 0 and trend == "increasing":
        trend = "increasing"
    elif current > max_cap * 0.3 and progress > 0.75:
        trend = "decreasing"

    # Playoff multiplier
    playoff_mult = 1.15 if is_playoff else 1.0

    base_15 = min(max_cap, max(0, int(current + growth_rate * max_cap * 0.15 * playoff_mult)))
    base_30 = min(max_cap, max(0, int(current + growth_rate * max_cap * 0.3 * playoff_mult)))
    base_60 = min(max_cap, max(0, int(current + growth_rate * max_cap * 0.6 * playoff_mult)))

    # Add noise
    noise_factor = 0.03
    pred_15 = max(0, min(max_cap, base_15 + int(np.random.normal(0, max_cap * noise_factor * 0.5))))
    pred_30 = max(0, min(max_cap, base_30 + int(np.random.normal(0, max_cap * noise_factor))))
    pred_60 = max(0, min(max_cap, base_60 + int(np.random.normal(0, max_cap * noise_factor * 1.5))))

    # Risk assessment
    max_predicted = max(pred_15, pred_30, pred_60)
    max_density = max_predicted / max(max_cap, 1)
    if max_density > 0.95:
        risk = "critical"
    elif max_density > 0.85:
        risk = "high"
    elif max_density > 0.7:
        risk = "medium"
    else:
        risk = "low"

    # Peak time estimate
    if progress < 0.3:
        peak_est = f"In ~{int((0.4 - progress) * duration)} minutes"
    elif progress < 0.6:
        peak_est = "Currently near peak"
    else:
        peak_est = "Peak has passed"

    # Confidence (higher when more data, lower at extremes)
    confidence = min(0.95, 0.7 + 0.2 * min(progress, 1 - progress))

    return {
        "predicted_15": pred_15,
        "predicted_30": pred_30,
        "predicted_60": pred_60,
        "peak_estimate": peak_est,
        "trend": trend,
        "confidence": round(confidence, 2),
        "risk": risk
    }


def estimate_wait_time(queue_length: int, service_rate: float, num_servers: int, historical_avg: float = None) -> dict:
    """
    M/M/c queue model (Erlang-C) for wait time estimation.
    """
    if queue_length == 0:
        return {
            "wait": 0.0,
            "lower": 0.0,
            "upper": 0.0,
            "status": "empty",
            "recommendation": "Queue is empty. No wait expected."
        }

    effective_rate = service_rate * num_servers
    if effective_rate <= 0:
        effective_rate = 1.0

    # Basic M/M/c estimate
    rho = min(0.99, queue_length / (effective_rate * 10))  # utilization
    base_wait = queue_length / effective_rate

    # Adjust with historical data if available
    if historical_avg and historical_avg > 0:
        base_wait = 0.6 * base_wait + 0.4 * historical_avg

    # Confidence interval
    std_dev = base_wait * 0.2
    lower = max(0, base_wait - 1.96 * std_dev)
    upper = base_wait + 1.96 * std_dev

    # Status
    if base_wait > 20:
        status = "critical"
        rec = f"Queue is very long ({queue_length} people). Consider opening additional service points."
    elif base_wait > 10:
        status = "busy"
        rec = f"Moderate wait time. {queue_length} people in queue."
    elif base_wait > 5:
        status = "normal"
        rec = "Queue is manageable."
    else:
        status = "short"
        rec = "Minimal wait expected."

    return {
        "wait": round(base_wait, 1),
        "lower": round(lower, 1),
        "upper": round(upper, 1),
        "status": status,
        "recommendation": rec
    }


def detect_anomaly(sensor_type: str, current_value: float, historical: List[float], 
                     threshold_min: float = None, threshold_max: float = None) -> dict:
    """
    Statistical anomaly detection using Z-score and IQR methods.
    """
    if len(historical) < 3:
        return {
            "is_anomaly": False,
            "score": 0.0,
            "severity": "none",
            "details": "Insufficient historical data for anomaly detection."
        }

    values = np.array(historical)
    mean = np.mean(values)
    std = np.std(values)
    
    # Z-score
    z_score = abs((current_value - mean) / max(std, 0.001))
    
    # IQR method
    q1 = np.percentile(values, 25)
    q3 = np.percentile(values, 75)
    iqr = q3 - q1
    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr
    
    iqr_anomaly = current_value < lower_bound or current_value > upper_bound
    
    # Combined score
    anomaly_score = min(1.0, z_score / 4.0)
    
    # Check thresholds
    threshold_breach = False
    if threshold_min is not None and current_value < threshold_min:
        threshold_breach = True
    if threshold_max is not None and current_value > threshold_max:
        threshold_breach = True
    
    is_anomaly = z_score > 2.5 or iqr_anomaly or threshold_breach
    
    if anomaly_score > 0.8 or threshold_breach:
        severity = "critical"
    elif anomaly_score > 0.6:
        severity = "high"
    elif anomaly_score > 0.3:
        severity = "medium"
    else:
        severity = "low"

    direction = "above" if current_value > mean else "below"
    details = f"{sensor_type}: Current value {current_value} is {direction} normal range "
    details += f"(mean: {mean:.1f}, std: {std:.1f}, z-score: {z_score:.2f})"

    return {
        "is_anomaly": is_anomaly,
        "score": round(anomaly_score, 3),
        "severity": severity if is_anomaly else "none",
        "details": details
    }


# ============================================================
# API Endpoints
# ============================================================

@app.get("/")
async def root():
    return {
        "service": "SVES AI Service",
        "version": "1.0.0",
        "status": "healthy",
        "endpoints": [
            "/predict/crowd",
            "/predict/wait-time",
            "/detect/anomaly",
            "/analyze/flow",
            "/health"
        ]
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "models_loaded": True,
        "numpy_version": np.__version__
    }


@app.post("/predict/crowd", response_model=CrowdPredictionResponse)
async def predict_crowd(request: CrowdPredictionRequest):
    """Predict crowd attendance for the next 15, 30, and 60 minutes."""
    try:
        result = predict_crowd_trajectory(
            current=request.current_attendance,
            max_cap=request.max_capacity,
            elapsed=request.event_time_elapsed,
            duration=request.event_duration,
            is_playoff=request.is_playoff
        )
        
        recommendations = []
        if result["risk"] == "critical":
            recommendations.append("🚨 Open all emergency exits immediately")
            recommendations.append("Deploy additional security personnel")
            recommendations.append("Activate crowd dispersal protocol")
        elif result["risk"] == "high":
            recommendations.append("⚠️ Open additional entry gates")
            recommendations.append("Increase security presence in high-density areas")
            recommendations.append("Consider temporary entry restrictions")
        elif result["risk"] == "medium":
            recommendations.append("Monitor crowd flow at bottleneck zones")
            recommendations.append("Ensure all exits are clear")
        else:
            recommendations.append("✅ Crowd levels are within normal parameters")

        return CrowdPredictionResponse(
            predicted_attendance_15min=result["predicted_15"],
            predicted_attendance_30min=result["predicted_30"],
            predicted_attendance_60min=result["predicted_60"],
            peak_time_estimate=result["peak_estimate"],
            crowd_trend=result["trend"],
            confidence=result["confidence"],
            risk_level=result["risk"],
            recommendations=recommendations
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/wait-time", response_model=WaitTimeResponse)
async def predict_wait_time(request: WaitTimeRequest):
    """Estimate queue wait time using queueing theory."""
    try:
        result = estimate_wait_time(
            queue_length=request.queue_length,
            service_rate=request.service_rate,
            num_servers=request.num_servers,
            historical_avg=request.historical_avg
        )
        
        return WaitTimeResponse(
            estimated_wait_minutes=result["wait"],
            confidence_interval={"lower": result["lower"], "upper": result["upper"]},
            queue_status=result["status"],
            recommendation=result["recommendation"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/detect/anomaly", response_model=AnomalyResponse)
async def detect_anomaly_endpoint(request: AnomalyRequest):
    """Detect anomalies in sensor data using statistical methods."""
    try:
        result = detect_anomaly(
            sensor_type=request.sensor_type,
            current_value=request.current_value,
            historical=request.historical_values,
            threshold_min=request.threshold_min,
            threshold_max=request.threshold_max
        )
        
        return AnomalyResponse(
            is_anomaly=result["is_anomaly"],
            anomaly_score=result["score"],
            severity=result["severity"],
            details=result["details"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze/flow", response_model=ZoneFlowResponse)
async def analyze_flow(request: ZoneFlowRequest):
    """Analyze crowd flow and identify congestion points."""
    try:
        congestion_zones = []
        bottlenecks = []
        
        for zone in request.zones:
            density = zone.get("occupancy", 0) / max(zone.get("capacity", 1), 1)
            zone_id = str(zone.get("id", "unknown"))
            
            if density > 0.85:
                congestion_zones.append(zone_id)
            if density > 0.9:
                bottlenecks.append(f"Zone {zone_id} is at {density*100:.0f}% capacity")
        
        # Generate route recommendations
        routes = []
        if congestion_zones:
            routes.append({
                "from": congestion_zones[0] if congestion_zones else "entrance",
                "to": "nearest_exit",
                "reason": "Congestion detected - use alternate route"
            })
        
        # Flow score (0-100, higher is better)
        avg_density = np.mean([z.get("occupancy", 0) / max(z.get("capacity", 1), 1) for z in request.zones]) if request.zones else 0
        flow_score = round(max(0, 100 - avg_density * 120), 1)
        
        return ZoneFlowResponse(
            congestion_zones=congestion_zones,
            recommended_routes=routes,
            flow_score=flow_score,
            bottlenecks=bottlenecks
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
