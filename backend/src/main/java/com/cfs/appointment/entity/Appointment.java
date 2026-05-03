package com.cfs.appointment.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")

@Data
public class Appointment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime appointmentTime;
    private String status;

    @ManyToOne
    @JoinColumn(name = "doctor_id")
    private Doctor doctor;

    @ManyToOne
    @JoinColumn(name = "patient_id") // Added this
    private Patient patient;
    private boolean isFollowUp;
    
    @Column(length = 2000)
    private String summary;

    private String consultationType; // "PHYSICAL" or "VIDEO"
    private String paymentStatus;    // "PENDING", "PAID", "FAILED"
    private String transactionId;
}