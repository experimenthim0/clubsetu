import React, { useEffect, useState } from 'react';
import axios from 'axios';
import EventCard from '../components/EventCard';
import { useNotification } from '../context/NotificationContext';

const EventFeed = ({ limit, hideHeader = false }) => {
  const { showNotification } = useNotification();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const user = JSON.parse(localStorage.getItem('user'));

  const fetchEvents = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/events');
      setEvents(res.data);
      if (user && localStorage.getItem('role') === 'student') {
          const regRes = await axios.get(`http://localhost:5000/api/events/student/${user._id}`);
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
    const interval = setInterval(fetchEvents, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  const handleRegister = async (eventId) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const role = localStorage.getItem('role');

    if (!user || role !== 'student') {
        showNotification('Please login as a student to register.', 'warning');
        return; // Alternatively redirect to login
    }

    try {
        const res = await axios.post(`http://localhost:5000/api/events/${eventId}/register`, {
            studentId: user._id
        });
        showNotification(res.data.message, 'success');
        fetchEvents(); // Refresh data
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

  let liveEvents = events.filter(e => e.status === 'LIVE');
  let upcomingEvents = events.filter(e => e.status !== 'LIVE');

  // Apply limit if provided (splitting limit between live and upcoming prioritizing live?)
  // Simplified logic: If limit is set, we might just want to show the total 'N' events mixed or just N upcoming?
  // Let's assume on Home we want to see Live first, then Upcoming, total 'limit' items.
  if (limit) {
      const totalNeeded = limit;
      if (liveEvents.length > totalNeeded) {
          liveEvents = liveEvents.slice(0, totalNeeded);
          upcomingEvents = [];
      } else {
          const remaining = totalNeeded - liveEvents.length;
          upcomingEvents = upcomingEvents.slice(0, remaining);
      }
  }

return (
  <div className={`max-w-7xl mx-auto px-6 ${hideHeader ? '' : 'py-12'}`}>

    {!hideHeader && (
        <h1 className="text-2xl font-semibold text-gray-800 mb-10">
        Upcoming Events
        </h1>
    )}

    {/* If No Events At All */}
    {events.length === 0 && (
      <div className="text-center py-20 border border-gray-200 rounded-xl bg-white">
        <p className="text-lg font-medium text-gray-600">
          No events found
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Please check back later for new events.
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
    )}

  </div>
);
}

export default EventFeed;
