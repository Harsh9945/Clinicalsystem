package com.cfs.appointment.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Service
public class EmailService {

    @Value("${brevo.api.key:}")
    private String brevoApiKey;

    @Value("${brevo.from.email:hj7338484@gmail.com}")
    private String senderEmail;

    private final RestTemplate restTemplate = new RestTemplate();

    @Async
    public void sendEmail(String to, String subject, String body) {
        System.out.println("📩 Attempting to send Brevo API email to: " + to + " with subject: " + subject);
        
        if (brevoApiKey == null || brevoApiKey.trim().isEmpty()) {
            System.err.println("❌ Brevo API Key is not configured (BREVO_API_KEY). Email sending skipped.");
            return;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", brevoApiKey);

            // Sender Details
            Map<String, String> sender = new HashMap<>();
            sender.put("name", "Clinova Health");
            sender.put("email", senderEmail);

            // Recipient Details
            Map<String, String> recipient = new HashMap<>();
            recipient.put("email", to);

            // Complete Payload
            Map<String, Object> payload = new HashMap<>();
            payload.put("sender", sender);
            payload.put("to", Collections.singletonList(recipient));
            payload.put("subject", subject);
            payload.put("textContent", body);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            String response = restTemplate.postForObject("https://api.brevo.com/v3/smtp/email", request, String.class);

            System.out.println("✅ Email sent successfully via Brevo. Response: " + response);
        } catch (Exception e) {
            System.err.println("❌ CRITICAL: Failed to send Clinova email via Brevo to [" + to + "]");
            System.err.println("Reason: " + e.getMessage());
        }
    }
}