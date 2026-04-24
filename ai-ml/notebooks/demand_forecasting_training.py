# =============================================================================
# MedBroker — Demand Forecasting Model Training (Google Colab / Local)
# =============================================================================
# This notebook trains a demand forecasting model using a sequence-based PyTorch LSTM.
# It aligns with methodologies outlined in PMC9540101 for applying Deep Neural Networks
# to time-series pharmaceutical sales data, utilizing the original Kaggle structure 
# (M. Zdravkovic's Pharma Sales Data) and MedBroker backend integration.
# =============================================================================

# %% [markdown]
# # 🧬 MedBroker Demand Forecasting — LSTM Training Pipeline
# ---
# **Objective**: Train a deep learning model (LSTM) to predict next-month medicine demand.
# **Methodology**: Based on PMC9540101 (Deep Neural Networks for Time-Series Pharma Data).
# **Features**: past_month_sales, price, stock_level, seasonality_index, promotion_active
# **Target**: actual_next_month_sales (units)

# %% --- Cell 1: Install Dependencies ---
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import pickle
import os
import sys
import warnings
from datetime import datetime, timedelta

warnings.filterwarnings('ignore')

import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Add model directory to path so pickle can find DemandForecastModel wrapper
try:
    model_dir = os.path.join(os.path.dirname(__file__), '..', 'models', 'demand_forecasting')
    sys.path.insert(0, os.path.abspath(model_dir))
except NameError:
    pass

try:
    from model_wrapper import DemandLSTM, DemandForecastModel
except ImportError:
    print("⚠️ model_wrapper not found! Creating it dynamically for Colab...")
    wrapper_code = """
import pandas as pd
import numpy as np
import torch
import torch.nn as nn

FEATURES = ['past_month_sales', 'price', 'stock_level', 'seasonality_index', 'promotion_active']
FEATURES_ENGINEERED = FEATURES + ['sales_to_stock_ratio', 'price_x_seasonality', 'sales_x_promo']

class DemandLSTM(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int = 64, num_layers: int = 2, dropout: float = 0.2):
        super().__init__()
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers=num_layers, batch_first=True, dropout=dropout)
        self.fc = nn.Linear(hidden_dim, 1)

    def forward(self, x):
        out, _ = self.lstm(x)
        out = out[:, -1, :]
        out = self.fc(out)
        return out

class DemandForecastModel:
    def __init__(self, model, feature_names, scaler=None, model_name='LSTM', metrics=None, seq_length=6):
        self.model = model
        self.feature_names = feature_names
        self.scaler = scaler
        self.model_name = model_name
        self.metrics = metrics or {}
        self.seq_length = seq_length
    
    def predict(self, df_input):
        if isinstance(df_input, pd.DataFrame):
            X = df_input.copy()
        else:
            X = pd.DataFrame(df_input, columns=FEATURES)
        
        for f in FEATURES:
            if f not in X.columns:
                X[f] = 0
                
        input_df = X[self.feature_names].copy()
        if self.scaler is not None:
            input_df[self.feature_names] = self.scaler.transform(input_df[self.feature_names])
            
        input_features = input_df.values.astype(np.float32)
        seq = np.tile(input_features[:, np.newaxis, :], (1, self.seq_length, 1))
        
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(device)
        self.model.eval()
        
        with torch.no_grad():
            tensor_seq = torch.from_numpy(seq).float().to(device)
            pred = self.model(tensor_seq).cpu().numpy().ravel()
            
        return pred

MedBrokerDemandModel = DemandForecastModel
"""
    with open("model_wrapper.py", "w", encoding="utf-8") as f:
        f.write(wrapper_code.strip())
    
    from model_wrapper import DemandLSTM, DemandForecastModel
    print("✅ Created and loaded model_wrapper.py locally in Colab.")

print("✅ All dependencies loaded successfully")

