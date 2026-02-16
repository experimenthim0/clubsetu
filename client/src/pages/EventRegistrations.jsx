import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

const EventRegistrations = () => {
    const { id } = useParams();
    const [registrations, setRegistrations] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [regRes, statsRes] = await Promise.all([
                    axios.get(`http://localhost:5000/api/events/${id}/registrations`),
                    axios.get(`http://localhost:5000/api/payment/event/${id}/stats`)
                ]);
                setRegistrations(regRes.data);
                setStats(statsRes.data);
                setLoading(false);
            } catch (err) {
                console.error('Fetch error:', err);
                setError('Failed to fetch registration data');
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-black border-t-orange-600 rounded-full animate-spin" />
        </div>
    );
    if (error) return <div className="p-8 text-center text-red-500 font-bold">{error}</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-black text-black tracking-tight">{stats?.eventTitle || 'Event Registrations'}</h1>
                    <p className="text-neutral-500 text-sm mt-1 uppercase tracking-widest font-bold">Manage your event participants</p>
                </div>
                <Link to="/my-events" className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-black text-black font-bold text-xs uppercase tracking-widest rounded-sm hover:bg-neutral-100 transition-colors">
                    <i className="ri-arrow-left-line" /> Back to Events
                </Link>
            </div>

            {/* Financial Stats Cards */}
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

            {/* Settlement Info Banner */}
            <div className="bg-yellow-50 border-2 border-yellow-400 p-4 rounded-sm flex gap-4 items-start mb-10">
                <i className="ri-information-fill text-yellow-600 text-xl" />
                <div>
                    <p className="text-sm font-bold text-yellow-800">Payment Settlement Information</p>
                    <p className="text-xs text-yellow-700 mt-1 leading-relaxed">
                        Total money collected will be credited to your linked bank account within 7 working days of event completion. 
                        For any payout related queries, please contact <a href="mailto:contact.nikhim@gmail.com" className="underline font-bold">contact.nikhim@gmail.com</a>.
                    </p>
                </div>
            </div>

            {registrations.length === 0 ? (
                <p className="text-gray-500 bg-white p-6 rounded-lg shadow">No students registered yet.</p>
            ) : (
                <div className="bg-white shadow overflow-hidden rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Student
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Roll No
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Socials
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Registered At
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {registrations.map(reg => (
                                <tr key={reg._id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{reg.student?.name || 'Unknown'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{reg.student?.rollNo || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{reg.student?.email || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
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
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            reg.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {reg.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(reg.timestamp).toLocaleDateString()}
                                    </td>
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
