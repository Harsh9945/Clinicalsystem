package com.cfs.appointment.repository;


import com.cfs.appointment.entity.Doctor;
import com.cfs.appointment.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    // JpaRepository<EntityName, ID_Type>
    // This gives you: save(), findById(), findAll(), delete() automatically!
    boolean existsByUser(User user);
}
