---
title: MedPred AI
emoji: 🩺
colorFrom: blue
colorTo: blue
sdk: gradio
sdk_version: 4.44.0
app_file: app.py
pinned: false
license: mit
short_description: AI Symptom Diagnostic & Medicine Recommendation
---

# 🩺 MedPred AI — Medical Diagnostic Platform

An AI-enabled medical diagnostic SaaS that predicts diseases from symptoms using a Random Forest model, then fetches medicine recommendations from a Neon PostgreSQL database, with brand-name alternatives from the 1mg & A-Z India medicine datasets.

## Features

- **Symptom Checker** — Select from 132 recognised symptoms via a searchable dropdown
- **AI Disease Prediction** — Random Forest model trained on 1,230 records, 99.6% accuracy
- **Medicine Marketplace** — Database-verified medicines with vendor info + 1mg brand alternatives
- **Safety Alerts** — Emergency banners, confidence scoring, alcohol/pregnancy warnings
- **REST API** — Clean JSON endpoint at `/predict` for programmatic access
- **DB Debug Tab** — Inspect exactly what the database returns for any disease name

## Environment Setup (Hugging Face Secrets)

Set the following secret in your Space's **Settings → Repository secrets**:

| Secret Name | Value |
|---|---|
| `NEON_CONNECTION_STRING` | Your full Neon PostgreSQL connection string |

Without this secret the app works fine — it falls back to CSV data for disease descriptions and uses the 1mg dataset for medicine brand lookups. The DB vendor section simply won't appear.

## Tech Stack

- **ML Model**: scikit-learn Random Forest
- **UI**: Gradio 4.x
- **Database**: Neon PostgreSQL (via psycopg2-binary)
- **Medicine Data**: 1mg.com dataset + A-Z Medicines India dataset
- **Training Data**: 1,230 symptom-disease records across 41 conditions
