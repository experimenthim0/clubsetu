import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Html5Qrcode } from 'html5-qrcode';
import { useNotification } from '../context/NotificationContext';
import { CheckCircle, XCircle, AlertTriangle, Users, BadgeCheck, Clock, ArrowLeft, Wifi, ScanLine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const formatTimeAgo = (date) => {
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${Math.floor(diffMin / 60)}h ago`;
};

const CheckIn = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Tab state: 'scan' or 'manual'
  const [activeTab, setActiveTab] = useState('scan');
  // Manual entry
  const [manualId, setManualId] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  // Session attendance history
  const [attendanceLog, setAttendanceLog] = useState([]);

  // Unified scan state
  const [scanState, setScanState] = useState('idle');
  const [scanResult, setScanResult] = useState(null);
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

      const memberships = storedUser?.memberships || [];
      const membership = memberships.find(m => m.clubId === eventData.clubId);
      
      const isClubHead = membership?.role === 'CLUB_HEAD' || storedRole === 'club' || storedUser?.role === 'club';
      const isCoordinator = membership?.role === 'COORDINATOR';
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

  // QR Scanner init/cleanup
  useEffect(() => {
    if (loading || !scanning || activeTab !== 'scan') return;

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
  }, [loading, scanning, activeTab]);

  // Stop scanner when switching to manual tab
  useEffect(() => {
    if (activeTab === 'manual' && scannerRef.current) {
      scannerRef.current.stop().then(() => scannerRef.current?.clear()).catch(() => {});
      scannerRef.current = null;
    }
  }, [activeTab]);

  const addToHistory = (status, name, identifier, statusType) => {
    setAttendanceLog(prev => [{
      id: Date.now(),
      status: statusType,
      name: name || 'Unknown',
      identifier: identifier || '',
      time: new Date(),
    }, ...prev]);
  };

  async function processVerification(qrCode, isManual = false) {
    if (!isManual) {
      if (isProcessingRef.current || (qrCode === lastScannedCodeRef.current)) return;
      isProcessingRef.current = true;
      lastScannedCodeRef.current = qrCode;
      
      if (scannerRef.current) {
        try { await scannerRef.current.pause(); } catch (e) { console.warn('Pause failed:', e); }
      }
    }

    setProcessing(true);
    setScanState('processing');
    setScanResult(null);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/participation/verify`, {
        qrCode,
        eventId: id,
      });
      setScanResult(res.data);
      setScanState('success');
      setAttendedCount(prev => prev + 1);
      addToHistory('success', res.data.participantName, res.data.rollNo || res.data.externalEmail, 'success');
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data || {};
      const errorMessage = data.message || (status === 404 ? 'Ticket not found in registration database.' : 'Verification failed.');
      setScanResult({ message: errorMessage, ...data });

      if (status === 409) {
        setScanState('already_marked');
        addToHistory('already', data.participantName || 'Already Checked In', data.rollNo || '', 'already');
      } else if (status === 403) {
        setScanState('unauthorized');
        addToHistory('error', 'Access Denied', qrCode.slice(0, 18), 'error');
      } else if (data.status === 'WRONG_EVENT') {
        setScanState('wrong_event');
        addToHistory('error', 'Wrong Event', qrCode.slice(0, 18), 'error');
      } else {
        setScanState('not_found');
        addToHistory('error', errorMessage, qrCode.slice(0, 18), 'error');
      }
    } finally {
      if (isManual) {
        setTimeout(() => {
          setScanState('idle');
          setProcessing(false);
        }, 2500);
      } else {
        setTimeout(async () => {
          setScanState('idle');
          setProcessing(false);
          isProcessingRef.current = false;
          lastScannedCodeRef.current = null;
          if (scannerRef.current) {
            try { await scannerRef.current.resume(); } catch (e) { console.error('Resume failed:', e); }
          }
        }, 3000);
      }
    }
  }

  async function onScanSuccess(decodedText) {
    await processVerification(decodedText, false);
  }

  function onScanFailure() {}

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const trimmed = manualId.trim();
    if (!trimmed) return;
    setManualLoading(true);
    await processVerification(trimmed, true);
    setManualLoading(false);
    setManualId('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-[#0a0a0a] font-medium">
        <div className="flex flex-col items-center gap-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-10 md:px-12 shadow-sm">
          <div className="w-10 h-10 border-4 border-neutral-200 dark:border-neutral-800 border-t-orange-600 rounded-full animate-spin"></div>
          <p className="m-0 font-bold text-sm text-neutral-800 dark:text-neutral-200">Initializing Scanner</p>
          <p className="m-0 text-xs text-neutral-400 font-medium">Please wait a moment</p>
        </div>
      </div>
    );
  }

  const attendRate = event?.registeredCount
    ? Math.round((attendedCount / event.registeredCount) * 100)
    : 0;

  const showOverlay = scanState !== 'idle';

  const overlayBg = {
    processing:     'rgba(255, 255, 255, 0.95)',
    success:        'rgba(240, 253, 244, 0.97)',
    already_marked: 'rgba(255, 251, 235, 0.97)',
    unauthorized:   'rgba(254, 242, 242, 0.97)',
    wrong_event:    'rgba(255, 241, 242, 0.97)',
    not_found:      'rgba(254, 242, 242, 0.97)',
  }[scanState] || 'rgba(255, 255, 255, 0.95)';

  // Dark mode overlay options
  const darkOverlayBg = {
    processing:     'rgba(23, 23, 23, 0.95)',
    success:        'rgba(6, 78, 59, 0.97)',
    already_marked: 'rgba(120, 53, 4, 0.97)',
    unauthorized:   'rgba(153, 27, 27, 0.97)',
    wrong_event:    'rgba(159, 18, 57, 0.97)',
    not_found:      'rgba(153, 27, 27, 0.97)',
  }[scanState] || 'rgba(23, 23, 23, 0.95)';

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] font-medium text-neutral-800 dark:text-neutral-200 transition-colors duration-300">
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
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-40">
        <div className="max-w-[1280px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-[14px]">
            <Link to="/my-events" className="flex items-center justify-center w-9 h-9 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-1.5 mb-[3px]">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Events</span>
                <span className="text-[10px] text-neutral-300 dark:text-neutral-700">/</span>
                <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Attendance</span>
              </div>
              <h1 className="m-0 text-base font-extrabold text-black dark:text-white leading-tight">{event?.title}</h1>
              {event?.startTime && (
                <p className="m-0 text-[11px] text-neutral-400 dark:text-neutral-500 font-medium">
                  {new Date(event.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })},{' '}
                  {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {event.endTime ? ` – ${new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                </p>
              )}
            </div>
          </div>
          {(() => {
            const now = new Date();
            const start = event?.startTime ? new Date(event.startTime) : null;
            const end = event?.endTime ? new Date(event.endTime) : null;
            const isUpcoming = start && start > now;
            const isEnded = end && end < now;

            if (isUpcoming) {
              return (
                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-full px-3 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-widest">Upcoming</span>
                </div>
              );
            }
            if (isEnded) {
              return (
                <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full px-3 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>
                  <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-widest">Ended</span>
                </div>
              );
            }
            return (
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 rounded-full px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-widest">Live</span>
              </div>
            );
          })()}
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto px-6 pt-7 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">

          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-5">
            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Registrations', val: event?.registeredCount ?? '—', icon: <Users size={18} className="text-orange-600" />, bg: 'bg-orange-50 dark:bg-orange-950/10 border-orange-100 dark:border-orange-900/20' },
                { label: 'Attended', val: attendedCount, icon: <BadgeCheck size={18} className="text-green-600 dark:text-green-400" />, bg: 'bg-green-50 dark:bg-green-950/10 border-green-100 dark:border-green-900/20' },
                { label: 'Check-in Rate', val: `${attendRate}%`, icon: <CheckCircle size={18} className="text-blue-600 dark:text-blue-400" />, bg: 'bg-blue-50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/20' }
              ].map((stat, i) => (
                <div key={i} className={`bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm ${stat.bg}`}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-neutral-950 shadow-sm border border-neutral-100 dark:border-neutral-800 flex-shrink-0">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="m-0 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-0.5">{stat.label}</p>
                    <p className="m-0 text-2xl font-black text-black dark:text-white font-mono tracking-tight">{stat.val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 md:p-6 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Attendance Progress</span>
                <span className="text-xs font-bold text-orange-600 font-mono">{attendedCount} / {event?.registeredCount ?? 0}</span>
              </div>
              <div className="h-2 bg-neutral-100 dark:bg-neutral-850 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${attendRate}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                />
              </div>
            </div>

            {/* Session History */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 p-[14px_18px] border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60">
                <Clock size={14} className="text-neutral-400 dark:text-neutral-500" />
                <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Session History</span>
                {attendanceLog.length > 0 && (
                  <span className="ml-auto text-[10px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/40 rounded-full px-2 py-0.5">
                    {attendanceLog.length} checked in
                  </span>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
                {attendanceLog.length === 0 ? (
                  <div className="py-12 flex flex-col items-center gap-2 text-center px-4">
                    <p className="text-sm font-semibold text-neutral-400 dark:text-neutral-500">No check-ins yet this session</p>
                    <p className="text-xs text-neutral-300 dark:text-neutral-600">Records will display here in real-time as they scan</p>
                  </div>
                ) : (
                  <ul className="m-0 p-0 list-none">
                    {attendanceLog.map((entry) => (
                      <li key={entry.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-neutral-50/50 dark:hover:bg-neutral-850/40 transition-colors">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          entry.status === 'success' ? 'bg-green-50 dark:bg-green-950/20 text-green-600' :
                          entry.status === 'already' ? 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600' :
                          'bg-red-50 dark:bg-red-950/20 text-red-600'
                        }`}>
                          {entry.status === 'success' && <CheckCircle size={14} />}
                          {entry.status === 'already' && <AlertTriangle size={14} />}
                          {entry.status === 'error' && <XCircle size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="m-0 text-sm font-bold text-neutral-800 dark:text-neutral-200 truncate">{entry.name}</p>
                          {entry.identifier && (
                            <p className="m-0 text-xs text-neutral-400 dark:text-neutral-500 font-mono truncate">{entry.identifier}</p>
                          )}
                        </div>
                        <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 flex-shrink-0">
                          {formatTimeAgo(entry.time)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-2 p-[10px_14px] bg-green-50 dark:bg-green-950/10 border border-green-200 dark:border-green-900/20 rounded-xl">
              <Wifi size={14} className="text-green-500" />
              <span className="text-xs font-semibold text-green-700 dark:text-green-400">Connected — Real-time validation active</span>
            </div>
          </div>

          {/* RIGHT COLUMN — Scanner / Manual Entry */}
          <div className="lg:sticky lg:top-24">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
              
              {/* Tab Toggle */}
              <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60 p-1.5 m-2.5 rounded-xl gap-1">
                <button
                  onClick={() => setActiveTab('scan')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all rounded-lg cursor-pointer ${
                    activeTab === 'scan'
                      ? 'text-orange-600 bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200/50 dark:border-neutral-700/50'
                      : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-white'
                  }`}
                >
                  <ScanLine size={13} />
                  Scan QR
                </button>
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all rounded-lg cursor-pointer ${
                    activeTab === 'manual'
                      ? 'text-orange-600 bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200/50 dark:border-neutral-700/50'
                      : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-white'
                  }`}
                >
                  <i className="ri-keyboard-line text-sm" />
                  Manual Entry
                </button>
              </div>

              {activeTab === 'scan' ? (
                <>
                  <div className="relative bg-[#0F0F10] overflow-hidden m-4 rounded-xl">
                    {/* Corner decorators */}
                    <div className="absolute w-[22px] h-[22px] z-10 rounded-[2px] top-0 left-0 border-t-[3px] border-l-[3px] border-orange-500" />
                    <div className="absolute w-[22px] h-[22px] z-10 rounded-[2px] top-0 right-0 border-t-[3px] border-r-[3px] border-orange-500" />
                    <div className="absolute w-[22px] h-[22px] z-10 rounded-[2px] bottom-0 left-0 border-b-[3px] border-l-[3px] border-orange-500" />
                    <div className="absolute w-[22px] h-[22px] z-10 rounded-[2px] bottom-0 right-0 border-b-[3px] border-r-[3px] border-orange-500" />

                    {/* Scan line animation */}
                    <div className="scan-line absolute left-3 right-3 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent rounded shadow-[0_0_10px_2px_rgba(249,115,22,0.4)] z-[9]"></div>

                    <div id="reader" className="w-full"></div>

                    {/* Result Overlay */}
                    <AnimatePresence>
                      {showOverlay && (
                        <ScanOverlay scanState={scanState} scanResult={scanResult} overlayBg={overlayBg} darkOverlayBg={darkOverlayBg} />
                      )}
                    </AnimatePresence>
                  </div>

                  <p className="m-0 p-4 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 text-center bg-neutral-50 dark:bg-neutral-950/20 border-t border-neutral-200 dark:border-neutral-800">
                    Align registration QR code inside target corners
                  </p>
                </>
              ) : (
                /* Manual Entry Tab */
                <div className="p-6">
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-4 leading-relaxed">
                    Enter the student's registration ID to manually mark their attendance.
                  </p>
                  <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
                    <input
                      type="text"
                      value={manualId}
                      onChange={(e) => setManualId(e.target.value)}
                      placeholder="e.g. registration ID..."
                      className="w-full px-4 py-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 rounded-xl text-sm font-medium outline-none text-black dark:text-white focus:border-orange-500 transition-all placeholder:text-neutral-300 dark:placeholder:text-neutral-700"
                      disabled={manualLoading}
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={manualLoading || !manualId.trim()}
                      className={`w-full py-3 rounded-xl text-white text-xs font-bold uppercase tracking-wider transition-all ${
                        manualLoading || !manualId.trim()
                          ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                          : 'bg-orange-600 hover:bg-orange-700 cursor-pointer shadow-sm'
                      }`}
                    >
                      {manualLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Marking...
                        </span>
                      ) : (
                        'Mark Attendance'
                      )}
                    </button>
                  </form>

                  {/* Manual Feedback */}
                  <AnimatePresence>
                    {showOverlay && activeTab === 'manual' && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="mt-4"
                      >
                        {scanState === 'success' && (
                          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 rounded-xl">
                            <CheckCircle size={20} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-green-700 dark:text-green-400">Successfully Checked In</p>
                              <p className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">{scanResult?.participantName} — {scanResult?.rollNo || scanResult?.externalEmail || 'N/A'}</p>
                            </div>
                          </div>
                        )}
                        {scanState === 'already_marked' && (
                          <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/40 rounded-xl">
                            <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-yellow-700 dark:text-yellow-400">Attendance Already Recorded</p>
                              <p className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">{scanResult?.message || 'Attendance is already recorded.'}</p>
                            </div>
                          </div>
                        )}
                        {(scanState === 'not_found' || scanState === 'unauthorized') && (
                          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl">
                            <XCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-red-700 dark:text-red-400">
                                {scanState === 'unauthorized' ? 'Access Denied' : 'Not Found'}
                              </p>
                              <p className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">
                                {scanState === 'unauthorized' ? 'Lacking attendance clearance level.' : 'Invalid registration identifier.'}
                              </p>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

function ScanOverlay({ scanState, scanResult, overlayBg, darkOverlayBg }) {
  // Check if dark mode is active to apply correct overlay background color
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const currentBg = isDark ? darkOverlayBg : overlayBg;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center z-20 backdrop-blur-[4px]"
      style={{ background: currentBg }}
    >
      {scanState === 'processing' && (
        <div className="flex flex-col items-center gap-[14px]">
          <div className="w-10 h-10 border-4 border-neutral-200 dark:border-neutral-800 border-t-orange-600 rounded-full animate-spin"></div>
          <p className="m-0 text-[13px] font-semibold text-neutral-800 dark:text-white">Validating registration status...</p>
        </div>
      )}

      {scanState === 'success' && (
        <motion.div
          initial={{ scale: 0.92, y: 12 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl p-6 flex flex-col items-center gap-2.5 w-[280px] shadow-sm border border-neutral-200 dark:border-neutral-850"
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-green-50 dark:bg-green-950/20 mb-1">
            <CheckCircle size={28} className="text-green-600 dark:text-green-400" />
          </div>
          <p className="m-0 text-[11px] font-bold uppercase tracking-widest text-green-600">Checked In</p>
          <p className="m-0 text-base font-bold text-neutral-800 dark:text-white text-center">{scanResult?.participantName || 'Unknown'}</p>
          <div className="w-full bg-neutral-50 dark:bg-neutral-950 rounded-xl p-3 mt-1 border border-neutral-100 dark:border-neutral-850">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                {scanResult?.rollNo ? 'Roll No' : 'Email'}
              </span>
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 font-mono">
                {scanResult?.rollNo || scanResult?.externalEmail || 'N/A'}
              </span>
            </div>
          </div>
          <p className="m-0 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 mt-1">Resuming loop in 3s</p>
        </motion.div>
      )}

      {scanState === 'already_marked' && (
        <motion.div
          initial={{ scale: 0.92, y: 12 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl p-6 flex flex-col items-center gap-2.5 w-[280px] shadow-sm border border-neutral-200 dark:border-neutral-850"
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-yellow-50 dark:bg-yellow-950/20 mb-1">
            <AlertTriangle size={28} className="text-yellow-600 dark:text-yellow-400" />
          </div>
          <p className="m-0 text-[11px] font-bold uppercase tracking-widest text-yellow-600">Already Marked</p>
          <p className="m-0 text-xs font-semibold text-neutral-700 dark:text-neutral-300 text-center leading-relaxed">
            {scanResult?.message || 'Attendance record is already active.'}
          </p>
          <p className="m-0 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 mt-1">Resuming loop in 3s</p>
        </motion.div>
      )}

      {(scanState === 'unauthorized' || scanState === 'not_found' || scanState === 'wrong_event') && (
        <motion.div
          initial={{ scale: 0.92, y: 12 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl p-6 flex flex-col items-center gap-2.5 w-[280px] shadow-sm border border-neutral-200 dark:border-neutral-850"
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-red-50 dark:bg-red-950/20 mb-1">
            <XCircle size={28} className="text-red-600 dark:text-red-400" />
          </div>
          <p className="m-0 text-[11px] font-bold uppercase tracking-widest text-red-600">
            {scanState === 'unauthorized'
              ? 'Access Denied'
              : scanState === 'wrong_event'
              ? 'Wrong Event'
              : 'Verification Error'}
          </p>
          <p className="m-0 text-xs font-semibold text-neutral-700 dark:text-neutral-300 text-center leading-relaxed">
            {scanResult?.message ||
              (scanState === 'unauthorized'
                ? 'Lacking attendance clearance permissions.'
                : 'Registration record not found.')}
          </p>
          <p className="m-0 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 mt-1">Resuming loop in 3s</p>
        </motion.div>
      )}
    </motion.div>
  );
}

export default CheckIn;
