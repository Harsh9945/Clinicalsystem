package com.cfs.appointment.repository;

import com.cfs.appointment.entity.Patient;
import com.cfs.appointment.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    boolean existsByUser(User user);
}