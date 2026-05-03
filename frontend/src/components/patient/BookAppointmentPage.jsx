import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { userService } from '../../services/userService';
import { PaymentModal } from '../shared/PaymentModal';
import { CalendarIcon, CheckCircleIcon, UserIcon, XMarkIcon, VideoCameraIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

export const BookAppointmentPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [patientId, setPatientId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Booking Modal State
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentTime, setAppointmentTime] = useState('');
  const [consultationType, setConsultationType] = useState('PHYSICAL');
  const [showPayment, setShowPayment] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    fetchDoctorsAndPatient();
  }, []);

  const fetchDoctorsAndPatient = async () => {
    try {
      setLoading(true);
      const [doctorsRes, profileRes] = await Promise.all([
        appointmentService.getVerifiedDoctors(),
        userService.getPatientProfile()
      ]);
      setDoctors(doctorsRes.data);
      setPatientId(profileRes.data.id);
    } catch (err) {
      setError('Failed to load available doctors.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // Minimum 30 minutes from now
    return now.toISOString().slice(0, 16);
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedDoctor || !appointmentTime) {
      setError('Please select an appointment time.');
      return;
    }

    // Instead of booking immediately, open the payment modal
    setShowPayment(true);
  };

  const processBooking = async (transactionId) => {
    setShowPayment(false);
    try {
      setBookingLoading(true);
      await appointmentService.bookAppointment(
        selectedDoctor.id,
        patientId,
        appointmentTime + ':00',
        consultationType,
        'PAID',
        transactionId
      );
      setBookingSuccess(true);
      setTimeout(() => {
        navigate('/patient/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to book appointment');
      setBookingLoading(false);
    }
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
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Our Specialists</h1>
          <p className="mt-4 text-lg text-slate-600">
            Select a verified doctor from our comprehensive network and instantly book your consultation.
          </p>
        </div>

        {error && !selectedDoctor && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md max-w-2xl mx-auto">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {doctors.map((doctor) => (
            <div key={doctor.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 overflow-hidden group">
              <div className="h-32 bg-gradient-to-r from-teal-500 to-blue-500"></div>
              <div className="px-6 pb-6 relative">
                {/* Doctor Avatar */}
                <div className="absolute -top-12 left-6 w-24 h-24 bg-white rounded-full p-1 shadow-md">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.user.fullName)}&background=0d9488&color=fff&size=150`} 
                    alt={doctor.user.fullName}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                
                <div className="pt-14">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Dr. {doctor.user.fullName}</h3>
                      <p className="text-teal-600 font-medium">{doctor.specialty}</p>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <CheckCircleIcon className="w-3 h-3" /> Verified
                    </span>
                  </div>
                  
                  <p className="text-slate-500 text-sm mb-6 flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    {doctor.user.email}
                  </p>

                  <button
                    onClick={() => setSelectedDoctor(doctor)}
                    className="w-full py-3 bg-slate-50 text-teal-700 font-semibold rounded-xl border border-teal-100 group-hover:bg-teal-600 group-hover:text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <CalendarIcon className="w-5 h-5" />
                    Book Appointment
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {doctors.length === 0 && !loading && (
          <div className="text-center py-20 text-slate-500">
            <UserIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <p className="text-xl">No doctors are currently available.</p>
          </div>
        )}

        {/* Booking Modal */}
        {selectedDoctor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
              
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-xl font-bold text-slate-800">Schedule Consultation</h3>
                <button 
                  onClick={() => setSelectedDoctor(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                {bookingSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircleIcon className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Booking Confirmed!</h3>
                    <p className="text-slate-500">Redirecting to your dashboard...</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4 mb-6 p-4 bg-teal-50 rounded-xl border border-teal-100">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedDoctor.user.fullName)}&background=0d9488&color=fff&size=100`} 
                        alt={selectedDoctor.user.fullName}
                        className="w-12 h-12 rounded-full shadow-sm"
                      />
                      <div>
                        <h4 className="font-bold text-slate-900">Dr. {selectedDoctor.user.fullName}</h4>
                        <p className="text-sm text-teal-700">{selectedDoctor.specialty}</p>
                      </div>
                    </div>

                    {error && (
                      <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleBookAppointment}>
                      <div className="mb-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Preferred Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-slate-700 bg-slate-50"
                          value={appointmentTime}
                          onChange={(e) => setAppointmentTime(e.target.value)}
                          min={getMinDateTime()}
                          required
                        />
                        <p className="text-xs text-slate-500 mt-2">
                          Appointments must be scheduled at least 30 minutes in advance.
                        </p>
                      </div>

                      <div className="mb-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Consultation Type
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <div 
                            onClick={() => setConsultationType('PHYSICAL')}
                            className={`cursor-pointer border rounded-xl p-3 flex items-center gap-3 transition-colors ${consultationType === 'PHYSICAL' ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                          >
                            <div className={`p-2 rounded-lg ${consultationType === 'PHYSICAL' ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-500'}`}>
                              <BuildingOfficeIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-slate-800">In-Person</p>
                              <p className="text-xs text-slate-500">₹{selectedDoctor.consultationFee || 100}</p>
                            </div>
                          </div>
                          <div 
                            onClick={() => setConsultationType('VIDEO')}
                            className={`cursor-pointer border rounded-xl p-3 flex items-center gap-3 transition-colors ${consultationType === 'VIDEO' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                          >
                            <div className={`p-2 rounded-lg ${consultationType === 'VIDEO' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                              <VideoCameraIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-slate-800">Video Call</p>
                              <p className="text-xs text-slate-500">₹{selectedDoctor.consultationFee || 100}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedDoctor(null)}
                          className="flex-1 py-3 px-4 text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={bookingLoading || !appointmentTime}
                          className="flex-1 py-3 px-4 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-semibold transition-colors shadow-md disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                          {bookingLoading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Processing...
                            </>
                          ) : (
                            'Proceed to Pay'
                          )}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Simulated Payment Gateway Modal */}
        <PaymentModal 
          isOpen={showPayment}
          amount={selectedDoctor?.consultationFee || 100}
          onClose={() => setShowPayment(false)}
          onSuccess={processBooking}
        />

      </div>
    </div>
  );
};
