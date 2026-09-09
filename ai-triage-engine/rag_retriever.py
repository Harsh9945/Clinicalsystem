import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
import chromadb
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

# Check for Google GenAI Client
genai_client = None
try:
    from google import genai
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        genai_client = genai.Client(api_key=api_key)
    else:
        genai_client = genai.Client()
except Exception as e:
    genai_client = None

EMBEDDING_MODEL = "gemini-embedding-001"

class ClinicalRAGRetriever:
    """
    Retrieval-Augmented Generation (RAG) knowledge engine for differential diagnosis.
    Indexes 41 composite disease profiles into ChromaDB using Google's gemini-embedding-001
    with persistent vector caching and a resilient local TF-IDF cosine fallback.
    """
    def __init__(self, kb_path: Optional[str] = None):
        if kb_path is None:
            kb_path = os.path.join(BASE_DIR, "clinical_knowledge_base.json")
            
        with open(kb_path, "r") as f:
            self.knowledge_base = json.load(f)
            
        self.diseases = list(self.knowledge_base.keys())
        self.documents = [self.knowledge_base[d]["search_content"] for d in self.diseases]
        
        # Initialize ChromaDB client (in-memory ephemeral client for fast <1ms query times)
        self.chroma_client = chromadb.Client()
        self.collection_name = "clinical_disease_kb"
        
        # Clear existing collection if re-initializing in same session
        try:
            self.chroma_client.delete_collection(self.collection_name)
        except Exception:
            pass
            
        self.collection = self.chroma_client.create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"}
        )
        
        # Local TF-IDF Fallback Vectorizer
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
        self.tfidf_vectorizer = TfidfVectorizer(stop_words="english")
        self.tfidf_matrix = self.tfidf_vectorizer.fit_transform(self.documents)
        self.cosine_similarity = cosine_similarity
        
        self.use_gemini_embeddings = False
        self._initialize_embeddings()

    def _get_gemini_embedding(self, text: str) -> Optional[List[float]]:
        if not genai_client:
            return None
        try:
            res = genai_client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=text
            )
            # res.embeddings[0].values contains the dense vector
            if hasattr(res, "embeddings") and res.embeddings:
                return res.embeddings[0].values
        except Exception as e:
            # Silently fall back if quota exceeded or offline
            pass
        return None

    def _initialize_embeddings(self):
        cache_path = os.path.join(BASE_DIR, "knowledge_embeddings.pkl")
        cached_embeddings = None
        
        if os.path.exists(cache_path):
            try:
                cached_embeddings = joblib.load(cache_path)
                print("[INFO] Loaded pre-computed knowledge embeddings from cache.")
            except Exception:
                cached_embeddings = None

        # Try to generate or use cached Gemini embeddings
        embeddings_to_add = []
        if cached_embeddings and len(cached_embeddings) == len(self.documents):
            embeddings_to_add = cached_embeddings
            self.use_gemini_embeddings = True
        elif genai_client:
            print("[INFO] Generating dense embeddings using gemini-embedding-001...")
            generated = []
            for doc in self.documents:
                emb = self._get_gemini_embedding(doc)
                if emb is not None:
                    generated.append(emb)
                else:
                    break
                    
            if len(generated) == len(self.documents):
                embeddings_to_add = generated
                self.use_gemini_embeddings = True
                try:
                    joblib.dump(generated, cache_path)
                    print("[INFO] Cached gemini-embedding-001 vectors to knowledge_embeddings.pkl")
                except Exception:
                    pass
                    
        # Add to ChromaDB if we have valid embeddings
        if self.use_gemini_embeddings and embeddings_to_add:
            self.collection.add(
                ids=self.diseases,
                documents=self.documents,
                embeddings=embeddings_to_add,
                metadatas=[{"disease": d, "specialist": self.knowledge_base[d]["specialist"]} for d in self.diseases]
            )
            print(f"[INFO] ChromaDB initialized with {len(self.diseases)} disease profiles (gemini-embedding-001 mode).")
        else:
            # Use ChromaDB's built-in default embeddings or local TF-IDF
            try:
                self.collection.add(
                    ids=self.diseases,
                    documents=self.documents,
                    metadatas=[{"disease": d, "specialist": self.knowledge_base[d]["specialist"]} for d in self.diseases]
                )
                print(f"[INFO] ChromaDB initialized with {len(self.diseases)} disease profiles (built-in ONNX embedding mode).")
            except Exception as e:
                print(f"[WARNING] ChromaDB default embedding failed ({e}). Operating in resilient TF-IDF mode.")

    def retrieve_evidence(
        self, 
        user_complaint: str, 
        confirmed_symptoms: List[str], 
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Retrieves top-k clinically grounded disease profiles given patient complaint and symptoms.
        """
        # Formulate rich clinical query
        clean_symptoms = [s.replace("_", " ") for s in confirmed_symptoms]
        query_text = f"Patient presenting with symptoms: {', '.join(clean_symptoms)}. Patient description: {user_complaint}"
        
        # 1. Try Gemini Embeddings in ChromaDB
        if self.use_gemini_embeddings:
            query_emb = self._get_gemini_embedding(query_text)
            if query_emb is not None:
                try:
                    results = self.collection.query(
                        query_embeddings=[query_emb],
                        n_results=top_k
                    )
                    evidence_list = []
                    for i, d_id in enumerate(results["ids"][0]):
                        distance = results["distances"][0][i] if "distances" in results and results["distances"] else 0.0
                        similarity = max(0.0, round(1.0 - float(distance), 3))
                        entry = self.knowledge_base[d_id]
                        evidence_list.append({
                            "disease": entry["disease"],
                            "description": entry["description"],
                            "hallmark_symptoms": entry["readable_symptoms"],
                            "precautions": entry["precautions"],
                            "specialist": entry["specialist"],
                            "similarity": similarity
                        })
                    return evidence_list
                except Exception as e:
                    print(f"[WARNING] Chroma query with Gemini embedding failed: {e}. Falling back...")

        # 2. Try Standard ChromaDB Query
        try:
            results = self.collection.query(
                query_texts=[query_text],
                n_results=top_k
            )
            if results["ids"] and results["ids"][0]:
                evidence_list = []
                for i, d_id in enumerate(results["ids"][0]):
                    distance = results["distances"][0][i] if "distances" in results and results["distances"] else 0.0
                    similarity = max(0.0, round(1.0 - float(distance), 3))
                    entry = self.knowledge_base[d_id]
                    evidence_list.append({
                        "disease": entry["disease"],
                        "description": entry["description"],
                        "hallmark_symptoms": entry["readable_symptoms"],
                        "precautions": entry["precautions"],
                        "specialist": entry["specialist"],
                        "similarity": similarity
                    })
                return evidence_list
        except Exception:
            pass

        # 3. Resilient Local TF-IDF Cosine Similarity Fallback
        query_vec = self.tfidf_vectorizer.transform([query_text])
        sims = self.cosine_similarity(query_vec, self.tfidf_matrix)[0]
        top_indices = np.argsort(sims)[::-1][:top_k]
        
        evidence_list = []
        for idx in top_indices:
            d_id = self.diseases[idx]
            entry = self.knowledge_base[d_id]
            evidence_list.append({
                "disease": entry["disease"],
                "description": entry["description"],
                "hallmark_symptoms": entry["readable_symptoms"],
                "precautions": entry["precautions"],
                "specialist": entry["specialist"],
                "similarity": round(float(sims[idx]), 3)
            })
        return evidence_list

if __name__ == "__main__":
    retriever = ClinicalRAGRetriever()
    print("\n--- Testing RAG Retrieval for Ambiguous Symptoms (Fever, Chills, Sweating, Headache) ---")
    test_evidence = retriever.retrieve_evidence(
        user_complaint="I have high fever with shivering chills, severe headache, and profuse sweating at night.",
        confirmed_symptoms=["high_fever", "chills", "headache", "sweating"],
        top_k=3
    )
    for ev in test_evidence:
        print(f"\n[Disease: {ev['disease']} | Similarity: {ev['similarity']}]")
        print(f"Specialist: {ev['specialist']}")
        print(f"Hallmark Symptoms: {ev['hallmark_symptoms']}")
        print(f"Description: {ev['description']}")
