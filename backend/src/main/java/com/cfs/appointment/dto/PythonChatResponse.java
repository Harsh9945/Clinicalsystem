package com.cfs.appointment.dto;

import java.util.List;

public class PythonChatResponse {
    public String status;
    public String bot_reply;
    public List<String> tracked_symptoms;
    public String predicted_disease;
    public Double confidence;
    public String specialist;
    public String diet_plan;
}