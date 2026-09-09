import pandas as pd
import numpy as np
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, f1_score

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def train_and_compare_models():
    print("=" * 60)
    print("PHASE 1: LOAD CLEAN DATA & STRATIFIED SPLIT")
    print("=" * 60)
    
    data_path = os.path.join(BASE_DIR, "clean_training.csv")
    df = pd.read_csv(data_path)
    
    X = df.drop("prognosis", axis=1)
    y = df["prognosis"]
    symptoms_list = list(X.columns)
    
    print(f"Total Dataset Size: {df.shape[0]} samples across {y.nunique()} diseases.")
    print(f"Total Feature Space: {len(symptoms_list)} binary symptoms.")
    
    # 80/20 Stratified Split ensures exactly 24 test samples per disease
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"Training Set: {X_train.shape[0]} samples | Testing Set: {X_test.shape[0]} samples")

    print("\n" + "=" * 60)
    print("PHASE 2: MODEL TRAINING (LOGISTIC REGRESSION VS RANDOM FOREST)")
    print("=" * 60)
    
    # Model 1: Logistic Regression (Produces calibrated probabilities for triage confidence routing)
    print("Training Model A: Logistic Regression (C=0.5, L2 regularization)...")
    log_reg = LogisticRegression(max_iter=1000, random_state=42, C=0.5)
    log_reg.fit(X_train, y_train)
    y_pred_lr = log_reg.predict(X_test)
    acc_lr = accuracy_score(y_test, y_pred_lr)
    f1_lr = f1_score(y_test, y_pred_lr, average="weighted")
    print(f"-> Logistic Regression Accuracy: {acc_lr * 100:.2f}% | Weighted F1: {f1_lr * 100:.2f}%")

    # Model 2: Random Forest Classifier (Tree ensemble baseline)
    print("Training Model B: Random Forest Classifier (100 estimators, max_depth=15)...")
    rf = RandomForestClassifier(n_estimators=100, max_depth=15, random_state=42)
    rf.fit(X_train, y_train)
    y_pred_rf = rf.predict(X_test)
    acc_rf = accuracy_score(y_test, y_pred_rf)
    f1_rf = f1_score(y_test, y_pred_rf, average="weighted")
    print(f"-> Random Forest Accuracy: {acc_rf * 100:.2f}% | Weighted F1: {f1_rf * 100:.2f}%")

    print("\n" + "=" * 60)
    print("PHASE 3: DETAILED EVALUATION REPORT LOGGING")
    print("=" * 60)
    
    report_lr = classification_report(y_test, y_pred_lr)
    report_rf = classification_report(y_test, y_pred_rf)
    
    report_text = f"""================================================================================
CLINICAL SYSTEM AI TRIAGE ENGINE: MODEL BENCHMARK & EVALUATION REPORT
================================================================================
Dataset: 4,920 balanced records, 41 diseases, 132 binary symptom indicators
Validation Strategy: Stratified 80/20 Train/Test Split (984 held-out test records, 24 per disease)

--------------------------------------------------------------------------------
1. EXECUTIVE SUMMARY & COMPARISON
--------------------------------------------------------------------------------
Model A: Logistic Regression (C=0.5, max_iter=1000)
- Test Accuracy:  {acc_lr * 100:.2f}%
- Weighted F1:    {f1_lr * 100:.2f}%
- Production Choice: SELECTED
- Rationale: Logistic Regression produces strictly calibrated posterior probabilities
  P(Disease | Symptoms) via the softmax function, making it ideal for healthcare triage
  thresholding (e.g. asking follow-up questions when top confidence < 65%).

Model B: Random Forest Classifier (n_estimators=100, max_depth=15)
- Test Accuracy:  {acc_rf * 100:.2f}%
- Weighted F1:    {f1_rf * 100:.2f}%
- Comparison: Random Forest performs robust non-linear partitioning, but tree leaf fraction
  averaging produces uncalibrated probabilities that tend to over-cluster near 0 and 1,
  making dynamic clinical follow-up thresholding less smooth.

--------------------------------------------------------------------------------
2. DETAILED CLASSIFICATION REPORT (LOGISTIC REGRESSION - PRODUCTION MODEL)
--------------------------------------------------------------------------------
{report_lr}

--------------------------------------------------------------------------------
3. DETAILED CLASSIFICATION REPORT (RANDOM FOREST CLASSIFIER)
--------------------------------------------------------------------------------
{report_rf}
"""
    report_file = os.path.join(BASE_DIR, "report_metrics.txt")
    with open(report_file, "w") as f:
        f.write(report_text)
    print(f"Comparative report logged to {report_file}")

    # Serialize chosen production model & feature list
    joblib.dump(log_reg, os.path.join(BASE_DIR, "triage_model.pkl"))
    joblib.dump(symptoms_list, os.path.join(BASE_DIR, "symptoms_list.pkl"))
    print("Serialized 'triage_model.pkl' and 'symptoms_list.pkl' successfully.")

if __name__ == "__main__":
    train_and_compare_models()
