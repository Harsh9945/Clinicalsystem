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
      fullName
    }, { params: { specialty } }),

  registerAdmin: (email, password, fullName) =>
    api.post('/auth/register/Admin', {
      email,
      password,
      fullName
    }),

  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  logout: () => {
    localStorage.removeItem('authToken');
  },

  // Extract user info from JWT token
  getUserFromToken: () => {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        email: payload.sub,
        role: (payload.roles?.[0]?.authority || payload.roles?.[0] || '').replace('ROLE_', '') || 'PATIENT'
      };
    } catch (e) {
      console.error('Invalid token');
      authService.logout();
      return null;
    }
  }
};
