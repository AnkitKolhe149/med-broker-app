import gradio as gr
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import warnings
import logging
import os
import ast
import re
from collections import defaultdict

warnings.filterwarnings("ignore")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────
# MEDICAL SAFETY CONFIG
# ─────────────────────────────────────────────────────────
EMERGENCY_DISEASES = {
    "Heart attack",
    "Paralysis (brain hemorrhage)",
}

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
LOW_CONFIDENCE_WARN  = 60.0

# ─────────────────────────────────────────────────────────
# NEON DB
# ─────────────────────────────────────────────────────────
def _read_conn_str_from_toml():
    """Read connection string from .streamlit/secrets.toml as a fallback."""
    try:
        base = os.path.dirname(os.path.abspath(__file__))
        toml_path = os.path.join(base, ".streamlit", "secrets.toml")
        if not os.path.exists(toml_path):
            return None
        import re as _re
        with open(toml_path, "r", encoding="utf-8") as f:
            content = f.read()
        # Look for connection_string = "..." under [neon] section
        match = _re.search(r'connection_string\s*=\s*["\']([^"\']+)["\']', content)
        if match:
            return match.group(1)
    except Exception as e:
        logger.warning(f"Could not read secrets.toml: {e}")
    return None


def get_db_connection():
    try:
        import psycopg2
        conn_str = os.environ.get("NEON_CONNECTION_STRING")
        if not conn_str:
            conn_str = _read_conn_str_from_toml()
        if not conn_str:
            logger.warning("No DB connection string found in env or secrets.toml")
            return None
        logger.info("Connecting to DB...")
        return psycopg2.connect(conn_str)
    except ImportError:
        logger.warning("psycopg2 not installed")
        return None
    except Exception as e:
        logger.error(f"DB connection failed: {e}")
        return None


def ensure_diagnostic_log_table(conn):
    sql = """
        CREATE TABLE IF NOT EXISTS "DiagnosticLog" (
            id                SERIAL PRIMARY KEY,
            symptoms          TEXT[],
            predicted_disease TEXT,
            confidence        FLOAT,
            severity_flag     TEXT,
            created_at        TIMESTAMP DEFAULT NOW()
        );
    """
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.commit()


def log_prediction(conn, symptoms, disease, confidence, severity_flag):
    try:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO "DiagnosticLog"
                   (symptoms, predicted_disease, confidence, severity_flag)
                   VALUES (%s, %s, %s, %s)""",
                (symptoms, disease, float(confidence), severity_flag)
            )
        conn.commit()
    except Exception as e:
        logger.warning(f"Could not log prediction: {e}")


def fetch_disease_info_from_db(conn, disease_name):
    info = {"description": None, "severity": "moderate",
            "medication": None, "db_hit": False}
    try:
        with conn.cursor() as cur:
            cur.execute(
                'SELECT id, description FROM "Condition" WHERE name = %s',
                (disease_name,)
            )
            row = cur.fetchone()
            if not row:
                cur.execute(
                    'SELECT id, description FROM "Condition" WHERE name ILIKE %s',
                    (f"%{disease_name}%",)
                )
                row = cur.fetchone()

            if row:
                cid                 = row[0]
                info["description"] = row[1]
                info["db_hit"]      = True
                cur.execute(
                    """SELECT m.name FROM "Medicine" m
                       JOIN "ConditionMedicine" cm ON cm."medicineId" = m.id
                       WHERE cm."conditionId" = %s""",
                    (cid,)
                )
                meds = [r[0] for r in cur.fetchall()]
                if meds:
                    info["medication"] = ", ".join(meds)
    except Exception as e:
        logger.warning(f"DB fetch error for '{disease_name}': {e}")
    return info


def fetch_db_medicines_with_vendors(conn, disease_name=None):
    rows = []
    condition_id = None

    if disease_name and conn:
        try:
            with conn.cursor() as cur:
                cur.execute(
                    'SELECT id FROM "Condition" WHERE name = %s',
                    (disease_name,)
                )
                row = cur.fetchone()
                if not row:
                    cur.execute(
                        'SELECT id FROM "Condition" WHERE name ILIKE %s',
                        (f"%{disease_name}%",)
                    )
                    row = cur.fetchone()
                if row:
                    condition_id = row[0]
        except Exception as e:
            logger.warning(f"Condition lookup failed: {e}")

    if condition_id is None:
        return [], False

    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    m.id            AS medicine_id,
                    m.name          AS medicine_name,
                    m.description   AS medicine_desc,
                    m."priceCents"  AS price_cents,
                    v."companyName" AS vendor_name,
                    v."vendorType"  AS vendor_type,
                    v.country       AS vendor_country,
                    v.state         AS vendor_state,
                    v."contactNumber" AS vendor_contact,
                    v."verificationStatus" AS vendor_status,
                    inv.quantity    AS stock_qty,
                    inv."sourceCurrencyCode" AS currency,
                    inv."sourcePriceMinor"   AS source_price_minor,
                    inv."basePriceMinor"     AS base_price_minor,
                    inv."baseCurrencyCode"   AS base_currency
                FROM "Medicine" m
                JOIN "ConditionMedicine" cm ON cm."medicineId" = m.id
                LEFT JOIN "Inventory" inv ON inv."medicineId" = m.id
                LEFT JOIN "Vendor" v ON v.id = inv."vendorId"
                WHERE cm."conditionId" = %s
                ORDER BY m.name, inv."basePriceMinor"
            """, (condition_id,))
            cols = [desc[0] for desc in cur.description]
            for r in cur.fetchall():
                rows.append(dict(zip(cols, r)))
    except Exception as e:
        logger.warning(f"DB medicines fetch error: {e}")
    return rows, True


# ─────────────────────────────────────────────────────────
# CSV DATA LOADING (cached at module level)
# ─────────────────────────────────────────────────────────
_CSV_DATA   = None
_DF_PAIR    = None
_MODEL      = None
_FEAT_NAMES = None
_ACCURACY   = None
_SYMPTOM_CHOICES = []


