# Frontend Integration Guide - Clinical System

## Table of Contents
1. [Backend Setup](#backend-setup)
2. [API Overview](#api-overview)
3. [Authentication Flow](#authentication-flow)
4. [API Endpoints Reference](#api-endpoints-reference)
5. [Frontend Implementation Guide](#frontend-implementation-guide)
6. [Error Handling](#error-handling)
7. [Development Checklist](#development-checklist)

---

## Backend Setup

### Prerequisites
- Java 17+
- Maven 3.8+
- MySQL/PostgreSQL (check `application.properties` for DB config)
- Gmail account (for email notifications)

### Running the Backend

```bash
cd backend

# Option 1: Using Maven wrapper
./mvnw spring-boot:run

# Option 2: Build and run JAR
./mvnw clean package
java -jar target/appointment-0.0.1-SNAPSHOT.jar
```

**Default Server:** `http://localhost:8080`

### Configuration (`application.properties`)
Ensure these are set:
```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/clinical_db
spring.datasource.username=root
spring.datasource.password=your_password

# Email
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your_email@gmail.com
spring.mail.password=your_app_password

# JWT Secret (generate a strong one)
jwt.secret=your_secret_key_here_min_32_chars
```

### CORS Configuration
The backend is configured to allow all origins (`@CrossOrigin(origins = "*")`). For production, update `WebConfig.java`:

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("https://yourdomain.com")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true);
    }
}
```

---

## API Overview

### Base URL
```
http://localhost:8080/api
```

### Authentication
- Uses **JWT (JSON Web Token)**
- Include token in header: `Authorization: Bearer <token>`
- Token includes role information (PATIENT, DOCTOR, ADMIN)
- No explicit logout (stateless)

### Response Format
All responses follow this pattern:

**Success (2xx):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "message": "Success message"
}
```

**Error (4xx/5xx):**
```json
{
  "error": "Error message",
  "status": 400
}
```

---

## Authentication Flow

### 1. Registration

#### Patient Registration
```http
POST /api/auth/register/patient
Content-Type: application/json

{
  "email": "patient@example.com",
  "password": "securePass123",
  "fullName": "John Doe"
}
```

**Response:**
```json
"Patient registered successfully!"
```

#### Doctor Registration
```http
POST /api/auth/register/doctor
Content-Type: application/json
Content-Length: ...

{
  "email": "doctor@example.com",
  "password": "securePass123",
  "fullName": "Dr. Sarah Smith",
  "specialty": "Cardiology"
}

?specialty=Cardiology  // Query parameter
```

**Response:**
```json
"Doctor registered! Pending Admin approval."
```

#### Admin Registration
```http
POST /api/auth/register/Admin
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "securePass123",
  "fullName": "Admin User"
}
```

### 2. Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "patient@example.com",
  "password": "securePass123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJwYXRpZW50QGV4YW1wbGUuY29tIiwicm9sZXMiOlsiUk9MRV9QQVRJRVoiXSwiaWF0IjoxNjE2MjM5MDIyfQ.mKm5fP..."
}
```

**Store token in:**
- `localStorage.setItem('authToken', response.token)`
- Or HTTP-only cookie (more secure)

### 3. Using Token in Requests

```javascript
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
  'Content-Type': 'application/json'
};

fetch('http://localhost:8080/api/appointments/book', {
  method: 'POST',
  headers: headers,
  body: JSON.stringify(data)
});
```

---

## API Endpoints Reference

### 1. **Doctor Management**

#### Get All Verified Doctors
```http
GET /api/doctors/verified
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "user": {
      "id": 1,
      "email": "doctor@example.com",
      "fullName": "Dr. Sarah Smith"
    },
    "specialty": "Cardiology",
    "isverified": true
  },
  ...
]
```

#### Verify Doctor (Admin Only)
```http
PUT /api/admin/verify-doctor/{doctorId}
Authorization: Bearer <token>
```

**Response:**
```json
"Doctor verified successfully!"
```

---

### 2. **Appointment Management**

#### Book Appointment
```http
POST /api/appointments/book
Authorization: Bearer <token>
Content-Type: application/json

