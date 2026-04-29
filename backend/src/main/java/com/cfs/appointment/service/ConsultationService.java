package com.cfs.appointment.service;

import com.cfs.appointment.entity.Appointment;
import com.cfs.appointment.entity.Consultation;
import com.cfs.appointment.repository.AppointmentRepository;
import com.cfs.appointment.repository.ConsultationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ConsultationService {

    @Autowired private ConsultationRepository consultationRepository;
    @Autowired private AppointmentRepository appointmentRepository;
    @Autowired
    private AIService aiService;
    public Consultation createConsultation(Long appointmentId) {
        // 1. Find the appointment
        Appointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // 2. Create a new Consultation linked to it
        Consultation consultation = new Consultation();
        consultation.setAppointment(appt);

        return consultationRepository.save(consultation);
    }

    // This is the method your AI will eventually call!
    public Consultation updateAIReport(Long consultationId, String summary, String diet) {
        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new RuntimeException("Consultation not found"));

        consultation.setAiReportSummary(summary);
        consultation.setDietRecommendations(diet);

        return consultationRepository.save(consultation);
    }
    public Consultation generateAIConsultation(Long consultationId, String symptoms) {

        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new RuntimeException("Consultation not found"));

        // Save symptoms
        consultation.setPatientSymptoms(symptoms);

        // Call AI safely
        String summary;
        try {
            summary = aiService.generateSummary(symptoms);
        } catch (Exception e) {
            summary = "AI service unavailable. Please try again later.";
        }

        consultation.setAiReportSummary(summary);

        return consultationRepository.save(consultation);
    }
    public Consultation generateAIFromAppointment(Long appointmentId, String symptoms) {

        // 1. Get appointment
        Appointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // 2. Create consultation
        Consultation consultation = consultationRepository
                .findByAppointmentId(appointmentId)
                .orElseGet(() -> {
                    Consultation newConsultation = new Consultation();
                    newConsultation.setAppointment(appt);
                    return newConsultation;
                });
        consultation.setPatientSymptoms(symptoms);

        // 3. Call AI
        String summary;
        try {
            summary = aiService.generateSummary(symptoms);
        } catch (Exception e) {
            summary = "AI service unavailable";
        }

        // 4. Save result
        consultation.setAiReportSummary(summary);

        return consultationRepository.save(consultation);
    }
}