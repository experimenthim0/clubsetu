import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import { Clock, MapPin, Users, QrCode } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { DownloadIcon } from '@/components/ui/download';
import { ClubMemberRole } from '../types/index.js';

const ClubEvents = () => {
  const { clubId } = useParams();
  const { showNotification } = useNotification();
  const [user, setUser] = useState(null);
  const [createdEvents, setCreatedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportFilters, setExportFilters] = useState({ month: 'all', year: 'all' });
  const [clubName, setClubName] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const [canScan, setCanScan] = useState(false);
  const [canCheckReg, setCanCheckReg] = useState(false);
  const [canReview, setCanReview] = useState(false);

  useEffect(() => {
    const storedUserData = localStorage.getItem('user');
    const storedUser = storedUserData ? JSON.parse(storedUserData) : null;
    const storedRole = localStorage.getItem('role');

    if (storedUser) {
      setUser(storedUser);
      fetchClubEvents(clubId);

      // Faculty coordinators and admins can review
      setCanReview(storedRole === 'facultyCoordinator' || storedRole === 'admin');

      // Fetch membership to derive RBAC flags
      axios.get(`${import.meta.env.VITE_API_URL}/api/club-members/${clubId}/members`)
        .then(res => {
          const membership = res.data.find(
            m => m.studentId === storedUser.id || m.student?.id === storedUser.id
          );
          if (membership) {
            setClubName(membership.clubName || "");
            setCanEdit(membership.canEditEvents ?? false);
            setCanScan(membership.canTakeAttendance ?? false);
            // Club head and coordinators can view registrations
            setCanCheckReg(
              membership.role === ClubMemberRole.CLUB_HEAD ||
              membership.role === ClubMemberRole.COORDINATOR ||
              membership.canEditEvents === true
            );
          }
        })
        .catch(() => {
          // Not a member or fetch failed — no admin controls shown
        });
    } else {
      setLoading(false);
    }
  }, [clubId]);

  const fetchClubEvents = async (id) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/events/club-manage/${id}`);
      setCreatedEvents(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch events', err);
      showNotification(err.response?.data?.message || 'Failed to load club events', 'error');
      setLoading(false);
    }
  };

  const handleReview = async (eventId, status, comment = '') => {
    try {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/events/${eventId}/review`, { status, comment });
        showNotification(`Event ${status === 'PUBLISHED' ? 'Approved' : 'Rejected'} successfully`, 'success');
        fetchClubEvents(clubId);
    } catch (err) {
        showNotification(err.response?.data?.message || 'Review failed', 'error');
    }
  };

  const clearFilters = () => setExportFilters({ month: 'all', year: 'all' });

  const filteredEvents = createdEvents.filter(event => {
    const eventDate = new Date(event.startTime);
    const mMatch = exportFilters.month === 'all' || (eventDate.getMonth() + 1).toString() === exportFilters.month.toString();
    const yMatch = exportFilters.year === 'all' || eventDate.getFullYear().toString() === exportFilters.year.toString();
    return mMatch && yMatch;
  });

  if (!user) return <div className="text-center mt-10 font-bold">Please login to view events.</div>;
  if (loading) return <div className="text-center mt-10 font-bold">Loading events...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-black transition-colors mb-2"
          >
            <i className="ri-arrow-left-line text-lg" /> Back to Profile
          </Link>
          <h2 className="text-xl md:text-2xl font-black text-black tracking-wide">
            {clubName} Events
          </h2>
        </div>
      </div>

      {createdEvents.length === 0 ? (
        <div className="bg-white border-2 border-black rounded-sm p-12 text-center ">
          <i className="ri-calendar-event-line text-6xl text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4 font-bold">No events found for this club.</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-sm p-12 text-center">
          <i className="ri-filter-off-line text-5xl text-gray-300 mb-4" />
          <p className="text-gray-500 mb-2 font-bold">No events match your selected filters.</p>
          <button 
            onClick={clearFilters}
            className="text-xs font-black uppercase tracking-widest text-orange-600 hover:underline cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredEvents.map(event => {
            const now = new Date();
            const isPast = new Date(event.endTime) < now;
            const isLive = new Date(event.startTime) <= now && new Date(event.endTime) > now;
            const statusColors = {
                'PENDING': 'bg-yellow-100 text-yellow-700 border-yellow-600',
                'PUBLISHED': 'bg-green-100 text-green-700 border-green-600',
                'REJECTED': 'bg-red-100 text-red-700 border-red-600',
                'DRAFT': 'bg-gray-100 text-gray-700 border-gray-600'
            };

            return (
            <div
              key={event.id || event._id}
              className="bg-white border-2 border-gray-300 rounded-sm overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 md:px-6 pt-5 pb-3 border-b border-neutral-100 gap-3">
                <h3 className="text-lg font-black text-black leading-wide">
                    <Link to={`/event/${event.slug || event.id || event._id}`} className="hover:text-orange-600 transition-colors">
                        {event.title}
                    </Link>
                </h3>
                <div className="flex gap-2">
                    <span className={`inline-block px-3 py-1 rounded-sm text-[10px] font-black tracking-wider border-2 border-black ${statusColors[event.reviewStatus] || 'bg-white'}`}>
                        {event.reviewStatus}
                    </span>
                    <span className={`inline-block px-3 py-1 rounded-sm text-[10px] font-black tracking-wider border-2 ${
                      isPast ? 'bg-neutral-100 text-neutral-600 border-neutral-200' :
                      isLive ? 'bg-red-100 text-red-700 border-red-600' :
                      'bg-green-100 text-green-700 border-green-600'
                    }`}>
                        {isPast ? 'Past' : isLive ? 'Live Now' : 'Upcoming'}
                    </span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 gap-4">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-gray-600">
                  <span className="flex items-center gap-1.5 font-bold">
                    <MapPin className="w-4 h-4 shrink-0 truncate max-w-[120px]" />
                    {event.venue}
                  </span>
                  <span className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-widest text-neutral-500">
                    <Clock className="w-4 h-4 shrink-0 text-orange-600" />
                    {new Date(event.startTime).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </span>
                  <span className="flex items-center gap-1.5 font-bold text-neutral-700">
                    <Users className="w-4 h-4 shrink-0" />
                    {event.registeredCount} / {event.totalSeats} registered
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {canReview && event.reviewStatus?.toUpperCase() === 'PENDING' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReview(event.id || event._id, 'PUBLISHED')}
                        className="px-4 py-2 bg-green-600 text-white border-2 border-black rounded-sm hover:bg-green-700 transition font-black text-[10px] uppercase tracking-wider cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Enter rejection reason:');
                          if (reason) handleReview(event.id || event._id, 'REJECTED', reason);
                        }}
                        className="px-4 py-2 bg-red-600 text-white border-2 border-black rounded-sm hover:bg-red-700 transition font-black text-[10px] uppercase tracking-wider cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <>
                      {canCheckReg && (
                        <Link
                            to={`/event/${event.id || event._id}/registrations`}
                            className="px-3 py-2 bg-blue-100 text-blue-700 border-2 border-blue-700 rounded-sm hover:bg-blue-700 hover:text-white transition font-bold text-sm tracking-wider whitespace-nowrap"
                        >
                            Registrations
                        </Link>
                      )}
                      {canScan && !isPast && (
                        <Link
                            to={`/event/${event.id || event._id}/check-in`}
                            className="px-3 py-2 bg-orange-600 text-white border-2 border-black rounded-sm hover:bg-black hover:text-white transition font-bold text-sm tracking-wider whitespace-nowrap flex items-center gap-2"
                        >
                            <QrCode className="w-4 h-4" /> Scan Attendance
                        </Link>
                      )}
                      {canEdit && event.provideCertificate && (
                          <Link
                              to={`/event/${event.id || event._id}/design-certificate`}
                              className="px-3 py-2 bg-orange-100 text-orange-700 border-2 border-orange-700 rounded-sm hover:bg-orange-700 hover:text-white transition font-bold text-sm tracking-wider whitespace-nowrap"
                          >
                              Design Certificate
                          </Link>
                      )}
                      {canEdit && !isPast && (
                          <Link
                              to={`/events/edit/${event.id || event._id}`}
                              className="px-3 py-1 bg-neutral-100 text-black border-2 border-black rounded-sm hover:bg-black hover:text-white transition font-bold text-sm tracking-wider"
                          >
                            <i className="ri-edit-line text-lg" />
                          </Link>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClubEvents;
