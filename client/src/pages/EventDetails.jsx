import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import { loadRazorpay } from '../utils/razorpay';
import CalendarDropdown from '../components/CalendarDropdown';

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
  const [openFAQ, setOpenFAQ] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const viewedKey = `viewed_event_${slug}`;
        const hasViewed = sessionStorage.getItem(viewedKey);
        
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/events/${slug}`, {
          params: { skipIncrement: hasViewed === 'true' }
        });
        
        setEvent(res.data);
        if (res.data.entryFee > 0) loadRazorpay();
        
        if (!hasViewed) {
          sessionStorage.setItem(viewedKey, 'true');
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

  const handleRegister = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const role = localStorage.getItem('role');

    // Authenticated path
    if (user && role === 'member') {
      if (event.requiredFields && event.requiredFields.length > 0) {
        const missing = event.requiredFields.filter(field => !user[field]);
        if (missing.length > 0) {
          setMissingFields(missing);
          setMissingFieldsModalOpen(true);
          return;
        }
      }
      if (event.customFields && event.customFields.length > 0) {
        setCustomFormResponses({});
        setCustomFormModalOpen(true);
        return;
      }
      if (event.entryFee > 0) {
        try {
          await loadRazorpay();
          const orderRes = await axios.post(`${import.meta.env.VITE_API_URL}/api/payment/create-order`, { eventId: event.id || event._id, studentId: user.id });
          const { orderId, amount, currency, keyId, eventTitle } = orderRes.data;
          const options = {
            key: keyId, amount: amount * 100, currency, name: 'CampusNode',
            description: `Registration for ${eventTitle}`, order_id: orderId,
            handler: async (response) => {
              try {
                const verifyRes = await axios.post(`${import.meta.env.VITE_API_URL}/api/payment/verify`, { orderId, paymentId: response.razorpay_payment_id, signature: response.razorpay_signature, eventId: event.id || event._id, studentId: user.id });
                if (verifyRes.data.success) { showNotification(`Successfully registered for ${eventTitle}!`, 'success'); setTimeout(() => navigate('/my-events'), 1500); }
              } catch (err) { showNotification(err.response?.data?.message || 'Payment verification failed', 'error'); }
            },
            prefill: { name: user.name, email: user.email, contact: user.phone || '' },
            theme: { color: '#EA580C' },
            modal: { ondismiss: () => showNotification('Payment cancelled', 'info') }
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
        } catch (err) { showNotification(err.response?.data?.message || 'Failed to initiate payment', 'error'); }
        return;
      }
      setIsRegistering(true);
      try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/events/${event.id || event._id}/register`, { studentId: user.id });
        if (res.data.status === 'WAITLISTED') {
          showNotification('You have been added to the waitlist.', 'info');
        } else if (res.data.status === 'REGISTERED') {
          setRegistrationId(res.data.qrCode);
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
        showNotification('Please enter your name and email to register.', 'warning');
        return;
      }
      setIsRegistering(true);
      try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/events/${event.id || event._id}/register`, { externalEmail, externalName });
        if (res.data.status === 'WAITLISTED') {
          showNotification('You have been added to the waitlist.', 'info');
        } else if (res.data.status === 'REGISTERED') {
          setRegistrationId(res.data.qrCode);
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

    // Logged in but not as a student
    showNotification('Please login as a student to register.', 'warning');
    navigate('/login');
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
      if (event.entryFee > 0) {
        try {
          await loadRazorpay();
          const orderRes = await axios.post(`${import.meta.env.VITE_API_URL}/api/payment/create-order`, { eventId: event._id, studentId: updatedUser.id });
          const { orderId, amount, currency, keyId, eventTitle } = orderRes.data;
          const options = {
            key: keyId, amount: amount * 100, currency, name: 'CampusNode',
            description: `Registration for ${eventTitle}`, order_id: orderId,
            handler: async (response) => {
              try {
                const verifyRes = await axios.post(`${import.meta.env.VITE_API_URL}/api/payment/verify`, { orderId, paymentId: response.razorpay_payment_id, signature: response.razorpay_signature, eventId: event._id, studentId: updatedUser.id });
                if (verifyRes.data.success) { showNotification(`Successfully registered for ${eventTitle}!`, 'success'); setTimeout(() => navigate('/my-events'), 1500); }
              } catch (err) { showNotification(err.response?.data?.message || 'Payment verification failed', 'error'); }
            },
            prefill: { name: updatedUser.name, email: updatedUser.email, contact: updatedUser.phone || '' },
            theme: { color: '#EA580C' }
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
        } catch (err) { showNotification(err.response?.data?.message || 'Failed to initiate payment', 'error'); }
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
    if (event.entryFee > 0) {
      try {
        await loadRazorpay();
        const orderRes = await axios.post(`${import.meta.env.VITE_API_URL}/api/payment/create-order`, { eventId: event.id || event._id, studentId: user.id });
        const { orderId, amount, currency, keyId, eventTitle } = orderRes.data;
        const options = {
          key: keyId, amount: amount * 100, currency, name: 'CampusNode',
          description: `Registration for ${eventTitle}`, order_id: orderId,
          handler: async (response) => {
            try {
              const verifyRes = await axios.post(`${import.meta.env.VITE_API_URL}/api/payment/verify`, { orderId, paymentId: response.razorpay_payment_id, signature: response.razorpay_signature, eventId: event._id, studentId: user.id, formResponses: customFormResponses });
              if (verifyRes.data.success) { showNotification(`Successfully registered for ${eventTitle}!`, 'success'); setCustomFormModalOpen(false); setTimeout(() => navigate('/my-events'), 1500); }
            } catch (err) { showNotification(err.response?.data?.message || 'Payment verification failed', 'error'); }
          },
          prefill: { name: user.name, email: user.email, contact: user.phone || '' },
          theme: { color: '#EA580C' }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (err) { showNotification(err.response?.data?.message || 'Failed to initiate payment', 'error'); }
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
  const faqItems = [
    {
      question: 'When does the event start and end?',
      answer: `The event starts on ${new Date(startTime).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at ${new Date(startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} and ends on ${new Date(endTime).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at ${new Date(endTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}.`,
    },
    {
      question: 'Where is the event being held?',
      answer: `The event will be held at ${venue}.`,
    },
    {
      question: 'What is the registration deadline?',
      answer: registrationDeadline
        ? `Registration closes on ${new Date(registrationDeadline).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at ${new Date(registrationDeadline).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}. Make sure to register before the deadline!`
        : `There is no separate deadline — registration closes when the event starts on ${new Date(startTime).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} at ${new Date(startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}.`,
    },
    {
      question: 'Is there an entry fee?',
      answer: entryFee > 0
        ? `Yes, the entry fee is ₹${entryFee}. Payment is processed securely through Razorpay. Please note that the entry fee is non-refundable.`
        : 'No, this event is completely free to attend! Just register and show up.',
    },
    {
      question: 'How do I register for this event?',
      answer: user
        ? (event.customFields && event.customFields.length > 0
          ? `Click the "Get Tickets" button and fill out the registration form with the required information.${entryFee > 0 ? ` You will then be redirected to pay ₹${entryFee} via Razorpay.` : ''}`
          : `Simply click the "Get Tickets" button to register instantly.${entryFee > 0 ? ` You will be redirected to pay ₹${entryFee} via Razorpay.` : ''} Make sure your profile is up to date.`)
        : `You need to log in with your student account first, then click the "Get Tickets" button to register.${entryFee > 0 ? ` The entry fee of ₹${entryFee} is payable via Razorpay.` : ''}`,
    },
    {
      question: 'How many seats are available?',
      answer: isUnlimited
        ? 'This event has unlimited seats — everyone who registers can attend!'
        : isFull
          ? `All ${totalSeats} seats are currently filled (${registeredCount} registered). You can still join the waitlist and you'll be notified if a spot opens up.`
          : `There are ${totalSeats} total seats, of which ${registeredCount} are already filled. ${totalSeats - registeredCount} spots remaining — register soon!`,
    },
    ...(event.allowedPrograms && event.allowedPrograms.length > 0 ? [{
      question: 'Who is eligible to participate?',
      answer: `This event is open to students from the following programs: ${event.allowedPrograms.join(', ')}.${event.allowedYears && event.allowedYears.length > 0 ? ` Eligible years: ${event.allowedYears.join(', ')}.` : ' All years are welcome.'}`,
    }] : []),
    ...(event.showWinner ? [{
      question: 'Is this a competition? Are there prizes?',
      answer: `Yes, this is a competitive event! Winners will be announced after the event concludes.${showWinners ? ` The results are already out — scroll up to the Winners section to see the results.` : ' Stay tuned for the results after the event ends.'}`,
    }] : []),
    ...(event.provideCertificate ? [{
      question: 'Will certificates be provided?',
      answer: 'Yes! Participants will receive certificates after the event. You can download your certificate from the "My Events" section on CampusNode.',
    }] : []),
    {
      question: `Who is organizing this event?`,
      answer: `This event is organized by ${displayName}.${clubSlugOrId ? ' You can visit their club page for more events and information.' : ''}`,
    },
    ...(!isUnlimited ? [{
      question: 'What happens if seats are full?',
      answer: `If all ${totalSeats} seats are filled, you can join the waitlist. You'll be automatically registered if a spot opens up, and we'll notify you.`,
    }] : []),
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
                <div className="flex flex-wrap gap-5 items-center">
                  {event.sponsors.map((sponsor, i) => (
                    <a
                      key={i}
                      href={sponsor.websiteUrl || '#'}
                      target={sponsor.websiteUrl ? "_blank" : "_self"}
                      rel="noopener noreferrer"
                      className={`flex flex-col items-start gap-1.5 transition-opacity justify-center ${
                        sponsor.websiteUrl ? 'cursor-pointer hover:opacity-100 opacity-80' : 'cursor-default opacity-80'
                      }`}
                    >
                      <img
                        src={sponsor.logoUrl}
                        alt={sponsor.name}
                        className="h-7 w-auto object-contain"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/28?text=' + sponsor.name[0]; }}
                      />
                      <span className="text-[11px] font-medium text-neutral-400 tracking-wide text-center">
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
                      {new Date(startTime).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-[14px] font-semibold text-orange-600">
                      {new Date(startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="w-full h-px bg-neutral-100 dark:bg-neutral-800" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Ends</p>
                    <p className="text-[14px] font-semibold text-neutral-700 dark:text-neutral-300">
                      {new Date(endTime).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                      {' · '}
                      {new Date(endTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Venue Module ── */}
              <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500 mb-2 flex items-center gap-1.5">
                  <i className="ri-map-pin-2-line text-orange-500 text-xs" /> VENUE
                </p>
                <p className="text-[15px] font-bold text-black dark:text-white">{venue}</p>
              </div>

              {/* ── Pricing Module ── */}
              <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500 mb-2 flex items-center gap-1.5">
                  <i className="ri-ticket-2-line text-orange-500 text-xs" /> PRICE
                </p>
                <p className={`text-[22px] font-black leading-none ${entryFee > 0 ? 'text-black dark:text-white' : 'text-green-600 dark:text-green-400'}`}>
                  {entryFee > 0 ? `₹${entryFee}` : 'Free'}
                </p>
                {entryFee > 0 && (
                  <p className="text-[11px] text-neutral-400 mt-1">Non-refundable</p>
                )}
              </div>

              {/* ── Seat Progress ── */}
              {!isUnlimited && (
                <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Availability</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-black dark:text-white">{fillPct}% Full</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${fillPct >= 90 ? 'bg-orange-600' : fillPct >= 60 ? 'bg-yellow-400' : 'bg-black dark:bg-white'}`}
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
                <div className="mx-6 mt-4 flex items-center gap-3 px-4 py-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 rounded-xl">
                  <i className="ri-checkbox-circle-line text-orange-600 text-lg shrink-0" />
                  <p className="text-[13px] font-semibold text-orange-700 dark:text-orange-400">You are already registered for this event.</p>
                </div>
              )}

              {registrationId && (
                <div className="mx-6 mt-4 flex flex-col items-center gap-3 px-4 py-5 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 rounded-xl">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center text-green-600">
                    <i className="ri-checkbox-circle-fill text-xl" />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-green-700 dark:text-green-400">Registration Successful!</p>
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Your Registration ID</p>
                    <p className="text-lg font-black text-black dark:text-white tracking-widest font-mono bg-white dark:bg-neutral-800 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-md">
                      {registrationId}
                    </p>
                  </div>
                  <p className="text-[11px] text-neutral-500 text-center max-w-[220px]">
                    View your ticket and QR code in <Link to="/my-events" className="text-orange-600 font-bold underline">My Events</Link>.
                  </p>
                </div>
              )}

              {/* ── Primary CTA ── */}
              <div className="px-6 py-5">
                <button
                  onClick={!btnConfig.disabled && !isRegistering
                    ? (isEnded
                      ? () => document.getElementById('winners-section')?.scrollIntoView({ behavior: 'smooth' })
                      : handleRegister)
                    : undefined}
                  disabled={btnConfig.disabled || isRegistering}
                  className={`w-full py-4 px-6 text-[13px] font-black uppercase tracking-[0.15em] border-2 rounded-xl transition-all flex items-center justify-center gap-2 ${btnConfig.cls} ${(btnConfig.disabled || isRegistering) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isRegistering ? (
                    <><i className="ri-loader-4-line animate-spin text-base" /> Processing…</>
                  ) : btnConfig.label}
                </button>

                {status === 'UPCOMING' && (
                  <div className="mt-3 flex justify-center">
                    <CalendarDropdown event={event} />
                  </div>
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
            className={`px-6 py-3 text-[12px] font-black uppercase tracking-[0.12em] border-2 rounded-xl transition-all flex items-center gap-2 shrink-0 ${btnConfig.cls} ${(btnConfig.disabled || isRegistering) ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                {isRegistering ? 'Processing...' : (event.entryFee > 0 ? 'Pay & Register' : 'Register')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;