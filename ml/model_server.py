"""
FastAPI model server for delay-risk prediction.

IMPORTANT for this repo:
- The uploaded joblib artifact references a custom transformer class saved as __main__.FeatureEngineer.
- To successfully unpickle it, this module must be executed as a script (python -m ml.model_server)
  so FeatureEngineer is available under the __main__ module name.

This service binds ONLY to 127.0.0.1 and should never be publicly exposed.
"""

from __future__ import annotations

import os
import time
from typing import Any, Dict, Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator


# ----------------------------
# Custom transformer (pickle dependency)
# ----------------------------
class FeatureEngineer:
    """
    Custom transformer used in the training pipeline.

    The exact fitted parameters (e.g., medians) are restored from the pickle state.
    This implementation focuses on deterministic, safe feature engineering during inference.
    """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        # accept any args/kwargs so unpickling never fails due to signature mismatch
        self._init_args = args
        self._init_kwargs = kwargs

    def fit(self, X: Any, y: Any = None) -> "FeatureEngineer":
        # If training ever calls this class again, compute medians as a fallback.
        df = pd.DataFrame(X).copy()
        num_cols = [
            "Quantity",
            "Assigned_Machine_Workload (%)",
            "Assigned_Operator_Workload (%)",
            "Current_Queued_Jobs_Count",
        ]
        med = {}
        for c in num_cols:
            if c in df.columns:
                med[c] = float(pd.to_numeric(df[c], errors="coerce").median())
        self.medians_ = med
        return self

    def transform(self, X: Any) -> pd.DataFrame:
        """
        The trained artifact is a sklearn Pipeline:
        - feature_engineering (this class) -> outputs 28 named columns
        - preprocessing (ColumnTransformer) expects those 28 columns (see /debug/model-signature)
        - model (XGBClassifier)

        This transformer therefore returns a DataFrame with the exact columns expected by the ColumnTransformer:
        [
          Job_Type, Quantity, Color_Type (BW / Full Color), Material_Type, Current_Queued_Jobs_Count,
          Active_Machines_Count, Total_Machines_Count, Available_Staff_Count, Total_Staff_Count, Priority,
          Assigned_Machine_Workload (%), Assigned_Operator_Workload (%),
          days_to_deadline, days_to_assign, production_days, deadline_buffer,
          order_month, order_dayofweek, is_weekend_order,
          machine_util_ratio, staff_util_ratio,
          queue_per_machine, queue_per_staff,
          avg_workload, high_workload_flag, tight_deadline_flag, is_urgent,
          log_quantity
        ]
        """
        df = pd.DataFrame(X).copy()

        # Parse dates if present
        for col in ("Order_Request_Date", "Requested_Deadline_Date", "Assigned_Date", "Estimated_End_Date"):
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors="coerce")

        # Ensure base columns exist (raw inputs)
        base_defaults = {
            "Job_Type": "other",
            "Color_Type (BW / Full Color)": "Full Color",
            "Material_Type": "Standard",
            "Priority": "Normal",
            "Active_Machines_Count": 1,
            "Total_Machines_Count": 1,
            "Available_Staff_Count": 1,
            "Total_Staff_Count": 1,
        }
        for k, v in base_defaults.items():
            if k not in df.columns:
                df[k] = v

        # Numeric inputs
        num_cols = [
            "Quantity",
            "Current_Queued_Jobs_Count",
            "Active_Machines_Count",
            "Total_Machines_Count",
            "Available_Staff_Count",
            "Total_Staff_Count",
            "Assigned_Machine_Workload (%)",
            "Assigned_Operator_Workload (%)",
        ]
        medians = getattr(self, "medians_", {}) or {}
        num_defaults = {
            "Quantity": float(medians.get("Quantity", 100.0)),
            "Current_Queued_Jobs_Count": float(medians.get("Current_Queued_Jobs_Count", 2.0)),
            "Active_Machines_Count": 1.0,
            "Total_Machines_Count": 1.0,
            "Available_Staff_Count": 1.0,
            "Total_Staff_Count": 1.0,
            "Assigned_Machine_Workload (%)": float(medians.get("Assigned_Machine_Workload (%)", 50.0)),
            "Assigned_Operator_Workload (%)": float(medians.get("Assigned_Operator_Workload (%)", 50.0)),
        }
        for c in num_cols:
            df[c] = pd.to_numeric(df.get(c), errors="coerce").fillna(num_defaults.get(c, 0.0))

        # If Requested_Deadline_Date isn't provided, use Estimated_End_Date as a proxy.
        if "Requested_Deadline_Date" not in df.columns or df["Requested_Deadline_Date"].isna().all():
            df["Requested_Deadline_Date"] = df.get("Estimated_End_Date")

        # Derived features
        df["days_to_deadline"] = (df["Requested_Deadline_Date"] - df["Order_Request_Date"]).dt.days
        df["days_to_assign"] = (df["Assigned_Date"] - df["Order_Request_Date"]).dt.days
        df["production_days"] = (df["Estimated_End_Date"] - df["Assigned_Date"]).dt.days
        df["deadline_buffer"] = (df["Requested_Deadline_Date"] - df["Estimated_End_Date"]).dt.days

        # Calendar features from request date
        df["order_month"] = df["Order_Request_Date"].dt.month
        df["order_dayofweek"] = df["Order_Request_Date"].dt.dayofweek
        df["is_weekend_order"] = df["order_dayofweek"].isin([5, 6]).astype(int)

        # Utilization ratios (match notebook exactly)
        # machine_util_ratio = Active_Machines_Count / Total_Machines_Count (0 -> NaN)
        df["machine_util_ratio"] = df["Active_Machines_Count"] / df["Total_Machines_Count"].replace(0, np.nan)
        # staff_util_ratio = (Total_Staff_Count - Available_Staff_Count) / Total_Staff_Count (0 -> NaN)
        df["staff_util_ratio"] = (df["Total_Staff_Count"] - df["Available_Staff_Count"]) / df["Total_Staff_Count"].replace(
            0, np.nan
        )

        df["queue_per_machine"] = df["Current_Queued_Jobs_Count"] / df["Active_Machines_Count"].replace(0, np.nan)
        df["queue_per_staff"] = df["Current_Queued_Jobs_Count"] / df["Available_Staff_Count"].replace(0, np.nan)
        df["avg_workload"] = (df["Assigned_Machine_Workload (%)"] + df["Assigned_Operator_Workload (%)"]) / 2.0
        df["high_workload_flag"] = (df["avg_workload"] >= 80.0).astype(int)
        df["tight_deadline_flag"] = (df["days_to_deadline"].fillna(9999) <= 3).astype(int)
        pr = df["Priority"].fillna("Normal").astype(str).str.strip()
        df["is_urgent"] = (pr == "Urgent").astype(int)
        df["log_quantity"] = np.log1p(df["Quantity"].clip(lower=0.0))

        # Fill any remaining NaNs in derived numeric features
        derived_num = [
            "days_to_deadline",
            "days_to_assign",
            "production_days",
            "deadline_buffer",
            "order_month",
            "order_dayofweek",
            "machine_util_ratio",
            "staff_util_ratio",
            "queue_per_machine",
            "queue_per_staff",
            "avg_workload",
            "log_quantity",
        ]
        for c in derived_num:
            df[c] = pd.to_numeric(df[c], errors="coerce").fillna(0.0)

        # Ensure exact output column order
        out_cols = [
            "Job_Type",
            "Quantity",
            "Color_Type (BW / Full Color)",
            "Material_Type",
            "Current_Queued_Jobs_Count",
            "Active_Machines_Count",
            "Total_Machines_Count",
            "Available_Staff_Count",
            "Total_Staff_Count",
            "Priority",
            "Assigned_Machine_Workload (%)",
            "Assigned_Operator_Workload (%)",
            "days_to_deadline",
            "days_to_assign",
            "production_days",
            "deadline_buffer",
            "order_month",
            "order_dayofweek",
            "is_weekend_order",
            "machine_util_ratio",
            "staff_util_ratio",
            "queue_per_machine",
            "queue_per_staff",
            "avg_workload",
            "high_workload_flag",
            "tight_deadline_flag",
            "is_urgent",
            "log_quantity",
        ]
        for c in out_cols:
            if c not in df.columns:
                df[c] = 0

        return df[out_cols]


