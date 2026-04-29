package com.cfs.appointment.controller;

import com.cfs.appointment.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/test")
public class TestController {

    @Autowired
    private EmailService emailService;

    @GetMapping("/email")
    public String testEmail() {
        emailService.sendEmail(
                "your_email@gmail.com",
                "Test Mail",
                "If you received this, email is working!"
        );
        return "Email Triggered";
    }
}