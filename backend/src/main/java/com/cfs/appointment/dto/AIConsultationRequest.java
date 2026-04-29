package com.cfs.appointment.dto;


import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AIConsultationRequest {

    @NotBlank(message = "Symptoms are required")
    private String symptoms;

    private Integer age;          // optional (future ML use)
    private String medicalHistory; // optional
}