{
  "doctorid": 1,
  "patientid": 5,
  "appointmentTime": "2026-05-15T14:30:00"
}
```

**Response:**
```json
"Appointment booked successfully!"
```

**Error Cases:**
```json
{
  "error": "Slot already booked!"
}
```

**Important Notes:**
- `appointmentTime` must be in future (ISO 8601 format)
- Doctor ID must be verified
- Patient ID must exist
- Cannot double-book a doctor's slot

---

### 3. **Consultation Management**

#### Get All Consultations
```http
GET /api/v1/consultations/all
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "appointment": { ... },
    "patientSymptoms": "Chest pain, shortness of breath",
    "aiReportSummary": "Patient presents with cardiac symptoms...",
    "dietRecommendations": "Low sodium diet recommended"
  },
  ...
]
```

#### Get Consultation by ID
```http
GET /api/v1/consultations/{consultationId}
Authorization: Bearer <token>
```

---

## Frontend Implementation Guide

### 1. Setup Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── AuthContext.jsx
│   │   ├── Patient/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── BookAppointmentPage.jsx
│   │   │   └── MyAppointments.jsx
│   │   ├── Doctor/
│   │   │   ├── DashboardPage.jsx
│   │   │   └── AvailabilityPage.jsx
│   │   ├── Admin/
│   │   │   └── VerifyDoctorsPage.jsx
│   │   └── Shared/
│   │       ├── Navbar.jsx
│   │       └── ProtectedRoute.jsx
│   ├── services/
│   │   ├── api.js (axios config)
│   │   ├── authService.js
│   │   ├── appointmentService.js
│   │   └── consultationService.js
│   ├── utils/
│   │   ├── tokenManager.js
│   │   └── formatters.js
│   └── App.jsx

```

### 2. API Service Module (React Example)

**`services/api.js`**
```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

**`services/authService.js`**
```javascript
import api from './api';

export const authService = {
  registerPatient: (email, password, fullName) =>
    api.post('/auth/register/patient', {
      email,
      password,
      fullName
    }),

  registerDoctor: (email, password, fullName, specialty) =>
    api.post('/auth/register/doctor', {
      email,
      password,
      fullName,
      specialty
    }, { params: { specialty } }),

  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  logout: () => {
    localStorage.removeItem('authToken');
  }
};
```

**`services/appointmentService.js`**
```javascript
import api from './api';

