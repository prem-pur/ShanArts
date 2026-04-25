import joblib
import xgboost as xgb

model = joblib.load("saved_model/best_xgboost_delay_model.pkl")
if hasattr(model, "feature_names_in_"):
    print("Expected features:", model.feature_names_in_)
elif hasattr(model, "get_booster"):
    print("Feature names from booster:", model.get_booster().feature_names)
else:
    print("Could not find feature names")
