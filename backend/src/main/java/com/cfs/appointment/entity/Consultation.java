package com.cfs.appointment.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
@Entity
@Data
public class Consultation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @Column(columnDefinition = "TEXT")
    private String doctorNotes;

    @Column(columnDefinition = "TEXT")
    private String patientSymptoms; // This is what the AI will read!

    @Column(columnDefinition = "TEXT")
    private String aiReportSummary; // This is what the AI will write!

    private LocalDateTime completedAt;

    public void setDietRecommendations(String diet) {
    }
}