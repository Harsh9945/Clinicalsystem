package com.cfs.appointment.repository;

import com.cfs.appointment.entity.Consultation;
import com.cfs.appointment.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConsultationRepository extends JpaRepository<Consultation, Long> {
    Optional<Consultation> findByAppointmentId(Long appointmentId);
    List<Consultation> findByAppointmentPatient(Patient patient);
    List<Consultation> findByPatient(Patient patient);

    @org.springframework.data.jpa.repository.Query("SELECT c FROM Consultation c LEFT JOIN c.appointment a WHERE c.patient = :patient OR a.patient = :patient ORDER BY c.completedAt DESC")
    List<Consultation> findAllByPatientOrAppointmentPatient(@org.springframework.data.repository.query.Param("patient") Patient patient);
}
