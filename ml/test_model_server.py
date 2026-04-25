import os

import pytest
from fastapi.testclient import TestClient


def _has_artifacts() -> bool:
    paths = [
        os.getenv("ML_MODEL_PATH", "./ml/saved_model/best_xgboost_delay_model.pkl"),
        os.getenv("ML_LABEL_ENCODER_PATH", "./ml/saved_model/label_encoder.pkl"),
        os.getenv("ML_FEATURE_ENGINEER_PATH", "./ml/saved_model/feature_engineer.pkl"),
        os.getenv("ML_PREPROCESSOR_PATH", "./ml/saved_model/preprocessor.pkl"),
    ]
    return all(os.path.exists(p) for p in paths)


@pytest.mark.skipif(not _has_artifacts(), reason="Model artifacts not found")
def test_health_ok():
    from ml.model_server import app  # noqa: WPS433

    with TestClient(app) as c:
        r = c.get("/health")
        assert r.status_code == 200
        j = r.json()
        assert "ok" in j


@pytest.mark.skipif(not _has_artifacts(), reason="Model artifacts not found")
def test_predict_valid_schema():
    from ml.model_server import app  # noqa: WPS433

    payload = {
        "Job_Type": "Brochures",
        "Quantity": 500,
        "Color_Type": "Full Color",
        "Material_Type": "Glossy Paper",
        "Order_Request_Date": "2025-04-01",
        "Requested_Deadline_Date": "2025-04-04",
        "Assigned_Date": "2025-04-02",
        "Estimated_End_Date": "2025-04-05",
        "Current_Queued_Jobs_Count": 80,
        "Active_Machines_Count": 4,
        "Total_Machines_Count": 6,
        "Available_Staff_Count": 3,
        "Total_Staff_Count": 8,
        "Priority": "Urgent",
        "Assigned_Machine_Workload": 85,
        "Assigned_Operator_Workload": 90,
    }
    with TestClient(app) as c:
        r = c.post("/predict", json=payload)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["delay_risk_label"] in ["High", "Low", "Medium"]
        assert j["delay_risk_class"] in [0, 1, 2]
        assert set(j["probabilities"].keys()) >= {"High", "Low", "Medium"}
        assert j["is_high_risk"] is (j["delay_risk_label"] == "High")
        assert 0.0 <= float(j["confidence"]) <= 1.0


@pytest.mark.skipif(not _has_artifacts(), reason="Model artifacts not found")
def test_predict_missing_required_field_422():
    from ml.model_server import app  # noqa: WPS433

    with TestClient(app) as c:
        r = c.post("/predict", json={"Quantity": 10})
        assert r.status_code == 422


@pytest.mark.skipif(not _has_artifacts(), reason="Model artifacts not found")
def test_predict_invalid_date_422():
    from ml.model_server import app  # noqa: WPS433

    payload = {
        "Job_Type": "Brochures",
        "Quantity": 500,
        "Color_Type": "Full Color",
        "Material_Type": "Glossy Paper",
        "Order_Request_Date": "not-a-date",
        "Requested_Deadline_Date": "2025-04-04",
        "Assigned_Date": "2025-04-02",
        "Estimated_End_Date": "2025-04-05",
        "Current_Queued_Jobs_Count": 80,
        "Active_Machines_Count": 4,
        "Total_Machines_Count": 6,
        "Available_Staff_Count": 3,
        "Total_Staff_Count": 8,
        "Priority": "Urgent",
        "Assigned_Machine_Workload": 85,
        "Assigned_Operator_Workload": 90,
    }
    with TestClient(app) as c:
        r = c.post("/predict", json=payload)
        assert r.status_code == 422


@pytest.mark.skipif(not _has_artifacts(), reason="Model artifacts not found")
def test_predict_illogical_date_order_still_processes():
    from ml.model_server import app  # noqa: WPS433

    payload = {
        "Job_Type": "Brochures",
        "Quantity": 500,
        "Color_Type": "Full Color",
        "Material_Type": "Glossy Paper",
        "Order_Request_Date": "2025-04-03",
        "Requested_Deadline_Date": "2025-04-04",
        "Assigned_Date": "2025-04-01",  # before request (illogical, but model can handle negative)
        "Estimated_End_Date": "2025-04-02",
        "Current_Queued_Jobs_Count": 80,
        "Active_Machines_Count": 4,
        "Total_Machines_Count": 6,
        "Available_Staff_Count": 3,
        "Total_Staff_Count": 8,
        "Priority": "Urgent",
        "Assigned_Machine_Workload": 85,
        "Assigned_Operator_Workload": 90,
    }
    with TestClient(app) as c:
        r = c.post("/predict", json=payload)
        assert r.status_code == 200, r.text


@pytest.mark.skipif(not _has_artifacts(), reason="Model artifacts not found")
def test_reload_ok():
    from ml.model_server import app  # noqa: WPS433

    with TestClient(app) as c:
        r = c.post("/reload")
        assert r.status_code == 200
        assert r.json().get("ok") is True

