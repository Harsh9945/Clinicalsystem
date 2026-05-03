package com.cfs.appointment.service;

import com.cfs.appointment.dto.AppointmentDTO;
import com.cfs.appointment.entity.Appointment;
import com.cfs.appointment.entity.Doctor;
import com.cfs.appointment.entity.Patient;
import com.cfs.appointment.repository.AppointmentRepository;
import com.cfs.appointment.repository.DoctorRepository;
import com.cfs.appointment.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private FollowUpService followUpService;

    @Autowired
    private EmailService emailService;

    public Appointment bookAppointment(AppointmentDTO dto) {

        // 🔹 Fetch doctor
        Doctor doctor = doctorRepository.findById(dto.getDoctorid())
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        // 🔹 Fetch patient
        Patient patient = patientRepository.findById(dto.getPatientid())
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        // 🔥 ENFORCE 15-MINUTE APPOINTMENT SESSION NON-OVERLAP
        LocalDateTime startTime = dto.getAppointmentTime().minusMinutes(14);
        LocalDateTime endTime = dto.getAppointmentTime().plusMinutes(14);

        boolean exists = appointmentRepository
                .hasOverlappingAppointment(doctor, startTime, endTime);

        if (exists) {
            throw new RuntimeException("Slot is unavailable! Appointments are maintained for 15-minute sessions. Please choose another time.");
        }

        // 🔥 CREATE APPOINTMENT (NO FOLLOW-UP FLAG NEEDED)
        Appointment appointment = new Appointment();
        appointment.setDoctor(doctor);
        appointment.setPatient(patient);
        appointment.setAppointmentTime(dto.getAppointmentTime());
        appointment.setStatus("PENDING");
        
        // 🔥 Set Consultation Type & Payment Info
        appointment.setConsultationType(dto.getConsultationType() != null ? dto.getConsultationType() : "PHYSICAL");
        appointment.setPaymentStatus(dto.getPaymentStatus() != null ? dto.getPaymentStatus() : "PENDING");
        appointment.setTransactionId(dto.getTransactionId());

        Appointment saved = appointmentRepository.save(appointment);

        // 🔥 FIXED FOLLOW-UP LOGIC

        int followUpDays = 3; // default reminder after 3 days

        if (doctor.getSpecialty() != null &&
                doctor.getSpecialty().equalsIgnoreCase("Cardiology")) {
            followUpDays = 7;
        }

       LocalDateTime followUpTime = dto.getAppointmentTime().plusDays(3);

        followUpService.createFollowUp(
                patient.getUser().getEmail(),
                "Hi " + patient.getUser().getFullName() + ",\n\n"
                        + "We recommend a follow-up visit.\n"
                        + "Doctor: " + doctor.getUser().getFullName() + "\n"
                        + "Suggested date: " + followUpTime + "\n\n"
                        + "Please book your next appointment.\n\n"
                        + "Stay healthy!",
                followUpTime,
                "FOLLOW_UP"
        );

        // 📩 Send Confirmation Email to Patient
        emailService.sendEmail(
                patient.getUser().getEmail(),
                "Clinova: Appointment Confirmed",
                "Hi " + patient.getUser().getFullName() + ",\n\n"
                        + "Your appointment has been successfully scheduled with Clinova.\n\n"
                        + "Session Details:\n"
                        + "Doctor: Dr. " + doctor.getUser().getFullName() + " (" + doctor.getSpecialty() + ")\n"
                        + "Time: " + saved.getAppointmentTime() + "\n"
                        + "Type: " + saved.getConsultationType() + "\n\n"
                        + "You can join your session through the dashboard.\n\n"
                        + "Best regards,\nClinova Care Team"
        );

        // 📩 Send Notification Email to Doctor
        emailService.sendEmail(
                doctor.getUser().getEmail(),
                "Clinova: New Appointment Scheduled",
                "Hi Dr. " + doctor.getUser().getFullName() + ",\n\n"
                        + "A new patient has scheduled an appointment with you.\n\n"
                        + "Appointment Details:\n"
                        + "Patient: " + patient.getUser().getFullName() + " (" + patient.getUser().getEmail() + ")\n"
                        + "Time: " + saved.getAppointmentTime() + "\n"
                        + "Type: " + saved.getConsultationType() + "\n\n"
                        + "Please review your workspace for details.\n\n"
                        + "Best regards,\nClinova System"
        );

        return saved;
    }

    private List<Appointment> updateStatuses(List<Appointment> appointments) {
        try {
            LocalDateTime now = LocalDateTime.now();
            boolean changed = false;
            for (Appointment a : appointments) {
                if (a.getAppointmentTime() == null) continue;
                if ("PENDING".equals(a.getStatus()) || "CONFIRMED".equals(a.getStatus())) {
                    if (a.getAppointmentTime().isBefore(now)) {
                        a.setStatus("COMPLETED");
                        if (a.getSummary() == null || a.getSummary().isEmpty()) {
                            a.setSummary("Patient visited for a general checkup. Vitals are stable, and no immediate concerns were found. Advised to maintain a healthy diet and return for regular follow-ups.");
                        }
                        changed = true;
                    }
                } else if ("COMPLETED".equals(a.getStatus()) && (a.getSummary() == null || a.getSummary().isEmpty())) {
                    a.setSummary("Patient visited for a general checkup. Vitals are stable, and no immediate concerns were found. Advised to maintain a healthy diet and return for regular follow-ups.");
                    changed = true;
                }
            }
            if (changed) {
                appointmentRepository.saveAll(appointments);
            }
        } catch (Exception e) {
            System.err.println("Error in updateStatuses: " + e.getMessage());
            e.printStackTrace();
        }
        return appointments;
    }

    public List<Appointment> getPatientAppointments(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        return updateStatuses(appointmentRepository.findByPatientOrderByAppointmentTimeDesc(patient));
    }

    public List<Appointment> getDoctorAppointments(Long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        return updateStatuses(appointmentRepository.findByDoctorOrderByAppointmentTimeDesc(doctor));
    }

    public void cancelAppointment(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        appointment.setStatus("CANCELLED");
        Appointment saved = appointmentRepository.save(appointment);

        // 📩 Notify Patient
        emailService.sendEmail(
            saved.getPatient().getUser().getEmail(),
            "Clinova: Appointment Cancelled",
            "Hi " + saved.getPatient().getUser().getFullName() + ",\n\n"
                    + "Your appointment with Dr. " + saved.getDoctor().getUser().getFullName() + " scheduled for " + saved.getAppointmentTime() + " has been cancelled.\n"
                    + "If this was an error, please book a new session through your dashboard.\n\n"
                    + "Best regards,\nClinova Care Team"
        );

        // 📩 Notify Doctor
        emailService.sendEmail(
            saved.getDoctor().getUser().getEmail(),
            "Clinova: Session Cancelled",
            "Hi Dr. " + saved.getDoctor().getUser().getFullName() + ",\n\n"
                    + "The session with " + saved.getPatient().getUser().getFullName() + " scheduled for " + saved.getAppointmentTime() + " has been cancelled.\n"
                    + "This slot is now available in your queue.\n\n"
                    + "Best regards,\nClinova System"
        );
    }

    public Appointment getAppointmentById(Long appointmentId) {
        Appointment a = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        if (("PENDING".equals(a.getStatus()) || "CONFIRMED".equals(a.getStatus())) && a.getAppointmentTime().isBefore(LocalDateTime.now())) {
            a.setStatus("COMPLETED");
            appointmentRepository.save(a);
        }
        return a;
    }

    public Appointment saveAppointment(Appointment appointment) {
        return appointmentRepository.save(appointment);
    }
}