import os
from fpdf import FPDF

class ClinovaPDF(FPDF):
    def header(self):
        # Draw a top teal accent line
        self.set_fill_color(13, 148, 136) # Teal #0D9488
        self.rect(0, 0, 210, 8, 'F')
        
        # Add small header text
        self.set_text_color(120, 120, 120)
        self.set_font('Helvetica', 'I', 8)
        self.cell(0, 15, 'CLINOVA AI TRIAGE ENGINE - TECHNICAL ARCHITECTURE DOCUMENT', 0, 0, 'R')
        self.ln(12)

    def footer(self):
        # Position at 1.5 cm from bottom
        self.set_y(-15)
        # Arial italic 8
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(120, 120, 120)
        # Page number
        self.cell(0, 10, f'Page {self.page_no()}/{{nb}}', 0, 0, 'C')

    def chapter_title(self, label):
        self.set_font('Helvetica', 'B', 14)
        self.set_text_color(13, 148, 136) # Teal
        self.cell(0, 10, label, 0, 1, 'L')
        self.ln(2)
        # Accent line under chapter title
        x = self.get_x()
        y = self.get_y()
        self.set_draw_color(13, 148, 136)
        self.line(x, y - 2, x + 180, y - 2)
        self.ln(3)

    def section_title(self, label):
        self.set_font('Helvetica', 'B', 11)
        self.set_text_color(45, 55, 72) # Slate Gray #2D3748
        self.cell(0, 8, label, 0, 1, 'L')
        self.ln(1)

    def body_text(self, text):
        self.set_font('Helvetica', '', 10)
        self.set_text_color(60, 60, 60)
        self.multi_cell(0, 5.5, text)
        self.ln(3)

    def bullet_point(self, label, text):
        self.set_font('Helvetica', 'B', 10)
        self.set_text_color(45, 55, 72)
        self.write(5.5, "  * " + label + ": ")
        self.set_font('Helvetica', '', 10)
        self.set_text_color(60, 60, 60)
        self.write(5.5, text + "\n")
        self.ln(1)

