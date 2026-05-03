package com.cfs.appointment.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class AppointmentResponseDTO {
    private Long id;
    private Long doctorId;
    private String doctorName;
    private String specialty;
    private Long patientId;
    private String patientName;
    private LocalDateTime appointmentTime;
    private String status;
    private boolean isFollowUp;
    private String consultationType;
    private String paymentStatus;
    private String transactionId;
}
