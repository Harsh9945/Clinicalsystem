import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { userService } from '../../services/userService';
import { VitalsModal } from './VitalsModal';
import { TriageChatWidget } from './TriageChatWidget';
import { 
  CalendarIcon, 
  ClipboardDocumentListIcon, 
  SparklesIcon, 
  VideoCameraIcon, 
  MapPinIcon,
  CheckBadgeIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export const PatientDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
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
      setError('Failed to load Clinova wellness data');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await appointmentService.cancelAppointment(appointmentId);
        setAppointments(appointments.map(a => a.id === appointmentId ? { ...a, status: 'CANCELLED' } : a));
      } catch (err) {
        setError('Cancellation failed');
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'CONFIRMED': 'bg-teal-50 text-teal-600 border-teal-100',
      'PENDING': 'bg-amber-50 text-amber-600 border-amber-100',
      'CANCELLED': 'bg-red-50 text-red-600 border-red-100',
      'COMPLETED': 'bg-blue-50 text-blue-600 border-blue-100'
    };
    return colors[status] || 'bg-slate-50 text-slate-400 border-slate-100';
  };

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  const isCallActive = (dateStr) => {
    const aptTime = new Date(dateStr).getTime();
    const now = new Date().getTime();
    return now >= aptTime - 15 * 60 * 1000 && now <= aptTime + 15 * 60 * 1000;
  };

  const handleVitalsSubmit = (vitals) => {
    setPatientVitals(vitals);
    setShowVitalsModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-12 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12 animate-fade-in">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div>
            <div className="flex items-center gap-2 text-teal-600 font-black tracking-widest text-[10px] uppercase mb-3">
              <CheckBadgeIcon className="w-4 h-4" />
              Patient Care Portal
            </div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none">Your Wellness Center</h1>
            <p className="mt-2 text-slate-400 font-medium text-lg italic">The future of personalized healthcare.</p>
          </div>
          <button 
            onClick={() => navigate('/patient/book-appointment')}
            className="btn-primary-clinova flex items-center gap-3 py-4 px-10 text-base group shadow-2xl shadow-teal-600/20"
          >
            New Appointment
            <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-100 p-8 rounded-[32px] shadow-sm animate-fade-in">
            <p className="text-red-700 font-bold">{error}</p>
          </div>
        )}

        {/* Top Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {profile && (
            <div className="glass-card p-10 bg-white flex items-center gap-8 md:col-span-1 shadow-xl shadow-slate-200/20">
              <div className="relative">
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=f1f5f9&color=94a3b8&size=150`} 
                  alt={profile.fullName}
                  className="w-20 h-20 rounded-[28px] border-4 border-white shadow-2xl"
                />
                <div className="absolute -bottom-1 -right-1 bg-teal-500 border-4 border-white w-7 h-7 rounded-full shadow-lg"></div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800 leading-tight">Hi, {profile.fullName.split(' ')[0]}</h3>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">{profile.email}</p>
              </div>
            </div>
          )}
          
          <div className="glass-card p-10 bg-gradient-to-br from-teal-500 to-teal-600 text-white flex justify-between items-center group cursor-default shadow-xl shadow-teal-600/20">
            <div>
              <p className="text-teal-100 text-[10px] font-black uppercase tracking-[0.3em] mb-3">Total Visits</p>
              <p className="text-5xl font-black">{appointments.length}</p>
            </div>
            <CalendarIcon className="w-16 h-16 opacity-30 group-hover:scale-110 transition-transform duration-500" />
          </div>

          <div className="glass-card p-10 bg-slate-800 text-white flex justify-between items-center group cursor-default shadow-xl shadow-slate-800/20">
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3">Medical Records</p>
              <p className="text-5xl font-black">{consultations.length}</p>
            </div>
            <ClipboardDocumentListIcon className="w-16 h-16 opacity-30 group-hover:scale-110 transition-transform duration-500" />
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
          
          {/* Appointments */}
          <div className="glass-card overflow-hidden flex flex-col bg-white">
            <div className="px-10 py-10 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <CalendarIcon className="w-6 h-6 text-teal-500" />
                Active Sessions
              </h2>
            </div>
            <div className="p-10 flex-1 overflow-y-auto bg-white space-y-6 max-h-[650px]">
              {appointments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 py-24 text-center">
                  <CalendarIcon className="w-20 h-20 mb-6" />
                  <p className="font-black uppercase tracking-[0.3em] text-[10px]">No active visits</p>
                </div>
              ) : (
                appointments.map((apt) => (
                  <div key={apt.id} className="bg-white border border-slate-100 rounded-[40px] p-10 shadow-sm hover:shadow-2xl hover:border-teal-100 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50/30 rounded-bl-[80px] -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                      <div className="flex items-center gap-6">
                        <img 
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(apt.doctor?.user?.fullName || 'Doctor')}&background=f8fafc&color=94a3b8&size=80`} 
                          alt={apt.doctor?.user?.fullName}
                          className="w-16 h-16 rounded-[24px] shadow-sm"
                        />
                        <div>
                          <h4 className="text-xl font-black text-slate-800 leading-none">Dr. {apt.doctor?.user?.fullName}</h4>
                          <div className="flex items-center gap-3 mt-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{apt.doctor?.specialty}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-teal-500 uppercase tracking-widest">
                              <MapPinIcon className="w-4 h-4" />
                              Clinova Center
                            </div>
                          </div>
                        </div>
                      </div>
                      <span className={`badge-clinova ${getStatusColor(apt.status)}`}>
                        {apt.status}
                      </span>
                    </div>
                    
                    <div className="mt-8 flex flex-wrap gap-4">
                      <span className={`px-4 py-1.5 text-[10px] font-black rounded-full border uppercase tracking-widest ${apt.consultationType === 'VIDEO' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                        {apt.consultationType === 'VIDEO' ? 'Virtual Consult' : 'Physical Session'}
                      </span>
                      {apt.paymentStatus === 'PAID' && (
                        <span className="px-4 py-1.5 text-[10px] font-black rounded-full border uppercase tracking-widest bg-emerald-50 text-emerald-600 border-emerald-100">
                          Securely Paid
                        </span>
                      )}
                    </div>

                    <div className="mt-10 flex flex-col sm:flex-row justify-between items-center gap-6 pt-8 border-t border-slate-50">
                      <p className="text-xs font-black text-slate-800 bg-slate-50 px-5 py-3 rounded-2xl shadow-inner">
                        {formatDateTime(apt.appointmentTime)}
                      </p>
                      <div className="flex items-center gap-4">
                        {(apt.status === 'CONFIRMED' || apt.status === 'PENDING') && (
                          <button onClick={() => handleCancel(apt.id)} className="text-[10px] font-black text-red-300 hover:text-red-500 uppercase tracking-widest px-6 py-3 rounded-2xl transition-all">Cancel</button>
                        )}
                        {(apt.status === 'CONFIRMED' || apt.status === 'PENDING') && apt.consultationType === 'VIDEO' && (
                          <button
                            onClick={() => navigate(`/video-call/${apt.id}`)}
                            disabled={!isCallActive(apt.appointmentTime)}
                            className={`flex items-center gap-3 text-xs font-black uppercase tracking-widest px-8 py-4 rounded-2xl transition-all shadow-xl ${
                              isCallActive(apt.appointmentTime) ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-teal-600/10' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                            }`}
                          >
                            <VideoCameraIcon className="w-5 h-5" />
                            Join Session
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Records */}
          <div className="glass-card overflow-hidden flex flex-col bg-white">
            <div className="px-10 py-10 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <ClipboardDocumentListIcon className="w-6 h-6 text-blue-500" />
                Medical Timeline
              </h2>
            </div>
            <div className="p-10 flex-1 overflow-y-auto bg-white space-y-8 max-h-[650px]">
              {consultations.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 py-24 text-center">
                  <ClipboardDocumentListIcon className="w-20 h-20 mb-6" />
                  <p className="font-black uppercase tracking-[0.3em] text-[10px]">No records found</p>
                </div>
              ) : (
                consultations.map((cons) => (
                  <div key={cons.id} className="bg-white border border-slate-50 rounded-[48px] p-10 shadow-sm hover:shadow-2xl transition-all relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/30 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform"></div>
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <h4 className="text-2xl font-black text-slate-800">Dr. {cons.appointment?.doctor?.user?.fullName}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                          {new Date(cons.completedAt).toLocaleDateString(undefined, {month: 'long', day: 'numeric', year: 'numeric'})}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-slate-50/50 p-6 rounded-[32px] border border-slate-50">
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Subjective Analysis</p>
                          <p className="text-xs font-bold text-slate-600 italic leading-relaxed">"{cons.patientSymptoms || 'N/A'}"</p>
                        </div>
                        <div className="bg-teal-50/30 p-6 rounded-[32px] border border-teal-50">
                          <p className="text-[9px] font-black text-teal-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <SparklesIcon className="w-3 h-3" /> AI Protocol
                          </p>
                          <p className="text-xs font-black text-teal-700 uppercase">{cons.predictedDisease || 'General Review'}</p>
                        </div>
                      </div>
                      <div className="bg-blue-50/30 p-8 rounded-[32px] border border-blue-50/50">
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-4">Practitioner Observations</p>
                        <p className="text-sm font-bold text-slate-700 leading-relaxed">
                          {cons.doctorNotes || 'Routine consultation records maintained.'}
                        </p>
                      </div>
                      {cons.ePrescription && (
                        <div className="bg-emerald-50/30 p-8 rounded-[32px] border border-emerald-50/50">
                          <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-4">Digital Prescription</p>
                          <p className="text-base font-black text-emerald-700 font-mono tracking-tighter">
                            {cons.ePrescription}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      <VitalsModal isOpen={showVitalsModal} onSubmit={handleVitalsSubmit} onSkip={() => setShowVitalsModal(false)} />
      <TriageChatWidget vitals={patientVitals} />
    </div>
  );
};
