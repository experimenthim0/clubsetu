import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CalendarDropdown from './CalendarDropdown';
import { getColorSync } from 'colorthief';
import { useImageBlob } from '../hooks/useImageBlob';
import { useTheme } from '../context/ThemeContext';

const EventCard = ({ event, onRegister, isRegistered }) => {
    const { title, description, venue, startTime, totalSeats, registeredCount, status, _id, entryFee, registrationDeadline, slug, showWinner } = event;

    const DEFAULT_IMAGE = '/CLUBSETU.png';
    const displayImage = event.imageUrl || DEFAULT_IMAGE;

    const { displayUrl, isBlobLoaded } = useImageBlob(displayImage);
    const { isDark } = useTheme();

    // Color extraction states
    const [rgb, setRgb] = useState(null);
    const [isColorLoaded, setIsColorLoaded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const imgRef = useRef(null);
   

     const fallbackLogo = isDark ? "/darkthemelogo.png" : "/lightthemelogo.png";
      const displayLogo = event.club?.clubLogo || fallbackLogo;
     
    
    const handleImageLoad = () => {
        const imageEl = imgRef.current;
        if (!imageEl) return;
        try {
            if (imageEl.complete && isBlobLoaded) {
                // Use the synchronous getColorSync from ColorThief v3
                const color = getColorSync(imageEl);
                if (color) {
                    const rgbArray = color.array();
                    if (Array.isArray(rgbArray) && rgbArray.length === 3) {
                        setRgb(rgbArray);
                        setIsColorLoaded(true);
                    }
                }
            }
        } catch (error) {
            // Keep console warning clean and minimal to not spam logs
            console.warn('Could not extract color from event image:', error.message);
        }
    };

    useEffect(() => {
        // Reset colors when image changes
        setRgb(null);
        setIsColorLoaded(false);
    }, [event.imageUrl]);

    useEffect(() => {
        const imageEl = imgRef.current;
        if (imageEl && imageEl.complete && isBlobLoaded) {
            handleImageLoad();
        }
    }, [displayUrl, isBlobLoaded]);

    const formattedTime = new Date(startTime).toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const getDeadlineText = () => {
        const dl = new Date(registrationDeadline || startTime);
        const ev = new Date(startTime);
        
        const timeOptions = { hour: '2-digit', minute: '2-digit' };
        const dateOptions = { month: 'short', day: 'numeric' };
        
        const isSameDay = dl.toDateString() === ev.toDateString();
        
        if (isSameDay) {
            return `Reg. by ${dl.toLocaleTimeString('en-US', timeOptions)}`;
        } else {
            return `Reg. by ${dl.toLocaleDateString('en-US', dateOptions)}, ${dl.toLocaleTimeString('en-US', timeOptions)}`;
        }
    };

    const isLive = status === 'LIVE';
    const isEnded = status === 'ENDED';
    const isUpcoming = !isLive && status === 'UPCOMING';
    const isUnlimited = !totalSeats || totalSeats === 0;
    const isFull = !isUnlimited && registeredCount >= totalSeats;
    const seatsText = isUnlimited
        ? ` `
        : `${totalSeats-registeredCount} left`;

    // Construct premium card styles dynamically
    const customStyles = (isHovered && rgb)
        ? {
            backgroundColor: isDark
                ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.15)`
                : `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.08)`,
            boxShadow: isDark
                ? `0 20px 40px -15px rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.25)`
                : `0 20px 40px -15px rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.15)`,
            borderColor: `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.3)`,
          }
        : {
            backgroundColor: isDark ? 'rgb(13, 13, 13)' : 'rgb(255, 255, 255)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgb(229, 231, 235)', // border-gray-200
          };

    const navigate = useNavigate();

    const handleCardClick = (e) => {
        // Prevent navigation if the user is clicking on nested buttons, links, or dropdowns
        if (e.target.closest('button') || e.target.closest('.calendar-dropdown') || e.target.closest('a')) {
            return;
        }
        navigate(`/event/${slug || _id}`);
    };

    return (
        <div 
            style={customStyles}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleCardClick}
            className="border border-neutral-200 dark:border-neutral-800/80 rounded-xl overflow-hidden transition-all duration-500 ease-out hover:-translate-y-1 flex flex-col h-full shadow-sm group cursor-pointer"
        >

            {/* Image */}
            <div className="relative w-full aspect-[21/9] overflow-hidden bg-slate-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800/80">
                <img
                    ref={imgRef}
                    src={displayUrl}
                    alt={title}
                    crossOrigin={isBlobLoaded ? "anonymous" : undefined}
                    onLoad={handleImageLoad}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                        e.target.onerror = null; // prevent infinite loop
                        e.target.src = "/CLUBSETU.png"; // fallback image
                    }}
                />

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                    {isLive && (
                        <span className="inline-flex items-center gap-1.5 bg-orange-600 text-white text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-md animate-pulse">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                            Live
                        </span>
                    )}
                    {!isLive && status === 'UPCOMING' && (
                        <span className="inline-flex items-center bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-900/60 shadow-sm">
                            Upcoming
                        </span>
                    )}
                    {isEnded && (
                        <span className="inline-flex items-center bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-350 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 shadow-sm">
                            Ended
                        </span>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="px-4 pt-2 flex flex-auto flex-col">
                 {(event.club?.clubName || event.createdBy?.clubName) && (
                            <div className="flex items-center min-w-0">
                                 <div className="w-6 h-6 rounded-full overflow-hidden mr-2 border border-neutral-300 dark:border-neutral-700">
                                <img
                                    src={displayLogo}
                                    alt={event.createdBy.clubName}
                                    crossOrigin={isBlobLoaded && event.createdBy.clubLogo ? "anonymous" : undefined}
                                    onLoad={handleImageLoad}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = fallbackLogo;
                                    }}
                                />
                            </div>
                                <span className="truncate  text-orange-600  text-[12px] font-semibold">
                                    {event.club?.clubName || event.createdBy?.clubName}
                                </span>
                            </div>
                        )}
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white leading-tight mb-2 line-clamp-2">{title}</h3>

                {/* Info row */}
                {isEnded && showWinner ? (
                    /* ONLY SHOW WINNERS WHEN ENDED AND showWinner is TRUE */
                    <div className="flex gap-2 mb-2 ">
                        {event.winners && event.winners.length > 0 ? (
                            <div className="flex flex-col gap-2 w-full">
                                {/* Winners Header */}
                                <div className="flex items-center gap-2">
                                    <div className="w-5 flex items-center justify-center shrink-0">
                                        <i className="ri-time-line text-orange-600 text-sm" />
                                    </div>
                                    <span className="font-medium text-neutral-500 dark:text-neutral-200 text-xs">{formattedTime}</span>
                                </div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-5 flex items-center justify-center shrink-0">
                                        <i className="ri-trophy-fill text-orange-600 text-sm" />
                                    </div>
                                    <span className="text-[11px] font-bold tracking-wider text-orange-600 uppercase">Winners</span>
                                </div>
                                {/* Winner Rows */}
                                {event.winners.map((winner, index) => (
                                    <div key={index} className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/40 p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                                winner.rank === 1 ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60' :
                                                winner.rank === 2 ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700' :
                                                'bg-orange-100 dark:bg-orange-950/40 text-orange-855 dark:text-orange-400 border border-orange-200 dark:border-orange-900/60'
                                            }`}>
                                                #{winner.rank}
                                            </span>
                                            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{winner.name}</span>
                                        </div>
                                        {winner.rank === 1 && <i className="ri-medal-fill text-amber-500" />}
                                        {winner.rank === 2 && <i className="ri-medal-fill text-neutral-400" />}
                                        {winner.rank === 3 && <i className="ri-medal-fill text-[#CD7F32]" />}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* Results not yet declared */
                            <div className="flex gap-2 py-2 flex-col text-neutral-600 dark:text-neutral-400">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 flex items-center justify-center shrink-0">
                                        <i className="ri-time-line text-orange-600 text-sm" />
                                    </div>
                                    <span className="font-medium text-xs text-neutral-600 dark:text-neutral-350">{formattedTime}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-5 flex items-center justify-center shrink-0">
                                        <i className="ri-map-pin-line text-orange-600 text-sm" />
                                    </div>
                                    <span className="font-medium text-xs text-neutral-600 dark:text-neutral-350">{venue}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-5 flex items-center justify-center shrink-0">
                                        <i className="ri-trophy-fill text-orange-600 text-sm" />
                                    </div>
                                    <p className="text-sm text-neutral-400 dark:text-neutral-550 italic">Results being finalized...</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    
                    /* SHOW DETAILS WHILE ACTIVE OR IF showWinner IS FALSE */
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                        {/* Temporal Info: Date & Deadline merged (Spans 2 columns) */}
                        <div className="col-span-2 flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-300">
                            <i className="ri-time-line text-neutral-400 dark:text-neutral-500 text-sm shrink-0" />
                            <span className="truncate">
                                {formattedTime} {isEnded ? '(Ended)' : `(${getDeadlineText()})`}
                            </span>
                        </div>

                        {/* Location / Venue */}
                        <div className="flex items-center gap-1.5 min-w-0">
                            <i className="ri-map-pin-line text-neutral-400 dark:text-neutral-500 text-sm shrink-0" />
                            <span className="truncate font-medium text-neutral-700 dark:text-neutral-300">{venue}</span>
                        </div>

                        {/* Host Information */}
                       

                        {/* Seats / Capacity */}
                        <div className="flex items-center gap-1.5 col-span-2 min-w-0">
                            <i className="ri-group-line text-neutral-400 dark:text-neutral-500 text-sm shrink-0" />
                            <span className="truncate font-medium text-neutral-700 dark:text-neutral-300">
                                {isUnlimited ? 'Unlimited Seats' : seatsText}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer: Entry Fee + Action on same line */}
            <div className="px-5 pb-4 mt-auto">
                <div className="flex items-center gap-2 border-t border-neutral-100 dark:border-neutral-800/80 pt-3">
                    {/* Entry fee badge */}
                    {entryFee !== 0 && (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-2 rounded-lg border shrink-0 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900/60"
                      >
                        <i className="ri-money-rupee-circle-line" /> ₹{entryFee}
                      </span>
                    )}

                    {/* Action button */}
                    {isRegistered ? (
                        <Link
                            to={`/event/${slug || _id}`}
                            className="flex-1 block text-center py-2 bg-emerald-50 dark:bg-emerald-950/45 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 rounded-full text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm hover:bg-emerald-100 dark:hover:bg-emerald-950/80 transition-colors"
                        >
                            View Event
                        </Link>
                    ) : (
                         <Link
                            to={`/event/${slug || _id}`}
                            className={`flex-1 block text-center py-2 rounded-full text-xs font-bold  tracking-wider border transition-all cursor-pointer shadow-sm ${
                                (isEnded || isLive)
                                    ? 'bg-neutral-800 dark:bg-neutral-900 text-white border-neutral-800 dark:border-neutral-800 hover:bg-orange-600 hover:border-orange-600 dark:hover:bg-orange-600 dark:hover:border-orange-600'
                                    : isFull
                                        ? 'bg-amber-400 text-neutral-900 border-amber-400 hover:bg-amber-350'
                                        : 'border-orange-600 bg-orange-600 text-white hover:bg-orange-700 hover:border-orange-700'
                            }`}
                        >
                            {(isEnded || isLive) ? 'View Event' : isFull ? 'Join Waitlist' : 'Register Now'}
                        </Link>
                    )}
                    
                    {/* Add to Calendar button for upcoming events */}
                    {isUpcoming && (
                      <CalendarDropdown
                        event={event}
                        btnClassName="p-2 border rounded-lg shadow-sm hover:bg-neutral-150 dark:hover:bg-neutral-900 transition-colors duration-200 shrink-0 flex items-center justify-center border-neutral-200 dark:border-neutral-800/80 h-9 w-9 text-neutral-600 dark:text-neutral-450 cursor-pointer"
                      />
                    )}
                </div>
            </div>
        </div>
    );
};

export default React.memo(EventCard);