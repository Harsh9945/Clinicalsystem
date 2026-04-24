package com.cfs.appointment.controller;

import com.cfs.appointment.entity.Doctor;
import com.cfs.appointment.service.DoctorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {
    @Autowired
    private DoctorService doctorService;

    @GetMapping("/verified")
    public List<Doctor> getVerifiedDoctors() {
        // Only return verified doctors for patient selection
        return doctorService.getVerifiedDoctors();
    }
}