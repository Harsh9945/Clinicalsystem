package com.cfs.appointment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TriageSession {
    
    @Id
    private String username; // The JWT username is the Session ID
    
    @ElementCollection
    private List<String> chatLog = new ArrayList<>();
    
    @ElementCollection
    private List<String> currentSymptoms = new ArrayList<>();
    
    private String status = "ACTIVE"; // "ACTIVE" or "ROUTED"
}