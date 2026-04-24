package com.cfs.appointment.service;

import com.cfs.appointment.entity.Doctor;
import com.cfs.appointment.entity.Patient;
import com.cfs.appointment.entity.Role;
import com.cfs.appointment.entity.User;
import com.cfs.appointment.repository.DoctorRepository;
import com.cfs.appointment.repository.PatientRepository;
import com.cfs.appointment.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

@Service
public class UserService implements UserDetailsService {

    @Autowired private UserRepository userRepository;
    @Autowired private PatientRepository patientRepository;
    @Autowired private DoctorRepository doctorRepository;

    // We use this to scramble passwords so they are safe in MySQL
    @Autowired
    private PasswordEncoder encoder;
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // Map your User entity to Spring Security's UserDetails
        // We add "ROLE_" prefix so hasRole('ADMIN') works correctly in controllers
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
    }

    @Transactional
    public User registerPatient(User user) {
        // 1. Scramble the password
        user.setPassword(encoder.encode(user.getPassword()));

        // 2. Set the Role (Make sure this matches your User entity's role field type)
        user.setRole(Role.PATIENT);

        // 3. Save the User and capture the returned object
        User savedUser = userRepository.save(user);

        // 4. Create the Patient profile linked to the saved user
        Patient patient = new Patient();
        patient.setUser(savedUser);
        patientRepository.save(patient);

        return savedUser;
    }

    @Transactional
    public User registerDoctor(User user, String specialty) {
        user.setPassword(encoder.encode(user.getPassword()));
        user.setRole(Role.DOCTOR);
        User savedUser = userRepository.save(user);

        Doctor doctor = new Doctor();
        doctor.setUser(savedUser);
        doctor.setSpecialty(specialty);
        doctor.setIsverified(false); // Admin must verify later
        doctorRepository.save(doctor);

        return savedUser;
    }
}