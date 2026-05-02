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
    @Autowired
    private EmailService emailService;

    @Autowired
    private FollowUpService followUpService;
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

        // ✅ 1. Check if user already exists
        User existingUser = userRepository.findByEmail(user.getEmail()).orElse(null);

        if (existingUser != null) {

            // If already patient → don't recreate
            if (existingUser.getRole() == Role.PATIENT) {
                return existingUser;
            }

            // If exists but not patient → upgrade role
            existingUser.setRole(Role.PATIENT);
            userRepository.save(existingUser);

            // Check if patient profile exists
            if (!patientRepository.existsByUser(existingUser)) {
                Patient patient = new Patient();
                patient.setUser(existingUser);
                patientRepository.save(patient);
            }

            return existingUser;
        }

        // ✅ 2. New user flow
        user.setPassword(encoder.encode(user.getPassword()));
        user.setRole(Role.PATIENT);

        User savedUser = userRepository.save(user);

        Patient patient = new Patient();
        patient.setUser(savedUser);
        patientRepository.save(patient);

        // ✅ Email
        emailService.sendEmail(
                savedUser.getEmail(),
                "Welcome to Clinical System",
                "Hi " + savedUser.getFullName() + ",\n\n"
                        + "Your patient account has been successfully created.\n"
                        + "You can now book appointments.\n\nThank you!"
        );

        // ✅ Follow-up
        followUpService.createFollowUp(
                savedUser.getEmail(),
                "Hi " + savedUser.getFullName() + ",\n\nStay healthy!",
                java.time.LocalDateTime.now().plusMinutes(1),
                "PATIENT"
        );

        return savedUser;
    }
    @Transactional
    public User registerDoctor(User user, String specialty) {

        User existingUser = userRepository.findByEmail(user.getEmail()).orElse(null);

        if (existingUser != null) {

            if (existingUser.getRole() == Role.DOCTOR) {
                return existingUser;
            }

            existingUser.setRole(Role.DOCTOR);
            userRepository.save(existingUser);

            if (!doctorRepository.existsByUser(existingUser)) {
                Doctor doctor = new Doctor();
                doctor.setUser(existingUser);
                doctor.setSpecialty(specialty);
                doctor.setIsverified(false);
                doctorRepository.save(doctor);
            }

            return existingUser;
        }

        // New user
        user.setPassword(encoder.encode(user.getPassword()));
        user.setRole(Role.DOCTOR);

        User savedUser = userRepository.save(user);

        Doctor doctor = new Doctor();
        doctor.setUser(savedUser);
        doctor.setSpecialty(specialty);
        doctor.setIsverified(false);
        doctorRepository.save(doctor);

        return savedUser;
    }
    @Transactional
    public User registerAdmin(User user){
        user.setRole(Role.ADMIN);
        user.setPassword(encoder.encode(user.getPassword()));
        userRepository.save(user);
        return user;
    }
}