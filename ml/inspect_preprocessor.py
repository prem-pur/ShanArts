import joblib
from sklearn.base import BaseEstimator, TransformerMixin
import pandas as pd

# Mock FeatureEngineer if it's needed for loading
class FeatureEngineer(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None):
        return self
    def transform(self, X):
        return X

try:
    preprocessor = joblib.load("saved_model/preprocessor.pkl")
    print(f"Preprocessor type: {type(preprocessor)}")
    if hasattr(preprocessor, "steps"):
        print("Steps:", [step[0] for step in preprocessor.steps])
except Exception as e:
    print(f"Error loading preprocessor: {e}")
