package com.cfs.appointment.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import java.util.Map;

@Service
public class EmailService {

    @Value("${resend.api.key:}")
    private String resendApiKey;

    @Value("${resend.from:Clinova Health <onboarding@resend.dev>}")
    private String senderEmail;

    private final RestTemplate restTemplate = new RestTemplate();

    @Async
    public void sendEmail(String to, String subject, String body) {
        System.out.println("📩 Attempting to send Resend API email to: " + to + " with subject: " + subject);
        
        if (resendApiKey == null || resendApiKey.trim().isEmpty()) {
            System.err.println("❌ Resend API Key is not configured (RESEND_API_KEY). Email sending skipped.");
            return;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(resendApiKey);

            Map<String, Object> payload = new HashMap<>();
            payload.put("from", senderEmail);
            payload.put("to", new String[]{to});
            payload.put("subject", subject);
            payload.put("text", body);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            String response = restTemplate.postForObject("https://api.resend.com/emails", request, String.class);

            System.out.println("✅ Email sent successfully via Resend. Response: " + response);
        } catch (Exception e) {
            System.err.println("❌ CRITICAL: Failed to send Clinova email via Resend to [" + to + "]");
            System.err.println("Reason: " + e.getMessage());
        }
    }
}