def load_csv_data():
    global _CSV_DATA
    if _CSV_DATA is not None:
        return _CSV_DATA
    base  = os.path.dirname(os.path.abspath(__file__))
    files = {
        "train":      "Main_Training_2026.csv",
        "desc":       "symptom_Description.csv",
        "precaution": "symptom_precaution.csv",
        "meds":       "medications.csv",
        "diets":      "diets.csv",
        "workouts":   "workout_df.csv",
    }
    loaded = {}
    for key, fname in files.items():
        path = os.path.join(base, fname)
        if not os.path.exists(path):
            logger.error(f"File not found: {fname}")
            return None
        df = pd.read_csv(path)
        if df.empty:
            logger.error(f"Empty file: {fname}")
            return None
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
    base = os.path.dirname(os.path.abspath(__file__))

    df_1mg = None
    path_1mg = os.path.join(base, "1mg.csv")
    if os.path.exists(path_1mg):
        try:
            df_1mg = pd.read_csv(path_1mg, low_memory=False)
            if "activeIngredient" in df_1mg.columns:
                df_1mg["_ingredient_lower"] = df_1mg["activeIngredient"].fillna("").str.lower()
        except Exception as e:
            logger.warning(f"Could not load 1mg.csv: {e}")

    df_az = None
    path_az = os.path.join(base, "A_Z_medicines_dataset_of_India.csv")
    if os.path.exists(path_az):
        try:
            df_az = pd.read_csv(path_az, low_memory=False)
            comp_col = next(
                (c for c in df_az.columns if "composition" in c.lower() or "ingredient" in c.lower()),
                None,
            )
            if comp_col:
                df_az["_comp_lower"] = df_az[comp_col].fillna("").str.lower()
            else:
                df_az["_comp_lower"] = ""
        except Exception as e:
            logger.warning(f"Could not load A_Z dataset: {e}")

    if df_1mg is None and df_az is None:
        _DF_PAIR = None
    else:
        _DF_PAIR = (df_1mg, df_az)
    return _DF_PAIR


# Disease → specific active ingredient
DISEASE_DRUG_MAP = {
    "Fungal infection": "Clotrimazole",
    "Impetigo": "Mupirocin",
    "Chicken pox": "Acyclovir",
    "Shingles": "Valacyclovir",
    "Tuberculosis": "Rifampicin",
    "Typhoid": "Ciprofloxacin",
    "Malaria": "Chloroquine",
    "Dengue": "Paracetamol",
    "Hepatitis A": "Ribavirin",
    "hepatitis A": "Ribavirin",
    "Hepatitis B": "Tenofovir",
    "Hepatitis C": "Sofosbuvir",
    "Hepatitis D": "Tenofovir",
    "Hepatitis E": "Ribavirin",
    "Alcoholic hepatitis": "Prednisolone",
    "AIDS": "Lamivudine",
    "Pneumonia": "Amoxicillin",
    "Drug Reaction": "Cetirizine",
    "Acne": "Clindamycin",
    "Psoriasis": "Methotrexate",
    "Urticaria": "Loratadine",
    "GERD": "Pantoprazole",
    "Gastroesophageal reflux disease": "Omeprazole",
    "Peptic ulcer diseae": "Omeprazole",
    "Chronic cholestasis": "Ursodeoxycholic acid",
    "Jaundice": "Ursodeoxycholic acid",
    "Gastroenteritis": "Ondansetron",
    "Diarrhoea": "Loperamide",
    "Constipation": "Lactulose",
    "Dimorphic hemmorhoids(piles)": "Diosmin",
    "Dimorphic Hemorrhoids": "Diosmin",
    "Piles": "Diosmin",
    "Bronchial Asthma": "Salbutamol",
    "Allergy": "Cetirizine",
    "Common Cold": "Pseudoephedrine",
    "Hyperthyroidism": "Carbimazole",
    "Hypothyroidism": "Levothyroxine",
    "Hypertension": "Amlodipine",
    "Heart attack": "Aspirin",
    "Varicose veins": "Diosmin",
    "Diabetes": "Metformin",
    "Hypoglycemia": "Dextrose",
    "Obesity": "Orlistat",
    "Arthritis": "Ibuprofen",
    "Osteoarthristis": "Diclofenac",
    "Cervical spondylosis": "Diclofenac",
    "Paralysis (brain hemorrhage)": "Aspirin",
    "Migraine": "Sumatriptan",
    "Vertigo": "Betahistine",
    "Epilepsy": "Carbamazepine",
    "Depression": "Escitalopram",
    "Anxiety": "Alprazolam",
    "Insomnia": "Zolpidem",
    "Urinary tract infection": "Nitrofurantoin",
    "Kidney Stones": "Tamsulosin",
    "Conjunctivitis": "Moxifloxacin",
    "Tonsillitis": "Amoxicillin",
    "Sinusitis": "Amoxicillin",
    "Anemia": "Ferrous sulfate",
    "Hypothermia": "Paracetamol",
}


