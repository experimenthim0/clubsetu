import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import EventCard from '../components/EventCard';
import { useNotification } from '../context/NotificationContext';
import { Link } from 'react-router-dom';

const EventFeed = ({ limit, hideHeader = false }) => {
  const { showNotification } = useNotification();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterClub, setFilterClub] = useState('ALL');
  const user = JSON.parse(localStorage.getItem('user'));

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/events`);
      setEvents(res.data);
      if (user && localStorage.getItem('role') === 'student') {
          const regRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/events/student/${user._id}`);
          setRegisteredEvents(regRes.data.filter(r => r.eventId).map(r => r.eventId._id));
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 60000);
    return () => clearInterval(interval);
  }, []);

  // Extract unique club names for the filter dropdown
  const clubNames = useMemo(() => {
    const names = new Set();
    events.forEach(e => {
      if (e.createdBy?.clubName) names.add(e.createdBy.clubName);
    });
    return Array.from(names).sort();
  }, [events]);

  const handleRegister = async (eventId) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const role = localStorage.getItem('role');

    if (!user || role !== 'student') {
        showNotification('Please login as a student to register.', 'warning');
        return;
    }

    try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/events/${eventId}/register`, {
            studentId: user._id
        });
        showNotification(res.data.message, 'success');
        fetchEvents();
    } catch (err) {
        showNotification(err.response?.data?.message || 'Registration failed', 'error');
    }
  };

  if (loading)
  return (
    <div className="text-center mt-16 text-gray-500">
      Loading events...
    </div>
  );

  // Apply filters
  let filtered = [...events];

  if (filterClub !== 'ALL') {
    filtered = filtered.filter(e => e.createdBy?.clubName === filterClub);
  }

  if (filterStatus !== 'ALL') {
    filtered = filtered.filter(e => e.status === filterStatus);
  }

  // Sort events by status priority: LIVE first, then UPCOMING, then ENDED
  let liveEvents = filtered.filter(e => e.status === 'LIVE');
  let upcomingEvents = filtered.filter(e => e.status === 'UPCOMING');
  let endedEvents = filtered.filter(e => e.status === 'ENDED');

  // Sort upcoming by startTime ascending (soonest first)
  upcomingEvents.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  // Sort ended by startTime descending (most recent first)
  endedEvents.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

  // Apply limit: fill slots with priority LIVE → UPCOMING → ENDED
  if (limit) {
      let remaining = limit;

      if (liveEvents.length > remaining) {
          liveEvents = liveEvents.slice(0, remaining);
          remaining = 0;
      } else {
          remaining -= liveEvents.length;
      }

      if (upcomingEvents.length > remaining) {
          upcomingEvents = upcomingEvents.slice(0, remaining);
          remaining = 0;
      } else {
          remaining -= upcomingEvents.length;
      }

      if (endedEvents.length > remaining) {
          endedEvents = endedEvents.slice(0, remaining);
      }
  }

  const totalFiltered = liveEvents.length + upcomingEvents.length + endedEvents.length;

  const statusButtons = [
    { key: 'ALL', label: 'All', icon: 'ri-layout-grid-line' },
    { key: 'LIVE', label: 'Live', icon: 'ri-live-line' },
    { key: 'UPCOMING', label: 'Upcoming', icon: 'ri-calendar-event-line' },
    { key: 'ENDED', label: 'Ended', icon: 'ri-history-line' },
  ];

return (
  <div className={`max-w-7xl mx-auto px-6 ${hideHeader ? '' : 'py-12'}`}>

    {!hideHeader && (
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Upcoming Events
        </h1>
    )}

    {/* ── FILTER BAR (only on full events page) ── */}
    {!hideHeader && (
      <div className="mb-10 bg-white border-2 border-black rounded-sm p-4 shadow-[4px_4px_0px_#0D0D0D]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">

          {/* Status toggle buttons */}
          <div className="flex items-center gap-1 flex-wrap">
            {statusButtons.map(btn => (
              <button
                key={btn.key}
                onClick={() => setFilterStatus(btn.key)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase tracking-widest rounded-sm border-2 transition-all ${
                  filterStatus === btn.key
                    ? btn.key === 'LIVE'
                      ? 'bg-orange-600 text-white border-orange-600'
                      : btn.key === 'UPCOMING'
                        ? 'bg-yellow-400 text-black border-yellow-400'
                        : btn.key === 'ENDED'
                          ? 'bg-neutral-700 text-white border-neutral-700'
                          : 'bg-black text-white border-black'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-black hover:text-black'
                }`}
              >
                <i className={`${btn.icon} text-sm`} />
                {btn.label}
              </button>
            ))}
          </div>

          {/* Club name dropdown */}
          <div className="flex items-center gap-2 sm:ml-auto">
            <i className="ri-building-line text-orange-600" />
            <select
              value={filterClub}
              onChange={(e) => setFilterClub(e.target.value)}
              className="px-3 py-2 text-[12px] font-bold uppercase tracking-wider border-2 border-neutral-200 rounded-sm bg-white text-black focus:outline-none focus:border-black transition-colors cursor-pointer"
            >
              <option value="ALL">All Clubs</option>
              {clubNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active filter summary */}
        {(filterStatus !== 'ALL' || filterClub !== 'ALL') && (
          <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-bold">
              {totalFiltered} event{totalFiltered !== 1 ? 's' : ''} found
            </span>
            <button
              onClick={() => { setFilterStatus('ALL'); setFilterClub('ALL'); }}
              className="text-[11px] font-bold uppercase tracking-wider text-orange-600 hover:text-black transition-colors flex items-center gap-1"
            >
              <i className="ri-close-line" /> Clear Filters
            </button>
          </div>
        )}
      </div>
    )}

    {/* If No Events At All */}
    {totalFiltered === 0 && (
      <div className="text-center py-20 border border-gray-200 rounded-xl bg-white">
        <p className="text-lg font-medium text-gray-600">
          {events.length === 0 ? 'No events found' : 'No events match your filters'}
        </p>
        <p className="text-sm text-gray-400 mt-2">
          {events.length === 0 ? 'Please check back later for new events.' : 'Try adjusting your filters above.'}
        </p>
      </div>
    )}

    {/* LIVE Events */}
    {liveEvents.length > 0 && (
      <div className="mb-14">
        {!hideHeader && (
             <h2 className="text-lg font-semibold text-primary mb-6 flex items-center gap-2">
             <span className="relative flex h-3 w-3">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
             </span>
             Happening Now
             </h2>
        )}
        {hideHeader && (
             <h3 className="text-md font-bold text-red-500 mb-4 flex items-center gap-2 uppercase tracking-wide">
             <span className="relative flex h-3 w-3">
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
             </span>
             Live Now
             </h3>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveEvents.map(event => (
            <EventCard
              key={event._id || event.id}
              event={event}
              onRegister={handleRegister}
              isRegistered={registeredEvents.includes(event._id || event.id)}
            />
          ))}
        </div>
      </div>
    )}

    {/* Upcoming Events Section */}
    {upcomingEvents.length > 0 && (
      <div className={endedEvents.length > 0 ? 'mb-14' : ''}>
        {!hideHeader && (
             <h2 className="text-lg font-semibold text-gray-700 mb-6 flex items-center gap-2">
             <i className="ri-calendar-event-line text-orange-600"></i>
             Upcoming
             </h2>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingEvents.map(event => (
            <EventCard
              key={event._id}
              event={event}
              onRegister={handleRegister}
              isRegistered={registeredEvents.includes(event._id)}
            />
          ))}
        </div>
      </div>
    )}

    {/* Ended Events Section */}
    {endedEvents.length > 0 && (
      <div>
        {!hideHeader && (
             <h2 className="text-lg font-semibold text-neutral-400 mb-6 flex items-center gap-2">
             <i className="ri-history-line"></i>
             Past Events
             </h2>
        )}
        {hideHeader && (liveEvents.length > 0 || upcomingEvents.length > 0) && (
             <h3 className="text-md font-bold text-neutral-400 mb-4 flex items-center gap-2 uppercase tracking-wide">
             <i className="ri-history-line"></i>
             Past Events
             </h3>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {endedEvents.map(event => (
            <EventCard
              key={event._id}
              event={event}
              onRegister={handleRegister}
              isRegistered={registeredEvents.includes(event._id)}
            />
          ))}
        </div>
      </div>
    )}

<p className="text-center mt-8 text-neutral-500 uppercase tracking-widest text-xs font-bold">If you want to add your event,Become a Club or Society Head <Link to="/register/club-head" className="text-orange-600 font-bold">Register Now</Link> || Also Fill this <a href="https://forms.gle/ZJKNhGXNrSkimWtG9" className="text-orange-600 font-bold">Form</a></p>
  
  </div>
);
}

export default EventFeed;