# %% --- Cell 2: Configuration ---
# ============================================================
# ⚙️ CONFIGURATION
# ============================================================
# Option A: Fetch real data from your running backend
BACKEND_URL = "http://localhost:4000/api"
ADMIN_TOKEN = ""  # Paste your admin JWT token here

# Option B: Synthetic generation if real database is sparse
USE_REAL_DATA = True
MIN_REAL_ROWS = 50

# Neural Network Hyperparameters (as per PMC9540101 methodology for time-series)
RANDOM_STATE = 42
TEST_SIZE = 0.2
SEQ_LENGTH = 6          # Look-back window
BATCH_SIZE = 64
EPOCHS = 100            # Deep neural network convergence
LR = 0.001
HIDDEN_DIM = 128
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

print(f"📋 Config loaded: Backend={BACKEND_URL}, RealData={USE_REAL_DATA}")

# %% --- Cell 3: Data Loading & Generation ---
# ============================================================
# 📊 DATA LOADING — Original MedBroker / Kaggle Structure
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
            df = pd.DataFrame(result['data']['rows'])
            print(f"✅ Fetched {len(df)} rows from backend API")
            return df
    except Exception as e:
        print(f"⚠️ Could not connect to backend: {e}")
    return None

def generate_realistic_pharma_data(n_medicines=100, n_months=48):
    """
    Generate realistic pharmaceutical demand data matching the original 
    pre-COVID Kaggle structure (M. Zdravkovic dataset style).
    """
    print("ℹ️ Auto-generating realistic baseline pharmaceutical data...")
    np.random.seed(RANDOM_STATE)
    
    categories = {
        'Antibiotics':       {'base': 120, 'price': (15, 80),  'peak': [11, 12, 1, 2]},
        'Painkillers':       {'base': 200, 'price': (5, 40),   'peak': []},
        'Antihistamines':    {'base': 80,  'price': (10, 50),  'peak': [3, 4, 5, 9, 10]},
        'Cardiovascular':    {'base': 60,  'price': (30, 150), 'peak': []},
        'Diabetes':          {'base': 90,  'price': (20, 120), 'peak': []},
        'Dermatology':       {'base': 45,  'price': (15, 80),  'peak': [5, 6, 7, 8]},
        'Gastrointestinal':  {'base': 100, 'price': (8, 45),   'peak': [4, 5, 10, 11]},
        'Respiratory':       {'base': 85,  'price': (12, 70),  'peak': [10, 11, 12, 1, 2]},
        'Vitamins':          {'base': 150, 'price': (5, 35),   'peak': [1, 2, 3]},
    }
    
    rows = []
    med_id_counter = 0
    start_date = datetime(2015, 1, 1) # Pre-COVID baseline
    
    for category, profile in categories.items():
        n_meds = max(2, n_medicines // len(categories))
        for _ in range(n_meds):
            med_id_counter += 1
            med_name = f"{category}_Drug_{med_id_counter}"
            price = round(np.random.uniform(*profile['price']), 2)
            base = profile['base']
            med_popularity = np.random.uniform(0.6, 1.4)
            
            for month_offset in range(n_months + 1): 
                current_date = start_date + timedelta(days=30*month_offset)
                month_key = current_date.strftime('%Y-%m')
                month_num = current_date.month
                
                # Standard seasonality
                seasonality = 1.3 if month_num in profile['peak'] else 0.9
                seasonality += np.random.uniform(-0.1, 0.1)
                
                promo = 1 if np.random.random() < 0.15 else 0
                promo_uplift = 1.25 if promo else 1.0
                
                stock = max(0, int(np.random.normal(base * 3, base * 0.5)))
                
                sales = max(0, int(
                    base * med_popularity * seasonality * promo_uplift
                    + np.random.normal(0, base * 0.15)
                ))
                
                sales = min(sales, stock)
                
                rows.append({
                    'medicine_id': f'med_{med_id_counter:03d}',
                    'medicine_name': med_name,
                    'category': category,
                    'month': month_key,
                    'past_month_sales': sales,
                    'price': price,
                    'stock_level': stock,
                    'seasonality_index': round(seasonality, 2),
                    'promotion_active': promo
                })
                
    df_raw = pd.DataFrame(rows)
    df_raw = df_raw.sort_values(['medicine_id', 'month'])
    df_raw['actual_next_month_sales'] = df_raw.groupby('medicine_id')['past_month_sales'].shift(-1)
    df_raw = df_raw.dropna()
    return df_raw

def load_kaggle_dataset():
    """
    Attempt to load the actual Kaggle dataset (M. Zdravkovic's salesmonthly.csv).
    Since the Kaggle dataset only has date and ATC category sales, we reshape it
    and simulate the missing MedBroker features (price, stock, promos) to maintain API compatibility.
    """
    possible_paths = [
        "salesdaily.csv",
        "/content/salesdaily.csv",
        "../salesdaily.csv",
        "/salesdaily.csv"
    ]
    
    csv_path = None
    for path in possible_paths:
        if os.path.exists(path):
            csv_path = path
            break
            
    if csv_path:
        print(f"✅ Found real Kaggle dataset: {csv_path}. Processing...")
        df_raw = pd.read_csv(csv_path)
        
        # Melt the Kaggle dataset from Wide (columns=drugs) to Long (rows=drugs)
        # Kaggle columns are ATC codes like 'M01AB', 'N02BA', etc.
        # salesdaily.csv also contains 'Year', 'Month', 'Hour', 'Weekday Name' which we must ignore
        valid_drugs = ['M01AB', 'M01AE', 'N02BA', 'N02BE', 'N05B', 'N05C', 'R03', 'R06']
        atc_cols = [c for c in df_raw.columns if c in valid_drugs]
        
        df_melt = df_raw.melt(id_vars=['datum'], value_vars=atc_cols, 
                              var_name='medicine_id', value_name='past_month_sales')
        
        # Standardize month format for our sequences
        df_melt['datum'] = pd.to_datetime(df_melt['datum'])
        df_melt['month'] = df_melt['datum'].dt.strftime('%Y-%m-%d') # Use daily for sequence length
        
        # To maintain compatibility with MedBroker's 5-feature API, 
        # we generate historically realistic prices and stock for these real Kaggle sales.
        np.random.seed(RANDOM_STATE)
        
        # Assign fixed base prices/stock patterns per medicine category
        med_profiles = {}
        for med in atc_cols:
            med_profiles[med] = {
                'price': round(np.random.uniform(10, 100), 2),
                'stock_multiplier': np.random.uniform(1.5, 3.0)
            }
            
        rows = []
        for _, row in df_melt.iterrows():
            med = row['medicine_id']
            # Scale daily Kaggle data up by 30 to match MedBroker's "monthly" API volume expectations
            sales = max(0, int(row['past_month_sales'] * 30))
            
            # Reconstruct missing system variables
            price = med_profiles[med]['price']
            stock = max(sales, int(sales * med_profiles[med]['stock_multiplier'] + np.random.normal(0, 10)))
            month_num = row['datum'].month
            seasonality = 1.2 if month_num in [11, 12, 1, 2] else 0.9
            promo = 1 if np.random.random() < 0.15 else 0
            
            rows.append({
                'medicine_id': med,
                'medicine_name': f"Kaggle_Drug_{med}",
                'category': 'Kaggle_ATC',
                'month': row['month'],
                'past_month_sales': sales,
                'price': price,
                'stock_level': stock,
                'seasonality_index': round(seasonality, 2),
                'promotion_active': promo
            })
            
        df_processed = pd.DataFrame(rows)
        df_processed = df_processed.sort_values(['medicine_id', 'month'])
        df_processed['actual_next_month_sales'] = df_processed.groupby('medicine_id')['past_month_sales'].shift(-1)
        df_processed = df_processed.dropna()
        
        print(f"✅ Successfully converted Kaggle data into {len(df_processed)} training sequences.")
        return df_processed
    else:
        print("ℹ️ Local Kaggle CSV not found. Using realistic generator fallback.")
        return generate_realistic_pharma_data(n_medicines=100, n_months=48)

df = None
if USE_REAL_DATA and ADMIN_TOKEN:
    df = fetch_real_data(BACKEND_URL, ADMIN_TOKEN)

if df is None or len(df) < MIN_REAL_ROWS:
    df = load_kaggle_dataset()

print(f"\n📊 Final dataset: {len(df)} rows × {len(df.columns)} columns")

# %% --- Cell 4: LSTM Sequence Preparation (PMC9540101) ---
# ============================================================
# 📈 TIME-SERIES SEQUENCING & SCALING
# ============================================================

def build_sequences(df_seq):
    df_seq = df_seq.sort_values(['medicine_id', 'month']).copy()
    base_features = ['past_month_sales', 'price', 'stock_level', 'seasonality_index', 'promotion_active']
    df_seq[base_features] = df_seq[base_features].fillna(0)
    
    # Scale Features for stable DNN gradients
    scaler = StandardScaler()
    df_seq[base_features] = scaler.fit_transform(df_seq[base_features])
    
    X_seq, y = [], []
    for med_id, grp in df_seq.groupby('medicine_id'):
        grp = grp.reset_index(drop=True)
        if len(grp) < SEQ_LENGTH + 1:
            continue
        for i in range(len(grp) - SEQ_LENGTH):
            window = grp.loc[i:i + SEQ_LENGTH - 1, base_features].values
            target = grp.loc[i + SEQ_LENGTH, 'actual_next_month_sales']
            X_seq.append(window)
            y.append(target)
            
    X_seq = np.array(X_seq, dtype=np.float32)
    y = np.array(y, dtype=np.float32).reshape(-1, 1)
    print(f"⏳ Built {X_seq.shape[0]} sequences (seq_len={SEQ_LENGTH}, features={len(base_features)})")
    return X_seq, y, base_features, scaler

X_seq, y_seq, FEATURES, feature_scaler = build_sequences(df)

X_seq_train, X_seq_test, y_seq_train, y_seq_test = train_test_split(
    X_seq, y_seq, test_size=TEST_SIZE, random_state=RANDOM_STATE
)
print(f"\n✂️ Sequence split: Train={X_seq_train.shape[0]}, Test={X_seq_test.shape[0]}")

# %% --- Cell 5: Train LSTM Model ---
# ============================================================
# 🧠 MODEL TRAINING
# ============================================================

train_dataset = TensorDataset(torch.from_numpy(X_seq_train), torch.from_numpy(y_seq_train))
test_dataset  = TensorDataset(torch.from_numpy(X_seq_test), torch.from_numpy(y_seq_test))

train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, pin_memory=True)
test_loader  = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False, pin_memory=True)

