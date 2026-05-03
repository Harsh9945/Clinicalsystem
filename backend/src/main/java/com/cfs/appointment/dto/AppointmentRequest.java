package com.cfs.appointment.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AppointmentRequest {

    @NotNull(message = "Doctor ID is required")
    private Long doctorId;

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    @NotNull(message = "Appointment time is required")
    @Future(message = "Appointment must be in the future")
    private LocalDateTime appointmentTime;

    private String consultationType; // "PHYSICAL" or "VIDEO"
    private String paymentStatus;
    private String transactionId;
}