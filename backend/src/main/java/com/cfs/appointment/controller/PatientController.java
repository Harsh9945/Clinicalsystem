package com.cfs.appointment.controller;

import com.cfs.appointment.dto.UserProfileDTO;
import com.cfs.appointment.entity.Appointment;
import com.cfs.appointment.entity.Consultation;
import com.cfs.appointment.entity.Patient;
import com.cfs.appointment.entity.User;
import com.cfs.appointment.repository.ConsultationRepository;
import com.cfs.appointment.repository.PatientRepository;
import com.cfs.appointment.repository.UserRepository;
import com.cfs.appointment.service.AppointmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private ConsultationRepository consultationRepository;

    /**
     * Get current patient profile
     */
    @GetMapping("/profile")
    public UserProfileDTO getProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return new UserProfileDTO(user.getId(), user.getEmail(), user.getFullName(), user.getRole().toString());
    }

    /**
     * Get patient's appointments
     */
    @GetMapping("/my-appointments")
    public List<Appointment> getMyAppointments() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Patient patient = patientRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Patient profile not found"));

        return appointmentService.getPatientAppointments(patient.getId());
    }

    /**
     * Get patient's consultation history
     */
    @GetMapping("/my-consultations")
    public List<Consultation> getMyConsultations() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Patient patient = patientRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Patient profile not found"));

        return consultationRepository.findByAppointmentPatient(patient);
    }

    /**
     * Cancel an appointment
     */
    @PutMapping("/appointments/{id}/cancel")
    public String cancelAppointment(@PathVariable Long id) {
        appointmentService.cancelAppointment(id);
        return "Appointment cancelled successfully!";
    }
}
