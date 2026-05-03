package com.cfs.appointment.service;

import com.cfs.appointment.dto.PythonChatRequest;
import com.cfs.appointment.dto.PythonChatResponse;
import com.cfs.appointment.entity.Consultation;
import com.cfs.appointment.entity.TriageSession;
import com.cfs.appointment.repository.ConsultationRepository;
import com.cfs.appointment.repository.TriageSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.time.LocalDateTime;

@Service
public class ChatbotService {

    @Autowired
    private TriageSessionRepository sessionRepository;
    
    @Autowired
    private ConsultationRepository consultationRepository;
    
    private final RestTemplate restTemplate;

    public ChatbotService() {
        // Add a timeout so it doesn't hang the whole backend
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000); // 5 seconds
        factory.setReadTimeout(15000);    // 15 seconds (AI can be slow)
        this.restTemplate = new RestTemplate(factory);
    }

    private final String PYTHON_API_URL = "http://127.0.0.1:8000/api/v1/chat";

    public String processUserMessage(String username, String userMessage, Double weight, Double height) {
        System.out.println("🤖 AI Request for: " + username + " | Message: " + userMessage);
        
        TriageSession session = sessionRepository.findById(username).orElseGet(() -> {
            TriageSession newSession = new TriageSession();
            newSession.setUsername(username);
            return newSession;
        });

        session.getChatLog().add("Patient: " + userMessage);

        PythonChatRequest request = new PythonChatRequest();
        request.user_message = userMessage;
        request.current_symptoms = session.getCurrentSymptoms();
        request.weight_kg = weight; 
        request.height_m = height;  

        System.out.println("🔗 Calling AI Service at: " + PYTHON_API_URL);
        
        PythonChatResponse pythonResponse;
        try {
            pythonResponse = restTemplate.postForObject(PYTHON_API_URL, request, PythonChatResponse.class);
            System.out.println("✅ AI Response received. Status: " + (pythonResponse != null ? pythonResponse.status : "NULL"));
        } catch (Exception e) {
            System.err.println("❌ AI Service Error: " + e.getMessage());
            return "System error: AI Microservice is currently unreachable at port 8000. Please ensure the Python service is running.";
        }

        if (pythonResponse == null) {
            return "System error: Received empty response from AI.";
        }

        session.setCurrentSymptoms(pythonResponse.tracked_symptoms);
        session.getChatLog().add("AI: " + pythonResponse.bot_reply);
        
        if ("TRIAGE_COMPLETE".equals(pythonResponse.status)) {
            System.out.println("🏥 Triage Complete. Saving Consultation report.");
            session.setStatus("ROUTED");
            
            Consultation finalConsultation = new Consultation();
            finalConsultation.setPatientSymptoms(String.join(", ", session.getCurrentSymptoms()));
            finalConsultation.setPredictedDisease(pythonResponse.predicted_disease);
            finalConsultation.setRecommendedSpecialist(pythonResponse.specialist);
            finalConsultation.setDietRecommendations(pythonResponse.diet_plan);
            
            String chatHistory = String.join("\n", session.getChatLog());
            finalConsultation.setAiReportSummary(
                "AI Confidence: " + pythonResponse.confidence + "%\n\nTranscript:\n" + chatHistory
            );
            
            finalConsultation.setCompletedAt(LocalDateTime.now());
            consultationRepository.save(finalConsultation);
        }

        sessionRepository.save(session);
        return pythonResponse.bot_reply;
    }

    public void clearSession(String username) {
        if (sessionRepository.existsById(username)) {
            sessionRepository.deleteById(username);
        }
    }
}