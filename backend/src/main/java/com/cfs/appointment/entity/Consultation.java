package com.cfs.appointment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Consultation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @Column(columnDefinition = "TEXT")
    private String doctorNotes;

    @Column(name = "patient_symptoms", columnDefinition = "TEXT")
    private String patientSymptoms;

    @Column(name = "ai_report_summary", columnDefinition = "TEXT")
    private String aiReportSummary;
    
    private String predictedDisease;
    private String recommendedSpecialist;

    @Column(name = "diet_recommendations", columnDefinition = "TEXT")
    private String dietRecommendations;

    @Column(columnDefinition = "TEXT")
    private String ePrescription;

    private LocalDateTime completedAt;
}