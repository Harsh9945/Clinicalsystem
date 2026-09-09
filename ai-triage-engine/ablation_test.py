"""
ablation_test.py

Measures how classifier confidence degrades as a patient reports fewer
symptoms (simulating real, vague presentations instead of the full
textbook symptom list), and quantifies how often that produces a
genuine diagnostic tie between multiple diseases.

This is the evidence behind the "100% accuracy is a synthetic-data
artifact, here's what happens with realistic input" story.

Usage:
    Place this in your ai-triage-engine directory (next to
    triage_model.pkl, symptoms_list.pkl, clean_training.csv) and run:

        python ablation_test.py

Outputs:
    ablation_report.csv / ablation_report.json — one row per symptom
    count (2, 3, 4, full), showing mean confidence, accuracy, % of
    cases below your triage threshold, and % that are genuine ties.
"""

import json
import os
import joblib
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

RANDOM_SEED = 42
CONFIDENCE_THRESHOLD = 0.65  # matches the existing triage engine threshold
TIE_MARGIN = 0.15            # top-1 vs top-2 probability gap below this = genuine tie
SYMPTOM_COUNTS_TO_TEST = [2, 3, 4, "full"]

# ---- Load your existing trained artifacts ----
model_path = os.path.join(BASE_DIR, "triage_model.pkl")
symptoms_path = os.path.join(BASE_DIR, "symptoms_list.pkl")
data_path = os.path.join(BASE_DIR, "clean_training.csv")

try:
    model = joblib.load(model_path)
except Exception:
    with open(model_path, "rb") as f:
        model = pickle.load(f)

try:
    symptom_cols = joblib.load(symptoms_path)
except Exception:
    with open(symptoms_path, "rb") as f:
        symptom_cols = pickle.load(f)

df = pd.read_csv(data_path)
X = df[symptom_cols]
y = df["prognosis"]

# Recreate the EXACT same held-out test split used for report_metrics.txt
# (same seed + stratify => same 984 rows, so these numbers are directly
# comparable to your existing 100% accuracy result on the same patients).
_, X_test, _, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=RANDOM_SEED
)

rng = np.random.default_rng(RANDOM_SEED)


def ablate_row(row_values, k):
    """Keep only k of the symptoms actually present (=1) in this row; zero the rest.
    This simulates a patient who only mentions a few symptoms instead of
    the complete textbook list."""
    present = np.where(row_values == 1)[0]
    if len(present) <= k:
        keep = present
    else:
        keep = rng.choice(present, size=k, replace=False)
    ablated = np.zeros_like(row_values, dtype=float)
    ablated[keep] = 1
    return ablated


def top2_margin(proba):
    """Gap between the top-1 and top-2 predicted probabilities.
    A small gap means the model is genuinely torn between two diseases,
    not just moderately confident."""
    sorted_p = np.sort(proba)[::-1]
    return sorted_p[0] - sorted_p[1]


results = []
for k in SYMPTOM_COUNTS_TO_TEST:
    confidences, corrects, margins = [], [], []

    for i in range(len(X_test)):
        row = X_test.iloc[i].values
        true_label = y_test.iloc[i]

        x = row.reshape(1, -1) if k == "full" else ablate_row(row, k).reshape(1, -1)

        proba = model.predict_proba(x)[0]
        pred_idx = np.argmax(proba)
        pred_label = model.classes_[pred_idx]

        confidences.append(proba[pred_idx])
        corrects.append(pred_label == true_label)
        margins.append(top2_margin(proba))

    confidences = np.array(confidences)
    corrects = np.array(corrects)
    margins = np.array(margins)

    results.append({
        "symptoms_shown": k,
        "mean_confidence": round(float(confidences.mean()), 4),
        "accuracy": round(float(corrects.mean()), 4),
        "pct_below_threshold": round(float((confidences < CONFIDENCE_THRESHOLD).mean()), 4),
        "pct_genuine_tie": round(float((margins < TIE_MARGIN).mean()), 4),
        "n": len(X_test),
    })

report = pd.DataFrame(results)
print("\n" + "=" * 80)
print("SYMPTOM ABLATION EXPERIMENT: REALISTIC SPARSE PRESENTATIONS")
print("=" * 80)
print(report.to_string(index=False))

csv_out = os.path.join(BASE_DIR, "ablation_report.csv")
json_out = os.path.join(BASE_DIR, "ablation_report.json")

report.to_csv(csv_out, index=False)
with open(json_out, "w") as f:
    json.dump(results, f, indent=2)

print(f"\nSaved: {csv_out}, {json_out}")
print(
    "\nHow to read this: compare the 'full' row (should match your "
    "existing 100% result) against the k=2/3/4 rows. The drop in "
    "mean_confidence and rise in pct_genuine_tie IS your real evidence "
    "that the RAG layer is solving an actual problem, not a made-up one."
)
