package com.cfs.appointment.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class AIService {

    private final WebClient webClient;
    @Value("${gemini.api.key}")
    private String apiKey;
    public AIService(WebClient.Builder builder,
                     @Value("${gemini.api.key}") String apiKey) {

        this.webClient = builder
                .baseUrl("https://generativelanguage.googleapis.com/v1")
                .build();

        this.apiKey = apiKey;
    }

    public String generateSummary(String symptoms) {

        String requestBody = """
        {
          "contents": [{
            "parts": [{
              "text": "Patient symptoms: %s. Give a simple medical summary in 3-4 lines."
            }]
          }]
        }
        """.formatted(symptoms);

        try {
            String response = webClient.post()
                    .uri("/models/gemini-2.0-flash:generateContent?key=" + apiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .onStatus(
                            status -> status.isError(),
                            clientResponse -> clientResponse.bodyToMono(String.class)
                                    .map(error -> new RuntimeException("API ERROR: " + error))
                    )
                    .bodyToMono(String.class)
                    .block();

            System.out.println("RAW RESPONSE = " + response);

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response);

            return root.path("candidates")
                    .get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text")
                    .asText();

        } catch (Exception e) {
            e.printStackTrace();
            return "AI failed: " + e.getMessage();
        }
    }
}