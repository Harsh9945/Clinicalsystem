import os
import urllib.request
import pandas as pd
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

RAW_URLS = {
    "description": "https://raw.githubusercontent.com/bharatdappili/chatbot/master/symptom_Description.csv",
    "precaution": "https://raw.githubusercontent.com/bharatdappili/chatbot/master/symptom_precaution.csv",
    "training": "https://raw.githubusercontent.com/bharatdappili/chatbot/master/Training.csv",
    "testing": "https://raw.githubusercontent.com/bharatdappili/chatbot/master/Testing.csv",
}

# Canonical disease name normalization map
DISEASE_NORMALIZATION = {
    "dimorphic hemmorhoids(piles)": "Dimorphic hemorrhoids (piles)",
    "dimorphic hemorrhoids(piles)": "Dimorphic hemorrhoids (piles)",
    "osteoarthristis": "Osteoarthritis",
    "peptic ulcer diseae": "Peptic ulcer disease",
    "diabetes ": "Diabetes",
    "diabetes": "Diabetes",
    "(vertigo) paroymsal  positional vertigo": "(vertigo) Paroxysmal Positional Vertigo",
    "(vertigo) paroxysmal  positional vertigo": "(vertigo) Paroxysmal Positional Vertigo",
    "bronchial asthma": "Bronchial Asthma",
    "gastroenteritis": "Gastroenteritis",
    "fungal infection": "Fungal Infection",
    "common cold": "Common Cold",
    "urinary tract infection": "Urinary Tract Infection",
    "hypertension ": "Hypertension",
    "hypertension": "Hypertension",
    "gerd": "GERD",
    "aids": "AIDS",
    "acne": "Acne",
    "allergy": "Allergy",
    "cervical spondylosis": "Cervical Spondylosis",
    "chronic cholestasis": "Chronic Cholestasis",
    "drug reaction": "Drug Reaction",
    "migraine": "Migraine",
    "paralysis (brain hemorrhage)": "Paralysis (Brain Hemorrhage)",
    "jaundice": "Jaundice",
    "malaria": "Malaria",
    "chicken pox": "Chicken Pox",
    "dengue": "Dengue",
    "typhoid": "Typhoid",
    "hepatitis a": "Hepatitis A",
    "hepatitis b": "Hepatitis B",
    "hepatitis c": "Hepatitis C",
    "hepatitis d": "Hepatitis D",
    "hepatitis e": "Hepatitis E",
    "alcoholic hepatitis": "Alcoholic Hepatitis",
    "tuberculosis": "Tuberculosis",
    "pneumonia": "Pneumonia",
    "heart attack": "Heart Attack",
    "varicose veins": "Varicose Veins",
    "hypothyroidism": "Hypothyroidism",
    "hyperthyroidism": "Hyperthyroidism",
    "hypoglycemia": "Hypoglycemia",
    "arthritis": "Arthritis",
    "psoriasis": "Psoriasis",
    "impetigo": "Impetigo"
}

