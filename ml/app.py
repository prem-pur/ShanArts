import streamlit as st
import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt

from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.preprocessing import LabelEncoder


# =========================
# Feature Engineering
# =========================

class FeatureEngineer(BaseEstimator, TransformerMixin):

    def fit(self, X, y=None):
        return self

    def transform(self, X):

        X = X.copy()

        date_cols = [
            "Order_Request_Date",
            "Requested_Deadline_Date",
            "Assigned_Date",
            "Estimated_End_Date"
        ]

        for col in date_cols:
            X[col] = pd.to_datetime(X[col], errors="coerce")

        X["days_to_deadline"] = (
            X["Requested_Deadline_Date"] -
            X["Order_Request_Date"]
        ).dt.days

        X["days_to_assign"] = (
            X["Assigned_Date"] -
            X["Order_Request_Date"]
        ).dt.days

        X["production_days"] = (
            X["Estimated_End_Date"] -
            X["Assigned_Date"]
        ).dt.days

        X["deadline_buffer"] = (
            X["Requested_Deadline_Date"] -
            X["Estimated_End_Date"]
        ).dt.days

        X["order_month"] = X["Order_Request_Date"].dt.month
        X["order_dayofweek"] = X["Order_Request_Date"].dt.dayofweek

        X["is_weekend_order"] = (X["order_dayofweek"] >= 5).astype(int)

        X["machine_util_ratio"] = (
            X["Active_Machines_Count"] /
            X["Total_Machines_Count"].replace(0, np.nan)
        )

        X["staff_util_ratio"] = (
            (X["Total_Staff_Count"] - X["Available_Staff_Count"]) /
            X["Total_Staff_Count"].replace(0, np.nan)
        )

        X["queue_per_machine"] = X["Current_Queued_Jobs_Count"] / X["Active_Machines_Count"].replace(0, np.nan)
        X["queue_per_staff"] = X["Current_Queued_Jobs_Count"] / X["Available_Staff_Count"].replace(0, np.nan)

        X["avg_workload"] = (
            X["Assigned_Machine_Workload (%)"] +
            X["Assigned_Operator_Workload (%)"]
        ) / 2

        X["high_workload_flag"] = (X["avg_workload"] >= 80).astype(int)
        X["tight_deadline_flag"] = (
            X["days_to_deadline"] <= 3
        ).astype(int)

        X["is_urgent"] = (
            X["Priority"] == "Urgent"
        ).astype(int)

        X["log_quantity"] = np.log1p(
            X["Quantity"]
        )

        # Missing features for preprocessor
        X["staff_machine_ratio"] = X["Available_Staff_Count"] / X["Active_Machines_Count"].replace(0, np.nan)
        X["workload_diff"] = (X["Assigned_Machine_Workload (%)"] - X["Assigned_Operator_Workload (%)"]).abs()
        X["overload_flag"] = (X["avg_workload"] >= 90).astype(int)
        X["workload_x_queue"] = X["avg_workload"] * X["Current_Queued_Jobs_Count"]
        X["urgency_workload"] = X["is_urgent"] * X["avg_workload"]
        X["buffer_per_day"] = X["deadline_buffer"] / (X["production_days"].replace(0, 1))
        X["queue_workload_ratio"] = X["Current_Queued_Jobs_Count"] / (X["avg_workload"].replace(0, 1))

        X = X.drop(columns=date_cols, errors="ignore")

        return X


# =========================
# Load Model & Preprocessors
# =========================

model = joblib.load(
    "saved_model/best_xgboost_delay_model.pkl"
)

preprocessor = joblib.load(
    "saved_model/preprocessor.pkl"
)

label_encoder = joblib.load(
    "saved_model/label_encoder.pkl"
)

# Initialize feature engineer
fe = FeatureEngineer()


# =========================
# Page Settings
# =========================

st.set_page_config(
    page_title="Delay Risk Prediction",
    page_icon="🖨️",
    layout="wide"
)

st.title(
    "🖨️ Digital Printing Delay Risk Prediction"
)

st.write(
    "Predict whether a printing job has "
    "Low, Medium, or High delay risk."
)


