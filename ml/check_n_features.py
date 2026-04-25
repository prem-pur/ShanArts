import joblib
model = joblib.load("saved_model/best_xgboost_delay_model.pkl")
print("Model number of features:", model.n_features_in_)
