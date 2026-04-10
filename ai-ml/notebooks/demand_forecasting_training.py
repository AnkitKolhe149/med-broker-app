# =============================================================================
# MedBroker — Demand Forecasting Model Training (Google Colab)
# =============================================================================
# This notebook trains a production-grade demand forecasting model using 
# real order data from your MedBroker platform.
#
# HOW TO USE IN COLAB:
#   1. Open Google Colab (colab.research.google.com)
#   2. File → Upload notebook → Upload this .py file
#      OR create a new notebook and paste each cell (separated by # %% markers)
#   3. Run cells top-to-bottom
#   4. Download the trained model at the end
# =============================================================================

# %% [markdown]
# # 🧬 MedBroker Demand Forecasting — Model Training
# ---
# **Objective**: Train a machine learning model to predict next-month medicine demand  
# **Features**: past_month_sales, price, stock_level, seasonality_index, promotion_active  
# **Target**: actual_next_month_sales (units)  
# **Models**: RandomForest + XGBoost (best one is exported)

# %% --- Cell 1: Install Dependencies ---
# !pip install scikit-learn xgboost pandas numpy matplotlib seaborn requests joblib -q

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import pickle
import os
import json
import warnings
warnings.filterwarnings('ignore')

from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler

try:
    import xgboost as xgb
    HAS_XGBOOST = True
    print("✅ XGBoost available")
except ImportError:
    HAS_XGBOOST = False
    print("⚠️ XGBoost not installed. Using GradientBoosting as fallback.")

print("✅ All dependencies loaded successfully")

# %% --- Cell 2: Configuration ---
# ============================================================
# ⚙️ CONFIGURATION — Edit these values before running
# ============================================================

# Option A: Fetch real data from your running backend
# Set your backend URL (use ngrok if running locally and Colab can't reach localhost)
BACKEND_URL = "http://localhost:4000/api"  # Change if using ngrok/deployed URL
ADMIN_TOKEN = ""  # Paste your admin JWT token here

# Option B: If your database is sparse (< 50 order rows), 
# the notebook will auto-generate realistic pharmaceutical training data
USE_REAL_DATA = True   # Set to False to force synthetic data generation
MIN_REAL_ROWS = 30     # Minimum rows needed; below this, synthetic is mixed in

# Model hyperparameters
RANDOM_STATE = 42
TEST_SIZE = 0.2
N_ESTIMATORS = 200
MAX_DEPTH = 12

print(f"📋 Config loaded: Backend={BACKEND_URL}, RealData={USE_REAL_DATA}")

# %% --- Cell 3: Data Loading ---
# ============================================================
# 📊 DATA LOADING — Fetch real data or generate realistic pharma data
# ============================================================

def fetch_real_data(backend_url, token):
    """Fetch training data from MedBroker backend API."""
    import requests
    
    headers = {"Authorization": f"Bearer {token}"}
    url = f"{backend_url}/admin/training-data/demand?months=12"
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        result = response.json()
        
        if result.get('success') and result.get('data', {}).get('rows'):
            rows = result['data']['rows']
            df = pd.DataFrame(rows)
            print(f"✅ Fetched {len(df)} rows from backend API")
            print(f"   Unique medicines: {result['data']['uniqueMedicines']}")
            print(f"   Months analyzed: {result['data']['monthsAnalyzed']}")
            return df
        else:
            print("⚠️ Backend returned empty data")
            return None
    except Exception as e:
        print(f"⚠️ Could not connect to backend: {e}")
        return None


