"""
seed_db.py — Populate Neon DB from CSV files.

Inserts:
  1. Condition        ← symptom_Description.csv
  2. Medicine         ← medications.csv  (deduplicated)
  3. ConditionMedicine ← medications.csv  (disease→medicine links)

Safe to re-run: uses INSERT ... ON CONFLICT DO NOTHING.
"""

import os, ast, re, uuid
import pandas as pd
import psycopg2

# ─── Connection ──────────────────────────────────────────
def get_conn():
    conn_str = os.environ.get("NEON_CONNECTION_STRING")
    if not conn_str:
        # fallback: read from .streamlit/secrets.toml
        base = os.path.dirname(os.path.abspath(__file__))
        toml_path = os.path.join(base, ".streamlit", "secrets.toml")
        if os.path.exists(toml_path):
            with open(toml_path, "r", encoding="utf-8") as f:
                content = f.read()
            m = re.search(r'connection_string\s*=\s*["\']([^"\']+)["\']', content)
            if m:
                conn_str = m.group(1)
    if not conn_str:
        raise RuntimeError("No connection string found. Set NEON_CONNECTION_STRING or check .streamlit/secrets.toml")
    return psycopg2.connect(conn_str)


# ─── Helpers ─────────────────────────────────────────────
def new_id():
    return str(uuid.uuid4())


def parse_med_list(raw: str) -> list[str]:
    """Parse medication list string like \"['Med A', 'Med B']\" → ['Med A', 'Med B']"""
    try:
        parsed = ast.literal_eval(str(raw))
        if isinstance(parsed, list):
            return [str(x).strip() for x in parsed if str(x).strip()]
    except Exception:
        pass
    return [x.strip() for x in re.split(r"[,;]", str(raw)) if x.strip()]


# ─── Step 1: Conditions ──────────────────────────────────
def seed_conditions(cur, desc_df: pd.DataFrame) -> dict[str, str]:
    """Insert all diseases from symptom_Description.csv. Returns {disease_name: uuid}"""
    print("\n── Step 1: Seeding Condition table ──")
    name_to_id = {}

    # First fetch already-existing conditions so we don't duplicate
    cur.execute('SELECT id, name FROM "Condition"')
    for row in cur.fetchall():
        name_to_id[row[1]] = row[0]
    print(f"   Existing conditions in DB: {len(name_to_id)}")

    inserted = 0
    for _, row in desc_df.iterrows():
        name = str(row["Disease"]).strip()
        desc = str(row["Description"]).strip()
        if not name or name == "nan":
            continue
        if name in name_to_id:
            print(f"   [SKIP] Already exists: {name}")
            continue
        cid = new_id()
        cur.execute(
            'INSERT INTO "Condition" (id, name, description, "createdAt") '
            'VALUES (%s, %s, %s, NOW()) ON CONFLICT DO NOTHING',
            (cid, name, desc)
        )
        name_to_id[name] = cid
        inserted += 1
        print(f"   [INSERT] Condition: {name}")

    print(f"   ✅ Inserted {inserted} new conditions. Total known: {len(name_to_id)}")
    return name_to_id


# ─── Step 2: Medicines ───────────────────────────────────
def seed_medicines(cur, meds_df: pd.DataFrame) -> dict[str, str]:
    """
    Collect all unique medicine names from medications.csv and insert into Medicine.
    Returns {medicine_name: uuid}
    """
    print("\n── Step 2: Seeding Medicine table ──")

    # Collect all unique medicine names
    all_meds: set[str] = set()
    for _, row in meds_df.iterrows():
        for med in parse_med_list(row["Medication"]):
            all_meds.add(med)

    print(f"   Unique medicine names found in CSV: {len(all_meds)}")

    # Fetch already-existing medicines
    cur.execute('SELECT id, name FROM "Medicine"')
    name_to_id = {row[1]: row[0] for row in cur.fetchall()}
    print(f"   Existing medicines in DB: {len(name_to_id)}")

    inserted = 0
    for med_name in sorted(all_meds):
        if med_name in name_to_id:
            continue
        mid = new_id()
        cur.execute(
            'INSERT INTO "Medicine" (id, name, description, "priceCents", "createdAt", "updatedAt") '
            'VALUES (%s, %s, %s, %s, NOW(), NOW()) ON CONFLICT DO NOTHING',
            (mid, med_name, f"{med_name} — imported from medications dataset.", 0)
        )
        name_to_id[med_name] = mid
        inserted += 1

    print(f"   ✅ Inserted {inserted} new medicines. Total known: {len(name_to_id)}")
    return name_to_id