# ----------------------------
# FastAPI app + schemas
# ----------------------------
class PredictRequest(BaseModel):
    Order_Request_Date: str = Field(..., description="ISO date string e.g. 2024-03-15")
    Requested_Deadline_Date: Optional[str] = Field(default=None, description="Optional customer requested deadline date")
    Assigned_Date: str = Field(..., description="ISO date string")
    Estimated_End_Date: str = Field(..., description="ISO date string")
    Quantity: float
    Assigned_Machine_Workload: float = Field(..., ge=0, le=100)
    Assigned_Operator_Workload: float = Field(..., ge=0, le=100)
    Current_Queued_Jobs_Count: int = Field(..., ge=0)
    Priority: str = Field(default="Normal")

    # Optional raw fields used by the trained pipeline (safe defaults applied if missing)
    Job_Type: Optional[str] = None
    Color_Type: Optional[str] = Field(default=None, description='\"BW\" or \"Full Color\" (optional)')
    Material_Type: Optional[str] = None
    Active_Machines_Count: Optional[int] = None
    Total_Machines_Count: Optional[int] = None
    Available_Staff_Count: Optional[int] = None
    Total_Staff_Count: Optional[int] = None

    @field_validator("Priority")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        s = (v or "Normal").strip()
        if s not in ("Normal", "Urgent"):
            raise ValueError('Priority must be "Normal" or "Urgent"')
        return s

    @field_validator("Order_Request_Date", "Requested_Deadline_Date", "Assigned_Date", "Estimated_End_Date")
    @classmethod
    def validate_date(cls, v: str) -> str:
        if v is None:
            return v
        try:
            dt = pd.to_datetime(v, errors="raise")
        except Exception as e:  # noqa: BLE001
            raise ValueError("Invalid date format") from e
        # Normalize to ISO-ish string
        return dt.date().isoformat()