def get_medicines_for_disease(disease: str, meds_df, df_pair, top_n: int = 8):
    if df_pair is None:
        return None, None, {}

    df_1mg, df_az = df_pair
    ingredient = DISEASE_DRUG_MAP.get(disease.strip())

    if not ingredient and meds_df is not None:
        row = meds_df[meds_df["Disease"].str.strip() == disease.strip()]
        if not row.empty:
            med_raw = str(row["Medication"].values[0])
            try:
                parsed = ast.literal_eval(med_raw)
                candidates = [str(x).strip() for x in parsed] if isinstance(parsed, list) else [med_raw]
            except Exception:
                candidates = [x.strip() for x in re.split(r"[,;]", med_raw)]

            skip = {
                "antibiotics", "pain relievers", "antihistamines", "corticosteroids",
                "antifungal", "antifungal cream", "antiviral", "analgesics",
                "antipyretics", "nsaids", "steroids", "immunosuppressants",
                "antidepressants", "anxiolytics", "sedatives", "diuretics",
                "beta blockers", "ace inhibitors", "calcium channel blockers",
                "statins", "bronchodilators", "expectorants", "topical treatments",
                "topical antibiotic", "topical antibiotics", "oral antibiotics",
                "oral antibiotic", "antacids", "laxatives", "antiemetics",
                "antiparasitics", "epinephrine", "probiotics", "antiseptics",
                "ointments", "vitamins", "minerals", "supplements",
                "warm compresses", "cold compresses", "rest", "fluids",
            }
            for c in candidates:
                if c.lower().rstrip("s") not in skip and c.lower() not in skip and len(c) > 4:
                    ingredient = c.split("(")[0].strip()
                    break

    if not ingredient:
        return None, None, {}

    ingredient_lower = ingredient.lower()
    safety = {}

    if df_az is not None and "_comp_lower" in df_az.columns:
        mask_az = df_az["_comp_lower"].str.contains(re.escape(ingredient_lower), na=False)
        hits_az = df_az[mask_az].copy()

        price_col = next((c for c in df_az.columns if "price" in c.lower()), None)
        if not hits_az.empty and price_col:
            hits_az[price_col] = pd.to_numeric(
                hits_az[price_col].astype(str).str.replace(r"[^\d.]", "", regex=True),
                errors="coerce",
            )
            hits_az = hits_az.dropna(subset=[price_col]).sort_values(price_col)

            comp_col = next((c for c in df_az.columns if "composition" in c.lower() or "ingredient" in c.lower()), None)
            mfr_col  = next((c for c in df_az.columns if "manufacturer" in c.lower()), None)
            pack_col = next((c for c in df_az.columns if "pack" in c.lower()), None)
            name_col = "name" if "name" in df_az.columns else df_az.columns[1]

            keep = [name_col]
            rename_map = {name_col: "Brand Name"}
            if mfr_col:
                keep.append(mfr_col); rename_map[mfr_col] = "Manufacturer"
            if pack_col:
                keep.append(pack_col); rename_map[pack_col] = "Pack Size"
            if comp_col:
                keep.append(comp_col); rename_map[comp_col] = "Active Ingredient"
            keep.append(price_col); rename_map[price_col] = "Price (Rs)"

            result = hits_az[keep].head(top_n).reset_index(drop=True).rename(columns=rename_map)
            result.index += 1

            if df_1mg is not None and "_ingredient_lower" in df_1mg.columns:
                mask_1mg = df_1mg["_ingredient_lower"].str.contains(re.escape(ingredient_lower), na=False)
                hits_1mg = df_1mg[mask_1mg]
                for warn_key, col in [("alcohol", "alcoholWarning"),
                                      ("breastfeeding", "breastfeedingWarning"),
                                      ("pregnancy", "pregnancyWarning")]:
                    if col in hits_1mg.columns:
                        vals = hits_1mg[col].dropna()
                        if not vals.empty and str(vals.iloc[0]).strip().lower() not in ("nan", "none", ""):
                            safety[warn_key] = vals.iloc[0]

            return ingredient.title(), result, safety

    if df_1mg is not None and "_ingredient_lower" in df_1mg.columns:
        mask = df_1mg["_ingredient_lower"].str.contains(re.escape(ingredient_lower), na=False)
        hits = df_1mg[mask].copy()
        if not hits.empty:
            if "PricePerTablet" in hits.columns:
                hits["PricePerTablet"] = pd.to_numeric(hits["PricePerTablet"], errors="coerce")
                hits = hits.dropna(subset=["PricePerTablet"]).sort_values("PricePerTablet")
            result = hits[["name", "manufacturer", "activeIngredient",
                           "PricePerTablet", "url",
                           "alcoholWarning", "breastfeedingWarning",
                           "pregnancyWarning"]].head(top_n).reset_index(drop=True)
            result.index += 1
            for k, col in [("alcohol", "alcoholWarning"),
                            ("breastfeeding", "breastfeedingWarning"),
                            ("pregnancy", "pregnancyWarning")]:
                if col in hits.columns:
                    vals = hits[col].dropna()
                    if not vals.empty:
                        safety[k] = vals.iloc[0]
            return ingredient.title(), result, safety

    return None, None, {}


# ─────────────────────────────────────────────────────────
# MODEL TRAINING (cached at module level)
# ─────────────────────────────────────────────────────────
def get_model():
    global _MODEL, _FEAT_NAMES, _ACCURACY
    if _MODEL is not None:
        return _MODEL, _FEAT_NAMES, _ACCURACY

    data = load_csv_data()
    if data is None:
        return None, None, None

    df   = data["train"].copy()
    drop = [c for c in ["Disease", "medicine"] if c in df.columns]
    X    = df.drop(columns=drop).select_dtypes(include=[np.number])
    y    = df["Disease"].str.strip()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    clf = RandomForestClassifier(
        n_estimators=150, random_state=42,
        class_weight="balanced", n_jobs=-1
    )
    clf.fit(X_train, y_train)
    acc = accuracy_score(y_test, clf.predict(X_test))
    logger.info(f"Model accuracy: {acc:.4f}")
    _MODEL      = clf
    _FEAT_NAMES = X.columns.values
    _ACCURACY   = acc
    return _MODEL, _FEAT_NAMES, _ACCURACY


# ─────────────────────────────────────────────────────────
# SAFETY HELPERS
# ─────────────────────────────────────────────────────────
def get_severity(disease, db_severity=None):
    d = disease.strip()
    if d in EMERGENCY_DISEASES:
        return "emergency"
    if d in HIGH_RISK_DISEASES:
        return "high"
    if db_severity and db_severity not in ("moderate", None):
        return db_severity
    return "moderate"


