package com.cfs.appointment.controller;

import com.cfs.appointment.dto.AIConsultationRequest;
import com.cfs.appointment.entity.Consultation;
import com.cfs.appointment.service.ConsultationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/consultation")
public class ConsultationController {

    @Autowired
    private ConsultationService consultationService;


    @PostMapping("/ai/appointment/{appointmentId}")
    public Consultation generateAIFromAppointment(
            @PathVariable Long appointmentId,
            @Valid @RequestBody AIConsultationRequest request) {

        return consultationService.generateAIFromAppointment(
                appointmentId,
                request.getSymptoms()
        );
    }
}