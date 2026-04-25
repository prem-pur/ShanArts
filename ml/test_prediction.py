import pytest

# Helper script uploaded for manual debugging; prevent pytest from collecting/executing it.
pytest.skip("helper script (not a test module)", allow_module_level=True)

import joblib
import pandas as pd
import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin

class FeatureEngineer(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None):
        return self
    def transform(self, X):
        X = X.copy()
        date_cols = ["Order_Request_Date", "Requested_Deadline_Date", "Assigned_Date", "Estimated_End_Date"]
        for col in date_cols:
            X[col] = pd.to_datetime(X[col], errors="coerce")
        X["days_to_deadline"] = (X["Requested_Deadline_Date"] - X["Order_Request_Date"]).dt.days
        X["days_to_assign"] = (X["Assigned_Date"] - X["Order_Request_Date"]).dt.days
        X["production_days"] = (X["Estimated_End_Date"] - X["Assigned_Date"]).dt.days
        X["deadline_buffer"] = (X["Requested_Deadline_Date"] - X["Estimated_End_Date"]).dt.days
        X["order_month"] = X["Order_Request_Date"].dt.month
        X["order_dayofweek"] = X["Order_Request_Date"].dt.dayofweek
        X["is_weekend_order"] = (X["order_dayofweek"] >= 5).astype(int)
        X["machine_util_ratio"] = X["Active_Machines_Count"] / X["Total_Machines_Count"].replace(0, np.nan)
        X["staff_util_ratio"] = (X["Total_Staff_Count"] - X["Available_Staff_Count"]) / X["Total_Staff_Count"].replace(0, np.nan)
        X["queue_per_machine"] = X["Current_Queued_Jobs_Count"] / X["Active_Machines_Count"].replace(0, np.nan)
        X["queue_per_staff"] = X["Current_Queued_Jobs_Count"] / X["Available_Staff_Count"].replace(0, np.nan)
        X["avg_workload"] = (X["Assigned_Machine_Workload (%)"] + X["Assigned_Operator_Workload (%)"]) / 2
        X["high_workload_flag"] = (X["avg_workload"] >= 80).astype(int)
        X["tight_deadline_flag"] = (X["days_to_deadline"] <= 3).astype(int)
        X["is_urgent"] = (X["Priority"] == "Urgent").astype(int)
        X["log_quantity"] = np.log1p(X["Quantity"])
        X = X.drop(columns=date_cols, errors="ignore")
        return X

model = joblib.load("saved_model/best_xgboost_delay_model.pkl")

# Sample data as created in app.py
input_data = pd.DataFrame([{
    "Job_Type": "Business Cards",
    "Quantity": 500,
    "Color_Type (BW / Full Color)": "Full Color",
    "Material_Type": "Matte Paper",
    "Order_Request_Date": "2024-01-01",
    "Requested_Deadline_Date": "2024-01-05",
    "Assigned_Date": "2024-01-02",
    "Estimated_End_Date": "2024-01-04",
    "Current_Queued_Jobs_Count": 50,
    "Active_Machines_Count": 4,
    "Total_Machines_Count": 10,
    "Available_Staff_Count": 3,
    "Total_Staff_Count": 5,
    "Priority": "Normal",
    "Assigned_Machine_Workload (%)": 80,
    "Assigned_Operator_Workload (%)": 80
}])

# Try predicting directly (like app.py does)
try:
    print("Trying direct prediction...")
    model.predict(input_data)
    print("Direct prediction successful!")
except Exception as e:
    print(f"Direct prediction failed: {e}")

# Try with FeatureEngineer
try:
    print("\nTrying with FeatureEngineer...")
    fe = FeatureEngineer()
    processed_data = fe.transform(input_data)
    print("Processed columns:", processed_data.columns.tolist())
    # Note: Categorical encoding is still missing here if model expects numbers
    model.predict(processed_data)
    print("Prediction with FeatureEngineer successful!")
except Exception as e:
    print(f"Prediction with FeatureEngineer failed: {e}")
