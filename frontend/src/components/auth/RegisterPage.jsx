import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { 
  SparklesIcon, 
  EnvelopeIcon, 
  LockClosedIcon, 
  UserIcon, 
  AcademicCapIcon 
} from '@heroicons/react/24/outline';

export const RegisterPage = () => {
  const [activeTab, setActiveTab] = useState('patient');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    specialty: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!formData.email || !formData.password || !formData.fullName) {
        throw new Error('Please fill in all mandatory fields');
      }
      if (formData.password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      const result = await register(
        formData.email,
        formData.password,
        formData.fullName,
        activeTab.toUpperCase(),
        formData.specialty
      );

      setSuccess(result.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-xl animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center bg-teal-600 p-3 rounded-2xl mb-4 shadow-lg shadow-teal-600/20">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Create your account</h2>
          <p className="text-slate-500 mt-2">Join the next generation of healthcare</p>
        </div>

        <div className="glass-card p-10 bg-white shadow-2xl">
          {/* Custom Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-2xl mb-10">
            <button
              onClick={() => setActiveTab('patient')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'patient' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <UserIcon className="w-5 h-5" />
              Patient
            </button>
            <button
              onClick={() => setActiveTab('doctor')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'doctor' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <AcademicCapIcon className="w-5 h-5" />
              Doctor
            </button>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl">
              <p className="text-sm text-red-700 font-bold">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-8 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-xl">
              <p className="text-sm text-green-700 font-bold">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border-slate-200 rounded-xl focus:ring-teal-500 focus:border-teal-500 text-sm transition-all"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border-slate-200 rounded-xl focus:ring-teal-500 focus:border-teal-500 text-sm transition-all"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {activeTab === 'doctor' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Specialty</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <AcademicCapIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <select
                    name="specialty"
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border-slate-200 rounded-xl focus:ring-teal-500 focus:border-teal-500 text-sm transition-all"
                    value={formData.specialty}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a specialty</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="General Medicine">General Medicine</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border-slate-200 rounded-xl focus:ring-teal-500 focus:border-teal-500 text-sm transition-all"
                  placeholder="Min 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full btn-primary-clinova py-4 text-lg shadow-xl shadow-teal-600/30"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : `Register as ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-teal-600 hover:text-teal-700 font-bold no-underline">
                Sign in instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