# =========================
# Input Fields
# =========================

st.sidebar.header(
    "Enter Job Details"
)

job_type = st.sidebar.selectbox(
    "Job Type",
    [
        "Business Cards",
        "Brochures",
        "Flyers",
        "Stickers",
        "Banners",
        "Posters"
    ]
)

quantity = st.sidebar.number_input(
    "Quantity",
    min_value=1,
    value=500
)

priority = st.sidebar.selectbox(
    "Priority",
    [
        "Normal",
        "Urgent"
    ]
)

order_date = st.sidebar.date_input(
    "Order Request Date"
)

deadline_date = st.sidebar.date_input(
    "Requested Deadline Date"
)

assigned_date = st.sidebar.date_input(
    "Assigned Date"
)

estimated_end_date = st.sidebar.date_input(
    "Estimated End Date"
)

queue_count = st.sidebar.number_input(
    "Current Queued Jobs Count",
    min_value=0,
    value=50
)

machines = st.sidebar.number_input(
    "Active Machines Count",
    min_value=1,
    value=4
)

staff = st.sidebar.number_input(
    "Available Staff Count",
    min_value=1,
    value=3
)

machine_workload = st.sidebar.slider(
    "Assigned Machine Workload (%)",
    0,
    100,
    80
)

operator_workload = st.sidebar.slider(
    "Assigned Operator Workload (%)",
    0,
    100,
    80
)


# =========================
# Prediction
# =========================

if st.sidebar.button(
    "Predict Delay Risk"
):

    input_data = pd.DataFrame([{

        "Job_Type":
        job_type,

        "Quantity":
        quantity,

        "Color_Type (BW / Full Color)":
        "Full Color",

        "Material_Type":
        "Matte Paper",

        "Order_Request_Date":
        str(order_date),

        "Requested_Deadline_Date":
        str(deadline_date),

        "Assigned_Date":
        str(assigned_date),

        "Estimated_End_Date":
        str(estimated_end_date),

        "Current_Queued_Jobs_Count":
        queue_count,

        "Active_Machines_Count":
        machines,

        "Total_Machines_Count":
        10,

        "Available_Staff_Count":
        staff,

        "Total_Staff_Count":
        5,

        "Priority":
        priority,

        "Assigned_Machine_Workload (%)":
        machine_workload,

        "Assigned_Operator_Workload (%)":
        operator_workload

    }])

    # Process data through FeatureEngineer and Preprocessor
    input_processed = fe.transform(input_data)
    final_features = preprocessor.transform(input_processed)
    
    # Prediction
    pred_encoded = model.predict(
        final_features
    )[0]

    prediction = label_encoder.inverse_transform(
        [pred_encoded]
    )[0]

    probabilities = model.predict_proba(
        final_features
    )[0]

    # =========================
    # Colored Output
    # =========================

    st.subheader(
        "Prediction Result"
    )

    if prediction == "Low":

        st.success(
            "Delay Risk Level: LOW"
        )

    elif prediction == "Medium":

        st.warning(
            "Delay Risk Level: MEDIUM"
        )

    else:

        st.error(
            "Delay Risk Level: HIGH"
        )

    # =========================
    # Probability Table
    # =========================

    prob_df = pd.DataFrame({

        "Risk Level":
        label_encoder.classes_,

        "Probability":
        probabilities

    })

    prob_df["Probability (%)"] = (
        prob_df["Probability"] * 100
    ).round(2)

    st.subheader(
        "Prediction Probabilities"
    )

    st.dataframe(
        prob_df
    )

    # =========================
    # Bar Graph
    # =========================

    st.subheader(
        "Probability Bar Graph"
    )

    fig, ax = plt.subplots()

    ax.bar(
        prob_df["Risk Level"],
        prob_df["Probability (%)"]
    )

    ax.set_xlabel(
        "Risk Level"
    )

    ax.set_ylabel(
        "Probability (%)"
    )

    ax.set_title(
        "Delay Risk Prediction"
    )

    st.pyplot(fig)

else:

    st.info(
        "Enter job details and click Predict Delay Risk."
    )