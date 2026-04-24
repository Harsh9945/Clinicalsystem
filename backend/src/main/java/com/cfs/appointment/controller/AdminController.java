package com.cfs.appointment.controller;

import com.cfs.appointment.repository.DoctorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private DoctorRepository doctorRepository;

    @PreAuthorize("hasRole('ADMIN')") // Only users with ROLE_ADMIN can hit this
    @PutMapping("/verify-doctor/{id}")
    public String verifyDoctor(@PathVariable Long id) {
        var doctor = doctorRepository.findById(id).orElseThrow();
        doctor.setIsverified(true);
        doctorRepository.save(doctor);
        return "Doctor verified successfully!";
    }
}
