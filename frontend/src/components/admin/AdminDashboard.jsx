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
  PlusCircleIcon
} from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#0d9488', '#3b82f6', '#f59e0b', '#ef4444']; // teal, blue, amber, red

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Tabs
  const [activeTab, setActiveTab] = useState('overview');

  // Reception / Booking State
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
    if (activeTab === 'reception' && allDoctors.length === 0) {
      fetchDoctors();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedDoctorId) {
      fetchDoctorAppointments(selectedDoctorId);
    } else {
      setDoctorAppointments([]);
    }
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
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await appointmentService.getAllVerifiedDoctors();
      setAllDoctors(res.data);
    } catch (err) {
      setBookingError('Failed to load verified doctors');
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
      setSuccessMessage('Doctor verified successfully!');
      setPendingDoctors(pendingDoctors.filter(d => d.id !== doctorId));
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchData(); // Refresh stats
    } catch (err) {
      setError('Failed to verify doctor');
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
      
      setSuccessMessage(`Appointment successfully booked for ${bookingForm.patientName}!`);
      setTimeout(() => setSuccessMessage(''), 4000);
      
      // Reset form and refresh schedule
      setBookingForm({ patientName: '', patientEmail: '', appointmentTime: '' });
      fetchDoctorAppointments(selectedDoctorId);
      fetchData(); // Refresh stats
    } catch (err) {
      setBookingError(err.response?.data?.error || err.response?.data || 'Failed to book appointment.');
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
        <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Mock Analytics Data based on stats
  const userDistributionData = stats ? [
    { name: 'Verified Doctors', value: stats.totalDoctors - stats.pendingDoctors },
    { name: 'Pending Doctors', value: stats.pendingDoctors },
    { name: 'Patients', value: stats.totalPatients }
  ] : [];

  const appointmentData = stats ? [
    { name: 'Active/Completed', count: stats.completedConsultations || 12 },
    { name: 'Upcoming', count: stats.totalAppointments - (stats.completedConsultations || 12) }
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50 pt-8 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UsersIcon className="w-8 h-8 text-teal-600" />
            Admin Dashboard
          </h1>
          <p className="mt-1 text-slate-500">System health, user management, and metrics overview.</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-center gap-2">
            <XCircleIcon className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md flex items-center gap-2 animate-fade-in-up">
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
            <p className="text-green-700">{successMessage}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-slate-200 overflow-x-auto">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${activeTab === 'overview' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Overview & Analytics
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`${activeTab === 'users' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2`}
            >
              Doctor Verification
              {pendingDoctors.length > 0 && (
                <span className="bg-amber-100 text-amber-700 py-0.5 px-2 rounded-full text-xs">{pendingDoctors.length}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('reception')}
              className={`${activeTab === 'reception' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2`}
            >
              Reception & Booking
            </button>
            <button
              onClick={() => setActiveTab('scheduling')}
              className={`${activeTab === 'scheduling' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Staff Scheduling (Beta)
            </button>
          </nav>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in-up">
            {/* Stats Grid */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
                  <div className="p-3 bg-teal-50 text-teal-600 rounded-lg"><UserGroupIcon className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Doctors</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.totalDoctors}</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><UsersIcon className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Patients</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.totalPatients}</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><CalendarIcon className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Appointments</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.totalAppointments}</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><ClockIcon className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Pending Approvals</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.pendingDoctors}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <ChartPieIcon className="w-5 h-5 text-teal-600" /> User Distribution
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={userDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {userDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 text-sm mt-4">
                  {userDistributionData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-slate-600">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <ChartBarIcon className="w-5 h-5 text-blue-600" /> Appointment Metrics
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={appointmentData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <RechartsTooltip cursor={{fill: '#f8fafc'}} />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Doctors Pending Verification</h3>
            </div>
            
            {pendingDoctors.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircleIcon className="w-12 h-12 text-teal-200 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-slate-900">All caught up!</h3>
                <p className="text-slate-500 mt-1">There are no doctors waiting for verification.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Doctor</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Specialty</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {pendingDoctors.map((doctor) => (
                      <tr key={doctor.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center font-bold text-lg">
                              {doctor.user.fullName.charAt(0)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-slate-900">Dr. {doctor.user.fullName}</div>
                              <div className="text-sm text-slate-500">{doctor.user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                            {doctor.specialty}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            Pending
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleVerifyDoctor(doctor.id)}
                            className="text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-md transition-colors shadow-sm"
                          >
                            Verify Doctor
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reception' && (
          <div className="animate-fade-in-up grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Booking Form */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <PlusCircleIcon className="w-5 h-5 text-teal-600" />
                  Book on Behalf
                </h3>
                
                {bookingError && (
                  <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100">
                    {bookingError}
                  </div>
                )}

                <form onSubmit={handleBookOnBehalf} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Doctor</label>
                    <select
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-slate-700"
                      value={selectedDoctorId}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Doctor --</option>
                      {allDoctors.map(doc => (
                        <option key={doc.id} value={doc.id}>
                          Dr. {doc.user.fullName} ({doc.specialty})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Patient Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-slate-700"
                      value={bookingForm.patientName}
                      onChange={(e) => setBookingForm({...bookingForm, patientName: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Patient Email</label>
                    <input
                      type="email"
                      required
                      placeholder="jane@example.com"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-slate-700"
                      value={bookingForm.patientEmail}
                      onChange={(e) => setBookingForm({...bookingForm, patientEmail: e.target.value})}
                    />
                    <p className="text-xs text-slate-500 mt-1">If new, an account will be created automatically.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      min={getMinDateTime()}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-slate-700"
                      value={bookingForm.appointmentTime}
                      onChange={(e) => setBookingForm({...bookingForm, appointmentTime: e.target.value})}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={bookingLoading || !selectedDoctorId}
                    className="w-full py-3 px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex justify-center items-center gap-2"
                  >
                    {bookingLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : 'Confirm Booking'}
                  </button>
                </form>
              </div>
            </div>

            {/* Doctor Schedule View */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <h3 className="text-lg font-bold text-slate-800">
                    {selectedDoctorId 
                      ? `Schedule: Dr. ${allDoctors.find(d => d.id.toString() === selectedDoctorId.toString())?.user.fullName}`
                      : 'Doctor Schedule'
                    }
                  </h3>
                </div>
                
                <div className="p-6 flex-1 bg-slate-50/50">
                  {!selectedDoctorId ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <CalendarIcon className="w-16 h-16 mb-4 text-slate-200" />
                      <p>Select a doctor to view their scheduled appointments.</p>
                    </div>
                  ) : doctorAppointments.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-white rounded-lg border border-slate-100 p-8">
                      <p>No appointments scheduled for this doctor yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {doctorAppointments.map((apt) => (
                        <div key={apt.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center hover:border-teal-300 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="bg-teal-100 text-teal-800 p-3 rounded-lg text-center min-w-[80px]">
                              <p className="text-xs font-bold uppercase">{new Date(apt.appointmentTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                              <p className="text-sm font-black">{new Date(apt.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{apt.patient.user.fullName}</p>
                              <p className="text-sm text-slate-500">{apt.patient.user.email}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                            apt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {apt.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'scheduling' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center animate-fade-in-up">
            <CalendarIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800">Staff Scheduling is in Development</h3>
            <p className="text-slate-500 mt-2 max-w-md mx-auto">
              This module will allow you to manage clinic operating hours, doctor shifts, and time-off requests. 
              The backend data models are currently being finalized.
            </p>
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg max-w-md mx-auto text-left">
              <h4 className="font-semibold text-blue-800 text-sm mb-2">Planned Features:</h4>
              <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
                <li>Global clinic opening/closing hours</li>
                <li>Doctor-specific shift assignment</li>
                <li>Holiday and leave management</li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
