package com.cfs.appointment.controller;

import com.cfs.appointment.entity.Doctor;
import com.cfs.appointment.entity.DoctorAvailability;
import com.cfs.appointment.entity.User;
import com.cfs.appointment.repository.DoctorAvailabilityRepository;
import com.cfs.appointment.repository.DoctorRepository;
import com.cfs.appointment.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import lombok.Data;

import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/availability")
public class AvailabilityController {

    @Autowired
    private DoctorAvailabilityRepository availabilityRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Helper to get currently authenticated user details
     */
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    /**
     * Helper to get doctor profile for currently authenticated user
     */
    private Doctor getCurrentDoctor(User user) {
        return doctorRepository.findAll().stream()
                .filter(d -> d.getUser().getId().equals(user.getId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Doctor profile not found"));
    }

    /**
     * Fetch availability slots for a doctor by ID (used by patients & admin)
     */
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<DoctorAvailability>> getDoctorAvailability(@PathVariable Long doctorId) {
        List<DoctorAvailability> slots = availabilityRepository.findByDoctorId(doctorId);
        return ResponseEntity.ok(slots);
    }

    /**
     * Fetch availability slots for currently logged-in doctor
     */
    @GetMapping("/mine")
    public ResponseEntity<List<DoctorAvailability>> getMyAvailability() {
        User user = getCurrentUser();
        if (!"DOCTOR".equalsIgnoreCase(user.getRole().name())) {
            return ResponseEntity.badRequest().body(null);
        }
        Doctor doctor = getCurrentDoctor(user);
        List<DoctorAvailability> slots = availabilityRepository.findByDoctor(doctor);
        return ResponseEntity.ok(slots);
    }

    /**
     * Add a new availability slot
     */
    @PostMapping
    public ResponseEntity<?> addAvailability(@RequestBody AvailabilityRequest request) {
        try {
            User user = getCurrentUser();
            Doctor doctor;

            if ("DOCTOR".equalsIgnoreCase(user.getRole().name())) {
                doctor = getCurrentDoctor(user);
            } else if ("ADMIN".equalsIgnoreCase(user.getRole().name())) {
                if (request.getDoctorId() == null) {
                    return ResponseEntity.badRequest().body("Doctor ID is required for administrative scheduling.");
                }
                doctor = doctorRepository.findById(request.getDoctorId())
                        .orElseThrow(() -> new RuntimeException("Doctor not found"));
            } else {
                return ResponseEntity.status(403).body("Access denied. Only doctors and admins can add schedules.");
            }

            LocalTime start = LocalTime.parse(request.getStartTime());
            LocalTime end = LocalTime.parse(request.getEndTime());

            if (!start.isBefore(end)) {
                return ResponseEntity.badRequest().body("Start time must be before end time.");
            }

            DoctorAvailability slot = new DoctorAvailability();
            slot.setDoctor(doctor);
            slot.setDayOfWeek(request.getDayOfWeek().toUpperCase());
            slot.setStartTime(start);
            slot.setEndTime(end);

            DoctorAvailability saved = availabilityRepository.save(slot);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Delete an availability slot
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAvailability(@PathVariable Long id) {
        try {
            User user = getCurrentUser();
            DoctorAvailability slot = availabilityRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Availability slot not found"));

            if ("DOCTOR".equalsIgnoreCase(user.getRole().name())) {
                Doctor doctor = getCurrentDoctor(user);
                if (!slot.getDoctor().getId().equals(doctor.getId())) {
                    return ResponseEntity.status(403).body("You can only delete your own availability slots.");
                }
            } else if (!"ADMIN".equalsIgnoreCase(user.getRole().name())) {
                return ResponseEntity.status(403).body("Access denied.");
            }

            availabilityRepository.delete(slot);
            return ResponseEntity.ok("Availability slot deleted successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * DTO for request mapping
     */
    @Data
    public static class AvailabilityRequest {
        private Long doctorId;
        private String dayOfWeek;
        private String startTime;
        private String endTime;
    }
}
