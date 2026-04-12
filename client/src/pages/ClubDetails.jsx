import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { InstagramIcon } from "@/components/ui/instagram";
import { LinkedinIcon } from "@/components/ui/linkedin";
import { TwitterIcon } from "@/components/ui/twitter";
import { GithubIcon } from "@/components/ui/github";

const ClubDetails = () => {
  const { slug } = useParams();
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchClubDetails = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/clubs/${slug}`
        );
        setClub(res.data.club);
        setEvents(res.data.events);
        setUser(JSON.parse(localStorage.getItem("user")));
      } catch (err) {
        console.error("Error fetching club details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClubDetails();
  }, [slug]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-neutral-400 uppercase tracking-widest">
            Loading...
          </p>
        </div>
      </div>
    );

  if (!club)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600 font-bold text-lg">Club not found.</p>
      </div>
    );

  const now = new Date();
  const liveEvents = events.filter(
    (e) => new Date(e.startTime) <= now && new Date(e.endTime) >= now
  );
  const upcomingEvents = events.filter((e) => new Date(e.startTime) > now);
  const pastEvents = events.filter((e) => new Date(e.endTime) < now);

  const getBadgeClass = (type) => {
    if (type === "live")
      return "bg-red-50 text-red-600 border-red-300";
    if (type === "upcoming")
      return "bg-green-50 text-green-600 border-green-300";
    return "bg-neutral-100 text-neutral-500 border-neutral-300";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    const day = date.getDate();
    const month = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    const time = date.toLocaleString("default", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${time}, ${day} ${month} ${year}`;
  };

  const EventCard = ({ event, type }) => {
    const badgeLabel =
      type === "live" ? "Live" : type === "upcoming" ? "Upcoming" : "Past";
    const actionLabel = type === "upcoming" ? "Register Now →" : type === "past" ? "View Recap →" : "View Details →";

    return (
      <Link
        to={`/event/${event.slug || event._id}`}
        className={`group flex flex-col bg-white border-2 rounded-sm p-4 gap-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm
          ${type === "live" ? "border-orange-500" : "border-gray-200 hover:border-gray-300"}
          ${type === "past" ? "opacity-70" : ""}
        `}
      >
        {/* Top row: badge + date */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span
            className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border rounded-sm flex-shrink-0 ${getBadgeClass(type)}`}
          >
            {badgeLabel}
          </span>
          <span className="text-[12px] font-medium text-neutral-400 uppercase">
            {formatDate(event.startTime)}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-black text-black text-[1rem] leading-snug group-hover:text-orange-600 transition-colors duration-150">
          {event.title}
        </h3>

        {/* Description */}
        <p className="text-[12px] text-neutral-500 line-clamp-2 leading-relaxed flex-1">
          {event.description}
        </p>

        {/* Footer: venue + action */}
        <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-gray-100 mt-auto flex-wrap">
          {event.venue ? (
            <span className="flex items-center gap-1 text-[10.5px] font-medium text-neutral-500 min-w-0">
              <i className="ri-map-pin-2-line text-[11px] flex-shrink-0" />
              <span className="truncate">{event.venue}</span>
            </span>
          ) : (
            <span />
          )}
          <span className="text-[10px] font-bold  tracking-widest text-orange-600 flex-shrink-0">
            {actionLabel}
          </span>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ── Hero ── */}
      <div className="bg-white text-black pt-20 pb-28 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-orange-500/10 blur-[120px] rounded-full -mr-20 -mt-20 pointer-events-none" />
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-8 relative z-10">
          {/* Logo */}
          <div className="w-28 h-28 bg-white border-[2.5px] border-gray-200 rounded-full flex-shrink-0 overflow-hidden">
            {club.clubLogo ? (
              <img
                src={club.clubLogo}
                alt={club.clubName}
                className="w-full h-full object-contain rounded-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-black font-black text-4xl rounded-full">
                {club.clubName.charAt(0)}
              </div>
            )}
          </div>

          {/* Name + desc */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none mb-3 break-words">
              {club.clubName}
            </h1>
            <p className="text-neutral-400 max-w-xl text-sm font-medium leading-relaxed">
              {club.description ||
                "The official student group dedicated to community, innovation, and campus spirit."}
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-12 relative z-20 space-y-4">

        {/* ── Info Row ── */}
        {/* 
          On mobile:   2 equal columns (coordinator + student lead), socials full width below
          On sm+:      3 columns: coordinator | student lead | socials
        */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Faculty Coordinator */}
          <div className="bg-white text-black border-2 border-gray-200 p-4 sm:p-5 rounded-xl min-w-0">
            <p className="text-[10px] font-black tracking-widest text-neutral-400 mb-1 uppercase">
              Faculty Coord.
            </p>
            <p className="font-medium text-sm sm:text-base text-black break-words leading-snug">
              {club.facultyName || "Not Assigned"}
            </p>
          </div>

          {/* Student Lead */}
          <div className="bg-white text-black border-2 border-gray-200 p-4 sm:p-4 rounded-xl min-w-0">
            <p className="text-[10px] font-semibold tracking-widest text-neutral-400 mb-1 uppercase">
              Student Lead
            </p>
            <p className="font-medium text-sm sm:text-base text-black break-words leading-snug">
              {club.studentCoordinators && club.studentCoordinators.length > 0
                ? club.studentCoordinators.join(", ")
                : "Not Assigned"}
            </p>
          </div>

          {/* Socials — spans 2 cols on mobile, 1 col on sm+ */}
          <div className="col-span-2 sm:col-span-1 bg-white border-2 border-gray-200 p-2 sm:p-4 rounded-xl">
            <p className="text-[10px] font-semibold tracking-widest text-neutral-400 mb-1 uppercase">
              Connect with us
            </p>
            <div className="flex flex-wrap gap-2">
              {club.socialLinks?.map((link, i) => {
                const platform = link.platform?.toLowerCase() || "website";
                const iconProps = { className: "w-5 h-5" };
                const href =
                  platform === "whatsapp"
                    ? `https://wa.me/${link.url.replace(/\s+/g, "")}`
                    : link.url;

                const getIcon = () => {
                  if (platform.includes("instagram"))
                    return <InstagramIcon {...iconProps} />;
                  if (platform.includes("linkedin"))
                    return <LinkedinIcon {...iconProps} />;
                  if (
                    platform.includes("twitter") ||
                    platform.includes("x")
                  )
                    return <TwitterIcon {...iconProps} />;
                  if (platform.includes("github"))
                    return <GithubIcon {...iconProps} />;
                  return <i className="ri-links-line text-lg" />;
                };

                return (
                  <a
                    key={i}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 flex items-center justify-center rounded-sm bg-white transition-all hover:-translate-y-0.5 hover:border-gray-400"
                    title={link.platform}
                  >
                    {getIcon()}
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            {
              num: liveEvents.length,
              label: "Live Now",
              accent: liveEvents.length > 0,
            },
            {
              num: upcomingEvents.length,
              label: "Upcoming",
              accent: false,
            },
            { num: pastEvents.length, label: "Past Events", accent: false },
          ].map(({ num, label, accent }) => (
            <div
              key={label}
              className={`border-2 p-4 rounded-sm ${
                accent
                  ? "bg-white border-orange-600"
                  : "bg-white border-gray-200"
              }`}
            >
              <div
                className={`text-3xl font-black leading-none ${
                  accent ? "text-orange-600" : "text-orange-600"
                }`}
              >
                {num}
              </div>
              <div
                className={`text-[9px] font-black uppercase tracking-widest mt-1 ${
                  accent ? "text-orange-600" : "text-neutral-400"
                }`}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Live Events ── */}
        {liveEvents.length > 0 && (
          <section>
            <div className="flex items-center gap-4 my-6">
              <h2 className="text-2xl font-black italic tracking-wider whitespace-nowrap">
                Live Events
              </h2>
              <div className="h-0.5 flex-1 bg-red-600" />
              <span className="relative flex h-3 w-3 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
              {liveEvents.map((e) => (
                <EventCard key={e._id} event={e} type="live" />
              ))}
            </div>
          </section>
        )}

        {/* ── Upcoming Events ── */}
        <section>
          <div className="flex items-center gap-4 my-6">
            <h2 className="text-2xl font-black uppercase italic tracking-wider whitespace-nowrap">
              Upcoming
            </h2>
            <div className="h-0.5 flex-1 bg-black" />
          </div>
          {upcomingEvents.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
              {upcomingEvents.map((e) => (
                <EventCard key={e._id} event={e} type="upcoming" />
              ))}
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-neutral-200 py-10 text-center rounded-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                No upcoming events planned yet.
              </p>
            </div>
          )}
        </section>

        {/* ── Past Events ── */}
        {pastEvents.length > 0 && (
          <section>
            <div className="flex items-center gap-4 my-6">
              <h2 className="text-2xl font-black uppercase italic tracking-wider whitespace-nowrap opacity-60">
                Past Events
              </h2>
              <div className="h-0.5 flex-1 bg-neutral-300" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
              {pastEvents.map((e) => (
                <EventCard key={e._id} event={e} type="past" />
              ))}
            </div>
          </section>
        )}

        {/* ── Gallery ── */}
        <section>
          <div className="flex items-center gap-4 my-6">
            <h2 className="text-2xl font-black uppercase italic tracking-tight whitespace-nowrap">
              Gallery
            </h2>
            <div className="h-0.5 flex-1 bg-black" />
          </div>

          {club.clubGallery && club.clubGallery.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {club.clubGallery.map((image, index) => (
                <div
                  key={index}
                  className="aspect-square overflow-hidden rounded-sm bg-gray-100"
                >
                  <img
                    src={image}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-neutral-200 py-10 text-center rounded-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                No images found. Lagta hai Clubhead ji add krna bhul gye.
              </p>
            </div>
          )}
        </section>

        {/* ── Sponsors ── */}
        {club.clubSponsors && club.clubSponsors.length > 0 && (
          <section>
            <div className="flex items-center gap-4 my-6">
              <h2 className="text-2xl font-black uppercase italic tracking-tight whitespace-nowrap">
                Our Sponsors
              </h2>
              <div className="h-0.5 flex-1 bg-black" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {club.clubSponsors.map((image, index) => (
                <div
                  key={index}
                  className="bg-white border-2 border-gray-100 rounded-sm p-4 flex items-center justify-center h-32 hover:border-gray-300 transition-colors"
                >
                  <img
                    src={image}
                    alt={`Sponsor ${index + 1}`}
                    className="max-w-full max-h-full object-contain hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ClubDetails;