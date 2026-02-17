import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

const EventRegistrations = () => {
    const { id } = useParams();
    const [registrations, setRegistrations] = useState([]);
    const [stats, setStats] = useState(null);
    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [regRes, statsRes, eventsRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/api/events/${id}/registrations`),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/payment/event/${id}/stats`),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/events`),
                ]);
                setRegistrations(regRes.data);
                setStats(statsRes.data);
                const found = eventsRes.data.find(e => e._id === id || e.id === id);
                setEventData(found || null);
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

    const filteredRegistrations = registrations.filter(reg => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        const name = (reg.student?.name || '').toLowerCase();
        const rollNo = (reg.student?.rollNo || '').toLowerCase();
        const email = (reg.student?.email || '').toLowerCase();
        const branch = (reg.student?.branch || '').toLowerCase();
        return name.includes(q) || rollNo.includes(q) || email.includes(q) || branch.includes(q);
    });

    // ── Export to Excel (CSV) ─────────────────────────────────────────────
    const handleExportExcel = () => {
        const headers = [
            'S.No', 'Name', 'Roll No', 'Email', 'Branch', 'Year', 'Program',
            'Status', 'Registered At', 'Amount Paid',
            'GitHub', 'LinkedIn', 'X (Twitter)', 'Portfolio',
            ...customFields.map(cf => cf.label),
        ];

        const rows = registrations.map((reg, idx) => [
            idx + 1,
            reg.student?.name || '',
            reg.student?.rollNo || '',
            reg.student?.email || '',
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

        const csvContent = [
            headers.join(','),
            ...rows.map(row =>
                row.map(cell => {
                    const str = String(cell).replace(/"/g, '""');
                    return str.includes(',') || str.includes('"') || str.includes('\n')
                        ? `"${str}"` : str;
                }).join(',')
            ),
        ].join('\n');

        const BOM = '\uFEFF';
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

    // ── Loading ────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-black border-t-orange-600 rounded-full animate-spin" />
        </div>
    );
    if (error) return <div className="p-8 text-center text-red-500 font-bold">{error}</div>;

    return (
        <div className="max-w-[95vw] xl:max-w-[1400px] mx-auto px-4 py-12">
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-black tracking-tight">{stats?.eventTitle || 'Event Registrations'}</h1>
                    <p className="text-neutral-500 text-sm mt-1 uppercase tracking-widest font-bold">Manage your event participants</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportExcel}
                        disabled={registrations.length === 0}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 border-2 border-green-700 text-white font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <i className="ri-file-excel-2-line text-base" /> Export Excel
                    </button>
                    <Link to="/my-events" className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-black text-black font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-neutral-100 transition-colors">
                        <i className="ri-arrow-left-line" /> Back
                    </Link>
                </div>
            </div>

            {/* ── Stats Cards ─────────────────────────────────────────────── */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white p-6 border-2 border-black rounded-sm shadow-[4px_4px_0px_#000]">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Total Registered</p>
                        <p className="text-3xl font-black text-black">{stats.registeredCount}</p>
                        <p className="text-[11px] text-neutral-500 mt-2">out of {stats.totalSeats} seats</p>
                    </div>
                    <div className="bg-white p-6 border-2 border-black rounded-sm shadow-[4px_4px_0px_#EA580C]">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Money Collected</p>
                        <p className="text-3xl font-black text-orange-600">₹{stats.totalMoneyCollected}</p>
                        <p className="text-[11px] text-neutral-500 mt-2">from {stats.paidRegistrations} paid entries</p>
                    </div>
                    <div className="bg-orange-600 p-6 border-2 border-black rounded-sm shadow-[4px_4px_0px_#000] text-white">
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Entry Fee</p>
                        <p className="text-3xl font-black">₹{stats.entryFee}</p>
                        <p className="text-[11px] opacity-80 mt-2">per student</p>
                    </div>
                </div>
            )}

            {/* ── Settlement Banner ───────────────────────────────────────── */}
            <div className="bg-yellow-50 border-2 border-yellow-400 p-4 rounded-sm flex gap-4 items-start mb-8">
                <i className="ri-information-fill text-yellow-600 text-xl" />
                <div>
                    <p className="text-sm font-bold text-yellow-800">Payment Settlement Information</p>
                    <p className="text-xs text-yellow-700 mt-1 leading-relaxed">
                        Total money collected will be credited to your linked bank account within 7 working days of event completion.
                        For any payout related queries, please contact <a href="mailto:contact.nikhim@gmail.com" className="underline font-bold">contact.nikhim@gmail.com</a>.
                    </p>
                </div>
            </div>

            {/* ── Search Bar ──────────────────────────────────────────────── */}
            {registrations.length > 0 && (
                <div className="mb-6">
                    <div className="relative">
                        <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search by name, roll no, email, or branch..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 border-2 border-neutral-200 rounded-sm text-sm focus:border-orange-600 focus:outline-none transition-colors"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black cursor-pointer">
                                <i className="ri-close-line text-lg" />
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-neutral-400 mt-2 font-medium">
                        Showing {filteredRegistrations.length} of {registrations.length} registrations
                    </p>
                </div>
            )}

            {/* ── Registrations Table ─────────────────────────────────────── */}
            {registrations.length === 0 ? (
                <p className="text-gray-500 bg-white p-6 rounded-lg shadow">No students registered yet.</p>
            ) : (
                <div className="bg-white shadow overflow-x-auto rounded-lg border border-neutral-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Socials</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered At</th>
                                {customFields.map((cf, i) => (
                                    <th key={`cf-${i}`} className="px-4 py-3 text-left text-xs font-medium text-orange-600 uppercase tracking-wider">
                                        {cf.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredRegistrations.map((reg, idx) => (
                                <tr key={reg._id} className="hover:bg-orange-50/40 transition-colors">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-neutral-400">{idx + 1}</td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{reg.student?.name || 'Unknown'}</div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{reg.student?.rollNo || '-'}</div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{reg.student?.email || '-'}</div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{reg.student?.branch || '-'}</div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{reg.student?.year || '-'}</div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{reg.student?.program || '-'}</div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="flex gap-3">
                                            {reg.student?.githubProfile && (
                                                <a href={reg.student.githubProfile} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-black transition-colors" title="GitHub">
                                                    <i className="ri-github-fill text-lg"></i>
                                                </a>
                                            )}
                                            {reg.student?.linkedinProfile && (
                                                <a href={reg.student.linkedinProfile} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-700 transition-colors" title="LinkedIn">
                                                    <i className="ri-linkedin-box-fill text-lg"></i>
                                                </a>
                                            )}
                                            {reg.student?.xProfile && (
                                                <a href={reg.student.xProfile} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-black transition-colors" title="X (Twitter)">
                                                    <i className="ri-twitter-x-fill text-lg"></i>
                                                </a>
                                            )}
                                            {reg.student?.portfolioUrl && (
                                                <a href={reg.student.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-orange-600 transition-colors" title="Portfolio">
                                                    <i className="ri-global-line text-lg"></i>
                                                </a>
                                            )}
                                            {!reg.student?.githubProfile && !reg.student?.linkedinProfile && !reg.student?.xProfile && !reg.student?.portfolioUrl && (
                                                <span className="text-xs text-gray-300">-</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            reg.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {reg.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(reg.timestamp).toLocaleDateString()}
                                    </td>
                                    {customFields.map((cf, i) => {
                                        const val = getFormResponse(reg, cf.label);
                                        return (
                                            <td key={`cf-${i}`} className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {cf.type === 'url' && val ? (
                                                    <a href={val} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 underline">
                                                        {val.length > 30 ? val.slice(0, 30) + '...' : val}
                                                    </a>
                                                ) : val || <span className="text-gray-300">-</span>}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default EventRegistrations;
