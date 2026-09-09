from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
import joblib
import json
import os
from dotenv import load_dotenv

# ==========================================
# 1. INITIALIZATION & SETUP
# ==========================================
from google import genai
from rag_retriever import ClinicalRAGRetriever

app = FastAPI(title="AI Healthcare Microservice - Hybrid RAG & Classifier Triage")

load_dotenv()

# Google GenAI Client Setup with Local Fallback
client = None
try:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if GEMINI_API_KEY:
        client = genai.Client(api_key=GEMINI_API_KEY)
    else:
        client = genai.Client()
    print("[INFO] Google GenAI Client initialized successfully.")
except Exception as e:
    print(f"[WARNING] Google GenAI Client initialization failed: {e}. AI Triage will run in local fallback mode.")
    client = None

MODEL_ID = "gemini-2.5-flash"

# Load Machine Learning & RAG Artifacts
model = None
symptoms_list = []
specialist_map = {}
rag_retriever = None

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

try:
    model = joblib.load(os.path.join(BASE_DIR, 'triage_model.pkl'))
    symptoms_list = joblib.load(os.path.join(BASE_DIR, 'symptoms_list.pkl'))
    with open(os.path.join(BASE_DIR, 'specialist_mapping.json'), 'r') as f:
        specialist_map = json.load(f)
    print(f"[INFO] Machine Learning Artifacts loaded successfully ({len(symptoms_list)} symptoms, {len(model.classes_)} classes).")
except Exception as e:
    print(f"[ERROR] Error loading ML files: {e}. Please run ml_model.py first.")

try:
    rag_retriever = ClinicalRAGRetriever()
    print("[INFO] Clinical RAG Retriever loaded successfully.")
except Exception as e:
    print(f"[WARNING] Could not initialize RAG Retriever: {e}")
    rag_retriever = None


# ==========================================
# 2. DATA MODELS (Communication with Java)
# ==========================================
class ChatRequest(BaseModel):
    user_message: str
    current_symptoms: List[str] = []
    denied_symptoms: Optional[List[str]] = []
    chat_history: Optional[List[str]] = []
    weight_kg: Optional[float] = None
    height_m: Optional[float] = None


# ==========================================
# 3. LLM HELPER FUNCTIONS & LOCAL FALLBACKS
# ==========================================
def local_extract_symptoms(message: str) -> dict:
    """Local symptom extractor using case-insensitive substring matching, synonym mapping, and negation detection."""
    msg_lower = message.lower()
    present = []
    denied = []
    
    negation_prefixes = ["no ", "not ", "without ", "denied ", "neither ", "don't have ", "dont have ", "zero "]

    def check_negated(target_text: str) -> bool:
        idx = msg_lower.find(target_text)
        if idx == -1:
            return False
        preceding = msg_lower[max(0, idx - 25):idx]
        return any(neg in preceding for neg in negation_prefixes)

    # Direct substring matching on symptoms list
    for sym in symptoms_list:
        normalized_sym = sym.replace("_", " ")
        if normalized_sym in msg_lower:
            if check_negated(normalized_sym):
                denied.append(sym)
            else:
                present.append(sym)
            
    # Manual fuzzy synonyms map for common symptoms
    synonyms = {
        "fever": "high_fever",
        "feverish": "high_fever",
        "tired": "fatigue",
        "exhausted": "fatigue",
        "vomit": "vomiting",
        "throwing up": "vomiting",
        "stomach ache": "stomach_pain",
        "belly pain": "stomach_pain",
        "tummy ache": "stomach_pain",
        "head ache": "headache",
        "migraine": "headache",
        "diarhea": "diarrhoea",
        "runny nose": "runny_nose",
        "sore throat": "sore_throat",
        "dizzy": "dizziness",
        "rash": "skin_rash",
        "itchy": "itching",
        "breathless": "breathlessness",
        "shortness of breath": "breathlessness",
        "chest pain": "chest_pain",
        "blurry vision": "blurred_and_distorted_vision",
        "joint pain": "joint_pain",
        "joints are really aching": "joint_pain",
        "knee joints that hurt": "joint_pain",
        "muscle ache": "muscle_pain",
        "body ache": "muscle_pain",
        "sweat": "sweating",
        "sweating at night": "sweating",
        "shivering": "shivering",
        "chills": "chills"
    }
    for phrase, sym in synonyms.items():
        if phrase in msg_lower and sym in symptoms_list:
            if check_negated(phrase):
                if sym not in denied and sym not in present:
                    denied.append(sym)
            else:
                if sym not in present and sym not in denied:
                    present.append(sym)
            
    return {"present": present, "denied": denied}