class PredictResponse(BaseModel):
    delay_risk_label: str
    delay_risk_class: int
    probabilities: Dict[str, float]
    is_high_risk: bool
    confidence: float


class _ModelState:
    def __init__(self) -> None:
        self.started_at = time.time()
        self.model: Any = None
        self.target_encoder: Any = None
        self.loaded_ok: bool = False
        self.last_load_error: Optional[str] = None


STATE = _ModelState()


def _env_path(key: str, default: str) -> str:
    v = os.getenv(key, default).strip()
    return v


def load_artifacts() -> None:
    """
    Load model + encoders ONCE. Paths are from environment variables.

    Notes about the user's uploaded pipeline:
    - Model: best_xgboost_delay_model.pkl (joblib)
    - Target label encoder: label_encoder.pkl
    """
    model_path = _env_path("ML_MODEL_PATH", "./ai-service/best_xgboost_delay_model.pkl")
    target_path = _env_path("ML_TARGET_ENCODER_PATH", "./ai-service/label_encoder.pkl")

    try:
        # Compatibility shim:
        # The uploaded pickle was created with scikit-learn 1.6.1 and may reference
        # private symbols removed/renamed in newer versions. We patch the missing
        # names so joblib can import the objects safely.
        try:  # pragma: no cover
            import sklearn.compose._column_transformer as _ct  # type: ignore

            if not hasattr(_ct, "_RemainderColsList"):
                # Minimal placeholder – must be a class that supports pickled state assignment.
                class _RemainderColsList(list):  # noqa: N801
                    pass

                _ct._RemainderColsList = _RemainderColsList  # type: ignore[attr-defined]
        except Exception:
            # If sklearn isn't installed or module paths changed, joblib.load will raise below.
            pass

        STATE.model = joblib.load(model_path)
        STATE.target_encoder = joblib.load(target_path)

        # Post-load compatibility fixes for newer scikit-learn runtimes.
        # These do NOT change the trained parameters; they only add missing private attrs
        # required by newer sklearn during transform().
        try:  # pragma: no cover
            from sklearn.impute import SimpleImputer  # type: ignore

            def walk(obj):
                if obj is None:
                    return
                yield obj
                if hasattr(obj, "steps"):
                    for _, s in obj.steps:
                        yield from walk(s)
                if hasattr(obj, "transformers_"):
                    for _, t, _cols in getattr(obj, "transformers_", []):
                        yield from walk(t)
                if hasattr(obj, "named_steps"):
                    for _n, s in obj.named_steps.items():
                        yield from walk(s)

            for o in walk(STATE.model):
                if isinstance(o, SimpleImputer):
                    if not hasattr(o, "_fill_dtype"):
                        # Newer sklearn uses _fill_dtype in transform; older pickles may only have _fit_dtype.
                        setattr(o, "_fill_dtype", getattr(o, "_fit_dtype", None))
        except Exception:
            pass

        STATE.loaded_ok = True
        STATE.last_load_error = None
    except Exception as e:  # noqa: BLE001
        STATE.loaded_ok = False
        STATE.model = None
        STATE.target_encoder = None
        STATE.last_load_error = str(e)


