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

            // If already patient → don't recreate but send reminder email
            if (existingUser.getRole() == Role.PATIENT) {
                emailService.sendEmail(
                    existingUser.getEmail(),
                    "Clinova: Account Access",
                    "Hi " + existingUser.getFullName() + ",\n\n"
                            + "You already have a Clinova account. You can sign in using your existing credentials.\n"
                            + "If you forgot your password, please contact support.\n\n"
                            + "Stay healthy!\nClinova Team"
                );
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

            emailService.sendEmail(
                existingUser.getEmail(),
                "Clinova: Welcome Patient",
                "Hi " + existingUser.getFullName() + ",\n\n"
                        + "Your account has been updated to a Patient profile.\n"
                        + "You can now book appointments and access our triage AI.\n\n"
                        + "Best regards,\nClinova Care Team"
            );

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
                "Welcome to Clinova",
                "Hi " + savedUser.getFullName() + ",\n\n"
                        + "Your Clinova patient account has been successfully created.\n"
                        + "You can now book appointments and access your health dashboard.\n\n"
                        + "Thank you for choosing Clinova!"
        );

        // ✅ Follow-up
        followUpService.createFollowUp(
                savedUser.getEmail(),
                "Hi " + savedUser.getFullName() + ",\n\nWelcome to the future of healthcare!",
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
                doctor.setConsultationFee(100.0); // Default fee
                doctorRepository.save(doctor);
            }

            emailService.sendEmail(
                existingUser.getEmail(),
                "Clinova: Doctor Profile Active",
                "Hi Dr. " + existingUser.getFullName() + ",\n\n"
                        + "Your account has been updated to a Practitioner profile.\n"
                        + "Our administrators will review your credentials shortly.\n\n"
                        + "Best regards,\nClinova Admin Team"
            );

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
        doctor.setConsultationFee(100.0); // Set default fee to avoid NOT NULL error
        doctorRepository.save(doctor);

        emailService.sendEmail(
            savedUser.getEmail(),
            "Welcome to the Clinova Medical Staff",
            "Hi Dr. " + savedUser.getFullName() + ",\n\n"
                    + "Thank you for joining Clinova. Your application is now under review.\n"
                    + "Once verified, you will be able to manage your workspace and patient queue.\n\n"
                    + "Welcome aboard!"
        );

        return savedUser;
    }
    @Transactional
    public User registerAdmin(User user){
        user.setRole(Role.ADMIN);
        user.setPassword(encoder.encode(user.getPassword()));
        User savedUser = userRepository.save(user);
        
        emailService.sendEmail(
            savedUser.getEmail(),
            "Clinova: Administrative Access Granted",
            "Hi " + savedUser.getFullName() + ",\n\n"
                    + "Your administrative account for Clinova has been created.\n"
                    + "You now have access to the Command Center.\n\n"
                    + "Best regards,\nSystem Security"
        );
        
        return savedUser;
    }
}