def generate_realistic_pharma_data(n_medicines=50, n_months=12):
    """
    Generate realistic pharmaceutical demand data.
    Unlike random noise, this simulates actual pharma patterns:
    - Seasonal flu/allergy spikes
    - Price elasticity effects
    - Promotion uplift
    - Stock-dependent supply constraints
    """
    np.random.seed(RANDOM_STATE)
    
    # Realistic medicine categories with base demand profiles
    categories = {
        'Antibiotics':       {'base_demand': 120, 'price_range': (15, 80),  'seasonal_peak': [11, 12, 1, 2]},
        'Painkillers':       {'base_demand': 200, 'price_range': (5, 40),   'seasonal_peak': []},
        'Antihistamines':    {'base_demand': 80,  'price_range': (10, 50),  'seasonal_peak': [3, 4, 5, 9, 10]},
        'Cardiovascular':    {'base_demand': 60,  'price_range': (30, 150), 'seasonal_peak': []},
        'Diabetes':          {'base_demand': 90,  'price_range': (20, 120), 'seasonal_peak': []},
        'Dermatology':       {'base_demand': 45,  'price_range': (15, 80),  'seasonal_peak': [5, 6, 7, 8]},
        'Pediatric':         {'base_demand': 70,  'price_range': (10, 60),  'seasonal_peak': [6, 7, 8, 9]},
        'Gastrointestinal':  {'base_demand': 100, 'price_range': (8, 45),   'seasonal_peak': [4, 5, 10, 11]},
        'Respiratory':       {'base_demand': 85,  'price_range': (12, 70),  'seasonal_peak': [10, 11, 12, 1, 2]},
        'Vitamins':          {'base_demand': 150, 'price_range': (5, 35),   'seasonal_peak': [1, 2, 3]},
    }
    
    medicine_names = {
        'Antibiotics': ['Amoxicillin 500mg', 'Azithromycin 250mg', 'Ciprofloxacin 500mg', 'Metronidazole 400mg', 'Cephalexin 500mg'],
        'Painkillers': ['Paracetamol 650mg', 'Ibuprofen 400mg', 'Diclofenac 50mg', 'Aceclofenac 100mg', 'Nimesulide 100mg'],
        'Antihistamines': ['Cetirizine 10mg', 'Levocetirizine 5mg', 'Fexofenadine 120mg', 'Loratadine 10mg', 'Montelukast 10mg'],
        'Cardiovascular': ['Amlodipine 5mg', 'Atenolol 50mg', 'Losartan 50mg', 'Telmisartan 40mg', 'Ramipril 5mg'],
        'Diabetes': ['Metformin 500mg', 'Glimepiride 1mg', 'Sitagliptin 100mg', 'Voglibose 0.3mg', 'Pioglitazone 15mg'],
        'Dermatology': ['Clotrimazole Cream', 'Betamethasone Cream', 'Mupirocin Ointment', 'Ketoconazole Shampoo', 'Tretinoin Gel'],
        'Pediatric': ['Crocin Syrup', 'Domperidone Drops', 'ORS Packets', 'Zinc Syrup', 'Gripe Water'],
        'Gastrointestinal': ['Pantoprazole 40mg', 'Omeprazole 20mg', 'Ranitidine 150mg', 'Domperidone 10mg', 'Ondansetron 4mg'],
        'Respiratory': ['Salbutamol Inhaler', 'Montelukast 10mg', 'Dextromethorphan Syrup', 'Bromhexine 8mg', 'Theophylline 300mg'],
        'Vitamins': ['Vitamin D3 60k', 'Vitamin B Complex', 'Calcium + D3', 'Iron Folic Acid', 'Multivitamin Tablets'],
    }
    
    rows = []
    med_id_counter = 0
    
    for category, profile in categories.items():
        names = medicine_names[category]
        n_meds = min(len(names), n_medicines // len(categories))
        
        for med_idx in range(n_meds):
            med_id_counter += 1
            med_name = names[med_idx]
            price = round(np.random.uniform(*profile['price_range']), 2)
            base = profile['base_demand']
            
            # Per-medicine variance (some products are more popular)
            med_popularity = np.random.uniform(0.6, 1.4)
            
            for month_offset in range(n_months - 1):
                month_num = (month_offset % 12) + 1
                month_key = f"2025-{str(month_num).zfill(2)}"
                
                # Seasonality
                if month_num in profile['seasonal_peak']:
                    seasonality = np.random.uniform(1.3, 1.8)
                else:
                    seasonality = np.random.uniform(0.7, 1.1)
                
                # Promotion (20% chance any given month)
                promo = 1 if np.random.random() < 0.2 else 0
                promo_uplift = 1.25 if promo else 1.0
                
                # Stock level simulation
                stock = max(0, int(np.random.normal(base * 2, base * 0.5)))
                
                # Current month sales
                current_sales = max(0, int(
                    base * med_popularity * seasonality * promo_uplift
                    + np.random.normal(0, base * 0.15)
                ))
                
                # Supply constraint: can't sell more than stock
                current_sales = min(current_sales, stock)
                
                # Next month prediction (correlated with current + trend)
                next_month_num = ((month_offset + 1) % 12) + 1
                next_seasonality = 1.5 if next_month_num in profile['seasonal_peak'] else 0.9
                next_sales = max(0, int(
                    current_sales * 0.7  # momentum
                    + base * med_popularity * next_seasonality * 0.3  # seasonal signal
                    + np.random.normal(0, base * 0.1)  # noise
                ))
                
                # Price elasticity: higher price → slightly lower demand
                price_factor = max(0.5, 1 - (price - profile['price_range'][0]) / 
                                   (profile['price_range'][1] - profile['price_range'][0]) * 0.3)
                next_sales = int(next_sales * price_factor)
                
                rows.append({
                    'medicine_id': f'med_{med_id_counter:03d}',
                    'medicine_name': med_name,
                    'category': category,
                    'month': month_key,
                    'past_month_sales': current_sales,
                    'price': price,
                    'stock_level': stock,
                    'seasonality_index': round(seasonality, 2),
                    'promotion_active': promo,
                    'actual_next_month_sales': next_sales
                })
    
    df = pd.DataFrame(rows)
    print(f"✅ Generated {len(df)} realistic pharmaceutical training rows")
    print(f"   Categories: {df['category'].nunique()}, Medicines: {df['medicine_id'].nunique()}")
    return df


# --- Load Data ---
df = None

if USE_REAL_DATA and ADMIN_TOKEN:
    df = fetch_real_data(BACKEND_URL, ADMIN_TOKEN)

if df is None or len(df) < MIN_REAL_ROWS:
    if df is not None and len(df) > 0:
        print(f"ℹ️ Only {len(df)} real rows found. Augmenting with realistic synthetic data...")
        synthetic = generate_realistic_pharma_data()
        df = pd.concat([df, synthetic], ignore_index=True)
    else:
        print("ℹ️ Using realistic synthetic pharmaceutical data for training...")
        df = generate_realistic_pharma_data()

print(f"\n📊 Final dataset: {len(df)} rows × {len(df.columns)} columns")
df.head()

# %% --- Cell 4: Exploratory Data Analysis ---
# ============================================================
# 🔍 EDA — Understanding the data distribution
# ============================================================

fig, axes = plt.subplots(2, 3, figsize=(18, 10))
fig.suptitle('MedBroker Demand Forecasting — Data Analysis', fontsize=16, fontweight='bold')

# 1. Target distribution
axes[0, 0].hist(df['actual_next_month_sales'], bins=40, color='#10b981', edgecolor='white', alpha=0.8)
axes[0, 0].set_title('Target: Next Month Sales Distribution')
axes[0, 0].set_xlabel('Units')

# 2. Feature correlations
features = ['past_month_sales', 'price', 'stock_level', 'seasonality_index', 'promotion_active']
corr = df[features + ['actual_next_month_sales']].corr()
sns.heatmap(corr, annot=True, fmt='.2f', cmap='Greens', ax=axes[0, 1])
axes[0, 1].set_title('Feature Correlations')

# 3. Past sales vs predicted demand
axes[0, 2].scatter(df['past_month_sales'], df['actual_next_month_sales'], alpha=0.3, color='#059669', s=10)
axes[0, 2].set_title('Past Sales → Next Month Sales')
axes[0, 2].set_xlabel('Past Month Sales')
axes[0, 2].set_ylabel('Next Month Sales')
axes[0, 2].plot([0, df['past_month_sales'].max()], [0, df['past_month_sales'].max()], 'r--', alpha=0.5)

# 4. Price distribution
axes[1, 0].hist(df['price'], bins=30, color='#0d9488', edgecolor='white', alpha=0.8)
axes[1, 0].set_title('Price Distribution (₹)')
axes[1, 0].set_xlabel('Price')

# 5. Seasonality effect
if 'category' in df.columns:
    category_demand = df.groupby('category')['actual_next_month_sales'].mean().sort_values(ascending=True)
    category_demand.plot(kind='barh', ax=axes[1, 1], color='#157347')
    axes[1, 1].set_title('Avg Demand by Category')
else:
    seasonal_bins = pd.cut(df['seasonality_index'], bins=5)
    df.groupby(seasonal_bins)['actual_next_month_sales'].mean().plot(kind='bar', ax=axes[1, 1], color='#157347')
    axes[1, 1].set_title('Demand vs Seasonality')

# 6. Promotion impact
promo_demand = df.groupby('promotion_active')['actual_next_month_sales'].mean()
promo_demand.plot(kind='bar', ax=axes[1, 2], color=['#64748b', '#10b981'])
axes[1, 2].set_title('Promotion Impact on Demand')
axes[1, 2].set_xticks([0, 1])
axes[1, 2].set_xticklabels(['No Promo', 'Active Promo'], rotation=0)

plt.tight_layout()
plt.savefig('eda_analysis.png', dpi=150, bbox_inches='tight')
plt.show()
print("📊 EDA plots saved to eda_analysis.png")

# %% --- Cell 5: Feature Engineering & Model Training ---
# ============================================================
# 🏗️ FEATURE ENGINEERING & MODEL TRAINING
# ============================================================

FEATURES = ['past_month_sales', 'price', 'stock_level', 'seasonality_index', 'promotion_active']
TARGET = 'actual_next_month_sales'

X = df[FEATURES].copy()
y = df[TARGET].copy()

# Handle any NaN/infinity values
X = X.fillna(0)
y = y.fillna(0)
X = X.replace([np.inf, -np.inf], 0)

# Add engineered features
X['sales_to_stock_ratio'] = np.where(X['stock_level'] > 0, X['past_month_sales'] / X['stock_level'], 0)
X['price_x_seasonality'] = X['price'] * X['seasonality_index']
X['sales_x_promo'] = X['past_month_sales'] * X['promotion_active']

FEATURES_ENGINEERED = FEATURES + ['sales_to_stock_ratio', 'price_x_seasonality', 'sales_x_promo']

print(f"📋 Features ({len(FEATURES_ENGINEERED)}): {FEATURES_ENGINEERED}")
print(f"📊 Dataset: {X.shape[0]} samples")
print(f"🎯 Target range: [{y.min()}, {y.max()}], mean={y.mean():.1f}")

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X[FEATURES_ENGINEERED], y, test_size=TEST_SIZE, random_state=RANDOM_STATE
)
print(f"\n✂️ Split: Train={len(X_train)}, Test={len(X_test)}")

