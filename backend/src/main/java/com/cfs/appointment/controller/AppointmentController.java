package com.cfs.appointment.controller;

import com.cfs.appointment.dto.AppointmentDTO;
import com.cfs.appointment.entity.Appointment;
import com.cfs.appointment.service.AppointmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    @PostMapping("/book")
    public ResponseEntity<?> bookAppointment(@RequestBody AppointmentDTO dto) {
        try {
            Appointment appointment = appointmentService.bookAppointment(dto);
            return ResponseEntity.ok("Appointment booked successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}