def local_generate_followup(instruction: str, current_symptoms: list, denied_symptoms: list) -> str:
    """Empathetic follow-up generator using local rules when Gemini API is rate-limited/offline."""
    common_symptoms = ["vomiting", "high_fever", "cough", "fatigue", "nausea", "headache", "stomach_pain"]
    for sym in common_symptoms:
        if sym in symptoms_list and sym not in current_symptoms and sym not in denied_symptoms:
            readable_sym = sym.replace("_", " ")
            return f"Understood. To help narrow down the diagnosis, are you experiencing any {readable_sym}?"
            
    return "I see. Could you tell me if you are experiencing any other symptoms, such as a fever, cough, nausea, or body aches?"


def local_diet_plan(disease: str, bmi: float) -> str:
    """Clinical Nutritionist rule-based diet plan based on BMI and suspected disease."""
    category = "Normal"
    if bmi > 25: category = "Overweight"
    if bmi < 18.5: category = "Underweight"
    
    return f"""• Hydration: Drink plenty of water and clear broths to stay hydrated.
• Meal Plan: Eat small, light, and easily digestible meals throughout the day.
• Focus: Include lean proteins, whole grains, and fresh vegetables suitable for a {category} BMI profile.
• Avoid: Limit heavy, greasy, spicy, or processed foods to support your recovery from suspected {disease}."""


def extract_symptoms(message: str, chat_history: list) -> dict:
    if not client:
        print("--- DEBUG: No Gemini Client, using local symptom extractor fallback ---")
        return local_extract_symptoms(message)

    recent_context = "\n".join(chat_history[-4:]) if chat_history else "No previous context."
    prompt = f"""
    You are an expert clinical data extractor. 
    
    Recent Chat History for Context:
    {recent_context}
    
    Read the latest patient message: "{message}"
    
    Look at the AI's immediately preceding question in the chat history. If the patient answers with a short "no", "nope", or "none", you MUST figure out which symptom the AI was asking about.
    Map symptoms to the EXACT closest match in this list of allowed snake_case symptoms: {symptoms_list}
    
    Identify which symptoms the patient HAS (present) and which they EXPLICITLY DENY (denied).
    Output ONLY a valid JSON object. Do not use markdown backticks.
    
    Example Output:
    {{"present": ["fatigue"], "denied": ["headache", "loss_of_smell"]}}
    """
    try:
        response = client.models.generate_content(
            model=MODEL_ID, 
            contents=prompt
        )
        raw_text = response.text.strip()
        
        # Strip markdown if Gemini includes code blocks
        if raw_text.startswith("```"):
            raw_text = raw_text.split("\n", 1)[-1].rsplit("\n", 1)[0]
        if raw_text.startswith("json"):
            raw_text = raw_text[4:].strip()
            
        print(f"--- DEBUG: LLM Extraction --- \n{raw_text}")
        extracted_data = json.loads(raw_text)
        return extracted_data
    except Exception as e:
        print(f"--- DEBUG: Extraction Error, falling back to local symptom extractor --- \n{e}")
        return local_extract_symptoms(message)


