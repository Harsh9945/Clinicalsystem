import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { userService } from '../../services/userService';
import { ClinicalNotesForm } from './ClinicalNotesForm';
import { 
  CalendarDaysIcon, 
  CheckCircleIcon, 
  ClipboardDocumentCheckIcon, 
  DocumentTextIcon, 
  VideoCameraIcon, 
  BuildingOfficeIcon,
  UserCircleIcon,
  BeakerIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export const DoctorDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [allConsultations, setAllConsultations] = useState([]);
  const [profile, setProfile] = useState(null);
  const [doctorDetails, setDoctorDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setError('');
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
      setError('Failed to load Clinova workspace data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  const isCallActive = (dateStr) => {
    const aptTime = new Date(dateStr).getTime();
    const now = new Date().getTime();
    return now >= aptTime - 15 * 60 * 1000 && now <= aptTime + 15 * 60 * 1000;
  };

  const isToday = (dateStr) => {
    const today = new Date();
    const date = new Date(dateStr);
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const todayAppointments = appointments.filter(a => isToday(a.appointmentTime) && (a.status === 'CONFIRMED' || a.status === 'PENDING'));
  const upcomingAppointments = appointments.filter(a => !isToday(a.appointmentTime) && new Date(a.appointmentTime) > new Date() && (a.status === 'CONFIRMED' || a.status === 'PENDING'));

  const getStatusColor = (status) => {
    const colors = {
      'CONFIRMED': 'bg-teal-50 text-teal-600 border-teal-100',
      'PENDING': 'bg-amber-50 text-amber-600 border-amber-100',
      'CANCELLED': 'bg-red-50 text-red-600 border-red-100',
      'COMPLETED': 'bg-blue-50 text-blue-600 border-blue-100'
    };
    return colors[status] || 'bg-slate-50 text-slate-400 border-slate-100';
  };

  const parseAISummary = (summaryStr) => {
    if (!summaryStr) return { score: 'N/A', disease: 'None', text: 'No AI intelligence available for this case.' };
    const scoreMatch = summaryStr.match(/AI Confidence:?\s*([0-9.]+%?)/i);
    const diseaseMatch = summaryStr.match(/Predicted Disease:?\s*([a-zA-Z\s]+)/i);
    return {
      score: scoreMatch ? scoreMatch[1] : 'N/A',
      disease: diseaseMatch ? diseaseMatch[1].trim() : 'Unknown',
      text: summaryStr
    };
  };

  const handleNotesComplete = () => {
    setSelectedAppointment(null);
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentConsultation = selectedAppointment 
    ? allConsultations.find(c => c.appointment?.id === selectedAppointment.id)
    : null;

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-8 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-600 font-black tracking-widest text-[10px] uppercase mb-2">
              <SparklesIcon className="w-4 h-4" />
              Physician Workspace
            </div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Clinova Command</h1>
            <p className="mt-1 text-slate-500 font-medium">Manage your daily queue and AI-assisted records.</p>
          </div>
          <div className="bg-white p-1.5 rounded-2xl border border-slate-100 flex shadow-sm">
            <button className="px-6 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg">Daily View</button>
            <button className="px-6 py-2.5 text-slate-400 text-xs font-black uppercase tracking-widest hover:text-slate-600 transition-colors">Analytics</button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 p-6 rounded-3xl shadow-sm">
            <p className="text-red-700 font-bold">{error}</p>
          </div>
        )}

        {/* Profile Card */}
        {profile && doctorDetails && (
          <div className="glass-card p-10 flex flex-col md:flex-row justify-between items-center gap-8 bg-white/95">
            <div className="flex items-center gap-8">
              <div className="relative">
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=f1f5f9&color=334155&size=200`} 
                  alt={profile.fullName}
                  className="w-24 h-24 rounded-[32px] border-4 border-white shadow-xl"
                />
                <div className="absolute -bottom-1 -right-1 bg-teal-500 border-4 border-white w-8 h-8 rounded-full shadow-lg"></div>
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-800">Dr. {profile.fullName}</h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                  <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">{profile.email}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                  <span className="text-teal-600 font-black tracking-[0.2em] uppercase text-[10px]">{doctorDetails.specialty} Specialist</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Authorization</p>
                <p className="text-sm font-black text-slate-600">{doctorDetails.isverified ? 'Certified Practitioner' : 'Review Pending'}</p>
              </div>
              <div className={`p-5 rounded-[24px] border flex items-center justify-center ${doctorDetails.isverified ? 'bg-teal-50 border-teal-100 text-teal-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                {doctorDetails.isverified ? <CheckCircleIcon className="w-7 h-7" /> : <SparklesIcon className="w-7 h-7 animate-pulse" />}
              </div>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          
          {/* Left Column: Queue */}
          <div className="xl:col-span-1 space-y-10">
            <div className="glass-card overflow-hidden bg-white/95">
              <div className="bg-slate-50/80 px-8 py-6 flex justify-between items-center border-b border-slate-100">
                <h2 className="text-base font-black text-slate-800 flex items-center gap-3">
                  <CalendarDaysIcon className="w-5 h-5 text-teal-500" />
                  Live Queue
                </h2>
                <span className="bg-teal-50 text-teal-600 text-[10px] font-black px-3 py-1 rounded-full border border-teal-100 uppercase">
                  {todayAppointments.length} Active
                </span>
              </div>
              <div className="p-3 space-y-2">
                {todayAppointments.length === 0 ? (
                  <div className="p-16 text-center opacity-30">
                    <CheckCircleIcon className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Queue Clear</p>
                  </div>
                ) : (
                  todayAppointments.map((apt) => (
                    <div 
                      key={apt.id} 
                      onClick={() => setSelectedAppointment(apt)}
                      className={`p-5 rounded-[28px] cursor-pointer transition-all duration-500 border ${
                        selectedAppointment?.id === apt.id 
                          ? 'bg-teal-600 border-teal-600 shadow-xl shadow-teal-600/10 -translate-y-1' 
                          : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <img 
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(apt.patient?.user?.fullName || 'Patient')}&background=${selectedAppointment?.id === apt.id ? 'fff' : 'f1f5f9'}&color=${selectedAppointment?.id === apt.id ? '0d9488' : '94a3b8'}&size=64`} 
                            alt={apt.patient?.user?.fullName}
                            className="w-12 h-12 rounded-2xl shadow-sm"
                          />
                          <div>
                            <h4 className={`text-base font-black tracking-tight ${selectedAppointment?.id === apt.id ? 'text-white' : 'text-slate-800'}`}>
                              {apt.patient?.user?.fullName}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] font-black tracking-widest uppercase ${selectedAppointment?.id === apt.id ? 'text-teal-200' : 'text-slate-400'}`}>
                                {formatDateTime(apt.appointmentTime).split(', ')[1]}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className={`w-1.5 h-1.5 rounded-full mt-2 ${selectedAppointment?.id === apt.id ? 'bg-white' : 'bg-teal-500'}`}></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="glass-card p-10 bg-white/95">
              <h2 className="text-base font-black text-slate-800 mb-8 flex items-center gap-3">
                <UserCircleIcon className="w-5 h-5 text-slate-400" />
                Next 24 Hours
              </h2>
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                {upcomingAppointments.length === 0 ? (
                  <p className="text-center text-slate-300 py-10 text-[10px] font-black uppercase tracking-[0.2em]">No Upcoming Shifts</p>
                ) : (
                  upcomingAppointments.map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-teal-100 transition-all group">
                      <div className="flex items-center gap-4">
                        <img 
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(apt.patient?.user?.fullName || 'Patient')}&background=fff&color=cbd5e1&size=64`} 
                          alt={apt.patient?.user?.fullName}
                          className="w-10 h-10 rounded-xl"
                        />
                        <div>
                          <h4 className="text-sm font-black text-slate-700">{apt.patient?.user?.fullName}</h4>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(apt.appointmentTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-slate-300 group-hover:text-teal-600 transition-colors">{formatDateTime(apt.appointmentTime).split(', ')[1]}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Case View */}
          <div className="xl:col-span-2">
            {selectedAppointment ? (
              <div className="space-y-10 animate-fade-in">
                
                <div className="glass-card p-12 bg-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-teal-50/50 rounded-bl-[120px] -z-10"></div>
                  <div className="flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-10">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedAppointment.patient?.user?.fullName || 'Patient')}&background=0369a1&color=fff&size=150`} 
                        alt={selectedAppointment.patient?.user?.fullName}
                        className="w-24 h-24 rounded-[36px] shadow-2xl border-4 border-white"
                      />
                      <div>
                        <h2 className="text-4xl font-black text-slate-800 tracking-tight leading-none">{selectedAppointment.patient?.user?.fullName}</h2>
                        <div className="flex flex-wrap items-center gap-5 mt-5">
                          <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">{selectedAppointment.patient?.user?.email}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                          <span className="text-slate-800 font-black text-xs uppercase tracking-widest">{formatDateTime(selectedAppointment.appointmentTime)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center md:items-end gap-5">
                      <div className="flex gap-2">
                        <span className={`badge-clinova ${selectedAppointment.consultationType === 'VIDEO' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                          {selectedAppointment.consultationType === 'VIDEO' ? 'Virtual' : 'On-Site'}
                        </span>
                        <span className={`badge-clinova ${getStatusColor(selectedAppointment.status)}`}>
                          {selectedAppointment.status}
                        </span>
                      </div>
                      
                      {(selectedAppointment.status === 'CONFIRMED' || selectedAppointment.status === 'PENDING') && selectedAppointment.consultationType === 'VIDEO' && (
                        <button
                          onClick={() => navigate(`/video-call/${selectedAppointment.id}`)}
                          disabled={!isCallActive(selectedAppointment.appointmentTime)}
                          className={`btn-primary-clinova px-10 py-4 text-xs font-black uppercase tracking-[0.2em] ${
                            isCallActive(selectedAppointment.appointmentTime) 
                              ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/10' 
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                          }`}
                        >
                          <VideoCameraIcon className="w-5 h-5" />
                          Launch Session
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {currentConsultation ? (
                  <div className="glass-card overflow-hidden bg-white">
                    <div className="bg-slate-50/80 px-10 py-8 flex items-center justify-between border-b border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="bg-teal-500 p-2.5 rounded-xl shadow-lg shadow-teal-500/20">
                          <BeakerIcon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800">Intelligence Engine</h3>
                      </div>
                      <div className="text-teal-600 text-[10px] font-black uppercase tracking-[0.3em]">Module Active</div>
                    </div>
                    
                    <div className="p-12">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
                        <div className="bg-slate-50/50 rounded-[40px] p-10 border border-slate-100 transition-all hover:bg-white hover:shadow-xl hover:border-blue-100 group">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 group-hover:text-blue-500 transition-colors">Triage Prediction</p>
                          <p className="text-3xl font-black text-slate-800">
                            {parseAISummary(currentConsultation.aiReportSummary).disease || currentConsultation.predictedDisease || 'Analyzing...'}
                          </p>
                        </div>
                        <div className="bg-slate-50/50 rounded-[40px] p-10 border border-slate-100 transition-all hover:bg-white hover:shadow-xl hover:border-teal-100 group">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 group-hover:text-teal-500 transition-colors">Confidence Index</p>
                          <p className="text-3xl font-black text-slate-800">{parseAISummary(currentConsultation.aiReportSummary).score}</p>
                        </div>
                      </div>

                      <div className="space-y-10">
                        <div>
                          <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-5 flex items-center gap-2">
                            <DocumentTextIcon className="w-4 h-4" />
                            Patient Symptomatology
                          </h4>
                          <div className="text-slate-600 leading-relaxed bg-slate-50/30 p-8 rounded-[32px] border border-slate-100 italic font-medium">
                            "{currentConsultation.patientSymptoms || 'No initial symptoms recorded by patient.'}"
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                            <SparklesIcon className="w-4 h-4" />
                            AI Directives
                          </h4>
                          <div className="text-slate-700 leading-relaxed bg-teal-50/20 p-8 rounded-[32px] border border-teal-50/50 whitespace-pre-wrap font-bold">
                            {currentConsultation.dietRecommendations || 'Awaiting specialist input for tailored recommendations.'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="glass-card p-16 text-center bg-amber-50/50 border-amber-100">
                    <BeakerIcon className="w-16 h-16 text-amber-300 mx-auto mb-6 opacity-40" />
                    <h3 className="text-xl font-black text-amber-900">Awaiting Triage Data</h3>
                    <p className="text-amber-700/60 max-w-sm mx-auto mt-2 font-black uppercase tracking-widest text-[10px]">
                      Patient has not initiated AI session
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-10">
                  {currentConsultation && !currentConsultation.doctorNotes ? (
                    <ClinicalNotesForm 
                      consultationId={currentConsultation.id} 
                      patientEmail={selectedAppointment.patient?.user?.email}
                      onComplete={handleNotesComplete}
                      onCancel={() => setSelectedAppointment(null)}
                    />
                  ) : currentConsultation?.doctorNotes ? (
                    <div className="glass-card overflow-hidden bg-white border-teal-100 shadow-xl shadow-teal-500/5">
                      <div className="bg-teal-500 px-12 py-8 flex items-center gap-4">
                        <CheckCircleIcon className="w-7 h-7 text-white" />
                        <h3 className="text-2xl font-black text-white tracking-tight">Clinical Record Finalized</h3>
                      </div>
                      <div className="p-12 space-y-10">
                        <div>
                          <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Professional Notes</h4>
                          <p className="text-slate-800 font-bold text-lg leading-relaxed">{currentConsultation.doctorNotes}</p>
                        </div>
                        {currentConsultation.ePrescription && (
                          <div className="bg-slate-50 p-10 rounded-[40px] border border-slate-100 shadow-inner">
                            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-5">Verified E-Prescription</h4>
                            <p className="text-teal-600 font-black font-mono text-2xl leading-relaxed tracking-tighter">
                              {currentConsultation.ePrescription}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  <div className="glass-card bg-white p-12">
                    <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
                      <ClipboardDocumentCheckIcon className="w-6 h-6 text-slate-300" />
                      Internal Assessment
                    </h3>
                    <textarea
                      className="w-full bg-slate-50/50 border-slate-100 rounded-[40px] p-8 focus:ring-8 focus:ring-teal-500/5 focus:border-teal-500 text-slate-700 font-bold transition-all outline-none"
                      rows="5"
                      placeholder="Enter private clinical observations..."
                      defaultValue={selectedAppointment.summary || ''}
                      onBlur={async (e) => {
                        const newSummary = e.target.value;
                        if (newSummary !== selectedAppointment.summary) {
                          try {
                            await appointmentService.updateAppointmentSummary(selectedAppointment.id, newSummary);
                            setSelectedAppointment({...selectedAppointment, summary: newSummary});
                            setAppointments(appointments.map(a => a.id === selectedAppointment.id ? {...a, summary: newSummary} : a));
                          } catch (err) {
                            console.error('Failed to update internal summary', err);
                          }
                        }
                      }}
                    />
                    <div className="flex items-center gap-3 mt-6">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></div>
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Synchronized to Cloud</p>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-20 text-center animate-fade-in bg-white/50 border-4 border-dashed border-slate-100 rounded-[80px]">
                <div className="bg-white p-12 rounded-full shadow-2xl mb-12 border border-slate-50">
                  <ClipboardDocumentCheckIcon className="w-24 h-24 text-slate-100" />
                </div>
                <h3 className="text-4xl font-black text-slate-800 tracking-tight">Awaiting Selection</h3>
                <p className="text-slate-400 mt-5 max-w-sm font-bold text-lg leading-relaxed">
                  Choose a patient from the queue to initiate a clinical review and access AI triage.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
