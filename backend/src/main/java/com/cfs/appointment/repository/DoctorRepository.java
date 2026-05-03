package com.cfs.appointment.repository;


import com.cfs.appointment.entity.Doctor;
import com.cfs.appointment.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    // JpaRepository<EntityName, ID_Type>
    // This gives you: save(), findById(), findAll(), delete() automatically!
    boolean existsByUser(User user);
    @org.springframework.data.jpa.repository.Query("SELECT d FROM Doctor d WHERE d.isverified = false OR d.isverified IS NULL")
    List<Doctor> findPendingDoctors();

    @org.springframework.data.jpa.repository.Query("SELECT count(d) FROM Doctor d WHERE d.isverified = false OR d.isverified IS NULL")
    long countPendingDoctors();
}