def generate_followup(instruction: str, current_symptoms: list, denied_symptoms: list, chat_history: list) -> str:
    if not client:
        print("--- DEBUG: No Gemini Client, using local followup generator fallback ---")
        return local_generate_followup(instruction, current_symptoms, denied_symptoms)

    recent_context = "\n".join(chat_history[-4:]) if chat_history else "No previous context."
    prompt = f"""
    You are an empathetic triage nurse. The diagnostic system says: "{instruction}"
    
    Recent Chat History:
    {recent_context}
    
    PATIENT CHART:
    - Confirmed Symptoms: {current_symptoms}
    - Denied Symptoms: {denied_symptoms}
    
    CRITICAL INSTRUCTION: Do NOT ask if the patient has any of the symptoms on EITHER of those lists. 
    You must ask about a DIFFERENT symptom to break the tie. Translate this into a single, polite question.
    """
    try:
        response = client.models.generate_content(
            model=MODEL_ID, 
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        print(f"--- DEBUG: Followup generation failed, using local fallback --- \n{e}")
        return local_generate_followup(instruction, current_symptoms, denied_symptoms)


def generate_diet_plan(disease: str, bmi: float) -> str:
    if not client:
        print("--- DEBUG: No Gemini Client, using local diet plan generator fallback ---")
        return local_diet_plan(disease, bmi)

    category = "Normal"
    if bmi > 25: category = "Overweight"
    if bmi < 18.5: category = "Underweight"
    
    prompt = f"""
    You are a Clinical Nutritionist. Write a brief 2-day diet plan for a patient with suspected {disease}. 
    Their BMI is {bmi:.1f} ({category}). Tailor the diet to both their disease and BMI. 
    Use clean bullet points. Keep it under 100 words.
    """
    try:
        response = client.models.generate_content(
            model=MODEL_ID, 
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        print(f"--- DEBUG: Diet generation failed, using local fallback --- \n{e}")
        return local_diet_plan(disease, bmi)


def grounded_triage_fusion(
    ml_candidates: list, 
    retrieved_evidence: list, 
    confirmed_symptoms: list, 
    denied_symptoms: list,
    user_complaint: str
) -> dict:
    """
    Arbitrates diagnosis by fusing:
    1. Statistical classifier probabilities (prior)
    2. Vector RAG medical knowledge profiles (evidence)
    3. Confirmed & Denied patient symptoms (facts)
    """
    default_disease = ml_candidates[0][0] if ml_candidates else "Influenza (Flu)"
    default_rationale = f"Based on statistical evaluation of reported symptoms, {default_disease} matches the highest probability pattern."
    
    if not client:
        print("--- DEBUG: No Gemini Client, using statistical top prediction fallback ---")
        return {
            "final_disease": default_disease,
            "clinical_rationale": default_rationale,
            "disagreement_flag": False
        }

    # Format Candidates for LLM
    candidate_lines = [f"- {disease}: {prob*100:.1f}% confidence" for disease, prob in ml_candidates[:3]]
    candidates_text = "\n".join(candidate_lines)

    # Format Evidence from RAG
    evidence_blocks = []
    for ev in retrieved_evidence:
        block = (
            f"• Disease: {ev['disease']} (Semantic Match: {ev.get('similarity', 0.0)})\n"
            f"  Overview: {ev['description']}\n"
            f"  Hallmark Symptoms: {', '.join(ev['hallmark_symptoms'])}\n"
            f"  Precautions: {'; '.join(ev['precautions'])}"
        )
        evidence_blocks.append(block)
    evidence_text = "\n\n".join(evidence_blocks)

    valid_choices = list(set([c[0] for c in ml_candidates[:3]] + [e['disease'] for e in retrieved_evidence]))

    prompt = f"""
    You are an expert Chief Medical Diagnostician arbitrating an AI triage decision.
    
    PATIENT REPORT:
    - Patient Description: "{user_complaint}"
    - Confirmed Symptoms: {confirmed_symptoms}
    - Denied Symptoms: {denied_symptoms}
    
    STATISTICAL CLASSIFIER PREDICTIONS:
    {candidates_text}
    
    RETRIEVED MEDICAL EVIDENCE (FROM CLINICAL KNOWLEDGE BASE):
    {evidence_text}
    
    CLINICAL ARBITRATION RULES:
    1. Check if the statistical model's top prediction is genuinely supported by the confirmed symptoms and retrieved clinical evidence.
    2. Pay STRICT attention to DENIED symptoms: If the patient denied symptoms that are essential hallmarks of the classifier's top choice, reject it in favor of the disease best matching the actual presentation.
    3. Reconcile any conflict between the statistical model and retrieved literature.
    4. You MUST choose the final disease from this exact list of valid conditions: {valid_choices}
    5. Formulate a 2-sentence clinical rationale grounded in the retrieved literature explaining why this diagnosis was reached.
    
    Output ONLY valid JSON matching this schema:
    {{
        "final_disease": "<Exact disease name from valid choices>",
        "clinical_rationale": "<2-sentence clinical explanation citing symptoms and retrieved evidence>",
        "disagreement_flag": true or false
    }}
    """
    try:
        response = client.models.generate_content(
            model=MODEL_ID, 
            contents=prompt
        )
        raw_text = response.text.strip()
        if raw_text.startswith("```"):
            raw_text = raw_text.split("\n", 1)[-1].rsplit("\n", 1)[0]
        if raw_text.startswith("json"):
            raw_text = raw_text[4:].strip()
            
        result = json.loads(raw_text)
        final_disease = result.get("final_disease", default_disease).strip()
        
        # Ensure chosen disease exists in specialist map
        if final_disease not in specialist_map:
            for d in valid_choices:
                if d.lower() == final_disease.lower():
                    final_disease = d
                    break
            if final_disease not in specialist_map:
                final_disease = default_disease
                
        return {
            "final_disease": final_disease,
            "clinical_rationale": result.get("clinical_rationale", default_rationale),
            "disagreement_flag": bool(result.get("disagreement_flag", False))
        }
    except Exception as e:
        print(f"--- DEBUG: Triage fusion failed: {e}. Using statistical default ---")
        return {
            "final_disease": default_disease,
            "clinical_rationale": default_rationale,
            "disagreement_flag": False
        }


# ==========================================
# 4. THE MASTER ENDPOINT
# ==========================================
@app.get("/health")
@app.head("/health")
def health_check():
    return {
        "status": "ok",
        "classes": len(model.classes_) if model else 0,
        "symptoms": len(symptoms_list),
        "rag_ready": rag_retriever is not None
    }


@app.post("/api/v1/chat")
def handle_chat(request: ChatRequest):
    try:
        print(f"\nIncoming Message: {request.user_message}")
        print(f"Previous Present Symptoms: {request.current_symptoms}")
        print(f"Previous Denied Symptoms: {request.denied_symptoms}")

        # Step 1: Use LLM to extract symptoms
        extraction = extract_symptoms(request.user_message, request.chat_history)
        print(f"Newly Extracted Symptoms: {extraction}")
        
        new_present = extraction.get("present", [])
        new_denied = extraction.get("denied", [])
        
        all_present = list(set(request.current_symptoms + new_present))
        
        existing_denied = getattr(request, "denied_symptoms", []) or []
        all_denied = list(set(existing_denied + new_denied))
        
        print(f"Combined Master Present List: {all_present}")
        print(f"Combined Master Denied List: {all_denied}")
        
        if not all_present:
            return {
                "status": "CONTINUE_CHAT",
                "bot_reply": "I'm sorry, I didn't quite catch your symptoms. Could you describe how you are feeling in more detail?",
                "tracked_symptoms": [],
                "denied_symptoms": all_denied
            }

        # Step 2: Prepare data for ML Model
        input_data = np.zeros(len(symptoms_list))
        for sym in all_present:
            if sym in symptoms_list:
                index = symptoms_list.index(sym)
                input_data[index] = 1
                
        input_df = pd.DataFrame([input_data], columns=symptoms_list)
        
        # Predict probabilities
        probabilities = model.predict_proba(input_df)[0]
        classes = model.classes_
        disease_probs = sorted(zip(classes, probabilities), key=lambda x: x[1], reverse=True)
        
        top_disease = disease_probs[0][0]
        top_confidence = disease_probs[0][1]
        
        print(f"ML Statistical Prediction: {top_disease} at {top_confidence:.2%} confidence")

        # Step 3: Retrieve Clinical Knowledge via RAG
        retrieved_evidence = []
        if rag_retriever:
            retrieved_evidence = rag_retriever.retrieve_evidence(
                user_complaint=request.user_message,
                confirmed_symptoms=all_present,
                top_k=3
            )
            print(f"RAG Retrieved Top Matches: {[e['disease'] for e in retrieved_evidence]}")

        # Step 4: Routing Logic
        # Ask follow-up question ONLY if confidence is low AND patient hasn't denied too many symptoms
        if top_confidence < 0.65 and len(all_denied) < 2:
            instruction = f"The model suspects {disease_probs[0][0]} or {disease_probs[1][0]}. Ask a specific question to tell them apart."
            bot_reply = generate_followup(instruction, all_present, all_denied, request.chat_history)
            
            return {
                "status": "ASKING_QUESTION",
                "bot_reply": bot_reply,
                "tracked_symptoms": all_present,
                "denied_symptoms": all_denied,
                "predicted_disease": "Pending",
                "confidence": round(top_confidence * 100, 1)
            }
            
        else:
            # Step 5: Triage Complete - Fuse Classifier + RAG Retrieval via Gemini Arbiter
            fusion_result = grounded_triage_fusion(
                ml_candidates=disease_probs[:3],
                retrieved_evidence=retrieved_evidence,
                confirmed_symptoms=all_present,
                denied_symptoms=all_denied,
                user_complaint=request.user_message
            )
            
            final_disease = fusion_result["final_disease"]
            clinical_rationale = fusion_result["clinical_rationale"]
            
            print(f"Final Grounded Diagnosis: {final_disease} (Disagreement Flag: {fusion_result['disagreement_flag']})")
            
            diet_plan = "No BMI data provided for diet generation."
            if request.weight_kg is not None and request.height_m is not None and request.height_m > 0:
                bmi = request.weight_kg / (request.height_m ** 2)
                diet_plan = generate_diet_plan(final_disease, bmi)
                
            recommended_doctor = specialist_map.get(final_disease, "General Physician")
            
            return {
                "status": "TRIAGE_COMPLETE",
                "bot_reply": f"Based on your symptoms and clinical reference evidence, I suspect you may have {final_disease}. {clinical_rationale} Please book an appointment with a {recommended_doctor}. I have also generated a customized diet plan for your recovery.",
                "tracked_symptoms": all_present,
                "denied_symptoms": all_denied,
                "predicted_disease": final_disease,
                "confidence": round(top_confidence * 100, 1),
                "diet_plan": diet_plan,
                "specialist": recommended_doctor
            }
            
    except Exception as e:
        print(f"[CRITICAL ERROR] Error in handle_chat: {e}")
        fallback_disease = "Common Cold"
        if request.current_symptoms:
            try:
                input_data = np.zeros(len(symptoms_list))
                for sym in request.current_symptoms:
                    if sym in symptoms_list:
                        index = symptoms_list.index(sym)
                        input_data[index] = 1
                input_df = pd.DataFrame([input_data], columns=symptoms_list)
                fallback_disease = model.predict(input_df)[0]
            except Exception:
                pass
                
        recommended_doctor = specialist_map.get(fallback_disease, "General Physician")
        
        diet_plan = """• Hydration: Drink plenty of water and warm fluids.
• Nutrition: Eat light, easily digestible meals."""
        if request.weight_kg is not None and request.height_m is not None and request.height_m > 0:
            try:
                bmi = request.weight_kg / (request.height_m ** 2)
                diet_plan = local_diet_plan(fallback_disease, bmi)
            except Exception:
                pass
                
        return {
            "status": "TRIAGE_COMPLETE",
            "bot_reply": f"Based on a review of your symptoms, I suspect you may have {fallback_disease}. Please book an appointment with a {recommended_doctor}. I have also generated a customized diet plan for your recovery.",
            "tracked_symptoms": request.current_symptoms or [],
            "denied_symptoms": request.denied_symptoms or [],
            "predicted_disease": fallback_disease,
            "confidence": 50.0,
            "diet_plan": diet_plan,
            "specialist": recommended_doctor
        }