app = FastAPI(title="Delay Risk Model Server", version="1.0.0")


@app.exception_handler(Exception)
async def _unhandled(request: Request, exc: Exception) -> JSONResponse:  # noqa: ARG001
    # Never expose tracebacks to API consumers.
    return JSONResponse(
        status_code=500,
        content={"error": True, "message": "Internal model server error", "detail": {}},
    )


@app.on_event("startup")
async def _startup() -> None:
    load_artifacts()


@app.get("/health")
async def health() -> Dict[str, Any]:
    steps = None
    try:
        if STATE.model is not None and hasattr(STATE.model, "steps"):
            steps = [name for name, _ in STATE.model.steps]
    except Exception:
        steps = None

    expected_in = None
    try:
        expected_in = int(getattr(STATE.model, "n_features_in_", 0)) or None
    except Exception:
        expected_in = None

    return {
        "ok": STATE.loaded_ok,
        "uptime_sec": int(time.time() - STATE.started_at),
        "model_loaded": bool(STATE.model),
        "target_encoder_loaded": bool(STATE.target_encoder),
        "last_load_error": STATE.last_load_error if not STATE.loaded_ok else None,
        "pipeline_steps": steps,
        "expected_n_features_in": expected_in,
    }


@app.get("/debug/model-signature")
async def debug_signature() -> Dict[str, Any]:
    """Local-only debugging endpoint (service binds to 127.0.0.1)."""
    if STATE.model is None:
        return {"ok": False}
    out: Dict[str, Any] = {"ok": True}
    try:
        out["type"] = str(type(STATE.model))
    except Exception:
        out["type"] = "unknown"
    try:
        if hasattr(STATE.model, "steps"):
            out["steps"] = [name for name, _ in STATE.model.steps]
    except Exception:
        pass
    try:
        out["n_features_in_"] = int(getattr(STATE.model, "n_features_in_", 0)) or None
    except Exception:
        pass
    try:
        if hasattr(STATE.model, "named_steps"):
            for name, step in STATE.model.named_steps.items():
                key = f"step::{name}"
                out[key] = {"type": str(type(step))}
                for attr in ("n_features_in_",):
                    if hasattr(step, attr):
                        try:
                            out[key][attr] = int(getattr(step, attr, 0)) or None
                        except Exception:
                            out[key][attr] = None
                if hasattr(step, "feature_names_in_"):
                    try:
                        out[key]["feature_names_in_"] = [str(x) for x in list(step.feature_names_in_)]
                    except Exception:
                        pass
                if name in ("feature_engineering", "feature_engineer", "feature_engineering_step"):
                    try:
                        out[key]["state_keys"] = sorted(list(getattr(step, "__dict__", {}).keys()))[:80]
                    except Exception:
                        pass
    except Exception:
        pass
    return out