# ─────────────────────────────────────────────────────────
# CORE PREDICTION FUNCTION (exposed as Gradio API)
# ─────────────────────────────────────────────────────────
def predict(symptoms: list) -> dict:
    """
    Given a list of symptom strings (display format, e.g. 'Chest Pain'),
    returns a dict with:
      - disease: str
      - confidence: float
      - severity: str  ('emergency' | 'high' | 'moderate')
      - description: str
      - medication: str
      - precautions: list[str]
      - diet: list[str]
      - workouts: list[str]
      - active_ingredient: str | None
      - brand_options: list[dict] | None
      - safety_warnings: dict
      - db_vendors: list[dict]
      - error: str | None
    """
    if not symptoms:
        return {"error": "Please select at least one symptom."}

    model, feature_names, accuracy = get_model()
    if model is None:
        return {"error": "Model could not be loaded. Check that CSV data files are present."}

    data = load_csv_data()
    df_pair = load_1mg_data()

    # vectorise
    input_vector = np.zeros(len(feature_names))
    matched_keys = []
    for s in symptoms:
        key = s.lower().replace(" ", "_")
        if key in feature_names:
            idx = np.where(feature_names == key)[0][0]
            input_vector[idx] = 1
            matched_keys.append(key)

    if np.sum(input_vector) == 0:
        return {"error": "None of the selected symptoms could be matched. Try different symptom names."}

    # predict
    try:
        prediction = model.predict([input_vector])[0].strip()
        probs      = model.predict_proba([input_vector])
        confidence = float(np.max(probs) * 100)
    except Exception as e:
        return {"error": f"Prediction error: {e}"}

    if confidence < CONFIDENCE_THRESHOLD:
        return {
            "error": f"Confidence too low ({confidence:.1f}%). Please add more symptoms or consult a doctor directly."
        }

    # DB
    conn         = get_db_connection()
    db_available = conn is not None
    db_info      = {}

    if db_available:
        try:
            ensure_diagnostic_log_table(conn)
            db_info = fetch_disease_info_from_db(conn, prediction)
        except Exception as e:
            logger.warning(f"DB fetch failed: {e}")

    severity         = get_severity(prediction, db_info.get("severity"))
    found_emerg_syms = [s for s in matched_keys if s in EMERGENCY_SYMPTOMS]
    if found_emerg_syms:
        severity = "emergency"

    # CSV fallbacks
    def csv_get(df, col, disease):
        row = df[df["Disease"].str.strip() == disease]
        return row[col].values[0] if (not row.empty and col in row.columns) else None

    desc_text  = db_info.get("description") or csv_get(data["desc"],  "Description", prediction)
    medication = db_info.get("medication")  or csv_get(data["meds"],  "Medication",  prediction)
    diet_text  = csv_get(data["diets"], "Diet", prediction)

    prec_row    = data["precaution"][data["precaution"]["Disease"].str.strip() == prediction]
    precautions = []
    if not prec_row.empty:
        precautions = [str(v).strip() for v in prec_row.iloc[0, 1:].dropna().tolist() if str(v).strip()]

    work_rows = data["workouts"][data["workouts"]["Disease"].str.strip() == prediction]
    workouts  = []
    if not work_rows.empty and "workout" in work_rows.columns:
        workouts = work_rows["workout"].tolist()

    # parse medication list
    med_items = []
    if medication:
        try:
            parsed = ast.literal_eval(str(medication))
            med_items = [str(x).strip() for x in (parsed if isinstance(parsed, list) else [parsed]) if str(x).strip()]
        except Exception:
            med_items = [x.strip() for x in re.split(r"[,;]", str(medication)) if x.strip()]

    # parse diet list
    diet_items = []
    if diet_text:
        try:
            parsed = ast.literal_eval(str(diet_text))
            diet_items = [str(x).strip() for x in (parsed if isinstance(parsed, list) else [parsed]) if str(x).strip()]
        except Exception:
            diet_items = [x.strip() for x in re.split(r"[,;]", str(diet_text)) if x.strip()]

    # medicine marketplace
    active_ingredient, market_df, safety_warnings = get_medicines_for_disease(
        prediction, data["meds"], df_pair
    )
    brand_options = None
    if market_df is not None and not market_df.empty:
        brand_options = market_df.to_dict(orient="records")

    # DB vendors
    db_vendors = []
    if db_available:
        db_med_rows, _ = fetch_db_medicines_with_vendors(conn, prediction)
        db_vendors = db_med_rows or []

    # log
    if db_available:
        flag = "emergency_symptoms" if found_emerg_syms else severity
        log_prediction(conn, matched_keys, prediction, confidence, flag)

    if conn:
        try:
            conn.close()
        except Exception:
            pass

    return {
        "disease":           prediction,
        "confidence":        round(confidence, 2),
        "severity":          severity,
        "description":       desc_text or "Description not available.",
        "medication":        med_items,
        "precautions":       precautions,
        "diet":              diet_items,
        "workouts":          workouts,
        "active_ingredient": active_ingredient,
        "brand_options":     brand_options,
        "safety_warnings":   safety_warnings,
        "db_vendors":        db_vendors,
        "error":             None,
    }


