package com.cfs.appointment.service;

import com.cfs.appointment.entity.Doctor;
import com.cfs.appointment.repository.DoctorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DoctorService {

    @Autowired // This "injects" the repository so we can use it
    private DoctorRepository doctorRepository;

    public List<Doctor> getAllDoctors() {
        return doctorRepository.findAll();
    }

    public Doctor saveDoctor(Doctor doctor) {
        return doctorRepository.save(doctor);
    }
    public void verifyDoctor(Long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found with ID: " + doctorId));

        doctor.setIsverified(true);
        doctorRepository.save(doctor);
    }

    // Also add this to help Patients only see verified doctors
    public List<Doctor> getVerifiedDoctors() {
        return doctorRepository.findAll().stream()
                .filter(doctor -> doctor.isIsverified()) // Explicit lambda check
                .toList();
    }
}