def generate_report():
    pdf = ClinovaPDF()
    pdf.alias_nb_pages()
    
    # ----------------------------------------------------
    # COVER PAGE
    # ----------------------------------------------------
    pdf.add_page()
    
    # Draw Cover Background Shapes
    pdf.set_fill_color(244, 246, 248) # Very light gray background
    pdf.rect(0, 0, 210, 297, 'F')
    pdf.set_fill_color(13, 148, 136) # Teal side stripe
    pdf.rect(0, 0, 12, 297, 'F')
    
    pdf.set_y(80)
    pdf.set_x(25)
    pdf.set_font('Helvetica', 'B', 28)
    pdf.set_text_color(13, 148, 136)
    pdf.cell(0, 12, 'Clinova AI Triage Engine', 0, 1, 'L')
    
    pdf.set_x(25)
    pdf.set_font('Helvetica', 'B', 14)
    pdf.set_text_color(74, 85, 104)
    pdf.cell(0, 10, 'Technical Architecture & Working Model Specification', 0, 1, 'L')
    
    # Horizontal dividing line on cover
    pdf.set_draw_color(13, 148, 136)
    pdf.line(25, pdf.get_y() + 5, 180, pdf.get_y() + 5)
    
    pdf.set_y(150)
    pdf.set_x(25)
    pdf.set_font('Helvetica', '', 11)
    pdf.set_text_color(100, 110, 120)
    pdf.multi_cell(150, 6, 
        "A technical specification covering the hybrid intelligence of the Clinova patient chatbot. "
        "Details include the local Scikit-Learn machine learning classifier, Google Gemini API orchestration, "
        "Java Spring Boot REST interfaces, stateful database triage session mapping, and the resilient local "
        "no-crash fallback framework.")
    
    pdf.set_y(240)
    pdf.set_x(25)
    pdf.set_font('Helvetica', 'B', 10)
    pdf.set_text_color(74, 85, 104)
    pdf.cell(0, 5, 'Author: Clinova Engineering Group', 0, 1, 'L')
    pdf.set_x(25)
    pdf.cell(0, 5, 'Platform: FastAPI (Python) & Spring Boot (Java)', 0, 1, 'L')
    pdf.set_x(25)
    pdf.cell(0, 5, 'Date: May 2026', 0, 1, 'L')

    # ----------------------------------------------------
    # PAGE 2: EXECUTIVE SUMMARY & SYSTEM FLOW
    # ----------------------------------------------------
    pdf.add_page()
    pdf.chapter_title('1. Executive Summary & System Flow')
    
    pdf.body_text(
        "The Clinova AI Triage Engine is a hybrid clinical reasoning service designed to process patient "
        "conversations, extract diagnostic symptoms, perform machine learning diagnostic classifications, "
        "and suggest immediate medical pathways. By decoupling clinical logic from the frontend and integrating "
        "a zero-dependency local fallback, the triage system maintains 100% availability even during Gemini "
        "API quota exhaustion or database server downtime."
    )
    
    pdf.section_title('1.1 Decoupled Microservice Architecture')
    pdf.body_text(
        "The system operates across three sovereign layers of the Clinova clinical control suite:"
    )
    pdf.bullet_point("React Patient Care Portal (Frontend)", "A clean, modern chat interface where patients describe their symptoms and receive real-time, empathetic advice.")
    pdf.bullet_point("Java Spring Boot Backend (Orchestration)", "Manages user state, verifies JWT authentication, stores stateful 'Triage Sessions' in the MySQL database, and schedules consultations upon triage completion.")
    pdf.bullet_point("FastAPI AI Engine (Reasoning Microservice)", "A high-performance Python microservice that encapsulates local Machine Learning models and Google Gemini API connections.")

    pdf.section_title('1.2 Stateful Request Pipeline')
    pdf.body_text(
        "Every patient interaction follows a stateful lifecycle:\n"
        "1. The React Patient Care Portal posts the user message and patient vitals to the Spring Boot ChatController.\n"
        "2. Spring Boot loads the active TriageSession for the authenticated patient and prepares a unified PythonChatRequest payload.\n"
        "3. FastAPI parses the user message to extract confirmed/denied symptoms, feeds the confirmed list to the local Scikit-Learn model, and computes diagnostic probabilities.\n"
        "4. If confidence is low, the chatbot conversational AI generates an empathetic follow-up tie-breaker question.\n"
        "5. If confidence is high or maximum denials are reached, it finalizes the diagnosis, routes the patient to a specialist doctor, designs a custom 2-day diet, and returns status: TRIAGE_COMPLETE.\n"
        "6. Spring Boot automatically saves a Consultation report and clears the active session state."
    )

    # ----------------------------------------------------
    # PAGE 3: ML CLASSIFIER & GEMINI API KEY INTEGRATION
    # ----------------------------------------------------
    pdf.add_page()
    pdf.chapter_title('2. Core Working Model & Hybrid AI')
    
    pdf.section_title('2.1 Local Scikit-Learn Model (triage_model.pkl)')
    pdf.body_text(
        "Deterministic clinical reasoning is achieved using a pre-trained local Scikit-Learn Machine Learning classifier. "
        "The model is lightweight, ultra-fast, and executes entirely inside your Python runtime environment without any internet connection."
    )
    pdf.bullet_point("Feature Input Space", "The model expects a binary vector of size 59, mapped to strict snake_case symptom keys loaded from 'symptoms_list.pkl' (e.g., 'acidity', 'vomiting', 'high_fever', 'joint_pain').")
    pdf.bullet_point("Vector Encoding", "Confirmed symptoms are set to 1.0; all other dimensions are set to 0.0.")
    pdf.bullet_point("Inference Runtime", "The vector is wrapped in a Pandas DataFrame to preserve clinical feature names, and fed to the model to predict class probabilities:")
    pdf.body_text(
        "    input_df = pd.DataFrame([input_data], columns=symptoms_list)\n"
        "    probabilities = model.predict_proba(input_df)[0]"
    )
    pdf.bullet_point("Classification Classes", "Predicts the exact mathematical probability distribution for the top 3 matching medical conditions (e.g., Influenza, Gastrointestinal Disease, Migraine).")

    pdf.section_title('2.2 Google Gemini API Key Integration (gemini-2.5-flash)')
    pdf.body_text(
        "While the ML model provides deterministic symptom classification, Google Gemini API provides advanced NLP reasoning. "
        "The engine integrates with the new 'google-genai' SDK to perform three specific clinical tasks:"
    )
    pdf.bullet_point("1. Symptom & Denial Extraction", "Converts loose conversational language into clinical symptom keys. For example, if a patient says 'I have stomach ache but no headache', Gemini extracts stomach_pain to confirmed, and headache to denied_symptoms.")
    pdf.bullet_point("2. Empathetic Clinical Follow-ups", "If the ML model's confidence is under 65%, Gemini reads the clinical instructions, avoids confirmed/denied lists, and designs an empathetic tie-breaker question.")
    pdf.bullet_point("3. Personalized Nutrition Planning", "Upon triage completion, Gemini acts as a clinical nutritionist to generate a concise, customized 2-day diet plan tailored to the predicted disease and calculated BMI category.")

    # ----------------------------------------------------
    # PAGE 4: BACKEND CONNECTION & FALLBACK FRAMEWORK
    # ----------------------------------------------------
    pdf.add_page()
    pdf.chapter_title('3. Backend Integration & Resilient Fallbacks')
    
    pdf.section_title('3.1 Spring Boot REST Communication')
    pdf.body_text(
        "The Java backend communicates with the Python FastAPI microservice using REST API calls. "
        "Spring Boot uses Java's RestTemplate with a strict 30-second read timeout to support slow AI generations under heavy server loads."
    )
    pdf.section_title('3.1.1 Request Payload Schema (PythonChatRequest)')
    pdf.body_text(
        "{\n"
        "  \"user_message\": \"string\",       // Latest user chat input\n"
        "  \"current_symptoms\": [\"string\"],  // Previously confirmed symptoms\n"
        "  \"denied_symptoms\": [\"string\"],   // Previously denied symptoms\n"
        "  \"chat_history\": [\"string\"],      // Last 4 conversation lines for context\n"
        "  \"weight_kg\": float,              // Patient weight (optional)\n"
        "  \"height_m\": float                // Patient height (optional)\n"
        "}"
    )
    
    pdf.section_title('3.2 Resilient Local Fallback Engine (No-Crash Architecture)')
    pdf.body_text(
        "In production environments, external API connections can hit limits (such as the Gemini Free Tier limit of 20 requests per day) "
        "or suffer internet downtime. The Clinova AI Triage Engine implements a highly robust fallback framework that automatically activates "
        "if the Gemini API key is exhausted or offline:"
    )
    pdf.bullet_point("Local Symptom Matching", "If Gemini fails, a local fuzzy keyword substring matcher maps the user message to clinical symptoms by checking word stems and exact match patterns.")
    pdf.bullet_point("Local Follow-up Rules", "Automatically identifies unconfirmed common symptoms (like 'cough' or 'fever'), formats a natural nurse response, and asks the patient locally.")
    pdf.bullet_point("Local Diet Planner", "Designs a clean, bulleted diet plan locally based on standard clinical rules (Hydration, digestible meals, BMI restrictions) without calling external servers.")
    pdf.bullet_point("Java Backend Graceful Guard", "If the Python microservice is offline, the Spring Boot catch block shields the patient from raw system errors, returning an empathetic suggestion to reset the chat or consult a physician directly.")
    
    pdf.ln(5)
    pdf.set_fill_color(240, 248, 255)
    pdf.set_draw_color(13, 148, 136)
    pdf.rect(pdf.get_x(), pdf.get_y(), 180, 20, 'FD')
    pdf.set_y(pdf.get_y() + 2)
    pdf.set_x(pdf.get_x() + 5)
    pdf.set_font('Helvetica', 'B', 9)
    pdf.set_text_color(13, 148, 136)
    pdf.write(4, "CLINICAL OBSERVATION:\n")
    pdf.set_font('Helvetica', 'I', 9)
    pdf.set_text_color(74, 85, 104)
    pdf.write(4, "The integration of local fallback matching with local ML classifiers ensures 100% diagnostic runtime uptime, making Clinova a robust, safe, and highly resilient clinical platform.")

    # Save the output PDF
    pdf.output("Clinova_AI_Triage_Technical_Specification.pdf")
    print("PDF generated successfully: Clinova_AI_Triage_Technical_Specification.pdf")

if __name__ == "__main__":
    generate_report()
