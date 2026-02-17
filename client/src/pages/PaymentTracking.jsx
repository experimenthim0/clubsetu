import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PaymentTracking = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [events, setEvents] = useState([]);
  const [paymentStats, setPaymentStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const storedRole = localStorage.getItem('role');

    if (!storedUser || storedRole !== 'club-head') {
      navigate('/login');
      return;
    }

    setUser(storedUser);
    setRole(storedRole);

    const fetchData = async () => {
      try {
        // Fetch club head's events
        const eventsRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/events/club-head/${storedUser._id}`
        );
        const paidEvents = eventsRes.data.filter(e => e.entryFee > 0);
        setEvents(paidEvents);

        // Fetch payment stats for each paid event
        const statsPromises = paidEvents.map(event =>
          axios.get(`${import.meta.env.VITE_API_URL}/api/payment/event/${event._id}/stats`)
            .then(res => ({ eventId: event._id, ...res.data }))
            .catch(() => ({ eventId: event._id, totalCollected: 0, registrations: [] }))
        );
        const allStats = await Promise.all(statsPromises);
        const statsMap = {};
        allStats.forEach(s => { statsMap[s.eventId] = s; });
        setPaymentStats(statsMap);

        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch payment data:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-black border-t-orange-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || role !== 'club-head') {
    return <div className="text-center mt-10">Access restricted to club heads.</div>;
  }

  const totalRevenue = Object.values(paymentStats).reduce((sum, s) => sum + (s.totalCollected || 0), 0);
  const totalPaidRegistrations = Object.values(paymentStats).reduce((sum, s) => sum + (s.registrations?.length || 0), 0);
  const payoutsCompleted = events.filter(e => e.payoutStatus === 'COMPLETED').length;

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2 text-orange-600">
            <span className="block w-6 h-0.5 bg-orange-600" />
            <span className="text-[11px] font-bold uppercase tracking-widest">{user.clubName}</span>
          </div>
          <h1 className="text-3xl font-black text-black tracking-tight">
            Payment <span className="text-orange-600">Tracking</span>
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Track payments collected from students and payouts received from admin.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white border-2 border-black rounded-sm p-6 shadow-[4px_4px_0px_#000]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Total Revenue Collected</p>
            <p className="text-4xl font-black text-orange-600">₹{totalRevenue}</p>
          </div>
          <div className="bg-white border-2 border-black rounded-sm p-6 shadow-[4px_4px_0px_#000]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Paid Registrations</p>
            <p className="text-4xl font-black text-black">{totalPaidRegistrations}</p>
          </div>
          <div className="bg-white border-2 border-black rounded-sm p-6 shadow-[4px_4px_0px_#000]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Payouts Received</p>
            <p className="text-4xl font-black text-green-600">{payoutsCompleted} / {events.length}</p>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="bg-white border-2 border-black rounded-sm p-12 text-center shadow-[4px_4px_0px_#000]">
            <i className="ri-money-dollar-circle-line text-5xl text-neutral-300" />
            <p className="text-lg font-bold text-neutral-400 mt-4">No paid events yet</p>
            <p className="text-sm text-neutral-400 mt-1">Create an event with an entry fee to start tracking payments.</p>
          </div>
        ) : (
          <>
            {/* Events Table */}
            <div className="bg-white border-2 border-black rounded-sm shadow-[4px_4px_0px_#000] overflow-hidden mb-10">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y-2 divide-black">
                  <thead className="bg-neutral-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-black border-r-2 border-black">Event</th>
                      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-black border-r-2 border-black">Entry Fee</th>
                      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-black border-r-2 border-black">Collected</th>
                      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-black border-r-2 border-black">Registrations</th>
                      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-black border-r-2 border-black">Payout Status</th>
                      <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-black">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black">
                    {events.map(event => {
                      const stats = paymentStats[event._id] || {};
                      return (
                        <tr key={event._id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold border-r-2 border-black">
                            {event.title}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold border-r-2 border-black">
                            ₹{event.entryFee}
                          </td>
                          <td className="px-6 py-4 text-lg font-black text-orange-600 border-r-2 border-black">
                            ₹{stats.totalCollected || 0}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold border-r-2 border-black">
                            {stats.registrations?.length || 0} students
                          </td>
                          <td className="px-6 py-4 border-r-2 border-black">
                            {event.payoutStatus === 'COMPLETED' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-sm border-2 border-green-600">
                                <i className="ri-checkbox-circle-fill text-sm" />
                                Received
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 text-[10px] font-black uppercase tracking-widest rounded-sm border-2 border-yellow-500">
                                <i className="ri-time-line text-sm" />
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setSelectedEvent(selectedEvent === event._id ? null : event._id)}
                              className="px-4 py-2 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-orange-600 transition-colors border-2 border-black cursor-pointer"
                            >
                              {selectedEvent === event._id ? 'Hide' : 'View'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Detail Panel */}
            {selectedEvent && paymentStats[selectedEvent]?.registrations?.length > 0 && (
              <div className="bg-white border-2 border-black rounded-sm shadow-[4px_4px_0px_#000] overflow-hidden mb-10">
                <div className="bg-black text-white p-5">
                  <h3 className="font-black text-lg uppercase tracking-tight">
                    Payment Details — {events.find(e => e._id === selectedEvent)?.title}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Payment ID</th>
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {paymentStats[selectedEvent].registrations.map((reg, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50">
                          <td className="px-6 py-3 text-sm font-medium">{reg.studentName || 'N/A'}</td>
                          <td className="px-6 py-3 text-xs font-mono text-neutral-500">{reg.paymentId || 'N/A'}</td>
                          <td className="px-6 py-3 text-sm font-bold text-orange-600">₹{reg.amountPaid || 0}</td>
                          <td className="px-6 py-3">
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm ${
                              reg.paymentStatus === 'SUCCESS' 
                                ? 'bg-green-50 text-green-700 border border-green-300' 
                                : 'bg-red-50 text-red-600 border border-red-300'
                            }`}>
                              {reg.paymentStatus}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-xs text-neutral-500">
                            {reg.paymentTimestamp ? new Date(reg.paymentTimestamp).toLocaleString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedEvent && (!paymentStats[selectedEvent]?.registrations || paymentStats[selectedEvent].registrations.length === 0) && (
              <div className="bg-white border-2 border-black rounded-sm p-8 text-center shadow-[4px_4px_0px_#000] mb-10">
                <p className="text-neutral-400 font-bold">No payment records found for this event.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentTracking;
