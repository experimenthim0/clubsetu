import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ArrowUpRightIcon } from './ui/arrow-up-right';

const ClubLeaderboard = () => {
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clubsRes, eventsRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/clubs`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/events`)
        ]);
        setClubs(Array.isArray(clubsRes.data) ? clubsRes.data : []);
        setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : []);
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
    <div className="bg-white border-2 border-neutral-200 rounded-[1.5rem] p-4 shadow-sm overflow-hidden relative group">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-80 h-80 bg-orange-50 rounded-full blur-[100px] opacity-40 group-hover:opacity-70 transition-opacity"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
             
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">Live Ranking</span>
            </div>
            <h2 className="text-3xl font-black text-black tracking-wide">Club Leaderboard</h2>
          </div>
          <div className="w-12 h-12 bg-neutral-900 rounded-2xl rotate-3 flex items-center justify-center shadow-lg shadow-black/10">
             <i className="ri-medal-fill text-yellow-400 text-2xl" />
          </div>
        </div>

        <div className="space-y-2">
          {leaderboard.map((club, index) => {
            const isTop3 = index < 3;
            const rankStyles = [
              { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: 'ri-vip-crown-fill', label: 'Champion' },
              { bg: 'bg-neutral-50', border: 'border-neutral-300', text: 'text-neutral-600', icon: 'ri-award-fill', label: 'Runner Up' },
              { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: 'ri-medal-line', label: 'Third Place' }
            ];

            return (
              <div 
                key={club._id} 
                className={`group/item relative flex flex-col p-2 rounded-3xl transition-all duration-500 border-2
                  ${isTop3 ? `${rankStyles[index].bg} ${rankStyles[index].border}` : 'bg-white border-transparent hover:border-neutral-100 hover:bg-neutral-50/50'}
                `}
              >
                {/* Main Content */}
                <div className="flex items-center gap-3">
                  {/* Rank & Podium Icon */}
                  <div className={`w-12 h-12 shrink-0 flex flex-col items-center justify-center rounded-2xl font-black text-lg shadow-sm
                    ${isTop3 ? 'bg-white' : 'bg-neutral-50 text-neutral-400 border border-neutral-100'}
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
                        className="text-[17px] font-black text-black hover:text-orange-600 transition-colors block truncate tracking-tight"
                      >
                        {club.clubName}
                      </Link>
                      
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{club.category || 'Society'}</span>
                       {index === 0 && (
                        <span className="bg-yellow-400 text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wide">Elite</span>
                      )}
                    </div>
                  </div>

                  {/* Counter */}
                  <div className="text-right pr-2">
  <div className="text-2xl font-black text-black leading-none tabular-nums tracking-tighter">
    {club.score}
  </div>

  <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
    Leaderboard Score
  </div>

  <div className="mt-2 text-[11px] text-neutral-500 font-semibold">
     Events: {club.eventCount}
  </div>

  <div className="text-[11px] text-neutral-500 font-semibold">
     Participants:  {club.participantCount} 
  </div>
</div>
                </div>

                {/* Quick View - Reveals on Hover */}
                <div className="max-h-0 overflow-hidden transition-all duration-500 ease-in-out group-hover/item:max-h-40 group-hover/item:mt-4">
                  <div className="pt-4 border-t border-black/5">
                    <div className="flex items-center justify-between mb-3">
                       <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-1">
                         <i className="ri-history-line" /> Recent Activity
                       </span>
                       <Link to={`/club/${club.slug || club._id}`} className="text-[10px] font-bold text-orange-600 hover:underline">Full History →</Link>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {club.recentEvents.length > 0 ? (
                        club.recentEvents.map(event => (
                          <div key={event._id} className="bg-white/80 p-2.5 rounded-xl border border-black/5 shadow-sm">
                            <h4 className="text-[11px] font-bold text-black truncate mb-1">{event.title}</h4>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] text-neutral-400 font-medium">
                                {new Date(event.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm ${
                                event.status === 'ENDED' ? 'bg-neutral-100 text-neutral-500' : 'bg-red-500 text-white'
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

        {/* <Link 
          to="/clubs"
          className="mt-10 w-full py-4 flex items-center justify-center gap-2 bg-neutral-900 hover:bg-black text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-neutral-200"
        >
          View Rankings
          <ArrowUpRightIcon className="w-4 h-4" />
        </Link> */}
      </div>
    </div>
  );
};

export default ClubLeaderboard;
