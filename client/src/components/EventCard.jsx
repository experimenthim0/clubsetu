import React from 'react';
import { Link } from 'react-router-dom';

const EventCard = ({ event, onRegister, isRegistered }) => {
    const { title, description, venue, startTime, totalSeats, registeredCount, status, _id, entryFee, registrationDeadline } = event;

    const formattedTime = new Date(startTime).toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const isLive = status === 'LIVE';
    const isEnded = status === 'ENDED';
    const isUnlimited = !totalSeats || totalSeats === 0;
    const isFull = !isUnlimited && registeredCount >= totalSeats;
    const seatsText = isUnlimited
        ? `${registeredCount} Registered`
        : `${registeredCount} / ${totalSeats}`;

    const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop';
    const displayImage = event.imageUrl || DEFAULT_IMAGE;

    return (
        <div className="bg-white border-2 border-black rounded-sm overflow-hidden shadow-[4px_4px_0px_#0D0D0D] hover:shadow-[6px_6px_0px_#0D0D0D] transition-all hover:-translate-y-0.5 flex flex-col h-full group">

            {/* Image */}
            <div className="h-44 overflow-hidden bg-neutral-100 relative">
                <img
                    src={displayImage}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.classList.add('bg-gradient-to-br', 'from-orange-500', 'to-orange-600');
                        e.target.parentElement.classList.remove('bg-neutral-100');
                    }}
                />
                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                    {isLive && (
                        <span className="inline-flex items-center gap-1.5 bg-orange-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-sm animate-pulse">
                            <span className="w-1.5 h-1.5 bg-white rounded-full" />
                            LIVE
                        </span>
                    )}
                    {!isLive && status === 'UPCOMING' && (
                        <span className="inline-flex items-center bg-yellow-400 text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-sm border border-black">
                            UPCOMING
                        </span>
                    )}
                    {isEnded && (
                        <span className="inline-flex items-center bg-neutral-200 text-neutral-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-sm">
                            ENDED
                        </span>
                    )}
                </div>
                {/* Club Badge */}
                {event.createdBy?.clubName && (
                    <div className="absolute top-3 right-3">
                        <span className="bg-black/70 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm backdrop-blur-sm">
                            {event.createdBy.clubName}
                        </span>
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-black text-black leading-tight mb-2 line-clamp-1">{title}</h3>
                <p className="text-[13px] text-neutral-500 mb-4 line-clamp-2 flex-grow leading-relaxed">{description}</p>

                {/* Info row */}
                <div className="space-y-1.5 text-[12px] text-neutral-600 mb-4">
                    <div className="flex items-center gap-2">
                        <i className="ri-time-line text-orange-600 text-sm" />
                        <span className="font-medium">{formattedTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <i className="ri-map-pin-line text-orange-600 text-sm" />
                        <span className="font-medium">{venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <i className="ri-group-line text-orange-600 text-sm" />
                        <span className="font-medium">
                            {seatsText}
                            {isUnlimited && <span className="ml-1 text-[10px] text-orange-600 font-bold">(Unlimited)</span>}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-orange-600">
                        <i className="ri-timer-line text-sm" />
                        <span className="font-bold text-[11px] uppercase tracking-wide">
                            Ends: {new Date(registrationDeadline || startTime).toLocaleString('en-US', {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer: Entry Fee + Action on same line */}
            <div className="px-5 pb-5">
                <div className="flex items-center gap-3 border-t-2 border-neutral-100 pt-4">
                    {/* Entry fee badge */}
                    <span className={`inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm border-2 shrink-0 ${
                        !entryFee || entryFee === 0
                            ? 'bg-green-50 text-green-700 border-green-300'
                            : 'bg-yellow-50 text-yellow-800 border-yellow-300'
                    }`}>
                        {!entryFee || entryFee === 0 ? (
                            <><i className="ri-gift-line" /> Free</>
                        ) : (
                            <><i className="ri-money-rupee-circle-line" /> ₹{entryFee}</>
                        )}
                    </span>

                    {/* Action button */}
                    {isRegistered ? (
                        <div className="flex-1 text-center py-2 bg-green-50 text-green-700 border-2 border-green-300 rounded-sm text-[11px] font-bold uppercase tracking-widest">
                            ✓ Registered
                        </div>
                    ) : (
                        <Link
                            to={`/events/${_id}`}
                            className={`flex-1 block text-center py-2 rounded-sm text-[11px] font-bold uppercase tracking-widest border-2 transition-all ${
                                isEnded
                                    ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
                                    : isFull
                                        ? 'bg-yellow-400 text-black border-black hover:bg-yellow-300'
                                        : 'bg-black text-white border-black hover:bg-orange-600 hover:border-orange-600'
                            }`}
                        >
                            {isEnded ? 'Ended' : isFull ? 'Waitlist' : 'Register'}
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventCard;
