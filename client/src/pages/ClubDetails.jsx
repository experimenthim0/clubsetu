import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const ClubDetails = () => {
    const { slug } = useParams();
    const [club, setClub] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchClubDetails = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/clubs/${slug}`);
                setClub(res.data.club);
                setEvents(res.data.events);
                setUser(JSON.parse(localStorage.getItem('user')));
            } catch (err) {
                console.error("Error fetching club details:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchClubDetails();
    }, [slug]);

    if (loading) return <div className="text-center py-20">Loading club details...</div>;
    if (!club) return <div className="text-center py-20 text-red-600">Club not found.</div>;

    const now = new Date();
    const liveEvents = events.filter(e => new Date(e.startTime) <= now && new Date(e.endTime) >= now);
    const upcomingEvents = events.filter(e => new Date(e.startTime) > now);
    const pastEvents = events.filter(e => new Date(e.endTime) < now);

    const getBadgeClass = (type) => {
        if (type === 'live') return 'bg-red-100 text-red-600 border-red-400';
        if (type === 'upcoming') return 'bg-green-100 text-green-600 border-green-400';
        return 'bg-gray-100 text-gray-500 border-gray-300';
    };

    const EventCard = ({ event, type, wide = false }) => (
        <Link
            to={`/event/${event.slug || event._id}`}
            className={`block group bg-white border-2 border-black  hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] transition-all p-5
                ${type === 'live' ? 'border-orange-600 shadow-[4px_4px_0px_#ea580c] hover:shadow-[6px_6px_0px_#ea580c]' : ''}
                ${type === 'past' ? 'opacity-90' : ''}
                ${wide ? 'md:col-span-2 md:flex md:items-center md:gap-8' : ''}
            `}
        >
            <div className={wide ? 'flex-1' : ''}>
                <div className="flex justify-between items-start mb-3">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 border rounded-sm ${getBadgeClass(type)}`}>
                        {type === 'live' ? 'Live' : type === 'upcoming' ? 'Upcoming' : 'Past'}
                    </span>
                    <span className="text-[9px] font-bold text-neutral-400 uppercase">
                        {new Date(event.startTime).toLocaleDateString()}
                    </span>
                </div>
                <h3 className={`font-black text-base text-black group-hover:text-orange-600 transition-colors leading-tight mb-2 ${wide ? 'text-xl' : ''}`}>
                    {event.title}
                </h3>
                <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">{event.description}</p>
            </div>
            <div className={`flex items-center justify-between text-[9px] font-black uppercase tracking-wider ${wide ? 'flex-col items-end gap-3 flex-shrink-0' : 'mt-4 pt-3 border-t border-gray-100'}`}>
                <span className="text-neutral-400">{event.venue}</span>
                <span className="text-orange-600">{type === 'past' ? 'View Recap →' : 'Register Now →'}</span>
            </div>
        </Link>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-20">

            {/* ── Hero ── */}
            <div className="bg-black text-white pt-20 pb-28 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 bg-orange-600/20 blur-[120px] rounded-full -mr-20 -mt-20" />
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10 relative z-10">
                    <div className="w-32 h-32 bg-white border-[3px] border-orange-600 p-2 shadow-[8px_8px_0px_rgba(255,255,255,0.08)] flex-shrink-0">
                        {club.clubLogo ? (
                            <img src={club.clubLogo} alt={club.clubName} className="w-full h-full object-contain" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-black font-black text-4xl">
                                {club.clubName.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <div className="inline-block px-3 py-1 bg-orange-600 text-[9px] font-black tracking-wider mb-3">
                            Verified By ClubSetu
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-3 leading-none">
                            {club.clubName}
                        </h1>
                        <p className="text-neutral-400 max-w-xl text-sm font-medium leading-relaxed">
                            {club.description || "The official student group dedicated to community, innovation, and campus spirit."}
                        </p>
                    </div>
                    {user?._id === club._id && (
                        <Link
                            to={`/club/edit/${club._id}`}
                            className="flex-shrink-0 px-5 py-3 bg-white text-black font-black uppercase text-[10px] tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-[5px_5px_0px_#ea580c]"
                        >
                            {!club.isClubAdded ? "Add Club on Website" : "Edit Club Details"}
                        </Link>
                    )}
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="max-w-5xl mx-auto px-6 -mt-12 relative z-20 space-y-4">

                {/* ── Bento Info Row ── */}
                <div className="grid grid-cols-3 gap-4">

                    {/* Coordinator cell — dark */}
                    <div className="bg-black text-white border-2 border-black p-5 ">
                        <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500 mb-1">Faculty Coordinator</p>
                        <p className="font-black text-base text-white">{club.facultyName || "N/A"}</p>
                    </div>
                    <div className="bg-black text-white border-2 border-black p-5 ">
                        <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500 mb-1">Student Lead</p>
                        <p className="font-black text-base text-white"> {club.studentCoordinators && club.studentCoordinators.length > 0 ? club.studentCoordinators.join(", ") : club.name}</p>
                        
                    </div>

                    {/* Socials cell — spans 2 cols */}
                    <div className="col-span-2 bg-white border-2 border-gray-300 p-5 ">
                        <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-3">Connect with us</p>
                        <div className="flex flex-wrap gap-2">
                            {club.socialLinks?.map(link => {
                                const iconMap = {
                                    instagram: 'ri-instagram-line',
                                    linkedin: 'ri-linkedin-fill',
                                    x: 'ri-twitter-x-line',
                                    website: 'ri-global-line',
                                    whatsapp: 'ri-whatsapp-line'
                                };
                                const href = link.platform === 'whatsapp' ? `https://wa.me/${link.url.replace(/\s+/g, '')}` : link.url;
                                return (
                                    <a key={link.platform} href={href} target="_blank" rel="noopener noreferrer"
                                        className="w-10 h-10 flex items-center justify-center border-2 border-black bg-white hover:bg-black hover:text-white transition-all  hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
                                        <i className={`${iconMap[link.platform] || 'ri-links-line'} text-lg`} />
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Stats Row ── */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { num: liveEvents.length, label: 'Live Now', accent: liveEvents.length > 0 },
                        { num: upcomingEvents.length, label: 'Upcoming Events', accent: false },
                        { num: pastEvents.length, label: 'Past Events', accent: false },
                    ].map(({ num, label, accent }) => (
                        <div key={label} className={`border-2 border-gray-400 p-4 rounded-sm  ${accent ? 'bg-orange-600' : 'bg-white'}`}>
                            <div className={`text-3xl font-black leading-none ${accent ? 'text-white' : 'text-orange-600'}`}>{num}</div>
                            <div className={`text-[9px] font-black uppercase tracking-widest mt-1 ${accent ? 'text-orange-100' : 'text-neutral-400'}`}>{label}</div>
                        </div>
                    ))}
                </div>

                {/* ── Live Events ── */}
                {liveEvents.length > 0 && (
                    <section>
                        <div className="flex items-center gap-4 my-6">
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter whitespace-nowrap">Live Events</h2>
                            <div className="h-0.5 flex-1 bg-red-600" />
                            <span className="relative flex h-3 w-3 flex-shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                            </span>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            {liveEvents.map((e, i) => (
                                <EventCard key={e._id} event={e} type="live" wide={liveEvents.length === 1} />
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Upcoming Events ── */}
                <section>
                    <div className="flex items-center gap-4 my-6">
                        <h2 className="text-2xl font-black uppercase italic tracking-wider whitespace-nowrap">Upcoming</h2>
                        <div className="h-0.5 flex-1 bg-black" />
                    </div>
                    {upcomingEvents.length > 0 ? (
                        <div className="grid md:grid-cols-2 gap-4">
                            {upcomingEvents.map(e => <EventCard key={e._id} event={e} type="upcoming" />)}
                        </div>
                    ) : (
                        <div className="bg-white border-2 border-dashed border-neutral-200 py-8 text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">No upcoming events planned yet.</p>
                        </div>
                    )}
                </section>

                {/* ── Past Events ── */}
                {pastEvents.length > 0 && (
                    <section className="opacity-60">
                        <div className="flex items-center gap-4 my-6">
                            <h2 className="text-2xl font-black uppercase italic tracking-wider whitespace-nowrap">Past Events</h2>
                            <div className="h-0.5 flex-1 bg-black" />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            {pastEvents.map(e => <EventCard key={e._id} event={e} type="past" />)}
                        </div>
                    </section>
                )}



 <section>
                    <div className="flex items-center gap-4 my-6">
                        <h2 className="text-2xl font-black uppercase italic tracking-wider whitespace-nowrap">Gallery</h2>
                        <div className="h-0.5 flex-1 bg-black" />
                    </div>
                        
                        {club.clubGallery.length > 0 ? (
                            <div className="grid grid-cols-3 gap-4">
                                {club.clubGallery.map((image, index) => (
                                    <img key={index} src={image} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover rounded-xs  hover:scale-105 transition-all duration-300" />
                                ))}
                            </div>
                        ):(
                            <div className="bg-white border-2 border-dashed border-neutral-200 py-8 text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">No image found, Lagta hai Clubhead ji add krna bhul gye.</p>
                            </div>
                        )
                        
                        
                        }
                        
                        
                        {/* <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Coming Soon...</p> */}
                    </section>



                    <section>
                    <div className="flex items-center gap-4 my-6">
                        <h2 className="text-2xl font-black uppercase italic tracking-wider whitespace-nowrap">Our Sponsors</h2>
                        <div className="h-0.5 flex-1 bg-black" />
                    </div>
                        
                        {club.clubSponsors.length > 0 ? (
                            <div className="grid grid-cols-3 gap-4">
                                {club.clubSponsors.map((image, index) => (
                                    <img key={index} src={image} alt={`Sponsor ${index + 1}`} className="w-full h-40 object-contain  rounded-xs  hover:scale-105 transition-all duration-300" />
                                ))}
                            </div>
                        ):(
                            <div className="bg-white border-2 border-dashed border-neutral-200 py-8 text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">No sponsor found, Lagta h unhone kisi or ko sponsor kr diya 😂🤣</p>
                            </div>
                        )

                    }
                        
                        {/* <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Coming Soon...</p> */}
                    </section>
            </div>

            
        </div>
    );
};

export default ClubDetails;