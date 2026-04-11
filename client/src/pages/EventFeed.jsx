import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import EventCard from '../components/EventCard';
import { useNotification } from '../context/NotificationContext';
import { Link } from 'react-router-dom';
import EventCardSkeleton from '../components/skeletons/EventCardSkeleton';
import { Skeleton } from '../components/ui/Skeleton';

const EventFeed = ({ limit, hideHeader = false, showFilters = false, onlyActive = false }) => {
  const { showNotification } = useNotification();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterClub, setFilterClub] = useState('ALL');
  const [filterMonth, setFilterMonth] = useState('ALL');
  const [filterYear, setFilterYear] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));
  
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/events`);
      setEvents(Array.isArray(res.data) ? res.data : []);
      const role = localStorage.getItem('role');
      if (user && role === 'member') {
          const regRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/events/user/${user._id}`);
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
    if (Array.isArray(events)) {
      events.forEach(e => {
        if (e.createdBy?.clubName) names.add(e.createdBy.clubName);
      });
    }
    return Array.from(names).sort();
  }, [events]);

  const availableYears = useMemo(() => {
    const currentYear = 2026;
    const years = new Set([currentYear]);
    if (Array.isArray(events)) {
      events.forEach(e => {
        if (e.startTime) {
          const d = new Date(e.startTime);
          if (!isNaN(d.getTime())) {
            const year = d.getFullYear();
            if (year >= currentYear) years.add(year);
          }
        }
      });
    }
    // Add a few future years if not present
    years.add(currentYear + 1);
    years.add(currentYear + 2);
    return Array.from(years).sort((a, b) => a - b);
  }, [events]);

  const availableMonths = useMemo(() => {
    const months = new Set();
    if (Array.isArray(events)) {
      events.forEach(e => {
        if (e.startTime) {
          const d = new Date(e.startTime);
          if (!isNaN(d.getTime())) {
            months.add(d.getMonth() + 1); // 1-12
          }
        }
      });
    }
    return Array.from(months).sort((a, b) => a - b);
  }, [events]);

  const handleRegister = async (eventId) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const role = localStorage.getItem('role');

    if (!user || (role !== 'member' && role !== 'student')) {
        showNotification('Please login as a student to register.', 'warning');
        return;
    }

    try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/events/${eventId}/register`, {
            userId: user._id
        });
        showNotification(res.data.message, 'success');
        fetchEvents();
    } catch (err) {
        showNotification(err.response?.data?.message || 'Registration failed', 'error');
    }
  };

  if (loading) {
    return (
      <div className={`max-w-7xl mx-auto px-6 ${hideHeader ? '' : 'py-12'}`}>
        {!hideHeader && (
          <Skeleton className="w-48 h-8 mb-6" />
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(limit || 6)].map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Apply filters
  let filtered = [...events];

  if (filterClub !== 'ALL') {
    filtered = filtered.filter(e => e.createdBy?.clubName === filterClub);
  }

  if (filterStatus !== 'ALL') {
    filtered = filtered.filter(e => e.status === filterStatus);
  }

  if (filterYear !== 'ALL') {
    filtered = filtered.filter(e => {
      if (!e.startTime) return false;
      return new Date(e.startTime).getFullYear().toString() === filterYear.toString();
    });
  }

  if (filterMonth !== 'ALL') {
    filtered = filtered.filter(e => {
      if (!e.startTime) return false;
      return (new Date(e.startTime).getMonth() + 1).toString() === filterMonth.toString();
    });
  }

  if (searchQuery.trim() !== '') {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(e => {
      const titleMatch = e.title?.toLowerCase().includes(query);
      const clubMatch = (e.club?.clubName || e.createdBy?.clubName || '').toLowerCase().includes(query);
      const categoryMatch = (e.club?.category || '').toLowerCase().includes(query);
      return titleMatch || clubMatch || categoryMatch;
    });
  }

  // Sort events by status priority: LIVE first, then UPCOMING, then ENDED
  let liveEvents = filtered.filter(e => e.status === 'LIVE');
  let upcomingEvents = filtered.filter(e => e.status === 'UPCOMING');
  let endedEvents = onlyActive ? [] : filtered.filter(e => e.status === 'ENDED');

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
        Events
        </h1>
    )}

    {/* ── FILTER BAR ── */}
  {(!hideHeader || showFilters) && (
  <div className="mb-6 bg-white border-2 border-neutral-200 rounded-2xl p-3.5 shadow-sm">
    
    {/* Row 1: Search */}
    <div className="relative group">
      <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-orange-600 text-base transition-colors pointer-events-none" />
      <input
        type="text"
        placeholder="Search by title, club, or category..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-9 pr-9 py-2.5 bg-neutral-50 border-2 border-neutral-100 rounded-xl focus:bg-white focus:border-orange-600 transition-all outline-none text-sm font-medium"
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-orange-600 transition-colors"
        >
          <i className="ri-close-circle-fill text-base" />
        </button>
      )}
    </div>

    {/* Row 2: Status + Selects */}
    <div className="flex flex-wrap items-center gap-2 mt-2.5">
      
      {/* Status buttons */}
      <div className="flex flex-wrap gap-1.5">
        {statusButtons.map(btn => (
          <button
            key={btn.key}
            onClick={() => setFilterStatus(btn.key)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border-2 transition-all duration-150 ${
              filterStatus === btn.key
                ? btn.key === 'LIVE'
                  ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-100'
                  : btn.key === 'UPCOMING'
                    ? 'bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-100'
                    : btn.key === 'ENDED'
                      ? 'bg-neutral-800 text-white border-neutral-800'
                      : 'bg-black text-white border-black'
                : 'bg-white text-neutral-500 border-neutral-100 hover:border-orange-600 hover:text-orange-600'
            }`}
          >
            <i className={`${btn.icon} text-xs`} />
            {btn.label}
          </button>
        ))}
      </div>

      {/* Vertical divider — hidden on small screens */}
      <div className="hidden sm:block h-6 w-px bg-neutral-100 mx-0.5" />

      {/* Selects */}
      <div className="flex flex-wrap gap-1.5 flex-1">
        {/* Year */}
        <div className="relative group flex-1 min-w-[100px] max-w-[130px]">
          <i className="ri-calendar-line absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-orange-600 text-xs transition-colors pointer-events-none" />
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="w-full pl-7 pr-6 py-1.5 text-[11px] font-bold uppercase tracking-wide border-2 border-neutral-100 rounded-lg bg-neutral-50 text-black focus:outline-none focus:border-orange-600 focus:bg-white transition-all cursor-pointer appearance-none"
          >
            <option value="ALL">All Years</option>
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <i className="ri-arrow-down-s-line absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 text-sm pointer-events-none" />
        </div>

        {/* Month */}
        <div className="relative group flex-1 min-w-[110px] max-w-[140px]">
          <i className="ri-time-line absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-orange-600 text-xs transition-colors pointer-events-none" />
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full pl-7 pr-6 py-1.5 text-[11px] font-bold uppercase tracking-wide border-2 border-neutral-100 rounded-lg bg-neutral-50 text-black focus:outline-none focus:border-orange-600 focus:bg-white transition-all cursor-pointer appearance-none"
          >
            <option value="ALL">All Months</option>
            {monthNames.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <i className="ri-arrow-down-s-line absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 text-sm pointer-events-none" />
        </div>

        {/* Club */}
        <div className="relative group flex-1 min-w-[130px] max-w-[180px]">
          <i className="ri-building-line absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-orange-600 text-xs transition-colors pointer-events-none" />
          <select
            value={filterClub}
            onChange={(e) => setFilterClub(e.target.value)}
            className="w-full pl-7 pr-6 py-1.5 text-[11px] font-bold uppercase tracking-wide border-2 border-neutral-100 rounded-lg bg-neutral-50 text-black focus:outline-none focus:border-orange-600 focus:bg-white transition-all cursor-pointer appearance-none"
          >
            <option value="ALL">All Clubs</option>
            {clubNames.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
          <i className="ri-arrow-down-s-line absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 text-sm pointer-events-none" />
        </div>
      </div>
    </div>

    {/* Active filter summary */}
    {(filterStatus !== 'ALL' || filterClub !== 'ALL' || filterMonth !== 'ALL' || filterYear !== 'ALL' || searchQuery !== '') && (
      <div className="mt-2.5 pt-2.5 border-t border-neutral-100 flex items-center justify-between">
        <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-bold">
          {totalFiltered} event{totalFiltered !== 1 ? 's' : ''} found
          {searchQuery && <span className="text-orange-600 ml-1.5">for "{searchQuery}"</span>}
        </span>
        <button
          onClick={() => {
            setFilterStatus('ALL');
            setFilterClub('ALL');
            setFilterMonth('ALL');
            setFilterYear('ALL');
            setSearchQuery('');
          }}
          className="text-[10px] font-bold uppercase tracking-wider text-orange-600 hover:text-black transition-colors flex items-center gap-1"
        >
          <i className="ri-close-line" /> Clear
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


  </div>
);
}

export default EventFeed;
