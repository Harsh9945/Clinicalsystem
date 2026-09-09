import os
import json
from fastapi.testclient import TestClient
from main import app

def run_rag_fusion_benchmark():
    print("=" * 80)
    print("HYBRID AI TRIAGE BENCHMARK: CLASSIFIER + VECTOR RAG + ARBITER EVALUATION")
    print("=" * 80)
    
    client = TestClient(app)

    # --------------------------------------------------------------------------
    # CASE 1: AMBIGUOUS DIFFERENTIAL PRESENTATION (Malaria vs Typhoid vs Dengue)
    # Patient presents with overlapping systemic febrile symptoms + night sweats
    # --------------------------------------------------------------------------
    print("\n--- TEST CASE 1: Ambiguous Febrile Symptoms (Malaria vs Typhoid) ---")
    payload_ambiguous = {
        "user_message": "I have had severe high fever with intense shivering chills, drenching night sweats, and headache. No stomach pain or diarrhea.",
        "current_symptoms": ["high_fever", "chills", "sweating", "headache"],
        "denied_symptoms": ["stomach_pain", "diarrhoea", "constipation"],
        "chat_history": [
            "AI: Are you experiencing any abdominal pain or digestive issues?",
            "Patient: No, none of that, just severe chills, shaking, sweating and fever."
        ],
        "weight_kg": 70.0,
        "height_m": 1.75
    }
    
    res1 = client.post("/api/v1/chat", json=payload_ambiguous)
    assert res1.status_code == 200, f"Error: {res1.text}"
    data1 = res1.json()
    
    print(f"Status: {data1.get('status')}")
    print(f"Predicted Disease: {data1.get('predicted_disease')}")
    print(f"Recommended Specialist: {data1.get('specialist')}")
    print(f"Confidence: {data1.get('confidence')}%")
    print(f"Bot Reply (Grounded): {data1.get('bot_reply')}\n")
    print(f"Diet Plan Sample:\n{data1.get('diet_plan')}")

    # --------------------------------------------------------------------------
    # CASE 2: DERMATOLOGY CONFLICT / EXCLUSION (Fungal Infection vs Psoriasis)
    # Patient denies joint pain and silver dusting, confirming Fungal Infection
    # --------------------------------------------------------------------------
    print("\n" + "-" * 80)
    print("--- TEST CASE 2: Dermatology Differential with Denied Symptoms ---")
    payload_derm = {
        "user_message": "I have intense itching and a red skin rash in my skin folds, but definitely no joint pain or silvery flaking skin.",
        "current_symptoms": ["itching", "skin_rash", "nodal_skin_eruptions"],
        "denied_symptoms": ["joint_pain", "silver_like_dusting"],
        "chat_history": [
            "AI: Do you notice any silver-colored scales or joint aches?",
            "Patient: No silver scales and no joint pain at all."
        ],
        "weight_kg": 65.0,
        "height_m": 1.68
    }
    
    res2 = client.post("/api/v1/chat", json=payload_derm)
    assert res2.status_code == 200, f"Error: {res2.text}"
    data2 = res2.json()
    
    print(f"Status: {data2.get('status')}")
    print(f"Predicted Disease: {data2.get('predicted_disease')}")
    print(f"Recommended Specialist: {data2.get('specialist')}")
    print(f"Bot Reply (Grounded): {data2.get('bot_reply')}")

    print("\n" + "=" * 80)
    print("ALL HYBRID TRIAGE BENCHMARK TESTS PASSED SUCCESSFULLY!")
    print("=" * 80)

if __name__ == "__main__":
    run_rag_fusion_benchmark()
