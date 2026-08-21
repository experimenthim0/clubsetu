import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRightIcon } from './ui/arrow-up-right';
import { getPublicJson } from '../lib/publicDataCache';

const ClubLeaderboard = () => {
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clubsData, eventsData] = await Promise.all([
          getPublicJson('/api/clubs'),
          getPublicJson('/api/events')
        ]);
        setClubs(Array.isArray(clubsData) ? clubsData : []);
        setEvents(Array.isArray(eventsData) ? eventsData : []);
      } catch (err) {
        console.error("Error fetching leaderboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

 const leaderboard = useMemo(() => {
  // Calculate statistics for each club
  const stats = events.reduce((acc, event) => {
    const clubId =
      event.club?._id ||
      (typeof event.club === "string" ? event.club : null) ||
      event.createdBy?._id ||
      (typeof event.createdBy === "string" ? event.createdBy : null);

    if (!clubId) return acc;

    if (!acc[clubId]) {
      acc[clubId] = {
        eventCount: 0,
        participantCount: 0,
      };
    }

    // Count events
    acc[clubId].eventCount++;

    // Count participants
    const participants =
     event.registeredCount || 0;

    acc[clubId].participantCount += participants;

    return acc;
  }, {});

  return clubs
    .map((club) => {
      // Find last 2 events
      const clubEvents = events
        .filter((e) => {
          const cid =
            e.club?._id ||
            e.club ||
            e.createdBy?._id ||
            e.createdBy;

          return cid === club._id;
        })
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
        .slice(0, 2);

      return {
        ...club,
        eventCount: stats[club._id]?.eventCount || 0,
        participantCount: stats[club._id]?.participantCount || 0,

        // Ranking Score
        score:
          (stats[club._id]?.eventCount || 0) +
          (stats[club._id]?.participantCount || 0),

        recentEvents: clubEvents,
      };
    })
    .filter((club) => club.eventCount > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}, [clubs, events]);

  if (loading) {
    return (
      <div className="w-full h-80 flex flex-col items-center justify-center gap-4 bg-white border-2 border-neutral-100 rounded-3xl animate-pulse">
        <div className="w-12 h-12 bg-neutral-50 rounded-full"></div>
        <div className="w-48 h-3 bg-neutral-50 rounded-full"></div>
        <div className="w-32 h-3 bg-neutral-50 rounded-full"></div>
      </div>
    );
  }

  if (leaderboard.length === 0) return null;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[1.5rem] p-6 shadow-sm overflow-hidden relative group">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-80 h-80 bg-orange-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-orange-600 dark:text-orange-500">Live Ranking</span>
            </div>
            <h2 className="text-3xl font-black text-neutral-900 dark:text-white tracking-wide">Club Leaderboard</h2>
          </div>
          <div className="w-12 h-12 bg-neutral-900 dark:bg-neutral-800 rounded-2xl rotate-3 flex items-center justify-center shadow-md shadow-black/10">
             <i className="ri-medal-fill text-amber-400 text-2xl" />
          </div>
        </div>

        <div className="space-y-2.5">
          {leaderboard.map((club, index) => {
            const isTop3 = index < 3;
            const rankStyles = [
              { bg: 'bg-amber-500/10 dark:bg-amber-500/15', border: 'border-amber-400/40 dark:border-amber-500/30', text: 'text-amber-700 dark:text-amber-400', icon: 'ri-vip-crown-fill', label: 'Champion' },
              { bg: 'bg-neutral-500/10 dark:bg-neutral-700/20', border: 'border-neutral-300 dark:border-neutral-700', text: 'text-neutral-700 dark:text-neutral-300', icon: 'ri-award-fill', label: 'Runner Up' },
              { bg: 'bg-orange-500/10 dark:bg-orange-500/15', border: 'border-orange-400/40 dark:border-orange-500/30', text: 'text-orange-700 dark:text-orange-400', icon: 'ri-medal-line', label: 'Third Place' }
            ];

            return (
              <div 
                key={club._id} 
                className={`group/item relative flex flex-col p-3 rounded-2xl transition-all duration-300 border
                  ${isTop3 ? `${rankStyles[index].bg} ${rankStyles[index].border}` : 'bg-neutral-50/70 dark:bg-neutral-850/50 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'}
                `}
              >
                {/* Main Content */}
                <div className="flex items-center gap-3">
                  {/* Rank & Podium Icon */}
                  <div className={`w-11 h-11 shrink-0 flex flex-col items-center justify-center rounded-xl font-black text-base shadow-xs
                    ${isTop3 ? 'bg-white dark:bg-neutral-800' : 'bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700'}
                    ${isTop3 ? rankStyles[index].text : ''}
                  `}>
                    {isTop3 && <i className={`${rankStyles[index].icon} text-[10px] mt-0.5`} />}
                    <span className="leading-none">{index + 1}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link 
                        to={`/club/${club.slug || club._id}`}
                        className="text-[16px] font-black text-neutral-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors block truncate tracking-tight"
                      >
                        {club.clubName}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                       <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">{club.category || 'Society'}</span>
                       {index === 0 && (
                        <span className="bg-amber-400 text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wide">Elite</span>
                      )}
                    </div>
                  </div>

                  {/* Counter */}
                  <div className="text-right pr-1 sm:pr-2 shrink-0">
                    <div className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white leading-none tabular-nums tracking-tighter">
                      {club.score}
                    </div>

                    <div className="text-[8px] sm:text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">
                      Score
                    </div>

                    <div className="mt-1 text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 font-semibold">
                       Events: {club.eventCount}
                    </div>

                    <div className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 font-semibold">
                       Parts: {club.participantCount} 
                    </div>
                  </div>
                </div>

                {/* Quick View - Reveals on Hover */}
                <div className="max-h-0 overflow-hidden transition-all duration-500 ease-in-out group-hover/item:max-h-40 group-hover/item:mt-4">
                  <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center justify-between mb-3">
                       <span className="text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest flex items-center gap-1">
                         <i className="ri-history-line" /> Recent Activity
                       </span>
                       <Link to={`/club/${club.slug || club._id}`} className="text-[10px] font-bold text-orange-600 dark:text-orange-400 hover:underline">Full History →</Link>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {club.recentEvents.length > 0 ? (
                        club.recentEvents.map(event => (
                          <div key={event._id} className="bg-white dark:bg-neutral-800 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-xs">
                            <h4 className="text-[11px] font-bold text-neutral-900 dark:text-white truncate mb-1">{event.title}</h4>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] text-neutral-400 dark:text-neutral-400 font-medium">
                                {new Date(event.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm ${
                                event.status === 'ENDED' ? 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-300' : 'bg-red-500 text-white'
                              }`}>
                                {event.status}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 text-center py-2 text-[10px] text-neutral-400 italic font-medium">No recent events tracked.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ClubLeaderboard;
