import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedClub, setSelectedClub] = useState(null);
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    useEffect(() => {
        const admin = localStorage.getItem('admin');
        if (!admin) {
            navigate('/admin-secret-login');
            return;
        }

        const fetchStats = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/dashboard-stats`);
                setStats(res.data);
                setLoading(false);
            } catch (err) {
                showNotification('Failed to fetch admin stats', 'error');
                setLoading(false);
            }
        };
        fetchStats();
    }, [navigate, showNotification]);

    const refreshStats = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/dashboard-stats`);
            setStats(res.data);
        } catch (err) {
            console.error('Failed to refresh stats');
        }
    };

    const handleFetchPayoutInfo = async (clubHeadId, eventId) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/club-head/${clubHeadId}`);
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
        localStorage.removeItem('token');
        navigate('/admin-secret-login');
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="w-12 h-12 border-4 border-black border-t-orange-600 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-neutral-50 p-6 lg:p-12">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-black tracking-tight uppercase">Admin Panel</h1>
                        <p className="text-neutral-500 text-sm mt-1 uppercase tracking-widest font-bold">Manage Platform Payouts & Revenue</p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="px-6 py-2 border-2 border-black text-black font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                        Secure Logout
                    </button>
                </div>

                {/* Total Revenue Summary */}
                <div className="bg-orange-600 border-2 border-black p-8 rounded-sm shadow-[8px_8px_0px_#000] mb-12 flex flex-col md:flex-row items-center justify-between text-white">
                    <div className="mb-6 md:mb-0">
                        <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Total Platform Revenue</p>
                        <p className="text-6xl font-black">₹{stats?.totalRevenue || 0}</p>
                    </div>
                    <div className="flex gap-4">
                         <div className="bg-white/10 p-4 border border-white/20 rounded-sm">
                              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Total Events</p>
                              <p className="text-2xl font-black">{stats?.eventStats?.length || 0}</p>
                         </div>
                         <div className="bg-white/10 p-4 border border-white/20 rounded-sm">
                              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Payouts Pending</p>
                              <p className="text-2xl font-black">{stats?.eventStats?.filter(e => e.totalCollected > 0).length || 0}</p>
                         </div>
                    </div>
                </div>

                {/* Events Table */}
                <div className="bg-white border-2 border-black rounded-sm shadow-[8px_8px_0px_#000] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y-2 divide-black">
                            <thead className="bg-neutral-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-black border-r-2 border-black">Club Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-black border-r-2 border-black">Event Title</th>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-black border-r-2 border-black">Amount</th>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-black border-r-2 border-black">Registrations</th>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-black border-r-2 border-black">Deadline</th>
                                    <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-black">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-2 divide-black">
                                {stats?.eventStats?.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-neutral-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold border-r-2 border-black">{item.clubName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold border-r-2 border-black">{item.title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-lg font-black text-orange-600 border-r-2 border-black">₹{item.totalCollected}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold border-r-2 border-black">{item.regCount} students</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-[11px] font-bold text-neutral-500 border-r-2 border-black uppercase tracking-tighter">
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
                            </tbody>
                        </table>
                    </div>
                </div>

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
            </div>
        </div>
    );
};

export default AdminDashboard;