# ─────────────────────────────────────────────────────────
# GRADIO UI HELPERS
# ─────────────────────────────────────────────────────────
def build_result_html(result: dict) -> str:
    if result.get("error"):
        return f"""
        <div style="background:#2d1111;border:1.5px solid #fc8181;border-radius:12px;padding:20px 24px;">
          <div style="color:#fc8181;font-size:1.05rem;font-weight:700;">⚠️ {result['error']}</div>
        </div>"""

    disease    = result["disease"]
    confidence = result["confidence"]
    severity   = result["severity"]
    desc       = result["description"]
    meds       = result["medication"]
    precs      = result["precautions"]
    diets      = result["diet"]
    works      = result["workouts"]
    ingredient = result.get("active_ingredient")
    brands     = result.get("brand_options") or []
    sw         = result.get("safety_warnings") or {}
    vendors    = result.get("db_vendors") or []

    # ── Severity banner ──
    if severity == "emergency":
        banner = """
        <div style="background:linear-gradient(135deg,#3b1111,#2d0f0f);border:1.5px solid #fc8181;
        border-radius:12px;padding:18px 22px;margin-bottom:16px;">
          <div style="color:#fc8181;font-size:1.05rem;font-weight:800;margin-bottom:6px;">🚨 EMERGENCY — Seek Immediate Medical Care</div>
          <div style="color:#feb2b2;font-size:0.88rem;line-height:1.6;">
          Your symptoms may indicate a <strong>life-threatening condition</strong>.<br>
          <strong>Call emergency services (112)</strong> or go to the nearest hospital immediately.
          Do not rely on this AI tool in an emergency.
          </div>
        </div>"""
    elif severity == "high":
        banner = """
        <div style="background:linear-gradient(135deg,#2d2208,#1f1a08);border:1.5px solid #f6ad55;
        border-radius:12px;padding:18px 22px;margin-bottom:16px;">
          <div style="color:#f6ad55;font-size:1.05rem;font-weight:800;margin-bottom:6px;">⚠️ High-Risk Condition Detected</div>
          <div style="color:#fbd38d;font-size:0.88rem;line-height:1.6;">
          This condition requires <strong>prompt attention from a qualified doctor</strong>.
          Please seek medical consultation as soon as possible.
          </div>
        </div>"""
    else:
        banner = """
        <div style="background:linear-gradient(135deg,#0d2035,#0f1a2e);border:1.5px solid #63b3ed;
        border-radius:12px;padding:14px 20px;margin-bottom:16px;">
          <div style="color:#90cdf4;font-size:0.88rem;">
          ℹ️ <strong>For informational purposes only.</strong>
          Always consult a licensed healthcare professional before making any medical decisions.
          </div>
        </div>"""

    # ── Confidence bar ──
    bar_color  = "#fc8181" if confidence < LOW_CONFIDENCE_WARN else "linear-gradient(90deg,#3182ce,#63b3ed,#4fd1c5)"
    conf_label = "✅ High Confidence" if confidence >= LOW_CONFIDENCE_WARN else "⚠️ Low Confidence — consult a doctor"
    conf_warn  = ""
    if confidence < LOW_CONFIDENCE_WARN:
        conf_warn = f'<div style="background:#2d2208;border:1px solid #f6ad55;border-radius:8px;padding:10px 16px;color:#fbd38d;font-size:0.85rem;margin-bottom:12px;">⚠️ AI confidence is only {confidence:.1f}%. This prediction may not be accurate — <strong>please consult a doctor.</strong></div>'

    conf_bar = f"""
    <div style="margin:18px 0 8px;">
      <div style="color:#94a3b8;font-size:0.82rem;margin-bottom:6px;font-weight:500;">{conf_label} &nbsp;·&nbsp; {confidence:.1f}%</div>
      <div style="height:10px;background:#1e2533;border-radius:99px;overflow:hidden;">
        <div style="height:100%;border-radius:99px;width:{confidence:.0f}%;background:{bar_color};"></div>
      </div>
    </div>
    {conf_warn}"""

    # ── Lists helpers ──
    def list_html(items, fallback="Not available."):
        if items:
            return "".join(f"<li>{i.capitalize()}</li>" for i in items)
        return f"<li>{fallback}</li>"

    meds_html  = list_html(meds)
    precs_html = list_html(precs)
    diets_html = list_html(diets)
    works_html = list_html(works)

    # ── Info cards ──
    def card(cls, title, body_html):
        return f"""
        <div style="background:#1a2030;border:1px solid rgba(99,179,237,0.15);border-radius:12px;
        padding:20px 22px;margin-bottom:14px;{cls}">
          <div style="color:#63b3ed;font-size:0.8rem;font-weight:700;letter-spacing:.07em;
          text-transform:uppercase;margin-bottom:10px;">{title}</div>
          {body_html}
        </div>"""

    desc_card  = card("", "📖 About This Condition", f'<p style="color:#cbd5e1;font-size:0.9rem;line-height:1.65;margin:0;">{desc}</p>')
    prec_card  = card("border-color:rgba(72,187,120,0.35);background:linear-gradient(135deg,#1a2a22,#1a2030);", "🛡️ Immediate Precautions", f'<ul style="color:#cbd5e1;font-size:0.9rem;line-height:1.65;padding-left:18px;margin:0;">{precs_html}</ul>')
    meds_card  = card("border-color:rgba(236,201,75,0.35);background:linear-gradient(135deg,#2a2518,#1a2030);", "💊 Suggested Medication", f'<ul style="color:#cbd5e1;font-size:0.9rem;line-height:1.65;padding-left:18px;margin:0;">{meds_html}</ul>')
    diet_card  = card("border-color:rgba(72,187,120,0.35);background:linear-gradient(135deg,#1a2a22,#1a2030);", "🥗 Recommended Diet", f'<ul style="color:#cbd5e1;font-size:0.9rem;line-height:1.65;padding-left:18px;margin:0;">{diets_html}</ul>')
    work_card  = card("border-color:rgba(159,122,234,0.35);background:linear-gradient(135deg,#22183a,#1a2030);", "🏃 Recommended Activities", f'<ul style="color:#cbd5e1;font-size:0.9rem;line-height:1.65;padding-left:18px;margin:0;">{works_html}</ul>')

    # ── Marketplace ──
    market_html = ""
    if ingredient or brands or vendors:
        market_html += f"""
        <div style="border-top:1px solid rgba(99,179,237,0.15);margin:24px 0 16px;"></div>
        <div style="display:flex;align-items:center;gap:10px;border-left:4px solid #63b3ed;
        padding-left:14px;margin-bottom:16px;">
          <span>🛒</span>
          <h3 style="color:#e2e8f0;font-size:1.15rem;font-weight:700;margin:0;">
            Medicines for &ldquo;{disease}&rdquo;
          </h3>
        </div>"""

        if ingredient:
            market_html += f'<div style="display:inline-flex;align-items:center;gap:8px;background:rgba(99,179,237,0.1);border:1px solid rgba(99,179,237,0.3);color:#90cdf4;padding:8px 18px;border-radius:99px;font-size:0.88rem;font-weight:600;margin-bottom:16px;">🔬 &nbsp; Active Ingredient: &nbsp;<strong>{ingredient}</strong></div>'

        # Safety warnings
        for label, key, icon in [("Alcohol","alcohol","🍺"),("Pregnancy","pregnancy","🤰"),("Breastfeeding","breastfeeding","🍼")]:
            msg = sw.get(key)
            if msg and str(msg).strip().lower() not in ("nan", "none", ""):
                market_html += f'<div style="background:#2d2208;border:1px solid #f6ad55;border-radius:8px;padding:10px 14px;margin-bottom:8px;"><span style="color:#f6ad55;font-weight:700;font-size:0.82rem;">{icon} {label} Warning</span><div style="color:#fbd38d;font-size:0.83rem;margin-top:4px;">{msg}</div></div>'

        # Brand options table
        if brands:
            market_html += '<div style="color:#63b3ed;font-size:0.82rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin:12px 0 8px;">📋 Brand Options — Sorted by Price</div>'
            market_html += '<table style="width:100%;border-collapse:collapse;font-size:0.85rem;">'
            headers = list(brands[0].keys()) if brands else []
            market_html += '<tr>' + ''.join(f'<th style="text-align:left;color:#63b3ed;padding:6px 10px;border-bottom:1px solid rgba(99,179,237,0.2);">{h}</th>' for h in headers) + '</tr>'
            for i, row in enumerate(brands):
                bg = "rgba(99,179,237,0.04)" if i % 2 == 0 else "transparent"
                market_html += f'<tr style="background:{bg};">'
                for v in row.values():
                    market_html += f'<td style="color:#cbd5e1;padding:6px 10px;border-bottom:1px solid rgba(99,179,237,0.08);">{v if v is not None else "—"}</td>'
                market_html += "</tr>"
            market_html += "</table>"
            market_html += '<div style="color:#64748b;font-size:0.76rem;margin-top:4px;">💡 Prices are per tablet/unit · Sorted cheapest first · Source: 1mg.com / A-Z India dataset</div>'

        # DB vendors
        if vendors:
            market_html += f'<div style="color:#4fd1c5;font-size:0.82rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin:20px 0 6px;">🏥 From Our Database — Verified Medicines &amp; Vendors</div>'
            med_groups = defaultdict(list)
            for r in vendors:
                med_groups[r["medicine_name"]].append(r)

            for med_name, rows in med_groups.items():
                r0 = rows[0]
                if r0.get("price_cents") and r0["price_cents"] > 0:
                    disp_price = f"₹{r0['price_cents'] / 100:.2f}"
                elif r0.get("base_price_minor") and r0["base_price_minor"] > 0:
                    disp_price = f"{r0.get('base_currency','')}{r0['base_price_minor'] / 100:.2f}"
                else:
                    disp_price = "—"

                n_vendors = sum(1 for r in rows if r.get("vendor_name"))
                market_html += f'<div style="background:#1e2840;border:1px solid rgba(99,179,237,0.2);border-radius:10px;padding:14px 18px;margin-bottom:10px;">'
                market_html += f'<div style="color:#90cdf4;font-weight:700;margin-bottom:8px;">💊 {med_name} &nbsp;·&nbsp; {n_vendors} vendor(s) &nbsp;·&nbsp; {disp_price}</div>'
                for r in rows:
                    if not r.get("vendor_name"):
                        continue
                    is_v = (r.get("vendor_status") or "") == "VERIFIED"
                    badge = '<span style="background:rgba(72,187,120,0.15);border:1px solid rgba(72,187,120,0.4);color:#68d391;padding:2px 8px;border-radius:20px;font-size:0.72rem;font-weight:700;">✅ VERIFIED</span>' if is_v else '<span style="background:rgba(160,174,192,0.1);border:1px solid rgba(160,174,192,0.25);color:#a0aec0;padding:2px 8px;border-radius:20px;font-size:0.72rem;font-weight:700;">UNVERIFIED</span>'
                    if r.get("price_cents") and r["price_cents"] > 0:
                        v_price = f"₹{r['price_cents'] / 100:.2f}"
                    elif r.get("base_price_minor") and r["base_price_minor"] > 0:
                        v_price = f"{r.get('base_currency','')}{r['base_price_minor'] / 100:.2f}"
                    else:
                        v_price = disp_price
                    stock = r.get("stock_qty")
                    stock_t = f"📦 {stock} units" if stock is not None else "📦 N/A"
                    market_html += f'<div style="display:flex;align-items:center;gap:14px;padding:8px 0;border-top:1px solid rgba(99,179,237,0.08);">'
                    market_html += f'<div style="flex:1;"><div style="color:#e2e8f0;font-weight:700;font-size:0.95rem;">{r["vendor_name"]} &nbsp;{badge}</div><div style="color:#94a3b8;font-size:0.8rem;margin-top:3px;">{r.get("vendor_type","—")} · 📍 {r.get("vendor_country","—")} · {stock_t} · 📞 {r.get("vendor_contact","N/A")}</div></div>'
                    market_html += f'<div style="color:#4fd1c5;font-weight:700;font-size:1rem;white-space:nowrap;">{v_price}</div>'
                    market_html += '</div>'
                market_html += '</div>'

    # ── Final assembly ──
    html = f"""
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <div style="font-family:'Inter',sans-serif;background:#0d1117;min-height:100%;padding:4px 0;">

      <!-- Diagnosis banner -->
      <div style="background:linear-gradient(135deg,#1a263a,#162030);border:1.5px solid rgba(99,179,237,0.3);
      border-radius:14px;padding:22px 26px;margin-bottom:22px;">
        <div style="color:#64748b;font-size:0.8rem;font-weight:600;letter-spacing:.06em;
        text-transform:uppercase;margin-bottom:8px;">Diagnostic Result</div>
        <h2 style="color:#90cdf4;font-size:1.6rem;font-weight:800;margin:0 0 4px;">🩺 {disease}</h2>
        <p style="color:#64748b;font-size:0.85rem;margin:0;">
          Based on {len([s for s in result.get("matched_symptoms", []) if s])} matched symptom(s) &nbsp;·&nbsp;
          AI confidence: <strong style="color:#4fd1c5;">{confidence:.1f}%</strong>
        </p>
      </div>

      {banner}
      {conf_bar}

      <!-- Info grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:20px;">
        <div>{desc_card}{prec_card}</div>
        <div>{meds_card}{diet_card}{work_card}</div>
      </div>

      {market_html}

      <!-- Footer -->
      <div style="margin-top:32px;padding:18px 22px;background:#0f1520;border:1px solid rgba(99,179,237,0.08);
      border-radius:12px;color:#475569;font-size:0.78rem;line-height:1.6;text-align:center;">
      ⚠️ This AI-generated report is for <strong>educational purposes only</strong>. It does not constitute
      medical advice, diagnosis, or treatment. Always seek advice from a qualified healthcare professional.
      </div>
    </div>
    """
    return html


