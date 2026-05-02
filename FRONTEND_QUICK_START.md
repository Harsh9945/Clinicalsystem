# Frontend Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Clone & Install Backend

```bash
cd /Users/anaymahajan/Documents/Clinicalsystem/backend
./mvnw spring-boot:run
```

Backend runs at: `http://localhost:8080`

### Step 2: Create React Frontend

```bash
cd /Users/anaymahajan/Documents/Clinicalsystem
npx create-react-app frontend
cd frontend
npm install axios react-router-dom
```

### Step 3: Setup API Base Configuration

Create `src/services/api.js`:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
```

### Step 4: Create Login Component

Create `src/components/Login.jsx`:

```javascript
import { useState } from 'react';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('authToken', data.token);
      window.location.href = '/dashboard';
    } catch (err) {
      alert(err.response?.data?.error || 'Login failed');
    }
  };

  return (
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
  );
}
```

### Step 5: Create Appointment Booking Component

Create `src/components/BookAppointment.jsx`:

```javascript
import { useState, useEffect } from 'react';
import api from '../services/api';

export default function BookAppointment() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    api.get('/doctors/verified').then(res => setDoctors(res.data));
  }, []);

  const handleBook = async () => {
    try {
      await api.post('/appointments/book', {
        doctorid: selectedDoctor,
        patientid: 5, // Get from context/auth
        appointmentTime: time
      });
      alert('Appointment booked!');
    } catch (err) {
      alert(err.response?.data?.error);
    }
  };

  return (
    <div>
      <h2>Book Appointment</h2>
      <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)}>
        <option value="">Select Doctor</option>
        {doctors.map(doc => (
          <option key={doc.id} value={doc.id}>
            {doc.user.fullName} - {doc.specialty}
          </option>
        ))}
      </select>
      <input
        type="datetime-local"
        value={time}
        onChange={(e) => setTime(e.target.value)}
      />
      <button onClick={handleBook}>Book</button>
    </div>
  );
}
```

### Step 6: Update App.jsx

```javascript
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import BookAppointment from './components/BookAppointment';

function App() {
  const isLoggedIn = !!localStorage.getItem('authToken');

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/book"
          element={isLoggedIn ? <BookAppointment /> : <Navigate to="/login" />}
        />
        <Route path="/" element={<Navigate to={isLoggedIn ? '/book' : '/login'} />} />
      </Routes>
    </Router>
  );
}

export default App;
```

### Step 7: Run Frontend

```bash
npm start
```

Frontend runs at: `http://localhost:3000`

---

## 🧪 Test Flow

1. **Register Patient:**
   - Go to `http://localhost:3000/register`
   - Email: `patient@test.com`
   - Password: `Test123!`

2. **Login:**
   - Go to `http://localhost:3000/login`
   - Use credentials from step 1
   - Should redirect to `/book`

3. **Book Appointment:**
   - Select a verified doctor
   - Choose future date/time
   - Click Book
   - Should see success message

---

## 📋 Common Tasks

### Add Navigation
```javascript
// src/components/Navbar.jsx
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/appointments">My Appointments</Link>
      <button onClick={() => {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }}>
        Logout
      </button>
    </nav>
  );
}
```

### Add Error Toast
```javascript
import { useState } from 'react';

export default function useToast() {
  const [message, setMessage] = useState('');

  const show = (msg, duration = 3000) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), duration);
  };

  return { message, show };
}
```

### Format DateTime
```javascript
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
```

---

## 🔌 Using Postman

1. Download [Postman](https://www.postman.com/downloads/)
2. Import `Clinical_System_API.postman_collection.json`
3. Set `base_url`: `http://localhost:8080/api`
4. Get token from Login request
5. Set `token` variable with the response token
6. Test other endpoints

---

## 📦 Environment Setup (.env)

Create `.env` in `frontend/` root:

```env
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_JWT_KEY=authToken
```

Use in code:
```javascript
const API_URL = process.env.REACT_APP_API_URL;
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| **CORS Error** | Make sure backend is running with `@CrossOrigin` |
| **401 Unauthorized** | Check if token is in localStorage and being sent |
| **404 Not Found** | Verify endpoint URL and method (GET/POST) |
| **500 Server Error** | Check backend console for error details |
| **Token expires** | Implement token refresh or re-login |

---

## 📚 Next: Build Dashboard

Once basic auth works, build:

```javascript
// src/components/Dashboard.jsx
export default function Dashboard() {
  const [consultations, setConsultations] = useState([]);

  useEffect(() => {
    api.get('/v1/consultations/all').then(res => {
      setConsultations(res.data);
    });
  }, []);

  return (
    <div>
      <h1>My Consultations</h1>
      {consultations.map(c => (
        <div key={c.id}>
          <h3>Doctor: {c.appointment.doctor.user.fullName}</h3>
          <p>Symptoms: {c.patientSymptoms}</p>
          <p>AI Summary: {c.aiReportSummary}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## 🚢 Deployment Checklist

- [ ] Change `REACT_APP_API_URL` to production backend URL
- [ ] Add HTTPS
- [ ] Use environment-specific configs
- [ ] Add error logging (Sentry)
- [ ] Add analytics
- [ ] Set up CI/CD (GitHub Actions, Jenkins)
- [ ] Deploy to Vercel/Netlify/AWS

---

**Ready? Start with Step 1! 🎉**
