import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [missingFieldsModalOpen, setMissingFieldsModalOpen] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [modalInputs, setModalInputs] = useState({});

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/events');
        const found = res.data.find((e) => e._id === id || e.id === id);
        if (found) setEvent(found);
        else setError('Event not found');
        setLoading(false);
      } catch (err) {
        setError('Failed to load event');
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleRegister = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const role = localStorage.getItem('role');
    if (!user || role !== 'student') {
      showNotification('Please login as a student to register.', 'warning');
      navigate('/login');
      return;
    }

    // Check for required fields
    if (event.requiredFields && event.requiredFields.length > 0) {
        const missing = event.requiredFields.filter(field => !user[field]);
        if (missing.length > 0) {
            // Open modal to collect missing fields
            setMissingFields(missing);
            setMissingFieldsModalOpen(true);
            return;
        }
    }

    // Handle Paid Events with Razorpay
    if (event.entryFee > 0) {
      try {
        // 1. Create Order on backend
        const orderRes = await axios.post('http://localhost:5000/api/payment/create-order', {
          eventId: id,
          studentId: user._id
        });

        const { orderId, amount, currency, keyId, eventTitle } = orderRes.data;

        // 2. Initialize Razorpay Checkout
        const options = {
          key: keyId,
          amount: amount * 100, // amount in paise
          currency: currency,
          name: 'ClubSetu',
          description: `Registration for ${eventTitle}`,
          order_id: orderId,
          handler: async (response) => {
            // 3. Verify payment on backend
            try {
              const verifyRes = await axios.post('http://localhost:5000/api/payment/verify', {
                orderId: orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                eventId: id,
                studentId: user._id
              });

              if (verifyRes.data.success) {
                showNotification(`Successfully registered for ${eventTitle}!`, 'success');
                window.location.reload();
              }
            } catch (err) {
              showNotification(err.response?.data?.message || 'Payment verification failed', 'error');
            }
          },
          prefill: {
            name: user.name,
            email: user.email || user.collegeEmail,
            contact: user.phone || ''
          },
          theme: {
            color: '#EA580C' // Orange-600 to match theme
          },
          modal: {
            ondismiss: () => {
              showNotification('Payment cancelled', 'info');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();

      } catch (err) {
        showNotification(err.response?.data?.message || 'Failed to initiate payment', 'error');
      }
      return;
    }

    // Free Event Registration
    try {
      const res = await axios.post(`http://localhost:5000/api/events/${id}/register`, {
        studentId: user._id,
      });
      showNotification(res.data.message, 'success');
      window.location.reload();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Registration failed', 'error');
    }
  };

  const handleSaveAndRegister = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const role = localStorage.getItem('role');

    try {
      // Update profile with missing fields
      const res = await axios.put(`http://localhost:5000/api/users/${role}/${user._id}`, modalInputs);
      
      // Update localStorage with new user data
      const updatedUser = res.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Close modal
      setMissingFieldsModalOpen(false);
      
      // Show success notification
      showNotification('Profile updated successfully!', 'success');
      
      // Proceed with registration
      // Handle Paid Events with Razorpay
      if (event.entryFee > 0) {
        try {
          const orderRes = await axios.post('http://localhost:5000/api/payment/create-order', {
            eventId: id,
            studentId: updatedUser._id
          });

          const { orderId, amount, currency, keyId, eventTitle } = orderRes.data;

          const options = {
            key: keyId,
            amount: amount * 100,
            currency: currency,
            name: 'ClubSetu',
            description: `Registration for ${eventTitle}`,
            order_id: orderId,
            handler: async (response) => {
              try {
                const verifyRes = await axios.post('http://localhost:5000/api/payment/verify', {
                  orderId: orderId,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  eventId: id,
                  studentId: updatedUser._id
                });

                if (verifyRes.data.success) {
                  showNotification(`Successfully registered for ${eventTitle}!`, 'success');
                  window.location.reload();
                }
              } catch (err) {
                showNotification(err.response?.data?.message || 'Payment verification failed', 'error');
              }
            },
            prefill: {
              name: updatedUser.name,
              email: updatedUser.email || updatedUser.collegeEmail,
              contact: updatedUser.phone || ''
            },
            theme: { color: '#EA580C' }
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        } catch (err) {
          showNotification(err.response?.data?.message || 'Failed to initiate payment', 'error');
        }
        return;
      }

      // Free Event Registration
      const regRes = await axios.post(`http://localhost:5000/api/events/${id}/register`, {
        studentId: updatedUser._id,
      });
      showNotification(regRes.data.message, 'success');
      window.location.reload();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update profile', 'error');
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-black border-t-orange-600 rounded-full animate-spin" />
          <p className="text-[13px] font-bold uppercase tracking-widest text-neutral-400">Loading event…</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !event) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="border-2 border-black rounded-sm p-10 text-center max-w-sm">
          <div className="w-14 h-14 bg-orange-600 rounded-sm flex items-center justify-center text-white text-2xl mx-auto mb-5">
            <i className="ri-error-warning-line" />
          </div>
          <h2 className="font-black text-xl text-black mb-2">Oops!</h2>
          <p className="text-neutral-500 text-[14px] mb-6">{error || 'Event not found'}</p>
          <button
            onClick={() => navigate('/events')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-[12px] font-bold uppercase tracking-widest rounded-sm hover:bg-orange-600 transition-colors cursor-pointer border-2 border-black"
          >
            <i className="ri-arrow-left-line" /> Back to Events
          </button>
        </div>
      </div>
    );
  }

  const { title, description, venue, startTime, endTime, totalSeats, registeredCount, status, registrationDeadline, entryFee } = event;
  const isUnlimited = !totalSeats || totalSeats === 0;
  const isFull   = !isUnlimited && registeredCount >= totalSeats;
  const isLive   = status === 'LIVE';
  const isEnded  = status === 'ENDED';
  const deadline = registrationDeadline || startTime;
  const isDeadlinePassed = new Date() > new Date(deadline);
  const fillPct  = isUnlimited ? 0 : Math.min(100, Math.round((registeredCount / totalSeats) * 100));

  // ── Derived button state ─────────────────────────────────────────────────
  const btnConfig = isEnded
    ? { label: 'Event has Ended',      cls: 'bg-neutral-100 text-neutral-400 cursor-not-allowed border-neutral-200',       disabled: true  }
    : isDeadlinePassed
    ? { label: 'Deadline Passed',      cls: 'bg-neutral-100 text-neutral-400 cursor-not-allowed border-neutral-200',       disabled: true  }
    : isFull
    ? { label: 'Join Waitlist',         cls: 'bg-yellow-400 text-black border-black hover:bg-yellow-300 cursor-pointer',    disabled: false }
    : { label: 'Register for Event',   cls: 'bg-black text-white border-black hover:bg-orange-600 hover:border-orange-600 cursor-pointer', disabled: false };

  return (
    <div className="min-h-screen bg-neutral-50">

      {/* ── Back bar ────────────────────────────────────────────────────── */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-[900px] mx-auto px-6 lg:px-8 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-black hover:text-orange-600 transition-colors bg-transparent border-none cursor-pointer"
          >
            <i className="ri-arrow-left-line" /> Back
          </button>
          <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Event Details</span>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-6 lg:px-8 py-12">
        <div className="bg-white border-2 border-black rounded-sm overflow-hidden">

          {/* ── Hero banner ──────────────────────────────────────────────── */}
          <div className="relative bg-black h-80 flex items-center justify-center overflow-hidden">
            {(() => {
              const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop';
              const displayImage = event.imageUrl || DEFAULT_IMAGE;
              
              return (
                <>
                  <img 
                    src={displayImage} 
                    alt={title}
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                    onError={(e) => {
                      // Fallback to dot pattern if image fails
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {/* Backup pattern if image fails */}
                  {!displayImage && (
                    <>
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
                      />
                      <i className="ri-calendar-event-line text-[120px] text-white opacity-10 absolute" />
                    </>
                  )}
                </>
              );
            })()}
            {/* Status pill */}
            <div className="relative z-10 flex flex-col items-center gap-3">
              {isLive && (
                <span className="inline-flex items-center gap-2 bg-orange-600 text-white text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full animate-pulse">
                  <span className="w-2 h-2 bg-white rounded-full" />
                  Live Now
                </span>
              )}
              {isEnded && (
                <span className="inline-flex items-center gap-2 bg-neutral-700 text-neutral-300 text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-sm">
                  <i className="ri-check-line" /> Ended
                </span>
              )}
              {!isLive && !isEnded && (
                <span className="inline-flex items-center gap-2 bg-yellow-400 text-black text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-sm border-2 border-black">
                  <i className="ri-time-line" /> Upcoming
                </span>
              )}
            </div>
            {/* Bottom orange bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-orange-600" />
          </div>

          {/* ── Body ─────────────────────────────────────────────────────── */}
          <div className="p-8 md:p-12">

            {/* Title */}
            <h1 className="font-black text-[clamp(26px,4vw,42px)] text-black leading-tight tracking-tight mb-8">
              {title}
            </h1>

            {/* Meta grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border-2 border-black rounded-sm overflow-hidden mb-10">
              {[
                {
                  icon: 'ri-time-line',
                  label: 'Start Time',
                  value: new Date(startTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }),
                },
                {
                  icon: 'ri-time-line',
                  label: 'End Time',
                  value: new Date(endTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }),
                },
                {
                  icon: 'ri-map-pin-line',
                  label: 'Venue',
                  value: venue,
                },
                event.createdBy?.clubName && {
                  icon: 'ri-team-line',
                  label: 'Organized By',
                  value: event.createdBy.clubName,
                },
                {
                  icon: 'ri-group-line',
                  label: 'Seats',
                  value: isUnlimited
                    ? `${registeredCount} Registered (Unlimited)`
                    : `${registeredCount} / ${totalSeats} Registered`,
                },
                {
                  icon: 'ri-calendar-check-line',
                  label: 'Reg. Deadline',
                  value: new Date(registrationDeadline || startTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }),
                },
              ].filter(Boolean).map((meta, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-4 p-5 ${i % 2 === 0 ? 'border-r border-black' : ''} ${i < 4 ? 'border-b-2 border-black' : ''}`}
                >
                  <div className="w-10 h-10 flex-shrink-0 bg-orange-600 rounded-sm flex items-center justify-center text-white text-base">
                    <i className={meta.icon} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-0.5">{meta.label}</div>
                    <div className="text-[15px] font-bold text-black leading-snug">{meta.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Seat progress bar */}
            {!isUnlimited && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Seat Availability</span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-black">{fillPct}% Full</span>
              </div>
              <div className="w-full h-2.5 bg-neutral-100 border border-neutral-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${fillPct >= 90 ? 'bg-orange-600' : fillPct >= 60 ? 'bg-yellow-400' : 'bg-black'}`}
                  style={{ width: `${fillPct}%` }}
                />
              </div>
              {isFull && (
                <p className="text-[12px] text-orange-600 font-semibold mt-2">
                  All seats are filled. Registering will add you to the waitlist.
                </p>
              )}
            </div>
            )}

            {/* About */}
            <div className="border-l-[3px] border-orange-600 pl-6 mb-10">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-3">About this Event</h3>
              <p className="text-[16px] text-neutral-700 leading-relaxed">{description}</p>
            </div>

            {/* CTA */}
            <div className="border-t-2 border-black pt-8">
              {/* Entry Fee Display */}
              <div className="mb-6 flex items-center justify-between p-4 bg-orange-50 border-2 border-orange-600 rounded-sm">
                <div className="flex items-center gap-3">
                    <i className="ri-money-rupee-circle-line text-2xl text-orange-600" />
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600">Entry Fee</p>
                        <p className="text-xl font-black text-black">
                            {entryFee > 0 ? `₹${entryFee}` : 'FREE'}
                        </p>
                    </div>
                </div>
                {!isDeadlinePassed && !isEnded && (
                    <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Time Left</p>
                        <p className="text-sm font-bold text-black uppercase">
                            {(() => {
                                const diff = new Date(deadline) - new Date();
                                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                if (days > 0) return `${days}d ${hours}h left`;
                                return `${hours}h left`;
                            })()}
                        </p>
                    </div>
                )}
              </div>

              <button
                onClick={!btnConfig.disabled ? handleRegister : undefined}
                disabled={btnConfig.disabled}
                className={`w-full py-4 px-6 text-[14px] font-black uppercase tracking-widest border-2 rounded-sm transition-all ${btnConfig.cls}`}
              >
                {btnConfig.label}
              </button>

              {/* Helper text */}
              {!isEnded && (
                <p className="text-center text-[12px] text-neutral-400 mt-3 tracking-wide">
                  {isUnlimited
                    ? 'Unlimited seats available — register now.'
                    : isFull
                      ? 'You will be notified if a seat opens up.'
                      : `${totalSeats - registeredCount} seat${totalSeats - registeredCount !== 1 ? 's' : ''} remaining — register now.`}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Missing Fields Modal ───────────────────────────────────────── */}
      {missingFieldsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white border-2 border-black rounded-sm max-w-md w-full shadow-[8px_8px_0px_#0D0D0D]">
            
            {/* Header */}
            <div className="bg-orange-600 px-6 py-4 border-b-2 border-black">
              <h3 className="font-black text-white text-lg flex items-center gap-2">
                <i className="ri-information-line" />
                Complete Your Profile
              </h3>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-sm text-neutral-600 mb-5 leading-relaxed">
                This event requires the following profile information. Please add them to continue with registration:
              </p>

              <div className="space-y-4">
                {missingFields.map((field) => {
                  const fieldLabel = field.replace('Profile', '').replace('Url', '');
                  const placeholder = field === 'portfolioUrl' 
                    ? 'https://yourportfolio.com' 
                    : `https://${fieldLabel.toLowerCase()}.com/yourprofile`;
                  
                  return (
                    <div key={field}>
                      <label className="block text-sm font-bold text-black mb-1.5 capitalize">
                        {fieldLabel} <span className="text-orange-600">*</span>
                      </label>
                      <input
                        type="url"
                        placeholder={placeholder}
                        value={modalInputs[field] || ''}
                        onChange={(e) => setModalInputs({ ...modalInputs, [field]: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-neutral-200 rounded-sm text-sm focus:border-orange-600 focus:outline-none transition-colors"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => {
                  setMissingFieldsModalOpen(false);
                  setModalInputs({});
                }}
                className="flex-1 px-4 py-3 bg-white border-2 border-black text-black font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAndRegister}
                disabled={missingFields.some(field => !modalInputs[field])}
                className="flex-1 px-4 py-3 bg-black border-2 border-black text-white font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-orange-600 hover:border-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Save & Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;