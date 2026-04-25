import joblib
from sklearn.base import BaseEstimator, TransformerMixin
import pandas as pd
import numpy as np

# We need to define FeatureEngineer before loading if it was saved as a custom class
# But what if we don't know the definition? 
# If it was saved using cloudpickle or similar, it might work.
# If not, we might get an error.

try:
    fe = joblib.load("saved_model/feature_engineer.pkl")
    print(f"FeatureEngineer loaded successfully! Type: {type(fe)}")
    
    # Try to see its attributes or source code if possible
    import inspect
    try:
        print("Source code of transform:")
        print(inspect.getsource(fe.transform))
    except:
        print("Could not get source code.")
        
except Exception as e:
    print(f"Failed to load FeatureEngineer: {e}")
