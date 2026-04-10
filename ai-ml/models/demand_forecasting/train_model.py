import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import pickle
import os
import sys
import json

# Import shared wrapper so pickle serializes with the correct module path
from model_wrapper import DemandForecastModel, FEATURES, FEATURES_ENGINEERED


def generate_realistic_data(n_medicines=50, n_months=12):
    """Generate realistic pharmaceutical demand data."""
    np.random.seed(42)
    
    categories = {
        'Antibiotics':      {'base': 120, 'price': (15, 80),  'peak': [11, 12, 1, 2]},
        'Painkillers':      {'base': 200, 'price': (5, 40),   'peak': []},
        'Antihistamines':   {'base': 80,  'price': (10, 50),  'peak': [3, 4, 5, 9, 10]},
        'Cardiovascular':   {'base': 60,  'price': (30, 150), 'peak': []},
        'Diabetes':         {'base': 90,  'price': (20, 120), 'peak': []},
        'Respiratory':      {'base': 85,  'price': (12, 70),  'peak': [10, 11, 12, 1, 2]},
        'Gastrointestinal': {'base': 100, 'price': (8, 45),   'peak': [4, 5, 10, 11]},
        'Vitamins':         {'base': 150, 'price': (5, 35),   'peak': [1, 2, 3]},
    }
    
    rows = []
    med_id = 0
    
    for cat, prof in categories.items():
        n_meds = max(1, n_medicines // len(categories))
        for _ in range(n_meds):
            med_id += 1
            price = round(np.random.uniform(*prof['price']), 2)
            popularity = np.random.uniform(0.6, 1.4)
            
            for m in range(n_months - 1):
                month_num = (m % 12) + 1
                season = np.random.uniform(1.3, 1.8) if month_num in prof['peak'] else np.random.uniform(0.7, 1.1)
                promo = 1 if np.random.random() < 0.2 else 0
                stock = max(0, int(np.random.normal(prof['base'] * 2, prof['base'] * 0.5)))
                
                sales = min(stock, max(0, int(
                    prof['base'] * popularity * season * (1.25 if promo else 1.0) +
                    np.random.normal(0, prof['base'] * 0.15)
                )))
                
                next_season = 1.5 if ((m + 1) % 12 + 1) in prof['peak'] else 0.9
                next_sales = max(0, int(
                    sales * 0.7 + prof['base'] * popularity * next_season * 0.3 +
                    np.random.normal(0, prof['base'] * 0.1)
                ))
                price_factor = max(0.5, 1 - (price - prof['price'][0]) / (prof['price'][1] - prof['price'][0]) * 0.3)
                next_sales = int(next_sales * price_factor)
                
                rows.append({
                    'past_month_sales': sales,
                    'price': price,
                    'stock_level': stock,
                    'seasonality_index': round(season, 2),
                    'promotion_active': promo,
                    'actual_next_month_sales': next_sales
                })
    
    return pd.DataFrame(rows)


def load_real_data(filepath):
    """Load exported data from the backend API."""
    with open(filepath, 'r') as f:
        raw = json.load(f)
    
    rows = raw.get('data', {}).get('rows', raw.get('rows', raw if isinstance(raw, list) else []))
    if not rows:
        print("Warning: No rows found in data file.")
        return None
    
    df = pd.DataFrame(rows)
    required = FEATURES + ['actual_next_month_sales']
    missing = [c for c in required if c not in df.columns]
    if missing:
        print(f"Warning: Missing columns {missing}. Using synthetic data instead.")
        return None
    
    print(f"Loaded {len(df)} rows from {filepath}")
    return df


def main():
    data_file = None
    for i, arg in enumerate(sys.argv):
        if arg == '--data' and i + 1 < len(sys.argv):
            data_file = sys.argv[i + 1]
    
    # Load data
    df = None
    if data_file and os.path.exists(data_file):
        df = load_real_data(data_file)
    
    if df is None:
        print("Generating realistic pharmaceutical training data...")
        df = generate_realistic_data()
    
    print(f"Training on {len(df)} samples...")
    
    # Feature engineering
    X = df[FEATURES].copy()
    X['sales_to_stock_ratio'] = np.where(X['stock_level'] > 0, X['past_month_sales'] / X['stock_level'], 0)
    X['price_x_seasonality'] = X['price'] * X['seasonality_index']
    X['sales_x_promo'] = X['past_month_sales'] * X['promotion_active']
    y = df['actual_next_month_sales']
    
    # Train
    print("Training RandomForestRegressor...")
    raw_model = RandomForestRegressor(n_estimators=200, max_depth=12, random_state=42, n_jobs=-1)
    raw_model.fit(X[FEATURES_ENGINEERED], y)
    
    # Evaluate
    from sklearn.metrics import mean_absolute_error, r2_score
    preds = raw_model.predict(X[FEATURES_ENGINEERED])
    mae = mean_absolute_error(y, preds)
    r2 = r2_score(y, preds)
    print(f"  MAE: {mae:.2f}, R²: {r2:.4f}")
    
    # Wrap and save
    wrapped = DemandForecastModel(raw_model, FEATURES_ENGINEERED, 'RandomForest', {'mae': round(mae, 2), 'r2': round(r2, 4)})
    
    model_path = os.path.join(os.path.dirname(__file__), 'demand_model.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump(wrapped, f)
    
    size_mb = os.path.getsize(model_path) / (1024 * 1024)
    print(f"Model saved: {model_path} ({size_mb:.1f} MB)")


if __name__ == "__main__":
    main()
