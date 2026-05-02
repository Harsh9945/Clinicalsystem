package com.cfs.appointment.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdminBookingRequest {
    private Long doctorId;
    private String patientEmail;
    private String patientName;
    private LocalDateTime appointmentTime;
}
