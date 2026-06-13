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

  const handleExportClubData = async () => {
    try {
      if (!clubId) return;

      const query = new URLSearchParams(exportFilters).toString();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/events/club-manage/${clubId}/export?${query}`);
      const exportData = res.data.events;

      if (!exportData || exportData.length === 0) {
        showNotification('No data to export', 'info');
        return;
      }

      const headers = ['Event Name', 'Club Name', 'Registrations', 'Event Date', 'Amount Received (₹)'];
      const rows = exportData.map(e => [
        `"${e.eventName}"`,
        `"${e.clubName}"`,
        e.totalRegistrations,
        new Date(e.eventDate).toLocaleDateString(),
        e.totalAmountReceived
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `club_events_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      showNotification('Export successful!', 'success');
    } catch (err) {
      showNotification('Failed to export data', 'error');
    }
  };

  const filteredEvents = createdEvents.filter(event => {
    const eventDate = new Date(event.startTime);
    const mMatch = exportFilters.month === 'all' || (eventDate.getMonth() + 1).toString() === exportFilters.month.toString();
    const yMatch = exportFilters.year === 'all' || eventDate.getFullYear().toString() === exportFilters.year.toString();
    return mMatch && yMatch;
  });

  if (!user) return <div className="text-center mt-12 text-neutral-600 font-medium">Please login to view events.</div>;
  if (loading) return <div className="text-center mt-12 text-neutral-600 font-medium">Loading events...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 hover:text-orange-600 transition-colors mb-2"
          >
            <i className="ri-arrow-left-line text-sm" /> Back to Profile
          </Link>
          <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
            {clubName} Events
          </h2>
        </div>

        {createdEvents.length > 0 && (
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <select 
                value={exportFilters.month}
                onChange={(e) => setExportFilters({ ...exportFilters, month: e.target.value })}
                className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none hover:cursor-pointer hover:bg-gray-50 transition-all"
              >
                <option value="all">Month</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('en', { month: 'short' })}</option>
                ))}
              </select>
              <select 
                value={exportFilters.year}
                onChange={(e) => setExportFilters({ ...exportFilters, year: e.target.value })}
                className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none hover:cursor-pointer hover:bg-gray-50 transition-all"
              >
                <option value="all">Year</option>
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              {(exportFilters.month !== 'all' || exportFilters.year !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors px-2 cursor-pointer"
                >
                  Clear
                </button>
              )}
              <button
                onClick={handleExportClubData}
                className="inline-flex items-center justify-center gap-2 px-4 py-1.5 bg-emerald-600 text-white font-semibold text-xs rounded-lg hover:bg-emerald-700 transition-all active:translate-y-0.5 hover:shadow-sm hover:cursor-pointer"
              >
                <i className="ri-download-2-line text-sm" /> Export
              </button>
            </div>
          </div>
        )}
      </div>

      {createdEvents.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center shadow-sm">
          <i className="ri-calendar-event-line text-5xl text-neutral-300 mb-4 inline-block" />
          <p className="text-neutral-500 mb-4 font-medium">No events found for this club.</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white border border-dashed border-neutral-300 rounded-xl p-12 text-center shadow-sm">
          <i className="ri-filter-off-line text-5xl text-neutral-300 mb-4 inline-block" />
          <p className="text-neutral-500 mb-2 font-medium">No events match your selected filters.</p>
          <button 
            onClick={clearFilters}
            className="text-xs font-semibold text-orange-600 hover:underline cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid gap-5">
          {filteredEvents.map(event => {
            const now = new Date();
            const isPast = new Date(event.endTime) < now;
            const isLive = new Date(event.startTime) <= now && new Date(event.endTime) > now;
            const statusColors = {
                'PENDING': 'bg-amber-50 text-amber-700 border-amber-200',
                'PUBLISHED': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                'REJECTED': 'bg-rose-50 text-rose-700 border-rose-200',
                'DRAFT': 'bg-neutral-100 text-neutral-600 border-neutral-200'
            };

            return (
            <div
              key={event.id || event._id}
              className="bg-white border border-neutral-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 md:px-6 pt-5 pb-3 border-b border-neutral-100 bg-neutral-50/30 gap-3">
                <h3 className="text-lg font-bold text-neutral-900 leading-tight">
                    <Link to={`/event/${event.slug || event.id || event._id}`} className="hover:text-orange-600 transition-colors">
                        {event.title}
                    </Link>
                </h3>
                <div className="flex gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[event.reviewStatus] || 'bg-white border-neutral-200'}`}>
                        {event.reviewStatus}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      isPast ? 'bg-neutral-50 text-neutral-500 border-neutral-200' :
                      isLive ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse-slow' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                        {isPast ? 'Past' : isLive ? 'Live Now' : 'Upcoming'}
                    </span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between px-5 md:px-6 py-4 gap-4">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-neutral-600">
                  <span className="flex items-center gap-1.5 font-medium">
                    <MapPin className="w-4 h-4 shrink-0 text-neutral-400" />
                    {event.venue}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-xs uppercase tracking-wider text-neutral-500">
                    <Clock className="w-4 h-4 shrink-0 text-orange-600" />
                    {new Date(event.startTime).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-neutral-700">
                    <Users className="w-4 h-4 shrink-0 text-neutral-400" />
                    {event.registeredCount} / {event.totalSeats} registered
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {canReview && event.reviewStatus?.toUpperCase() === 'PENDING' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReview(event.id || event._id, 'PUBLISHED')}
                        className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-bold text-xs cursor-pointer shadow-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Enter rejection reason:');
                          if (reason) handleReview(event.id || event._id, 'REJECTED', reason);
                        }}
                        className="px-4 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition font-bold text-xs cursor-pointer shadow-sm"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <>
                      {canCheckReg && (
                        <Link
                            to={`/event/${event.id || event._id}/registrations`}
                            className="px-4 py-1.5 bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-lg hover:bg-neutral-200 transition font-bold text-xs cursor-pointer shadow-sm whitespace-nowrap"
                        >
                            Registrations
                        </Link>
                      )}
                      {canScan && !isPast && (
                        <Link
                            to={`/event/${event.id || event._id}/check-in`}
                            className="px-4 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-bold text-xs cursor-pointer shadow-sm whitespace-nowrap flex items-center gap-1.5"
                        >
                            <QrCode className="w-3.5 h-3.5" /> Scan Attendance
                        </Link>
                      )}
                      {canEdit && event.provideCertificate && (
                          <Link
                              to={`/event/${event.id || event._id}/design-certificate`}
                              className="px-4 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition font-bold text-xs cursor-pointer shadow-sm whitespace-nowrap"
                          >
                              Design Certificate
                          </Link>
                      )}
                      {canEdit && !isPast && (
                          <Link
                              to={`/events/edit/${event.id || event._id}`}
                              className="px-3 py-1.5 bg-neutral-50 text-neutral-700 border border-neutral-200 rounded-lg hover:bg-neutral-200 transition font-bold text-xs shadow-sm"
                          >
                            <i className="ri-edit-line text-sm font-medium" />
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
