import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [clubHeads, setClubHeads] = useState([]);
    const [eventData, setEventData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [role, setRole] = useState(null);
    const [filters, setFilters] = useState({ month: 'all', year: 'all', clubId: 'all' });
    const [showYearWise, setShowYearWise] = useState(false);
    const [selectedClub, setSelectedClub] = useState(null);
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [coordinators, setCoordinators] = useState([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingClub, setEditingClub] = useState(null);
    const [isCoordModalOpen, setIsCoordModalOpen] = useState(false);
    const [editingCoord, setEditingCoord] = useState(null);
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    useEffect(() => {
        const adminDataString = localStorage.getItem('admin');
        const token = localStorage.getItem('token');
        if (!adminDataString || !token) {
            navigate('/admin-secret-login');
            return;
        }
        
        const adminData = JSON.parse(adminDataString);
        setRole(adminData.role);
        
        if (adminData.role === 'paymentAdmin') {
            setActiveTab('payouts');
        } else {
            setActiveTab('overview');
        }

        const fetchData = async () => {
            try {
                const statsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/dashboard-stats`);
                setStats(statsRes.data);

                const clubsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/clubs-list`);
                setClubHeads(clubsRes.data);

                const coordsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/coordinators`);
                setCoordinators(coordsRes.data);

                fetchFilteredEventData();
                setLoading(false);
            } catch (err) {
                showNotification('Failed to fetch admin data', 'error');
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate, showNotification]);

    const fetchFilteredEventData = async () => {
        try {
            const query = new URLSearchParams(filters).toString();
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/event-data-export?${query}`);
            setEventData(res.data.events || []);
        } catch (err) {
            console.error('Failed to fetch filtered event data');
        }
    };

    useEffect(() => {
        if (!loading) fetchFilteredEventData();
    }, [filters]);

    const refreshStats = async () => {
        try {
            const statsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/dashboard-stats`);
            setStats(statsRes.data);
        } catch (err) {
            console.error('Failed to refresh stats');
        }
    };

    const handleFetchPayoutInfo = async (clubHeadId, eventId) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/user-info/${clubHeadId}`);
            setSelectedClub(res.data);
            setSelectedEventId(eventId);
            setModalOpen(true);
        } catch (err) {
            showNotification('Error fetching payout info', 'error');
        }
    };

    const handleConfirmPayout = async () => {
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/complete-payout/${selectedEventId}`);
            if (res.data.success) {
                showNotification('Payout marked as complete!', 'success');
                setModalOpen(false);
                refreshStats(); // Refresh table state
            }
        } catch (err) {
            showNotification('Failed to update payout status', 'error');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('token');
        navigate('/admin-secret-login');
    };

    const handleDownloadCSV = () => {
        if (!eventData.length) return;
        const headers = ['Event Name', 'Organising Club', 'Total Registrations', 'Event Type', 'Event Date', 'Total Amount Received (₹)'];
        const rows = eventData.map(e => [
            `"${e.eventName}"`,
            `"${e.clubName}"`,
            e.totalRegistrations,
            e.eventType,
            new Date(e.eventDate).toLocaleDateString(),
            e.totalAmountReceived,
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `event_data_${new Date().toISOString().slice(0,10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleCreateClub = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/clubs`, data);
            showNotification('Club and users created successfully', 'success');
            e.target.reset();
            // Refresh list
            const clubsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/clubs-list`);
            setClubHeads(clubsRes.data);
            refreshStats();
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to create club', 'error');
        }
    };

    const handleUpdateClub = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/clubs/${editingClub._id}`, data);
            showNotification('Club updated successfully', 'success');
            setIsEditModalOpen(false);
            setEditingClub(null);
            const clubsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/clubs-list`);
            setClubHeads(clubsRes.data);
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to update club', 'error');
        }
    };

    const handleCreateCoord = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/coordinators`, data);
            showNotification('Coordinator created successfully', 'success');
            e.target.reset();
            const coordsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/coordinators`);
            setCoordinators(coordsRes.data);
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to create coordinator', 'error');
        }
    };

    const handleUpdateCoord = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/coordinators/${editingCoord._id}`, data);
            showNotification('Coordinator updated successfully', 'success');
            setIsCoordModalOpen(false);
            setEditingCoord(null);
            const coordsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/coordinators`);
            setCoordinators(coordsRes.data);
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to update coordinator', 'error');
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="w-12 h-12 border-4 border-black border-t-orange-600 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-neutral-50 p-6 lg:p-12">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-black tracking-tight ">Admin Panel</h1>
                        <p className="text-neutral-500 text-sm mt-1  tracking-widest font-medium">Manage Platform Payouts & Revenue</p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="px-6 py-2 border-2 border-black text-white font-medium text-xs  tracking-widest rounded-sm bg-red-500 hover:bg-red-300 hover:text-black transition-colors"
                    >
                        Secure Logout
                    </button>
                </div>

                {/* Stats Cards */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      <div className="bg-white border-2 border-gray-300 p-4 rounded-sm ">
                          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Total Students</p>
                          <p className="text-2xl font-black text-black">{stats?.totalStudents || 0}</p>
                      </div>
                      <div className="bg-white border-2 border-gray-300 p-4 rounded-sm ">
                          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Active Events</p>
                          <p className="text-2xl font-black text-black">{stats?.totalEvents || 0}</p>
                      </div>
                      <div className="bg-white border-2 border-gray-300 p-4 rounded-sm ">
                          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Total Clubs</p>
                          <p className="text-2xl font-black text-black">{stats?.totalClubs || 0}</p>
                      </div>
                      <div className="bg-white border-2 border-gray-300 p-4 rounded-sm ">
                          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Events (Till Today)</p>
                          <p className="text-2xl font-black text-black">{stats?.totalEventsTillNow || 0}</p>
                      </div>
                 </div>

                 {role === 'admin' && (
                     <div className="flex justify-end mb-6">
                        <button 
                            onClick={() => setShowYearWise(!showYearWise)}
                            className="text-[10px] font-black uppercase tracking-widest px-4 py-2 border-2 border-black rounded-sm hover:bg-neutral-100 transition-colors cursor-pointer"
                        >
                            {showYearWise ? 'Hide Yearly Stats' : 'Show Year-wise Total Events'}
                        </button>
                     </div>
                 )}

                 {showYearWise && stats?.yearWiseEvents && (
                     <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                         {stats.yearWiseEvents.map(y => (
                             <div key={y._id} className="bg-neutral-100 border-2 border-black p-3 rounded-sm text-center">
                                 <p className="text-[10px] font-bold text-neutral-500 uppercase">{y._id}</p>
                                 <p className="text-lg font-black">{y.count} Events</p>
                             </div>
                         ))}
                     </div>
                 )}

                {/* Navigation Tabs */}
                <div className="flex gap-4 border-b-2 border-neutral-200 mb-8 overflow-x-auto no-scrollbar">
                    {role === 'admin' && (
                        <button 
                            onClick={() => setActiveTab('overview')}
                            className={`pb-2 px-1 text-sm font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'border-b-4 border-orange-600 text-orange-600' : 'text-neutral-400 hover:text-black'}`}
                        >
                            Overview
                        </button>
                    )}
                    {(role === 'admin' || role === 'paymentAdmin') && (
                        <button 
                            onClick={() => setActiveTab('payouts')}
                            className={`pb-2 px-1 text-sm font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'payouts' ? 'border-b-4 border-orange-600 text-orange-600' : 'text-neutral-400 hover:text-black'}`}
                        >
                            Payouts
                        </button>
                    )}
                    {role === 'admin' && (
                        <>
                            <button 
                                onClick={() => setActiveTab('club-heads')}
                                className={`pb-2 px-1 text-sm font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'club-heads' ? 'border-b-4 border-orange-600 text-orange-600' : 'text-neutral-400 hover:text-black'}`}
                            >
                                Manage Clubs
                            </button>
                            <button 
                                onClick={() => setActiveTab('coordinators')}
                                className={`pb-2 px-1 text-sm font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'coordinators' ? 'border-b-4 border-orange-600 text-orange-600' : 'text-neutral-400 hover:text-black'}`}
                            >
                                Faculty Coordinators
                            </button>
                            <button 
                                onClick={() => setActiveTab('event-data')}
                                className={`pb-2 px-1 text-sm font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'event-data' ? 'border-b-4 border-orange-600 text-orange-600' : 'text-neutral-400 hover:text-black'}`}
                            >
                                Event Data
                            </button>
                        </>
                    )}
                </div>

                {/* ── OVERVIEW TAB ── All events general info */}
                {activeTab === 'overview' && (
                    <div className="bg-white border-2 border-gray-300 rounded-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-neutral-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-black border-r border-gray-200">#</th>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-black border-r border-gray-200">Event Title</th>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-black border-r border-gray-200">Club</th>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-black border-r border-gray-200">Registrations</th>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-black border-r border-gray-200">Event Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-black border-r border-gray-200">Type</th>
                                        <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-black">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {stats?.eventStats?.slice().sort((a, b) => new Date(b.startTime) - new Date(a.startTime)).map((item, idx) => (
                                        <tr key={idx} className="hover:bg-neutral-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-400 font-bold border-r border-gray-200">{idx + 1}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold border-r border-gray-200">{item.title}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-orange-600 border-r border-gray-200">{item.clubName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold border-r border-gray-200">{item.registeredCount || item.regCount} students</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-[11px] font-bold text-neutral-500 border-r border-gray-200 uppercase tracking-wide">
                                                {new Date(item.startTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                                                <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm border ${
                                                    item.entryFee > 0
                                                        ? 'bg-orange-50 text-orange-700 border-orange-300'
                                                        : 'bg-green-50 text-green-700 border-green-300'
                                                }`}>
                                                    {item.entryFee > 0 ? `Paid (₹${item.entryFee})` : 'Free'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-lg font-black font-mono">
                                                {item.totalCollected > 0 
                                                    ? <span className="text-orange-600">₹{item.totalCollected}</span>
                                                    : <span className="text-neutral-300">—</span>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                    {(!stats?.eventStats || stats.eventStats.length === 0) && (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-12 text-center text-neutral-500 text-sm">No events found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── PAYOUTS TAB ── Only paid events with payout actions */}
                {activeTab === 'payouts' && (
                    <div className="bg-white border-2 border-gray-300 rounded-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-neutral-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-black border-r border-gray-200">Club Name</th>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-black border-r border-gray-200">Event Title</th>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-black border-r border-gray-200">Amount</th>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-black border-r border-gray-200">Registrations</th>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-black border-r border-gray-200">Deadline</th>
                                        <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-black">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {stats?.eventStats?.filter(item => item.entryFee > 0).map((item, idx) => (
                                        <tr key={idx} className="hover:bg-neutral-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold border-r border-gray-200">{item.clubName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold border-r border-gray-200">{item.title}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-lg font-black text-orange-600 border-r border-gray-200">₹{item.totalCollected}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold border-r border-gray-200">{item.regCount} students</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-[11px] font-bold text-neutral-500 border-r border-gray-200 uppercase tracking-tighter">
                                                {item.registrationDeadline 
                                                    ? new Date(item.registrationDeadline).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
                                                    : new Date(item.startTime).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
                                                }
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {(() => {
                                                    const deadline = item.registrationDeadline || item.startTime;
                                                    const isLocked = new Date() < new Date(deadline);

                                                    if (item.payoutStatus === 'COMPLETED') {
                                                        return (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-sm border-2 border-green-600">
                                                                <i className="ri-checkbox-circle-fill text-sm" />
                                                                Completed
                                                            </span>
                                                        );
                                                    }

                                                    if (isLocked) {
                                                        return (
                                                            <div className="flex flex-col items-end">
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 text-neutral-400 text-[10px] font-black uppercase tracking-widest rounded-sm border-2 border-neutral-200 cursor-not-allowed">
                                                                    <i className="ri-lock-2-line text-sm" />
                                                                    Locked
                                                                </span>
                                                                <span className="text-[9px] font-bold text-neutral-400 mt-1 uppercase">Available after deadline</span>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <button 
                                                            onClick={() => handleFetchPayoutInfo(item.clubHeadId, item.eventId)}
                                                            className="px-4 py-2 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-orange-600 transition-colors border-2 border-black active:translate-y-1"
                                                        >
                                                            Make Payout
                                                        </button>
                                                    );
                                                })()}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!stats?.eventStats || stats.eventStats.filter(item => item.entryFee > 0).length === 0) && (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-neutral-500 text-sm">No paid events found for payout.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'club-heads' && (
                    <div className="space-y-8">
                        {/* Add New Club Form */}
                        <div className="bg-white border-2 border-gray-300 p-6 rounded-sm ">
                            <h3 className="text-xl font-medium  tracking-wide mb-4">Add New Club</h3>
                            <form onSubmit={handleCreateClub} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <input name="clubName" placeholder="Club Name" required className="p-2 border-2 border-gray-300 rounded-sm focus:border-black outline-none" />
                                <input name="facultyName" placeholder="Faculty Coordinator" required className="p-2 border-2 border-gray-300 rounded-sm focus:border-black outline-none" />
                                <input name="facultyEmail" type="email" placeholder="Faculty Email" required className="p-2 border-2 border-gray-300 rounded-sm focus:border-black outline-none" />
                                <input name="clubEmail" type="email" placeholder="Official Club Email" required className="p-2 border-2 border-gray-300 rounded-sm focus:border-black outline-none" />
                                <button type="submit" className="lg:col-span-4 bg-black text-white py-3 font-black uppercase tracking-widest hover:bg-orange-600 transition-colors">Create Club & Seeding Users</button>
                            </form>
                        </div>

                        {/* Clubs List Table */}
                        <div className="bg-white border-2 border-gray-400 rounded-sm  overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y-2 divide-black">
                                    <thead className="bg-neutral-100">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-black border-r-2 border-gray-400">Club Name</th>
                                            <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-black border-r-2 border-gray-400">Faculty</th>
                                            <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-black border-r-2 border-gray-400">Club Email</th>
                                            <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-black">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y-2 divide-black">
                                        {clubHeads.map((club, idx) => (
                                            <tr key={idx} className="hover:bg-neutral-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold border-r-2 border-gray-400">{club.clubName}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold border-r-2 border-gray-400 text-orange-600">
                                                    {club.facultyName || club.facultyCoordinator?.name || "N/A"}<br/>
                                                    <span className="text-[10px] text-neutral-400">{club.facultyEmail || club.facultyCoordinator?.email}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium border-r-2 border-gray-400">
                                                    {club.clubEmail || (club.memberships && club.memberships[0]?.student?.email) || "N/A"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <button 
                                                        onClick={() => { setEditingClub(club); setIsEditModalOpen(true); }}
                                                        className="px-3 py-1 bg-white border-2 border-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all rounded-sm"
                                                    >
                                                        Edit
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {clubHeads.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-12 text-center text-neutral-500 text-sm">No clubs registered yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── COORDINATORS TAB ── */}
                {activeTab === 'coordinators' && (
                    <div className="space-y-8">
                        {/* Add New Coordinator Form */}
                        <div className="bg-white border-2 border-gray-300 p-6 rounded-sm">
                            <h3 className="text-xl font-medium tracking-wide mb-4">Add Faculty Coordinator</h3>
                            <form onSubmit={handleCreateCoord} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <input name="name" placeholder="Full Name" required className="p-2 border-2 border-gray-300 rounded-sm focus:border-black outline-none" />
                                <input name="email" type="email" placeholder="Email Address" required className="p-2 border-2 border-gray-300 rounded-sm focus:border-black outline-none" />
                                <input name="password" type="password" placeholder="Password (default: coordinator123)" className="p-2 border-2 border-gray-300 rounded-sm focus:border-black outline-none" />
                                <button type="submit" className="bg-black text-white py-2 font-black uppercase tracking-widest hover:bg-orange-600 transition-colors">Create Coordinator</button>
                            </form>
                        </div>

                        {/* Coordinators List Table */}
                        <div className="bg-white border-2 border-gray-400 rounded-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y-2 divide-black">
                                    <thead className="bg-neutral-100">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-black border-r-2 border-gray-400">Name</th>
                                            <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-black border-r-2 border-gray-400">Email</th>
                                            <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-black">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y-2 divide-black">
                                        {coordinators.map((coord, idx) => (
                                            <tr key={coord._id || idx} className="hover:bg-neutral-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold border-r-2 border-gray-400">{coord.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium border-r-2 border-gray-400">{coord.email}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <button 
                                                        onClick={() => { setEditingCoord(coord); setIsCoordModalOpen(true); }}
                                                        className="px-3 py-1 bg-white border-2 border-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all rounded-sm"
                                                    >
                                                        Edit
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {coordinators.length === 0 && (
                                            <tr>
                                                <td colSpan="3" className="px-6 py-12 text-center text-neutral-500 text-sm">No coordinators found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'event-data' && (
                    <div>
                        {/* Filter UI */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <select 
                                value={filters.clubId}
                                onChange={(e) => setFilters({ ...filters, clubId: e.target.value })}
                                className="p-2 border-2 border-gray-300 rounded-sm text-xs font-bold uppercase"
                            >
                                <option value="all">All Clubs</option>
                                {clubHeads.map(c => <option key={c._id} value={c._id}>{c.clubName}</option>)}
                            </select>
                            <select 
                                value={filters.month}
                                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                                className="p-2 border-2 border-gray-300 rounded-sm text-xs font-bold uppercase"
                            >
                                <option value="all">All Months</option>
                                {[...Array(12)].map((_, i) => (
                                    <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
                                ))}
                            </select>
                            <select 
                                value={filters.year}
                                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                                className="p-2 border-2 border-gray-300 rounded-sm text-xs font-bold uppercase"
                            >
                                <option value="all">All Years</option>
                                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>

                        <div className="flex justify-between items-center mb-4">
                            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                                {eventData.length} event{eventData.length !== 1 ? 's' : ''} found
                            </p>
                            <button
                                onClick={handleDownloadCSV}
                                disabled={!eventData.length}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest rounded-sm border-2 border-gray-400 active:translate-x-1 active:translate-y-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 hover:cursor-pointer"
                            >
                                <i className="ri-download-2-line text-sm" />
                                Download CSV
                            </button>
                        </div>
                        <div className="bg-white border-2 border-gray-400 rounded-sm  overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y-2 divide-gray-300">
                                    <thead className="bg-neutral-100">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-black border-r border-gray-400">Event Name</th>
                                            <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-black border-r border-gray-300">Organising Club</th>
                                            <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-black border-r border-gray-300">Registrations</th>
                                            <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-black border-r border-gray-300">Event Date</th>
                                            {role === 'admin' && <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-black border-r border-gray-300">Type</th>}
                                            <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-black">Amount Received</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y-2 divide-gray-300">
                                        {eventData.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-neutral-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold border-r border-gray-300">{item.eventName}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-orange-600 border-r border-gray-300">{item.clubName}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold border-r border-gray-300">{item.totalRegistrations}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-[11px] font-bold text-neutral-500 border-r border-gray-300 uppercase tracking-wide">
                                                    {new Date(item.eventDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                                </td>
                                                {role === 'admin' && (
                                                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-300">
                                                        <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm border-2 ${
                                                            item.eventType === 'Paid'
                                                                ? 'bg-orange-50 text-orange-700 border-orange-300'
                                                                : 'bg-green-50 text-green-700 border-green-300'
                                                        }`}>
                                                            {item.eventType}
                                                        </span>
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-lg font-black font-mono">
                                                    {item.totalAmountReceived > 0 
                                                        ? <span className="text-orange-600">₹{item.totalAmountReceived}</span> 
                                                        : <span className="text-neutral-300">—</span>
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                        {eventData.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center text-neutral-500 text-sm">No events found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payout Modal */}
                {modalOpen && selectedClub && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                        <div className="bg-white border-2 border-black rounded-sm max-w-lg w-full shadow-[12px_12px_0px_#000]">
                            <div className="bg-black text-white p-6 border-b-2 border-black flex justify-between items-center">
                                <div>
                                    <h3 className="font-black text-xl uppercase tracking-tight">Settlement Info</h3>
                                    <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mt-1">{selectedClub.clubName}</p>
                                </div>
                                <button onClick={() => setModalOpen(false)} className="text-white hover:text-orange-400 text-2xl"><i className="ri-close-line" /></button>
                            </div>
                            
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Account Holder</label>
                                        <p className="font-bold text-black border-b border-neutral-100 pb-1">{selectedClub.bankInfo.accountHolderName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Bank Name</label>
                                        <p className="font-bold text-black border-b border-neutral-100 pb-1">{selectedClub.bankInfo.bankName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">A/C Number</label>
                                        <p className="font-bold text-black border-b border-neutral-100 pb-1 font-mono">{selectedClub.bankInfo.accountNumber || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">IFSC Code</label>
                                        <p className="font-bold text-black border-b border-neutral-100 pb-1 font-mono uppercase">{selectedClub.bankInfo.ifscCode || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">UPI ID</label>
                                        <p className="font-bold text-orange-600 border-b border-neutral-100 pb-1">{selectedClub.bankInfo.upiId || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Phone</label>
                                        <p className="font-bold text-black border-b border-neutral-100 pb-1">{selectedClub.bankInfo.bankPhone || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="bg-neutral-100 p-4 border border-neutral-200 rounded-sm">
                                    <p className="text-[11px] text-neutral-600 leading-relaxed font-semibold">
                                        <i className="ri-hand-coin-line mr-2 text-black" />
                                        Please execute the transaction manually via your business banking portal and mark as complete.
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 pt-0 flex gap-4">
                                <button 
                                    className="flex-1 py-4 bg-orange-600 text-white font-black uppercase tracking-widest border-2 border-black rounded-sm hover:shadow-[4px_4px_0px_#000] active:translate-x-1 active:translate-y-1 transition-all"
                                    onClick={handleConfirmPayout}
                                >
                                    Confirm Payout
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Edit Club Modal */}
                {isEditModalOpen && editingClub && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                        <div className="bg-white border-2 border-black rounded-sm max-w-lg w-full shadow-[12px_12px_0px_#000]">
                            <div className="bg-black text-white p-6 border-b-2 border-black flex justify-between items-center">
                                <h3 className="font-black text-xl uppercase tracking-tight">Edit Club</h3>
                                <button onClick={() => setIsEditModalOpen(false)} className="text-white hover:text-orange-400 text-2xl"><i className="ri-close-line" /></button>
                            </div>
                            <form onSubmit={handleUpdateClub} className="p-8 space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Club Name</label>
                                    <input name="clubName" defaultValue={editingClub.clubName} required className="w-full p-2 border-2 border-gray-300 rounded-sm focus:border-black outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Official Club Email</label>
                                    <input name="clubEmail" type="email" defaultValue={editingClub.clubEmail} required className="w-full p-2 border-2 border-gray-300 rounded-sm focus:border-black outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Faculty Name (Legacy Display)</label>
                                    <input name="facultyName" defaultValue={editingClub.facultyName} className="w-full p-2 border-2 border-gray-300 rounded-sm focus:border-black outline-none" placeholder="Displayed on public page if no coordinator assigned" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Faculty Email (Legacy Display)</label>
                                    <input name="facultyEmail" defaultValue={editingClub.facultyEmail} className="w-full p-2 border-2 border-gray-300 rounded-sm focus:border-black outline-none" placeholder="Legacy faculty email" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Assign Faculty Coordinator</label>
                                    <select name="facultyCoordinatorId" defaultValue={(editingClub.facultyCoordinators && editingClub.facultyCoordinators[0]?.id) || editingClub.facultyCoordinatorId} className="w-full p-2 border-2 border-gray-300 rounded-sm focus:border-black outline-none">
                                        <option value="">None</option>
                                        {coordinators.map(c => <option key={c._id} value={c._id}>{c.name} ({c.email})</option>)}
                                    </select>
                                </div>
                                <div className="pt-4 flex gap-4">
                                    <button onClick={() => setIsEditModalOpen(false)} type="button" className="flex-1 py-3 border-2 border-black font-black uppercase tracking-widest hover:bg-neutral-100 transition-colors">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 bg-black text-white font-black uppercase tracking-widest hover:bg-orange-600 transition-colors">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Coordinator Modal */}
                {isCoordModalOpen && editingCoord && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                        <div className="bg-white border-2 border-black rounded-sm max-w-lg w-full shadow-[12px_12px_0px_#000]">
                            <div className="bg-black text-white p-6 border-b-2 border-black flex justify-between items-center">
                                <h3 className="font-black text-xl uppercase tracking-tight">Edit Coordinator</h3>
                                <button onClick={() => setIsCoordModalOpen(false)} className="text-white hover:text-orange-400 text-2xl"><i className="ri-close-line" /></button>
                            </div>
                            <form onSubmit={handleUpdateCoord} className="p-8 space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Full Name</label>
                                    <input name="name" defaultValue={editingCoord.name} required className="w-full p-2 border-2 border-gray-300 rounded-sm focus:border-black outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Email Address</label>
                                    <input name="email" type="email" defaultValue={editingCoord.email} required className="w-full p-2 border-2 border-gray-300 rounded-sm focus:border-black outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">New Password (leave blank to keep current)</label>
                                    <input name="password" type="password" className="w-full p-2 border-2 border-gray-300 rounded-sm focus:border-black outline-none" />
                                </div>
                                <div className="pt-4 flex gap-4">
                                    <button onClick={() => setIsCoordModalOpen(false)} type="button" className="flex-1 py-3 border-2 border-black font-black uppercase tracking-widest hover:bg-neutral-100 transition-colors">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 bg-black text-white font-black uppercase tracking-widest hover:bg-orange-600 transition-colors">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
