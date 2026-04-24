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

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PatientRepository patientRepository;

    public Appointment bookAppointment(AppointmentDTO dto) {
        // 1. Look up the objects using the IDs
        Doctor doctor = doctorRepository.findById(dto.getDoctorid())
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        Patient patient = patientRepository.findById(dto.getPatientid())
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        // 2. Create the Appointment
        Appointment appointment = new Appointment();
        appointment.setDoctor(doctor);
        appointment.setPatient(patient);
        appointment.setAppointmentTime(dto.getAppointmentTime());
        appointment.setStatus("CONFIRMED");

        return appointmentRepository.save(appointment);
    }
}