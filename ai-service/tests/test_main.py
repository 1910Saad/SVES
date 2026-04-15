import pytest
from fastapi.testclient import TestClient
from main import app, predict_crowd_trajectory, estimate_wait_time

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert "service" in response.json()

def test_predict_crowd_logic():
    # Test growth phase
    result = predict_crowd_trajectory(1000, 10000, 10, 120)
    assert result["trend"] == "increasing"
    assert result["predicted_15"] >= 0
    
    # Test exit phase
    result = predict_crowd_trajectory(8000, 10000, 110, 120)
    assert result["trend"] == "decreasing"

def test_wait_time_logic():
    # Empty queue
    result = estimate_wait_time(0, 5.0, 2)
    assert result["wait"] == 0.0
    
    # Busy queue
    result = estimate_wait_time(50, 2.0, 2) # 50 people, 4 served/min
    assert result["wait"] > 0
    assert result["status"] in ["busy", "critical"]

def test_api_predict_crowd():
    payload = {
        "current_attendance": 5000,
        "max_capacity": 50000,
        "event_time_elapsed": 30,
        "event_duration": 180
    }
    response = client.post("/predict/crowd", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "predicted_attendance_15min" in data
    assert "risk_level" in data
