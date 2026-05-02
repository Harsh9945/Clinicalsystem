package com.cfs.appointment.controller;

import com.cfs.appointment.service.ChatbotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/frontend-chat")
public class ChatController {

    @Autowired
    private ChatbotService chatbotService;

    @PostMapping("/send")
    public Map<String, String> sendMessage(@RequestBody Map<String, Object> payload) {
        
        // 1. Extract secure username from JWT
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String loggedInUsername = authentication.getName(); 

        // 2. Extract message from frontend
        String message = (String) payload.get("message");
        
        // 3. Safely extract manual vitals (if provided by frontend popup)
        Double weight = null;
        Double height = null;
        
        try {
            if (payload.containsKey("weight") && payload.get("weight") != null) {
                weight = Double.valueOf(payload.get("weight").toString());
            }
            if (payload.containsKey("height") && payload.get("height") != null) {
                height = Double.valueOf(payload.get("height").toString());
            }
        } catch (NumberFormatException e) {
            System.out.println("Warning: Frontend sent invalid numbers for vitals.");
        }

        // 4. Pass to orchestrator service
        String aiReply = chatbotService.processUserMessage(
            loggedInUsername, 
            message,
            weight,
            height
        );

        // 5. Return reply to the UI
        return Map.of("reply", aiReply);
    }

    @DeleteMapping("/session")
    public Map<String, String> clearSession() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String loggedInUsername = authentication.getName(); 
        
        chatbotService.clearSession(loggedInUsername);
        
        return Map.of("status", "cleared", "message", "New triage session started.");
    }
}