# --- Model 1: Random Forest ---
print("\n🌲 Training RandomForest...")
rf_model = RandomForestRegressor(
    n_estimators=N_ESTIMATORS,
    max_depth=MAX_DEPTH,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=RANDOM_STATE,
    n_jobs=-1
)
rf_model.fit(X_train, y_train)
rf_pred = rf_model.predict(X_test)

rf_mae = mean_absolute_error(y_test, rf_pred)
rf_rmse = np.sqrt(mean_squared_error(y_test, rf_pred))
rf_r2 = r2_score(y_test, rf_pred)

print(f"   MAE:  {rf_mae:.2f}")
print(f"   RMSE: {rf_rmse:.2f}")
print(f"   R²:   {rf_r2:.4f}")

# Cross-validation
rf_cv = cross_val_score(rf_model, X[FEATURES_ENGINEERED], y, cv=5, scoring='neg_mean_absolute_error')
print(f"   CV MAE (5-fold): {-rf_cv.mean():.2f} ± {rf_cv.std():.2f}")

# --- Model 2: XGBoost / GradientBoosting ---
if HAS_XGBOOST:
    print("\n🚀 Training XGBoost...")
    xgb_model = xgb.XGBRegressor(
        n_estimators=N_ESTIMATORS,
        max_depth=MAX_DEPTH,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=RANDOM_STATE,
        verbosity=0
    )
