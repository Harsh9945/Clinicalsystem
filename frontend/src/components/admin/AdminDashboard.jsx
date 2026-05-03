import React, { useState, useEffect } from 'react';
import { appointmentService } from '../../services/appointmentService';
import { 
  UsersIcon, 
  UserGroupIcon, 
  CalendarIcon, 
  ClockIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ChartPieIcon,
  ChartBarIcon,
  PlusCircleIcon,
  SparklesIcon,
  ShieldCheckIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#0d9488', '#3b82f6', '#f59e0b', '#ef4444']; 

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const [allSystemDoctors, setAllSystemDoctors] = useState([]);
  const [allSystemPatients, setAllSystemPatients] = useState([]);
  const [userMgmtLoading, setUserMgmtLoading] = useState(false);

  const [allDoctors, setAllDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [doctorAppointments, setDoctorAppointments] = useState([]);
  const [bookingForm, setBookingForm] = useState({ patientName: '', patientEmail: '', appointmentTime: '' });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'reception' && allDoctors.length === 0) fetchDoctors();
    if (activeTab === 'all_users' && allSystemDoctors.length === 0 && allSystemPatients.length === 0) fetchAllUsers();
  }, [activeTab]);

  useEffect(() => {
    if (selectedDoctorId) fetchDoctorAppointments(selectedDoctorId);
    else setDoctorAppointments([]);
  }, [selectedDoctorId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, doctorsRes] = await Promise.all([
        appointmentService.getDashboardStats(),
        appointmentService.getPendingDoctors()
      ]);
      setStats(statsRes.data);
      setPendingDoctors(doctorsRes.data);
    } catch (err) {
      setError('Failed to load Clinova command data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await appointmentService.getAllVerifiedDoctors();
      setAllDoctors(res.data);
    } catch (err) {
      setBookingError('Failed to load verified practitioners');
    }
  };

  const fetchAllUsers = async () => {
    try {
      setUserMgmtLoading(true);
      const [docsRes, patsRes] = await Promise.all([
        appointmentService.getAllDoctors(),
        appointmentService.getAllPatients()
      ]);
      setAllSystemDoctors(docsRes.data);
      setAllSystemPatients(patsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setUserMgmtLoading(false);
    }
  };

  const fetchDoctorAppointments = async (doctorId) => {
    try {
      const res = await appointmentService.getDoctorAppointmentsByAdmin(doctorId);
      setDoctorAppointments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyDoctor = async (doctorId) => {
    try {
      await appointmentService.verifyDoctor(doctorId);
      setSuccessMessage('Practitioner verified successfully!');
      setPendingDoctors(pendingDoctors.filter(d => d.id !== doctorId));
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchData();
    } catch (err) {
      setError('Authorization failed');
    }
  };

  const handleBookOnBehalf = async (e) => {
    e.preventDefault();
    setBookingError('');
    if (!selectedDoctorId) {
      setBookingError('Please select a doctor.');
      return;
    }
    
    try {
      setBookingLoading(true);
      await appointmentService.adminBookAppointment(
        selectedDoctorId,
        bookingForm.patientEmail,
        bookingForm.patientName,
        bookingForm.appointmentTime + ':00'
      );
      
      setSuccessMessage(`Session confirmed for ${bookingForm.patientName}`);
      setTimeout(() => setSuccessMessage(''), 4000);
      setBookingForm({ patientName: '', patientEmail: '', appointmentTime: '' });
      fetchDoctorAppointments(selectedDoctorId);
      fetchData();
    } catch (err) {
      setBookingError(err.response?.data?.error || 'Booking restriction triggered');
    } finally {
      setBookingLoading(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return now.toISOString().slice(0, 16);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const userDistributionData = stats ? [
    { name: 'Authorized Doctors', value: stats.totalDoctors - stats.pendingDoctors },
    { name: 'Pending Review', value: stats.pendingDoctors },
    { name: 'Total Patients', value: stats.totalPatients }
  ] : [];

  const appointmentData = stats ? [
    { name: 'Completed', count: stats.completedConsultations || 0 },
    { name: 'Scheduled', count: Math.max(0, stats.totalAppointments - (stats.completedConsultations || 0)) }
  ] : [];

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-8 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10 animate-fade-in">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-2 text-teal-600 font-black tracking-widest text-[10px] uppercase mb-2">
              <ShieldCheckIcon className="w-4 h-4" />
              System Administration
            </div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Clinova Command</h1>
            <p className="mt-1 text-slate-500 font-medium">Enterprise oversight and medical staff authorization.</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 text-center min-w-[120px] shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">System Load</p>
              <p className="text-xl font-black text-teal-500 leading-none">Optimal</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 p-6 rounded-3xl shadow-sm flex items-center gap-4 animate-fade-in">
            <XCircleIcon className="w-8 h-8 text-red-400" />
            <p className="text-red-700 font-bold">{error}</p>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-teal-50 border border-teal-100 p-6 rounded-3xl shadow-sm flex items-center gap-4 animate-fade-in">
            <CheckCircleIcon className="w-8 h-8 text-teal-400" />
            <p className="text-teal-700 font-bold">{successMessage}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="bg-white p-2 rounded-[28px] border border-slate-100 shadow-sm overflow-x-auto">
          <nav className="flex whitespace-nowrap gap-1">
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<ChartPieIcon className="w-5 h-5" />} label="Overview" />
            <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<ShieldCheckIcon className="w-5 h-5" />} label="Verification" badge={pendingDoctors.length} />
            <TabButton active={activeTab === 'all_users'} onClick={() => setActiveTab('all_users')} icon={<UserGroupIcon className="w-5 h-5" />} label="Master Directory" />
            <TabButton active={activeTab === 'reception'} onClick={() => setActiveTab('reception')} icon={<PlusCircleIcon className="w-5 h-5" />} label="Reception Hub" />
            <TabButton active={activeTab === 'scheduling'} onClick={() => setActiveTab('scheduling')} icon={<ClockIcon className="w-5 h-5" />} label="Scheduling" beta />
          </nav>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-10 animate-fade-in">
            {/* Stats Grid */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard icon={<UserGroupIcon />} label="Medical Staff" value={stats.totalDoctors} color="teal" />
                <StatCard icon={<UsersIcon />} label="Patient Registry" value={stats.totalPatients} color="blue" />
                <StatCard icon={<CalendarIcon />} label="Global Sessions" value={stats.totalAppointments} color="indigo" />
                <StatCard icon={<CpuChipIcon />} label="Pending Auth" value={stats.pendingDoctors} color="amber" />
              </div>
            )}

            {/* Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="glass-card p-10">
                <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
                  <ChartPieIcon className="w-6 h-6 text-teal-500" /> User Distribution
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={userDistributionData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value">
                        {userDistributionData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                      </Pie>
                      <RechartsTooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)'}} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-6 mt-8">
                  {userDistributionData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-10">
                <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
                  <ChartBarIcon className="w-6 h-6 text-teal-500" /> Appointment Metrics
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={appointmentData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}} />
                      <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)'}} />
                      <Bar dataKey="count" fill="#14b8a6" radius={[10, 10, 0, 0]} barSize={60} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="glass-card overflow-hidden animate-fade-in">
            <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <ShieldCheckIcon className="w-6 h-6 text-teal-500" />
                Authorization Queue
              </h3>
            </div>
            
            {pendingDoctors.length === 0 ? (
              <div className="p-24 text-center">
                <div className="bg-teal-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircleIcon className="w-12 h-12 text-teal-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-800">Queue is Clear</h3>
                <p className="text-slate-500 mt-2 max-w-sm mx-auto font-medium">All staff credentials have been processed.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-10 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Practitioner</th>
                      <th className="px-10 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Field</th>
                      <th className="px-10 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {pendingDoctors.map((doctor) => (
                      <tr key={doctor.id} className="group hover:bg-slate-50/30 transition-colors">
                        <td className="px-10 py-6 whitespace-nowrap">
                          <div className="flex items-center">
                            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.user.fullName)}&background=f1f5f9&color=334155&size=80`} className="h-12 w-12 rounded-2xl mr-4" alt="" />
                            <div>
                              <div className="text-base font-black text-slate-800">Dr. {doctor.user.fullName}</div>
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{doctor.user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-6 whitespace-nowrap">
                          <span className="badge-clinova bg-blue-50 text-blue-600 border-blue-100">{doctor.specialty}</span>
                        </td>
                        <td className="px-10 py-6 whitespace-nowrap text-right">
                          <button onClick={() => handleVerifyDoctor(doctor.id)} className="btn-primary-clinova text-xs px-6 py-2.5">Authorize Access</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Directory Section */}
        {activeTab === 'all_users' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 animate-fade-in">
            <DirectorySection title="Practitioner Registry" data={allSystemDoctors} icon={<UserGroupIcon className="text-teal-500" />} type="doctor" />
            <DirectorySection title="Patient Registry" data={allSystemPatients} icon={<UsersIcon className="text-blue-500" />} type="patient" />
          </div>
        )}

        {/* Reception Hub */}
        {activeTab === 'reception' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-fade-in">
            <div className="lg:col-span-1">
              <div className="glass-card p-10 bg-white">
                <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
                  <PlusCircleIcon className="w-6 h-6 text-teal-500" /> Administrative Booking
                </h3>
                <form onSubmit={handleBookOnBehalf} className="space-y-6">
                  <FormInput label="Assigned Practitioner" type="select" options={allDoctors.map(d => ({value: d.id, label: `Dr. ${d.user.fullName} (${d.specialty})`}))} value={selectedDoctorId} onChange={(v) => setSelectedDoctorId(v)} />
                  <FormInput label="Patient Identity" placeholder="Full legal name" value={bookingForm.patientName} onChange={(v) => setBookingForm({...bookingForm, patientName: v})} />
                  <FormInput label="Patient Contact" type="email" placeholder="email@address.com" value={bookingForm.patientEmail} onChange={(v) => setBookingForm({...bookingForm, patientEmail: v})} />
                  <FormInput label="Session Time" type="datetime-local" min={getMinDateTime()} value={bookingForm.appointmentTime} onChange={(v) => setBookingForm({...bookingForm, appointmentTime: v})} />
                  <button type="submit" disabled={bookingLoading} className="w-full btn-primary-clinova py-4 text-lg">
                    {bookingLoading ? 'Processing...' : 'Confirm Session'}
                  </button>
                </form>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="glass-card overflow-hidden flex flex-col h-full bg-white">
                <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-xl font-black text-slate-800">Practitioner Schedule</h3>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time Feed</span>
                </div>
                <div className="p-8 flex-1 bg-white">
                  {!selectedDoctorId ? (
                    <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200 opacity-50">
                      <CalendarIcon className="w-16 h-16 text-slate-300 mb-4" />
                      <p className="font-black uppercase tracking-widest text-[10px] text-slate-400">Awaiting Selection</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {doctorAppointments.map(apt => (
                        <div key={apt.id} className="bg-white p-6 rounded-[32px] border border-slate-100 flex justify-between items-center group hover:border-teal-200 hover:shadow-lg hover:shadow-teal-500/5 transition-all">
                          <div className="flex items-center gap-6">
                            <div className="bg-slate-100 text-slate-800 p-4 rounded-2xl min-w-[100px] text-center group-hover:bg-teal-500 group-hover:text-white transition-colors">
                              <p className="text-[10px] font-black uppercase mb-1">{new Date(apt.appointmentTime).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</p>
                              <p className="text-base font-black">{new Date(apt.appointmentTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</p>
                            </div>
                            <div>
                              <p className="text-lg font-black text-slate-800">{apt.patient.user.fullName}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none mt-1">{apt.patient.user.email}</p>
                            </div>
                          </div>
                          <span className={`badge-clinova ${apt.status === 'CONFIRMED' ? 'bg-teal-50 text-teal-600 border-teal-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{apt.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scheduling (Beta) */}
        {activeTab === 'scheduling' && (
          <div className="glass-card p-24 text-center bg-white relative overflow-hidden">
             <div className="bg-indigo-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
               <SparklesIcon className="w-10 h-10 text-indigo-500 animate-pulse" />
             </div>
             <h3 className="text-3xl font-black text-slate-800">Staff Orchestration</h3>
             <p className="text-slate-500 mt-4 max-w-md mx-auto font-medium text-lg leading-relaxed">
               The Clinova Staff Scheduling module is currently being calibrated for peak efficiency. 
               Coming soon to your command center.
             </p>
          </div>
        )}

      </div>
    </div>
  );
};

// UI Components
const TabButton = ({ active, onClick, icon, label, badge, beta }) => (
  <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 font-bold text-sm transition-all rounded-2xl ${
    active ? 'bg-teal-600 text-white shadow-xl shadow-teal-600/20' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
  }`}>
    {icon}
    {label}
    {badge > 0 && <span className={`${active ? 'bg-white text-teal-600' : 'bg-teal-50 text-teal-600'} text-[10px] font-black px-2 py-0.5 rounded-full`}>{badge}</span>}
    {beta && <span className={`${active ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'} text-[9px] font-black px-1.5 py-0.5 rounded border border-current/20 uppercase tracking-tighter`}>Beta</span>}
  </button>
);

const StatCard = ({ icon, label, value, color }) => {
  const colors = {
    teal: 'bg-teal-50 text-teal-500',
    blue: 'bg-blue-50 text-blue-500',
    indigo: 'bg-indigo-50 text-indigo-500',
    amber: 'bg-amber-50 text-amber-500'
  };
  return (
    <div className="glass-card p-8 bg-white group hover:scale-[1.02] transition-all cursor-default">
      <div className={`p-4 rounded-2xl w-14 h-14 flex items-center justify-center mb-6 shadow-sm ${colors[color]}`}>
        {React.cloneElement(icon, { className: 'w-7 h-7' })}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
      <p className="text-4xl font-black text-slate-800">{value}</p>
    </div>
  );
};

const DirectorySection = ({ title, data, icon, type }) => (
  <div className="glass-card overflow-hidden bg-white">
    <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
      <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">{icon} {title}</h3>
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{data.length} Total</span>
    </div>
    <div className="overflow-x-auto max-h-[500px]">
      <table className="min-w-full divide-y divide-slate-50">
        <tbody className="divide-y divide-slate-50">
          {data.map(user => (
            <tr key={user.id} className="hover:bg-slate-50/30 transition-colors">
              <td className="px-10 py-6 whitespace-nowrap">
                <div className="flex items-center">
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.user.fullName)}&background=f8fafc&color=94a3b8&size=80`} className="h-10 w-10 rounded-xl mr-4" alt="" />
                  <div>
                    <div className="text-sm font-black text-slate-800">{type==='doctor'?'Dr. ':''}{user.user.fullName}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user.user.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-10 py-6 whitespace-nowrap">
                {type==='doctor' ? <span className="badge-clinova bg-teal-50 text-teal-600 border-teal-100">{user.specialty}</span> : <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Resident Patient</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const FormInput = ({ label, type = 'text', placeholder, value, onChange, options = [] }) => (
  <div>
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{label}</label>
    {type === 'select' ? (
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-slate-50/50 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 outline-none transition-all">
        <option value="">Choose Option...</option>
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    ) : (
      <input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-slate-50/50 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 outline-none transition-all" />
    )}
  </div>
);