export const appointmentService = {
  getVerifiedDoctors: () =>
    api.get('/doctors/verified'),

  bookAppointment: (doctorId, patientId, appointmentTime) =>
    api.post('/appointments/book', {
      doctorid: doctorId,
      patientid: patientId,
      appointmentTime
    }),

  getAllConsultations: () =>
    api.get('/v1/consultations/all'),

  getConsultationById: (id) =>
    api.get(`/v1/consultations/${id}`)
};
```

### 3. Authentication Context (React Example)

**`components/Auth/AuthContext.jsx`**
```javascript
import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  useEffect(() => {
    // Parse JWT to get user info (without backend call)
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          email: payload.sub,
          role: payload.roles?.[0]?.replace('ROLE_', '')
        });
      } catch (e) {
        console.error('Invalid token');
        authService.logout();
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    const newToken = response.data.token;
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
    return response.data;
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 4. Protected Route Component

**`components/Shared/ProtectedRoute.jsx`**
```javascript
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../Auth/AuthContext';

export const ProtectedRoute = ({ component: Component, requiredRole }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;

  if (!user) return <Navigate to="/login" />;

  if (requiredRole && !user.role.includes(requiredRole)) {
    return <Navigate to="/unauthorized" />;
  }

  return <Component />;
};
```

### 5. Patient Dashboard Example

**`components/Patient/BookAppointmentPage.jsx`**
```javascript
import React, { useState, useEffect } from 'react';
import { appointmentService } from '../../services/appointmentService';

export const BookAppointmentPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentTime, setAppointmentTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await appointmentService.getVerifiedDoctors();
        setDoctors(response.data);
      } catch (err) {
        setError('Failed to load doctors');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !appointmentTime) {
      setError('Please select doctor and time');
      return;
    }

    try {
      await appointmentService.bookAppointment(
        selectedDoctor.id,
        localStorage.getItem('patientId'), // Store patientId in auth
        appointmentTime
      );
      alert('Appointment booked successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed');
    }
  };

  if (loading) return <div>Loading doctors...</div>;

  return (
    <div className="container">
      <h2>Book Appointment</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div>
        <label>Select Doctor:</label>
        <select onChange={(e) => setSelectedDoctor(doctors[e.target.value])}>
          <option value="">--Choose Doctor--</option>
          {doctors.map((doc, idx) => (
            <option key={doc.id} value={idx}>
              {doc.user.fullName} - {doc.specialty}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Appointment Time:</label>
        <input
          type="datetime-local"
          value={appointmentTime}
          onChange={(e) => setAppointmentTime(e.target.value)}
        />
      </div>

      <button onClick={handleBookAppointment}>Book Appointment</button>
    </div>
  );
};
```

### 6. Login Page Example

**`components/Auth/LoginPage.jsx`**
```javascript
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};
```

---

## Error Handling

### Common Error Responses

| Error | Status | Meaning | Action |
|-------|--------|---------|--------|
| `Slot already booked!` | 400 | Doctor unavailable at that time | Show available slots |
| `Doctor not found` | 404 | Invalid doctor ID | Refresh doctor list |
| `Appointment cannot be in the past` | 400 | Invalid datetime | Show date picker validation |
| Unauthorized token | 401 | Token expired/invalid | Redirect to login |
| `hasRole('ADMIN')` denied | 403 | User lacks permission | Show access denied page |

### Frontend Error Handling Pattern

```javascript
try {
  const response = await appointmentService.bookAppointment(...);
  // Handle success
} catch (error) {
  if (error.response?.status === 400) {
    // Validation error - show form error
    console.error(error.response.data.error);
  } else if (error.response?.status === 401) {
    // Token expired - redirect to login
    window.location.href = '/login';
  } else if (error.response?.status === 403) {
    // Forbidden - show permission error
    console.error('Access denied');
  } else {
    // Network error or server error
    console.error('Something went wrong');
  }
}
```

---

## Development Checklist

### Phase 1: Authentication ✓
- [ ] Implement Login page
- [ ] Implement Registration (Patient/Doctor/Admin)
- [ ] Store JWT token securely
- [ ] Implement token refresh/expiry handling
- [ ] Test API responses

### Phase 2: Patient Dashboard
- [ ] Display list of verified doctors
- [ ] Filter doctors by specialty (when API available)
- [ ] Book appointment with datetime validation
- [ ] View booked appointments (requires new API)
- [ ] View consultation history (requires new API)
- [ ] Show follow-up reminders (requires new API)

### Phase 3: Doctor Dashboard
- [ ] View schedule and appointments
- [ ] Set availability (requires new API)
- [ ] View patient consultations
- [ ] Add consultation notes (requires new API)

### Phase 4: Admin Dashboard
- [ ] View pending doctors
- [ ] Verify/reject doctors
- [ ] View system statistics (requires new API)

### Testing Endpoints
```bash
# Test Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "patient@example.com", "password": "securePass123"}'

# Test Get Verified Doctors
curl -X GET http://localhost:8080/api/doctors/verified \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test Book Appointment
curl -X POST http://localhost:8080/api/appointments/book \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorid": 1,
    "patientid": 5,
    "appointmentTime": "2026-05-15T14:30:00"
  }'
```

---

## Environment Variables for Frontend

Create `.env` file in frontend root:

```env
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_JWT_STORAGE_KEY=authToken
REACT_APP_ENVIRONMENT=development
```

Access in code:
```javascript
const API_URL = process.env.REACT_APP_API_URL;
```

---

## Support & Troubleshooting

### Issue: CORS Error
**Solution:** Ensure backend has `@CrossOrigin` annotation or WebConfig is properly set.

### Issue: 401 Unauthorized
**Solution:** Check if token is being sent in Authorization header. Token may have expired.

### Issue: API returning different data format
**Solution:** Check latest backend API documentation or run server and test endpoints with Postman.

### Issue: Email not sending
**Solution:** Check `application.properties` Gmail configuration. Use app-specific password for Gmail.

---

## Next Steps

1. Build the missing APIs (backend needs to implement endpoints for patient/doctor dashboards)
2. Set up CI/CD pipeline for frontend deployment
3. Implement real-time notifications (WebSocket)
4. Add testing suite (Jest, React Testing Library)
5. Deploy frontend to hosting (Vercel, Netlify, AWS)

---

**Last Updated:** April 30, 2026
**Backend Version:** 0.0.1
**Frontend Frameworks:** React (recommended), Vue.js, or Angular