else:
    print("\n🚀 Training GradientBoosting (XGBoost fallback)...")
    xgb_model = GradientBoostingRegressor(
        n_estimators=N_ESTIMATORS,
        max_depth=min(MAX_DEPTH, 8),
        learning_rate=0.05,
        subsample=0.8,
        random_state=RANDOM_STATE
    )

xgb_model.fit(X_train, y_train)
xgb_pred = xgb_model.predict(X_test)

xgb_mae = mean_absolute_error(y_test, xgb_pred)
xgb_rmse = np.sqrt(mean_squared_error(y_test, xgb_pred))
xgb_r2 = r2_score(y_test, xgb_pred)

print(f"   MAE:  {xgb_mae:.2f}")
print(f"   RMSE: {xgb_rmse:.2f}")
print(f"   R²:   {xgb_r2:.4f}")

xgb_cv = cross_val_score(xgb_model, X[FEATURES_ENGINEERED], y, cv=5, scoring='neg_mean_absolute_error')
print(f"   CV MAE (5-fold): {-xgb_cv.mean():.2f} ± {xgb_cv.std():.2f}")

# --- Select Best Model ---
if xgb_mae < rf_mae:
    best_model = xgb_model
    best_name = "XGBoost" if HAS_XGBOOST else "GradientBoosting"
    best_pred = xgb_pred
    best_mae, best_rmse, best_r2 = xgb_mae, xgb_rmse, xgb_r2