model = DemandLSTM(input_dim=X_seq.shape[2], hidden_dim=HIDDEN_DIM).to(DEVICE)
optimizer = torch.optim.Adam(model.parameters(), lr=LR, weight_decay=1e-5)
criterion = nn.MSELoss()

def train_lstm(model, loader, optimizer, criterion, device):
    model.train()
    epoch_loss = 0.0
    for xb, yb in loader:
        xb, yb = xb.to(device), yb.to(device)
        optimizer.zero_grad()
        pred = model(xb)
        loss = criterion(pred, yb)
        loss.backward()
        optimizer.step()
        epoch_loss += loss.item() * xb.size(0)
    return epoch_loss / len(loader.dataset)

def eval_lstm(model, loader, criterion, device):
    model.eval()
    epoch_loss = 0.0
    preds, trues = [], []
    with torch.no_grad():
        for xb, yb in loader:
            xb, yb = xb.to(device), yb.to(device)
            pred = model(xb)
            loss = criterion(pred, yb)
            epoch_loss += loss.item() * xb.size(0)
            preds.append(pred.cpu().numpy())
            trues.append(yb.cpu().numpy())
    preds = np.concatenate(preds).ravel()
    trues = np.concatenate(trues).ravel()
    return epoch_loss / len(loader.dataset), preds, trues