# ─────────────────────────────────────────────────────────
# GRADIO WRAPPER — called by the UI
# ─────────────────────────────────────────────────────────
def gradio_predict(symptoms: list):
    """UI-level wrapper: returns HTML for display."""
    result = predict(symptoms)
    # Inject matched count helper
    result["matched_symptoms"] = symptoms
    return build_result_html(result)


# ─────────────────────────────────────────────────────────
# DEBUG HELPER — inspect DB for a given disease name
# ─────────────────────────────────────────────────────────
def debug_db(disease_name: str) -> str:
    """Returns an HTML diagnostic showing exactly what the DB returns for a disease name."""
    if not disease_name or not disease_name.strip():
        return '<p style="color:#fc8181;">Enter a disease name to debug.</p>'

    disease_name = disease_name.strip()
    conn = get_db_connection()

    lines = []
    lines.append(f'<h3 style="color:#90cdf4;font-family:Inter,sans-serif;">🔍 DB Debug: <em>{disease_name}</em></h3>')

    if conn is None:
        return lines[0] + '<p style="color:#fc8181;font-family:Inter,sans-serif;">❌ Could not connect to the database. Check your connection string.</p>'

    try:
        with conn.cursor() as cur:
            # 1. Exact match
            cur.execute('SELECT id, name, description FROM "Condition" WHERE name = %s', (disease_name,))
            row = cur.fetchone()
            if row:
                lines.append(f'<p style="color:#68d391;font-family:Inter,sans-serif;">✅ Exact match found — Condition ID: <strong>{row[0]}</strong>, Name: <strong>{row[1]}</strong></p>')
                cid = row[0]
            else:
                lines.append(f'<p style="color:#f6ad55;font-family:Inter,sans-serif;">⚠️ No exact match. Trying ILIKE...</p>')
                cur.execute('SELECT id, name, description FROM "Condition" WHERE name ILIKE %s', (f"%{disease_name}%",))
                rows = cur.fetchall()
                if rows:
                    cid = rows[0][0]
                    names = ", ".join(r[1] for r in rows)
                    lines.append(f'<p style="color:#68d391;font-family:Inter,sans-serif;">✅ ILIKE found {len(rows)} match(es): <strong>{names}</strong> — using first (ID: {cid})</p>')
                else:
                    lines.append('<p style="color:#fc8181;font-family:Inter,sans-serif;">❌ No condition found at all in the DB. The disease name does not match any row in &quot;Condition&quot;.</p>')
                    lines.append('<p style="color:#94a3b8;font-family:Inter,sans-serif;">💡 Tip: Check the exact names in your Condition table — spelling and casing must match the ML model output.</p>')

                    # Show some condition names for reference
                    cur.execute('SELECT name FROM "Condition" ORDER BY name LIMIT 20')
                    sample = [r[0] for r in cur.fetchall()]
                    if sample:
                        lines.append('<p style="color:#64748b;font-family:Inter,sans-serif;">📋 Sample Condition names in DB:</p>')
                        lines.append('<ul style="color:#94a3b8;font-family:Inter,sans-serif;font-size:0.85rem;">' + ''.join(f'<li>{n}</li>' for n in sample) + '</ul>')
                    conn.close()
                    return '\n'.join(lines)

            # 2. ConditionMedicine links
            cur.execute(
                'SELECT m.id, m.name, m.description, m."priceCents" FROM "Medicine" m '
                'JOIN "ConditionMedicine" cm ON cm."medicineId" = m.id WHERE cm."conditionId" = %s',
                (cid,)
            )
            meds = cur.fetchall()
            if meds:
                lines.append(f'<p style="color:#68d391;font-family:Inter,sans-serif;">✅ {len(meds)} medicine(s) linked via ConditionMedicine:</p>')
                lines.append('<ul style="color:#cbd5e1;font-family:Inter,sans-serif;font-size:0.85rem;">')
                for m in meds:
                    price = f"₹{m[3]/100:.2f}" if m[3] else "—"
                    lines.append(f'<li><strong>{m[1]}</strong> (ID: {m[0]}) · {price}</li>')
                lines.append('</ul>')
            else:
                lines.append('<p style="color:#fc8181;font-family:Inter,sans-serif;">❌ Condition found but NO medicines are linked in ConditionMedicine table. Add rows to ConditionMedicine to link medicines.</p>')

            # 3. Vendor/Inventory links
            cur.execute(
                'SELECT m.name, v."companyName", v."verificationStatus", inv.quantity '
                'FROM "Medicine" m '
                'JOIN "ConditionMedicine" cm ON cm."medicineId" = m.id '
                'LEFT JOIN "Inventory" inv ON inv."medicineId" = m.id '
                'LEFT JOIN "Vendor" v ON v.id = inv."vendorId" '
                'WHERE cm."conditionId" = %s LIMIT 10',
                (cid,)
            )
            vendors = cur.fetchall()
            if any(r[1] for r in vendors):
                lines.append(f'<p style="color:#68d391;font-family:Inter,sans-serif;">✅ Vendor/Inventory entries found:</p>')
                lines.append('<ul style="color:#cbd5e1;font-family:Inter,sans-serif;font-size:0.85rem;">')
                for r in vendors:
                    lines.append(f'<li>{r[0]} → Vendor: {r[1] or "(none)"} [{r[2] or "?"}] · Stock: {r[3]}</li>')
                lines.append('</ul>')
            else:
                lines.append('<p style="color:#f6ad55;font-family:Inter,sans-serif;">⚠️ Medicines exist but no Vendor/Inventory data found. The DB vendor section will be empty.</p>')

    except Exception as e:
        lines.append(f'<p style="color:#fc8181;font-family:Inter,sans-serif;">❌ Query error: {e}</p>')
    finally:
        try:
            conn.close()
        except Exception:
            pass

    return '\n'.join(lines)


