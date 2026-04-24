"""
fix_3_mismatches.py — Links medicines to the 3 diseases that had name mismatches.

The meds CSV uses slightly different names than what was inserted into Condition.
This script looks them up by their actual DB names and inserts the missing links.
"""

import os, re, ast, uuid
import psycopg2

def get_conn():
    conn_str = os.environ.get("NEON_CONNECTION_STRING")
    if not conn_str:
        base = os.path.dirname(os.path.abspath(__file__))
        toml_path = os.path.join(base, ".streamlit", "secrets.toml")
        if os.path.exists(toml_path):
            with open(toml_path, "r", encoding="utf-8") as f:
                content = f.read()
            m = re.search(r'connection_string\s*=\s*["\']([^"\']+)["\']', content)
            if m:
                conn_str = m.group(1)
    return psycopg2.connect(conn_str)

def parse_med_list(raw):
    try:
        parsed = ast.literal_eval(str(raw))
        if isinstance(parsed, list):
            return [str(x).strip() for x in parsed if str(x).strip()]
    except Exception:
        pass
    return [x.strip() for x in re.split(r"[,;]", str(raw)) if x.strip()]

# The 3 mismatches:
#   meds_csv_name  →  actual DB Condition name  →  medicines list
FIXES = [
    {
        "db_name": "(vertigo) Paroymsal  Positional Vertigo",   # 2 spaces — exactly as in DB
        "medicines": ["Vestibular rehabilitation", "Canalith repositioning",
                      "Medications for nausea", "Surgery", "Home exercises"],
    },
    {
        "db_name": "Dimorphic hemorrhoids(piles)",               # correct spelling in DB
        "medicines": ["Nitroglycerin", "Aspirin", "Beta-blockers",
                      "Calcium channel blockers", "Thrombolytic drugs"],
    },
    {
        "db_name": "Peptic ulcer diseae",                        # typo preserved as inserted
        "medicines": ["Antibiotics", "Proton Pump Inhibitors (PPIs)",
                      "H2 Blockers", "Antacids", "Cytoprotective agents"],
    },
]

def main():
    print("Connecting to DB...")
    conn = get_conn()
    print("✅ Connected.\n")

    with conn:
        with conn.cursor() as cur:
            # Build medicine name → id map
            cur.execute('SELECT id, name FROM "Medicine"')
            med_map = {row[1]: row[0] for row in cur.fetchall()}

            for fix in FIXES:
                db_name  = fix["db_name"]
                meds     = fix["medicines"]

                # Look up condition id
                cur.execute('SELECT id FROM "Condition" WHERE name = %s', (db_name,))
                row = cur.fetchone()
                if not row:
                    print(f"❌ Condition not found in DB: '{db_name}'")
                    continue
                cid = row[0]
                print(f"✅ Found: '{db_name}' → conditionId={cid}")

                inserted = 0
                for med_name in meds:
                    mid = med_map.get(med_name)
                    if not mid:
                        # Medicine doesn't exist yet — insert it
                        mid = str(uuid.uuid4())
                        cur.execute(
                            'INSERT INTO "Medicine" (id, name, description, "priceCents", "createdAt", "updatedAt") '
                            'VALUES (%s, %s, %s, 0, NOW(), NOW()) ON CONFLICT DO NOTHING',
                            (mid, med_name, f"{med_name} — imported from medications dataset.")
                        )
                        med_map[med_name] = mid
                        print(f"   [INSERT Medicine] {med_name}")

                    cur.execute(
                        'INSERT INTO "ConditionMedicine" ("conditionId", "medicineId") '
                        'VALUES (%s, %s) ON CONFLICT DO NOTHING',
                        (cid, mid)
                    )
                    inserted += 1

                print(f"   ✅ Linked {inserted} medicine(s)\n")

    print("🎉 All 3 mismatches fixed!")
    conn.close()

if __name__ == "__main__":
    main()
