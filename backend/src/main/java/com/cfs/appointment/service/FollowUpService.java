package com.cfs.appointment.service;

import com.cfs.appointment.entity.FollowUp;
import com.cfs.appointment.repository.FollowUpRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FollowUpService {

    @Autowired
    private FollowUpRepository followUpRepository;
    @Autowired
    private EmailService emailService;

    public void createFollowUp(String email, String message, LocalDateTime time, String type) {
        FollowUp f = new FollowUp();
        f.setEmail(email);
        f.setMessage(message);
        f.setScheduledTime(time);
        f.setSent(false);
        f.setType(type);

        followUpRepository.save(f);
    }
    public void processFollowUps() {

        List<FollowUp> pending = followUpRepository
                .findBySentFalseAndScheduledTimeBefore(LocalDateTime.now());

        for (FollowUp f : pending) {

            // 📩 Send Email
            emailService.sendEmail(
                    f.getEmail(),
                    "Follow-up Reminder",
                    f.getMessage()
            );

            // ✅ Mark as sent
            f.setSent(true);
            followUpRepository.save(f);
        }
    }
}