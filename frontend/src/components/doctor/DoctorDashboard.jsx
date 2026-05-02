import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { userService } from '../../services/userService';
import { ClinicalNotesForm } from './ClinicalNotesForm';
import { CalendarDaysIcon, CheckCircleIcon, ClipboardDocumentCheckIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export const DoctorDashboard = () => {
  // eslint-disable-next-line no-unused-vars
  const { user } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [allConsultations, setAllConsultations] = useState([]);
  const [profile, setProfile] = useState(null);
  const [doctorDetails, setDoctorDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Selection State
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appointmentsRes, profileRes, doctorDetailsRes, consultationsRes] = await Promise.all([
        appointmentService.getDoctorAppointments(),
        userService.getDoctorProfile(),
        appointmentService.getDoctorDetails(),
        appointmentService.getAllConsultations()
      ]);

      setAppointments(appointmentsRes.data);
      setProfile(profileRes.data);
      setDoctorDetails(doctorDetailsRes.data);
      setAllConsultations(consultationsRes.data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  const isToday = (dateStr) => {
    const today = new Date();
    const date = new Date(dateStr);
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const todayAppointments = appointments.filter(a => isToday(a.appointmentTime) && a.status === 'CONFIRMED');
  const upcomingAppointments = appointments.filter(a => !isToday(a.appointmentTime) && new Date(a.appointmentTime) > new Date() && a.status === 'CONFIRMED');

  const getStatusColor = (status) => {
    const colors = {
      'CONFIRMED': 'bg-teal-100 text-teal-800 border-teal-200',
      'CANCELLED': 'bg-red-100 text-red-800 border-red-200',
      'COMPLETED': 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[status] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const parseAISummary = (summaryStr) => {
    if (!summaryStr) return { score: 'N/A', disease: 'None', text: 'No summary available.' };
    
    // Attempt to extract if formatted correctly, otherwise return raw
    const scoreMatch = summaryStr.match(/AI Confidence:?\\s*([0-9.]+%?)/i);
    const diseaseMatch = summaryStr.match(/Predicted Disease:?\\s*([a-zA-Z\\s]+)/i);
    
    return {
      score: scoreMatch ? scoreMatch[1] : 'N/A',
      disease: diseaseMatch ? diseaseMatch[1].trim() : 'Unknown',
      text: summaryStr
    };
  };

  const handleNotesComplete = () => {
    setSelectedAppointment(null);
    fetchData(); // Refresh to show completed state
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Find corresponding consultation for selected appointment
  const currentConsultation = selectedAppointment 
    ? allConsultations.find(c => c.appointment?.id === selectedAppointment.id)
    : null;

  return (
    <div className="min-h-screen bg-slate-50 pt-8 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Doctor Dashboard</h1>
            <p className="mt-1 text-slate-500">Manage your daily queue and patient records.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Profile Card */}
        {profile && doctorDetails && (
          <div className="glass-card p-6 flex justify-between items-center bg-white shadow-sm rounded-xl">
            <div>
              <h3 className="text-2xl font-bold text-slate-800">Dr. {profile.fullName}</h3>
              <p className="text-slate-500">{profile.email} • <span className="font-medium text-slate-700">{doctorDetails.specialty}</span></p>
            </div>
            <div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${doctorDetails.isverified ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>
                {doctorDetails.isverified ? '✓ Verified' : '⏳ Pending Verification'}
              </span>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Column: Queue & Appointments */}
          <div className="xl:col-span-1 space-y-6">
            
            {/* Daily Queue */}
            <div className="glass-card bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-teal-600 px-6 py-4 border-b border-teal-700 flex justify-between items-center">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <CalendarDaysIcon className="w-5 h-5 text-teal-200" />
                  Today's Queue
                </h2>
                <span className="bg-teal-800 text-teal-100 text-xs font-bold px-2 py-1 rounded-md">
                  {todayAppointments.length}
                </span>
              </div>
              <div className="p-0 divide-y divide-slate-100">
                {todayAppointments.length === 0 ? (
                  <p className="p-6 text-center text-slate-500">No appointments for today.</p>
                ) : (
                  todayAppointments.map((apt) => (
                    <div 
                      key={apt.id} 
                      onClick={() => setSelectedAppointment(apt)}
                      className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${selectedAppointment?.id === apt.id ? 'bg-teal-50 border-l-4 border-teal-600' : 'border-l-4 border-transparent'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-semibold text-slate-800">{apt.patient?.user?.fullName}</h4>
                        <span className="text-xs text-slate-500">{formatDateTime(apt.appointmentTime).split(', ')[1]}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{apt.patient?.user?.email}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming (Future) */}
            <div className="glass-card bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-md font-bold text-slate-700">Upcoming</h2>
                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-md">
                  {upcomingAppointments.length}
                </span>
              </div>
              <div className="p-0 divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {upcomingAppointments.length === 0 ? (
                  <p className="p-4 text-center text-slate-500 text-sm">No future appointments.</p>
                ) : (
                  upcomingAppointments.map((apt) => (
                    <div key={apt.id} className="p-4 flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">{apt.patient?.user?.fullName}</h4>
                        <p className="text-xs text-slate-500">{new Date(apt.appointmentTime).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Right Column: AI Report & Clinical Notes */}
          <div className="xl:col-span-2">
            {selectedAppointment ? (
              <div className="space-y-6 animate-fade-in-up">
                
                {/* Header for selected patient */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex justify-between items-center border-l-4 border-l-teal-600">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">{selectedAppointment.patient?.user?.fullName}</h2>
                    <p className="text-slate-500">{selectedAppointment.patient?.user?.email} • {formatDateTime(selectedAppointment.appointmentTime)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(selectedAppointment.status)}`}>
                    {selectedAppointment.status}
                  </span>
                </div>

                {/* AI Triage Report */}
                {currentConsultation ? (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-2">
                      <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                      <h3 className="font-bold text-slate-800">AI Triage Report</h3>
                    </div>
                    
                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                          <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Predicted Disease</p>
                          <p className="text-lg font-bold text-slate-800 mt-1">{parseAISummary(currentConsultation.aiReportSummary).disease || currentConsultation.predictedDisease || 'Unknown'}</p>
                        </div>
                        <div className="bg-teal-50 border border-teal-100 rounded-lg p-4">
                          <p className="text-xs font-bold text-teal-600 uppercase tracking-wide">AI Confidence</p>
                          <p className="text-lg font-bold text-slate-800 mt-1">{parseAISummary(currentConsultation.aiReportSummary).score}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-bold text-slate-700 mb-2">Patient Symptoms</h4>
                          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            {currentConsultation.patientSymptoms || 'None recorded.'}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-700 mb-2">AI Diet/Recommendations</h4>
                          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                            {currentConsultation.dietRecommendations || 'None recorded.'}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-700 mb-2">Raw AI Transcript</h4>
                          <p className="text-xs text-slate-500 bg-slate-800 text-slate-300 p-3 rounded-lg font-mono overflow-y-auto max-h-40">
                            {parseAISummary(currentConsultation.aiReportSummary).text}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center text-yellow-800">
                    No consultation/triage record found for this appointment. The patient may not have used the AI chatbot yet.
                  </div>
                )}

                {/* Clinical Notes Form */}
                {currentConsultation && !currentConsultation.doctorNotes ? (
                  <ClinicalNotesForm 
                    consultationId={currentConsultation.id} 
                    patientEmail={selectedAppointment.patient?.user?.email}
                    onComplete={handleNotesComplete}
                    onCancel={() => setSelectedAppointment(null)}
                  />
                ) : currentConsultation?.doctorNotes ? (
                  <div className="bg-white rounded-xl shadow-sm border border-green-200 overflow-hidden">
                    <div className="bg-green-50 border-b border-green-200 px-6 py-4 flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      <h3 className="font-bold text-green-800">Finalized Clinical Notes</h3>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-700 mb-1">Doctor's Notes</h4>
                        <p className="text-sm text-slate-600">{currentConsultation.doctorNotes}</p>
                      </div>
                      {currentConsultation.ePrescription && (
                        <div>
                          <h4 className="text-sm font-bold text-slate-700 mb-1">E-Prescription</h4>
                          <p className="text-sm text-slate-600 font-mono bg-slate-50 p-3 rounded border border-slate-200">
                            {currentConsultation.ePrescription}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl p-12 bg-white/50">
                <ClipboardDocumentCheckIcon className="w-16 h-16 mb-4 text-slate-300" />
                <h3 className="text-lg font-medium text-slate-500">Select an appointment</h3>
                <p className="text-sm text-slate-400 text-center mt-2 max-w-sm">
                  Click on a patient from today's queue to view their AI Triage Report and write clinical notes.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
