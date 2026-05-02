package com.cfs.appointment.repository;

import com.cfs.appointment.entity.Appointment;
import com.cfs.appointment.entity.Doctor;
import com.cfs.appointment.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    boolean existsByDoctorIdAndAppointmentTime(Long doctorId, LocalDateTime appointmentTime);
    boolean existsByDoctorAndAppointmentTime(Doctor doctor, LocalDateTime appointmentTime);
    Appointment findTopByPatientAndDoctorOrderByAppointmentTimeDesc(Patient patient, Doctor doctor);
    List<Appointment> findByPatientOrderByAppointmentTimeDesc(Patient patient);
    List<Appointment> findByDoctorOrderByAppointmentTimeDesc(Doctor doctor);
    List<Appointment> findByStatus(String status);
}