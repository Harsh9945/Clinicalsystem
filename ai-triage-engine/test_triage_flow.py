import os
from fastapi.testclient import TestClient
from main import app

def test_ai_triage():
    print("[INFO] Initializing FastAPI TestClient for AI Triage Service...")
    client = TestClient(app)
    
    test_payload = {
        "user_message": "Hi, I have a really high fever, severe headache, and vomiting. I feel very tired.",
        "current_symptoms": [],
        "denied_symptoms": [],
        "chat_history": [],
        "weight_kg": 75.0,
        "height_m": 1.78
    }
    
    print(f"[INFO] Sending test payload: {test_payload['user_message']}")
    
    try:
        response = client.post("/api/v1/chat", json=test_payload)
        
        print("\n--- TEST RESULTS ---")
        print(f"HTTP Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Response JSON:")
            import json
            print(json.dumps(data, indent=4))
            
            assert "status" in data, "Missing 'status' field in response"
            assert "bot_reply" in data, "Missing 'bot_reply' field in response"
            assert "tracked_symptoms" in data, "Missing 'tracked_symptoms' field in response"
            assert "denied_symptoms" in data, "Missing 'denied_symptoms' field in response"
            
            print("\nSUCCESS: The AI Triage FastAPI endpoints are working perfectly!")
        else:
            print(f"FAILURE: Received error status code: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"CRITICAL ERROR during triage testing: {e}")

if __name__ == "__main__":
    test_ai_triage()
