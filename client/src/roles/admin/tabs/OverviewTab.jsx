import React from 'react';
import { StatCard } from '../components/AdminUI';
import EventDataTable from './EventDataTable';

const OverviewTab = ({
    stats,
    role,
    showYearWise,
    setShowYearWise,
    events,
    clubHeads,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    typeFilter,
    setTypeFilter,
    onDownloadCSV
}) => {
    return (
        <>
            {/* Top 4 KPI Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="Active Events" value={stats?.totalEvents || 0} />
                <StatCard label="Events (Till Today)" value={stats?.totalEventsTillNow || 0} />
                <StatCard label="Total Clubs" value={stats?.totalClubs || 0} />
                <StatCard label="Total Students" value={stats?.totalStudents || 0} />
            </div>

            {/* Year-wise toggle for Admin */}
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

            {/* Event Data Table */}
            <EventDataTable
                events={events}
                clubHeads={clubHeads}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filters={filters}
                setFilters={setFilters}
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                onDownloadCSV={onDownloadCSV}
            />
        </>
    );
};

export default OverviewTab;
