package com.cfs.appointment.repository;

import com.cfs.appointment.entity.TriageSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TriageSessionRepository extends JpaRepository<TriageSession, String> {
}