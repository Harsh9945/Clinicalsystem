package com.cfs.appointment.repository;

import com.cfs.appointment.entity.Appointment;
import com.cfs.appointment.entity.Doctor;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    boolean existsByDoctorIdAndAppointmentTime(Long doctorId, LocalDateTime appointmentTime);
    boolean existsByDoctorAndAppointmentTime(Doctor doctor, LocalDateTime appointmentTime);
}