# ─────────────────────────────────────────────────────────
# BUILD SYMPTOM LIST
# ─────────────────────────────────────────────────────────
def get_symptom_choices():
    global _SYMPTOM_CHOICES
    if _SYMPTOM_CHOICES:
        return _SYMPTOM_CHOICES
    _, feature_names, _ = get_model()
    if feature_names is None:
        return []
    _SYMPTOM_CHOICES = [s.replace("_", " ").title() for s in feature_names]
    return _SYMPTOM_CHOICES


# ─────────────────────────────────────────────────────────
# INITIALISE ON STARTUP
# ─────────────────────────────────────────────────────────
logger.info("Loading data and training model on startup...")
_init_model, _init_feats, _init_acc = get_model()
_init_choices = get_symptom_choices()
_init_data    = load_csv_data()
_acc_str = f"{_init_acc:.4f}" if _init_acc else "N/A"
logger.info(f"Ready — accuracy: {_acc_str}, symptoms: {len(_init_choices)}")


# ─────────────────────────────────────────────────────────
# GRADIO INTERFACE
# ─────────────────────────────────────────────────────────
CUSTOM_CSS = """
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

body, .gradio-container { font-family: 'Inter', sans-serif !important; background: #0d1117 !important; }

/* Header */
.app-header {
    background: linear-gradient(135deg, #1a1f2e 0%, #0f1923 50%, #162032 100%);
    border: 1px solid rgba(99,179,237,0.18);
    border-radius: 16px;
    padding: 36px 40px 28px;
    margin-bottom: 24px;
    position: relative;
    overflow: hidden;
}
.app-header::before {
    content: '';
    position: absolute; top: -40px; right: -40px;
    width: 260px; height: 260px;
    background: radial-gradient(circle, rgba(99,179,237,0.08) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
}
.app-title {
    font-size: 2.2rem; font-weight: 800;
    background: linear-gradient(90deg, #63b3ed, #90cdf4, #4fd1c5);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    margin: 0 0 6px;
}
.app-sub { color: #94a3b8; font-size: 0.95rem; margin: 0 0 12px; }
.app-badge {
    display: inline-block;
    background: rgba(99,179,237,0.12); border: 1px solid rgba(99,179,237,0.3);
    color: #63b3ed; border-radius: 20px;
    padding: 4px 14px; font-size: 0.78rem; font-weight: 600;
}

/* Stats row */
.stats-row { display: flex; gap: 16px; margin-bottom: 24px; }
.stat-card {
    flex: 1;
    background: linear-gradient(135deg, #1e2533, #1a2030);
    border: 1px solid rgba(99,179,237,0.15);
    border-radius: 12px; padding: 18px 22px;
    transition: transform .2s, box-shadow .2s;
}
.stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(99,179,237,0.12); }
.stat-icon { font-size: 1.4rem; margin-bottom: 6px; }
.stat-label { color: #64748b; font-size: 0.78rem; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; }
.stat-value { color: #e2e8f0; font-size: 1.9rem; font-weight: 800; line-height: 1.1; }

/* Input panel */
.input-panel {
    background: linear-gradient(135deg, #1a1f2e, #0f1a2e);
    border: 1px solid rgba(99,179,237,0.15);
    border-radius: 14px;
    padding: 24px 28px;
    margin-bottom: 20px;
}
.input-label {
    color: #90cdf4; font-size: 1.05rem; font-weight: 700; margin-bottom: 6px;
}
.input-sub { color: #64748b; font-size: 0.82rem; margin-bottom: 14px; }

/* Gradio component overrides */
.gradio-container .block { background: transparent !important; }
label.svelte-1b6s6qm, .label-wrap { color: #90cdf4 !important; font-weight: 600 !important; }
.wrap.svelte-1oiin9d { background: #1a2030 !important; border: 1px solid rgba(99,179,237,0.25) !important; border-radius: 10px !important; }
.token.svelte-1oiin9d { background: rgba(99,179,237,0.15) !important; color: #90cdf4 !important; border-radius: 6px !important; }
button.lg.primary { 
    background: linear-gradient(135deg, #2b6cb0, #3182ce) !important;
    border: none !important; border-radius: 10px !important;
    font-weight: 700 !important; font-size: 1rem !important;
    padding: 14px 28px !important; transition: all .2s !important;
}
button.lg.primary:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 24px rgba(49,130,206,0.35) !important; }

/* Output HTML area */
.output-html { background: transparent !important; }
"""

