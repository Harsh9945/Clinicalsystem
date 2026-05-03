package com.cfs.appointment.repository;

import com.cfs.appointment.entity.Appointment;
import com.cfs.appointment.entity.Doctor;
import com.cfs.appointment.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    boolean existsByDoctorIdAndAppointmentTime(Long doctorId, LocalDateTime appointmentTime);
    boolean existsByDoctorAndAppointmentTime(Doctor doctor, LocalDateTime appointmentTime);
    
    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM Appointment a WHERE a.doctor = :doctor AND a.appointmentTime > :startTime AND a.appointmentTime < :endTime AND a.status IN ('PENDING', 'CONFIRMED')")
    boolean hasOverlappingAppointment(@Param("doctor") Doctor doctor, @Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);
    
    Appointment findTopByPatientAndDoctorOrderByAppointmentTimeDesc(Patient patient, Doctor doctor);
    List<Appointment> findByPatientOrderByAppointmentTimeDesc(Patient patient);
    List<Appointment> findByDoctorOrderByAppointmentTimeDesc(Doctor doctor);
    List<Appointment> findByStatus(String status);
}