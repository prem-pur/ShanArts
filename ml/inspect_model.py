import joblib
from sklearn.pipeline import Pipeline
import pandas as pd
import numpy as np

# Mock FeatureEngineer if it's needed for loading
from sklearn.base import BaseEstimator, TransformerMixin

class FeatureEngineer(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None):
        return self
    def transform(self, X):
        return X

try:
    model = joblib.load("saved_model/best_xgboost_delay_model.pkl")
    print(f"Model type: {type(model)}")
    if isinstance(model, Pipeline):
        print("Steps:", [step[0] for step in model.steps])
    else:
        print("Model is not a Pipeline")
except Exception as e:
    print(f"Error loading model: {e}")
