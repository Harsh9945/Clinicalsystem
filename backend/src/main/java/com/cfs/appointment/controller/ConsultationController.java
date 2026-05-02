package com.cfs.appointment.controller;

import com.cfs.appointment.entity.Consultation;
import com.cfs.appointment.repository.ConsultationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/consultations")
public class ConsultationController {

    @Autowired
    private ConsultationRepository consultationRepository;

    /**
     * Endpoint for the Doctor's Dashboard to view ALL completed Triage Reports
     */
    @GetMapping("/all")
    public List<Consultation> getAllConsultations() {
        // In a real app, you might want to sort these by date (newest first)
        return consultationRepository.findAll();
    }

    /**
     * Endpoint for the Doctor to click on a specific patient's report
     */
    @GetMapping("/{id}")
    public Consultation getConsultationById(@PathVariable Long id) {
        return consultationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Consultation record not found with id: " + id));
    }

    @PostMapping("/{id}/clinical-notes")
    public Consultation addClinicalNotes(@PathVariable Long id, @RequestBody java.util.Map<String, String> payload) {
        Consultation consultation = consultationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Consultation record not found with id: " + id));
        
        if (payload.containsKey("doctorNotes")) {
            consultation.setDoctorNotes(payload.get("doctorNotes"));
        }
        if (payload.containsKey("ePrescription")) {
            consultation.setEPrescription(payload.get("ePrescription"));
        }
        
        return consultationRepository.save(consultation);
    }
}