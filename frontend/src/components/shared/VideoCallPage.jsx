import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { AuthContext } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { 
  VideoCameraIcon, 
  VideoCameraSlashIcon, 
  ArrowRightIcon,
  SparklesIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

export const VideoCallPage = () => {
  const { appointmentId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profileName, setProfileName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [joinCode, setJoinCode] = useState(appointmentId || '');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        let res;
        // Adjusted roles to match AuthContext (PATIENT, DOCTOR)
        if (user?.role === 'PATIENT') {
          res = await userService.getPatientProfile();
        } else if (user?.role === 'DOCTOR') {
          res = await userService.getDoctorProfile();
        }
        
        if (res && res.data) {
          setProfileName(res.data.fullName);
        } else {
          setProfileName(user?.email?.split('@')[0] || 'Clinova User');
        }
      } catch (err) {
        console.error('Failed to fetch user profile for video call', err);
        setProfileName(user?.email?.split('@')[0] || 'Clinova User');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [user]);

  const handleCallEnded = () => {
    if (user?.role === 'PATIENT') {
      navigate('/patient/dashboard');
    } else if (user?.role === 'DOCTOR') {
      navigate('/doctor/dashboard');
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Room name is derived from the user-provided code to ensure both users meet in the same room
  const roomName = `Clinova-Session-${joinCode.trim()}`;

  if (!isJoined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
        <div className="max-w-md w-full animate-fade-in">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center bg-teal-600 p-4 rounded-3xl mb-6 shadow-xl shadow-teal-600/20">
              <VideoCameraIcon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Join Session</h1>
            <p className="text-slate-400 mt-2 font-medium">Verify your connection code to enter</p>
          </div>

          <div className="glass-card p-10 bg-white shadow-2xl border-teal-50">
            <div className="mb-8">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Secure Connection Code</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-teal-500" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-14 pr-5 py-5 bg-slate-50 border-slate-100 rounded-2xl focus:ring-8 focus:ring-teal-500/5 focus:border-teal-500 text-lg font-black text-slate-800 tracking-widest transition-all outline-none"
                  placeholder="EX: 123456"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                />
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-4 px-1 italic">
                * Share this code with the other participant to meet in the same session.
              </p>
            </div>

            <button
              onClick={() => setIsJoined(true)}
              disabled={!joinCode.trim()}
              className="w-full btn-primary-clinova py-5 text-lg shadow-xl shadow-teal-600/30 group"
            >
              Enter Workspace
              <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button
              onClick={handleCallEnded}
              className="w-full mt-4 text-[10px] font-black text-slate-300 hover:text-slate-500 uppercase tracking-widest transition-colors"
            >
              Cancel & Return
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black flex flex-col overflow-hidden">
      {/* Dynamic Header Bar */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-white/5 px-8 py-4 flex justify-between items-center z-50">
        <div className="flex items-center gap-4">
          <div className="bg-teal-500 p-2 rounded-xl">
            <SparklesIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-black text-sm tracking-tight leading-none">Clinova Video Session</h1>
            <p className="text-teal-400 text-[10px] font-black uppercase tracking-widest mt-1">Live Encryption Active</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Connected As</p>
            <p className="text-xs font-black text-white">{profileName}</p>
          </div>
          <button 
            onClick={handleCallEnded}
            className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/20"
          >
            End Session
          </button>
        </div>
      </div>

      {/* Jitsi Meeting Container */}
      <div className="flex-1 w-full bg-black relative">
        <JitsiMeeting
          domain="meet.jit.si"
          roomName={roomName}
          configOverwrite={{
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            disableModeratorIndicator: true,
            startScreenSharing: true,
            enableEmailInStats: false,
            prejoinPageEnabled: false, // We already have our own join page
            hideConferenceTimer: false
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
            SHOW_JITSI_WATERMARK: false,
            DEFAULT_BACKGROUND: '#000000'
          }}
          userInfo={{
            displayName: profileName
          }}
          onApiReady={(externalApi) => {
            externalApi.addListener('videoConferenceLeft', () => {
              handleCallEnded();
            });
          }}
          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = '100%';
            iframeRef.style.width = '100%';
          }}
        />
      </div>
    </div>
  );
};
