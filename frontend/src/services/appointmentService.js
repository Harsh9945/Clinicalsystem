import api from './api';

export const appointmentService = {
  getVerifiedDoctors: () =>
    api.get('/doctors/verified'),

  bookAppointment: (doctorId, patientId, appointmentTime, consultationType, paymentStatus, transactionId) =>
    api.post('/appointments/book', {
      doctorid: doctorId,
      patientid: patientId,
      appointmentTime,
      consultationType,
      paymentStatus,
      transactionId
    }),

  updateAppointmentSummary: (appointmentId, summary) =>
    api.post(`/appointments/${appointmentId}/summary`, { summary }),

  getAllConsultations: () =>
    api.get('/v1/consultations/all'),

  getConsultationById: (id) =>
    api.get(`/v1/consultations/${id}`),

  // Patient endpoints
  getPatientAppointments: () =>
    api.get('/patients/my-appointments'),

  getPatientConsultations: () =>
    api.get('/patients/my-consultations'),

  cancelAppointment: (id) =>
    api.put(`/patients/appointments/${id}/cancel`),

  // Doctor endpoints
  getDoctorAppointments: () =>
    api.get('/doctors/my-appointments'),

  getDoctorDetails: () =>
    api.get('/doctors/my-details'),

  getAppointmentDetails: (id) =>
    api.get(`/doctors/appointments/${id}`),

  // Admin endpoints
  getPendingDoctors: () =>
    api.get('/admin/pending-doctors'),

  getAllVerifiedDoctors: () =>
    api.get('/admin/doctors'),

  getDoctorAppointmentsByAdmin: (doctorId) =>
    api.get(`/admin/doctors/${doctorId}/appointments`),

  adminBookAppointment: (doctorId, patientEmail, patientName, appointmentTime) =>
    api.post('/admin/book-appointment', {
      doctorId,
      patientEmail,
      patientName,
      appointmentTime
    }),

  verifyDoctor: (doctorId) =>
    api.put(`/admin/verify-doctor/${doctorId}`),

  getDashboardStats: () =>
    api.get('/admin/dashboard-stats'),

  getAllDoctors: () =>
    api.get('/admin/all-doctors'),

  getAllPatients: () =>
    api.get('/admin/all-patients'),

  addClinicalNotes: (consultationId, doctorNotes, ePrescription) =>
    api.post(`/v1/consultations/${consultationId}/clinical-notes`, {
      doctorNotes,
      ePrescription
    }),

  scheduleFollowUp: (email, message, type, days) =>
    api.post('/v1/followup/schedule', {
      email,
      message,
      type,
      days
    })
};
