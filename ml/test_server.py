import os

import pytest
from fastapi.testclient import TestClient


def _has_artifacts() -> bool:
    model_path = os.getenv("ML_MODEL_PATH", "./ai-service/best_xgboost_delay_model.pkl")
    enc_path = os.getenv("ML_TARGET_ENCODER_PATH", "./ai-service/label_encoder.pkl")
    return os.path.exists(model_path) and os.path.exists(enc_path)


@pytest.mark.skipif(not _has_artifacts(), reason="Model artifacts not found in this workspace")
def test_health_ok():
    from ml.model_server import app  # noqa: WPS433

    c = TestClient(app)
    r = c.get("/health")
    assert r.status_code == 200
    j = r.json()
    assert "ok" in j


@pytest.mark.skipif(not _has_artifacts(), reason="Model artifacts not found in this workspace")
def test_predict_valid_schema():
    from ml.model_server import app  # noqa: WPS433

    c = TestClient(app)
    payload = {
        "Order_Request_Date": "2024-03-01",
        "Assigned_Date": "2024-03-04",
        "Estimated_End_Date": "2024-03-11",
        "Quantity": 150,
        "Assigned_Machine_Workload": 75.0,
        "Assigned_Operator_Workload": 65.0,
        "Current_Queued_Jobs_Count": 5,
        "Priority": "Normal",
    }
    r = c.post("/predict", json=payload)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["delay_risk_label"] in ["High", "Low", "Medium"]
    assert j["delay_risk_class"] in [0, 1, 2]
    assert isinstance(j["probabilities"], dict)
    assert "confidence" in j


@pytest.mark.skipif(not _has_artifacts(), reason="Model artifacts not found in this workspace")
def test_predict_missing_field_422():
    from ml.model_server import app  # noqa: WPS433

    c = TestClient(app)
    r = c.post("/predict", json={"Quantity": 10})
    assert r.status_code == 422


@pytest.mark.skipif(not _has_artifacts(), reason="Model artifacts not found in this workspace")
def test_predict_invalid_date_422():
    from ml.model_server import app  # noqa: WPS433

    c = TestClient(app)
    payload = {
        "Order_Request_Date": "not-a-date",
        "Assigned_Date": "2024-03-04",
        "Estimated_End_Date": "2024-03-11",
        "Quantity": 150,
        "Assigned_Machine_Workload": 75.0,
        "Assigned_Operator_Workload": 65.0,
        "Current_Queued_Jobs_Count": 5,
        "Priority": "Normal",
    }
    r = c.post("/predict", json=payload)
    assert r.status_code == 422

