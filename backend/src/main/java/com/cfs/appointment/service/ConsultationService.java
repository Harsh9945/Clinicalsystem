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
}