package com.cfs.appointment.service;

import com.cfs.appointment.dto.PythonChatRequest;
import com.cfs.appointment.dto.PythonChatResponse;
import com.cfs.appointment.entity.Consultation;
import com.cfs.appointment.entity.TriageSession;
import com.cfs.appointment.repository.ConsultationRepository;
import com.cfs.appointment.repository.TriageSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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

    @Autowired
    private com.cfs.appointment.repository.UserRepository userRepository;

    @Autowired
    private com.cfs.appointment.repository.PatientRepository patientRepository;
    
    private final RestTemplate restTemplate;

    public ChatbotService() {
        // Add a timeout so it doesn't hang the whole backend
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000); // 5 seconds
        factory.setReadTimeout(30000);    // 30 seconds (AI can be slow under load)
        this.restTemplate = new RestTemplate(factory);
    }

    @Value("${python.api.url:http://127.0.0.1:8000/api/v1/chat}")
    private String PYTHON_API_URL;

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
        request.denied_symptoms = session.getDeniedSymptoms();
        request.weight_kg = weight; 
        request.height_m = height;  
        request.chat_history = session.getChatLog();

        // Normalize the Python API URL to ensure it has the correct endpoint path
        String resolvedUrl = PYTHON_API_URL;
        if (resolvedUrl != null) {
            resolvedUrl = resolvedUrl.trim();
            if (!resolvedUrl.endsWith("/api/v1/chat")) {
                if (resolvedUrl.endsWith("/")) {
                    resolvedUrl = resolvedUrl + "api/v1/chat";
                } else {
                    resolvedUrl = resolvedUrl + "/api/v1/chat";
                }
            }
        } else {
            resolvedUrl = "http://127.0.0.1:8000/api/v1/chat";
        }

        System.out.println("🔗 Calling AI Service at: " + resolvedUrl);
        
        PythonChatResponse pythonResponse;
        try {
            pythonResponse = restTemplate.postForObject(resolvedUrl, request, PythonChatResponse.class);
            System.out.println("✅ AI Response received. Status: " + (pythonResponse != null ? pythonResponse.status : "NULL"));
        } catch (Exception e) {
            System.err.println("❌ AI Service Error: " + e.getMessage());
            return "I am currently having trouble connecting to my diagnostic engine. To support you right away, please consult a General Physician or book an appointment with our clinical staff directly. You can also try resetting this chat or trying again in a few moments.";
        }

        if (pythonResponse == null) {
            return "System error: Received empty response from AI.";
        }

        session.setCurrentSymptoms(pythonResponse.tracked_symptoms);
        if (pythonResponse.denied_symptoms != null) {
            session.setDeniedSymptoms(pythonResponse.denied_symptoms);
        }
        session.getChatLog().add("AI: " + pythonResponse.bot_reply);
        
        if ("TRIAGE_COMPLETE".equals(pythonResponse.status)) {
            System.out.println("🏥 Triage Complete. Saving Consultation report.");
            session.setStatus("ROUTED");
            
            Consultation finalConsultation = new Consultation();
            
            // Link directly to patient
            try {
                com.cfs.appointment.entity.User user = userRepository.findByEmail(username).orElse(null);
                if (user != null) {
                    com.cfs.appointment.entity.Patient patient = patientRepository.findByUser(user).orElse(null);
                    finalConsultation.setPatient(patient);
                }
            } catch (Exception e) {
                System.err.println("⚠️ Error linking patient to AI consultation: " + e.getMessage());
            }

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