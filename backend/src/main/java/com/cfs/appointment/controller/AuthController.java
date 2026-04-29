package com.cfs.appointment.controller;

import com.cfs.appointment.config.JwtUtil;
import com.cfs.appointment.dto.AuthRequest;
import com.cfs.appointment.entity.User;
import com.cfs.appointment.service.UserService;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private UserService userService;

    @PostMapping("/register/patient")
    public String registerPatient(@RequestBody User user) {
        userService.registerPatient(user);
        return "Patient registered successfully!";
    }
    @PostMapping("/register/Admin")
    public String registerAdmin(@RequestBody User user) {
        userService.registerAdmin(user);
        return "Admin registered successfully!";
    }
    @PostMapping("/register/doctor")
    public String registerDoctor(@RequestBody User user, @RequestParam String specialty) {
        userService.registerDoctor(user, specialty);
        return "Doctor registered! Pending Admin approval.";
    }
    @Autowired
private AuthenticationManager authenticationManager;

@Autowired
private JwtUtil jwtUtil;

@PostMapping("/login")
public ResponseEntity<?> login(@RequestBody AuthRequest request) {

    Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                    request.getEmail(),
                    request.getPassword()
            )
    );

    UserDetails userDetails = (UserDetails) authentication.getPrincipal();

    String token = jwtUtil.generateToken(userDetails);

    return ResponseEntity.ok(Map.of("token", token));
}
}