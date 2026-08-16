import React, { useState } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';
import { useNotification } from '../../../context/NotificationContext';

const CentralOrganizerTab = ({
    centralOrganizer,
    loadingCO,
    fetchCentralOrganizer
}) => {
    const { showNotification } = useNotification();
    const [studentQuery, setStudentQuery] = useState('');
    const [studentSearchResults, setStudentSearchResults] = useState([]);
    const [searchingStudents, setSearchingStudents] = useState(false);
    const [assigningCO, setAssigningCO] = useState(false);

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

    return (
        <div className="space-y-6">
            {/* Status Card */}
            <div className="border border-neutral-200 dark:border-zinc-800 rounded-2xl p-6 bg-white dark:bg-[#0a0a0a]">
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-zinc-800">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 rounded-md">
                                Single Seat Role
                            </span>
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
                            <div className="w-12 h-12 rounded-full bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-black text-lg flex items-center justify-center overflow-hidden">
                                {centralOrganizer.profileImage ? (
                                    <img 
                                        src={centralOrganizer.profileImage} 
                                        alt={centralOrganizer.name} 
                                        className="w-full h-full object-cover rounded-full"
                                    />
                                ) : (
                                    <span>{centralOrganizer.name?.charAt(0).toUpperCase()}</span>
                                )}
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
    );
};

export default CentralOrganizerTab;
