# Hugging Face Spaces — Deployment Guide

## Files to upload to your Space

```
your-hf-space/
├── app.py                     ← main app
├── requirements.txt           ← dependencies
├── README.md                  ← HF Space config (the --- header matters!)
├── Main_Training_2026.csv
├── symptom_Description.csv
├── symptom_precaution.csv
├── medications.csv
├── diets.csv
└── workout_df.csv
```

---

## Step 1 — Create the Space

1. Go to https://huggingface.co/spaces
2. Click **Create new Space**
3. Settings:
   - **Space name:** medical-diagnostic (or your choice)
   - **SDK:** Streamlit
   - **Visibility:** Public or Private
4. Click **Create Space**

---

## Step 2 — Upload your files

**Option A — via the HF web UI (easiest):**
1. Open your Space → click **Files** tab
2. Click **Add file → Upload files**
3. Upload all files listed above one by one

**Option B — via Git (recommended for future updates):**
```bash
# Clone your space
git clone https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME
cd YOUR_SPACE_NAME

# Copy all project files in
cp /path/to/your/project/* .

# Push
git add .
git commit -m "Initial deployment"
git push
```

---

## Step 3 — Add Neon DB secret

Your Neon connection string must NEVER be in the code.
Add it as a Space secret:

1. Go to your Space → **Settings** tab
2. Scroll to **Repository secrets**
3. Click **New secret**
   - Name:  `NEON_CONNECTION_STRING`
   - Value: `postgresql://neondb_owner:YOUR_PASSWORD@ep-frosty-dust-aij033jo-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
4. Click **Save**

The app reads this automatically via `os.environ.get("NEON_CONNECTION_STRING")`.

---

## Step 4 — Verify deployment

1. Go to your Space URL: `https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME`
2. Wait ~2 min for the build to complete
3. Check sidebar shows **🟢 Neon DB Connected**
4. Test with a few symptoms

---

## Updating the app later

```bash
cd YOUR_SPACE_NAME
# Make changes to app.py
git add app.py
git commit -m "Update: improved safety logic"
git push
# HF rebuilds automatically
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Build fails | Check requirements.txt — all packages must be pip-installable |
| DB not connecting | Verify secret name is exactly `NEON_CONNECTION_STRING` |
| CSV not found | Ensure all 6 CSV files are uploaded to the Space root |
| App crashes on start | Check Logs tab in your Space for the traceback |
| Model takes too long | Normal — first load trains the model, subsequent loads use cache |

---

## Neon DB — what the app does with your existing tables

| Table | Operation | Purpose |
|---|---|---|
| `Condition` | READ | Disease descriptions and severity |
| `ConditionMedicine` | READ (JOIN) | Links conditions to medicines |
| `Medicine` | READ | Medicine names |
| `DiagnosticLog` | WRITE (auto-created) | Audit trail of all predictions |
| All other tables | NOT TOUCHED | Your existing Prisma schema is safe |
