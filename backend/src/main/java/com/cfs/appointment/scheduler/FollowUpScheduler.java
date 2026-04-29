package com.cfs.appointment.scheduler;

import com.cfs.appointment.entity.FollowUp;
import com.cfs.appointment.repository.FollowUpRepository;
import com.cfs.appointment.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FollowUpScheduler {

    @Autowired
    private FollowUpRepository followUpRepository;

    @Autowired
    private EmailService emailService;

    @Scheduled(fixedRate = 60000) // runs every 1 minute
    public void processFollowUps() {

        List<FollowUp> dueFollowUps =
                followUpRepository.findBySentFalseAndScheduledTimeBefore(LocalDateTime.now());

        for (FollowUp f : dueFollowUps) {

            emailService.sendEmail(
                    f.getEmail(),
                    "Follow-up Reminder",
                    f.getMessage()
            );

            f.setSent(true);
            followUpRepository.save(f);
        }
    }
}