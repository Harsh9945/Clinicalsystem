package com.cfs.appointment.entity;


import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "doctors")
@Data
public class Doctor {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;


        @OneToOne
        @JoinColumn(name = "user_id")
        private User user; // Links to the User table for login details

        private String specialty;
        private Double consultationFee;
        private Boolean isverified;
    }