# ─── Step 3: ConditionMedicine links ────────────────────
def seed_condition_medicine(
    cur,
    meds_df: pd.DataFrame,
    condition_map: dict[str, str],
    medicine_map: dict[str, str],
):
    """Insert ConditionMedicine join rows from medications.csv"""
    print("\n── Step 3: Seeding ConditionMedicine table ──")

    # Fetch already-existing links to avoid duplicates
    cur.execute('SELECT "conditionId", "medicineId" FROM "ConditionMedicine"')
    existing = set((r[0], r[1]) for r in cur.fetchall())
    print(f"   Existing ConditionMedicine links: {len(existing)}")

    inserted = 0
    skipped_no_condition = []
    skipped_no_medicine  = []

    for _, row in meds_df.iterrows():
        disease = str(row["Disease"]).strip()
        if not disease or disease == "nan":
            continue

        cid = condition_map.get(disease)
        if not cid:
            skipped_no_condition.append(disease)
            continue

        for med_name in parse_med_list(row["Medication"]):
            mid = medicine_map.get(med_name)
            if not mid:
                skipped_no_medicine.append(med_name)
                continue
            key = (cid, mid)
            if key in existing:
                continue
            cur.execute(
                'INSERT INTO "ConditionMedicine" ("conditionId", "medicineId") '
                'VALUES (%s, %s) ON CONFLICT DO NOTHING',
                (cid, mid)
            )
            existing.add(key)
            inserted += 1

    print(f"   ✅ Inserted {inserted} new ConditionMedicine links.")
    if skipped_no_condition:
        print(f"   ⚠️  Diseases not found in Condition table ({len(set(skipped_no_condition))} unique):")
        for d in sorted(set(skipped_no_condition)):
            print(f"      - '{d}'")
    if skipped_no_medicine:
        print(f"   ⚠️  Medicines not found in Medicine table: {len(set(skipped_no_medicine))} items (shouldn't happen)")


# ─── Step 4: Symptoms ────────────────────────────────────
def seed_symptoms(cur, train_df: pd.DataFrame) -> dict[str, str]:
    """Insert all 132 symptom column names from training CSV into Symptom table."""
    print("\n── Step 4: Seeding Symptom table ──")

    drop_cols = {"Disease", "disease", "prognosis", "medicine"}
    symptom_cols = [c for c in train_df.columns if c not in drop_cols
                    and train_df[c].dtype in ["int64", "float64", "int32"]]

    # Fetch existing
    cur.execute('SELECT id, name FROM "Symptom"')
    name_to_id = {row[1]: row[0] for row in cur.fetchall()}
    print(f"   Existing symptoms in DB: {len(name_to_id)}")

    inserted = 0
    for col in symptom_cols:
        display_name = col.replace("_", " ").title()
        if display_name in name_to_id:
            continue
        sid = new_id()
        cur.execute(
            'INSERT INTO "Symptom" (id, name, "createdAt") VALUES (%s, %s, NOW()) ON CONFLICT DO NOTHING',
            (sid, display_name)
        )
        name_to_id[display_name] = sid
        inserted += 1

    print(f"   ✅ Inserted {inserted} new symptoms. Total known: {len(name_to_id)}")
    return name_to_id


# ─── Main ────────────────────────────────────────────────
def main():
    base = os.path.dirname(os.path.abspath(__file__))

    print("Loading CSV files...")
    desc_df  = pd.read_csv(os.path.join(base, "symptom_Description.csv"))
    meds_df  = pd.read_csv(os.path.join(base, "medications.csv"))
    train_df = pd.read_csv(os.path.join(base, "Main_Training_2026.csv"))

    # Normalise column name
    for old in ["prognosis", "disease"]:
        if old in train_df.columns:
            train_df.rename(columns={old: "Disease"}, inplace=True)

    print(f"   symptom_Description: {len(desc_df)} rows")
    print(f"   medications:         {len(meds_df)} rows")
    print(f"   Main_Training_2026:  {len(train_df)} rows, {len(train_df.columns)} cols")

    print("\nConnecting to DB...")
    conn = get_conn()
    print("✅ Connected.")

    try:
        with conn:
            with conn.cursor() as cur:
                condition_map = seed_conditions(cur, desc_df)
                medicine_map  = seed_medicines(cur, meds_df)
                seed_condition_medicine(cur, meds_df, condition_map, medicine_map)
                seed_symptoms(cur, train_df)

        print("\n🎉 All done! DB seeded successfully.")
        print("\nNext step: open the app → 🔬 DB Debug tab and type any disease")
        print("name (e.g. 'Malaria') to verify the lookup works.\n")

    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error — rolled back. Details: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
