package com.cfs.appointment.controller;

import com.cfs.appointment.service.FollowUpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/followup")
public class FollowUpController {

    @Autowired
    private FollowUpService followUpService;

    @PostMapping("/schedule")
    public String scheduleFollowUp(@RequestBody Map<String, Object> payload) {
        String email = (String) payload.get("email");
        String message = (String) payload.get("message");
        String type = (String) payload.get("type");
        
        // Default to 7 days from now if not specified, else parse from payload
        LocalDateTime time = LocalDateTime.now().plusDays(7);
        if (payload.containsKey("days")) {
            int days = Integer.parseInt(payload.get("days").toString());
            time = LocalDateTime.now().plusDays(days);
        }

        followUpService.createFollowUp(email, message, time, type);
        
        return "Follow-up scheduled successfully!";
    }
}
