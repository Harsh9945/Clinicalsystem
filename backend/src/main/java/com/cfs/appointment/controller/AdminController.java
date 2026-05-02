package com.cfs.appointment.controller;

import com.cfs.appointment.dto.DashboardStatsDTO;
import com.cfs.appointment.entity.Doctor;
import com.cfs.appointment.repository.AppointmentRepository;
import com.cfs.appointment.repository.ConsultationRepository;
import com.cfs.appointment.repository.DoctorRepository;
import com.cfs.appointment.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.cfs.appointment.dto.AdminBookingRequest;
import com.cfs.appointment.dto.AppointmentDTO;
import com.cfs.appointment.entity.Appointment;
import com.cfs.appointment.entity.Patient;
import com.cfs.appointment.entity.User;
import com.cfs.appointment.repository.PatientRepository;
import com.cfs.appointment.service.AppointmentService;
import com.cfs.appointment.service.UserService;
import org.springframework.http.ResponseEntity;
import java.util.stream.Collectors;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private ConsultationRepository consultationRepository;

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private UserService userService;

    @Autowired
    private PatientRepository patientRepository;

    @PreAuthorize("hasRole('ADMIN')") // Only users with ROLE_ADMIN can hit this
    @PutMapping("/verify-doctor/{id}")
    public String verifyDoctor(@PathVariable Long id) {
        var doctor = doctorRepository.findById(id).orElseThrow();
        doctor.setIsverified(true);
        doctorRepository.save(doctor);
        return "Doctor verified successfully!";
    }

    /**
     * Get all unverified doctors (pending approval)
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/pending-doctors")
    public List<Doctor> getPendingDoctors() {
        return doctorRepository.findPendingDoctors();
    }

    /**
     * Get dashboard statistics
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/dashboard-stats")
    public DashboardStatsDTO getDashboardStats() {
        long totalDoctors = doctorRepository.count();
        long totalPatients = userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && u.getRole().toString().equals("PATIENT"))
                .count();
        long totalAppointments = appointmentRepository.count();
        long pendingDoctors = doctorRepository.findPendingDoctors().size();
        long completedConsultations = consultationRepository.count();

        return new DashboardStatsDTO(totalDoctors, totalPatients, totalAppointments, pendingDoctors, completedConsultations);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/doctors")
    public List<Doctor> getAllVerifiedDoctors() {
        return doctorRepository.findAll().stream()
                .filter(d -> Boolean.TRUE.equals(d.getIsverified()))
                .collect(Collectors.toList());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/doctors/{doctorId}/appointments")
    public List<Appointment> getDoctorAppointments(@PathVariable Long doctorId) {
        return appointmentService.getDoctorAppointments(doctorId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/book-appointment")
    public ResponseEntity<?> bookAppointmentOnBehalf(@RequestBody AdminBookingRequest request) {
        try {
            // Find or create patient
            User user = userRepository.findByEmail(request.getPatientEmail()).orElseGet(() -> {
                User newUser = new User();
                newUser.setEmail(request.getPatientEmail());
                newUser.setFullName(request.getPatientName());
                newUser.setPassword("Welcome123!");
                return userService.registerPatient(newUser);
            });

            Patient patient = patientRepository.findByUser(user)
                    .orElseThrow(() -> new RuntimeException("Patient profile not found for user"));

            AppointmentDTO dto = new AppointmentDTO();
            dto.setDoctorid(request.getDoctorId());
            dto.setPatientid(patient.getId());
            dto.setAppointmentTime(request.getAppointmentTime());

            Appointment appointment = appointmentService.bookAppointment(dto);
            return ResponseEntity.ok("Appointment booked successfully on behalf of " + user.getFullName());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