SPECIALIST_MAPPING = {
    "UNKNOWN_OR_LOW_CONFIDENCE": "General Physician",
    "Fungal Infection": "Dermatologist",
    "Allergy": "Allergist",
    "GERD": "Gastroenterologist",
    "Chronic Cholestasis": "Gastroenterologist / Hepatologist",
    "Drug Reaction": "Allergist / Dermatologist",
    "Peptic ulcer disease": "Gastroenterologist",
    "AIDS": "Infectious Disease Specialist",
    "Diabetes": "Endocrinologist",
    "Gastroenteritis": "Gastroenterologist",
    "Bronchial Asthma": "Pulmonologist",
    "Hypertension": "Cardiologist",
    "Migraine": "Neurologist",
    "Cervical Spondylosis": "Orthopedist / Neurologist",
    "Paralysis (Brain Hemorrhage)": "Neurologist",
    "Jaundice": "Gastroenterologist / Hepatologist",
    "Malaria": "Infectious Disease Specialist",
    "Chicken Pox": "General Physician / Dermatologist",
    "Dengue": "Infectious Disease Specialist",
    "Typhoid": "General Physician",
    "Hepatitis A": "Gastroenterologist / Hepatologist",
    "Hepatitis B": "Gastroenterologist / Hepatologist",
    "Hepatitis C": "Gastroenterologist / Hepatologist",
    "Hepatitis D": "Gastroenterologist / Hepatologist",
    "Hepatitis E": "Gastroenterologist / Hepatologist",
    "Alcoholic Hepatitis": "Gastroenterologist / Hepatologist",
    "Tuberculosis": "Pulmonologist",
    "Common Cold": "General Physician",
    "Pneumonia": "Pulmonologist",
    "Dimorphic hemorrhoids (piles)": "General Surgeon / Proctologist",
    "Heart Attack": "Cardiologist",
    "Varicose Veins": "Vascular Surgeon",
    "Hypothyroidism": "Endocrinologist",
    "Hyperthyroidism": "Endocrinologist",
    "Hypoglycemia": "Endocrinologist",
    "Osteoarthritis": "Rheumatologist / Orthopedist",
    "Arthritis": "Rheumatologist",
    "(vertigo) Paroxysmal Positional Vertigo": "ENT Specialist / Neurologist",
    "Acne": "Dermatologist",
    "Urinary Tract Infection": "Urologist / General Physician",
    "Psoriasis": "Dermatologist",
    "Impetigo": "Dermatologist"
}

def normalize_disease_name(raw_name: str) -> str:
    cleaned = str(raw_name).strip()
    key = cleaned.lower()
    return DISEASE_NORMALIZATION.get(key, cleaned.title())

def download_file_if_needed(url: str, dest_filename: str) -> str:
    path = os.path.join(BASE_DIR, dest_filename)
    if not os.path.exists(path) or os.path.getsize(path) == 0:
        print(f"Downloading {dest_filename} from {url}...")
        urllib.request.urlretrieve(url, path)
        print(f"-> Saved {dest_filename} ({os.path.getsize(path)} bytes)")
    else:
        print(f"Using existing {dest_filename} ({os.path.getsize(path)} bytes)")
    return path

