package com.cfs.appointment.repository;

import com.cfs.appointment.entity.FollowUp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface FollowUpRepository extends JpaRepository<FollowUp, Long> {

    List<FollowUp> findBySentFalseAndScheduledTimeBefore(LocalDateTime time);
}