package com.cfs.appointment.service;

import com.cfs.appointment.dto.PythonChatRequest;
import com.cfs.appointment.dto.PythonChatResponse;
import com.cfs.appointment.entity.Consultation;
import com.cfs.appointment.entity.TriageSession;
import com.cfs.appointment.repository.ConsultationRepository;
import com.cfs.appointment.repository.TriageSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.time.LocalDateTime;

@Service
public class ChatbotService {

    @Autowired
    private TriageSessionRepository sessionRepository;
    
    @Autowired
    private ConsultationRepository consultationRepository;
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final String PYTHON_API_URL = "http://127.0.0.1:8000/api/v1/chat";

    public String processUserMessage(String username, String userMessage, Double weight, Double height) {
        
        // 1. Fetch active session or create a new one for this user
        TriageSession session = sessionRepository.findById(username).orElseGet(() -> {
            TriageSession newSession = new TriageSession();
            newSession.setUsername(username);
            return newSession;
        });

        // 2. Log patient message into temporary memory
        session.getChatLog().add("Patient: " + userMessage);

        // 3. Prepare payload for Python Microservice
        PythonChatRequest request = new PythonChatRequest();
        request.user_message = userMessage;
        request.current_symptoms = session.getCurrentSymptoms();
        request.weight_kg = weight; // From frontend
        request.height_m = height;  // From frontend

        // 4. Make HTTP POST to Python
        PythonChatResponse pythonResponse;
        try {
            pythonResponse = restTemplate.postForObject(PYTHON_API_URL, request, PythonChatResponse.class);
        } catch (Exception e) {
            return "System error: AI Microservice is currently unreachable. Please try again later.";
        }

        if (pythonResponse == null) {
            return "System error: Received empty response from AI.";
        }

        // 5. Update Temporary Memory with AI response
        session.setCurrentSymptoms(pythonResponse.tracked_symptoms);
        session.getChatLog().add("AI: " + pythonResponse.bot_reply);
        
        // 6. IF AI IS CONFIDENT: Freeze data into permanent Consultation record
        if ("ROUTING_COMPLETE".equals(pythonResponse.status)) {
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

        // 7. Save session state to database
        sessionRepository.save(session);

        // 8. Return AI reply to the Controller
        return pythonResponse.bot_reply;
    }

    public void clearSession(String username) {
        if (sessionRepository.existsById(username)) {
            sessionRepository.deleteById(username);
        }
    }
}