@app.post("/reload")
async def reload_model() -> Dict[str, Any]:
    load_artifacts()
    if not STATE.loaded_ok:
        raise HTTPException(
            status_code=503,
            detail={"error": True, "message": "Failed to reload model artifacts", "detail": {}},
        )
    return {"ok": True}


@app.post("/predict", response_model=PredictResponse)
async def predict(req: PredictRequest) -> PredictResponse:
    if not STATE.loaded_ok or STATE.model is None or STATE.target_encoder is None:
        raise HTTPException(
            status_code=503,
            detail={"error": True, "message": "Model not loaded", "detail": {}},
        )

    # Build a single-row dataframe with the columns FeatureEngineer expects.
    # Note: FeatureEngineer uses the (%) names internally; we map request fields accordingly.
    row = {
        "Job_Type": (req.Job_Type or "other"),
        "Order_Request_Date": req.Order_Request_Date,
        "Requested_Deadline_Date": (req.Requested_Deadline_Date or None),
        "Assigned_Date": req.Assigned_Date,
        "Estimated_End_Date": req.Estimated_End_Date,
        "Quantity": req.Quantity,
        "Color_Type (BW / Full Color)": (req.Color_Type or "Full Color"),
        "Material_Type": (req.Material_Type or "Standard"),
        "Assigned_Machine_Workload (%)": req.Assigned_Machine_Workload,
        "Assigned_Operator_Workload (%)": req.Assigned_Operator_Workload,
        "Current_Queued_Jobs_Count": req.Current_Queued_Jobs_Count,
        "Active_Machines_Count": (req.Active_Machines_Count or 1),
        "Total_Machines_Count": (req.Total_Machines_Count or 1),
        "Available_Staff_Count": (req.Available_Staff_Count or 1),
        "Total_Staff_Count": (req.Total_Staff_Count or 1),
        "Priority": req.Priority or "Normal",
    }
    Xdf = pd.DataFrame([row])

    # Predict
    try:
        pred_class = int(STATE.model.predict(Xdf)[0])
        proba = STATE.model.predict_proba(Xdf)[0]
        proba = np.asarray(proba, dtype=float).tolist()
    except Exception as e:  # noqa: BLE001
        import traceback

        # Log full traceback server-side only (never returned to client).
        print("[model_server] predict failed:", repr(e))
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={"error": True, "message": "Prediction failed", "detail": {}},
        )

    # Decode label via target encoder (LabelEncoder)
    try:
        label = str(STATE.target_encoder.inverse_transform([pred_class])[0])
    except Exception:
        # fallback decode based on known class order (metadata)
        label_map = {0: "High", 1: "Low", 2: "Medium"}
        label = label_map.get(pred_class, "Medium")

    # Probabilities keyed by label names (High/Low/Medium)
    # The encoder classes are alphabetical; keep a stable mapping.
    class_names = list(getattr(STATE.target_encoder, "classes_", ["High", "Low", "Medium"]))
    probs = {str(class_names[i]): float(proba[i]) for i in range(min(3, len(proba)))}
    confidence = float(probs.get(label, max(probs.values()) if probs else 0.0))

    return PredictResponse(
        delay_risk_label=label,
        delay_risk_class=pred_class,
        probabilities=probs,
        is_high_risk=(label == "High"),
        confidence=confidence,
    )


def _run() -> None:
    # Programmatic uvicorn so running `python -m ml.model_server` works on Windows/PM2.
    import uvicorn  # local import to keep module import light

    host = os.getenv("ML_HOST", "127.0.0.1")
    port = int(os.getenv("ML_PORT", "8000"))
    uvicorn.run("ml.model_server:app", host=host, port=port, log_level="info")


if __name__ == "__main__":
    _run()

