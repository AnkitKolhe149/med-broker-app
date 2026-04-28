import torch
import pickle
import json
import os
import sys
import numpy as np

# Add model directory to path so pickle can find DemandForecastModel and DemandLSTM
current_dir = os.path.dirname(os.path.abspath(__file__))
model_dir = os.path.join(current_dir, '..', 'models', 'demand_forecasting')
sys.path.insert(0, model_dir)

try:
    from model_wrapper import DemandForecastModel, DemandLSTM
except ImportError:
    print("Error: Could not import model_wrapper. Please ensure it exists in ai-ml/models/demand_forecasting/")
    sys.exit(1)

def export_model():
    model_path = os.path.join(model_dir, 'demand_model.pkl')
    onnx_path = os.path.join(model_dir, 'demand_model.onnx')
    scaler_path = os.path.join(model_dir, 'scaler_params.json')

    if not os.path.exists(model_path):
        print(f"Error: {model_path} not found.")
        return

    print(f"Loading model from {model_path}...")
    with open(model_path, 'rb') as f:
        wrapped_model = pickle.load(f)

    # 1. Export the PyTorch Model to ONNX
    print("Exporting PyTorch model to ONNX...")
    model = wrapped_model.model
    model.eval()

    # Create dummy input: [batch_size, seq_length, input_dim]
    # Based on training script: seq_length=6, input_dim=5
    seq_length = getattr(wrapped_model, 'seq_length', 6)
    input_dim = 5 # default base features
    dummy_input = torch.randn(1, seq_length, input_dim)

    torch.onnx.export(
        model,
        dummy_input,
        onnx_path,
        export_params=True,
        opset_version=12,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
    )
    print(f"✅ Model exported to: {onnx_path}")

    # 2. Export Scaler Parameters
    print("Exporting scaler parameters to JSON...")
    scaler = wrapped_model.scaler
    scaler_params = {
        "mean": scaler.mean_.tolist(),
        "scale": scaler.scale_.tolist(),
        "feature_names": wrapped_model.feature_names,
        "seq_length": seq_length
    }

    with open(scaler_path, 'w') as f:
        json.dump(scaler_params, f, indent=2)
    print(f"✅ Scaler parameters saved to: {scaler_path}")

    print("\n🚀 Export complete. You can now use these files in Node.js.")

if __name__ == '__main__':
    export_model()