print("\n🛤️  Starting PyTorch LSTM training ...")
for epoch in range(1, EPOCHS + 1):
    train_loss = train_lstm(model, train_loader, optimizer, criterion, DEVICE)
    val_loss, val_pred, val_true = eval_lstm(model, test_loader, criterion, DEVICE)

    if epoch % 10 == 0 or epoch == 1:
        print(f"Epoch {epoch:03d}/{EPOCHS} | Train MSE: {train_loss:.2f} | Val MSE: {val_loss:.2f}")

val_mae  = mean_absolute_error(val_true, val_pred)
val_rmse = np.sqrt(mean_squared_error(val_true, val_pred))
val_r2   = r2_score(val_true, val_pred)

print(f"\n📊 LSTM validation - MAE: {val_mae:.2f}, RMSE: {val_rmse:.2f}, R²: {val_r2:.4f}")

best_model = model
best_name = "LSTM"
best_mae, best_rmse, best_r2 = val_mae, val_rmse, val_r2

# %% --- Cell 6: Export Trained Model ---
# ============================================================
# 💾 EXPORT — Save the LSTM model + Scaler
# ============================================================

wrapped_model = DemandForecastModel(
    model=best_model.to('cpu'), 
    feature_names=FEATURES,
    scaler=feature_scaler,
    model_name=best_name,
    metrics={'mae': round(best_mae, 2), 'rmse': round(best_rmse, 2), 'r2': round(best_r2, 4)},
    seq_length=SEQ_LENGTH
)

