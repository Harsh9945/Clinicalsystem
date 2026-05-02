package com.cfs.appointment.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DashboardStatsDTO {
    private Long totalDoctors;
    private Long totalPatients;
    private Long totalAppointments;
    private Long pendingDoctors;
    private Long completedConsultations;
}