def clean_and_process():
    print("=" * 60)
    print("STEP 1: INGESTING RAW DATASETS")
    print("=" * 60)
    desc_file = download_file_if_needed(RAW_URLS["description"], "raw_symptom_description.csv")
    prec_file = download_file_if_needed(RAW_URLS["precaution"], "raw_symptom_precaution.csv")
    train_file = download_file_if_needed(RAW_URLS["training"], "raw_training.csv")
    test_file = download_file_if_needed(RAW_URLS["testing"], "raw_testing.csv")

    # Step 2: Load Descriptions with explicit headers
    df_desc = pd.read_csv(desc_file, header=None, names=["Disease", "Description"])
    df_desc["Disease"] = df_desc["Disease"].apply(normalize_disease_name)
    df_desc["Description"] = df_desc["Description"].str.strip()
    desc_map = dict(zip(df_desc["Disease"], df_desc["Description"]))
    print(f"Loaded {len(desc_map)} disease descriptions.")

    # Step 3: Load Precautions with explicit headers
    df_prec = pd.read_csv(prec_file, header=None, names=["Disease", "Precaution_1", "Precaution_2", "Precaution_3", "Precaution_4"])
    df_prec["Disease"] = df_prec["Disease"].apply(normalize_disease_name)
    prec_map = {}
    for _, row in df_prec.iterrows():
        precautions = [str(p).strip() for p in [row["Precaution_1"], row["Precaution_2"], row["Precaution_3"], row["Precaution_4"]] if pd.notna(p) and str(p).strip() != "nan" and str(p).strip() != ""]
        prec_map[row["Disease"]] = precautions
    print(f"Loaded precautions for {len(prec_map)} diseases.")

    # Step 4: Clean Training Data
    df_train = pd.read_csv(train_file)
    if "Unnamed: 133" in df_train.columns:
        df_train = df_train.drop("Unnamed: 133", axis=1)

    # Normalize target column
    target_col = "prognosis" if "prognosis" in df_train.columns else df_train.columns[-1]
    df_train["prognosis"] = df_train[target_col].apply(normalize_disease_name)
    if target_col != "prognosis":
        df_train = df_train.drop(target_col, axis=1)

    # Clean symptom column names (strip whitespace)
    symptom_cols = [c.strip() for c in df_train.columns if c != "prognosis"]
    df_train.columns = symptom_cols + ["prognosis"]
    
    # Save clean training CSV
    clean_train_path = os.path.join(BASE_DIR, "clean_training.csv")
    df_train.to_csv(clean_train_path, index=False)
    print(f"Cleaned training dataset saved to {clean_train_path} ({df_train.shape[0]} rows, {len(symptom_cols)} symptoms, {df_train['prognosis'].nunique()} diseases).")

    # Step 5: Clean Testing Data
    df_test = pd.read_csv(test_file)
    if "Unnamed: 133" in df_test.columns:
        df_test = df_test.drop("Unnamed: 133", axis=1)
    target_col_test = "prognosis" if "prognosis" in df_test.columns else df_test.columns[-1]
    df_test["prognosis"] = df_test[target_col_test].apply(normalize_disease_name)
    test_symptoms = [c.strip() for c in df_test.columns if c != "prognosis"]
    df_test.columns = test_symptoms + ["prognosis"]
    clean_test_path = os.path.join(BASE_DIR, "clean_testing.csv")
    df_test.to_csv(clean_test_path, index=False)
    print(f"Cleaned testing dataset saved to {clean_test_path} ({df_test.shape[0]} rows).")

    # Step 6: Extract Hallmark Symptoms per Disease
    print("Extracting characteristic symptoms per disease...")
    disease_symptoms = {}
    for disease, group in df_train.groupby("prognosis"):
        feature_sum = group[symptom_cols].sum()
        hallmark = feature_sum[feature_sum >= (len(group) * 0.5)].index.tolist()
        disease_symptoms[disease] = hallmark

    # Step 7: Build Composite Clinical Knowledge Base
    print("Synthesizing Composite Clinical Knowledge Base...")
    knowledge_base = {}
    unique_diseases = sorted(df_train["prognosis"].unique())

    for disease in unique_diseases:
        desc = desc_map.get(disease, f"{disease} is a medical condition affecting patients presenting with these characteristic symptoms.")
        precautions = prec_map.get(disease, ["Consult a licensed physician for evaluation", "Rest and maintain hydration", "Monitor symptom progression", "Follow prescribed care plan"])
        symptoms = disease_symptoms.get(disease, [])
        specialist = SPECIALIST_MAPPING.get(disease, "General Physician")
        
        readable_symptoms = [s.replace("_", " ") for s in symptoms]
        
        # Composite text chunk for dense semantic vector embedding
        profile_text = (
            f"Disease: {disease}\n"
            f"Medical Overview: {desc}\n"
            f"Hallmark Symptoms: {', '.join(readable_symptoms)}\n"
            f"Recommended Precautions & Management: {'; '.join(precautions)}\n"
            f"Recommended Specialist: {specialist}"
        )
        
        knowledge_base[disease] = {
            "disease": disease,
            "description": desc,
            "hallmark_symptoms": symptoms,
            "readable_symptoms": readable_symptoms,
            "precautions": precautions,
            "specialist": specialist,
            "search_content": profile_text
        }

    kb_path = os.path.join(BASE_DIR, "clinical_knowledge_base.json")
    with open(kb_path, "w") as f:
        json.dump(knowledge_base, f, indent=4)
    print(f"Composite Clinical Knowledge Base saved to {kb_path} ({len(knowledge_base)} diseases).")

    # Step 8: Update specialist_mapping.json
    spec_path = os.path.join(BASE_DIR, "specialist_mapping.json")
    with open(spec_path, "w") as f:
        json.dump(SPECIALIST_MAPPING, f, indent=4)
    print(f"Updated {spec_path} with {len(SPECIALIST_MAPPING)} specialist mappings.")

    print("\n" + "=" * 60)
    print("SUCCESS: Data cleaning, knowledge base synthesis, and specialist mapping complete!")
    print("=" * 60)

if __name__ == "__main__":
    clean_and_process()
