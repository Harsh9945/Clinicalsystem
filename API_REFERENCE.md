# Clinical System - Complete API Reference

**Version:** 1.0.0  
**Last Updated:** April 30, 2026  
**Base URL:** `http://localhost:8080/api`

---

## 📑 Table of Contents

1. [Authentication](#authentication)
2. [Doctors API](#doctors-api)
3. [Appointments API](#appointments-api)
4. [Consultations API](#consultations-api)
5. [Admin API](#admin-api)
6. [Status Codes](#status-codes)
7. [Data Models](#data-models)

---

## Authentication

### Overview
- Uses **JWT (JSON Web Token)** for stateless authentication
- Include token in `Authorization: Bearer <token>` header
- Token doesn't expire in current implementation (add to future version)
- Roles: `ROLE_PATIENT`, `ROLE_DOCTOR`, `ROLE_ADMIN`

### Register Patient

**Endpoint:** `POST /auth/register/patient`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "patient@example.com",
  "password": "SecurePassword123",
  "fullName": "John Doe"
}
```

**Response: 201 Created**
```json
"Patient registered successfully!"
```

**Validations:**
- Email must be unique
- Password must be at least 8 characters
- Full name required

---

### Register Doctor

**Endpoint:** `POST /auth/register/doctor?specialty=<specialty>`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "doctor@example.com",
  "password": "SecurePassword123",
  "fullName": "Dr. Sarah Smith"
}
```

**Query Parameters:**
- `specialty` (required) - Medical specialty (e.g., "Cardiology", "Dermatology", "Neurology")

**Response: 201 Created**
```json
"Doctor registered! Pending Admin approval."
```

**Notes:**
- Doctor is created with `isverified = false`
- Requires admin approval before appearing in patient's doctor list

---

### Register Admin

**Endpoint:** `POST /auth/register/Admin`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "SecurePassword123",
  "fullName": "Admin User"
}
```

**Response: 201 Created**
```json
"Admin registered successfully!"
```

**Notes:**
- Only backend admin should call this endpoint
- No approval required

---

### Login

**Endpoint:** `POST /auth/login`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "patient@example.com",
  "password": "SecurePassword123"
}
```

**Response: 200 OK**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJwYXRpZW50QGV4YW1wbGUuY29tIiwicm9sZXMiOlsiUk9MRV9QQVRJRVoiXSwiaWF0IjoxNjE2MjM5MDIyfQ.mKm5fP..."
}
```

**Error Responses:**

```json
// 401 Unauthorized - Invalid credentials
{
  "error": "Invalid email or password"
}
```

**Token Structure (Decoded):**
```json
{
  "sub": "patient@example.com",
  "roles": ["ROLE_PATIENT"],
  "iat": 1616239022
}
```

**How to Extract User Info from Token in Frontend:**
```javascript
const token = localStorage.getItem('authToken');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload.sub); // email
console.log(payload.roles[0]); // ROLE_PATIENT
```

---

## Doctors API

### Get All Verified Doctors

**Endpoint:** `GET /api/doctors/verified`

**Headers:**
```
Authorization: Bearer <token>
```

**Response: 200 OK**
```json
[
  {
    "id": 1,
    "user": {
      "id": 1,
      "email": "doctor1@example.com",
      "fullName": "Dr. Sarah Smith",
      "password": null
    },
    "specialty": "Cardiology",
    "isverified": true
  },
  {
    "id": 2,
    "user": {
      "id": 2,
      "email": "doctor2@example.com",
      "fullName": "Dr. Michael Brown",
      "password": null
    },
    "specialty": "Dermatology",
    "isverified": true
  }
]
```

**Response: 401 Unauthorized**
```json
{
  "error": "Unauthorized"
}
```

**Notes:**
- Only returns doctors with `isverified = true`
- Always includes role information in token

---

## Appointments API

### Book Appointment

**Endpoint:** `POST /api/appointments/book`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "doctorid": 1,
  "patientid": 5,
  "appointmentTime": "2026-05-15T14:30:00"
}
```

**Response: 200 OK**
```json
"Appointment booked successfully!"
```

**Error Responses:**

```json
// 400 Bad Request - Slot already booked
{
  "error": "Slot already booked!"
}
```

```json
// 404 Not Found - Doctor not found
{
  "error": "Doctor not found"
}
```

```json
// 404 Not Found - Patient not found
{
  "error": "Patient not found"
}
```

```json
// 400 Bad Request - Invalid time
{
  "error": "Appointment cannot be in the past"
}
```

**Request Validation:**
- `doctorid` must exist and be verified
- `patientid` must exist
- `appointmentTime` must be in future (ISO 8601 format)
- No duplicate appointments at same time for doctor

**Side Effects:**
- Automatic follow-up email scheduled (3-7 days based on specialty)
- Creates follow-up reminder in database

**Example - Valid DateTime Formats:**
```
2026-05-15T14:30:00        ✓ ISO 8601 with seconds
2026-05-15T14:30:00.000    ✓ ISO 8601 with milliseconds
2026-05-15T14:30:00Z       ✓ ISO 8601 with UTC
2026-05-15 14:30           ✗ Invalid format
```

---

## Consultations API

### Get All Consultations

**Endpoint:** `GET /api/v1/consultations/all`

**Headers:**
```
Authorization: Bearer <token>
```

**Response: 200 OK**
```json
[
  {
    "id": 1,
    "appointment": {
      "id": 1,
      "appointmentTime": "2026-05-10T10:00:00",
      "status": "CONFIRMED",
      "doctor": {
        "id": 1,
        "user": {
          "id": 1,
          "email": "doctor@example.com",
          "fullName": "Dr. Sarah Smith"
        },
        "specialty": "Cardiology",
        "isverified": true
      },
      "patient": {
        "id": 5,
        "user": {
          "id": 5,
          "email": "patient@example.com",
          "fullName": "John Doe"
        }
      },
      "isFollowUp": false
    },
    "patientSymptoms": "Chest pain, shortness of breath",
    "aiReportSummary": "Patient presents with cardiac symptoms including chest pain and dyspnea...",
    "dietRecommendations": "Low sodium diet, reduced caffeine intake"
  }
]
```

**Response: 401 Unauthorized**
```json
{
  "error": "Unauthorized"
}
```

---

### Get Consultation by ID

**Endpoint:** `GET /api/v1/consultations/{id}`

**Path Parameters:**
- `id` (required, Long) - Consultation ID

**Headers:**
```
Authorization: Bearer <token>
```

**Response: 200 OK**
```json
{
  "id": 1,
  "appointment": {
    "id": 1,
    "appointmentTime": "2026-05-10T10:00:00",
    "status": "CONFIRMED",
    "doctor": {
      "id": 1,
      "user": {
        "id": 1,
        "email": "doctor@example.com",
        "fullName": "Dr. Sarah Smith"
      },
      "specialty": "Cardiology",
      "isverified": true
    },
    "patient": {
      "id": 5,
      "user": {
        "id": 5,
        "email": "patient@example.com",
        "fullName": "John Doe"
      }
    },
    "isFollowUp": false
  },
  "patientSymptoms": "Chest pain, shortness of breath",
  "aiReportSummary": "Patient presents with cardiac symptoms...",
  "dietRecommendations": "Low sodium diet, reduced caffeine"
}
```

**Response: 404 Not Found**
```json
{
  "error": "Consultation record not found with id: 999"
}
```

---

## Admin API

### Verify Doctor

**Endpoint:** `PUT /api/admin/verify-doctor/{id}`

**Path Parameters:**
- `id` (required, Long) - Doctor ID

**Headers:**
```
Authorization: Bearer <token>
```

**Authorization:**
- Only users with `ROLE_ADMIN` can access this endpoint
- Returns 403 Forbidden if user lacks admin role

**Response: 200 OK**
```json
"Doctor verified successfully!"
```

**Response: 404 Not Found**
```json
{
  "error": "Doctor not found with ID: 999"
}
```

**Response: 403 Forbidden**
```json
{
  "error": "Access Denied"
}
```

**Side Effects:**
- Sets `doctor.isverified = true`
- Doctor now appears in patient's verified doctors list
- Automatic welcome email sent to doctor

---

## Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PUT requests |
| 201 | Created | Successful POST (registration) |
| 400 | Bad Request | Invalid input, validation errors |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | User lacks required role |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Unexpected backend error |

---

## Data Models

### User Entity
```json
{
  "id": 1,
  "email": "user@example.com",
  "fullName": "John Doe",
  "password": "hashed_password",
  "role": "PATIENT"
}
```

**Fields:**
- `id` (Long) - Auto-generated primary key
- `email` (String) - Unique, used for login
- `fullName` (String) - User's full name
- `password` (String) - Bcrypt hashed
- `role` (Enum) - PATIENT, DOCTOR, ADMIN

---

### Doctor Entity
```json
{
  "id": 1,
  "user": { /* User object */ },
  "specialty": "Cardiology",
  "isverified": true
}
```

**Fields:**
- `id` (Long) - Primary key
- `user` (User) - One-to-one relationship
- `specialty` (String) - Medical specialty
- `isverified` (Boolean) - Admin approval status

**Valid Specialties:**
- Cardiology
- Dermatology
- Neurology
- Orthopedics
- Pediatrics
- General Medicine
- etc.

---

### Patient Entity
```json
{
  "id": 5,
  "user": { /* User object */ }
}
```

**Fields:**
- `id` (Long) - Primary key
- `user` (User) - One-to-one relationship

---

### Appointment Entity
```json
{
  "id": 1,
  "appointmentTime": "2026-05-15T14:30:00",
  "status": "CONFIRMED",
  "doctor": { /* Doctor object */ },
  "patient": { /* Patient object */ },
  "isFollowUp": false
}
```

**Fields:**
- `id` (Long) - Primary key
- `appointmentTime` (LocalDateTime) - When appointment is scheduled
- `status` (String) - CONFIRMED, CANCELLED, COMPLETED
- `doctor` (Doctor) - Many-to-one relationship
- `patient` (Patient) - Many-to-one relationship
- `isFollowUp` (Boolean) - Is this a follow-up appointment

---

### Consultation Entity
```json
{
  "id": 1,
  "appointment": { /* Appointment object */ },
  "patientSymptoms": "Chest pain, shortness of breath",
  "aiReportSummary": "Patient presents with...",
  "dietRecommendations": "Low sodium diet..."
}
```

**Fields:**
- `id` (Long) - Primary key
- `appointment` (Appointment) - One-to-one relationship
- `patientSymptoms` (String) - Patient's reported symptoms
- `aiReportSummary` (String) - AI-generated medical summary
- `dietRecommendations` (String) - Dietary advice

---

### Follow-up Entity
```json
{
  "id": 1,
  "email": "patient@example.com",
  "message": "Follow-up reminder...",
  "scheduledTime": "2026-05-18T14:30:00",
  "sent": false,
  "type": "FOLLOW_UP"
}
```

**Fields:**
- `id` (Long) - Primary key
- `email` (String) - Recipient email
- `message` (String) - Email body
- `scheduledTime` (LocalDateTime) - When to send
- `sent` (Boolean) - Whether email was sent
- `type` (String) - FOLLOW_UP, PATIENT, etc.

---

## Common Use Cases

### 1. Patient Books Appointment Flow

```
1. Patient logs in → GET /auth/login
   ↓
2. Patient views doctors → GET /doctors/verified
   ↓
3. Patient selects doctor and time
   ↓
4. Patient books appointment → POST /appointments/book
   ↓
5. System creates follow-up reminder (automatic)
   ↓
6. Doctor receives email notification (automatic)
```

### 2. Admin Approves Doctor Flow

```
1. Admin logs in → POST /auth/login
   ↓
2. Admin gets unverified doctors (need new API)
   ↓
3. Admin verifies doctor → PUT /admin/verify-doctor/{id}
   ↓
4. Doctor now appears in patient's list
   ↓
5. Doctor receives welcome email (automatic)
```

### 3. Patient Views Consultation History Flow

```
1. Patient logs in → POST /auth/login
   ↓
2. Patient views consultations → GET /v1/consultations/all
   ↓
3. Patient clicks specific consultation → GET /v1/consultations/{id}
   ↓
4. Patient sees doctor notes, AI summary, diet recommendations
```

---

## Rate Limiting

Currently **not implemented**. Add for production:
- 100 requests per minute per user
- 1000 requests per minute per IP

---

## Future Enhancements

- [ ] Token refresh endpoint
- [ ] Token expiry (24 hours)
- [ ] Update consultation endpoint
- [ ] Doctor availability schedule
- [ ] Appointment cancellation
- [ ] Patient appointment history
- [ ] Doctor appointment list
- [ ] Real-time notifications (WebSocket)
- [ ] Payment integration
- [ ] Prescription management

---

## Testing with cURL

```bash
# Register Patient
curl -X POST http://localhost:8080/api/auth/register/patient \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@test.com",
    "password": "Test123!",
    "fullName": "John Doe"
  }'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@test.com",
    "password": "Test123!"
  }'

# Get Verified Doctors (replace TOKEN)
curl -X GET http://localhost:8080/api/doctors/verified \
  -H "Authorization: Bearer TOKEN"

# Book Appointment (replace TOKEN)
curl -X POST http://localhost:8080/api/appointments/book \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorid": 1,
    "patientid": 5,
    "appointmentTime": "2026-05-15T14:30:00"
  }'
```

---

## Support

For issues or questions:
1. Check this reference document
2. Review the code comments
3. Check backend logs: `/backend/src/main/resources/application.properties`
4. Run Postman tests: `Clinical_System_API.postman_collection.json`

---

**Version:** 1.0.0  
**Last Updated:** April 30, 2026
