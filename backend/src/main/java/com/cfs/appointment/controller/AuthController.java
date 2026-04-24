package com.cfs.appointment.controller;

import com.cfs.appointment.entity.User;
import com.cfs.appointment.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
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

    @PostMapping("/register/doctor")
    public String registerDoctor(@RequestBody User user, @RequestParam String specialty) {
        userService.registerDoctor(user, specialty);
        return "Doctor registered! Pending Admin approval.";
    }
}