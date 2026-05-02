import api from './api';

export const userService = {
  getPatientProfile: () =>
    api.get('/patients/profile'),

  getDoctorProfile: () =>
    api.get('/doctors/profile')
};
