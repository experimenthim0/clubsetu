import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import { Clock, MapPin, Users, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DownloadIcon } from '@/components/ui/download';
import QRCode from 'qrcode';
const MyEvents = () => {
  const { showNotification } = useNotification();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [createdEvents, setCreatedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [eventToDeregister, setEventToDeregister] = useState(null);
  const [exportFilters, setExportFilters] = useState({ month: 'all', year: 'all' });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    const storedUserData = localStorage.getItem('user');
    const storedUser = storedUserData ? JSON.parse(storedUserData) : null;
    const storedRole = localStorage.getItem('role');

    if (storedUser) {
      setUser(storedUser);
      setRole(storedRole);

      if (storedRole === 'member') {
        fetchRegistrations(storedUser.id || storedUser._id);
        if (storedUser.clubId) {
          fetchCreatedEvents(storedUser.id || storedUser._id);
        }
      } else if (storedRole === 'student') {
        fetchRegistrations(storedUser.id || storedUser._id);
      } else if (storedRole === 'club') {
        fetchCreatedEvents(storedUser.id || storedUser._id);
      } else if (storedRole === 'facultyCoordinator') {
        fetchFacultyEvents(storedUser.clubId);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchRegistrations = async (userId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/events/user/${userId}`);
      setRegistrations(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      showNotification('Failed to load your registrations', 'error');
      setLoading(false);
    }
  };

  const fetchCreatedEvents = async (userId) => {
    try {
      const storedUserData = localStorage.getItem('user');
      const storedUser = storedUserData ? JSON.parse(storedUserData) : null;
      
      const clubId = storedUser?.clubId;
      if (!clubId) {
          setLoading(false);
          return;
      }
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/events/club-manage/${clubId}`);
      setCreatedEvents(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch events', err);
      showNotification('Failed to load your events', 'error');
      setLoading(false);
    }
  };

  const fetchFacultyEvents = async (clubId) => {
    try {
        if (!clubId) {
            setLoading(false);
            return;
        }
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/events/club-manage/${clubId}`);
        setCreatedEvents(res.data);
        setLoading(false);
    } catch (err) {
        console.error('Faculty fetch error:', err);
        showNotification('Failed to load events for review', 'error');
        setLoading(false);
    }
  };

  const handleReview = async (eventId, status, comment = '') => {
    try {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/events/${eventId}/review`, { status, comment });
        showNotification(`Event ${status === 'PUBLISHED' ? 'Approved' : 'Rejected'} successfully`, 'success');
        // Refresh list
        if (role === 'facultyCoordinator') {
            fetchFacultyEvents(user.clubId);
        } else if (role === 'admin') {
            // If admin, we don't have a single clubId usually, but in this context 
            // they might be viewing the whole list or a specific club list.
            // For now, reload whatever list was active.
            window.location.reload(); 
        }
    } catch (err) {
        showNotification(err.response?.data?.message || 'Review failed', 'error');
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
        data: { studentId: user.id }
      });

      setRegistrations(registrations.filter(r => (r.eventId?.id || r.eventId?._id) !== eventToDeregister));
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
      setCreatedEvents(createdEvents.filter(e => (e.id || e._id) !== eventToDelete));
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

  const clearFilters = () => setExportFilters({ month: 'all', year: 'all' });

  const filteredEvents = createdEvents.filter(event => {
    const eventDate = new Date(event.startTime);
    const mMatch = exportFilters.month === 'all' || (eventDate.getMonth() + 1).toString() === exportFilters.month.toString();
    const yMatch = exportFilters.year === 'all' || eventDate.getFullYear().toString() === exportFilters.year.toString();
    return mMatch && yMatch;
  });

  const handleExportClubData = async () => {
    try {
      const storedUserData = localStorage.getItem('user');
      const storedAdminData = localStorage.getItem('admin');
      const storedUser = storedUserData ? JSON.parse(storedUserData) : (storedAdminData ? JSON.parse(storedAdminData) : null);
      
      const clubId = storedUser?.clubId;
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

  if (!user) return <div className="text-center mt-10">Please login to view your events.</div>;
  if (loading) return <div className="text-center mt-10">Loading events...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 md:mb-12">
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-black transition-colors"
        >
          <i className="ri-arrow-left-line text-lg" /> Back to Profile
        </Link>
        <h1 className="text-2xl md:text-4xl font-black text-black  tracking-wide">My Events</h1>
      </div>

      {/* ── STUDENT VIEW ── */}
      {(role === 'member' || role === 'student') && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Your Event History</h2>

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
                const now = new Date();
                const isPast = new Date(event.endTime) < now;
                const isLive = new Date(event.startTime) <= now && new Date(event.endTime) > now;

                return (
                  <div
                    key={reg.id || reg._id}
                    className="bg-white border-2 border-gray-400 rounded-sm overflow-hidden"
                  >
                    {/* Top stripe: title + timeline badge */}
                    {/* Top stripe: title + timeline badge */}
                    <div className="flex flex-row sm:flex-row sm:items-center justify-between px-4 md:px-6 pt-5 pb-3 border-b border-neutral-100 gap-3">
                      <h3 className="text-lg font-black text-black leading-tight">
                        <Link to={`/event/${event.slug || event.id || event._id}`} className="hover:text-orange-600 transition-colors">
                          {event.title}
                        </Link>
                      </h3>
                      <span
                        className={`inline-block px-3 py-1 rounded-sm text-[10px] font-black  tracking-wider w-fit border-2 ${
                          isPast
                            ? 'bg-neutral-100 text-neutral-600 border-neutral-200'
                            : isLive
                            ? 'bg-red-100 text-red-700 border-red-600'
                            : 'bg-green-100 text-green-700 border-green-600'
                        }`}
                      >
                        {isPast ? 'Past Event' : isLive ? 'Live Now' : 'Upcoming'}
                      </span>
                    </div>

                    {/* Bottom row: meta info left | status + action right */}
                    {/* Bottom row: meta info | status + action */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-6 py-4 gap-6">
                      {/* Left — venue & date */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-2 text-xs font-bold uppercase tracking-wider text-neutral-500">
                        <span className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 shrink-0 text-orange-600" />
                          {event.venue}
                        </span>
                        <span className="flex items-center gap-2">
                          <Clock className="w-4 h-4 shrink-0 text-orange-600" />
                          {new Date(event.startTime).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </span>
                      </div>

                      {/* Right — registration status + deregister */}
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-sm text-[10px] font-black  tracking-wider border-2 ${
                            reg.status === 'CONFIRMED' || reg.status === 'REGISTERED'
                              ? 'bg-green-50 text-green-700 border-green-600'
                              : 'bg-orange-50 text-orange-700 border-orange-600'
                          }`}
                        >
                          {reg.status}
                        </span>

                        <button
                          onClick={async () => { 
                            setSelectedTicket(reg); 
                            setTicketModalOpen(true);
                            try {
                              const url = await QRCode.toDataURL(reg.qrCode, { width: 400, margin: 2 });
                              setQrDataUrl(url);
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="px-3 py-1 rounded-sm text-[10px] font-black tracking-wider border-2 border-black bg-white hover:bg-black hover:text-white transition-colors"
                        >
                          Show Ticket
                        </button>

                        {!isPast && (
                          event.entryFee > 0 ? (
                            <span className="text-[10px] font-black tracking-tight text-neutral-400  bg-neutral-50 px-3 py-1.5 border-2 border-neutral-200 rounded-sm cursor-not-allowed whitespace-nowrap">
                              <i className="ri-lock-2-line mr-1" /> Paid Entry
                            </span>
                          ) : (
                            <button
                              onClick={() => handleDeregister(event.id || event._id)}
                              className="text-[11px] text-red-600 hover:text-white hover:bg-red-600 transition border-2 border-red-600 px-3 py-1.5 rounded-sm font-black  tracking-widest whitespace-nowrap"
                            >
                              Deregister
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Prominent Certificate Button for Past Events */}
                    {isPast && reg.status === 'CONFIRMED' && event.provideCertificate && (
                     <div className="px-2 md:px-6 pb-5 pt-2 border-t-2 border-neutral-50 bg-neutral-50/30 flex md:justify-start">
                        <a
  href={`${import.meta.env.VITE_API_URL}/api/certificates/${event.id || event._id}/download`}
  className="flex items-center justify-center gap-3 bg-gray-200 hover:bg-gray-300 w-full md:w-auto px-4 py-2 text-black transition border-2 border-black rounded-sm font-black tracking-widest text-xs active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
>
  <DownloadIcon size={18}>
    Download E-Certificate
  </DownloadIcon>
</a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── CLUB / MEMBER / FACULTY VIEW ── */}
      {(role === 'club' || (role === 'member' && user?.clubId) || role === 'facultyCoordinator' || role === 'admin') && (
        <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 my-10">
            <h2 className="text-xl md:text-2xl font-medium text-black  tracking-wide">
                {role === 'facultyCoordinator' ? 'Club Events Review' : 
                 role === 'member' ? 'Assigned Club Events' : 'Events You Organized'}
            </h2>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {(role === 'club' || role === 'facultyCoordinator') && createdEvents.length > 0 && (
                    <div className="flex items-center gap-2">
                        <select 
                            value={exportFilters.month}
                            onChange={(e) => setExportFilters({ ...exportFilters, month: e.target.value })}
                            className="p-1 border-2 border-black rounded-full text-[10px] font-black uppercase tracking-wider bg-white focus:outline-none hover:cursor-pointer hover:bg-gray-100"
                        >
                            <option value="all">Month</option>
                            {[...Array(12)].map((_, i) => (
                                <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('en', { month: 'short' })}</option>
                            ))}
                        </select>
                        <select 
                            value={exportFilters.year}
                            onChange={(e) => setExportFilters({ ...exportFilters, year: e.target.value })}
                            className="p-1 border-2 border-black rounded-full text-[10px] font-black uppercase tracking-wider bg-white focus:outline-none hover:cursor-pointer hover:bg-gray-100"
                        >
                            <option value="all">Year</option>
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        {(exportFilters.month !== 'all' || exportFilters.year !== 'all') && (
                            <button
                                onClick={clearFilters}
                                className="text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-700 transition-colors px-2"
                            >
                                Clear
                            </button>
                        )}
                        <button
                            onClick={handleExportClubData}
                            className="inline-flex items-center justify-center gap-2 px-3 py-1 bg-green-500 text-white font-black text-sm tracking-wide rounded-full hover:bg-green-400 transition-all active:translate-x-1 active:translate-y-1 hover:cursor-pointer"
                        >
                            <i className="ri-download-2-line text-lg" /> Export
                        </button>
                    </div>
                )}
                {role === 'club' && (
                    <Link
                    to="/create"
                    className="text-white bg-[#0f1419] hover:bg-[#0f1419]/90 focus:ring-4 focus:outline-none focus:ring-[#0f1419]/50 box-border border border-transparent font-medium leading-5 text-sm px-4 py-2.5 text-center inline-flex items-center dark:hover:bg-[#24292F] dark:focus:ring-[#24292F]/55 rounded-4xl"
                    >
                    <i className="ri-add-line text-xl mr-2" /> Create New Event
                    </Link>
                )}
            </div>
          </div>

          {createdEvents.length === 0 ? (
            <div className="bg-white border-2 border-black rounded-sm p-12 text-center ">
              <i className="ri-calendar-event-line text-6xl text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">No events found.</p>
              {role === 'club' && (
                  <Link
                    to="/create"
                    className="inline-flex items-center gap-2 px-6 py-2 bg-black text-white font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-orange-600 transition-colors"
                  >
                    <i className="ri-add-line" /> Create Your First Event
                  </Link>
              )}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-sm p-12 text-center">
              <i className="ri-filter-off-line text-5xl text-gray-300 mb-4" />
              <p className="text-gray-500 mb-2">No events match your selected filters.</p>
              <button 
                onClick={clearFilters}
                className="text-xs font-black uppercase tracking-widest text-orange-600 hover:underline"
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
                  className="bg-white border-2 border-gray-300 rounded-sm  overflow-hidden"
                >
                  {/* Top stripe: title */}
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

                  {/* Bottom row: meta left | actions right */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 gap-4">
                    {/* Left — venue, date, seats */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 shrink-0" />
                        {event.venue}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 shrink-0" />
                        {new Date(event.startTime).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1.5 font-semibold text-neutral-700">
                        <Users className="w-4 h-4 shrink-0" />
                        {event.registeredCount} / {event.totalSeats} registered
                      </span>
                    </div>

                    {/* Right — action buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {(role?.toLowerCase() === 'facultycoordinator' || role?.toLowerCase() === 'admin' || user?.role === 'facultyCoordinator') && 
                       event.reviewStatus?.toUpperCase() === 'PENDING' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReview(event.id || event._id, 'PUBLISHED')}
                            className="px-4 py-2 bg-green-600 text-white border-2 border-black rounded-sm hover:bg-green-700 transition font-black text-[10px] uppercase tracking-wider"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                                const reason = prompt('Enter rejection reason:');
                                if (reason) handleReview(event.id || event._id, 'REJECTED', reason);
                            }}
                            className="px-4 py-2 bg-red-600 text-white border-2 border-black rounded-sm hover:bg-red-700 transition font-black text-[10px] uppercase tracking-wider"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <>
                          {(role === 'club' || user?.role === 'club' || role === 'facultyCoordinator' || user?.role === 'facultyCoordinator' || role === 'admin') && (
                            <Link
                              to={`/event/${event.id || event._id}/registrations`}
                              className="px-3 py-2 bg-blue-100 text-blue-700 border-2 border-blue-700 rounded-sm hover:bg-blue-700 hover:text-white transition font-bold text-sm tracking-wider whitespace-nowrap"
                            >
                              Registrations
                            </Link>
                          )}
                          {(role === 'club' || role === 'facultyCoordinator' || role === 'admin' || 
                            (role === 'member' && user?.memberships?.find(m => m.clubId === event.clubId || m.clubId === user.clubId)?.canTakeAttendance) ||
                            (role === 'member' && user?.memberships?.find(m => m.clubId === event.clubId || m.clubId === user.clubId)?.permissions?.canTakeAttendance)
                          ) && (
                            <Link
                              to={`/event/${event.id || event._id}/check-in`}
                              className="px-3 py-2 bg-orange-600 text-white border-2 border-black rounded-sm hover:bg-black hover:text-white transition font-bold text-sm tracking-wider whitespace-nowrap flex items-center gap-2"
                            >
                              <QrCode className="w-4 h-4" /> Scan Attendance
                            </Link>
                          )}
                          {role === 'club' && event.provideCertificate && (
                            <Link
                                to={`/event/${event.id || event._id}/design-certificate`}
                                className="px-3 py-2 bg-orange-100 text-orange-700 border-2 border-orange-700 rounded-sm hover:bg-orange-700 hover:text-white transition font-bold text-sm tracking-wider whitespace-nowrap"
                            >
                                Design Certificate
                            </Link>
                          )}
                          {(role === 'club' || user?.role === 'club' || role === 'admin') && (
                            <>
                              <Link
                                to={`/events/edit/${event.id || event._id}`}
                                className="px-3 py-2 bg-white text-black border-2 border-black rounded-sm hover:bg-black hover:text-white transition font-bold text-sm tracking-wider"
                              >
                                <i className="ri-pencil-line"></i>
                              </Link>
                              {/* <button
                                onClick={() => handleDelete(event.id || event._id)}
                                className="px-3 py-2 bg-white text-red-600 border-2 border-red-600 rounded-sm hover:bg-red-600 hover:text-white transition font-bold text-sm tracking-wider"
                              >
                                Delete
                              </button> */}
                           </>
                          )}
                        </>
                      )}
                    </div>  {/* closes action buttons div */}
                  </div>  

                  {/* Context Block for special states */}
                  {(event.reviewStatus === 'REJECTED' || (role === 'facultyCoordinator' && event.reviewStatus === 'PENDING')) && (
                      <div className="px-6 pb-5">
                          {event.reviewStatus === 'REJECTED' && (
                              <div className="bg-red-50 border-2 border-red-200 p-4 flex gap-3 items-start">
                                  <i className="ri-error-warning-fill text-red-600 text-xl" />
                                  <div>
                                      <p className="text-xs font-black text-red-700 uppercase tracking-widest leading-none mb-1">Rejection Reason</p>
                                      <p className="text-sm text-red-600 font-bold">{event.reviewComment || 'No feedback provided. Please contact the faculty coordinator.'}</p>
                                  </div>
                              </div>
                          )}
                          {role === 'facultyCoordinator' && event.reviewStatus === 'PENDING' && (
                              <div className="bg-yellow-50 border-2 border-yellow-200 p-4 flex gap-3 items-start">
                                  <i className="ri-information-fill text-yellow-600 text-xl" />
                                  <div>
                                      <p className="text-xs font-black text-yellow-700 uppercase tracking-widest leading-none mb-1">Review Required</p>
                                      <p className="text-sm text-yellow-600 font-bold">This event is waiting for your approval before it becomes visible to students.</p>
                                  </div>
                              </div>
                          )}
                      </div>
                  )}
                </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── DEREGISTER MODAL ── */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white border-2 border-black rounded-sm max-w-md w-full shadow-[8px_8px_0px_#0D0D0D]">
            <div className="bg-orange-600 px-6 py-4 border-b-2 border-black">
              <h3 className="font-black text-white text-lg flex items-center gap-2">
                <i className="ri-error-warning-line" /> Confirm Deregistration
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-neutral-700 leading-relaxed">
                Are you sure you want to deregister from this event? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => { setConfirmModalOpen(false); setEventToDeregister(null); }}
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

      {/* ── DELETE MODAL ── */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white border-2 border-black rounded-sm max-w-md w-full shadow-[8px_8px_0px_#0D0D0D]">
            <div className="bg-orange-600 px-6 py-4 border-b-2 border-black">
              <h3 className="font-black text-white text-lg flex items-center gap-2">
                <i className="ri-delete-bin-line" /> Confirm Deletion
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-neutral-700 leading-relaxed">
                Are you sure you want to delete this event? All registrations will be lost. This action cannot be undone.
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => { setDeleteModalOpen(false); setEventToDelete(null); }}
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
      {/* ── TICKET MODAL ── */}
      {ticketModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4 py-6 overflow-y-auto">
          <div className="bg-white border-2 border-gray-300 rounded-xl max-w-sm w-full  relative overflow-hidden flex flex-col my-auto">
            {/* Header / Brand */}
            <div className="bg-orange-600 p-4 border-b-2 border-gray-300 flex justify-between items-center">
              <div className="flex items-center gap-2">
                
                <h3 className="font-black text-white text-lg tracking-wider">Event Ticket</h3>
              </div>
              <button 
                onClick={() => { setTicketModalOpen(false); setSelectedTicket(null); }}
                className="text-white hover:bg-black/20 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <i className="ri-close-line text-xl" />
              </button>
            </div>

            <div className="p-0 flex-1">
              {/* Event Poster/Banner (optional, placeholder pattern) */}
              <div className="h-2 bg-black/5" />

              <div className="p-6">
                {/* Event Name */}
                <div className="mb-6">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Event</p>
                  <h4 className="text-xl font-black text-black leading-tight">
                    {selectedTicket.eventId?.title}
                  </h4>
                </div>

                {/* Grid for Student & ID */}
                <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t-2 border-dashed border-neutral-100">
                  <div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Student</p>
                    <p className="text-sm font-bold text-black uppercase">{user?.name}</p>
                    <p className="text-[11px] text-neutral-500 font-mono">{user?.rollNo || user?.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Reg ID</p>
                    <p className="text-[11px] font-black bg-neutral-100 px-2 py-1 border border-neutral-200 rounded-sm inline-block font-mono">
                      {selectedTicket.qrCode}
                    </p>
                  </div>
                </div>

                {/* Venue & Time */}
                <div className="flex flex-col gap-3 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-neutral-100 border-2 border-gray-300 rounded-sm flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">Venue</p>
                      <p className="text-xs font-bold text-black truncate max-w-[200px] uppercase">{selectedTicket.eventId?.venue}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-neutral-100 border-2 border-gray-300 rounded-sm flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">Date & Time</p>
                      <p className="text-xs font-bold text-black uppercase">
                        {new Date(selectedTicket.eventId?.startTime).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="flex flex-col items-center gap-4 py-8 border-t-2 border-gray-300 bg-neutral-50 -mx-6 -mb-6">
                  <div className="bg-white p-1 border-2 border-gray-300 ">
                    {qrDataUrl ? (
                      <img 
                        src={qrDataUrl} 
                        alt="Ticket QR Code" 
                        className="w-60 h-60"
                      />
                    ) : (
                      <div className="w-60 h-60 flex items-center justify-center text-neutral-400">
                        <i className="ri-loader-4-line animate-spin text-2xl" />
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    
                    <p className="text-[10px] font-bold text-neutral-400 italic mb-1">Valid for one-time entry only</p>
                    <p className="text-[9px] font-bold text-neutral-400 italic mb-2">Show this QR code at the entrance</p>
                    <p className="text-[9px] font-bold text-neutral-400 italic">Powered by Club<span className="text-orange-600">Setu</span></p>
                  </div>
                  
                  {qrDataUrl && (
                    <a
                      href={qrDataUrl}
                      download={`ticket-qr-${selectedTicket.qrCode}.png`}
                      className="mt-2 text-[10px] font-black uppercase tracking-widest text-orange-600 hover:text-black transition-colors flex items-center gap-1"
                    >
                      <i className="ri-download-line" /> Download QR
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyEvents;