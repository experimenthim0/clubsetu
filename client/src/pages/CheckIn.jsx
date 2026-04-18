import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Html5Qrcode } from 'html5-qrcode';
import { useNotification } from '../context/NotificationContext';
import { CheckCircle, XCircle, AlertTriangle, Users, BadgeCheck, Clock, ArrowLeft, Wifi, ScanLine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CheckIn = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Unified scan state
  const [scanState, setScanState] = useState('idle');
  // Holds { participantName, rollNo, externalEmail } from 200 response
  const [scanResult, setScanResult] = useState(null);
  // Local optimistic attended count
  const [attendedCount, setAttendedCount] = useState(0);

  const scannerRef = useRef(null);
  const isProcessingRef = useRef(false);
  const lastScannedCodeRef = useRef(null);

  // RBAC guard + event load
  useEffect(() => {
    const storedUserData = localStorage.getItem('user');
    const storedUser = storedUserData ? JSON.parse(storedUserData) : null;
    const storedRole = localStorage.getItem('role');

    if (!storedUser) {
      showNotification('Access Denied', 'error');
      navigate('/my-events');
      return;
    }

    fetchEventDetails(storedUser, storedRole);
  }, [id]);

  const fetchEventDetails = async (storedUser, storedRole) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/events/${id}`);
      const eventData = res.data;
      setEvent(eventData);
      setAttendedCount(eventData.attendedCount ?? 0);

      // RBAC: find membership for this event's club
      const memberships = storedUser?.memberships || [];
      const membership = memberships.find(m => m.clubId === eventData.clubId);
      
      // If user has 'club' role globally or specifically for this club, allow access
      // Also check specific permissions if present
      const isClubHead = membership?.role === 'CLUB_HEAD' || storedRole === 'club' || storedUser?.role === 'club';
      const isCoordinator = membership?.role === 'COORDINATOR';
      // CHECK PERMISSION: ClubHead and Coordinator always have permission. 
      // Members must have canTakeAttendance: true in their membership record.
      // We check both flat and nested structures for backward compatibility.
      const hasAttendancePermission = 
        membership?.canTakeAttendance === true || 
        membership?.permissions?.canTakeAttendance === true;

      const canTakeAttendance = 
        isClubHead || 
        isCoordinator || 
        hasAttendancePermission || 
        storedRole === 'admin' || 
        storedRole === 'facultyCoordinator';

      if (!canTakeAttendance) {
        showNotification('Access Denied', 'error');
        navigate('/my-events');
        return;
      }

      setLoading(false);
    } catch (err) {
      console.error(err);
      showNotification('Failed to load event details', 'error');
      navigate('/my-events');
    }
  };

  useEffect(() => {
    if (loading || !scanning) return;

    let html5QrCode = null;
    const timer = setTimeout(() => {
      const readerElement = document.getElementById('reader');
      if (readerElement) {
        try {
          html5QrCode = new Html5Qrcode('reader');
          html5QrCode.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 240, height: 240 } },
            onScanSuccess,
            onScanFailure
          );
          scannerRef.current = html5QrCode;
        } catch (e) {
          console.error('Camera start error:', e);
        }
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      if (html5QrCode) {
        html5QrCode.stop().then(() => html5QrCode.clear()).catch(err => console.error('Scanner stop error:', err));
        scannerRef.current = null;
      }
    };
  }, [loading, scanning]);

  async function onScanSuccess(decodedText) {
    // 1. Immediate synchronous lock to prevent rapid triggers from scanner library
    if (isProcessingRef.current || (decodedText === lastScannedCodeRef.current)) {
      return;
    }

    // 2. Set locks
    isProcessingRef.current = true;
    lastScannedCodeRef.current = decodedText;
    
    // 3. Pause the scanner to stop video processing during feedback
    if (scannerRef.current) {
      try {
        await scannerRef.current.pause();
      } catch (e) {
        console.warn('Failed to pause scanner:', e);
      }
    }

    setProcessing(true);
    setScanState('processing');
    setScanResult(null);

    try {
      const res = await axios.patch(`${import.meta.env.VITE_API_URL}/api/participation/verify/${decodedText}`);
      setScanResult(res.data);
      setScanState('success');
      setAttendedCount(prev => prev + 1);
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        setScanState('already_marked');
        // If the error response contains user data, we can still show who it was
        if (err.response.data?.participantName) {
          setScanResult(err.response.data);
        }
      } else if (status === 403) {
        setScanState('unauthorized');
      } else {
        setScanState('not_found');
      }
    } finally {
      // 4. Stay in feedback state for 3 seconds, then resume
      setTimeout(async () => {
        setScanState('idle');
        setProcessing(false);
        isProcessingRef.current = false;
        lastScannedCodeRef.current = null;
        
        if (scannerRef.current) {
          try {
            await scannerRef.current.resume();
          } catch (e) {
            console.error('Failed to resume scanner:', e);
          }
        }
      }, 3000);
    }
  }

  function onScanFailure() {}

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] font-medium">
        <div className="flex flex-col items-center gap-3 bg-white border border-[#E5E7EB] rounded-2xl p-10 md:px-12 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <div className="w-11 h-11 border-[3px] border-[#E5E7EB] border-t-[#6366F1] rounded-full animate-spin"></div>
          <p className="m-0 font-bold text-[15px] text-[#111827]">Initializing Scanner</p>
          <p className="m-0 text-[13px] text-[#9CA3AF] font-medium">Please wait a moment</p>
        </div>
      </div>
    );
  }

  const attendRate = event?.registeredCount
    ? Math.round((attendedCount / event.registeredCount) * 100)
    : 0;

  const showOverlay = scanState !== 'idle';

  const overlayBg = {
    processing:     'rgba(255, 255, 255, 0.92)',
    success:        'rgba(240, 253, 244, 0.97)',
    already_marked: 'rgba(255, 251, 235, 0.97)',
    unauthorized:   'rgba(255, 241, 242, 0.97)',
    not_found:      'rgba(255, 241, 242, 0.97)',
  }[scanState] || 'rgba(255, 255, 255, 0.92)';

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-medium text-[#111827]">
      <style>{`
        @keyframes scan-sweep {
          0% { top: 8px; opacity: 0.8; }
          50% { opacity: 1; }
          100% { top: calc(100% - 8px); opacity: 0.8; }
        }
        .scan-line { animation: scan-sweep 2.4s ease-in-out infinite; }
        #reader video { border-radius: 0 !important; }
        #reader { border: none !important; }
        #reader > div { border: none !important; }
      `}</style>

      {/* Top Bar */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-40">
        <div className="max-w-[1280px] mx-auto px-6 py-[14px] flex items-center justify-between">
          <div className="flex items-center gap-[14px]">
            <Link to="/my-events" className="flex items-center justify-center w-9 h-9 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-[#374151] transition-colors hover:bg-gray-100">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-1.5 mb-[3px]">
                <span className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Events</span>
                <span className="text-[11px] text-[#D1D5DB]">/</span>
                <span className="text-[11px] font-semibold text-[#6366F1] uppercase tracking-wider">Attendance</span>
              </div>
              <h1 className="m-0 text-[15px] font-bold text-[#111827] leading-tight">{event?.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-[7px] bg-[#F0FDF4] border border-[#BBF7D0] rounded-full px-3 py-1.25">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></span>
            <span className="text-[11px] font-bold text-[#15803D] uppercase tracking-[0.08em]">Live</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto px-6 pt-7 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">

          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-5">
            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Registrations', val: event?.registeredCount ?? '—', icon: <Users size={18} color="#6366F1" />, bg: '#EEF2FF' },
                { label: 'Attended', val: attendedCount, icon: <BadgeCheck size={18} color="#F97316" />, bg: '#FFF7ED' },
                { label: 'Check-in Rate', val: `${attendRate}%`, icon: <CheckCircle size={18} color="#22C55E" />, bg: '#F0FDF4' }
              ].map((stat, i) => (
                <div key={i} className="bg-white border border-[#E5E7EB] rounded-2xl p-[16px_18px] flex items-center gap-[14px] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: stat.bg }}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className="m-0 text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-0.5">{stat.label}</p>
                    <p className="m-0 text-[22px] font-bold text-[#111827] font-mono tracking-tight">{stat.val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-[18px_20px] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-[#374151] uppercase tracking-wider">Attendance Progress</span>
                <span className="text-xs font-bold text-[#6366F1] font-mono">{attendedCount} / {event?.registeredCount ?? 0}</span>
              </div>
              <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${attendRate}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  className="h-full bg-gradient-to-r from-[#818CF8] to-[#6366F1] rounded-full"
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-[20px_22px] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#F3F4F6]">
                <Clock size={14} className="text-[#9CA3AF]" />
                <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.08em]">Coordinator Instructions</span>
              </div>
              <ol className="list-none m-0 p-0 flex flex-col gap-3">
                {[
                  "Position the student's QR code within the camera frame.",
                  'Wait for the green confirmation screen before entry.',
                  'Ensure a stable internet connection for real-time validation.',
                  'Each QR code is single-use — duplicates will be rejected.',
                ].map((text, i) => (
                  <li key={i} className="flex gap-[14px] items-start">
                    <span className="text-[11px] font-bold text-[#6366F1] font-mono flex-shrink-0 mt-[1px]">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[13px] font-medium text-[#4B5563] leading-[1.55]">{text}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-2 p-[10px_14px] bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl">
              <Wifi size={14} className="text-[#22C55E]" />
              <span className="text-xs font-semibold text-[#15803D]">Connected — Real-time validation active</span>
            </div>
          </div>

          {/* RIGHT COLUMN — Scanner */}
          <div className="lg:sticky lg:top-20">
            <div className="bg-white border border-[#E5E7EB] rounded-[16px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
              <div className="flex items-center gap-2 p-[14px_18px] border-b border-[#F3F4F6] bg-[#FAFAFA]">
                <ScanLine size={16} className="text-[#6366F1]" />
                <span className="text-xs font-bold text-[#374151] uppercase tracking-wider">QR Scanner</span>
              </div>

              <div className="relative bg-[#0F0F10] overflow-hidden">
                {/* Corner decorators */}
                <div className="absolute w-[22px] h-[22px] z-10 rounded-[2px] top-0 left-0 border-t-[3px] border-l-[3px] border-[#6366F1]" />
                <div className="absolute w-[22px] h-[22px] z-10 rounded-[2px] top-0 right-0 border-t-[3px] border-r-[3px] border-[#6366F1]" />
                <div className="absolute w-[22px] h-[22px] z-10 rounded-[2px] bottom-0 left-0 border-b-[3px] border-l-[3px] border-[#6366F1]" />
                <div className="absolute w-[22px] h-[22px] z-10 rounded-[2px] bottom-0 right-0 border-b-[3px] border-r-[3px] border-[#6366F1]" />

                {/* Scan line animation */}
                <div className="scan-line absolute left-3 right-3 h-[2px] bg-gradient-to-r from-transparent via-[#6366F1] to-transparent rounded shadow-[0_0_10px_2px_rgba(99,102,241,0.4)] z-[9]"></div>

                <div id="reader" className="w-full"></div>

                {/* Result Overlay */}
                <AnimatePresence>
                  {showOverlay && (
                    <ScanOverlay scanState={scanState} scanResult={scanResult} overlayBg={overlayBg} />
                  )}
                </AnimatePresence>
              </div>

              <p className="m-0 p-[12px_18px] text-xs font-medium text-[#9CA3AF] text-center bg-[#FAFAFA] border-t border-[#F3F4F6]">
                Point the camera at a student's QR code
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

function ScanOverlay({ scanState, scanResult, overlayBg }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center z-20 backdrop-blur-[4px]"
      style={{ background: overlayBg }}
    >
      {scanState === 'processing' && (
        <div className="flex flex-col items-center gap-[14px]">
          <div className="w-10 h-10 border-[3px] border-[#E5E7EB] border-t-[#6366F1] rounded-full animate-spin"></div>
          <p className="m-0 text-[13px] font-semibold text-[#374151]">Validating QR Code...</p>
        </div>
      )}

      {scanState === 'success' && (
        <motion.div
          initial={{ scale: 0.92, y: 12 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 md:p-7 flex flex-col items-center gap-2 w-[260px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[#E5E7EB]"
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-[#DCFCE7] mb-1">
            <CheckCircle size={32} className="text-[#16A34A]" />
          </div>
          <p className="m-0 text-[13px] font-bold uppercase tracking-wider text-[#15803D]">Checked In</p>
          <p className="m-0 text-lg font-bold text-[#111827] text-center">{scanResult?.participantName || 'Unknown'}</p>
          <div className="w-full bg-[#F9FAFB] rounded-xl p-[10px_14px] mt-1">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
                {scanResult?.rollNo ? 'Roll No' : 'Email'}
              </span>
              <span className="text-xs font-bold text-[#374151] font-mono">
                {scanResult?.rollNo || scanResult?.externalEmail || 'N/A'}
              </span>
            </div>
          </div>
          <p className="m-0 text-[11px] font-medium text-[#9CA3AF] mt-1">Resuming in 3s...</p>
        </motion.div>
      )}

      {scanState === 'already_marked' && (
        <motion.div
          initial={{ scale: 0.92, y: 12 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 md:p-7 flex flex-col items-center gap-2 w-[260px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[#E5E7EB]"
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-[#FEF3C7] mb-1">
            <AlertTriangle size={32} className="text-[#D97706]" />
          </div>
          <p className="m-0 text-[13px] font-bold uppercase tracking-wider text-[#B45309]">Already Marked</p>
          <p className="m-0 text-[13px] font-medium text-[#78350F] text-center">
            {scanResult?.message || 'Attendance already recorded for this participant.'}
          </p>
          <p className="m-0 text-[11px] font-medium text-[#9CA3AF] mt-1">Resuming in 3s...</p>
        </motion.div>
      )}

      {(scanState === 'unauthorized' || scanState === 'not_found') && (
        <motion.div
          initial={{ scale: 0.92, y: 12 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 md:p-7 flex flex-col items-center gap-2 w-[260px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[#E5E7EB]"
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-[#FEE2E2] mb-1">
            <XCircle size={32} className="text-[#DC2626]" />
          </div>
          <p className="m-0 text-[13px] font-bold uppercase tracking-wider text-[#B91C1C]">
            {scanState === 'unauthorized' ? 'Unauthorized' : 'Not Found'}
          </p>
          <p className="m-0 text-[13px] font-medium text-[#7F1D1D] text-center">
            {scanState === 'unauthorized'
              ? 'You are not authorized to take attendance for this event.'
              : 'QR code not found.'}
          </p>
          <p className="m-0 text-[11px] font-medium text-[#9CA3AF] mt-1">Resuming in 3s...</p>
        </motion.div>
      )}
    </motion.div>
  );
}

export default CheckIn;
