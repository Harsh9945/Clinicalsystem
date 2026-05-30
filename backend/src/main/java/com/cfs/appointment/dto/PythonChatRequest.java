package com.cfs.appointment.dto;

import java.util.List;

public class PythonChatRequest {
    public String user_message;
    public List<String> current_symptoms;
    public Double weight_kg; 
    public Double height_m;  
    public List<String> denied_symptoms;
    public List<String> chat_history;
}