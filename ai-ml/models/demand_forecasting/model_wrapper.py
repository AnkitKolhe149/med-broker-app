"""
Shared DemandForecastModel wrapper class.
Must be importable by both the training script AND the Flask API 
so that pickle can correctly deserialize the saved model.
"""

import pandas as pd
import numpy as np
import torch
import torch.nn as nn

FEATURES = ['past_month_sales', 'price', 'stock_level', 'seasonality_index', 'promotion_active']
FEATURES_ENGINEERED = FEATURES + ['sales_to_stock_ratio', 'price_x_seasonality', 'sales_x_promo']

class DemandLSTM(nn.Module):
    """
    LSTM that consumes a sequence of the 5 base features
    and predicts the next month's demand (regression).
    """
    def __init__(self, input_dim: int, hidden_dim: int = 64,
                 num_layers: int = 2, dropout: float = 0.2):
        super().__init__()
        self.lstm = nn.LSTM(input_dim,
                            hidden_dim,
                            num_layers=num_layers,
                            batch_first=True,
                            dropout=dropout)
        self.fc = nn.Linear(hidden_dim, 1)

    def forward(self, x):
        # x shape: (batch, seq_len, input_dim)
        out, _ = self.lstm(x)
        out = out[:, -1, :]  # take last time step
        out = self.fc(out)
        return out

class DemandForecastModel:
    """Wrapper that handles feature engineering + prediction for LSTM."""
    
    def __init__(self, model, feature_names, scaler=None, model_name='LSTM', metrics=None, seq_length=6):
        self.model = model
        self.feature_names = feature_names
        self.scaler = scaler
        self.model_name = model_name
        self.metrics = metrics or {}
        self.seq_length = seq_length
    
    def predict(self, df_input):
        """Accept a DataFrame with 5 base features and return LSTM predictions."""
        if isinstance(df_input, pd.DataFrame):
            X = df_input.copy()
        else:
            X = pd.DataFrame(df_input, columns=FEATURES)
        
        # Ensure base features exist
        for f in FEATURES:
            if f not in X.columns:
                X[f] = 0
                
        # Prepare input using only self.feature_names
        input_df = X[self.feature_names].copy()
        
        # Scale features if a scaler is provided
        if self.scaler is not None:
            input_df[self.feature_names] = self.scaler.transform(input_df[self.feature_names])
            
        input_features = input_df.values.astype(np.float32)
            
        # The LSTM works on *sequences* - we need to build a single-step sequence for each item.
        # Create sequence by repeating the current row
        seq = np.tile(input_features[:, np.newaxis, :], (1, self.seq_length, 1))
        
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(device)
        self.model.eval()
        
        with torch.no_grad():
            tensor_seq = torch.from_numpy(seq).float().to(device)
            pred = self.model(tensor_seq).cpu().numpy().ravel()
            
        return pred

# Alias for compatibility
MedBrokerDemandModel = DemandForecastModel
