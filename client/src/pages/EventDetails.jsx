import React, { useEffect, useState } from 'react';
import { useParams, useNavigate,Link } from 'react-router-dom';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import { loadRazorpay } from '../utils/razorpay';


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

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/events/${slug}`);
        setEvent(res.data);
        if (res.data.entryFee > 0) loadRazorpay();
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
      document.title = `${event.title} - ClubSetu`;
      const setMetaTag = (selector, propertyAttr, propertyVal, content) => {
        let element = document.querySelector(selector);
        if (!element) {
          element = document.createElement('meta');
          element.setAttribute(propertyAttr, propertyVal);
          document.head.appendChild(element);
        }
        element.setAttribute('content', content);
      };
      const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop";
      setMetaTag("meta[property='og:title']", 'property', 'og:title', `${event.title} | ClubSetu`);
      setMetaTag("meta[property='og:description']", 'property', 'og:description', event.description || "Join this amazing event on ClubSetu!");
      setMetaTag("meta[property='og:image']", 'property', 'og:image', event.imageUrl || defaultImg);
      setMetaTag("meta[property='og:url']", 'property', 'og:url', window.location.href);
      setMetaTag("meta[property='og:type']", 'property', 'og:type', "website");
      setMetaTag("meta[name='twitter:card']", 'name', 'twitter:card', "summary_large_image");
      setMetaTag("meta[name='twitter:title']", 'name', 'twitter:title', `${event.title} | ClubSetu`);
      setMetaTag("meta[name='twitter:description']", 'name', 'twitter:description', event.description || "Join this amazing event on ClubSetu!");
      setMetaTag("meta[name='twitter:image']", 'name', 'twitter:image', event.imageUrl || defaultImg);
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
            key: keyId, amount: amount * 100, currency, name: 'ClubSetu',
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

    // Unauthenticated (external) path — form inputs are rendered in the UI
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
            key: keyId, amount: amount * 100, currency, name: 'ClubSetu',
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
          key: keyId, amount: amount * 100, currency, name: 'ClubSetu',
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

  const handleShare = () => {
    const message = `*_Event Alert 🚨_*\n\n*${event.title}*\n*Venue*: ${event.venue}\n*Date*: ${new Date(event.startTime).toLocaleDateString('en-IN')}\n*Time*: ${new Date(event.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}\n*Entry Fee*: ${event.entryFee ? `₹${event.entryFee}` : 'Free'}\n*Event By*: ${event.club?.clubName || event.createdBy?.clubName}\n*Hosted On*: *_ClubSetu_*\n\n*More Info*: `;
    if (navigator.share) {
      navigator.share({ title: `${event.title} - ClubSetu`, text: message, url: window.location.href }).catch((error) => console.error('Error sharing:', error));
    } else {
      navigator.clipboard.writeText(message + window.location.href).then(() => showNotification('Event details copied to clipboard', 'success')).catch((error) => console.error('Clipboard error:', error));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] border-black border-t-orange-600 rounded-full animate-spin" />
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">Loading event…</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-6">
        <div className="border-2 border-black rounded-sm p-10 text-center max-w-sm bg-white">
          <div className="w-14 h-14 bg-orange-600 rounded-sm flex items-center justify-center text-white text-2xl mx-auto mb-5">
            <i className="ri-error-warning-line" />
          </div>
          <h2 className="font-black text-xl text-black mb-2">Oops!</h2>
          <p className="text-neutral-500 text-[14px] mb-6">{error || 'Event not found'}</p>
          <button onClick={() => navigate('/events')} className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-[12px] font-bold uppercase tracking-widest rounded-sm hover:bg-orange-600 transition-colors cursor-pointer border-2 border-black">
            <i className="ri-arrow-left-line" /> Back to Events
          </button>
        </div>
      </div>
    );
  }

  const { title, description, venue, startTime, endTime, totalSeats, registeredCount, status, registrationDeadline, entryFee } = event;
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

  const btnConfig = isEnded
    ? { label: showWinners ? 'View Results' : 'Event Ended', cls: 'bg-neutral-800 text-white border-black hover:bg-orange-600 hover:border-orange-600 cursor-pointer', disabled: false }
    : isLive
    ? { label: 'Event is Live', cls: 'bg-orange-600 text-white border-orange-600 cursor-not-allowed', disabled: true }
    : isDeadlinePassed
    ? { label: 'Deadline Passed', cls: 'bg-neutral-100 text-neutral-500 cursor-not-allowed border-neutral-200', disabled: true }
    : alreadyRegistered
    ? { label: 'Already Registered', cls: 'bg-neutral-100 text-neutral-500 cursor-not-allowed border-neutral-200', disabled: true }
    : isFull
    ? { label: 'Join Waitlist', cls: 'bg-yellow-400 text-black border-black hover:bg-yellow-300 cursor-pointer', disabled: false }
    : { label: entryFee > 0 ? `Pay ₹${entryFee} & Register` : 'Register for Event', cls: 'bg-black text-white border-black hover:bg-orange-600 hover:border-orange-600 cursor-pointer', disabled: false };

  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <div className="min-h-screen bg-neutral-50">

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-30">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-black hover:text-orange-600 transition-colors cursor-pointer"
          >
            <i className="ri-arrow-left-line text-base" /> Back
          </button>
          <span className="text-[20px] font-medium text-neutral-800 tracking-wide">Event Details</span>
          <div className="w-16" /> {/* spacer to balance */}
        </div>
      </div>

      {/* ── Main two-column layout ── */}
      <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── LEFT: Poster / Banner ── */}
          <div className="w-full lg:w-[340px] lg:sticky lg:top-[72px] shrink-0">
            <div className="bg-white border-2 border-neutral-200 rounded-xl overflow-hidden shadow-sm">
              {/* Status badge */}
              <div className="relative">
                <img
                  src={event.imageUrl || DEFAULT_IMAGE}
                  alt={title}
                  className="w-full object-cover"
                  style={{ aspectRatio: '3/4', objectPosition: 'center' }}
                  onError={(e) => {
                    e.target.src = DEFAULT_IMAGE;
                  }}
                />
                
              </div>

              {/* Club info below poster */}
              <div className="px-4 py-3 border-t border-neutral-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <i className="ri-team-line text-orange-600 text-sm" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Organized by</p>
                  <p className="text-[13px] font-bold text-black truncate">{event.club?.clubName || event.createdBy?.clubName || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Details panel ── */}
          <div className="flex-1 min-w-0 flex flex-col gap-0">
            <div className="bg-white border-2 border-neutral-200 rounded-xl overflow-hidden shadow-sm">

              {/* Header */}
              <div className="px-5 pt-3 pb-5 border-b border-neutral-100">
                <div className="mb-3">
                  {isLive && (
                    <span className="inline-flex items-center gap-1.5 bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full animate-pulse shadow">
                      <span className="w-1.5 h-1.5 bg-white rounded-full" /> Live Now
                    </span>
                  )}
                  {isEnded && (
                    <span className="inline-flex items-center gap-1.5 bg-neutral-800 text-neutral-200 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow">
                      <i className="ri-check-line" /> Ended
                    </span>
                  )}
                  {!isLive && !isEnded && (
                    <span className="inline-flex items-center gap-1.5 bg-yellow-400 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-black/10 shadow">
                      <i className="ri-time-line" /> Upcoming
                    </span>
                  )}
                </div>
                <h1 className="font-black text-2xl md:text-3xl text-black leading-tight tracking-wide mb-1">
                  {title}
                </h1>
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-2 border-b border-neutral-100">
                {[
                  { icon: 'ri-calendar-line', label: 'Start', value: new Date(startTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) },
                  { icon: 'ri-calendar-check-line', label: 'End', value: new Date(endTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) },
                  { icon: 'ri-map-pin-line', label: 'Venue', value: venue },
                  { icon: 'ri-time-line', label: 'Reg. Deadline', value: new Date(registrationDeadline || startTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) },
                  { icon: 'ri-group-line', label: 'Seats', value: isUnlimited ? 'Unlimited' : `${registeredCount} / ${totalSeats} filled` },
                  entryFee > 0
                    ? { icon: 'ri-money-rupee-circle-line', label: 'Entry Fee', value: `₹${entryFee}`, accent: true }
                    : { icon: 'ri-gift-line', label: 'Entry Fee', value: 'Free', accent: false },
                ].filter(Boolean).map((meta, i, arr) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 px-5 py-4
                      ${i % 2 === 0 ? 'border-r border-neutral-100' : ''}
                      ${i < arr.length - 2 ? 'border-b border-neutral-100' : ''}
                    `}
                  >
                    <i className={`${meta.icon} text-lg mt-0.5 ${meta.accent ? 'text-orange-600' : 'text-orange-500'}`} />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-0.5">{meta.label}</p>
                      <p className={`text-[13px] font-semibold leading-snug ${meta.accent ? 'text-orange-600' : 'text-black'}`}>{meta.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Seat progress */}
              {!isUnlimited && (
                <div className="px-7 py-4 border-b border-neutral-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Seat Availability</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-black">{fillPct}% Full</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${fillPct >= 90 ? 'bg-orange-600' : fillPct >= 60 ? 'bg-yellow-400' : 'bg-black'}`}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                  {isFull && (
                    <p className="text-[11px] text-orange-600 font-semibold mt-2">All seats filled — registering adds you to the waitlist.</p>
                  )}
                </div>
              )}

           {/* About Section */}
<div className="px-7 py-5 border-b border-neutral-100">
  <p className="text-[11px] font-medium tracking-[0.18em] text-neutral-400 mb-2.5 uppercase">
    About this event
  </p>
  <div className="text-[14px] text-neutral-700 leading-relaxed bg-neutral-50 p-4 rounded-xl border border-neutral-200 whitespace-pre-wrap">
    {description}
  </div>
</div>

{/* Sponsors Section */}
{event.sponsors && event.sponsors.length > 0 && (
  <div className="px-7 py-5 border-b border-neutral-100">
    <p className="text-[11px] font-medium tracking-[0.18em] text-neutral-400 mb-3.5 uppercase">
      Sponsors
    </p>
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
    onError={(e) => {
      e.target.src = 'https://via.placeholder.com/28?text=' + sponsor.name[0];
    }}
  />
  <span className="text-[11px] font-medium text-neutral-400 tracking-wide text-center">
    {sponsor.name}
  </span>
</a>
      ))}
    </div>
  </div>
)}

{/* Gallery Section */}
{event.media && event.media.filter(m => m.type !== 'SPONSOR_LOGO').length > 0 && (
  <div className="px-7 py-5 border-b border-neutral-100">
    <p className="text-[11px] font-medium tracking-[0.18em] text-neutral-400 mb-3.5 uppercase">
      Gallery
    </p>
    <div className="grid grid-cols-3 gap-2">
      {event.media.filter(m => m.type !== 'SPONSOR_LOGO').map((item, i) => (
        <div key={i} className="aspect-square rounded-xl overflow-hidden border border-neutral-200 relative group">
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

              {/* Winners */}
              {showWinners && (
                <div id="winners-section" className="px-7 py-5 border-b border-neutral-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 bg-yellow-400 border border-black/10 rounded-lg flex items-center justify-center text-black text-lg">
                      <i className="ri-trophy-fill" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Event Results</p>
                      <p className="text-[15px] font-black text-black">Winners</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[...winners].sort((a, b) => a.rank - b.rank).map((winner, i) => {
                      const medal = medalConfig[winner.rank];
                      return (
                        <div key={i} className={`flex items-center gap-4 px-4 py-3 border rounded-lg ${medal ? medal.bg : 'bg-neutral-50'} border-neutral-200`}>
                          <div className={`w-8 h-8 shrink-0 rounded-md border-2 ${medal ? medal.border : 'border-neutral-300 bg-white'} flex items-center justify-center`}>
                            {medal ? <i className={`${medal.icon} text-black text-sm`} /> : <span className="text-xs font-black text-neutral-500">#{winner.rank}</span>}
                          </div>
                          <p className="text-[14px] font-black text-black flex-1 truncate">{winner.name}</p>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-black/50">{medal ? medal.label : `#${winner.rank}`}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── CTA Footer: Register + Share ── */}
              <div className="px-7 py-5 flex flex-col gap-4">

                {/* Already Registered notice banner */}
                {alreadyRegistered && (
                  <div className="flex items-center gap-3 px-4 py-3 bg-orange-50 border-2 border-orange-200 rounded-lg">
                    <i className="ri-checkbox-circle-line text-orange-600 text-lg shrink-0" />
                    <p className="text-[13px] font-semibold text-orange-700">You are already registered for this event.</p>
                  </div>
                )}

                {/* Registration ID display after successful registration */}
                {registrationId && (
                  <div className="flex flex-col items-center gap-3 px-4 py-6 bg-green-50 border-2 border-green-200 rounded-lg">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-1">
                      <i className="ri-checkbox-circle-fill text-2xl" />
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-green-700">Registration Successful!</p>
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Your Registration ID</p>
                      <p className="text-xl font-black text-black tracking-widest font-mono bg-white px-4 py-2 border-2 border-neutral-200 rounded-md">
                        {registrationId}
                      </p>
                    </div>
                    <p className="text-[11px] text-neutral-500 text-center max-w-[240px] mt-2">
                       You can view your full ticket and QR code in the <Link to="/my-events" className="text-orange-600 font-bold underline">My Events</Link> section.
                    </p>
                  </div>
                )}

                {/* External participant form (shown when not logged in) */}
                {!user && !isEnded && !isDeadlinePassed && !alreadyRegistered && (
                  <div className="flex flex-col gap-3">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Register as External Participant</p>
                    <input
                      type="text"
                      placeholder="Your full name *"
                      value={externalName}
                      onChange={(e) => setExternalName(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-neutral-200 rounded-lg text-sm focus:border-orange-600 focus:outline-none transition-colors"
                    />
                    <input
                      type="email"
                      placeholder="Your email address *"
                      value={externalEmail}
                      onChange={(e) => setExternalEmail(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-neutral-200 rounded-lg text-sm focus:border-orange-600 focus:outline-none transition-colors"
                    />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                  <button
                    onClick={!btnConfig.disabled && !isRegistering
                      ? (isEnded
                        ? () => document.getElementById('winners-section')?.scrollIntoView({ behavior: 'smooth' })
                        : handleRegister)
                      : undefined}
                    disabled={btnConfig.disabled || isRegistering}
                    className={`flex-1 py-3.5 px-6 text-[12px] font-black uppercase tracking-[0.15em] border-2 rounded-lg transition-all flex items-center justify-center gap-2 ${btnConfig.cls} ${(btnConfig.disabled || isRegistering) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isRegistering ? (
                      <><i className="ri-loader-4-line animate-spin text-base" /> Processing…</>
                    ) : btnConfig.label}
                  </button>

                  <button
                    onClick={handleShare}
                    className="sm:w-auto w-full py-3.5 px-5 text-[12px] font-black uppercase tracking-[0.15em] rounded-lg bg-white text-black hover:text-orange-600 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <i className="ri-share-line text-base" /> Share
                  </button>
                </div>
              </div>

              {entryFee > 0 && (
                <p className="text-center text-[11px] text-neutral-400 tracking-wide pb-4">
                  Note: Entry fee is non-refundable.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Missing Fields Modal ── */}
      {missingFieldsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white border-2 border-black rounded-xl max-w-md w-full shadow-2xl">
            <div className="bg-orange-600 px-6 py-4 rounded-t-xl border-b-2 border-black">
              <h3 className="font-black text-white text-lg flex items-center gap-2">
                <i className="ri-information-line" /> Complete Your Profile
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-neutral-600 mb-5 leading-relaxed">
                This event requires the following profile information. Please add them to continue with registration:
              </p>
              <div className="space-y-4">
                {missingFields.map((field) => {
                  const fieldLabel = field.replace('Profile', '').replace('Url', '');
                  const placeholder = field === 'portfolioUrl' ? 'https://yourportfolio.com' : `https://${fieldLabel.toLowerCase()}.com/yourprofile`;
                  return (
                    <div key={field}>
                      <label className="block text-sm font-bold text-black mb-1.5 capitalize">
                        {fieldLabel} <span className="text-orange-600">*</span>
                      </label>
                      <input type="url" placeholder={placeholder} value={modalInputs[field] || ''} onChange={(e) => setModalInputs({ ...modalInputs, [field]: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-neutral-200 rounded-lg text-sm focus:border-orange-600 focus:outline-none transition-colors" />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => { setMissingFieldsModalOpen(false); setModalInputs({}); }} className="flex-1 px-4 py-3 bg-white border-2 border-black text-black font-bold text-sm uppercase tracking-widest rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer">
                Cancel
              </button>
              <button onClick={handleSaveAndRegister} disabled={missingFields.some(field => !modalInputs[field]) || isRegistering} className="flex-1 px-4 py-3 bg-black border-2 border-black text-white font-bold text-sm uppercase tracking-widest rounded-lg hover:bg-orange-600 hover:border-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                {isRegistering ? 'Processing...' : 'Save & Register'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Form Modal ── */}
      {customFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white border-2 border-black rounded-xl max-w-lg w-full shadow-2xl max-h-[90vh] flex flex-col">
            <div className="bg-orange-600 px-6 py-4 rounded-t-xl border-b-2 border-black shrink-0">
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
                    <div key={i} className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{item.label}</p>
                      <p className="text-sm font-medium text-black truncate">{item.value || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t-2 border-neutral-100 mb-6" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">Additional Information</p>
              <div className="space-y-4">
                {(event.customFields || []).map((field, idx) => (
                  <div key={idx}>
                    <label className="block text-sm font-bold text-black mb-1.5">
                      {field.label}{' '}{field.required && <span className="text-orange-600">*</span>}
                    </label>
                    {field.type === 'text' && (
                      <input type="text" placeholder={`Enter ${field.label.toLowerCase()}`} value={customFormResponses[field.label] || ''} onChange={(e) => setCustomFormResponses({ ...customFormResponses, [field.label]: e.target.value })} className="w-full px-4 py-2.5 border-2 border-neutral-200 rounded-lg text-sm focus:border-orange-600 focus:outline-none transition-colors" />
                    )}
                    {field.type === 'url' && (
                      <input type="url" placeholder="https://..." value={customFormResponses[field.label] || ''} onChange={(e) => setCustomFormResponses({ ...customFormResponses, [field.label]: e.target.value })} className="w-full px-4 py-2.5 border-2 border-neutral-200 rounded-lg text-sm focus:border-orange-600 focus:outline-none transition-colors" />
                    )}
                    {field.type === 'textarea' && (
                      <textarea rows="3" placeholder={`Enter ${field.label.toLowerCase()}`} value={customFormResponses[field.label] || ''} onChange={(e) => setCustomFormResponses({ ...customFormResponses, [field.label]: e.target.value })} className="w-full px-4 py-2.5 border-2 border-neutral-200 rounded-lg text-sm focus:border-orange-600 focus:outline-none transition-colors resize-none" />
                    )}
                    {field.type === 'select' && (
                      <select value={customFormResponses[field.label] || ''} onChange={(e) => setCustomFormResponses({ ...customFormResponses, [field.label]: e.target.value })} className="w-full px-4 py-2.5 border-2 border-neutral-200 rounded-lg text-sm focus:border-orange-600 focus:outline-none transition-colors">
                        <option value="">Select an option</option>
                        {(field.options || []).map((opt, optIdx) => <option key={optIdx} value={opt}>{opt}</option>)}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 pb-6 pt-3 flex gap-3 border-t border-neutral-100 shrink-0">
              <button onClick={() => { setCustomFormModalOpen(false); setCustomFormResponses({}); }} className="flex-1 px-4 py-3 bg-white border-2 border-black text-black font-bold text-sm uppercase tracking-widest rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer">
                Cancel
              </button>
              <button onClick={handleCustomFormSubmit} disabled={isRegistering} className="flex-1 px-4 py-3 bg-black border-2 border-black text-white font-bold text-sm uppercase tracking-widest rounded-lg hover:bg-orange-600 hover:border-orange-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
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