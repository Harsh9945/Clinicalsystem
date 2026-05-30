package com.cfs.appointment.entity;

import jakarta.persistence.*;
import lombok.Data;


@Entity
@Data
public class Patient {
    @Id
    private Long id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    private String bloodGroup;
    private String medicalHistory;
}