else:
    best_model = rf_model
    best_name = "RandomForest"
    best_pred = rf_pred
    best_mae, best_rmse, best_r2 = rf_mae, rf_rmse, rf_r2

print(f"\n🏆 Best Model: {best_name}")
print(f"   MAE={best_mae:.2f}, RMSE={best_rmse:.2f}, R²={best_r2:.4f}")

# %% --- Cell 6: Model Evaluation Visualizations ---
# ============================================================
# 📈 EVALUATION — Visual model performance analysis
# ============================================================

fig, axes = plt.subplots(2, 2, figsize=(16, 12))
fig.suptitle(f'Model Performance: {best_name}', fontsize=16, fontweight='bold')

# 1. Actual vs Predicted scatter
axes[0, 0].scatter(y_test, best_pred, alpha=0.4, color='#10b981', s=15)
max_val = max(y_test.max(), max(best_pred))
axes[0, 0].plot([0, max_val], [0, max_val], 'r--', linewidth=2, label='Perfect prediction')
axes[0, 0].set_xlabel('Actual Demand')
axes[0, 0].set_ylabel('Predicted Demand')
axes[0, 0].set_title(f'Actual vs Predicted (R²={best_r2:.3f})')
axes[0, 0].legend()

# 2. Residual distribution
residuals = y_test - best_pred
axes[0, 1].hist(residuals, bins=40, color='#059669', edgecolor='white', alpha=0.8)
axes[0, 1].axvline(x=0, color='red', linestyle='--', linewidth=2)
axes[0, 1].set_title('Residual Distribution')
axes[0, 1].set_xlabel('Prediction Error (Actual - Predicted)')

# 3. Feature importance
if hasattr(best_model, 'feature_importances_'):
    importance = pd.Series(best_model.feature_importances_, index=FEATURES_ENGINEERED)
    importance.sort_values().plot(kind='barh', ax=axes[1, 0], color='#157347')
    axes[1, 0].set_title('Feature Importance')
    axes[1, 0].set_xlabel('Importance Score')

# 4. Model comparison
models = ['RandomForest', best_name if best_name != 'RandomForest' else 'XGB/GB']
maes = [rf_mae, xgb_mae]
r2s = [rf_r2, xgb_r2]

x_pos = np.arange(len(models))
width = 0.35
bars1 = axes[1, 1].bar(x_pos - width/2, maes, width, label='MAE', color='#10b981')
ax2 = axes[1, 1].twinx()
bars2 = ax2.bar(x_pos + width/2, r2s, width, label='R²', color='#0d9488')
axes[1, 1].set_title('Model Comparison')
axes[1, 1].set_xticks(x_pos)
axes[1, 1].set_xticklabels(models)
axes[1, 1].set_ylabel('MAE')
ax2.set_ylabel('R² Score')
axes[1, 1].legend(loc='upper left')
ax2.legend(loc='upper right')

plt.tight_layout()
plt.savefig('model_evaluation.png', dpi=150, bbox_inches='tight')
plt.show()
print("📊 Evaluation plots saved to model_evaluation.png")

# %% --- Cell 7: Export Trained Model ---
# ============================================================
# 💾 EXPORT — Save the best model for deployment
# ============================================================

# The model needs to accept the ORIGINAL 5 features (not engineered ones)
# So we create a wrapper that does feature engineering internally

