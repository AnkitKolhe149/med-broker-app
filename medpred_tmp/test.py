import pandas as pd
import numpy as np
import os
import re
import ast
import logging
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.preprocessing import LabelEncoder

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────
# MEDICAL SAFETY CONFIG
# ─────────────────────────────────────────────────────────
EMERGENCY_DISEASES = {"Heart attack", "Paralysis (brain hemorrhage)"}
HIGH_RISK_DISEASES = {
    "AIDS", "Tuberculosis", "Dengue", "Hepatitis B", "Hepatitis C",
    "Hepatitis D", "Hepatitis E", "hepatitis A", "Alcoholic hepatitis",
    "Malaria", "Typhoid", "Pneumonia", "Hypoglycemia",
    "Chronic cholestasis", "Jaundice",
}
EMERGENCY_SYMPTOMS = {
    "chest_pain", "breathlessness", "loss_of_balance",
    "weakness_of_one_body_side", "slurred_speech",
    "altered_sensorium", "coma", "stomach_bleeding", "blood_in_sputum",
}
CONFIDENCE_THRESHOLD = 40.0

# ─────────────────────────────────────────────────────────
# CACHED GLOBALS
# ─────────────────────────────────────────────────────────
_CSV_DATA = None
_DF_PAIR = None
_MODEL = None
_FEAT_NAMES = None
_ACCURACY = None
_ENCODER = None

def load_csv_data():
    global _CSV_DATA
    if _CSV_DATA is not None:
        return _CSV_DATA
    
    files = {
        "train": "Main_Training_2026.csv",
        "desc": "symptom_Description.csv",
        "precaution": "symptom_precaution.csv",
        "meds": "medications.csv",
        "diets": "diets.csv",
        "workouts": "workout_df.csv",
    }
    loaded = {}
    for key, fname in files.items():
        if not os.path.exists(fname):
            logger.error(f"File not found: {fname}")
            return None
        df = pd.read_csv(fname)
        # Standardize target column name
        for old in ["prognosis", "disease"]:
            if old in df.columns:
                df.rename(columns={old: "Disease"}, inplace=True)
        loaded[key] = df
    _CSV_DATA = loaded
    return _CSV_DATA

def load_1mg_data():
    global _DF_PAIR
    if _DF_PAIR is not None:
        return _DF_PAIR
    
    df_1mg = None
    if os.path.exists("1mg.csv"):
        df_1mg = pd.read_csv("1mg.csv", low_memory=False)
        if "activeIngredient" in df_1mg.columns:
            df_1mg["_ingredient_lower"] = df_1mg["activeIngredient"].fillna("").str.lower()

    df_az = None
    if os.path.exists("A_Z_medicines_dataset_of_India.csv"):
        df_az = pd.read_csv("A_Z_medicines_dataset_of_India.csv", low_memory=False)
        comp_col = next((c for c in df_az.columns if "composition" in c.lower()), None)
        if comp_col:
            df_az["_comp_lower"] = df_az[comp_col].fillna("").str.lower()
            
    _DF_PAIR = (df_1mg, df_az)
    return _DF_PAIR

# ─────────────────────────────────────────────────────────
# CORRECTED MODEL TRAINING
# ─────────────────────────────────────────────────────────
def get_model():
    global _MODEL, _FEAT_NAMES, _ACCURACY, _ENCODER
    if _MODEL is not None:
        return _MODEL, _FEAT_NAMES, _ACCURACY, _ENCODER

    data = load_csv_data()
    if data is None: return None, None, None, None

    df = data["train"].copy()
    X = df.drop(columns=["Disease"]).select_dtypes(include=[np.number])
    y = df["Disease"].str.strip()

    # FIX: Implement LabelEncoder
    _ENCODER = LabelEncoder()
    y_encoded = _ENCODER.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    
    clf = RandomForestClassifier(n_estimators=150, random_state=42, class_weight="balanced")
    clf.fit(X_train, y_train)
    
    _MODEL = clf
    _FEAT_NAMES = X.columns.values
    _ACCURACY = accuracy_score(y_test, clf.predict(X_test))
    
    return _MODEL, _FEAT_NAMES, _ACCURACY, _ENCODER

