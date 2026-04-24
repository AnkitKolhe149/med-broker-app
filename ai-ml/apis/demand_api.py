import os
import sys
import pickle
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify

# Add model directory to path so pickle can find DemandForecastModel
model_dir = os.path.join(os.path.dirname(__file__), '..', 'models', 'demand_forecasting')
sys.path.insert(0, os.path.abspath(model_dir))

# Import the class so pickle can find it during deserialization
try:
    from model_wrapper import DemandForecastModel, MedBrokerDemandModel
except ImportError:
    print("Warning: model_wrapper not found in path")

app = Flask(__name__)

model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'demand_forecasting', 'demand_model.pkl')
model = None

def load_model():
    global model
    if os.path.exists(model_path):
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
            
            # Check if it's a wrapped model (from Colab) or raw sklearn model
            if hasattr(model, 'model_name'):
                print(f"Loaded wrapped demand model: {model.model_name}")
                if hasattr(model, 'metrics'):
                    print(f"  Training metrics: MAE={model.metrics.get('mae')}, R²={model.metrics.get('r2')}")
            else:
                print("Loaded demand model (legacy/raw format).")
    else:
        print("Warning: demand_model.pkl not found!")

load_model()

@app.route('/health', methods=['GET'])
def health():
    model_info = {}
    if model is not None:
        if hasattr(model, 'model_name'):
            model_info = {
                "model_type": model.model_name,
                "metrics": getattr(model, 'metrics', {})
            }
        else:
            model_info = {"model_type": "legacy_sklearn"}
    
    return jsonify({
        "status": "running",
        "model_loaded": model is not None,
        **model_info
    }), 200

@app.route('/api/forecast', methods=['POST'])
def forecast():
    if model is None:
        load_model()
        if model is None:
            return jsonify({"error": "Model not loaded"}), 500
         
    try:
        data = request.json
        items = data.get('items', [])
        
        if not items:
            return jsonify({"error": "No items provided"}), 400
            
        df = pd.DataFrame(items)
        
        # Base features we definitely know
        base_features = ['past_month_sales', 'price', 'stock_level', 'seasonality_index', 'promotion_active']
        
        # Inject missing base features if anything is missing
        for f in base_features:
            if f not in df.columns:
                df[f] = 0
                
        # Engineer features that the wrapper class usually handles (just in case they weren't engineered)
        df['sales_to_stock_ratio'] = np.where(df['stock_level'] > 0, df['past_month_sales'] / df['stock_level'], 0)
        df['price_x_seasonality'] = df['price'] * df['seasonality_index']
        df['sales_x_promo'] = df['past_month_sales'] * df['promotion_active']
        
        # Handle "Time Series" features (lags, rolls, etc.) which some users might train on Kaggle
        # These are usually not present in the backend request, so we provide reasonable heuristics
        time_series_fallbacks = {
            'sales_lag_1': df['past_month_sales'],
            'sales_lag_2': df['past_month_sales'] * 0.9,
            'sales_lag_3': df['past_month_sales'] * 0.8,
            'sales_lag_6': df['past_month_sales'] * 0.85,
            'sales_roll_mean_3': df['past_month_sales'] * 0.95,
            'sales_roll_std_3': df['past_month_sales'] * 0.1,
            'month_num': 4, # Default to April
            'is_winter': 0,
            'is_summer': 0,
            'trend': 1.05 # Slight growth trend
        }
        
        for f, val in time_series_fallbacks.items():
            if f not in df.columns:
                df[f] = val

        # Determine exact feature order needed by the model
        if hasattr(model, 'feature_names_in_'):
            expected_features = model.feature_names_in_
        elif hasattr(model, 'feature_names'):
             expected_features = model.feature_names
        else:
             # Fallback if we can't inspect the model
             expected_features = base_features + ['sales_to_stock_ratio', 'price_x_seasonality', 'sales_x_promo']
             
        # Ensure all expected features exist in df
        for f in expected_features:
            if f not in df.columns:
                df[f] = 0 # Safety fallback
                
        # Make prediction using the specific feature set the model was trained on
        if hasattr(model, 'model_name'):
            # Wrapped model handles its own internal re-ordering/engineering
            predictions = model.predict(df)
        else:
            # Raw model needs the exact column list it was trained with
            predictions = model.predict(df[expected_features])
        
        results = []
        for i, pred in enumerate(predictions):
             pred_val = round(float(pred))
             past_sales = items[i].get("past_month_sales", 50)
             
             # Optimized Confidence Calculation:
             # Base trust comes from the model's training accuracy (metrics.r2)
             # We then adjust based on how "extreme" the prediction is relative to past sales
             model_accuracy = getattr(model, 'metrics', {}).get('r2', 0.8)
             deviation = abs(pred_val - past_sales) / max(past_sales, 1)
             
             # Higher model accuracy = higher baseline confidence
             # Higher deviation = slight confidence penalty (uncertainty)
             conf = (model_accuracy * 0.8) + (max(0, 1 - deviation) * 0.2)
             
             res = {
                 "medicine_id": items[i].get("medicine_id", f"unknown_{i}"),
                 "medicine_name": items[i].get("medicine_name", f"Medicine {i}"),
                 "predicted_demand": max(0, pred_val),
                 "confidence_score": round(max(0.65, min(0.98, conf)), 2)
             }
             
             # Determine trend based on prediction vs historical
             if pred_val > past_sales * 1.15:
                 res["trend"] = "up"
             elif pred_val < past_sales * 0.85:
                 res["trend"] = "down"
             else:
                 res["trend"] = "stable"
             
             results.append(res)
             
        return jsonify({"forecasts": results})
    except Exception as e:
         return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(port=5002, debug=True)