class DemandForecastModel:
    """Wrapper that handles feature engineering + prediction."""
    
    def __init__(self, model, feature_names):
        self.model = model
        self.feature_names = feature_names
        self.model_name = best_name
        self.metrics = {
            'mae': round(best_mae, 2),
            'rmse': round(best_rmse, 2),
            'r2': round(best_r2, 4)
        }
    
    def predict(self, df_input):
        """Accept a DataFrame with 5 base features, engineer extras, and predict."""
        if isinstance(df_input, pd.DataFrame):
            X = df_input.copy()
        else:
            X = pd.DataFrame(df_input, columns=['past_month_sales', 'price', 'stock_level', 'seasonality_index', 'promotion_active'])
        
        # Ensure base features exist
        for f in ['past_month_sales', 'price', 'stock_level', 'seasonality_index', 'promotion_active']:
            if f not in X.columns:
                X[f] = 0
        
        # Engineer same features as training
        X['sales_to_stock_ratio'] = np.where(X['stock_level'] > 0, X['past_month_sales'] / X['stock_level'], 0)
        X['price_x_seasonality'] = X['price'] * X['seasonality_index']
        X['sales_x_promo'] = X['past_month_sales'] * X['promotion_active']
        
        return self.model.predict(X[self.feature_names])


# Wrap and save
wrapped_model = DemandForecastModel(best_model, FEATURES_ENGINEERED)

MODEL_PATH = 'demand_model.pkl'
with open(MODEL_PATH, 'wb') as f:
    pickle.dump(wrapped_model, f)

file_size_mb = os.path.getsize(MODEL_PATH) / (1024 * 1024)
print(f"✅ Model exported: {MODEL_PATH} ({file_size_mb:.1f} MB)")
print(f"   Model: {best_name}")
print(f"   MAE: {best_mae:.2f}, R²: {best_r2:.4f}")

# %% --- Cell 8: Test the Exported Model ---
# ============================================================
# 🧪 SMOKE TEST — Verify the exported model works
# ============================================================

# Reload and test
with open(MODEL_PATH, 'rb') as f:
    loaded_model = pickle.load(f)

test_items = pd.DataFrame([
    {'past_month_sales': 150, 'price': 25.0, 'stock_level': 300, 'seasonality_index': 1.2, 'promotion_active': 1},
    {'past_month_sales': 30,  'price': 80.0, 'stock_level': 50,  'seasonality_index': 0.8, 'promotion_active': 0},
    {'past_month_sales': 200, 'price': 10.0, 'stock_level': 500, 'seasonality_index': 1.5, 'promotion_active': 1},
])

predictions = loaded_model.predict(test_items)
print("🧪 Smoke test predictions:")
for i, pred in enumerate(predictions):
    print(f"   Item {i+1}: Past sales={test_items.iloc[i]['past_month_sales']}, "
          f"Price=₹{test_items.iloc[i]['price']}, "
          f"→ Predicted demand: {round(pred)} units/month")

print(f"\n✅ Model verified and ready for deployment!")

# %% --- Cell 9: Download Model (Colab Only) ---
# ============================================================
# ⬇️ DOWNLOAD — Get the model file to your local machine
# ============================================================

try:
    from google.colab import files
    files.download(MODEL_PATH)
    print("📥 Download started! Place the file at:")
    print("   med-broker-app/ai-ml/models/demand_forecasting/demand_model.pkl")
except ImportError:
    print(f"ℹ️ Not running in Colab. Model saved locally at: {os.path.abspath(MODEL_PATH)}")
    print(f"   Copy it to: med-broker-app/ai-ml/models/demand_forecasting/demand_model.pkl")

# %% [markdown]
# ## 🚀 Deployment Instructions
# 
# 1. **Download** the `demand_model.pkl` file from above
# 2. **Replace** `med-broker-app/ai-ml/models/demand_forecasting/demand_model.pkl`
# 3. **Restart** the Flask API: `python ai-ml/apis/demand_api.py`
# 4. **Test** by logging in as a vendor and visiting the Demand Forecasting page
# 
# ### Re-training Schedule
# - Re-train **monthly** as new order data accumulates
# - Set `USE_REAL_DATA=True` and paste a fresh `ADMIN_TOKEN`
# - The model will continuously improve as your platform gets more data
