package com.cfs.appointment.controller;

import com.cfs.appointment.dto.UserProfileDTO;
import com.cfs.appointment.entity.Appointment;
import com.cfs.appointment.entity.Doctor;
import com.cfs.appointment.entity.User;
import com.cfs.appointment.repository.DoctorRepository;
import com.cfs.appointment.repository.UserRepository;
import com.cfs.appointment.service.AppointmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
public class DoctorDashboardController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private AppointmentService appointmentService;

    /**
     * Get current doctor profile
     */
    @GetMapping("/profile")
    public UserProfileDTO getProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return new UserProfileDTO(user.getId(), user.getEmail(), user.getFullName(), user.getRole().toString());
    }

    /**
     * Get doctor's detail with specialty
     */
    @GetMapping("/my-details")
    public Doctor getMyDetails() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return doctorRepository.findAll().stream()
                .filter(d -> d.getUser().getId().equals(user.getId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Doctor profile not found"));
    }

    /**
     * Get doctor's appointments
     */
    @GetMapping("/my-appointments")
    public List<Appointment> getMyAppointments() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Doctor doctor = doctorRepository.findAll().stream()
                .filter(d -> d.getUser().getId().equals(user.getId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Doctor profile not found"));

        return appointmentService.getDoctorAppointments(doctor.getId());
    }

    /**
     * Get appointment details
     */
    @GetMapping("/appointments/{id}")
    public Appointment getAppointmentDetails(@PathVariable Long id) {
        return appointmentService.getAppointmentById(id);
    }
}
