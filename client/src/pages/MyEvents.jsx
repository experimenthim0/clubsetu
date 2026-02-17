import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import { Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyEvents = () => {
  const { showNotification } = useNotification();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [createdEvents, setCreatedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [eventToDeregister, setEventToDeregister] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const storedRole = localStorage.getItem('role');
    
    if (storedUser) {
      setUser(storedUser);
      setRole(storedRole);
      
      if (storedRole === 'student') {
        fetchRegistrations(storedUser._id);
      } else if (storedRole === 'club-head') {
        fetchCreatedEvents(storedUser._id);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchRegistrations = async (studentId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/events/student/${studentId}`);
      setRegistrations(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      showNotification('Failed to load your registrations', 'error');
      setLoading(false);
    }
  };

  const fetchCreatedEvents = async (clubHeadId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/events/club-head/${clubHeadId}`);
      setCreatedEvents(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch events', err);
      showNotification('Failed to load your events', 'error');
      setLoading(false);
    }
  };

  const handleDeregister = async (eventId) => {
    setEventToDeregister(eventId);
    setConfirmModalOpen(true);
  };

  const confirmDeregister = async () => {
    if (!eventToDeregister) return;
    
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/events/${eventToDeregister}/register`, {
        data: { studentId: user._id }
      });
      
      setRegistrations(registrations.filter(r => r.eventId?._id !== eventToDeregister));
      showNotification('Successfully deregistered from the event', 'success');
      setConfirmModalOpen(false);
      setEventToDeregister(null);
    } catch (err) {
      console.error('Deregister error:', err);
      showNotification(err.response?.data?.message || 'Failed to deregister. Please try again.', 'error');
      setConfirmModalOpen(false);
      setEventToDeregister(null);
    }
  };

  const handleDelete = (eventId) => {
    setEventToDelete(eventId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;
    
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/events/${eventToDelete}`);
      setCreatedEvents(createdEvents.filter(e => e._id !== eventToDelete));
      showNotification('Event deleted successfully', 'success');
      setDeleteModalOpen(false);
      setEventToDelete(null);
    } catch (err) {
      console.error('Delete error:', err);
      showNotification(err.response?.data?.message || 'Failed to delete event. Please try again.', 'error');
      setDeleteModalOpen(false);
      setEventToDelete(null);
    }
  };

  if (!user) return <div className="text-center mt-10">Please login to view your events.</div>;
  if (loading) return <div className="text-center mt-10">Loading events...</div>;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-black">My Events</h1>
        <Link 
          to="/profile" 
          className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-black hover:text-orange-600 transition-colors"
        >
          <i className="ri-arrow-left-line" /> Back to Profile
        </Link>
      </div>

      {/* Student - Registered Events */}
      {role === 'student' && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Your Event History
          </h2>

          {registrations.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <i className="ri-calendar-line text-6xl text-gray-300 mb-4" />
              <p className="text-gray-500">No registered events found.</p>
              <Link 
                to="/" 
                className="inline-block mt-4 px-6 py-2 bg-black text-white font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-orange-600 transition-colors"
              >
                Browse Events
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {registrations.map(reg => {
                const event = reg.eventId;
                if (!event) return null;

                const isPast = new Date(event.endTime) < new Date();

                return (
                  <div
                    key={reg._id}
                    className="bg-white border-2 border-black rounded-sm p-6 flex justify-between items-start shadow-[4px_4px_0px_#0D0D0D]"
                  >
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-black">
                        {event.title}
                      </h3>

                      <p className="text-gray-600 text-sm mt-1 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {event.venue}
                      </p>

                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="flex items-center gap-1 text-gray-600">
                          <Clock className="w-4 h-4" />
                          {new Date(event.startTime).toLocaleDateString()}
                        </span>

                        <span
                          className={`px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider ${
                            reg.status === 'CONFIRMED'
                              ? 'bg-green-100 text-green-700 border border-green-700'
                              : 'bg-orange-100 text-orange-700 border border-orange-700'
                          }`}
                        >
                          {reg.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      {isPast ? (
                        <span className="text-xs px-3 py-1 bg-neutral-100 text-neutral-600 rounded-sm border border-neutral-300 font-semibold">
                          Past Event
                        </span>
                      ) : (
                        <>
                          <span className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-sm border border-green-700 font-bold uppercase tracking-wider">
                            Upcoming
                          </span>

                          {event.entryFee > 0 ? (
                            <span className="text-[10px] font-black tracking-tight text-neutral-400 uppercase bg-neutral-50 px-3 py-2 border-2 border-neutral-200 rounded-sm cursor-not-allowed">
                              <i className="ri-lock-2-line mr-1" /> No Deregister (Paid)
                            </span>
                          ) : (
                            <button
                              onClick={() => handleDeregister(event._id)}
                              className="text-sm text-red-600 hover:text-white hover:bg-red-600 transition border-2 border-red-600 px-3 py-1.5 rounded-sm font-bold uppercase tracking-wider"
                            >
                              Deregister
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Club Head - Created Events */}
      {role === 'club-head' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-black">My Created Events</h2>
            <Link 
              to="/events/create" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-orange-600 transition-colors"
            >
              <i className="ri-add-line" /> Create Event
            </Link>
          </div>

          {createdEvents.length === 0 ? (
            <div className="bg-white border-2 border-black rounded-sm p-12 text-center shadow-[4px_4px_0px_#0D0D0D]">
              <i className="ri-calendar-event-line text-6xl text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">You haven't created any events yet.</p>
              <Link 
                to="/events/create" 
                className="inline-flex items-center gap-2 px-6 py-2 bg-black text-white font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-orange-600 transition-colors"
              >
                <i className="ri-add-line" /> Create Your First Event
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {createdEvents.map(event => (
                <div 
                  key={event._id} 
                  className="bg-white border-2 border-black rounded-sm p-6 flex justify-between items-center shadow-[4px_4px_0px_#0D0D0D]"
                >
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-black">{event.title}</h3>
                    <p className="text-gray-600 mt-1 flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.venue}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(event.startTime).toLocaleString()}
                      </span>
                    </p>
                    <p className="text-sm text-neutral-600 mt-2">
                      <span className="font-semibold">Registered:</span> {event.registeredCount} / {event.totalSeats}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Link 
                      to={`/events/${event._id}/registrations`} 
                      className="px-4 py-2 bg-blue-100 text-blue-700 border-2 border-blue-700 rounded-sm hover:bg-blue-700 hover:text-white transition font-bold text-sm uppercase tracking-wider"
                    >
                      Registrations
                    </Link>
                    <Link 
                      to={`/events/edit/${event._id}`} 
                      className="px-4 py-2 bg-neutral-100 text-black border-2 border-black rounded-sm hover:bg-black hover:text-white transition font-bold text-sm uppercase tracking-wider"
                    >
                      Edit
                    </Link>
                    <button 
                      onClick={() => handleDelete(event._id)} 
                      className="px-4 py-2 bg-red-100 text-red-700 border-2 border-red-700 rounded-sm hover:bg-red-700 hover:text-white transition font-bold text-sm uppercase tracking-wider"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Deregister Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white border-2 border-black rounded-sm max-w-md w-full shadow-[8px_8px_0px_#0D0D0D]">
            
            <div className="bg-orange-600 px-6 py-4 border-b-2 border-black">
              <h3 className="font-black text-white text-lg flex items-center gap-2">
                <i className="ri-error-warning-line" />
                Confirm Deregistration
              </h3>
            </div>

            <div className="p-6">
              <p className="text-sm text-neutral-700 leading-relaxed">
                Are you sure you want to deregister from this event? This action cannot be undone.
              </p>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => {
                  setConfirmModalOpen(false);
                  setEventToDeregister(null);
                }}
                className="flex-1 px-4 py-3 bg-white border-2 border-black text-black font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeregister}
                className="flex-1 px-4 py-3 bg-red-600 border-2 border-red-600 text-white font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-red-700 hover:border-red-700 transition-colors cursor-pointer"
              >
                Deregister
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white border-2 border-black rounded-sm max-w-md w-full shadow-[8px_8px_0px_#0D0D0D]">
            
            <div className="bg-orange-600 px-6 py-4 border-b-2 border-black">
              <h3 className="font-black text-white text-lg flex items-center gap-2">
                <i className="ri-delete-bin-line" />
                Confirm Deletion
              </h3>
            </div>

            <div className="p-6">
              <p className="text-sm text-neutral-700 leading-relaxed">
                Are you sure you want to delete this event? All registrations will be lost. This action cannot be undone.
              </p>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setEventToDelete(null);
                }}
                className="flex-1 px-4 py-3 bg-white border-2 border-black text-black font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-red-600 border-2 border-red-600 text-white font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-red-700 hover:border-red-700 transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyEvents;
