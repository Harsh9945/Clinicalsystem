import time
import json
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_ambiguous_migraine_differential():
    print("=" * 80)
    print("LIVE AMBIGUOUS SYMPTOM VERIFICATION: HEADACHE + NAUSEA DIFFERENTIAL")
    print("=" * 80)
    
    # --------------------------------------------------------------------------
    # TURN 1: Ambiguous initial complaint (only 2 symptoms reported)
    # Expected: Low classifier confidence -> Dynamic tie-breaking question
    # --------------------------------------------------------------------------
    msg1 = "I have a throbbing headache on one side of my head and I feel nauseous."
    print(f"\n[Turn 1] Patient says: \"{msg1}\"")
    
    payload1 = {
        "user_message": msg1,
        "current_symptoms": [],
        "denied_symptoms": [],
        "chat_history": [],
        "weight_kg": 70.0,
        "height_m": 1.75
    }
    
    res1 = client.post("/api/v1/chat", json=payload1)
    assert res1.status_code == 200, f"Turn 1 failed: {res1.text}"
    data1 = res1.json()
    
    print("\n--- TURN 1 RESULTS ---")
    print(f"Status:             {data1.get('status')} (Expected: ASKING_QUESTION)")
    print(f"Confidence:         {data1.get('confidence')}%")
    print(f"Tracked Symptoms:   {data1.get('tracked_symptoms')}")
    print(f"AI Follow-up Question: {data1.get('bot_reply')}")
    
    assert data1.get("status") == "ASKING_QUESTION", "Expected status ASKING_QUESTION on ambiguous 2-symptom input"
    
    # Pause 12 seconds to ensure we do not trip the 5 RPM free-tier rate limit
    print("\n[INFO] Waiting 12 seconds to respect Gemini Free-Tier rate limits...")
    time.sleep(12)
    
    # --------------------------------------------------------------------------
    # TURN 2: Patient confirms differentiating symptoms and denies alternatives
    # Expected: Triage complete -> Grounded diagnosis with RAG evidence & Neurologist
    # --------------------------------------------------------------------------
    msg2 = "Yes, I have extreme sensitivity to light and blurry vision, but definitely no fever and no stiff neck."
    print(f"\n[Turn 2] Patient replies: \"{msg2}\"")
    
    payload2 = {
        "user_message": msg2,
        "current_symptoms": data1.get("tracked_symptoms", []),
        "denied_symptoms": data1.get("denied_symptoms", []),
        "chat_history": [
            f"Patient: {msg1}",
            f"AI: {data1.get('bot_reply')}"
        ],
        "weight_kg": 70.0,
        "height_m": 1.75
    }
    
    res2 = client.post("/api/v1/chat", json=payload2)
    assert res2.status_code == 200, f"Turn 2 failed: {res2.text}"
    data2 = res2.json()
    
    print("\n--- TURN 2 FINAL TRIAGE RESULTS ---")
    print(f"Status:             {data2.get('status')} (Expected: TRIAGE_COMPLETE)")
    print(f"Predicted Disease:  {data2.get('predicted_disease')}")
    print(f"Specialist:         {data2.get('specialist')}")
    print(f"Confidence:         {data2.get('confidence')}%")
    print(f"Tracked Symptoms:   {data2.get('tracked_symptoms')}")
    print(f"Denied Symptoms:    {data2.get('denied_symptoms')}")
    print(f"\nFull Grounded Bot Reply:\n\"{data2.get('bot_reply')}\"")
    print(f"\nCustom Diet Plan:\n{data2.get('diet_plan')}")
    
    assert data2.get("status") == "TRIAGE_COMPLETE", "Expected TRIAGE_COMPLETE in Turn 2"
    assert data2.get("predicted_disease") == "Migraine", f"Expected Migraine, got {data2.get('predicted_disease')}"
    assert data2.get("specialist") == "Neurologist", f"Expected Neurologist, got {data2.get('specialist')}"
    
    print("\n" + "=" * 80)
    print("VERIFICATION COMPLETED: AMBIGUOUS TRIAGE & GROUNDED RAG ARBITRATION WORKS 100%!")
    print("=" * 80)

if __name__ == "__main__":
    test_ambiguous_migraine_differential()
