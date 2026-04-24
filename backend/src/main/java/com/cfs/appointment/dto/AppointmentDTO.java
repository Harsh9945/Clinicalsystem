package com.cfs.appointment.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AppointmentDTO {
    @NotNull(message = "Doctor ID is required")
    private Long doctorid;
    @NotNull(message = "Doctor ID is required")// Matches your Postman JSON key
    private Long patientid;
    // Matches your Postman JSON key
    @NotNull(message = "Appointment time is required")
    @FutureOrPresent(message = "Appointment cannot be in the past")
    private LocalDateTime appointmentTime;
}
