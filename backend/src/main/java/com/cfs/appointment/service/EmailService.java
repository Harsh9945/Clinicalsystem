package com.cfs.appointment.service;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    @Async
    public void sendEmail(String to, String subject, String body) {
        System.out.println("📩 Attempting to send email to: " + to + " with subject: " + subject);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            // Professional Sender Identity
            helper.setFrom(new InternetAddress(senderEmail, "Clinova Health"));
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, false); // Plain text for better deliverability

            mailSender.send(message);
            System.out.println("✅ Email sent successfully to: " + to);
        } catch (Exception e) {
            System.err.println("❌ CRITICAL: Failed to send Clinova email to [" + to + "]");
            System.err.println("Reason: " + e.getMessage());
            // We don't rethrow because it's @Async and would just get swallowed anyway
        }
    }
}