HEADER_HTML = f"""
<div class="app-header">
  <div class="app-title">🩺 MedPred AI</div>
  <p class="app-sub">AI-Enabled Medical Diagnostic Platform — Symptom Analysis &amp; Medicine Recommendation</p>
</div>
"""

with gr.Blocks(
    title="MedPred AI — Diagnostic Platform",
    css=CUSTOM_CSS,
    theme=gr.themes.Base(
        primary_hue="blue",
        neutral_hue="slate",
        font=[gr.themes.GoogleFont("Inter"), "sans-serif"],
    ).set(
        body_background_fill="#0d1117",
        body_text_color="#e2e8f0",
        block_background_fill="#1a2030",
        block_border_color="rgba(99,179,237,0.15)",
        input_background_fill="#1a2030",
        input_border_color="rgba(99,179,237,0.25)",
        button_primary_background_fill="linear-gradient(135deg, #2b6cb0, #3182ce)",
        button_primary_text_color="#ffffff",
    ),
) as demo:
    gr.HTML('<style>@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap");</style>')

    gr.HTML(HEADER_HTML)

    with gr.Tabs():
     with gr.TabItem("🩺 Diagnostic"):

      with gr.Row():
        with gr.Column(scale=1):
            gr.HTML('<div class="input-panel"><div class="input-label">🔍 Symptom Checker</div><div class="input-sub">Search and select all symptoms that apply, then click <strong>Generate Diagnostic Report</strong>.</div></div>')

            symptom_input = gr.Dropdown(
                label="Your Symptoms",
                choices=_init_choices,
                multiselect=True,
                allow_custom_value=False,
                filterable=True,
                info=f"Search from {len(_init_choices)} recognised symptoms",
                elem_id="symptom-dropdown",
            )

            submit_btn = gr.Button(
                "🩺 Generate Diagnostic Report",
                variant="primary",
                size="lg",
                elem_id="submit-btn",
            )

            gr.HTML("""
            <div style="margin-top:16px;padding:14px 18px;background:#0f1520;border:1px solid rgba(99,179,237,0.08);
            border-radius:10px;color:#475569;font-size:0.76rem;line-height:1.5;">
            ⚠️ This platform is for <strong style="color:#64748b;">educational purposes only</strong>
            and does not provide professional medical advice. Always consult a licensed doctor.
            </div>""")

        with gr.Column(scale=2):
            output_html = gr.HTML(
                value="""
                <div style="text-align:center;padding:80px 20px;font-family:'Inter',sans-serif;">
                  <div style="font-size:3.5rem;margin-bottom:18px;">🩺</div>
                  <div style="color:#63b3ed;font-size:1.3rem;font-weight:700;margin-bottom:10px;">Ready to Diagnose</div>
                  <div style="color:#475569;font-size:0.9rem;">Select your symptoms from the left panel and click
                  <strong style="color:#90cdf4;">Generate Diagnostic Report</strong> to begin.</div>
                </div>""",
                label="Diagnostic Report",
                elem_id="output-area",
            )

      submit_btn.click(
          fn=gradio_predict,
          inputs=[symptom_input],
          outputs=[output_html],
          api_name=False,
      )

     with gr.TabItem("🔬 DB Debug"):
      gr.HTML("""
      <div style="padding:14px 0 6px;font-family:Inter,sans-serif;">
        <div style="color:#90cdf4;font-size:1.05rem;font-weight:700;margin-bottom:4px;">Database Debugger</div>
        <div style="color:#64748b;font-size:0.83rem;">Enter a disease name exactly as the model predicts it (e.g. <code>Malaria</code>, <code>Dengue</code>) to inspect what the DB returns.</div>
      </div>""")
      with gr.Row():
        debug_input = gr.Textbox(
            label="Disease Name",
            placeholder="e.g. Dengue, Malaria, Typhoid …",
            elem_id="debug-disease-input",
        )
        debug_btn = gr.Button("🔍 Inspect DB", variant="primary", elem_id="debug-btn")
      debug_output = gr.HTML(label="Debug Result")
      debug_btn.click(fn=debug_db, inputs=[debug_input], outputs=[debug_output], api_name=False)



# ─────────────────────────────────────────────────────────
# LAUNCH
# ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", show_api=False)
