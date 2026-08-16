import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { cachedFetch, invalidateCache } from '../lib/cacheManager';
import ExportCenter from './ExportCenter';
import EventCalendarPage from './EventCalendarPage';

import { 
    Search, 
    Filter, 
    ExternalLink, 
    Radio, 
    Bell, 
    Send, 
    CheckCheck, 
    Plus, 
    X, 
    Calendar, 
    Sparkles,
    MoreVertical,
    Edit2,
    Trash2,
    Building2,
    CheckCircle2,
    Key,
    Shield,
    GraduationCap,
    Mail,
    Users
} from 'lucide-react';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [clubHeads, setClubHeads] = useState([]);
    const [eventData, setEventData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [role, setRole] = useState(null);
    const [filters, setFilters] = useState({ month: 'all', year: 'all', clubId: 'all' });
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [showYearWise, setShowYearWise] = useState(false);
    const [selectedClub, setSelectedClub] = useState(null);
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [coordinators, setCoordinators] = useState([]);
    const [isCreateClubModalOpen, setIsCreateClubModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingClub, setEditingClub] = useState(null);
    const [isCoordModalOpen, setIsCoordModalOpen] = useState(false);
    const [isAddCoordModalOpen, setIsAddCoordModalOpen] = useState(false);
    const [editingCoord, setEditingCoord] = useState(null);
    const [createdClubCredentials, setCreatedClubCredentials] = useState(null);

    // Payments Management States
    const [manualPayments, setManualPayments] = useState([]);
    const [manualPaymentsSummary, setManualPaymentsSummary] = useState(null);
    const [paymentsSearch, setPaymentsSearch] = useState('');

    // Venue Management States
    const [venues, setVenues] = useState([]);
    const [venuesLoading, setVenuesLoading] = useState(false);
    const [venueSearch, setVenueSearch] = useState('');
    const [venueStatusFilter, setVenueStatusFilter] = useState('all');
    const [newVenueName, setNewVenueName] = useState('');
    const [newVenueIsOpen, setNewVenueIsOpen] = useState(true);
    const [isCreatingVenue, setIsCreatingVenue] = useState(false);
    const [isAddVenueModalOpen, setIsAddVenueModalOpen] = useState(false);
    const [editingVenue, setEditingVenue] = useState(null);
    const [isEditVenueModalOpen, setIsEditVenueModalOpen] = useState(false);
    const [openMenuVenueId, setOpenMenuVenueId] = useState(null);
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get('tab');

    // Communication States
    const [broadcasts, setBroadcasts] = useState([]);
    const [adminNotifications, setAdminNotifications] = useState([]);
    const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
    const [sendingBroadcast, setSendingBroadcast] = useState(false);
    const [broadcastForm, setBroadcastForm] = useState({
        targetType: 'ALL_STUDENTS',
        eventId: '',
        title: '',
        message: ''
    });
    const [loadingBroadcasts, setLoadingBroadcasts] = useState(false);
    const [loadingNotifications, setLoadingNotifications] = useState(false);

    // Profile Management States
    const [profileName, setProfileName] = useState('');
    const [profileEmail, setProfileEmail] = useState('');
    const [profile2FA, setProfile2FA] = useState(false);
    const [profilePasswordForm, setProfilePasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Sync tab param with activeTab state
    useEffect(() => {
        if (tabParam) {
            setActiveTab(tabParam);
        } else if (role) {
            if (role === 'paymentAdmin') {
                setActiveTab('payouts');
            } else {
                setActiveTab('overview');
            }
        }
    }, [tabParam, role]);

    useEffect(() => {
        const adminDataString = localStorage.getItem('admin');
        if (!adminDataString) {
            navigate('/admin-secret-login');
            return;
        }
        
        const adminData = JSON.parse(adminDataString);
        setRole(adminData.role);
        setProfileName(adminData.name || '');
        setProfileEmail(adminData.email || '');
        setProfile2FA(adminData.isTwoStepEnabled || false);

        if (adminData.role === 'lostFoundAdmin') {
            navigate('/admin/lost-found');
            return;
        }
        if (adminData.role === 'facultyCoordinator') {
            navigate('/');
            return;
        }

        const fetchData = async () => {
            try {
                const statsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/dashboard-stats`);
                setStats(statsRes.data);

                const clubsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/clubs-list`);
                setClubHeads(clubsRes.data);

                const coordsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/coordinators`);
                setCoordinators(coordsRes.data);

                await fetchManualPayments();

                fetchFilteredEventData();
                setLoading(false);
            } catch (err) {
                showNotification('Failed to fetch admin data', 'error');
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate, showNotification]);

    // Central Organizer Management States
    const [centralOrganizer, setCentralOrganizer] = useState(null);
    const [loadingCO, setLoadingCO] = useState(false);
    const [studentQuery, setStudentQuery] = useState('');
    const [studentSearchResults, setStudentSearchResults] = useState([]);
    const [searchingStudents, setSearchingStudents] = useState(false);
    const [assigningCO, setAssigningCO] = useState(false);

    // Fetch Broadcasts, Notifications & Venues when activeTab changes
    useEffect(() => {
        if (activeTab === 'broadcasts') fetchBroadcasts();
        if (activeTab === 'notifications') fetchAdminNotifications();
        if (activeTab === 'venues') fetchVenues();
        if (activeTab === 'central-organizer') fetchCentralOrganizer();
    }, [activeTab]);

    const fetchCentralOrganizer = async () => {
        setLoadingCO(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/central-organizer`);
            setCentralOrganizer(res.data.centralOrganizer || null);
        } catch (err) {
            console.error('Failed to fetch central organizer:', err);
        } finally {
            setLoadingCO(false);
        }
    };

    const handleSearchStudents = async (q) => {
        setStudentQuery(q);
        if (!q || q.trim().length < 2) {
            setStudentSearchResults([]);
            return;
        }
        setSearchingStudents(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/students/search?q=${encodeURIComponent(q.trim())}`);
            setStudentSearchResults(res.data.students || []);
        } catch (err) {
            console.error('Student search failed:', err);
        } finally {
            setSearchingStudents(false);
        }
    };

    const handleAssignCO = async (studentId) => {
        if (!window.confirm('Assign this student as the campus Central Organizer? Exactly one student can hold this role.')) {
            return;
        }
        setAssigningCO(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/central-organizer`, { studentId });
            showNotification(res.data.message || 'Central Organizer assigned successfully!', 'success');
            setStudentQuery('');
            setStudentSearchResults([]);
            fetchCentralOrganizer();
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to assign Central Organizer', 'error');
        } finally {
            setAssigningCO(false);
        }
    };

    const handleRevokeCO = async (studentId, studentName) => {
        if (!window.confirm(`Revoke Central Organizer role from ${studentName}?`)) {
            return;
        }
        try {
            const res = await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/central-organizer/${studentId}`);
            showNotification(res.data.message || 'Central Organizer role revoked', 'success');
            fetchCentralOrganizer();
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to revoke Central Organizer', 'error');
        }
    };

    const fetchBroadcasts = async () => {
        setLoadingBroadcasts(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/notifications/sent`);
            setBroadcasts(res.data || []);
        } catch (err) {
            console.error('Failed to fetch sent broadcasts:', err);
        } finally {
            setLoadingBroadcasts(false);
        }
    };

    const fetchAdminNotifications = async () => {
        setLoadingNotifications(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/notifications`);
            setAdminNotifications(res.data || []);
        } catch (err) {
            console.error('Failed to fetch admin notifications:', err);
        } finally {
            setLoadingNotifications(false);
        }
    };

    const handleSendBroadcast = async (e) => {
        e.preventDefault();
        if (!broadcastForm.title || !broadcastForm.message) {
            showNotification('Please fill in title and message', 'error');
            return;
        }
        if (broadcastForm.targetType === 'REGISTERED_STUDENTS' && !broadcastForm.eventId) {
            showNotification('Please select an event for participant broadcast', 'error');
            return;
        }
        setSendingBroadcast(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/notifications`, {
                targetType: broadcastForm.targetType,
                eventId: broadcastForm.targetType === 'REGISTERED_STUDENTS' ? broadcastForm.eventId : undefined,
                title: broadcastForm.title,
                message: broadcastForm.message
            });
            showNotification('Broadcast message sent successfully!', 'success');
            setBroadcastModalOpen(false);
            setBroadcastForm({ targetType: 'ALL_STUDENTS', eventId: '', title: '', message: '' });
            fetchBroadcasts();
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to send broadcast', 'error');
        } finally {
            setSendingBroadcast(false);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/notifications/read-all`);
            showNotification('All notifications marked as read', 'success');
            fetchAdminNotifications();
        } catch (err) {
            showNotification('Failed to mark notifications as read', 'error');
        }
    };

    const fetchManualPayments = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/manual-payments`);
            setManualPayments(res.data.participations || []);
            setManualPaymentsSummary(res.data.summary || null);
        } catch (err) {
            console.error('Failed to fetch manual payments overview:', err);
        }
    };

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
            await fetchManualPayments();
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
                refreshStats();
            }
        } catch (err) {
            showNotification('Failed to update payout status', 'error');
        }
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
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/clubs`, data);
            showNotification('Club and users created successfully!', 'success');
            e.target.reset();
            setIsCreateClubModalOpen(false);
            const slug = res.data?.club?.slug || data.clubName.toLowerCase().replace(/[^a-z0-9]/g, '');
            setCreatedClubCredentials({
                clubName: data.clubName,
                slug,
                clubEmail: data.clubEmail,
                facultyEmail: data.facultyEmail,
                facultyName: data.facultyName,
                defaultPassword: `${slug}@him0148`,
            });
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
            setIsAddCoordModalOpen(false);
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

    // ── Venue Management Handlers ────────────────────────────────────────────────
    const fetchVenues = async () => {
        setVenuesLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/venues`);
            setVenues(res.data || []);
        } catch (err) {
            showNotification('Failed to fetch venues', 'error');
        } finally {
            setVenuesLoading(false);
        }
    };

    const handleCreateVenue = async (e) => {
        e.preventDefault();
        if (!newVenueName.trim()) {
            showNotification('Please enter a venue name', 'warning');
            return;
        }
        setIsCreatingVenue(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/venues`, {
                name: newVenueName.trim(),
                isOpen: newVenueIsOpen,
            });
            showNotification(`Venue "${res.data.name}" created successfully`, 'success');
            setNewVenueName('');
            setNewVenueIsOpen(true);
            setIsAddVenueModalOpen(false);
            fetchVenues();
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to create venue', 'error');
        } finally {
            setIsCreatingVenue(false);
        }
    };

    const handleToggleVenueStatus = async (venue) => {
        try {
            const res = await axios.patch(`${import.meta.env.VITE_API_URL}/api/venues/${venue.id}/toggle-status`);
            const statusStr = res.data.isOpen ? 'Open for Event' : 'Closed / Unavailable';
            showNotification(`Venue "${venue.name}" is now ${statusStr}`, 'success');
            setVenues(prev => prev.map(v => v.id === venue.id ? res.data : v));
        } catch (err) {
            showNotification('Failed to update venue status', 'error');
        }
    };

    const handleUpdateVenue = async (e) => {
        e.preventDefault();
        if (!editingVenue || !editingVenue.name.trim()) return;
        try {
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/venues/${editingVenue.id}`, {
                name: editingVenue.name.trim(),
                isOpen: editingVenue.isOpen,
            });
            showNotification(`Venue "${res.data.name}" updated successfully`, 'success');
            setIsEditVenueModalOpen(false);
            setEditingVenue(null);
            fetchVenues();
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to update venue', 'error');
        }
    };

    const handleDeleteVenue = async (venue) => {
        if (!window.confirm(`Are you sure you want to delete venue "${venue.name}"?`)) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/venues/${venue.id}`);
            showNotification(`Venue "${venue.name}" deleted successfully`, 'success');
            setVenues(prev => prev.filter(v => v.id !== venue.id));
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to delete venue', 'error');
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsSavingProfile(true);
        try {
            const adminDataString = localStorage.getItem('admin');
            const adminData = JSON.parse(adminDataString);
            
            const updateRes = await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${adminData.role}/${adminData.id || adminData._id}`, {
                name: profileName,
                isTwoStepEnabled: profile2FA
            });
            
            const updatedAdmin = {
                ...adminData,
                name: updateRes.data.user.name,
                isTwoStepEnabled: updateRes.data.user.isTwoStepEnabled
            };
            localStorage.setItem('admin', JSON.stringify(updatedAdmin));
            localStorage.setItem('user', JSON.stringify(updatedAdmin));
            
            showNotification('Profile updated successfully', 'success');
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to update profile', 'error');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (profilePasswordForm.newPassword !== profilePasswordForm.confirmPassword) {
            showNotification('New passwords do not match', 'error');
            return;
        }
        if (profilePasswordForm.newPassword.length < 6) {
            showNotification('Password must be at least 6 characters long', 'error');
            return;
        }
        setIsSavingProfile(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/change-password`, {
                currentPassword: profilePasswordForm.currentPassword,
                newPassword: profilePasswordForm.newPassword
            });
            showNotification('Password changed successfully', 'success');
            setProfilePasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to change password', 'error');
        } finally {
            setIsSavingProfile(false);
        }
    };

    /* ─── Filtered Event List for Event Data Table ───────────────────────────── */
    const filteredEventList = (eventData.length > 0 ? eventData : stats?.eventStats || []).filter(e => {
        const title = e.eventName || e.title || '';
        const club = e.clubName || '';
        const matchesSearch = !searchQuery || 
            title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            club.toLowerCase().includes(searchQuery.toLowerCase());
        
        const isPaid = (e.entryFee > 0) || (e.eventType === 'Paid');
        const matchesType = typeFilter === 'all' || 
            (typeFilter === 'paid' && isPaid) || 
            (typeFilter === 'free' && !isPaid);

        return matchesSearch && matchesType;
    });

    /* ─── Tab Titles Mapping (Strictly Existing Features) ────────────────────── */
    const tabTitles = {
        overview: { title: 'Overview', subtitle: 'All events and system metrics at a glance' },
        'event-data': { title: 'All Events', subtitle: 'View, filter, and access all event details and direct page links' },
        calendar: { title: 'Event Calendar & Venue Scheduling', subtitle: 'Interactive month, week, day, and venue timeline scheduling grid' },
        'calendar-schedule': { title: 'Event Calendar & Venue Scheduling', subtitle: 'Interactive month, week, day, and venue timeline scheduling grid' },
        venues: { title: 'Venues Management', subtitle: 'Manage campus event venues and configure their event booking availability' },
        'central-organizer': { title: 'Central Organizer Management', subtitle: 'Assign, view, or revoke the college-wide Central Organizer student account' },

        'club-heads': { title: 'Clubs Management', subtitle: 'Create, edit, and configure registered student clubs' },
        coordinators: { title: 'Coordinators Management', subtitle: 'Manage faculty coordinator accounts' },
        'payments-overview': { title: 'Transactions Management', subtitle: 'Overview of manual transaction registrations and UTR verifications' },
        payouts: { title: 'Financial Payouts', subtitle: 'Manage revenue settlements and payouts for club heads' },
        broadcasts: { title: 'Broadcast Communication', subtitle: 'Send platform-wide or event-specific announcement broadcasts' },
        notifications: { title: 'Notifications & Alerts', subtitle: 'View notification logs sent by your admin account' },
        'export-center': { title: 'Export Center', subtitle: 'Export & download structured administrative data' },
        profile: { title: 'Profile Settings', subtitle: 'Update display name, password, and two-step verification' },
    };

    if (loading) return (
        <div className="min-h-full bg-white dark:bg-[#0a0a0a] myfont animate-pulse">
            <div className="max-w-7xl mx-auto px-5 lg:px-8 py-8">
                {/* Page Header Skeleton */}
                <div className="mb-8 space-y-2">
                    <div className="h-7 w-48 bg-neutral-100 dark:bg-zinc-900 rounded-lg" />
                    <div className="h-4 w-72 bg-neutral-50 dark:bg-zinc-900/50 rounded-lg" />
                </div>

                {/* Stats Cards Skeleton */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="p-5 rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-neutral-50/50 dark:bg-[#0c0c0c] space-y-3">
                            <div className="h-3 w-16 bg-neutral-200 dark:bg-zinc-800 rounded" />
                            <div className="h-8 w-24 bg-neutral-200 dark:bg-zinc-800 rounded-lg" />
                        </div>
                    ))}
                </div>

                {/* Table Box Skeleton */}
                <div className="border border-neutral-200 dark:border-zinc-800 rounded-2xl p-6 bg-white dark:bg-[#0a0a0a] space-y-4">
                    <div className="h-4 w-32 bg-neutral-200 dark:bg-zinc-800 rounded" />
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex gap-4 items-center border-b border-neutral-100 dark:border-zinc-900 pb-4 last:border-0 last:pb-0">
                                <div className="h-4 w-6 bg-neutral-100 dark:bg-zinc-800 rounded" />
                                <div className="h-4 flex-1 bg-neutral-100 dark:bg-zinc-800 rounded" />
                                <div className="h-4 w-28 bg-neutral-100 dark:bg-zinc-800 rounded" />
                                <div className="h-4 w-20 bg-neutral-100 dark:bg-zinc-800 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const currentTabInfo = tabTitles[activeTab] || tabTitles.overview;

    /* ── Event Data Table Component ───────────────────────────────────────── */
    const renderEventDataTable = () => (
        <div className="space-y-4">
            {/* Filter Controls Toolbar */}
            <div className="bg-neutral-50/80 dark:bg-neutral-900/50 p-4 border border-neutral-200 dark:border-zinc-800 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search by event name or club..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-black dark:text-white outline-none focus:border-orange-500 transition-colors"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black dark:hover:text-white">
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    {/* Club Filter */}
                    <FilterSelect value={filters.clubId} onChange={(val) => setFilters(prev => ({ ...prev, clubId: val }))}>
                        <option value="all">All Clubs</option>
                        {clubHeads.map(c => (
                            <option key={c._id || c.id} value={c._id || c.id}>{c.clubName}</option>
                        ))}
                    </FilterSelect>

                    {/* Type Filter */}
                    <FilterSelect value={typeFilter} onChange={(val) => setTypeFilter(val)}>
                        <option value="all">All Types (Paid & Free)</option>
                        <option value="paid">Paid Events</option>
                        <option value="free">Free Events</option>
                    </FilterSelect>

                    {/* Month Filter */}
                    <FilterSelect value={filters.month} onChange={(val) => setFilters(prev => ({ ...prev, month: val }))}>
                        <option value="all">All Months</option>
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={String(i + 1)}>
                                {new Date(2026, i, 1).toLocaleString('default', { month: 'long' })}
                            </option>
                        ))}
                    </FilterSelect>

                    {/* Year Filter */}
                    <FilterSelect value={filters.year} onChange={(val) => setFilters(prev => ({ ...prev, year: val }))}>
                        <option value="all">All Years</option>
                        {['2024', '2025', '2026', '2027'].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </FilterSelect>
                </div>

                {/* Download Button */}
                <button
                    onClick={handleDownloadCSV}
                    className="px-3.5 py-2 bg-black dark:bg-white text-white dark:text-black text-[11px] font-bold tracking-wide rounded-xl hover:bg-orange-600 dark:hover:bg-orange-600 dark:hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                    <i className="ri-download-line text-sm" />
                    Export CSV
                </button>
            </div>

            {/* Event Data Table */}
            <DataTable>
                <thead>
                    <tr className="border-b border-neutral-200 dark:border-zinc-800">
                        <Th>S.No</Th>
                        <Th>Name of Event</Th>
                        <Th>Date</Th>
                        <Th>Club Name</Th>
                        <Th>Registration</Th>
                        <Th>Paid or Free</Th>
                    </tr>
                </thead>
                <tbody>
                    {filteredEventList.map((item, idx) => {
                        const eventId = item.id || item.eventId;
                        const eventSlug = item.slug || eventId;
                        const eventUrl = `/events/${eventSlug}`;
                        const eventTitle = item.eventName || item.title || 'Untitled Event';
                        const clubName = item.clubName || 'Unknown Club';
                        const regCount = item.totalRegistrations ?? item.registeredCount ?? item.regCount ?? 0;
                        const isPaid = item.eventType === 'Paid' || (item.entryFee && item.entryFee > 0);
                        const fee = item.entryFee || 0;
                        const dateStr = item.eventDate || item.startTime;

                        return (
                            <tr key={idx} className="border-b border-neutral-100 dark:border-zinc-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                                <Td className="text-neutral-400 dark:text-neutral-600 font-mono font-medium">{idx + 1}</Td>
                                <Td>
                                    <a
                                        href={eventUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-bold text-black dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors inline-flex items-center gap-1.5 group"
                                    >
                                        <span className="group-hover:underline">{eventTitle}</span>
                                        <ExternalLink size={13} className="text-neutral-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 shrink-0 transition-colors" />
                                    </a>
                                </Td>
                                <Td className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                                    {dateStr ? new Date(dateStr).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                                </Td>
                                <Td className="text-orange-600 dark:text-orange-400 font-semibold">{clubName}</Td>
                                <Td className="font-semibold text-black dark:text-white">{regCount} students</Td>
                                <Td>
                                    <TypeBadge isPaid={isPaid} fee={fee} />
                                </Td>
                            </tr>
                        );
                    })}
                    {filteredEventList.length === 0 && (
                        <tr>
                            <td colSpan="6" className="px-5 py-16 text-center text-neutral-400 text-sm">
                                No events found matching your search and filter criteria.
                            </td>
                        </tr>
                    )}
                </tbody>
            </DataTable>
        </div>
    );

    return (
        <div className="min-h-full bg-white dark:bg-[#0a0a0a] myfont">
            <div className="max-w-7xl mx-auto px-5 lg:px-8 py-8">

                {/* ── Page Header ───────────────────────────────────────── */}
                <div className="mb-8 flex flex-wrap justify-between items-end gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-black dark:text-white tracking-wide">
                            {currentTabInfo.title}
                        </h1>
                        <p className="text-neutral-400 dark:text-neutral-500 text-[12px] mt-0.5 tracking-wide font-medium">
                            {currentTabInfo.subtitle}
                        </p>
                    </div>

                    {/* Header Actions */}
                    {activeTab === 'broadcasts' && (
                        <button
                            onClick={() => setBroadcastModalOpen(true)}
                            className="px-4 py-2.5 bg-orange-600 text-white text-[12px] font-bold tracking-wide rounded-xl hover:bg-orange-500 transition-all flex items-center gap-2 shadow-lg shadow-orange-600/20 cursor-pointer"
                        >
                            <Plus size={16} />
                            <span>New Broadcast</span>
                        </button>
                    )}

                    {activeTab === 'notifications' && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="px-3.5 py-2 bg-neutral-100 dark:bg-zinc-800 text-black dark:text-white text-[11px] font-bold tracking-wide rounded-xl hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <CheckCheck size={14} className="text-orange-500" />
                            <span>Mark All Read</span>
                        </button>
                    )}

                    {activeTab === 'venues' && (
                        <button
                            onClick={() => setIsAddVenueModalOpen(true)}
                            className="px-4 py-2.5 bg-orange-600 text-white text-[12px] font-bold tracking-wide rounded-xl hover:bg-orange-500 transition-all flex items-center gap-2 shadow-lg shadow-orange-600/20 cursor-pointer"
                        >
                            <Plus size={16} />
                            <span>Add Venue</span>
                        </button>
                    )}
                </div>

                {/* ── OVERVIEW TAB ─────────────────────────────────────── */}
                {activeTab === 'overview' && (
                    <>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <StatCard label="Active Events" value={stats?.totalEvents || 0} />
                            <StatCard label="Events (Till Today)" value={stats?.totalEventsTillNow || 0} />
                            <StatCard label="Total Clubs" value={stats?.totalClubs || 0} />
                            <StatCard label="Total Students" value={stats?.totalStudents || 0} />
                        </div>

                        {role === 'admin' && (
                            <div className="flex justify-end mb-6">
                                <button 
                                    onClick={() => setShowYearWise(!showYearWise)}
                                    className="text-[10px] font-bold uppercase tracking-[0.15em] px-4 py-2 rounded-lg border border-neutral-200 dark:border-zinc-800 text-neutral-500 dark:text-neutral-400 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-all cursor-pointer"
                                >
                                    {showYearWise ? 'Hide Yearly Stats' : 'Show Year-wise Total Events'}
                                </button>
                            </div>
                        )}

                        {showYearWise && stats?.yearWiseEvents && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
                                {stats.yearWiseEvents.map(y => (
                                    <div key={y._id} className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-zinc-800 p-3 rounded-xl text-center">
                                        <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">{y._id}</p>
                                        <p className="text-lg font-black text-black dark:text-white">{y.count}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Event Data Table under Overview */}
                        {renderEventDataTable()}
                    </>
                )}

                {/* ── EVENTS CATEGORY ─────────────────────────────────── */}
                {activeTab === 'event-data' && renderEventDataTable()}
                {(activeTab === 'calendar' || activeTab === 'calendar-schedule') && <EventCalendarPage />}


                {/* Venues Management */}
                {activeTab === 'venues' && (
                    <div className="space-y-6">
                        {/* 1. Minimal Summary KPI Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="p-4 rounded-xl border border-neutral-200 dark:border-zinc-800/80 bg-white dark:bg-[#0c0c0c] flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Total Venues</p>
                                    <p className="text-xl font-black text-black dark:text-white mt-0.5">{venues.length}</p>
                                </div>
                                <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-zinc-800/70 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                                    <Building2 size={16} />
                                </div>
                            </div>
                            <div className="p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/10 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Open for Events</p>
                                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{venues.filter(v => v.isOpen).length}</p>
                                </div>
                                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                </div>
                            </div>
                            <div className="p-4 rounded-xl border border-neutral-200 dark:border-zinc-800/80 bg-white dark:bg-[#0c0c0c] flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Closed / Unavailable</p>
                                    <p className="text-xl font-black text-neutral-600 dark:text-neutral-400 mt-0.5">{venues.filter(v => !v.isOpen).length}</p>
                                </div>
                                <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-zinc-800/70 flex items-center justify-center text-neutral-400">
                                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-400" />
                                </div>
                            </div>
                        </div>

                        {/* 2. Search & Filters Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#0a0a0a] p-2.5 border border-neutral-200 dark:border-zinc-800 rounded-2xl">
                            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto flex-1">
                                <div className="relative flex-1 max-w-sm">
                                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                    <input
                                        type="text"
                                        value={venueSearch}
                                        onChange={(e) => setVenueSearch(e.target.value)}
                                        placeholder="Search venue by name..."
                                        className="w-full pl-9 pr-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:border-orange-600 dark:focus:border-orange-500 transition-colors text-neutral-900 dark:text-white"
                                    />
                                </div>
                                <FilterSelect value={venueStatusFilter} onChange={(val) => setVenueStatusFilter(val)}>
                                    <option value="all">All Availability Status</option>
                                    <option value="open">Open Only</option>
                                    <option value="closed">Closed Only</option>
                                </FilterSelect>
                            </div>
                            <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium px-2">
                                {venues.filter(v => {
                                    const matchesSearch = v.name.toLowerCase().includes(venueSearch.toLowerCase());
                                    const matchesStatus = venueStatusFilter === 'all' ||
                                        (venueStatusFilter === 'open' && v.isOpen) ||
                                        (venueStatusFilter === 'closed' && !v.isOpen);
                                    return matchesSearch && matchesStatus;
                                }).length} venues shown
                            </span>
                        </div>

                        {/* 3. 3-Column Clean Table */}
                        <DataTable>
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-zinc-800">
                                    <Th>Venue Name</Th>
                                    <Th>Status</Th>
                                    <Th align="right">Actions</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {venues.filter(v => {
                                    const matchesSearch = v.name.toLowerCase().includes(venueSearch.toLowerCase());
                                    const matchesStatus = venueStatusFilter === 'all' ||
                                        (venueStatusFilter === 'open' && v.isOpen) ||
                                        (venueStatusFilter === 'closed' && !v.isOpen);
                                    return matchesSearch && matchesStatus;
                                }).map((v, idx) => (
                                    <tr key={v.id || idx} className="border-b border-neutral-100 dark:border-zinc-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                                        {/* Column 1: Venue Name */}
                                        <Td className="py-4 font-semibold text-sm text-neutral-900 dark:text-white">
                                            {v.name}
                                        </Td>

                                        {/* Column 2: Status (Badge + iOS Toggle Switch) */}
                                        <Td className="py-4">
                                            <div className="flex items-center gap-3">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold tracking-wide rounded-full ${
                                                    v.isOpen
                                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-500/20'
                                                        : 'bg-neutral-100 dark:bg-zinc-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-zinc-700'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${v.isOpen ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                                                    {v.isOpen ? 'Open' : 'Closed'}
                                                </span>

                                                {/* iOS Switch */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleVenueStatus(v)}
                                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                        v.isOpen ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-zinc-700'
                                                    }`}
                                                    title={v.isOpen ? 'Click to Close Venue' : 'Click to Open Venue'}
                                                >
                                                    <span
                                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                            v.isOpen ? 'translate-x-4' : 'translate-x-0'
                                                        }`}
                                                    />
                                                </button>
                                            </div>
                                        </Td>

                                        {/* Column 3: Actions (Kebab Context Menu) */}
                                        <Td align="right" className="py-4">
                                            <div className="relative inline-block text-left">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenuVenueId(openMenuVenueId === v.id ? null : v.id);
                                                    }}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                                    title="More actions"
                                                >
                                                    <MoreVertical size={16} />
                                                </button>

                                                {openMenuVenueId === v.id && (
                                                    <>
                                                        <div
                                                            className="fixed inset-0 z-40"
                                                            onClick={() => setOpenMenuVenueId(null)}
                                                        />
                                                        <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-[#141414] border border-neutral-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setOpenMenuVenueId(null);
                                                                    setEditingVenue({ ...v });
                                                                    setIsEditVenueModalOpen(true);
                                                                }}
                                                                className="w-full px-3 py-2 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-zinc-800/80 flex items-center gap-2 transition-colors cursor-pointer"
                                                            >
                                                                <Edit2 size={13} className="text-neutral-400" />
                                                                <span>Edit Venue</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setOpenMenuVenueId(null);
                                                                    handleDeleteVenue(v);
                                                                }}
                                                                className="w-full px-3 py-2 text-left text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 transition-colors cursor-pointer border-t border-neutral-100 dark:border-zinc-800/80"
                                                            >
                                                                <Trash2 size={13} className="text-red-500" />
                                                                <span>Delete Venue</span>
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </Td>
                                    </tr>
                                ))}
                                {venues.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="px-5 py-16 text-center text-neutral-400 text-sm">
                                            {venuesLoading ? 'Loading campus venues...' : 'No venues found.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </DataTable>
                    </div>
                )}

                {/* ── CLUBS & USERS CATEGORY ───────────────────────────── */}

                {/* Clubs */}
                {activeTab === 'club-heads' && (
                    <div className="space-y-6">
                        {/* Header Action Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-zinc-800">
                            <div>
                                <h2 className="text-base font-black text-black dark:text-white tracking-wide">Registered Clubs</h2>
                                <p className="text-xs text-neutral-400 font-medium">Manage registered student clubs, faculty coordinators, and club head accounts.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateClubModalOpen(true)}
                                className="px-4 py-2.5 bg-black dark:bg-white text-white dark:text-black hover:bg-orange-600 dark:hover:bg-orange-600 dark:hover:text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-xs"
                            >
                                <Plus size={16} />
                                <span>Add New Club</span>
                            </button>
                        </div>

                        {/* List: Existing Clubs */}
                        <DataTable>
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-zinc-800">
                                    <Th>#</Th>
                                    <Th>Club Name</Th>
                                    <Th>Faculty Coordinator</Th>
                                    <Th>Club Head Account</Th>
                                    <Th align="right">Actions</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {clubHeads.map((club, idx) => {
                                    const headUser = club.memberships?.[0]?.student;
                                    const fc = club.facultyCoordinator;
                                    return (
                                        <tr key={club._id || idx} className="border-b border-neutral-100 dark:border-zinc-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                                            <Td className="text-neutral-300 dark:text-neutral-600">{idx + 1}</Td>
                                            <Td className="font-bold text-black dark:text-white">{club.clubName}</Td>
                                            <Td>
                                                <p className="font-semibold text-black dark:text-white">{fc?.name || club.facultyName || 'N/A'}</p>
                                                <p className="text-[11px] text-neutral-400">{fc?.email || club.facultyEmail || ''}</p>
                                            </Td>
                                            <Td>
                                                <p className="font-semibold text-black dark:text-white">{headUser?.name || club.clubName.toUpperCase()}</p>
                                                <p className="text-[11px] text-neutral-400">{headUser?.email || club.clubEmail || ''}</p>
                                            </Td>
                                            <Td align="right">
                                                <button
                                                    onClick={() => { setEditingClub(club); setIsEditModalOpen(true); }}
                                                    className="px-3 py-1.5 bg-neutral-100 dark:bg-zinc-800 text-black dark:text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                                                >
                                                    Edit
                                                </button>
                                            </Td>
                                        </tr>
                                    );
                                })}
                                {clubHeads.length === 0 && (
                                    <tr><td colSpan="5" className="px-5 py-16 text-center text-neutral-400 text-sm">No clubs found.</td></tr>
                                )}
                            </tbody>
                        </DataTable>
                    </div>
                )}

                {/* Coordinators */}
                {activeTab === 'coordinators' && (
                    <div className="space-y-6">
                        {/* Header Action Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-zinc-800">
                            <div>
                                <h2 className="text-base font-black text-black dark:text-white tracking-wide">Faculty Coordinators</h2>
                                <p className="text-xs text-neutral-400 font-medium">Manage faculty coordinator accounts overseeing campus clubs and approving events.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAddCoordModalOpen(true)}
                                className="px-4 py-2.5 bg-black dark:bg-white text-white dark:text-black hover:bg-orange-600 dark:hover:bg-orange-600 dark:hover:text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-xs"
                            >
                                <Plus size={16} />
                                <span>Add New Coordinator</span>
                            </button>
                        </div>

                        {/* List: Existing Coordinators */}
                        <DataTable>
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-zinc-800">
                                    <Th>#</Th>
                                    <Th>Name</Th>
                                    <Th>Email</Th>
                                    <Th align="right">Actions</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {coordinators.map((c, idx) => (
                                    <tr key={c._id || idx} className="border-b border-neutral-100 dark:border-zinc-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                                        <Td className="text-neutral-300 dark:text-neutral-600">{idx + 1}</Td>
                                        <Td className="font-bold text-black dark:text-white">{c.name}</Td>
                                        <Td className="text-neutral-400">{c.email}</Td>
                                        <Td align="right">
                                            <button
                                                onClick={() => { setEditingCoord(c); setIsCoordModalOpen(true); }}
                                                className="px-3 py-1.5 bg-neutral-100 dark:bg-zinc-800 text-black dark:text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                                            >
                                                Edit
                                            </button>
                                        </Td>
                                    </tr>
                                ))}
                                {coordinators.length === 0 && (
                                    <tr><td colSpan="4" className="px-5 py-16 text-center text-neutral-400 text-sm">No coordinators found.</td></tr>
                                )}
                            </tbody>
                        </DataTable>
                    </div>
                )}

                {/* ── FINANCIAL OPERATIONS CATEGORY ────────────────────── */}

                {/* Transactions */}
                {activeTab === 'payments-overview' && (
                    <div className="space-y-6">
                        {/* Summary Stats */}
                        {manualPaymentsSummary && (
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                <StatCard label="Total Payments" value={manualPaymentsSummary.total} />
                                <div className="p-5 rounded-2xl border bg-white dark:bg-[#0a0a0a] border-neutral-200 dark:border-zinc-800 transition-colors">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-500">Pending Approvals</p>
                                    <p className="text-2xl font-black mt-1 text-amber-500">{manualPaymentsSummary.pending}</p>
                                </div>
                                <div className="p-5 rounded-2xl border bg-white dark:bg-[#0a0a0a] border-neutral-200 dark:border-zinc-800 transition-colors">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-500">Approved</p>
                                    <p className="text-2xl font-black mt-1 text-emerald-500">{manualPaymentsSummary.approved}</p>
                                </div>
                                <div className="p-5 rounded-2xl border bg-white dark:bg-[#0a0a0a] border-neutral-200 dark:border-zinc-800 transition-colors">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-500">Rejected</p>
                                    <p className="text-2xl font-black mt-1 text-rose-500">{manualPaymentsSummary.rejected}</p>
                                </div>
                                <div className="p-5 rounded-2xl border bg-white dark:bg-[#0a0a0a] border-neutral-200 dark:border-zinc-800 transition-colors">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-500">Need Details</p>
                                    <p className="text-2xl font-black mt-1 text-orange-500">{manualPaymentsSummary.needMoreDetails}</p>
                                </div>
                            </div>
                        )}

                        {/* Search Input */}
                        <div className="relative">
                            <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 text-base" />
                            <input
                                type="text"
                                placeholder="Search by student, event, club, roll number or Transaction ID/UTR..."
                                value={paymentsSearch}
                                onChange={(e) => setPaymentsSearch(e.target.value)}
                                className="w-full pl-11 pr-10 py-3 border border-neutral-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-[#0a0a0a] text-black dark:text-white text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all placeholder:text-neutral-400"
                            />
                            {paymentsSearch && (
                                <button onClick={() => setPaymentsSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer border-0 bg-transparent">
                                    <i className="ri-close-line text-lg" />
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <DataTable>
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-zinc-800">
                                    <Th>#</Th>
                                    <Th>Event & Club</Th>
                                    <Th>Participant Details</Th>
                                    <Th>Payer & UTR Info</Th>
                                    <Th>Amount</Th>
                                    <Th>Status</Th>
                                    <Th align="right">Date</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const filtered = manualPayments.filter(p => {
                                        if (!paymentsSearch) return true;
                                        const q = paymentsSearch.toLowerCase();
                                        return (
                                            (p.studentName || '').toLowerCase().includes(q) ||
                                            (p.studentRollNo || '').toLowerCase().includes(q) ||
                                            (p.studentEmail || '').toLowerCase().includes(q) ||
                                            (p.eventName || '').toLowerCase().includes(q) ||
                                            (p.clubName || '').toLowerCase().includes(q) ||
                                            (p.transactionId || '').toLowerCase().includes(q) ||
                                            (p.payerName || '').toLowerCase().includes(q)
                                        );
                                    });

                                    if (filtered.length === 0) {
                                        return <tr><td colSpan="7" className="px-5 py-16 text-center text-neutral-400 text-sm">No transaction registrations found.</td></tr>;
                                    }

                                    return filtered.map((p, idx) => (
                                        <tr key={p.id || idx} className="border-b border-neutral-100 dark:border-zinc-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                                            <Td className="text-neutral-300 dark:text-neutral-600">{idx + 1}</Td>
                                            <Td>
                                                <p className="font-semibold text-black dark:text-white">{p.eventName}</p>
                                                <p className="text-[11px] text-orange-600 dark:text-orange-400 font-semibold">{p.clubName}</p>
                                            </Td>
                                            <Td>
                                                <p className="font-semibold text-black dark:text-white">{p.studentName}</p>
                                                <p className="text-[11px] text-neutral-400">{p.studentEmail} {p.studentRollNo !== 'N/A' && `• Roll: ${p.studentRollNo}`}</p>
                                            </Td>
                                            <Td>
                                                {p.transactionId ? (
                                                    <span className="font-mono text-xs font-bold text-black dark:text-white">{p.transactionId}</span>
                                                ) : (
                                                    <span className="text-neutral-400 text-xs italic">No UTR submitted</span>
                                                )}
                                                {p.payerName && <p className="text-[11px] text-neutral-400">Payer: {p.payerName}</p>}
                                            </Td>
                                            <Td className="font-mono font-black text-orange-600 dark:text-orange-400 text-base">₹{p.amountPaid}</Td>
                                            <Td>
                                                <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border ${
                                                    ['APPROVED', 'SUCCESS'].includes(p.paymentStatus)
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                                        : p.paymentStatus === 'REJECTED'
                                                        ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                                                        : p.paymentStatus === 'NEED_MORE_DETAILS'
                                                        ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20'
                                                        : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                                                }`}>
                                                    {p.paymentStatus}
                                                </span>
                                            </Td>
                                            <Td align="right" className="text-[11px] text-neutral-400 uppercase tracking-wide">
                                                {new Date(p.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                            </Td>
                                        </tr>
                                    ));
                                })()}
                            </tbody>
                        </DataTable>
                    </div>
                )}

                {/* Payouts */}
                {activeTab === 'payouts' && (
                    <DataTable>
                        <thead>
                            <tr className="border-b border-neutral-200 dark:border-zinc-800">
                                <Th>Club Name</Th>
                                <Th>Event Title</Th>
                                <Th>Amount</Th>
                                <Th>Registrations</Th>
                                <Th>Deadline</Th>
                                <Th align="right">Action</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.eventStats?.filter(item => item.entryFee > 0).map((item, idx) => (
                                <tr key={idx} className="border-b border-neutral-100 dark:border-zinc-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                                    <Td className="font-semibold text-black dark:text-white">{item.clubName}</Td>
                                    <Td>{item.title}</Td>
                                    <Td className="font-mono font-black text-orange-600 dark:text-orange-400 text-base">₹{item.totalCollected}</Td>
                                    <Td>{item.regCount} students</Td>
                                    <Td className="text-[11px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
                                        {item.registrationDeadline 
                                            ? new Date(item.registrationDeadline).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
                                            : new Date(item.startTime).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
                                        }
                                    </Td>
                                    <Td align="right">
                                        {(() => {
                                            const deadline = item.registrationDeadline || item.startTime;
                                            const isLocked = new Date() < new Date(deadline);

                                            if (item.payoutStatus === 'COMPLETED') {
                                                return (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-green-200 dark:border-green-500/20">
                                                        <i className="ri-checkbox-circle-fill text-sm" />
                                                        Completed
                                                    </span>
                                                );
                                            }

                                            if (isLocked) {
                                                return (
                                                    <div className="flex flex-col items-end">
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 text-neutral-400 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-neutral-200 dark:border-neutral-700 cursor-not-allowed">
                                                            <i className="ri-lock-2-line text-sm" />
                                                            Locked
                                                        </span>
                                                        <span className="text-[9px] font-medium text-neutral-300 dark:text-neutral-600 mt-1">After deadline</span>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <button 
                                                    onClick={() => handleFetchPayoutInfo(item.clubHeadId, item.eventId)}
                                                    className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-orange-600 dark:hover:bg-orange-600 dark:hover:text-white transition-colors cursor-pointer"
                                                >
                                                    Make Payout
                                                </button>
                                            );
                                        })()}
                                    </Td>
                                </tr>
                            ))}
                            {(!stats?.eventStats || stats.eventStats.filter(item => item.entryFee > 0).length === 0) && (
                                <tr><td colSpan="6" className="px-5 py-16 text-center text-neutral-400 text-sm">No paid events found for payout.</td></tr>
                            )}
                        </tbody>
                    </DataTable>
                )}

                {/* ── COMMUNICATION CATEGORY ──────────────────────────── */}

                {/* Broadcasts */}
                {activeTab === 'broadcasts' && (
                    <div className="space-y-6">
                        <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 flex items-start gap-3">
                            <Radio size={20} className="shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider">Real-Time Broadcast Engine</h4>
                                <p className="text-xs mt-1 leading-relaxed opacity-90">
                                    Broadcast announcements are dispatched instantly via WebSocket live feeds and recorded in student notification feeds.
                                </p>
                            </div>
                        </div>

                        <DataTable>
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-zinc-800">
                                    <Th>#</Th>
                                    <Th>Broadcast Title & Message</Th>
                                    <Th>Target Audience</Th>
                                    <Th>Sender</Th>
                                    <Th align="right">Date & Time</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {broadcasts.map((b, idx) => (
                                    <tr key={b._id || b.id || idx} className="border-b border-neutral-100 dark:border-zinc-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                                        <Td className="text-neutral-400 dark:text-neutral-600 font-mono font-medium">{idx + 1}</Td>
                                        <Td className="max-w-md">
                                            <p className="font-bold text-black dark:text-white text-sm">{b.title}</p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-0.5">{b.message}</p>
                                        </Td>
                                        <Td>
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-zinc-700">
                                                <Radio size={11} className="text-orange-500" />
                                                {b.recipientStudentId ? 'Direct Student' : 'All Students'}
                                            </span>
                                        </Td>
                                        <Td className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                            {b.sender?.name || b.sender?.clubName || 'Admin'}
                                        </Td>
                                        <Td align="right" className="text-xs text-neutral-400 font-mono">
                                            {new Date(b.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                        </Td>
                                    </tr>
                                ))}
                                {broadcasts.length === 0 && !loadingBroadcasts && (
                                    <tr>
                                        <td colSpan="5" className="px-5 py-16 text-center text-neutral-400 text-sm">
                                            No broadcast history found. Click "New Broadcast" to send your first message.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </DataTable>
                    </div>
                )}

                {/* Notifications */}
                {activeTab === 'notifications' && (
                    <div className="space-y-6">
                        <div className="space-y-3">
                            {adminNotifications.map((n, idx) => (
                                <div 
                                    key={n._id || n.id || idx}
                                    className="p-5 rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-[#0a0a0a] flex items-start gap-4 transition-all hover:border-neutral-300 dark:hover:border-zinc-700"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                                        <Bell size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="font-bold text-black dark:text-white text-sm">{n.title}</h4>
                                            <span className="text-[10px] text-neutral-400 font-mono">
                                                {new Date(n.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">{n.message}</p>
                                        <div className="flex items-center gap-3 mt-3">
                                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                                                Sender: <span className="text-black dark:text-white">{n.sender?.name || n.sender?.clubName || 'System'}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {adminNotifications.length === 0 && !loadingNotifications && (
                                <div className="p-12 text-center border border-dashed border-neutral-300 dark:border-zinc-800 rounded-2xl">
                                    <Bell size={32} className="mx-auto text-neutral-300 dark:text-zinc-700 mb-3" />
                                    <p className="text-sm font-medium text-neutral-500">No system notifications found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── SYSTEM ADMIN CATEGORY ────────────────────────────── */}

                {/* Export Center */}
                {activeTab === 'export-center' && (
                    <ExportCenter />
                )}

                {/* ── PROFILE SETTINGS TAB ────────────────────────────── */}
                {activeTab === 'profile' && (
                    <div className="max-w-2xl space-y-8">
                        {/* Profile Info Form */}
                        <div className="border border-neutral-200 dark:border-zinc-800 rounded-2xl p-6 bg-white dark:bg-[#0a0a0a]">
                            <h2 className="text-base font-black text-black dark:text-white tracking-wide mb-1">Admin Profile</h2>
                            <p className="text-neutral-400 text-xs mb-6">Update display name and security preferences.</p>
                            
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1.5">Display Name</label>
                                    <input 
                                        type="text"
                                        value={profileName}
                                        onChange={(e) => setProfileName(e.target.value)}
                                        required
                                        className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-[13px] focus:border-orange-600 dark:focus:border-orange-500 outline-none transition-colors" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1.5">Email Address</label>
                                    <input 
                                        type="email"
                                        value={profileEmail}
                                        disabled
                                        className="w-full px-3 py-2.5 bg-neutral-100 dark:bg-zinc-800/50 border border-neutral-200 dark:border-zinc-800 rounded-xl text-[13px] text-neutral-400 cursor-not-allowed" 
                                    />
                                </div>

                                <div className="pt-2">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input 
                                            type="checkbox"
                                            checked={profile2FA}
                                            onChange={(e) => setProfile2FA(e.target.checked)}
                                            className="w-4 h-4 rounded border-neutral-300 text-orange-600 focus:ring-orange-500"
                                        />
                                        <div>
                                            <p className="text-xs font-bold text-black dark:text-white">Enable Two-Factor Authentication (2FA)</p>
                                            <p className="text-[11px] text-neutral-400">Require an email OTP code whenever logging into admin tools.</p>
                                        </div>
                                    </label>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button 
                                        type="submit" 
                                        disabled={isSavingProfile}
                                        className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-orange-600 dark:hover:bg-orange-600 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                        {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Password Form */}
                        <div className="border border-neutral-200 dark:border-zinc-800 rounded-2xl p-6 bg-white dark:bg-[#0a0a0a]">
                            <h2 className="text-base font-black text-black dark:text-white tracking-wide mb-1">Change Password</h2>
                            <p className="text-neutral-400 text-xs mb-6">Ensure your administrative password is strong and secure.</p>
                            
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1.5">Current Password</label>
                                    <input 
                                        type="password"
                                        value={profilePasswordForm.currentPassword}
                                        onChange={(e) => setProfilePasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                        required
                                        className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-[13px] focus:border-orange-600 dark:focus:border-orange-500 outline-none transition-colors" 
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1.5">New Password</label>
                                        <input 
                                            type="password"
                                            value={profilePasswordForm.newPassword}
                                            onChange={(e) => setProfilePasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                            required
                                            className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-[13px] focus:border-orange-600 dark:focus:border-orange-500 outline-none transition-colors" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1.5">Confirm New Password</label>
                                        <input 
                                            type="password"
                                            value={profilePasswordForm.confirmPassword}
                                            onChange={(e) => setProfilePasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                            required
                                            className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-[13px] focus:border-orange-600 dark:focus:border-orange-500 outline-none transition-colors" 
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button 
                                        type="submit" 
                                        disabled={isSavingProfile}
                                        className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-orange-600 dark:hover:bg-orange-600 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                        {isSavingProfile ? 'Updating Password...' : 'Update Password'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ── CENTRAL ORGANIZER TAB ───────────────────────────── */}
                {activeTab === 'central-organizer' && (
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className="border border-neutral-200 dark:border-zinc-800 rounded-2xl p-6 bg-white dark:bg-[#0a0a0a]">
                            <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-zinc-800">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 rounded-md">
                                            Single Seat Role
                                        </span>
                                        <span className="text-xs text-neutral-400 font-medium">CampusNode System Security</span>
                                    </div>
                                    <h2 className="text-base font-black text-black dark:text-white tracking-wide mt-1.5">
                                        Current Central Organizer
                                    </h2>
                                    <p className="text-neutral-400 text-xs mt-0.5 max-w-xl">
                                        The Central Organizer organizes college-wide events and delegates event staff. Exactly one student account can hold this role at a time (enforced by database constraint).
                                    </p>
                                </div>
                            </div>

                            {loadingCO ? (
                                <div className="py-12 text-center text-xs text-neutral-400">Loading Central Organizer details...</div>
                            ) : centralOrganizer ? (
                                <div className="mt-5 p-5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-black text-lg flex items-center justify-center">
                                            {centralOrganizer.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">{centralOrganizer.name}</h3>
                                                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-full">Active</span>
                                            </div>
                                            <p className="text-xs text-neutral-500">{centralOrganizer.email}</p>
                                            <p className="text-[11px] text-neutral-400 mt-0.5">
                                                {centralOrganizer.branch || "Branch N/A"} &bull; Year {centralOrganizer.year || "N/A"} &bull; {centralOrganizer.program || "Student"}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleRevokeCO(centralOrganizer.id, centralOrganizer.name)}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                                    >
                                        Revoke Role
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-5 p-6 rounded-xl border border-dashed border-neutral-300 dark:border-zinc-800 text-center space-y-2">
                                    <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">No Central Organizer Currently Assigned</p>
                                    <p className="text-xs text-neutral-400 max-w-md mx-auto">
                                        Search an existing registered CampusNode student below to assign them the Central Organizer role.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Search & Assignment Panel */}
                        <div className="border border-neutral-200 dark:border-zinc-800 rounded-2xl p-6 bg-white dark:bg-[#0a0a0a] space-y-4">
                            <h3 className="text-sm font-black text-black dark:text-white tracking-wide">
                                Assign Central Organizer from Existing Student Accounts
                            </h3>
                            <p className="text-neutral-400 text-xs">
                                Search students by name, email, or roll number. The user must be a registered StudentUser.
                            </p>

                            <div className="relative max-w-md">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <input
                                    type="text"
                                    placeholder="Search by student name, email, or roll no..."
                                    value={studentQuery}
                                    onChange={(e) => handleSearchStudents(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-black dark:text-white outline-none focus:border-orange-500 transition-colors"
                                />
                            </div>

                            {searchingStudents && (
                                <p className="text-xs text-neutral-400">Searching students...</p>
                            )}

                            {studentSearchResults.length > 0 && (
                                <div className="border border-neutral-200 dark:border-zinc-800 rounded-xl divide-y divide-neutral-100 dark:divide-zinc-800 overflow-hidden">
                                    {studentSearchResults.map((st) => (
                                        <div key={st.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-neutral-50 dark:hover:bg-zinc-900/50 transition-colors">
                                            <div>
                                                <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{st.name}</p>
                                                <p className="text-[11px] text-neutral-400">{st.email} {st.rollNo ? `• ${st.rollNo}` : ''}</p>
                                                <p className="text-[10px] text-neutral-500">{st.branch} • Year {st.year}</p>
                                            </div>

                                            {st.accessLevel === 'central_organizer' ? (
                                                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold rounded-lg">
                                                    Current CO
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    disabled={assigningCO}
                                                    onClick={() => handleAssignCO(st.id)}
                                                    className="px-3.5 py-1.5 bg-black dark:bg-white text-white dark:text-black hover:bg-orange-600 dark:hover:bg-orange-600 dark:hover:text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                                >
                                                    Assign as CO
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>

            {/* ── MODALS ─────────────────────────────────────────────── */}
            
            {/* Modal: Broadcast Creation */}
            {broadcastModalOpen && (
                <Modal 
                    onClose={() => setBroadcastModalOpen(false)} 
                    title="Send Broadcast Announcement" 
                    subtitle="Dispatch announcements to all students or event participants"
                >
                    <form onSubmit={handleSendBroadcast} className="space-y-4 pt-2">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Target Audience</label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                                    broadcastForm.targetType === 'ALL_STUDENTS' 
                                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 font-bold' 
                                        : 'border-neutral-200 dark:border-zinc-800 text-neutral-600 dark:text-neutral-400'
                                }`}>
                                    <input 
                                        type="radio" 
                                        name="targetType" 
                                        value="ALL_STUDENTS" 
                                        checked={broadcastForm.targetType === 'ALL_STUDENTS'}
                                        onChange={() => setBroadcastForm(prev => ({ ...prev, targetType: 'ALL_STUDENTS' }))}
                                        className="hidden" 
                                    />
                                    <Radio size={16} />
                                    <span className="text-xs">All Students</span>
                                </label>

                                <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                                    broadcastForm.targetType === 'REGISTERED_STUDENTS' 
                                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 font-bold' 
                                        : 'border-neutral-200 dark:border-zinc-800 text-neutral-600 dark:text-neutral-400'
                                }`}>
                                    <input 
                                        type="radio" 
                                        name="targetType" 
                                        value="REGISTERED_STUDENTS" 
                                        checked={broadcastForm.targetType === 'REGISTERED_STUDENTS'}
                                        onChange={() => setBroadcastForm(prev => ({ ...prev, targetType: 'REGISTERED_STUDENTS' }))}
                                        className="hidden" 
                                    />
                                    <Bell size={16} />
                                    <span className="text-xs">Event Participants</span>
                                </label>
                            </div>
                        </div>

                        {broadcastForm.targetType === 'REGISTERED_STUDENTS' && (
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1.5">Select Event</label>
                                <select
                                    value={broadcastForm.eventId}
                                    onChange={(e) => setBroadcastForm(prev => ({ ...prev, eventId: e.target.value }))}
                                    required
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-[13px] font-medium focus:border-orange-500 outline-none"
                                >
                                    <option value="">-- Choose an Event --</option>
                                    {(eventData.length > 0 ? eventData : stats?.eventStats || []).map(e => (
                                        <option key={e.id || e.eventId} value={e.id || e.eventId}>
                                            {e.eventName || e.title} ({e.clubName})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1.5">Broadcast Title</label>
                            <input 
                                type="text" 
                                placeholder="e.g. Registration Extended for TechFest 2026"
                                value={broadcastForm.title}
                                onChange={(e) => setBroadcastForm(prev => ({ ...prev, title: e.target.value }))}
                                required
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-[13px] focus:border-orange-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1.5">Message Content</label>
                            <textarea 
                                rows={4}
                                placeholder="Write your broadcast message here..."
                                value={broadcastForm.message}
                                onChange={(e) => setBroadcastForm(prev => ({ ...prev, message: e.target.value }))}
                                required
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-[13px] focus:border-orange-500 outline-none"
                            />
                        </div>

                        <div className="pt-3 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setBroadcastModalOpen(false)}
                                className="px-4 py-2 bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-neutral-300 text-xs font-bold rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={sendingBroadcast}
                                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-orange-600/20 disabled:opacity-50 flex items-center gap-2"
                            >
                                <Send size={14} />
                                <span>{sendingBroadcast ? 'Dispatching...' : 'Send Broadcast'}</span>
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Modal: Confirm Payout */}
            {modalOpen && selectedClub && (
                <Modal 
                    onClose={() => setModalOpen(false)} 
                    title="Confirm Payout Settlement" 
                    subtitle={`Club: ${selectedClub.clubName}`}
                >
                    <div className="space-y-4 pt-2">
                        <ModalField label="Account Holder" value={selectedClub.bankInfo?.accountHolderName} />
                        <ModalField label="Bank Name" value={selectedClub.bankInfo?.bankName} />
                        <ModalField label="Account Number" value={selectedClub.bankInfo?.accountNumber} mono />
                        <ModalField label="IFSC Code" value={selectedClub.bankInfo?.ifscCode} mono />
                        <ModalField label="UPI ID" value={selectedClub.bankInfo?.upiId} accent />

                        <div className="pt-4 flex justify-end gap-3">
                            <button 
                                onClick={() => setModalOpen(false)} 
                                className="px-4 py-2 bg-neutral-100 dark:bg-zinc-800 text-black dark:text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleConfirmPayout} 
                                className="px-4 py-2 bg-orange-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-orange-500 transition-colors"
                            >
                                Confirm Payout Complete
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Modal: Create Club */}
            {isCreateClubModalOpen && (
                <Modal
                    onClose={() => setIsCreateClubModalOpen(false)}
                    title="Create New Club"
                    subtitle="Will automatically generate head user and faculty coordinator credentials."
                >
                    <form onSubmit={handleCreateClub} className="space-y-4 pt-2">
                        <ModalFormField label="Club Name" name="clubName" placeholder="e.g. CodeX" required />
                        <ModalFormField label="Faculty Coordinator Name" name="facultyName" placeholder="Faculty Name" required />
                        <ModalFormField label="Faculty Coordinator Email" name="facultyEmail" type="email" placeholder="Faculty Email" required />
                        <ModalFormField label="Club Email Account" name="clubEmail" type="email" placeholder="Club Email" required />

                        <div className="p-3.5  border border-orange-500/20 rounded-xl text-xs text-neutral-800 dark:text-neutral-200 space-y-2">
                            <p className="font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                                <Key size={14} className="shrink-0" /> Automated Provisioning & Credentials
                            </p>
                            <div className="space-y-1.5 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                                <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-1.5" />
                                    <p>
                                        <strong className="text-neutral-900 dark:text-neutral-100">Club Organizer:</strong> Logs in at <span className="font-mono font-semibold text-orange-600 dark:text-orange-400">/login</span> using <code className="px-1 py-0.5 bg-black/5 dark:bg-white/10 rounded font-mono font-bold">&lt;clubEmail&gt;</code> &amp; password <code className="px-1 py-0.5 bg-black/5 dark:bg-white/10 rounded font-mono font-bold">&lt;slug&gt;@him0148</code>. Account is auto-verified.
                                    </p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0 mt-1.5" />
                                    <p>
                                        <strong className="text-neutral-900 dark:text-neutral-100">Faculty Coordinator:</strong> Logs in at <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">/login</span> using <code className="px-1 py-0.5 bg-black/5 dark:bg-white/10 rounded font-mono font-bold">&lt;facultyEmail&gt;</code> &amp; password <code className="px-1 py-0.5 bg-black/5 dark:bg-white/10 rounded font-mono font-bold">&lt;slug&gt;@him0148</code> (or existing password).
                                    </p>
                                </div>
                                <div className="flex items-start gap-2 pt-0.5">
                                    <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                    <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                        Welcome &amp; credential emails will be dispatched to both email addresses automatically.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3 border-t border-neutral-100 dark:border-zinc-800">
                            <button
                                type="button"
                                onClick={() => setIsCreateClubModalOpen(false)}
                                className="px-4 py-2 bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-bold rounded-xl hover:bg-orange-600 dark:hover:bg-orange-600 dark:hover:text-white transition-colors cursor-pointer"
                            >
                                Create Club & Users
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Modal: Created Club Credentials Summary */}
            {createdClubCredentials && (
                <Modal
                    onClose={() => setCreatedClubCredentials(null)}
                    title="Club Created & Accounts Provisioned"
                    subtitle="Account credentials and portal URLs for both roles are ready."
                >
                    <div className="space-y-4 pt-2">
                        {/* Club Head Account */}
                        <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 rounded-xl space-y-2">
                            <p className="text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                                <Shield size={14} className="shrink-0" /> 1. Official Club Organizer Account (Auto-Verified)
                            </p>
                            <div className="text-xs space-y-1.5 text-neutral-700 dark:text-neutral-300">
                                <p><strong>Login Portal:</strong> <span className="font-mono text-orange-600 font-bold">/login</span></p>
                                <p><strong>Login Email:</strong> <code className="bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono font-bold">{createdClubCredentials.clubEmail}</code></p>
                                <p><strong>Default Password:</strong> <code className="bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono font-bold">{createdClubCredentials.defaultPassword}</code></p>
                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                    <CheckCircle2 size={12} className="shrink-0" /> Status: Pre-verified (no email verification barrier on login)
                                </p>
                            </div>
                        </div>

                        {/* Faculty Coordinator Account */}
                        <div className="p-4 bg-neutral-100 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl space-y-2">
                            <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                                <GraduationCap size={14} className="shrink-0" /> 2. Faculty Coordinator Account
                            </p>
                            <div className="text-xs space-y-1.5 text-neutral-700 dark:text-neutral-300">
                                <p><strong>Login Portal:</strong> <span className="font-mono text-neutral-900 dark:text-neutral-100 font-bold">/admin-secret-login</span></p>
                                <p><strong>Coordinator Name:</strong> {createdClubCredentials.facultyName}</p>
                                <p><strong>Coordinator Email:</strong> <code className="bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono font-bold">{createdClubCredentials.facultyEmail}</code></p>
                                <p><strong>Default Password:</strong> <code className="bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono font-bold">{createdClubCredentials.defaultPassword}</code> <span className="text-neutral-400">(or existing password if already registered)</span></p>
                            </div>
                        </div>

                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl flex items-start gap-2.5">
                            <Mail size={15} className="text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                                Onboarding emails with direct login buttons have been dispatched to both <span className="font-bold">{createdClubCredentials.clubEmail}</span> and <span className="font-bold">{createdClubCredentials.facultyEmail}</span>.
                            </p>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                onClick={() => setCreatedClubCredentials(null)}
                                className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-bold rounded-xl hover:bg-orange-600 dark:hover:bg-orange-600 dark:hover:text-white transition-colors cursor-pointer"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Modal: Edit Club */}
            {isEditModalOpen && editingClub && (
                <Modal onClose={() => { setIsEditModalOpen(false); setEditingClub(null); }} title="Edit Registered Club">
                    <form onSubmit={handleUpdateClub} className="space-y-4 pt-2">
                        <ModalFormField label="Club Name" name="clubName" defaultValue={editingClub.clubName} required />
                        <ModalFormField label="Faculty Coordinator Name" name="facultyName" defaultValue={editingClub.facultyName || editingClub.facultyCoordinator?.name} required />
                        <ModalFormField label="Faculty Coordinator Email" name="facultyEmail" type="email" defaultValue={editingClub.facultyEmail || editingClub.facultyCoordinator?.email} required />
                        <ModalFormField label="Club Email Account" name="clubEmail" type="email" defaultValue={editingClub.clubEmail || editingClub.memberships?.[0]?.student?.email} required />

                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={() => { setIsEditModalOpen(false); setEditingClub(null); }} className="px-4 py-2 bg-neutral-100 dark:bg-zinc-800 text-black dark:text-white text-[10px] font-bold uppercase tracking-wider rounded-lg">
                                Cancel
                            </button>
                            <button type="submit" className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-orange-600 dark:hover:bg-orange-600 dark:hover:text-white transition-colors">
                                Save Changes
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Modal: Create Coordinator */}
            {isAddCoordModalOpen && (
                <Modal
                    onClose={() => setIsAddCoordModalOpen(false)}
                    title="Create Coordinator"
                    subtitle="Add faculty coordinator accounts to oversee club activities."
                >
                    <form onSubmit={handleCreateCoord} className="space-y-4 pt-2">
                        <ModalFormField label="Full Name" name="name" placeholder="Full Name" required />
                        <ModalFormField label="Email Address" name="email" type="email" placeholder="Email Address" required />
                        <ModalFormField label="Password" name="password" type="password" placeholder="Password (default: coordinator123)" />

                        <div className="pt-4 flex justify-end gap-3 border-t border-neutral-100 dark:border-zinc-800">
                            <button
                                type="button"
                                onClick={() => setIsAddCoordModalOpen(false)}
                                className="px-4 py-2 bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-bold rounded-xl hover:bg-orange-600 dark:hover:bg-orange-600 dark:hover:text-white transition-colors cursor-pointer"
                            >
                                Create Coordinator
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Edit Coordinator Modal */}
            {isCoordModalOpen && editingCoord && (
                <Modal
                    onClose={() => { setIsCoordModalOpen(false); setEditingCoord(null); }}
                    title="Edit Coordinator"
                    subtitle={`Editing details for ${editingCoord.name}`}
                >
                    <form onSubmit={handleUpdateCoord} className="space-y-4 pt-2">
                        <ModalFormField label="Full Name" name="name" defaultValue={editingCoord.name} required />
                        <ModalFormField label="Email Address" name="email" type="email" defaultValue={editingCoord.email} required />
                        <ModalFormField label="New Password (optional)" name="password" type="password" placeholder="Leave blank to keep current" />
                        <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-zinc-800">
                            <button type="button" onClick={() => { setIsCoordModalOpen(false); setEditingCoord(null); }} className="px-4 py-2 bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-colors">Cancel</button>
                            <button type="submit" className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-bold rounded-xl hover:bg-orange-600 dark:hover:bg-orange-600 dark:hover:text-white transition-colors">Save Changes</button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Edit Venue Modal */}
            {isEditVenueModalOpen && editingVenue && (
                <Modal
                    onClose={() => { setIsEditVenueModalOpen(false); setEditingVenue(null); }}
                    title="Edit Campus Venue"
                    subtitle="Update venue name and availability status"
                >
                    <form onSubmit={handleUpdateVenue} className="space-y-4 pt-2">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1.5">
                                Venue Name <span className="text-orange-600">*</span>
                            </label>
                            <input
                                type="text"
                                value={editingVenue.name}
                                onChange={(e) => setEditingVenue({ ...editingVenue, name: e.target.value })}
                                required
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-[13px] focus:border-orange-600 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1.5">
                                Event Booking Status
                            </label>
                            <select
                                value={editingVenue.isOpen ? 'open' : 'closed'}
                                onChange={(e) => setEditingVenue({ ...editingVenue, isOpen: e.target.value === 'open' })}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-[13px] font-semibold focus:border-orange-600 outline-none cursor-pointer"
                            >
                                <option value="open">Open for Event Booking</option>
                                <option value="closed">Closed / Unavailable</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-zinc-800">
                            <button
                                type="button"
                                onClick={() => { setIsEditVenueModalOpen(false); setEditingVenue(null); }}
                                className="px-4 py-2 bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-bold rounded-xl hover:bg-orange-600 dark:hover:bg-orange-600 dark:hover:text-white transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Add Venue Modal */}
            {isAddVenueModalOpen && (
                <Modal
                    onClose={() => setIsAddVenueModalOpen(false)}
                    title="Add New Campus Venue"
                    subtitle="Create a new venue and set its booking availability"
                >
                    <form onSubmit={handleCreateVenue} className="space-y-4 pt-2">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1.5">
                                Venue Name <span className="text-orange-600">*</span>
                            </label>
                            <input
                                type="text"
                                value={newVenueName}
                                onChange={(e) => setNewVenueName(e.target.value)}
                                placeholder="e.g. Main Auditorium / SAC Ground"
                                required
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-[13px] focus:border-orange-600 outline-none transition-colors text-neutral-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1.5">
                                Initial Availability Status
                            </label>
                            <select
                                value={newVenueIsOpen ? 'open' : 'closed'}
                                onChange={(e) => setNewVenueIsOpen(e.target.value === 'open')}
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-[13px] font-semibold focus:border-orange-600 outline-none cursor-pointer text-neutral-900 dark:text-white"
                            >
                                <option value="open">Open for Event Booking</option>
                                <option value="closed">Closed / Unavailable</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-zinc-800">
                            <button
                                type="button"
                                onClick={() => setIsAddVenueModalOpen(false)}
                                className="px-4 py-2 bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isCreatingVenue}
                                className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-bold rounded-xl hover:bg-orange-600 dark:hover:bg-orange-600 dark:hover:text-white transition-colors disabled:opacity-50"
                            >
                                {isCreatingVenue ? 'Adding...' : 'Add Venue'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════════════
   Sub-components — Minimal Design System
   ═══════════════════════════════════════════════════════════════════════════ */

/** Stat card */
const StatCard = ({ label, value, accent }) => (
    <div className={`p-5 rounded-2xl border transition-colors ${
        accent 
            ? "bg-black dark:bg-white border-black dark:border-white" 
            : "bg-white dark:bg-[#0a0a0a] border-neutral-200 dark:border-zinc-800"
    }`}>
        <p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${
            accent ? "text-neutral-400 dark:text-neutral-500" : "text-neutral-400 dark:text-neutral-500"
        }`}>{label}</p>
        <p className={`text-2xl font-black mt-1 ${
            accent ? "text-orange-500 dark:text-orange-600" : "text-black dark:text-white"
        }`}>{value}</p>
    </div>
);

/** DataTable wrapper */
const DataTable = ({ children }) => (
    <div className="bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full">{children}</table>
        </div>
    </div>
);

/** Table header cell */
const Th = ({ children, align = "left" }) => (
    <th className={`px-5 py-4 text-${align} text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-500`}>
        {children}
    </th>
);

/** Table body cell */
const Td = ({ children, align = "left", className = "" }) => (
    <td className={`px-5 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300 text-${align} ${className}`}>
        {children}
    </td>
);

/** Event type badge */
const TypeBadge = ({ isPaid, fee }) => (
    <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border ${
        isPaid
            ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20'
            : 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20'
    }`}>
        {isPaid ? (fee ? `Paid (₹${fee})` : 'Paid') : 'Free'}
    </span>
);

/** Form input */
const FormInput = ({ name, type = "text", placeholder, required }) => (
    <input 
        name={name} 
        type={type} 
        placeholder={placeholder} 
        required={required} 
        className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-400 dark:border-zinc-800 rounded-xl text-[13px] focus:border-orange-600 dark:focus:border-orange-500 outline-none transition-colors placeholder:text-neutral-500 dark:placeholder:text-neutral-600" 
    />
);

/** Filter select */
const FilterSelect = ({ children, value, onChange }) => (
    <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-[12px] font-bold text-neutral-600 dark:text-neutral-300 focus:border-orange-600 dark:focus:border-orange-500 outline-none transition-colors cursor-pointer"
    >
        {children}
    </select>
);

/** Modal wrapper */
const Modal = ({ onClose, title, subtitle, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
        <div className="bg-white dark:bg-[#0f0f0f] border border-neutral-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-black text-black dark:text-white tracking-tight">{title}</h3>
                    {subtitle && <p className="text-[11px] text-orange-600 dark:text-orange-400 font-semibold mt-0.5 tracking-wide">{subtitle}</p>}
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
                    <X size={18} />
                </button>
            </div>
            {/* Body */}
            <div className="px-6 pb-6">{children}</div>
        </div>
    </div>
);

/** Modal field (read-only) */
const ModalField = ({ label, value, mono, accent }) => (
    <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">{label}</label>
        <p className={`font-semibold text-sm border-b border-neutral-200 dark:border-zinc-800 pb-1.5 ${
            mono ? "font-mono" : ""
        } ${accent ? "text-orange-600 dark:text-orange-400" : "text-black dark:text-white"}`}>
            {value || 'N/A'}
        </p>
    </div>
);

/** Modal form field */
const ModalFormField = ({ label, name, type = "text", defaultValue, placeholder, required }) => (
    <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1.5">{label}</label>
        <input 
            name={name} 
            type={type} 
            defaultValue={defaultValue} 
            placeholder={placeholder} 
            required={required} 
            className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-[13px] focus:border-orange-600 dark:focus:border-orange-500 outline-none transition-colors" 
        />
    </div>
);

export default AdminDashboard;
