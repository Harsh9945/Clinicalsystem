import json
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_test(scenario_name, conversation_steps):
    print("\n" + "=" * 80)
    print(f"SCENARIO: {scenario_name}")
    print("=" * 80)
    
    current_symptoms = []
    denied_symptoms = []
    chat_history = []
    
    for step_num, user_msg in enumerate(conversation_steps, 1):
        print(f"\n[Turn {step_num}] Patient: \"{user_msg}\"")
        payload = {
            "user_message": user_msg,
            "current_symptoms": current_symptoms,
            "denied_symptoms": denied_symptoms,
            "chat_history": chat_history,
            "weight_kg": 68.0,
            "height_m": 1.72
        }
        
        response = client.post("/api/v1/chat", json=payload)
        if response.status_code != 200:
            print(f"ERROR: Status code {response.status_code}")
            print(response.text)
            return False
            
        data = response.json()
        status = data.get("status")
        bot_reply = data.get("bot_reply")
        current_symptoms = data.get("tracked_symptoms", [])
        denied_symptoms = data.get("denied_symptoms", [])
        predicted_disease = data.get("predicted_disease")
        confidence = data.get("confidence")
        specialist = data.get("specialist")
        
        chat_history.append(f"Patient: {user_msg}")
        chat_history.append(f"AI: {bot_reply}")
        
        print(f"-> AI Status: {status}")
        print(f"-> Tracked Symptoms: {current_symptoms}")
        print(f"-> Denied Symptoms: {denied_symptoms}")
        print(f"-> Confidence: {confidence}%")
        print(f"-> Bot Reply: {bot_reply}")
        
        if status == "TRIAGE_COMPLETE":
            print(f"\n[SUCCESS] Final Diagnosis: {predicted_disease}")
            print(f"[SUCCESS] Routed Specialist: {specialist}")
            print(f"[SUCCESS] Diet Plan Included: {'Yes' if data.get('diet_plan') else 'No'}")
            break

if __name__ == "__main__":
    print("================================================================================")
    print("INTERNAL VERIFICATION OF AMBIGUOUS SYMPTOM TRIAGE & TIE-BREAKING")
    print("================================================================================")

    # --------------------------------------------------------------------------
    # TEST 1: Ambiguous Head Pain (Tension / Hypertension vs Migraine)
    # --------------------------------------------------------------------------
    run_test(
        "Ambiguous Headache & Nausea (Migraine vs Hypertension/GERD)",
        [
            "I've been suffering from a bad headache and nausea for the past day.",
            "Yes, bright lights and loud sounds make it so much worse, but my blood pressure is normal and no chest tightness."
        ]
    )

    # --------------------------------------------------------------------------
    # TEST 2: Ambiguous Respiratory / Chest Discomfort (Pneumonia vs Heart Attack)
    # --------------------------------------------------------------------------
    run_test(
        "Ambiguous Cough & Chest Pain (Pneumonia vs Heart Attack / Asthma)",
        [
            "I have a painful cough and some chest pain when I breathe, plus I feel completely drained.",
            "Yes, I have a high fever with shivering and yellowish mucus, but no radiating pain to my arm or sweating."
        ]
    )

    # --------------------------------------------------------------------------
    # TEST 3: Ambiguous Joint Pain (Osteoarthritis vs Dengue / Arthritis)
    # --------------------------------------------------------------------------
    run_test(
        "Ambiguous Joint Aches (Osteoarthritis vs Dengue vs Viral)",
        [
            "My knees and joints are really aching and stiff, and I feel worn out.",
            "No high fever and no skin rash at all, it's just my knee joints that hurt badly when walking down stairs."
        ]
    )
