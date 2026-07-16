import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ParticipationStatus } from '../types/index';

const EventRegistrations = () => {
    const { id } = useParams();
    const [registrations, setRegistrations] = useState([]);
    const [stats, setStats] = useState(null);
    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('individual');
    const [expandedTeams, setExpandedTeams] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [regRes, statsRes, eventRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/api/events/${id}/registrations`),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/payment/event/${id}/stats`),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/events/${id}`),
                ]);
                const data = regRes.data;
                setRegistrations(data.participations || (Array.isArray(data) ? data : []));
                setStats(statsRes.data);
                setEventData(eventRes.data);
                setLoading(false);
            } catch (err) {
                console.error('Fetch error:', err);
                setError('Failed to fetch registration data');
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const customFields = eventData?.customFields || [];

    // ── Helpers ────────────────────────────────────────────────────────────
    const getFormResponse = (reg, label) => {
        const responses = reg.formResponses || {};
        return responses instanceof Map ? responses.get(label) : responses[label];
    };

    const filteredRegistrations = (Array.isArray(registrations) ? registrations : []).filter(reg => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        const name = (reg.student?.name || reg.externalName || '').toLowerCase();
        const rollNo = (reg.student?.rollNo || '').toLowerCase();
        const email = (reg.student?.email || reg.externalEmail || '').toLowerCase();
        const branch = (reg.student?.branch || '').toLowerCase();
        const externalEmail = (reg.externalEmail || '').toLowerCase();
        const externalName = (reg.externalName || '').toLowerCase();
        // Also match team name and team leader name for team registrations
        const teamName = (reg.team?.teamName || '').toLowerCase();
        const leaderName = (reg.team?.leader?.name || '').toLowerCase();
        return name.includes(q) || rollNo.includes(q) || email.includes(q) || branch.includes(q)
            || externalEmail.includes(q) || externalName.includes(q)
            || teamName.includes(q) || leaderName.includes(q);
    });

    // Individual registrations: only entries with no teamId
    const individualRegs = filteredRegistrations.filter(r => !r.teamId);

    // Build teamMap from ALL registrations (not filtered) so member lists are always complete,
    // then filter teams by the search query matching team name, leader name, or any member's details.
    const allRegsArr = Array.isArray(registrations) ? registrations : [];
    const fullTeamMap = {};
    allRegsArr.forEach(r => {
        if (r.teamId && r.team) {
            if (!fullTeamMap[r.teamId]) {
                fullTeamMap[r.teamId] = {
                    id: r.teamId,
                    teamName: r.team.teamName,
                    leader: r.team.leader,
                    createdAt: r.createdAt || r.timestamp,
                    status: r.status,
                    members: []
                };
            }
            fullTeamMap[r.teamId].members.push(r);
        }
    });

    // Filter teams: a team passes if the query matches team name, leader, or any member
    const teamRegs = Object.values(fullTeamMap).filter(team => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        if ((team.teamName || '').toLowerCase().includes(q)) return true;
        if ((team.leader?.name || '').toLowerCase().includes(q)) return true;
        return team.members.some(m =>
            (m.student?.name || m.externalName || '').toLowerCase().includes(q) ||
            (m.student?.rollNo || '').toLowerCase().includes(q) ||
            (m.student?.email || m.externalEmail || '').toLowerCase().includes(q) ||
            (m.student?.branch || '').toLowerCase().includes(q)
        );
    });

    const toggleTeam = (teamId) => {
        setExpandedTeams(prev => ({ ...prev, [teamId]: !prev[teamId] }));
    };

    // ── Export to Excel (CSV) ─────────────────────────────────────────────
    const handleExportExcel = () => {
        const isTeamEvent = eventData?.registrationType === 'team' || eventData?.registrationType === 'both';
        const allRegsForExport = Array.isArray(registrations) ? registrations : [];

        const escapeCell = (cell) => {
            const str = String(cell ?? '').replace(/"/g, '""');
            return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
        };

        let csvContent = '';
        const BOM = '\uFEFF';

        if (isTeamEvent) {
            const headers = [
                'S.No',
                'Registration Type',
                'Team Name',
                'Role in Team',
                'Name',
                'Roll No',
                'Email',
                'Branch',
                'Year',
                'Program',
                'Status',
                'Registered At',
                'Amount Paid',
                'GitHub',
                'LinkedIn',
                'X (Twitter)',
                'Portfolio',
                ...customFields.map(cf => cf.label),
            ];

            const rows = [];
            let serialNo = 1;

            // 1. Individual registrations
            const indivRegs = allRegsForExport.filter(r => !r.teamId);
            indivRegs.forEach((reg) => {
                rows.push([
                    serialNo++,
                    'Individual',
                    '',
                    'N/A',
                    reg.student?.name || reg.externalName || '',
                    reg.student?.rollNo || '',
                    reg.student?.email || reg.externalEmail || '',
                    reg.student?.branch || '',
                    reg.student?.year || '',
                    reg.student?.program || '',
                    reg.status || '',
                    reg.timestamp ? new Date(reg.timestamp).toLocaleString() : '',
                    reg.amountPaid || 0,
                    reg.student?.githubProfile || '',
                    reg.student?.linkedinProfile || '',
                    reg.student?.xProfile || '',
                    reg.student?.portfolioUrl || '',
                    ...customFields.map(cf => getFormResponse(reg, cf.label) || ''),
                ]);
            });

            // 2. Team registrations
            const allTeams = Object.values(fullTeamMap);
            allTeams.forEach((team) => {
                team.members.forEach((m) => {
                    const isLeader = m.studentId === team.leader?.id;
                    rows.push([
                        serialNo++,
                        'Team',
                        team.teamName || '',
                        isLeader ? 'Leader' : 'Member',
                        m.student?.name || m.externalName || '',
                        m.student?.rollNo || '',
                        m.student?.email || m.externalEmail || '',
                        m.student?.branch || '',
                        m.student?.year || '',
                        m.student?.program || '',
                        team.status || '',
                        team.createdAt ? new Date(team.createdAt).toLocaleString() : '',
                        m.amountPaid || 0,
                        m.student?.githubProfile || '',
                        m.student?.linkedinProfile || '',
                        m.student?.xProfile || '',
                        m.student?.portfolioUrl || '',
                        ...customFields.map(cf => getFormResponse(m, cf.label) || ''),
                    ]);
                });
            });

            csvContent = [
                headers.map(escapeCell).join(','),
                ...rows.map(row => row.map(escapeCell).join(',')),
            ].join('\n');
        } else {
            // Pure individual event
            const headers = [
                'S.No', 'Name', 'Roll No', 'Email', 'Branch', 'Year', 'Program',
                'External Name', 'External Email',
                'Status', 'Registered At', 'Amount Paid',
                'GitHub', 'LinkedIn', 'X (Twitter)', 'Portfolio',
                ...customFields.map(cf => cf.label),
            ];

            const rows = allRegsForExport.map((reg, idx) => [
                idx + 1,
                reg.student?.name || reg.externalName || '',
                reg.student?.rollNo || '',
                reg.student?.email || reg.externalEmail || '',
                reg.student?.branch || '',
                reg.student?.year || '',
                reg.student?.program || '',
                reg.externalName || '',
                reg.externalEmail || '',
                reg.status || '',
                reg.timestamp ? new Date(reg.timestamp).toLocaleString() : '',
                reg.amountPaid || 0,
                reg.student?.githubProfile || '',
                reg.student?.linkedinProfile || '',
                reg.student?.xProfile || '',
                reg.student?.portfolioUrl || '',
                ...customFields.map(cf => getFormResponse(reg, cf.label) || ''),
            ]);

            csvContent = [
                headers.map(escapeCell).join(','),
                ...rows.map(row => row.map(escapeCell).join(',')),
            ].join('\n');
        }

        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const eventTitle = (eventData?.title || 'event').replace(/[^a-zA-Z0-9]/g, '_');
        link.download = `${eventTitle}_registrations.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a]">
            <div className="w-10 h-10 border-4 border-neutral-200 dark:border-neutral-800 border-t-orange-600 rounded-full animate-spin" />
        </div>
    );
    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a]">
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 p-6 rounded-2xl text-center text-red-600 dark:text-red-400 font-bold max-w-md">
                <i className="ri-error-warning-line text-3xl block mb-2" />
                {error}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] transition-colors duration-300">
            <div className="max-w-[95vw] xl:max-w-[1400px] mx-auto px-4 md:px-6 py-10">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-black dark:text-white tracking-tight">
                            {eventData?.title || 'Event Registrations'}
                        </h1>
                        <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
                            Manage event participants and monitor check-ins
                        </p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={handleExportExcel}
                            disabled={registrations.length === 0}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <i className="ri-file-excel-2-line text-sm" /> Export Excel
                        </button>
                        <Link
                            to="/my-events"
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-neutral-900 text-black dark:text-white border border-neutral-200 dark:border-neutral-800 font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
                        >
                            <i className="ri-arrow-left-line text-sm" /> Back
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                {eventData && (() => {
                    const eventHasStarted = eventData.startTime && new Date(eventData.startTime) < new Date();
                    const isTeamEvent = eventData?.registrationType === 'team' || eventData?.registrationType === 'both';
                    // Count teams as single units; individual rows counted separately
                    const indivCount = (Array.isArray(registrations) ? registrations : []).filter(r => !r.teamId).length;
                    const teamCount = Object.keys(fullTeamMap).length;
                    const registeredCount = isTeamEvent ? indivCount + teamCount : registrations.length;
                    const attendedCount = eventHasStarted
                        ? (Array.isArray(registrations) ? registrations : []).filter(r => r.status === 'ATTENDED').length
                        : 0;
                    const entryFee = eventData.entryFee ?? 0;
                    const totalCollected = stats?.totalCollected ?? stats?.totalMoneyCollected ?? 0;
                    const paidRegistrations = stats?.paidRegistrations ?? registrations.filter(r => r.amountPaid > 0).length;

                    return (
                        <div className={`grid grid-cols-1 ${entryFee > 0 ? 'sm:grid-cols-2 lg:grid-cols-4' : (eventHasStarted ? 'sm:grid-cols-2' : 'grid-cols-1')} gap-5 mb-8`}>
                            <div className="bg-white dark:bg-neutral-900 p-6 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">
                                    Total Registered
                                </p>
                                <p className="text-3xl font-black text-black dark:text-white">{registeredCount}</p>
                                <p className="text-[11px] text-neutral-500 mt-2">
                                    {isTeamEvent
                                        ? `${teamCount} team${teamCount !== 1 ? 's' : ''} · ${indivCount} individual${indivCount !== 1 ? 's' : ''}`
                                        : `out of ${eventData.totalSeats || 'unlimited'} seats`
                                    }
                                </p>
                            </div>

                            {eventHasStarted && (
                                <div className="bg-white dark:bg-neutral-900 p-6 border border-green-200 dark:border-green-900/40 rounded-2xl shadow-sm">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-green-600 mb-1">
                                        Attended
                                    </p>
                                    <p className="text-3xl font-black text-green-600">{attendedCount}</p>
                                    <p className="text-[11px] text-neutral-500 mt-2">
                                        {registeredCount > 0 ? Math.round((attendedCount / registeredCount) * 100) : 0}% check-in rate
                                    </p>
                                </div>
                            )}

                            {entryFee > 0 && (
                                <>
                                    <div className="bg-white dark:bg-neutral-900 p-6 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">
                                            Money Collected
                                        </p>
                                        <p className="text-3xl font-black text-orange-600">
                                            ₹{totalCollected}
                                        </p>
                                        <p className="text-[11px] text-neutral-500 mt-2">
                                            from {paidRegistrations} paid entries
                                        </p>
                                    </div>

                                    <div className="bg-orange-600 p-6 rounded-2xl text-white shadow-sm">
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">
                                            Entry Fee
                                        </p>
                                        <p className="text-3xl font-black">₹{entryFee}</p>
                                        <p className="text-[11px] opacity-80 mt-2">per student</p>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })()}

                {/* Settlement Info */}
                {stats && stats.entryFee > 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/40 p-4 rounded-xl flex gap-3 items-start mb-8">
                        <i className="ri-information-fill text-yellow-600 dark:text-yellow-500 text-lg mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-yellow-800 dark:text-yellow-400">Payment Settlement Information</p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-1 leading-relaxed">
                                Total money collected will be credited to your linked bank account within 7 working days of event completion.
                                For payout queries, contact <a href="mailto:contact.nikhim@gmail.com" className="underline font-bold">contact.nikhim@gmail.com</a>.
                            </p>
                        </div>
                    </div>
                )}

                {/* Search Bar */}
                {registrations.length > 0 && (
                    <div className="mb-6">
                        <div className="relative">
                            <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 text-base" />
                            <input
                                type="text"
                                placeholder={activeTab === 'team' ? 'Search by team name, leader, member name, roll no…' : 'Search by name, roll no, email, or branch…'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-10 py-3 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 text-black dark:text-white text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all placeholder:text-neutral-400"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer">
                                    <i className="ri-close-line text-lg" />
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2 font-medium">
                            {activeTab === 'team'
                                ? `Showing ${teamRegs.length} of ${Object.keys(fullTeamMap).length} teams`
                                : `Showing ${individualRegs.length} of ${allRegsArr.filter(r => !r.teamId).length} individual registrations`
                            }
                        </p>
                    </div>
                )}

                {/* Tabs selection if event supports team registration */}
                {(eventData?.registrationType === 'team' || eventData?.registrationType === 'both') && (
                    <div className="flex border-b border-neutral-200 dark:border-neutral-850 mb-6">
                        <button
                            onClick={() => setActiveTab('individual')}
                            className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                                activeTab === 'individual'
                                    ? 'border-orange-600 text-orange-600 font-extrabold'
                                    : 'border-transparent text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300'
                            } bg-transparent border-0 outline-none`}
                        >
                            Individual Registrations ({individualRegs.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('team')}
                            className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                                activeTab === 'team'
                                    ? 'border-orange-600 text-orange-600 font-extrabold'
                                    : 'border-transparent text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300'
                            } bg-transparent border-0 outline-none`}
                        >
                            Team Registrations ({teamRegs.length})
                        </button>
                    </div>
                )}

                {/* Registrations List / Table */}
                {registrations.length === 0 ? (
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 rounded-2xl text-center text-neutral-500">
                        No students registered yet.
                    </div>
                ) : activeTab === 'team' && (eventData?.registrationType === 'team' || eventData?.registrationType === 'both') ? (
                    <div className="space-y-4">
                        {teamRegs.map((team, idx) => {
                            const isExpanded = !!expandedTeams[team.id];
                            return (
                                <div key={team.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
                                    {/* Header */}
                                    <div
                                        onClick={() => toggleTeam(team.id)}
                                        className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-850/40 transition-colors cursor-pointer"
                                    >
                                        <div className="text-left">
                                            <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                                                Team: <span className="text-orange-600 font-extrabold">{team.teamName}</span>
                                            </h4>
                                            <p className="text-[11px] text-neutral-500 mt-1">
                                                Leader: <span className="font-semibold">{team.leader?.name}</span> • {team.members.length} members
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-[11px] text-neutral-400 font-mono">
                                                Registered: {new Date(team.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                            <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-lg ${
                                                team.status === 'CONFIRMED' || team.status === 'REGISTERED'
                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/25 dark:text-emerald-450'
                                                    : 'bg-orange-50 text-orange-700 dark:bg-orange-950/25 dark:text-orange-450'
                                            }`}>
                                                {team.status}
                                            </span>
                                            <i className={`ri-arrow-${isExpanded ? 'up' : 'down'}-s-line text-xl text-neutral-400`} />
                                        </div>
                                    </div>

                                    {/* Expandable Table */}
                                    {isExpanded && (
                                        <div className="border-t border-neutral-100 dark:border-neutral-800 overflow-x-auto">
                                            <table className="min-w-full divide-y divide-neutral-100 dark:divide-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/20">
                                                <thead className="bg-neutral-50/80 dark:bg-neutral-950/80">
                                                    <tr>
                                                        <th className="px-5 py-3 text-left text-[10px] font-bold text-neutral-500 dark:text-neutral-405 uppercase tracking-wider">Role</th>
                                                        <th className="px-5 py-3 text-left text-[10px] font-bold text-neutral-500 dark:text-neutral-405 uppercase tracking-wider">Name</th>
                                                        <th className="px-5 py-3 text-left text-[10px] font-bold text-neutral-500 dark:text-neutral-405 uppercase tracking-wider">Roll No</th>
                                                        <th className="px-5 py-3 text-left text-[10px] font-bold text-neutral-500 dark:text-neutral-405 uppercase tracking-wider">Acaedmic Info</th>
                                                        <th className="px-5 py-3 text-left text-[10px] font-bold text-neutral-500 dark:text-neutral-405 uppercase tracking-wider">Status</th>
                                                        {customFields.map((cf, i) => (
                                                            <th key={`team-cf-${i}`} className="px-5 py-3 text-left text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                                                                {cf.label}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
                                                    {team.members.map((m) => {
                                                        const isLeader = m.studentId === team.leader?.id;
                                                        return (
                                                            <tr key={m.id} className="hover:bg-neutral-100/30 dark:hover:bg-neutral-850/20 transition-colors">
                                                                <td className="px-5 py-3 font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider text-[10px] text-left">
                                                                    {isLeader ? (
                                                                        <span className="text-orange-600 font-extrabold bg-orange-50 dark:bg-orange-950/20 border border-orange-200/50 rounded px-1.5 py-0.5">Leader</span>
                                                                    ) : (
                                                                        <span className="text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">Member</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-5 py-3 text-left">
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold text-neutral-800 dark:text-neutral-200">{m.student?.name}</span>
                                                                        <span className="text-neutral-400 dark:text-neutral-500 text-[10px] font-mono mt-0.5">{m.student?.email}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-5 py-3 font-mono text-left">{m.student?.rollNo || '-'}</td>
                                                                <td className="px-5 py-3 text-neutral-550 dark:text-neutral-400 text-left">
                                                                    {m.student?.program} • {m.student?.branch} ({m.student?.year})
                                                                </td>
                                                                <td className="px-5 py-3 text-left">
                                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-405 border-0">
                                                                        {m.status}
                                                                    </span>
                                                                </td>
                                                                {customFields.map((cf, i) => {
                                                                    const val = getFormResponse(m, cf.label);
                                                                    return (
                                                                        <td key={`team-cf-val-${i}`} className="px-5 py-3 text-neutral-600 dark:text-neutral-350 text-left">
                                                                            {cf.type === 'url' && val ? (
                                                                                <a href={val} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 underline font-semibold">Link</a>
                                                                            ) : val || '-'}
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-neutral-100 dark:divide-neutral-800">
                                <thead className="bg-neutral-50 dark:bg-neutral-950">
                                    <tr>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">#</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Student Details</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Roll No</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Program / Academics</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Registered At</th>
                                        {customFields.map((cf, i) => (
                                            <th key={`cf-${i}`} className="px-5 py-3.5 text-left text-xs font-semibold text-orange-600 uppercase tracking-wider">
                                                {cf.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {individualRegs.map((reg, idx) => {
                                        const isInternal = !!reg.student;
                                        const studentName = reg.student?.name || reg.externalName || 'Unknown';
                                        const studentEmail = reg.student?.email || reg.externalEmail || '-';
                                        const rollNo = reg.student?.rollNo || '-';
                                        const programInfo = isInternal
                                            ? `${reg.student.program || '-'} • ${reg.student.branch || '-'} (${reg.student.year || '-'})`
                                            : 'External Participant';

                                        return (
                                            <tr key={reg.id || reg._id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-850/40 transition-colors">
                                                <td className="px-5 py-4 whitespace-nowrap text-xs font-bold text-neutral-400">
                                                    {idx + 1}
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                                                            {studentName}
                                                        </span>
                                                        <span className="text-xs text-neutral-400 dark:text-neutral-500">
                                                            {studentEmail}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap font-mono text-sm text-neutral-600 dark:text-neutral-300">
                                                    {rollNo}
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">
                                                    {programInfo}
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 inline-flex text-[10px] font-bold uppercase tracking-wider rounded-lg ${
                                                        {
                                                            [ParticipationStatus.REGISTERED]: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 border border-blue-200/50 dark:border-blue-900/40',
                                                            [ParticipationStatus.ATTENDED]:   'bg-green-50 dark:bg-green-950/20 text-green-600 border border-green-200/50 dark:border-green-900/40',
                                                            [ParticipationStatus.WAITLISTED]: 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 border border-yellow-200/50 dark:border-yellow-900/40',
                                                            [ParticipationStatus.CANCELLED]:  'bg-red-50 dark:bg-red-950/20 text-red-600 border border-red-200/50 dark:border-red-900/40',
                                                        }[reg.status] || 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600'
                                                    }`}>
                                                        {reg.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                                                    {reg.timestamp ? new Date(reg.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                                                </td>
                                                {customFields.map((cf, i) => {
                                                    const val = getFormResponse(reg, cf.label);
                                                    return (
                                                        <td key={`cf-${i}`} className="px-5 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">
                                                            {cf.type === 'url' && val ? (
                                                                <a href={val} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 underline font-semibold">
                                                                    Link
                                                                </a>
                                                            ) : val || <span className="text-neutral-300 dark:text-neutral-700">-</span>}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventRegistrations;