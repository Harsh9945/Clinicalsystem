# 🧠 Clinova AI Triage Engine (Hybrid RAG + Classifier)

The **Clinova AI Triage Engine** is a high-performance, resilient microservice designed to perform real-time clinical diagnostic reasoning. Powered by **FastAPI**, it merges deterministic local **Machine Learning classification models (41 Diseases, 132 Symptoms)** with **ChromaDB dense vector retrieval (`gemini-embedding-001`)** and cognitive LLM arbitration via **Google Gemini 2.5 Flash**, backed by a multi-tier **automatic local fallback system** for zero-downtime production reliability.

> [!TIP]
> 📖 **Full System Architecture Document:** For complete High-Level Design (HLD), Low-Level Design (LLD), component class diagrams, and multi-turn sequence diagrams, see [SYSTEM_ARCHITECTURE_HLD_LLD.md](../SYSTEM_ARCHITECTURE_HLD_LLD.md).

---

## 🗺️ Triage Architecture & Data Flow

The triage engine acts as an asynchronous decision-making layer between the React client, the Spring Boot orchestrator, ChromaDB, and Google Gemini API.

```mermaid
sequenceDiagram
    participant Patient as React Frontend
    participant Java as Spring Boot Backend
    participant Python as FastAPI AI Engine
    participant ML as Logistic Regression (41 Classes)
    participant Chroma as ChromaDB Vector Store
    participant Gemini as Google Gemini 2.5 Flash

    Patient->>Java: POST /api/chat (message & vitals)
    Note over Java: Retrieves TriageSession<br/>from MySQL
    Java->>Python: POST /api/v1/chat (payload)
    
    rect rgb(240, 248, 255)
        Note over Python: [Stage 1] Symptom Extraction
        Python->>Gemini: Parse message for present & denied symptoms
        alt Gemini API Online
            Gemini-->>Python: Return JSON {"present": [...], "denied": [...]}
        else Gemini Offline / Rate-Limited (429)
            Note over Python: LOCAL FALLBACK: Substring & synonym mapping<br/>with negation prefix parsing ('no', 'not', 'without')
        end
    end

    Note over Python: [Stage 2] Parametric Inference
    Python->>ML: Pass 132-dimensional binary symptom vector
    ML-->>Python: Return calibrated disease probability distribution

    alt Confidence < 65% and Denials < 2
        Note over Python: [Stage 3a] Dynamic Tie-Breaking Question
        Python->>Gemini: Generate conversational question for top ambiguous candidates
        Gemini-->>Python: Discriminator clinical question
        Python-->>Java: Response (status: ASKING_QUESTION)
    else Confidence >= 65% or Denial Threshold Reached
        rect rgb(245, 250, 245)
            Note over Python: [Stage 3b] Non-Parametric Retrieval (RAG)
            Python->>Chroma: retrieve_evidence(complaint, confirmed_symptoms)
            Chroma-->>Python: Top-3 Medical Profile Cards (gemini-embedding-001)
            
            Note over Python: [Stage 4] Cognitive Clinical Arbitration
            Python->>Gemini: grounded_triage_fusion(ml_candidates, retrieved_evidence, present, denied)
            Note over Gemini: Cross-references statistical model against medical literature.<br/>Rules out lookalikes based on denied symptoms.
            Gemini-->>Python: Confirmed final disease & grounded rationale
            
            Note over Python: [Stage 5] Tailored Nutrition Plan
            Python->>Gemini: Generate 2-day diet plan based on BMI category & disease
            Gemini-->>Python: Custom clinical diet plan
            Python-->>Java: Response (status: TRIAGE_COMPLETE, specialist, diet_plan)
        end
    end

    Note over Java: If TRIAGE_COMPLETE,<br/>links patient & saves Consultation report
    Java-->>Patient: Return bot reply (conversational response)
```

---

## 🔬 Core Hybrid Intelligence Architecture

### 1. Local Machine Learning Classifier (`triage_model.pkl`)
* **Underlying Model**: `LogisticRegression(max_iter=1000, C=0.5)` trained on 4,920 records across 41 disease classes.
* **Feature Space**: 132-dimensional binary symptom vector loaded from `symptoms_list.pkl`.
* **Calibrated Softmax Probabilities**: Unlike tree ensembles (Random Forest) which output uncalibrated step-function leaf fractions, Logistic Regression produces strictly calibrated posterior probabilities $P(\text{Disease} \mid \text{Symptoms})$ essential for setting clinical follow-up decision thresholds (`< 65%`).

