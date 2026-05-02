import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { userService } from '../../services/userService';
import { VitalsModal } from './VitalsModal';
import { TriageChatWidget } from './TriageChatWidget';
import { CalendarIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

export const PatientDashboard = () => {
  // eslint-disable-next-line no-unused-vars
  const { user } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Vitals & Chat State
  const [showVitalsModal, setShowVitalsModal] = useState(true);
  const [patientVitals, setPatientVitals] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appointmentsRes, consultationsRes, profileRes] = await Promise.all([
        appointmentService.getPatientAppointments(),
        appointmentService.getPatientConsultations(),
        userService.getPatientProfile()
      ]);

      setAppointments(appointmentsRes.data);
      setConsultations(consultationsRes.data);
      setProfile(profileRes.data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await appointmentService.cancelAppointment(appointmentId);
        setAppointments(appointments.map(a => 
          a.id === appointmentId ? { ...a, status: 'CANCELLED' } : a
        ));
      } catch (err) {
        setError('Failed to cancel appointment');
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'CONFIRMED': 'bg-teal-100 text-teal-800 border-teal-200',
      'CANCELLED': 'bg-red-100 text-red-800 border-red-200',
      'COMPLETED': 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[status] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  const handleVitalsSubmit = (vitals) => {
    setPatientVitals(vitals);
    setShowVitalsModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-8 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header & Error */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Patient Dashboard</h1>
          <p className="mt-1 text-slate-500">Manage your appointments, history, and AI triage sessions.</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Profile & Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {profile && (
            <div className="glass-card p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Welcome, {profile.fullName}!</h3>
                <p className="text-slate-500 mt-1 text-sm">{profile.email}</p>
              </div>
              <div className="mt-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {profile.role}
                </span>
              </div>
            </div>
          )}
          
          <div className="bg-teal-600 rounded-2xl shadow-lg p-6 text-white flex flex-col justify-center items-center">
            <CalendarIcon className="w-8 h-8 mb-2 opacity-80" />
            <h4 className="text-teal-100 font-medium">Total Appointments</h4>
            <p className="text-4xl font-bold mt-1">{appointments.length}</p>
          </div>

          <div className="bg-blue-600 rounded-2xl shadow-lg p-6 text-white flex flex-col justify-center items-center">
            <ClipboardDocumentListIcon className="w-8 h-8 mb-2 opacity-80" />
            <h4 className="text-blue-100 font-medium">Consultations</h4>
            <p className="text-4xl font-bold mt-1">{consultations.length}</p>
          </div>
        </div>

        {/* Two Column Layout for Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Appointments Section */}
          <div className="glass-card overflow-hidden flex flex-col h-[500px]">
            <div className="bg-white px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-teal-600" />
                My Appointments
              </h2>
            </div>
            <div className="p-6 flex-1 overflow-y-auto bg-slate-50/50">
              {appointments.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No appointments scheduled.</p>
              ) : (
                <div className="space-y-4">
                  {appointments.map((apt) => (
                    <div key={apt.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-800">Dr. {apt.doctor?.user?.fullName}</h4>
                          <p className="text-sm text-slate-500">{apt.doctor?.specialty}</p>
                        </div>
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColor(apt.status)}`}>
                          {apt.status}
                        </span>
                      </div>
                      <div className="mt-4 flex justify-between items-center">
                        <p className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-md">
                          {formatDateTime(apt.appointmentTime)}
                        </p>
                        {apt.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleCancel(apt.id)}
                            className="text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Consultation History Section */}
          <div className="glass-card overflow-hidden flex flex-col h-[500px]">
            <div className="bg-white px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ClipboardDocumentListIcon className="w-5 h-5 text-blue-600" />
                Medical History
              </h2>
            </div>
            <div className="p-6 flex-1 overflow-y-auto bg-slate-50/50">
              {consultations.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No consultations yet.</p>
              ) : (
                <div className="space-y-4">
                  {consultations.map((cons) => (
                    <div key={cons.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-slate-800">Dr. {cons.appointment?.doctor?.user?.fullName}</h4>
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                          {new Date(cons.completedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Symptoms</p>
                          <p className="text-sm text-slate-700">{cons.patientSymptoms || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-1">AI Prediction</p>
                          <p className="text-sm text-slate-700">{cons.predictedDisease || 'None'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Doctor's Notes</p>
                          <p className="text-sm text-slate-700 bg-blue-50/50 p-2 rounded border border-blue-100">
                            {cons.doctorNotes || 'No notes provided.'}
                          </p>
                        </div>
                        {cons.ePrescription && (
                          <div>
                            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">E-Prescription</p>
                            <p className="text-sm text-slate-700 bg-green-50/50 p-2 rounded border border-green-100">
                              {cons.ePrescription}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Global Modals & Widgets */}
      <VitalsModal 
        isOpen={showVitalsModal} 
        onSubmit={handleVitalsSubmit} 
        onSkip={() => setShowVitalsModal(false)} 
      />
      <TriageChatWidget vitals={patientVitals} />
    </div>
  );
};