MODEL_PATH = 'demand_model.pkl'

with open(MODEL_PATH, 'wb') as f:
    pickle.dump(wrapped_model, f)

file_size_mb = os.path.getsize(MODEL_PATH) / (1024 * 1024)
print(f"\n✅ Model exported: {MODEL_PATH} ({file_size_mb:.1f} MB)")
print(f"   Model: {best_name}")

try:
    target_dir = os.path.join(os.path.dirname(__file__), '..', 'models', 'demand_forecasting')
    target_path = os.path.join(target_dir, 'demand_model.pkl')
    
    import shutil
    shutil.copy2(MODEL_PATH, target_path)
    print(f"✅ Model automatically copied to {os.path.abspath(target_path)}")
except NameError:
    print(f"ℹ️ Running in Colab/Jupyter. You can download {MODEL_PATH} from the file explorer on the left.")
except Exception as e:
    print(f"⚠️ Could not copy model automatically: {e}")

# %% --- Cell 7: Test the Exported Model ---
# ============================================================
# 🧪 SMOKE TEST
# ============================================================

print("\n🧪 Running smoke test via Wrapper...")
test_items = pd.DataFrame([
    {'past_month_sales': 150, 'price': 25.0, 'stock_level': 300, 'seasonality_index': 1.2, 'promotion_active': 1},
    {'past_month_sales': 30,  'price': 80.0, 'stock_level': 50,  'seasonality_index': 0.8, 'promotion_active': 0},
    {'past_month_sales': 200, 'price': 10.0, 'stock_level': 500, 'seasonality_index': 1.5, 'promotion_active': 1},
])

predictions = wrapped_model.predict(test_items)
for i, pred in enumerate(predictions):
    print(f"   Item {i+1}: Past sales={test_items.iloc[i]['past_month_sales']}, "
          f"→ Predicted demand: {round(pred)} units/month")

print(f"\n🚀 Complete! Restart the Flask API (demand_api.py) to use the new LSTM model.")