### 2. Dense Vector Retrieval Layer (`rag_retriever.py`)
* **Vector Store**: In-memory **ChromaDB** collection (`clinical_disease_kb`).
* **Embedding Model**: Google's production **`gemini-embedding-001`** model.
* **Pre-computed Caching**: Embeddings are pre-computed and stored in `knowledge_embeddings.pkl` for `< 1ms` query latency and zero API cost on startup.
* **Resilient Fallback**: Includes an automatic TF-IDF cosine similarity fallback if offline.

### 3. Cognitive Arbiter & Grounding Engine (`MODEL_ID = "gemini-2.5-flash"`)
* Formulates a grounded medical explanation citing hallmark symptoms from reference literature.
* Solves **diagnostic ties** when overlapping symptoms confuse the statistical classifier.
* Flags disagreements (`disagreement_flag: true/false`) when denied symptoms contradict the statistical model.

---

## 📊 Empirical Evaluation & Benchmarks

### 1. Stratified Model Benchmark (984 Held-out Test Records)

| Metric | Logistic Regression (Selected) | Random Forest Baseline |
| :--- | :---: | :---: |
| **Accuracy** | **100.00%** | **100.00%** |
| **Macro Precision** | **1.00** | **1.00** |
| **Macro Recall** | **1.00** | **1.00** |
| **Weighted F1-Score** | **1.00** | **1.00** |

### 2. Real-World Symptom Ablation Study (`ablation_report.csv`)

| Symptoms Shown ($k$) | Mean Classifier Confidence | Classifier Accuracy | % Below Threshold ($< 65\%$) | % in Diagnostic Tie (Margin $< 15\%$) |
| :---: | :---: | :---: | :---: | :---: |
| **$k = 2$ symptoms** | **28.63%** | **59.86%** | **90.35%** | **52.34%** |
| **$k = 3$ symptoms** | **46.41%** | **74.29%** | **66.36%** | **38.82%** |
| **$k = 4$ symptoms** | **60.11%** | **86.08%** | **45.43%** | **25.51%** |
| **Full Textbook** | **96.21%** | **100.00%** | **0.00%** | **0.00%** |

*Takeaway:* Real patients present with only 2–3 symptoms. At $k=2$, the classifier alone drops to **59.86% accuracy** and is tied in **52.34% of cases**, demonstrating why the RAG retrieval and Gemini arbitration layer is essential.

---

## 🛡️ Resilient Local Fallback Engine (Zero-Downtime Architecture)

| Task | Normal Mode (Gemini API) | Fallback Mode (100% Local) |
| :--- | :--- | :--- |
| **Startup** | Initializes `genai.Client`. | Catches authentication/network errors gracefully and runs local-only. |
| **Symptom Extraction** | LLM outputs confirmed and denied JSON. | Negation-aware substring matching + fuzzy clinical synonym dictionary. |
| **Vector Retrieval** | ChromaDB with `gemini-embedding-001`. | Pre-computed `knowledge_embeddings.pkl` + TF-IDF cosine matching. |
| **Follow-up Questions** | Empathy-rich dialogue tailored to break ties. | Rule-based clinical symptom discriminator. |
| **Diagnosis Arbitration**| Gemini cross-references prior with RAG evidence. | Top statistical candidate with retrieved reference card. |
| **Diet Generation** | Dynamic 2-day diet plans tailored to BMI & disease. | Rule-based clinical nutritionist diet plans. |

---

## 🔌 Connection with Java Spring Boot Backend

### 📥 Request Payload (`PythonChatRequest` sent to `/api/v1/chat`)
```json
{
  "user_message": "I have severe headache and nausea for the past day.",
  "current_symptoms": [],
  "denied_symptoms": [],
  "chat_history": [],
  "weight_kg": 70.0,
  "height_m": 1.75
}
```

### 📤 Response Payload (`PythonChatResponse` returned to Spring Boot)
```json
{
  "status": "TRIAGE_COMPLETE",
  "bot_reply": "Based on your symptoms and clinical reference evidence, I suspect you may have Migraine. The patient's confirmed symptoms of extreme sensitivity to light, blurred vision, nausea, and headache align directly with the retrieved evidence for Migraine. Although the statistical model's top prediction was Vertigo, the patient did not report dizziness or spinning sensations, and Migraine better explains the visual and photophobia complaints. Please book an appointment with a Neurologist. I have also generated a customized diet plan for your recovery.",
  "tracked_symptoms": ["nausea", "blurred_and_distorted_vision", "headache"],
  "denied_symptoms": ["high_fever", "mild_fever", "stiff_neck"],
  "predicted_disease": "Migraine",
  "confidence": 14.0,
  "specialist": "Neurologist",
  "diet_plan": "• Hydration: Drink plenty of water.\n• Nutrition: Avoid aged cheeses, caffeine, and processed foods."
}
```
