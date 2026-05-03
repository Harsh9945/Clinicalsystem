import React, { useContext } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { 
  CalendarIcon, 
  ShieldCheckIcon, 
  CpuChipIcon, 
  UserCircleIcon,
  VideoCameraIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

export const HomePage = () => {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <div className="overflow-x-hidden bg-[#f8fafc]">
      {/* Hero Section */}
      <section className="relative pt-24 pb-36">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-teal-50/30 -z-10 rounded-l-[160px] hidden lg:block"></div>
        <Container>
          <Row className="items-center">
            <Col lg={6} className="animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-teal-100 text-teal-600 rounded-full text-xs font-black uppercase tracking-widest mb-8 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
                Clinical Intelligence Hub
              </div>
              <h1 className="text-7xl lg:text-8xl font-black text-slate-800 leading-[0.95] tracking-tighter mb-8">
                Healthcare <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-400">
                  Reimagined.
                </span>
              </h1>
              <p className="text-xl text-slate-400 font-medium leading-relaxed mb-12 max-w-lg">
                Clinova harmonizes specialist expertise with neural-net intelligence to deliver the world's most 
                intuitive medical experience.
              </p>
              
              {!isAuthenticated ? (
                <div className="flex flex-wrap gap-5">
                  <Link to="/register" className="btn-primary-clinova no-underline px-10 py-5 text-lg shadow-2xl shadow-teal-600/20">
                    Get Started
                  </Link>
                  <Link to="/login" className="btn-outline-clinova no-underline px-10 py-5 text-lg">
                    Sign In
                  </Link>
                </div>
              ) : (
                <div className="p-8 bg-white rounded-[32px] border border-slate-100 max-w-md shadow-xl shadow-slate-200/20">
                  <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Active Session</p>
                  <Link to="/patient/dashboard" className="text-teal-600 font-black text-2xl flex items-center gap-3 mt-2 group no-underline">
                    Access Portal 
                    <ArrowRightIcon className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                  </Link>
                </div>
              )}
            </Col>
            
            <Col lg={6} className="hidden lg:block relative">
              <div className="relative z-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <img 
                  src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1200" 
                  alt="Modern Healthcare" 
                  className="rounded-[64px] shadow-2xl border-[12px] border-white"
                />
                <div className="absolute -bottom-12 -left-12 glass-card p-10 animate-bounce" style={{ animationDuration: '6s' }}>
                  <div className="flex items-center gap-5">
                    <div className="bg-teal-500 p-4 rounded-2xl text-white shadow-lg shadow-teal-500/30">
                      <CalendarIcon className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Global Users</p>
                      <p className="text-3xl font-black text-slate-800 leading-none">24.8k</p>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Grid */}
      <section className="py-32 bg-white">
        <Container>
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black text-slate-800 mb-4 tracking-tight">The Clinova Protocol</h2>
            <p className="text-slate-400 max-w-xl mx-auto font-medium text-lg italic">Bridging the gap between code and compassion.</p>
          </div>
          
          <Row className="g-10">
            <FeatureCard 
              icon={<CalendarIcon className="w-8 h-8" />}
              title="Seamless Booking"
              desc="Coordinate with world-class specialists in real-time through our frictionless scheduling engine."
              color="text-teal-500"
              bg="bg-teal-50/50"
            />
            <FeatureCard 
              icon={<ShieldCheckIcon className="w-8 h-8" />}
              title="Neural Protection"
              desc="Advanced encryption protocols ensuring your clinical data remains private and immutable."
              color="text-blue-500"
              bg="bg-blue-50/50"
            />
            <FeatureCard 
              icon={<CpuChipIcon className="w-8 h-8" />}
              title="AI Orchestration"
              desc="Proprietary triage algorithms that analyze symptoms to support clinical decision-making."
              color="text-indigo-500"
              bg="bg-indigo-50/50"
            />
          </Row>
        </Container>
      </section>

      {/* Role Sections */}
      <section className="py-32 bg-slate-50/50">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <RoleCard 
              title="Patients"
              items={["Specialist Search", "AI Symptom Triage", "Instant Booking", "Digital Records"]}
              icon={<UserCircleIcon className="w-12 h-12" />}
              accent="teal"
            />
            <RoleCard 
              title="Doctors"
              items={["Queue Management", "Clinical Insights", "Video Consulting", "Smart Prescriptions"]}
              icon={<VideoCameraIcon className="w-12 h-12" />}
              accent="blue"
            />
            <RoleCard 
              title="Institutions"
              items={["Staff Authorization", "Real-time Metrics", "System Oversight", "Resource Audit"]}
              icon={<UserGroupIcon className="w-12 h-12" />}
              accent="indigo"
            />
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 py-24 text-center border-t border-slate-100">
        <Container>
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="bg-teal-600 p-2.5 rounded-xl">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-800">Clinova</span>
          </div>
          <p className="text-slate-400 max-w-md mx-auto mb-10 text-sm font-medium leading-relaxed">
            Redefining clinical excellence for a digital generation. 
            &copy; 2026 Clinova Health Systems.
          </p>
          <div className="flex justify-center gap-8 text-slate-300 text-[10px] font-black uppercase tracking-[0.2em]">
            <a href="#" className="hover:text-teal-600 transition-colors no-underline">Privacy Policy</a>
            <a href="#" className="hover:text-teal-600 transition-colors no-underline">Service Terms</a>
            <a href="#" className="hover:text-teal-600 transition-colors no-underline">Global Support</a>
          </div>
        </Container>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, color, bg }) => (
  <Col md={4}>
    <div className="glass-card p-10 h-full bg-white border border-slate-50 hover:border-teal-100">
      <div className={`${bg} ${color} w-16 h-16 rounded-[24px] flex items-center justify-center mb-8 shadow-sm`}>
        {icon}
      </div>
      <h3 className="text-2xl font-black text-slate-800 mb-4">{title}</h3>
      <p className="text-slate-400 font-medium leading-relaxed">{desc}</p>
    </div>
  </Col>
);

const RoleCard = ({ title, items, icon, accent }) => {
  const colors = {
    teal: 'bg-white text-teal-600 border-slate-100 hover:border-teal-200',
    blue: 'bg-white text-blue-600 border-slate-100 hover:border-blue-200',
    indigo: 'bg-white text-indigo-600 border-slate-100 hover:border-indigo-200'
  };
  
  return (
    <div className={`p-12 rounded-[48px] border-2 transition-all hover:scale-[1.05] shadow-sm hover:shadow-2xl ${colors[accent]}`}>
      <div className="mb-8 opacity-80">{icon}</div>
      <h3 className="text-3xl font-black mb-8 text-slate-800">{title}</h3>
      <ul className="space-y-4 mb-0">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-3 font-bold text-slate-400 text-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-30"></span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

const ArrowRightIcon = ({ className }) => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

const SparklesIcon = ({ className }) => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 15L17.5 17.25 15.25 18l2.25.75.75 2.25.75-2.25 2.25-.75-2.25-.75-.75-2.25zM15.75 2.25l-.75 2.25-2.25.75 2.25.75.75 2.25.75-2.25 2.25-.75-2.25-.75-.75-2.25z" />
  </svg>
);