def evaluate_model():
    model, features, accuracy, encoder = get_model()
    if model is None:
        print("Model evaluation failed: Data not found.")
        return

    data = load_csv_data()
    df = data["train"].copy()
    X = df.drop(columns=["Disease"]).select_dtypes(include=[np.number])
    y = encoder.transform(df["Disease"].str.strip())
    
    _, X_test, _, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    y_pred = model.predict(X_test)
    
    print("\n" + "="*40)
    print("       MODEL PERFORMANCE METRICS")
    print("="*40)
    print(f"Overall Accuracy: {accuracy*100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=encoder.classes_))
    
    # Optional: Confusion Matrix summary
    cm = confusion_matrix(y_test, y_pred)
    print("\nConfusion Matrix Summary:")
    print(f"Total Test Samples: {len(y_test)}")
    print(f"Correct Predictions: {np.sum(np.diag(cm))}")
    print(f"Incorrect Predictions: {len(y_test) - np.sum(np.diag(cm))}")
    print("="*40 + "\n")

# ─────────────────────────────────────────────────────────
# PREDICTION LOGIC
# ─────────────────────────────────────────────────────────
def predict(symptoms: list) -> dict:
    if not symptoms:
        return {"error": "Please select at least one symptom."}

    # FIX: Unpack 4 values
    model, feature_names, accuracy, encoder = get_model()
    if model is None:
        return {"error": "Model/Data loading failed."}

    data = load_csv_data()
    df_pair = load_1mg_data()

    # Symptom Vectorization
    def normalize_sym(name): return re.sub(r'[^a-z0-9]', '', name.lower())
    norm_features = {normalize_sym(f): i for i, f in enumerate(feature_names)}
    
    input_vector = np.zeros(len(feature_names))
    matched_keys = []
    for s in symptoms:
        target = normalize_sym(s)
        if target in norm_features:
            idx = norm_features[target]
            input_vector[idx] = 1
            matched_keys.append(feature_names[idx])

    if np.sum(input_vector) == 0:
        return {"error": "No symptoms matched. Please check your spelling."}

    # Predict
    y_val = model.predict([input_vector])[0]
    prediction = encoder.inverse_transform([y_val])[0].strip()
    probs = model.predict_proba([input_vector])
    confidence = float(np.max(probs) * 100)

    if confidence < CONFIDENCE_THRESHOLD:
        return {"error": f"Low confidence ({confidence:.1f}%). Consult a doctor."}

    # Metadata Fetching
    def csv_get(df, col, disease):
        row = df[df["Disease"].str.strip() == disease]
        return row[col].values[0] if not row.empty else None

    # Description and Precautions
    desc_text = csv_get(data["desc"], "Description", prediction)
    prec_row = data["precaution"][data["precaution"]["Disease"].str.strip() == prediction]
    precautions = [str(v).strip() for v in prec_row.iloc[0, 1:].dropna() if str(v).strip()] if not prec_row.empty else []

    # Diets and Workouts
    diet_text = csv_get(data["diets"], "Diet", prediction)
    diet_items = ast.literal_eval(diet_text) if diet_text and diet_text.startswith('[') else []
    
    work_rows = data["workouts"][data["workouts"]["Disease"].str.strip() == prediction]
    workouts = work_rows["workout"].tolist() if not work_rows.empty else []

    return {
        "disease": prediction,
        "confidence": round(confidence, 2),
        "description": desc_text or "No description available.",
        "precautions": precautions,
        "diet": diet_items,
        "workouts": workouts,
        "error": None
    }

if __name__ == "__main__":
    # Generate Metrics
    evaluate_model()

    print("--- Sample Prediction Test ---")
    test_symptoms = ["itching", "skin_rash", "nodal_skin_eruptions"]
    print(f"Testing symptoms: {test_symptoms}")
    
    result = predict(test_symptoms)
    
    if result.get("error"):
        print(f"Error: {result['error']}")
    else:
        print(f"Predicted Disease: {result['disease']}")
        print(f"Confidence: {result['confidence']}%")
        print(f"Description: {result['description']}")
        print(f"Precautions: {', '.join(result['precautions'])}")
        print(f"Diet: {', '.join(result['diet'])}")
        print(f"Workouts: {', '.join(result['workouts'])}")