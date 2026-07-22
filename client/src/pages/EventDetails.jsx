import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import CalendarDropdown from '../components/CalendarDropdown';
import PaymentModal from '../components/PaymentModal';

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop";

// ── Category emoji mapping ──────────────────────────────────────────────────
const CATEGORY_EMOJI = {
  'sports': '🏃',
  'sports & fitness': '🏃',
  'fitness': '💪',
  'tech': '💻',
  'technology': '💻',
  'cultural': '🎭',
  'arts': '🎨',
  'music': '🎵',
  'wellness': '🧘',
  'wellness & yoga': '🧘',
  'academic': '📚',
  'social': '🤝',
  'gaming': '🎮',
  'photography': '📸',
  'dance': '💃',
  'debate': '🎤',
  'literary': '📖',
  'science': '🔬',
  'business': '💼',
  'environment': '🌱',
};

const getCategoryEmoji = (category) => {
  if (!category) return '🎉';
  return CATEGORY_EMOJI[category.toLowerCase()] || '🎉';
};

// ── FAQ Accordion Item ──────────────────────────────────────────────────────
const FAQItem = ({ question, answer, isOpen, onToggle }) => (
  <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden transition-all duration-200">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
    >
      <span className="text-[14px] font-semibold text-neutral-800 dark:text-neutral-200 pr-4">{question}</span>
      <i className={`ri-arrow-down-s-line text-lg text-neutral-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    <div
      className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
    >
      <div className="px-5 pb-4 text-[13px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
        {answer}
      </div>
    </div>
  </div>
);


const EventDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [missingFieldsModalOpen, setMissingFieldsModalOpen] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [modalInputs, setModalInputs] = useState({});
  const [customFormModalOpen, setCustomFormModalOpen] = useState(false);
  const [customFormResponses, setCustomFormResponses] = useState({});
  const [externalEmail, setExternalEmail] = useState('');
  const [externalName, setExternalName] = useState('');
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [registrationId, setRegistrationId] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [openFAQ, setOpenFAQ] = useState(null);

  // Team Registration States
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [teamChoiceModalOpen, setTeamChoiceModalOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teammates, setTeammates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Flexible Payment System States
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState(null); // 'MANUAL_TRANSACTION' | 'COLLEGE_PAYMENT'
  const [paymentPayload, setPaymentPayload] = useState({});

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/search?query=${searchQuery}`);
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const filtered = res.data.filter(s => s.id !== currentUser?.id && !teammates.some(t => t.id === s.id));
        setSearchResults(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, teammates]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const viewedKey = `viewed_event_${slug}`;
        const hasViewed = sessionStorage.getItem(viewedKey);
        
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/events/${slug}`, {
          params: { skipIncrement: hasViewed === 'true' }
        });
        
        const eventData = res.data;
        setEvent(eventData);
        
        if (!hasViewed) {
          sessionStorage.setItem(viewedKey, 'true');
        }

        // Check if the user is already registered for this event
        const user = JSON.parse(localStorage.getItem('user'));
        const role = localStorage.getItem('role');
        if (user && (role === 'member' || role === 'student')) {
          try {
            const regRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/events/user/${user.id || user._id}`);
            const eventId = eventData.id || eventData._id;
            const isAlreadyReg = regRes.data.some(r => r.eventId && (r.eventId.id === eventId || r.eventId._id === eventId));
            if (isAlreadyReg) {
              setAlreadyRegistered(true);
            }
          } catch (regErr) {
            console.error('Failed to check user registration status:', regErr);
          }
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load event');
        setLoading(false);
      }
    };
    fetchEvent();
  }, [slug]);

  useEffect(() => {
    if (event) {
      document.title = `${event.title} - CampusNode`;
      const setMetaTag = (selector, propertyAttr, propertyVal, content) => {
        let element = document.querySelector(selector);
        if (!element) {
          element = document.createElement('meta');
          element.setAttribute(propertyAttr, propertyVal);
          document.head.appendChild(element);
        }
        element.setAttribute('content', content);
      };
      setMetaTag("meta[property='og:title']", 'property', 'og:title', `${event.title} | CampusNode`);
      setMetaTag("meta[property='og:description']", 'property', 'og:description', event.description || "Join this amazing event on CampusNode!");
      setMetaTag("meta[property='og:image']", 'property', 'og:image', event.imageUrl || DEFAULT_IMAGE);
      setMetaTag("meta[property='og:url']", 'property', 'og:url', window.location.href);
      setMetaTag("meta[property='og:type']", 'property', 'og:type', "website");
      setMetaTag("meta[name='twitter:card']", 'name', 'twitter:card', "summary_large_image");
      setMetaTag("meta[name='twitter:title']", 'name', 'twitter:title', `${event.title} | CampusNode`);
      setMetaTag("meta[name='twitter:description']", 'name', 'twitter:description', event.description || "Join this amazing event on CampusNode!");
      setMetaTag("meta[name='twitter:image']", 'name', 'twitter:image', event.imageUrl || DEFAULT_IMAGE);
    }
  }, [event]);

  const submitRegistrationWithPayment = async (txId, pName, remarks) => {
    setIsRegistering(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (paymentPayload.isTeam) {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/teams`, {
          eventId: event.id || event._id,
          teamName: paymentPayload.teamName,
          members: paymentPayload.members,
          formResponses: paymentPayload.formResponses,
          transactionId: txId,
          payerName: pName,
          paymentRemarks: remarks
        });
        
        if (res.data.status === 'WAITLISTED') {
          showNotification('Your team has been added to the waitlist.', 'info');
        } else {
          showNotification(`Successfully registered team ${paymentPayload.teamName}!`, 'success');
        }
        setPaymentModalOpen(false);
        setTimeout(() => navigate('/my-events'), 1500);
      } else {
        // Individual registration
        const registerBody = {
          studentId: paymentPayload.studentId || null,
          externalEmail: paymentPayload.externalEmail || null,
          externalName: paymentPayload.externalName || null,
          formResponses: paymentPayload.formResponses || {},
          transactionId: txId,
          payerName: pName,
          paymentRemarks: remarks
        };
        
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/events/${event.id || event._id}/register`, 
          registerBody
        );
        
        if (res.data.status === 'WAITLISTED') {
          showNotification('You have been added to the waitlist.', 'info');
        } else if (res.data.status === 'REGISTERED') {
          setRegistrationId(res.data.qrCode);
          setShowSuccessModal(true);
          showNotification('Successfully registered!', 'success');
        } else {
          showNotification(res.data.message || 'Successfully registered!', 'success');
        }
        setPaymentModalOpen(false);
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSelectRegisterAsTeam = () => {
    setTeamChoiceModalOpen(false);
    setTeamName('');
    setTeammates([]);
    setSearchQuery('');
    setSearchResults([]);
    setCustomFormResponses({});
    setTeamModalOpen(true);
  };

  const handleIndividualRegister = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const role = localStorage.getItem('role');

    // Authenticated path
    if (user && role === 'member') {
      if (event.customFields && event.customFields.length > 0) {
        setCustomFormResponses({});
        setCustomFormModalOpen(true);
        return;
      }
      if (event.paymentMethod && event.paymentMethod !== 'FREE') {
        setPaymentPayload({
          isTeam: false,
          studentId: user.id,
          formResponses: {}
        });
        setPaymentType(event.paymentMethod);
        setPaymentModalOpen(true);
        return;
      }
      setIsRegistering(true);
      try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/events/${event.id || event._id}/register`, { studentId: user.id });
        if (res.data.status === 'WAITLISTED') {
          showNotification('You have been added to the waitlist.', 'info');
        } else if (res.data.status === 'REGISTERED') {
          setRegistrationId(res.data.qrCode);
          setShowSuccessModal(true);
          showNotification('Successfully registered!', 'success');
        } else {
          showNotification(res.data.message || 'Successfully registered!', 'success');
        }
      } catch (err) {
        if (err.response?.status === 400 && err.response.data.message === 'Already registered for this event.') {
          setAlreadyRegistered(true);
        } else {
          showNotification(err.response?.data?.message || 'Registration failed', 'error');
        }
      } finally { setIsRegistering(false); }
      return;
    }

    // Unauthenticated (external) path
    if (!user) {
      if (!externalEmail || !externalName) {
        showNotification('Please Login first to register for events', 'warning');
        return;
      }
      if (event.paymentMethod && event.paymentMethod !== 'FREE') {
        setPaymentPayload({
          isTeam: false,
          externalEmail,
          externalName,
          formResponses: {}
        });
        setPaymentType(event.paymentMethod);
        setPaymentModalOpen(true);
        return;
      }
      setIsRegistering(true);
      try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/events/${event.id || event._id}/register`, { externalEmail, externalName });
        if (res.data.status === 'WAITLISTED') {
          showNotification('You have been added to the waitlist.', 'info');
        } else if (res.data.status === 'REGISTERED') {
          setRegistrationId(res.data.qrCode);
          setShowSuccessModal(true);
          showNotification('Successfully registered!', 'success');
        } else {
          showNotification(res.data.message || 'Successfully registered!', 'success');
        }
      } catch (err) {
        if (err.response?.status === 400 && err.response.data.message === 'Already registered for this event.') {
          setAlreadyRegistered(true);
        } else {
          showNotification(err.response?.data?.message || 'Registration failed', 'error');
        }
      } finally { setIsRegistering(false); }
      return;
    }
  };

  const handleRegister = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const role = localStorage.getItem('role');

    // Unauthenticated path
    if (!user) {
      handleIndividualRegister();
      return;
    }

    if (role !== 'member') {
      showNotification('Please login as a student to register.', 'warning');
      navigate('/login');
      return;
    }

    if (event.requiredFields && event.requiredFields.length > 0) {
      const missing = event.requiredFields.filter(field => !user[field]);
      if (missing.length > 0) {
        setMissingFields(missing);
        setMissingFieldsModalOpen(true);
        return;
      }
    }

    if (event.registrationType === 'team') {
      handleSelectRegisterAsTeam();
      return;
    }

    if (event.registrationType === 'both') {
      setTeamChoiceModalOpen(true);
      return;
    }

    handleIndividualRegister();
  };

  const handleTeamSubmit = async (e) => {
    if (e) e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    if (!teamName.trim()) {
      showNotification('Please enter a team name.', 'warning');
      return;
    }

    const teamSize = teammates.length + 1;
    const minSize = event.minTeamSize || 1;
    const maxSize = event.maxTeamSize || 1;

    if (teamSize < minSize || teamSize > maxSize) {
      showNotification(`Team size must be between ${minSize} and ${maxSize} members. Current: ${teamSize}`, 'warning');
      return;
    }

    // Validate required custom fields
    if (event.customFields && event.customFields.length > 0) {
      for (const field of event.customFields) {
        if (field.required && !customFormResponses[field.label]?.trim()) {
          showNotification(`Please fill out the required field: ${field.label}`, 'warning');
          return;
        }
      }
    }

    // Paid path for Team
    if (event.paymentMethod && event.paymentMethod !== 'FREE') {
      setPaymentPayload({
        isTeam: true,
        teamName,
        members: teammates.map(t => t.id),
        formResponses: customFormResponses || {}
      });
      setPaymentType(event.paymentMethod);
      setTeamModalOpen(false);
      setPaymentModalOpen(true);
      return;
    }

    // Free path for Team
    setIsRegistering(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/teams`, {
        eventId: event.id || event._id,
        teamName: teamName,
        members: teammates.map(t => t.id),
        formResponses: customFormResponses || {},
      });
      if (res.data.status === 'WAITLISTED') {
        showNotification('Your team has been added to the waitlist.', 'info');
      } else {
        showNotification(`Successfully registered team ${teamName}!`, 'success');
      }
      setTeamModalOpen(false);
      setTimeout(() => navigate('/my-events'), 1500);
    } catch (err) {
      showNotification(err.response?.data?.message || 'Team registration failed', 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSaveAndRegister = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const role = localStorage.getItem('role');
    setIsRegistering(true);
    try {
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${role}/${user.id}`, modalInputs);
      const updatedUser = res.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setMissingFieldsModalOpen(false);
      showNotification('Profile updated successfully!', 'success');
      if (event.customFields && event.customFields.length > 0) { setCustomFormResponses({}); setCustomFormModalOpen(true); return; }
      if (event.paymentMethod && event.paymentMethod !== 'FREE') {
        setPaymentPayload({
          isTeam: false,
          studentId: updatedUser.id,
          formResponses: {}
        });
        setPaymentType(event.paymentMethod);
        setPaymentModalOpen(true);
        return;
      }
      const regRes = await axios.post(`${import.meta.env.VITE_API_URL}/api/events/${event.id || event._id}/register`, { studentId: updatedUser.id });
      showNotification(regRes.data.message, 'success');
      setTimeout(() => navigate('/my-events'), 1500);
    } catch (err) { showNotification(err.response?.data?.message || 'Failed to update profile', 'error'); }
    finally { setIsRegistering(false); }
  };

  const handleCustomFormSubmit = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    setIsRegistering(true);
    if (event.customFields) {
      for (const field of event.customFields) {
        if (field.required && !customFormResponses[field.label]) {
          showNotification(`"${field.label}" is required.`, 'error');
          setIsRegistering(false);
          return;
        }
      }
    }
    if (event.paymentMethod && event.paymentMethod !== 'FREE') {
      setPaymentPayload({
        isTeam: false,
        studentId: user.id,
        formResponses: customFormResponses
      });
      setPaymentType(event.paymentMethod);
      setCustomFormModalOpen(false);
      setPaymentModalOpen(true);
      setIsRegistering(false);
      return;
    }
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/events/${event.id || event._id}/register`, { studentId: user.id, formResponses: customFormResponses });
      showNotification(res.data.message, 'success');
      setCustomFormModalOpen(false);
      setTimeout(() => navigate('/my-events'), 1500);
    } catch (err) { showNotification(err.response?.data?.message || 'Registration failed', 'error'); }
    finally { setIsRegistering(false); }
  };

  // ── Share handlers ──────────────────────────────────────────────────────────
  const getShareText = () => {
    if (!event) return '';
    return `*_Event Alert 🚨_*\n\n*${event.title}*\n*Venue*: ${event.venue}\n*Date*: ${new Date(event.startTime).toLocaleDateString('en-IN')}\n*Time*: ${new Date(event.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}\n*Entry Fee*: ${event.entryFee ? `₹${event.entryFee}` : 'Free'}\n*Event By*: ${event.club?.clubName || event.createdBy?.clubName}\n*Hosted On*: *_CampusNode_*\n\n*More Info*: `;
  };

  const handleShare = () => {
    const message = getShareText();
    if (navigator.share) {
      navigator.share({ title: `${event.title} - CampusNode`, text: message, url: window.location.href }).catch((error) => console.error('Error sharing:', error));
    } else {
      navigator.clipboard.writeText(message + window.location.href).then(() => showNotification('Event details copied to clipboard', 'success')).catch((error) => console.error('Clipboard error:', error));
    }
  };

  const handleWhatsAppShare = () => {
    const message = getShareText() + window.location.href;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleXShare = () => {
    const text = `Check out "${event.title}" on CampusNode! 🎉`;
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => showNotification('Link copied to clipboard!', 'success'))
      .catch(() => showNotification('Failed to copy link', 'error'));
  };

  // ── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] border-black dark:border-white border-t-orange-600 rounded-full animate-spin" />
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">Loading event…</p>
        </div>
      </div>
    );
  }

  // ── Error State ──────────────────────────────────────────────────────────
  if (error || !event) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center px-6">
        <div className="border-2 border-black dark:border-neutral-700 rounded-sm p-10 text-center max-w-sm bg-white dark:bg-neutral-900">
          <div className="w-14 h-14 bg-orange-600 rounded-sm flex items-center justify-center text-white text-2xl mx-auto mb-5">
            <i className="ri-error-warning-line" />
          </div>
          <h2 className="font-black text-xl text-black dark:text-white mb-2">Oops!</h2>
          <p className="text-neutral-500 text-[14px] mb-6">{error || 'Event not found'}</p>
          <button onClick={() => navigate('/events')} className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-[12px] font-bold uppercase tracking-widest rounded-sm hover:bg-orange-600 transition-colors cursor-pointer border-2 border-black">
            <i className="ri-arrow-left-line" /> Back to Events
          </button>
        </div>
      </div>
    );
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const { title, description, venue, startTime, endTime, totalSeats, registeredCount, views, status, registrationDeadline, entryFee } = event;
  const isUnlimited = !totalSeats || totalSeats === 0;
  const isFull = !isUnlimited && registeredCount >= totalSeats;
  const isLive = status === 'LIVE';
  const isEnded = status === 'ENDED';
  const deadline = registrationDeadline || startTime;
  const isDeadlinePassed = new Date() > new Date(deadline);
  const fillPct = isUnlimited ? 0 : Math.min(100, Math.round((registeredCount / totalSeats) * 100));
  const winners = (event.winners || []).filter(w => w.name);
  const showWinners = isEnded && event.showWinner && winners.length > 0;
  const medalConfig = {
    1: { bg: 'bg-yellow-400', border: 'border-yellow-500', icon: 'ri-medal-line', label: '1st' },
    2: { bg: 'bg-neutral-300', border: 'border-neutral-400', icon: 'ri-medal-line', label: '2nd' },
    3: { bg: 'bg-orange-400', border: 'border-orange-500', icon: 'ri-medal-line', label: '3rd' },
  };

  const clubCategory = event.club?.category || null;
  const clubSlugOrId = event.club?.slug || event.club?._id || event.club?.id || event.createdBy?.slug || event.createdBy?._id || event.createdBy?.id;
  const displayName = event.club?.clubName || event.createdBy?.clubName || '—';

  const btnConfig = isEnded
    ? { label: showWinners ? 'View Results' : 'Event Ended', cls: 'bg-neutral-800 text-white border-black hover:bg-orange-600 hover:border-orange-600 cursor-pointer', disabled: false }
    : isLive
    ? { label: 'Event is Live', cls: 'bg-orange-600 text-white border-orange-600 cursor-not-allowed', disabled: true }
    : isDeadlinePassed
    ? { label: 'Deadline Passed', cls: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed border-neutral-200 dark:border-neutral-700', disabled: true }
    : alreadyRegistered
    ? { label: 'Already Registered', cls: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed border-neutral-200 dark:border-neutral-700', disabled: true }
    : isFull
    ? { label: 'Join Waitlist', cls: 'bg-yellow-400 text-black border-black hover:bg-yellow-300 cursor-pointer', disabled: false }
    : { label: entryFee > 0 ? `Pay ₹${entryFee} & Register` : 'Get Tickets', cls: 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white hover:bg-orange-600 hover:border-orange-600 hover:text-white cursor-pointer', disabled: false };

  const user = JSON.parse(localStorage.getItem('user'));

  // ── Auto-generated highlights ──────────────────────────────────────────────
  const highlights = [
    { icon: 'ri-group-line', label: 'Capacity', value: isUnlimited ? 'Unlimited Seats' : `${totalSeats} Seats` },
    { icon: 'ri-coin-line', label: 'Entry Fee', value: entryFee > 0 ? `₹${entryFee}` : 'Free Entry' },
    { icon: 'ri-time-line', label: 'Duration', value: (() => {
      const diff = new Date(endTime) - new Date(startTime);
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      return hrs > 0 ? `${hrs}h ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`;
    })() },
    ...(event.provideCertificate ? [{ icon: 'ri-award-line', label: 'Certificate', value: 'Provided' }] : []),
    ...(event.showWinner ? [{ icon: 'ri-trophy-line', label: 'Competition', value: 'Winners Announced' }] : []),
    ...(event.allowedPrograms && event.allowedPrograms.length > 0 && event.allowedPrograms.length < 3
      ? [{ icon: 'ri-graduation-cap-line', label: 'Open To', value: event.allowedPrograms.join(', ') }]
      : [{ icon: 'ri-graduation-cap-line', label: 'Open To', value: 'All Programs' }]),
  ];

  // ── Auto-generated FAQ ──────────────────────────────────────────────────
  // ── Auto-generated FAQ ──────────────────────────────────────────────────
  const faqItems = [
    {
      question: 'When and where is the event scheduled?',
      answer: `The event starts on ${new Date(startTime).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Kolkata' })} at ${new Date(startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })} and ends on ${new Date(endTime).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Kolkata' })} at ${new Date(endTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}. It will be held at ${venue}.`,
    },
    {
      question: 'What are the registration details, deadline, and entry fees?',
      answer: `${
        registrationDeadline
          ? `Registration closes on ${new Date(registrationDeadline).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Kolkata' })} at ${new Date(registrationDeadline).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}.`
          : 'There is no separate registration deadline — registrations remain open until the event starts.'
      } ${
        (event.registrationFee > 0 || entryFee > 0)
          ? `The entry fee is ₹${event.registrationFee || entryFee} (non-refundable), payable securely via the event's designated payment method.`
          : 'This event is completely free to attend!'
      } ${
        user
          ? (event.customFields && event.customFields.length > 0
            ? 'Click the "Get Tickets" button to complete the required custom fields and submit your registration.'
            : 'Simply click the "Get Tickets" button to register instantly.')
          : 'Please log in with your student account first to submit your registration.'
      }`,
    },
    {
      question: 'What is the seat capacity, program eligibility, and are certificates provided?',
      answer: `${
        isUnlimited
          ? 'This event has unlimited seat capacity.'
          : isFull
            ? `All ${totalSeats} seats are filled. However, you can register to join the waitlist and secure a spot if any attendee cancels.`
            : `There are ${totalSeats - registeredCount} spots remaining out of ${totalSeats} total seats.`
      } ${
        event.allowedPrograms && event.allowedPrograms.length > 0
          ? `Eligibility is open to the following programs: ${event.allowedPrograms.join(', ')}.`
          : 'All academic programs are welcome to register.'
      } ${
        event.provideCertificate
          ? 'Digital certificates will be issued to participants after the event closes, downloadable directly from your profile.'
          : 'No certificates will be provided for this event.'
      }`,
    },
    {
      question: 'Who is organizing this event and can I cancel my ticket?',
      answer: `This event is organized by ${displayName}.${
        clubSlugOrId ? ' You can click the organizer name in the sidebar to visit their club page.' : ''
      } If you need to cancel your registration, you can do so in the "My Events" section on CampusNode before the event begins.`,
    }
  ];

  // ══════════════════════════════════════════════════════════════════════════
  // ── RENDER ──
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">

      {/* ── Top Bar ── */}
      <div className="sticky top-0 z-30 bg-neutral-50/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200/50 dark:border-neutral-800/50">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-black dark:text-white hover:text-orange-600 transition-colors cursor-pointer"
          >
            <i className="ri-arrow-left-line text-base" /> Back
          </button>
          <span className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400 tracking-wide truncate max-w-[200px] hidden sm:block">Event Details</span>
          <div className="w-16" />
        </div>
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ═══════════════ LEFT COLUMN: Context & Narrative (65%) ═══════════════ */}
          <div className="w-full lg:w-[65%] min-w-0">

            {/* ── Breadcrumb Navigation ── */}
            <nav className="flex items-center gap-1.5 text-[11px] text-neutral-400 dark:text-neutral-500 mb-5 flex-wrap">
              <Link to="/" className="hover:text-orange-600 transition-colors">Home</Link>
              <i className="ri-arrow-right-s-line text-[10px]" />
              <Link to="/events" className="hover:text-orange-600 transition-colors">Events</Link>
              {clubCategory && (
                <>
                  <i className="ri-arrow-right-s-line text-[10px]" />
                  <span className="text-neutral-500 dark:text-neutral-400">{clubCategory}</span>
                </>
              )}
              <i className="ri-arrow-right-s-line text-[10px]" />
              <span className="text-neutral-600 dark:text-neutral-300 font-medium truncate max-w-[180px]">{title}</span>
            </nav>

            {/* ── Event Poster ── */}
            <div className="mb-6 rounded-2xl overflow-hidden border-2 border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 relative">
              <img
                src={event.imageUrl || DEFAULT_IMAGE}
                alt={title}
                className="w-full object-contain"
                style={{ maxHeight: '560px' }}
                onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
              />
              {/* Status badge overlay */}
              <div className="absolute top-4 left-4">
                {isLive && (
                  <span className="inline-flex items-center gap-1.5 bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full animate-pulse shadow-lg">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" /> Live Now
                  </span>
                )}
                {isEnded && (
                  <span className="inline-flex items-center gap-1.5 bg-zinc-800 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                    <i className="ri-check-line" /> Ended
                  </span>
                )}
                {!isLive && !isEnded && (
                  <span className="inline-flex items-center gap-1.5 bg-yellow-400 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                    <i className="ri-time-line" /> Upcoming
                  </span>
                )}
              </div>
            </div>

            {/* ── Category & Status Badges ── */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {clubCategory && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/50 text-[11px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400">
                  {clubCategory}
                </span>
              )}
              {entryFee === 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/50 text-[11px] font-bold uppercase tracking-wider text-green-700 dark:text-green-400">
                   Free
                </span>
              )}
              {event.provideCertificate && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                   Certificate
                </span>
              )}
            </div>

            {/* ── Primary Heading (h1) ── */}
            <h1 className="font-black text-3xl md:text-4xl text-black dark:text-white leading-tight tracking-tight mb-4">
              {title}
            </h1>

            {/* ── Quick-Scan Inline Metadata ── */}
            <div className="flex items-center gap-4 flex-wrap text-[13px] text-neutral-500 dark:text-neutral-400 mb-8 pb-6 border-b border-neutral-200 dark:border-neutral-800">
              <span className="inline-flex items-center gap-1.5">
                <i className="ri-calendar-event-line text-orange-500" />
                {new Date(startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
              <span className="inline-flex items-center gap-1.5">
                <i className="ri-map-pin-2-line text-orange-500" />
                <span className="truncate max-w-[160px]">{venue}</span>
              </span>
              <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
              {clubSlugOrId ? (
                <Link to={`/club/${clubSlugOrId}`} className="inline-flex items-center gap-1.5 hover:text-orange-600 transition-colors">
                  <i className="ri-team-line text-orange-500" />
                  <span className="truncate max-w-[140px]">{displayName}</span>
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <i className="ri-team-line text-orange-500" />
                  <span className="truncate max-w-[140px]">{displayName}</span>
                </span>
              )}
              <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
              <span className="inline-flex items-center gap-1.5">
                <i className="ri-user-line text-orange-500" />
                {registeredCount} Registered
              </span>
              <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
              <span className="inline-flex items-center gap-1.5" title="Total event views">
                <i className="ri-eye-line text-orange-500" />
                {views || 0} Views
              </span>
            </div>

            {/* ── Rich Text Description ── */}
            {description && (
              <div className="mb-8">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-500 mb-3">
                  About this Event
                </h2>
                <div className="text-[15px] text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {description}
                </div>
              </div>
            )}

            {/* ── Event Highlights Matrix ── */}
            <div className="mb-8">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-500 mb-4">
                Event Highlights
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {highlights.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-orange-300 dark:hover:border-orange-700 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center shrink-0">
                      <i className={`${h.icon} text-orange-600 dark:text-orange-400 text-base`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-0.5">{h.label}</p>
                      <p className="text-[13px] font-semibold text-black dark:text-white leading-snug">{h.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Sponsors Section ── */}
            {event.sponsors && event.sponsors.length > 0 && (
              <div className="mb-8">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-500 mb-4">
                  Sponsors
                </h3>
                <div className="flex flex-wrap gap-5 items-center ">
                  {event.sponsors.map((sponsor, i) => (
                    <a
                      key={i}
                      href={sponsor.websiteUrl || '#'}
                      target={sponsor.websiteUrl ? "_blank" : "_self"}
                      rel="noopener noreferrer"
                      className={`flex flex-col items-center gap-1.5 transition-opacity justify-center ${
                        sponsor.websiteUrl ? 'cursor-pointer hover:opacity-100 opacity-80' : 'cursor-default opacity-80'
                      }`}
                    >
                      <img
                        src={sponsor.logoUrl}
                        alt={sponsor.name}
                        className="h-7 w-auto object-contain bg-white dark:bg-white "
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/28?text=' + sponsor.name[0]; }}
                      />
                      <span className="text-[11px] font-medium text-black dark:text-white tracking-wide text-center">
                        {sponsor.name}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* ── Gallery Section ── */}
            {event.media && event.media.filter(m => m.type !== 'SPONSOR_LOGO').length > 0 && (
              <div className="mb-8">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-500 mb-4">
                  Gallery
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {event.media.filter(m => m.type !== 'SPONSOR_LOGO').map((item, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 relative group">
                      {item.type === 'IMAGE' ? (
                        <div className="w-full h-full cursor-zoom-in" onClick={() => window.open(item.url, '_blank')}>
                          <img
                            src={item.url}
                            alt={`Gallery ${i}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.07]"
                          />
                        </div>
                      ) : (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full h-full flex flex-col items-center justify-center bg-black gap-1.5"
                        >
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="white" className="opacity-80">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                          <span className="text-[9px] text-white font-medium uppercase tracking-widest opacity-50">Watch</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Winners Section ── */}
            {showWinners && (
              <div id="winners-section" className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-yellow-400 border border-black/10 rounded-lg flex items-center justify-center text-black text-lg">
                    <i className="ri-trophy-fill" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Event Results</p>
                    <p className="text-[15px] font-black text-black dark:text-white">Winners</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[...winners].sort((a, b) => a.rank - b.rank).map((winner, i) => {
                    const medal = medalConfig[winner.rank];
                    return (
                      <div key={i} className={`flex items-center gap-4 px-4 py-3 border rounded-lg ${medal ? medal.bg : 'bg-neutral-50 dark:bg-neutral-900'} border-neutral-200 dark:border-neutral-700`}>
                        <div className={`w-8 h-8 shrink-0 rounded-md border-2 ${medal ? medal.border : 'border-neutral-300 bg-white'} flex items-center justify-center`}>
                          {medal ? <i className={`${medal.icon} text-black text-sm`} /> : <span className="text-xs font-black text-neutral-500">#{winner.rank}</span>}
                        </div>
                        <p className="text-[14px] font-black text-black dark:text-white flex-1 truncate">{winner.name}</p>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-black/50 dark:text-white/50">{medal ? medal.label : `#${winner.rank}`}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── FAQ Accordion ── */}
            <div className="mb-8">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-500 mb-4">
                Frequently Asked Questions
              </h2>
              <div className="space-y-2">
                {faqItems.map((item, i) => (
                  <FAQItem
                    key={i}
                    question={item.question}
                    answer={item.answer}
                    isOpen={openFAQ === i}
                    onToggle={() => setOpenFAQ(openFAQ === i ? null : i)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ═══════════════ RIGHT COLUMN: Transactional Widget (35%) ═══════════════ */}
          <div className="w-full lg:w-[35%] lg:sticky lg:top-[80px] shrink-0">
            <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">

              {/* ── Date & Time Module ── */}
              <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500 mb-3 flex items-center gap-1.5">
                  <i className="ri-calendar-event-line text-orange-500 text-xs" /> DATE & TIME
                </p>
                <div className="space-y-2.5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Starts</p>
                    <p className="text-[16px] font-bold text-black dark:text-white leading-snug">
                      {new Date(startTime).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Kolkata' })}
                    </p>
                    <p className="text-[14px] font-semibold text-orange-600">
                      {new Date(startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}
                    </p>
                  </div>
                  <div className="w-full h-px bg-neutral-100 dark:bg-neutral-800" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Ends</p>
                    <p className="text-[14px] font-semibold text-neutral-700 dark:text-neutral-300">
                      {new Date(endTime).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' })}
                      {' · '}
                      {new Date(endTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Seat Progress ── */}
              {!isUnlimited && (
                <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Availability</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-black dark:text-white">{fillPct}% Full</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${fillPct >= 90 ? 'bg-red-500' : fillPct >= 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1.5">
                    {registeredCount} / {totalSeats} seats filled
                  </p>
                  {isFull && (
                    <p className="text-[11px] text-orange-600 font-semibold mt-1">All seats filled — registering adds you to the waitlist.</p>
                  )}
                </div>
              )}

              {/* ── Already Registered / Registration ID ── */}
              {alreadyRegistered && (
                <div className="mx-6 mt-4 flex items-center gap-3 px-4 py-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 rounded-full">
                  <i className="ri-checkbox-circle-line text-orange-600 text-lg shrink-0" />
                  <p className="text-[13px] font-semibold text-orange-700 dark:text-orange-400">You are already registered for this event.</p>
                </div>
              )}

              {registrationId && (
                <div className="mx-6 mt-4 flex flex-col items-center gap-3.5 px-6 py-6 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/30 rounded-2xl">
                  <div className="w-12 h-12 bg-emerald-100/80 dark:bg-emerald-900/40 rounded-full flex items-center justify-center text-emerald-600">
                    <i className="ri-checkbox-circle-fill text-2xl" />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Registration Successful!</p>
                    <p className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 mt-1">Check your dashboard for the ticket QR code</p>
                  </div>
                  
                  <div className="w-full bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-850 p-4 rounded-xl text-center shadow-sm">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1.5">Ticket ID / Ref Number</p>
                    <p className="text-base font-black text-neutral-900 dark:text-neutral-100 tracking-wider font-mono select-all">
                      {registrationId}
                    </p>
                  </div>

                  <Link 
                    to="/my-events" 
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 dark:text-orange-500 dark:hover:text-orange-400 hover:underline"
                  >
                    View My Tickets <i className="ri-arrow-right-s-line" />
                  </Link>
                </div>
              )}

              {/* ── Primary CTA ── */}
              <div className="px-6 py-5">
                {/* Horizontal Metadata Anchor */}
                <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-4 px-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <i className="ri-map-pin-2-line text-neutral-400 dark:text-neutral-500 text-sm shrink-0" />
                    <span className="truncate font-medium text-neutral-700 dark:text-neutral-300">{venue}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <i className="ri-ticket-2-line text-neutral-400 dark:text-neutral-500 text-sm" />
                    <span className={`font-black text-sm ${entryFee > 0 ? 'text-black dark:text-white' : 'text-green-600 dark:text-green-400'}`}>
                      {entryFee > 0 ? `₹${entryFee}` : 'Free'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={!btnConfig.disabled && !isRegistering
                      ? (isEnded
                        ? () => document.getElementById('winners-section')?.scrollIntoView({ behavior: 'smooth' })
                        : handleRegister)
                      : undefined}
                    disabled={btnConfig.disabled || isRegistering}
                    className={`flex-1 py-3 px-6 text-[13px] font-black uppercase tracking-[0.15em] border-2 rounded-full transition-all flex items-center justify-center gap-2 ${btnConfig.cls} ${(btnConfig.disabled || isRegistering) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {isRegistering ? (
                      <><i className="ri-loader-4-line animate-spin text-base" /> Processing…</>
                    ) : btnConfig.label}
                  </button>

                  {status === 'UPCOMING' && (
                    <CalendarDropdown
                      event={event}
                      btnClassName="w-12 h-12 flex items-center justify-center border border-neutral-200 dark:border-neutral-800 rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-850 text-neutral-600 dark:text-neutral-400 cursor-pointer shadow-sm transition-colors shrink-0"
                    />
                  )}
                </div>

                {registrationDeadline && !isEnded && (
                  <p className="text-[11px] font-medium text-neutral-550 dark:text-neutral-450 mt-3 text-center">
                    Registration closes: {new Date(registrationDeadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}
                  </p>
                )}
              </div>

              {/* ── Organizer ── */}
              <div className="px-6 pb-4 border-t border-neutral-100 dark:border-neutral-800 pt-4">
                <div className="flex items-center gap-3">
                  {clubSlugOrId ? (
                    <Link
                      to={`/club/${clubSlugOrId}`}
                      className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center shrink-0 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors overflow-hidden"
                    >
                      {event.club?.clubLogo ? (
                        <img src={event.club.clubLogo} alt={displayName} className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <i className="ri-team-line text-orange-600 text-sm" />
                      )}
                    </Link>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center shrink-0">
                      <i className="ri-team-line text-orange-600 text-sm" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Organized by</p>
                    {clubSlugOrId ? (
                      <Link
                        to={`/club/${clubSlugOrId}`}
                        className="text-[13px] font-bold text-black dark:text-white hover:text-orange-600 transition-colors duration-200 truncate block hover:underline"
                      >
                        {displayName}
                      </Link>
                    ) : (
                      <p className="text-[13px] font-bold text-black dark:text-white truncate">{displayName}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Social Sharing Row ── */}
              <div className="px-6 pb-5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-3">Share Event</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleWhatsAppShare}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/40 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors cursor-pointer"
                    title="Share on WhatsApp"
                  >
                    <i className="ri-whatsapp-line text-lg" />
                  </button>
                  <button
                    onClick={handleXShare}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                    title="Share on X"
                  >
                    <i className="ri-twitter-x-line text-lg" />
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                    title="Copy link"
                  >
                    <i className="ri-link text-lg" />
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/40 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors cursor-pointer"
                    title="More sharing options"
                  >
                    <i className="ri-share-forward-line text-lg" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Fixed Bottom CTA ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-neutral-900 border-t-2 border-neutral-200 dark:border-neutral-800 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className={`text-[18px] font-black leading-none ${entryFee > 0 ? 'text-black dark:text-white' : 'text-green-600'}`}>
              {entryFee > 0 ? `₹${entryFee}` : 'Free'}
            </p>
            <p className="text-[11px] text-neutral-400 truncate">{title}</p>
          </div>
          <button
            onClick={!btnConfig.disabled && !isRegistering
              ? (isEnded
                ? () => document.getElementById('winners-section')?.scrollIntoView({ behavior: 'smooth' })
                : handleRegister)
              : undefined}
            disabled={btnConfig.disabled || isRegistering}
            className={`px-6 py-3 text-[12px] font-black uppercase tracking-[0.12em] border-2 rounded-full transition-all flex items-center gap-2 shrink-0 ${btnConfig.cls} ${(btnConfig.disabled || isRegistering) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isRegistering ? (
              <><i className="ri-loader-4-line animate-spin text-sm" /> …</>
            ) : btnConfig.label}
          </button>
        </div>
      </div>
      {/* Spacer for mobile CTA */}
      <div className="lg:hidden h-20" />

      {/* ── Missing Fields Modal ── */}
      {missingFieldsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-xl max-w-md w-full shadow-2xl">
            <div className="bg-orange-600 px-6 py-4 rounded-t-xl border-b-2 border-black dark:border-neutral-700">
              <h3 className="font-black text-white text-lg flex items-center gap-2">
                <i className="ri-information-line" /> Complete Your Profile
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-5 leading-relaxed">
                This event requires the following profile information. Please add them to continue with registration:
              </p>
              <div className="space-y-4">
                {missingFields.map((field) => {
                  const fieldLabel = field.replace('Profile', '').replace('Url', '');
                  const placeholder = field === 'portfolioUrl' ? 'https://yourportfolio.com' : `https://${fieldLabel.toLowerCase()}.com/yourprofile`;
                  return (
                    <div key={field}>
                      <label className="block text-sm font-bold text-black dark:text-white mb-1.5 capitalize">
                        {fieldLabel} <span className="text-orange-600">*</span>
                      </label>
                      <input type="url" placeholder={placeholder} value={modalInputs[field] || ''} onChange={(e) => setModalInputs({ ...modalInputs, [field]: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:border-orange-600 focus:outline-none transition-colors bg-white dark:bg-neutral-800 text-black dark:text-white" />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => { setMissingFieldsModalOpen(false); setModalInputs({}); }} className="flex-1 px-4 py-3 bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-600 text-black dark:text-white font-bold text-sm uppercase tracking-widest rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer">
                Cancel
              </button>
              <button onClick={handleSaveAndRegister} disabled={missingFields.some(field => !modalInputs[field]) || isRegistering} className="flex-1 px-4 py-3 bg-black dark:bg-white border-2 border-black dark:border-white text-white dark:text-black font-bold text-sm uppercase tracking-widest rounded-lg hover:bg-orange-600 hover:border-orange-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                {isRegistering ? 'Processing...' : 'Save & Register'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Form Modal ── */}
      {customFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-xl max-w-lg w-full shadow-2xl max-h-[90vh] flex flex-col">
            <div className="bg-orange-600 px-6 py-4 rounded-t-xl border-b-2 border-black dark:border-neutral-700 shrink-0">
              <h3 className="font-black text-white text-lg flex items-center gap-2">
                <i className="ri-file-list-3-line" /> Registration Form
              </h3>
              <p className="text-white/80 text-xs mt-1">Fill in the details to complete your registration</p>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">Your Profile (Auto-filled)</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Name', value: JSON.parse(localStorage.getItem('user'))?.name },
                    { label: 'Roll No', value: JSON.parse(localStorage.getItem('user'))?.rollNo },
                    { label: 'Email', value: JSON.parse(localStorage.getItem('user'))?.email },
                    { label: 'Branch', value: JSON.parse(localStorage.getItem('user'))?.branch },
                    { label: 'Year', value: JSON.parse(localStorage.getItem('user'))?.year },
                    { label: 'Program', value: JSON.parse(localStorage.getItem('user'))?.program },
                  ].map((item, i) => (
                    <div key={i} className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{item.label}</p>
                      <p className="text-sm font-medium text-black dark:text-white truncate">{item.value || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t-2 border-neutral-100 dark:border-neutral-800 mb-6" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">Additional Information</p>
              <div className="space-y-4">
                {(event.customFields || []).map((field, idx) => (
                  <div key={idx}>
                    <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                      {field.label}{' '}{field.required && <span className="text-orange-600">*</span>}
                    </label>
                    {field.type === 'text' && (
                      <input type="text" placeholder={`Enter ${field.label.toLowerCase()}`} value={customFormResponses[field.label] || ''} onChange={(e) => setCustomFormResponses({ ...customFormResponses, [field.label]: e.target.value })} className="w-full px-4 py-2.5 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:border-orange-600 focus:outline-none transition-colors bg-white dark:bg-neutral-800 text-black dark:text-white" />
                    )}
                    {field.type === 'url' && (
                      <input type="url" placeholder="https://..." value={customFormResponses[field.label] || ''} onChange={(e) => setCustomFormResponses({ ...customFormResponses, [field.label]: e.target.value })} className="w-full px-4 py-2.5 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:border-orange-600 focus:outline-none transition-colors bg-white dark:bg-neutral-800 text-black dark:text-white" />
                    )}
                    {field.type === 'textarea' && (
                      <textarea rows="3" placeholder={`Enter ${field.label.toLowerCase()}`} value={customFormResponses[field.label] || ''} onChange={(e) => setCustomFormResponses({ ...customFormResponses, [field.label]: e.target.value })} className="w-full px-4 py-2.5 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:border-orange-600 focus:outline-none transition-colors resize-none bg-white dark:bg-neutral-800 text-black dark:text-white" />
                    )}
                    {field.type === 'select' && (
                      <select value={customFormResponses[field.label] || ''} onChange={(e) => setCustomFormResponses({ ...customFormResponses, [field.label]: e.target.value })} className="w-full px-4 py-2.5 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:border-orange-600 focus:outline-none transition-colors bg-white dark:bg-neutral-800 text-black dark:text-white">
                        <option value="">Select an option</option>
                        {(field.options || []).map((opt, optIdx) => <option key={optIdx} value={opt}>{opt}</option>)}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 pb-6 pt-3 flex gap-3 border-t border-neutral-100 dark:border-neutral-800 shrink-0">
              <button onClick={() => { setCustomFormModalOpen(false); setCustomFormResponses({}); }} className="flex-1 px-4 py-3 bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-600 text-black dark:text-white font-bold text-sm uppercase tracking-widest rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer">
                Cancel
              </button>
              <button onClick={handleCustomFormSubmit} disabled={isRegistering} className="flex-1 px-4 py-3 bg-black dark:bg-white border-2 border-black dark:border-white text-white dark:text-black font-bold text-sm uppercase tracking-widest rounded-lg hover:bg-orange-600 hover:border-orange-600 hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                {isRegistering ? 'Processing...' : (event.paymentMethod && event.paymentMethod !== 'FREE' ? 'Pay & Register' : 'Register')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Registration Success Modal ── */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 py-6 overflow-y-auto ticket-backdrop-animate">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-sm w-full relative overflow-hidden flex flex-col p-6 text-center shadow-2xl ticket-card-animate">
            <div className="relative">
              <img src="/Success popup.svg" alt="Registration Successful" className="w-48 h-48 mx-auto animate-bounce-slow" />
              <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
            </div>
            
            <h3 className="text-xl font-black text-neutral-900 dark:text-white mt-4">Registration Successful!</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
              You are in! Your ticket has been confirmed. You can show the QR code below at the venue entry.
            </p>
            
            {registrationId && (
              <div className="my-5 p-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-850 rounded-2xl">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1.5">Your Registration ID</p>
                <p className="text-lg font-black text-neutral-900 dark:text-neutral-100 tracking-wider font-mono select-all">
                  {registrationId}
                </p>
              </div>
            )}

            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-full transition shadow-sm border-0 outline-none text-xs uppercase tracking-wider cursor-pointer"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}

      {/* ── Team Registration Choice Modal ── */}
      {teamChoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-2xl max-w-sm w-full shadow-2xl p-6">
            <h3 className="font-black text-black dark:text-white text-lg mb-2">Registration Mode</h3>
            <p className="text-neutral-500 text-xs mb-6">Choose how you want to participate in this event.</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setTeamChoiceModalOpen(false);
                  handleIndividualRegister();
                }}
                className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-600 text-black dark:text-white font-bold text-sm uppercase tracking-widest rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                Register as Individual
              </button>
              <button
                onClick={handleSelectRegisterAsTeam}
                className="w-full px-4 py-3 bg-black dark:bg-white border-2 border-black dark:border-white text-white dark:text-black font-bold text-sm uppercase tracking-widest rounded-lg hover:bg-orange-600 hover:border-orange-600 hover:text-white transition-colors cursor-pointer"
              >
                Register as Team
              </button>
              <button
                onClick={() => setTeamChoiceModalOpen(false)}
                className="w-full px-4 py-2 mt-2 text-xs text-neutral-400 hover:text-black dark:hover:text-white transition-colors border-0 bg-transparent outline-none cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Team Registration Modal ── */}
      {teamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-xl max-w-lg w-full shadow-2xl max-h-[90vh] flex flex-col">
            <div className="bg-orange-600 px-6 py-4 rounded-t-xl border-b-2 border-black dark:border-neutral-700 shrink-0">
              <h3 className="font-black text-white text-lg flex items-center gap-2">
                <i className="ri-group-line" /> Create Team
              </h3>
              <p className="text-white/80 text-xs mt-1">Form a team to register for {event.title}</p>
            </div>
            
            <form onSubmit={handleTeamSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Team Name */}
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5 font-sans">Team Name <span className="text-orange-600">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Enter a unique team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:border-orange-600 focus:outline-none transition-colors bg-white dark:bg-neutral-800 text-black dark:text-white"
                />
              </div>

              {/* Members/Teammates selection */}
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1.5">
                  Add Teammates <span className="text-xs text-neutral-400 font-medium">(Team size: {teammates.length + 1} / min {event.minTeamSize || 1}, max {event.maxTeamSize || 1})</span>
                </label>
                <div className="relative">
                  <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search by Email or Roll Number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:border-orange-500 focus:outline-none bg-white dark:bg-neutral-800 text-black dark:text-white"
                  />
                  {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <i className="ri-loader-4-line animate-spin text-orange-600" />
                    </div>
                  )}
                </div>

                {/* Autocomplete dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute z-50 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg w-[calc(100%-3rem)] max-w-md divide-y divide-neutral-100 dark:divide-neutral-800">
                    {searchResults.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setTeammates([...teammates, s]);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        className="p-3 text-xs hover:bg-orange-50 dark:hover:bg-neutral-800 cursor-pointer flex justify-between items-center transition-colors"
                      >
                        <div className="text-left">
                          <p className="font-bold text-neutral-800 dark:text-neutral-200">{s.name}</p>
                          <p className="text-neutral-400 font-mono mt-0.5">{s.rollNo} • {s.email}</p>
                        </div>
                        <span className="text-orange-600 font-bold uppercase tracking-wider text-[9px] px-2 py-0.5 bg-orange-50 dark:bg-orange-950/20 border border-orange-200/50 rounded">Add</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Roster list */}
              <div className="bg-neutral-50 dark:bg-neutral-800/40 p-4 border border-neutral-200 dark:border-neutral-850 rounded-xl space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 text-left">Team Roster</p>
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {/* Leader */}
                  <div className="py-2.5 flex justify-between items-center text-xs">
                    <div className="text-left">
                      <p className="font-bold text-neutral-800 dark:text-neutral-200">{JSON.parse(localStorage.getItem('user'))?.name} <span className="text-orange-600 font-extrabold">(You)</span></p>
                      <p className="text-neutral-400 font-mono mt-0.5">{JSON.parse(localStorage.getItem('user'))?.rollNo}</p>
                    </div>
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Leader</span>
                  </div>
                  {/* Members */}
                  {teammates.map((member) => (
                    <div key={member.id} className="py-2.5 flex justify-between items-center text-xs">
                      <div className="text-left">
                        <p className="font-bold text-neutral-800 dark:text-neutral-200">{member.name}</p>
                        <p className="text-neutral-400 font-mono mt-0.5">{member.rollNo}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTeammates(teammates.filter(t => t.id !== member.id))}
                        className="px-2.5 py-1 text-[10px] font-bold text-red-600 hover:text-red-700 bg-transparent border-0 outline-none cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {teammates.length === 0 && (
                    <div className="py-3 text-center text-xs text-neutral-400 font-medium">
                      No teammates added yet. Search above to add.
                    </div>
                  )}
                </div>
              </div>

              {/* Additional custom fields if any */}
              {event.customFields && event.customFields.length > 0 && (
                <div className="space-y-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1 text-left">Additional Information</p>
                  {(event.customFields || []).map((field, idx) => (
                    <div key={idx}>
                      <label className="block text-sm font-bold text-black dark:text-white mb-1.5 text-left">
                        {field.label}{' '}{field.required && <span className="text-orange-600">*</span>}
                      </label>
                      {field.type === 'text' && (
                        <input type="text" placeholder={`Enter ${field.label.toLowerCase()}`} value={customFormResponses[field.label] || ''} onChange={(e) => setCustomFormResponses({ ...customFormResponses, [field.label]: e.target.value })} className="w-full px-4 py-2.5 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:border-orange-600 focus:outline-none transition-colors bg-white dark:bg-neutral-800 text-black dark:text-white" required={field.required} />
                      )}
                      {field.type === 'url' && (
                        <input type="url" placeholder="https://..." value={customFormResponses[field.label] || ''} onChange={(e) => setCustomFormResponses({ ...customFormResponses, [field.label]: e.target.value })} className="w-full px-4 py-2.5 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:border-orange-600 focus:outline-none transition-colors bg-white dark:bg-neutral-800 text-black dark:text-white" required={field.required} />
                      )}
                      {field.type === 'textarea' && (
                        <textarea rows="3" placeholder={`Enter ${field.label.toLowerCase()}`} value={customFormResponses[field.label] || ''} onChange={(e) => setCustomFormResponses({ ...customFormResponses, [field.label]: e.target.value })} className="w-full px-4 py-2.5 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:border-orange-600 focus:outline-none transition-colors resize-none bg-white dark:bg-neutral-800 text-black dark:text-white" required={field.required} />
                      )}
                      {field.type === 'select' && (
                        <select value={customFormResponses[field.label] || ''} onChange={(e) => setCustomFormResponses({ ...customFormResponses, [field.label]: e.target.value })} className="w-full px-4 py-2.5 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:border-orange-600 focus:outline-none transition-colors bg-white dark:bg-neutral-800 text-black dark:text-white" required={field.required}>
                          <option value="">Select an option</option>
                          {(field.options || []).map((opt, optIdx) => <option key={optIdx} value={opt}>{opt}</option>)}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800 shrink-0">
                <button
                  type="button"
                  onClick={() => { setTeamModalOpen(false); setCustomFormResponses({}); }}
                  className="flex-1 px-4 py-3 bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-600 text-black dark:text-white font-bold text-sm uppercase tracking-widest rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer border-0 outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="flex-1 px-4 py-3 bg-black dark:bg-white border-2 border-black dark:border-white text-white dark:text-black font-bold text-sm uppercase tracking-widest rounded-lg hover:bg-orange-600 hover:border-orange-600 hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 outline-none"
                >
                  {isRegistering ? 'Registering...' : (event.entryFee > 0 ? `Pay ₹${event.entryFee} & Create` : 'Create Team')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Dynamic/Manual Payment Modal ── */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        paymentType={paymentType}
        event={event}
        onSubmit={submitRegistrationWithPayment}
        isRegistering={isRegistering}
        showNotification={showNotification}
      />
    </div>
  );
};

export default EventDetails;