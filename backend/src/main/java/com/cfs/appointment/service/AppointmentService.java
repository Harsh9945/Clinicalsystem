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

    public Appointment bookAppointment(AppointmentDTO dto) {

        // 🔹 Fetch doctor
        Doctor doctor = doctorRepository.findById(dto.getDoctorid())
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        // 🔹 Fetch patient
        Patient patient = patientRepository.findById(dto.getPatientid())
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        // 🔥 CHECK SLOT AVAILABILITY
        boolean exists = appointmentRepository
                .existsByDoctorAndAppointmentTime(doctor, dto.getAppointmentTime());

        if (exists) {
            throw new RuntimeException("Slot already booked!");
        }

        // 🔥 CREATE APPOINTMENT (NO FOLLOW-UP FLAG NEEDED)
        Appointment appointment = new Appointment();
        appointment.setDoctor(doctor);
        appointment.setPatient(patient);
        appointment.setAppointmentTime(dto.getAppointmentTime());
        appointment.setStatus("CONFIRMED");

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

        return saved;
    }
}