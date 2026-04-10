import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import LabelEncoder
import joblib
import os

base = os.path.dirname(os.path.abspath(__file__))

# Load training data
df = pd.read_csv(os.path.join(base, "Main_Training_2026.csv"))
for old in ["prognosis", "disease"]:
    if old in df.columns:
        df.rename(columns={old: "Disease"}, inplace=True)

drop = [c for c in ["Disease", "medicine"] if c in df.columns]
X = df.drop(columns=drop).select_dtypes(include=[np.number])
y_raw = df["Disease"].str.strip()

# Label Encoding
le = LabelEncoder()
y = le.fit_transform(y_raw)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print("Training model...")
clf = RandomForestClassifier(
    n_estimators=150, random_state=42,
    class_weight="balanced", n_jobs=-1
)
clf.fit(X_train, y_train)
acc = accuracy_score(y_test, clf.predict(X_test))
print(f"Accuracy: {acc:.4f}")

# Save (Model, Feature Names, Accuracy, Encoder)
joblib.dump((clf, X.columns.values, acc, le), os.path.join(base, "model_cache.pkl"))
print("Saved model_cache.pkl (including LabelEncoder) successfully!")