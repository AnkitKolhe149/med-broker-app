"""
Shared DemandForecastModel wrapper class.
Must be importable by both the training script AND the Flask API 
so that pickle can correctly deserialize the saved model.
"""

import pandas as pd
import numpy as np

FEATURES = ['past_month_sales', 'price', 'stock_level', 'seasonality_index', 'promotion_active']
FEATURES_ENGINEERED = FEATURES + ['sales_to_stock_ratio', 'price_x_seasonality', 'sales_x_promo']


class DemandForecastModel:
    """Wrapper that handles feature engineering + prediction."""
    
    def __init__(self, model, feature_names, model_name='RandomForest', metrics=None):
        self.model = model
        self.feature_names = feature_names
        self.model_name = model_name
        self.metrics = metrics or {}
    
    def predict(self, df_input):
        """Accept a DataFrame with 5 base features, engineer extras, and predict."""
        if isinstance(df_input, pd.DataFrame):
            X = df_input.copy()
        else:
            X = pd.DataFrame(df_input, columns=FEATURES)
        
        for f in FEATURES:
            if f not in X.columns:
                X[f] = 0
        
        X['sales_to_stock_ratio'] = np.where(X['stock_level'] > 0, X['past_month_sales'] / X['stock_level'], 0)
        X['price_x_seasonality'] = X['price'] * X['seasonality_index']
        X['sales_x_promo'] = X['past_month_sales'] * X['promotion_active']
        
        return self.model.predict(X[self.feature_names])


# Alias for compatibility with models exported from different versions
MedBrokerDemandModel = DemandForecastModel
