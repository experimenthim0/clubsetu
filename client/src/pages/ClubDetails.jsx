import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { InstagramIcon } from "@/components/ui/instagram";
import { LinkedinIcon } from "@/components/ui/linkedin";
import { TwitterIcon } from "@/components/ui/twitter";
import { GithubIcon } from "@/components/ui/github";
import { MessageCircleIcon } from "@/components/ui/message-circle";
import { EarthIcon } from "@/components/ui/earth";
import EventCard from "../components/EventCard";
import { useTheme } from '../context/ThemeContext';
import { getPublicJson } from "../lib/publicDataCache";
import { registerUpdateCallback, unregisterUpdateCallback } from "../lib/cacheManager";

import { ClubMemberRole } from "../types/index.js";

const ClubDetails = () => {
  const { slug } = useParams();
   const { isDark } = useTheme();
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [canEdit, setCanEdit] = useState(false);
  const [isHead, setIsHead] = useState(false);
  const fallbackLogo = isDark ? "/darkthemelogo.png" : "/lightthemelogo.png";
  const [heroLogoSrc, setHeroLogoSrc] = useState(fallbackLogo);

  useEffect(() => {
    if (!club?.clubLogo) {
      setHeroLogoSrc(fallbackLogo);
      return;
    }
    setHeroLogoSrc(fallbackLogo);
    const img = new Image();
    img.src = club.clubLogo;
    img.onload = () => setHeroLogoSrc(club.clubLogo);
    img.onerror = () => setHeroLogoSrc(fallbackLogo);
  }, [club?.clubLogo, fallbackLogo]);

  useEffect(() => {
    const fetchClubDetails = async () => {
      try {
        const clubData = await getPublicJson(
          `${import.meta.env.VITE_API_URL}/api/clubs/${slug}`
        );
        setClub(clubData.club);
        setEvents(clubData.events);

        const storedUser = JSON.parse(localStorage.getItem("user"));
        const role = localStorage.getItem("role");
        setUser(storedUser);

        if (storedUser && (role === "member" || role === "student")) {
          try {
            const regRes = await axios.get(
              `${import.meta.env.VITE_API_URL}/api/events/user/${storedUser.id || storedUser._id}`
            );
            setRegisteredEvents(
              regRes.data.filter((r) => r.eventId).map((r) => r.eventId.id || r.eventId._id)
            );
          } catch (regErr) {
            console.error("Error fetching user registrations:", regErr);
          }
        }

        // Fetch membership to derive RBAC flags
        if (storedUser && res.data.club) {
          const clubId = res.data.club._id || res.data.club.id;
          try {
            const membersRes = await axios.get(
              `${import.meta.env.VITE_API_URL}/api/club-members/${clubId}/members`
            );
            const membership = membersRes.data.find(
              (m) => m.studentId === storedUser.id || m.student?.id === storedUser.id
            );
            setCanEdit(membership?.canEditEvents ?? false);
            setIsHead(membership?.role === ClubMemberRole.CLUB_HEAD);
          } catch {
            // Not a member or fetch failed — no admin controls shown
          }
        }
      } catch (err) {
        console.error("Error fetching club details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClubDetails();
  }, [slug]);

  useEffect(() => {
    if (club) {
      document.title = `${club.clubName} - CampusNode`;
    }
  }, [club]);

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
  const pastEvents = events
    .filter((e) => new Date(e.endTime) < now)
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

  const handleDeleteClub = async () => {
    if (!window.confirm(`Are you sure you want to delete "${club.clubName}"? This action cannot be undone.`)) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/clubs/${club._id || club.id}`);
      window.location.href = '/clubs';
    } catch (err) {
      console.error("Failed to delete club:", err);
      alert(err.response?.data?.message || "Failed to delete club.");
    }
  };

  const getFullEvent = (e) => ({
    ...e,
    club: e.club || { clubName: club.clubName, clubLogo: club.clubLogo },
    status: e.status || (new Date(e.startTime) <= now && new Date(e.endTime) >= now ? 'LIVE' : new Date(e.startTime) > now ? 'UPCOMING' : 'ENDED')
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ── Hero ── */}
      <div className="bg-white text-black pt-20 pb-28 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-orange-500/10 blur-[120px] rounded-full -mr-20 -mt-20 pointer-events-none" />
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-8 relative z-10">
          {/* Logo */}
          <div className="w-28 h-28 bg-white border border-gray-200 rounded-full flex-shrink-0 overflow-hidden">
            <img
              src={heroLogoSrc}
              alt={club.clubName}
              className="w-full h-full object-contain rounded-full"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = fallbackLogo;
              }}
            />
          </div>

          {/* Name + desc */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-none mb-3 break-words">
              {club.clubName}
            </h1>
            <p className="text-neutral-450 max-w-xl text-sm font-medium leading-relaxed">
              {club.description ||
                "The official student group dedicated to community, innovation, and campus spirit."}
            </p>
            {/* Admin action buttons — shown only to members with appropriate permissions */}
            {(canEdit || isHead) && (
              <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
                {canEdit && (
                  <Link
                    to="/create"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition font-semibold text-xs uppercase tracking-wider shadow-sm"
                  >
                    <i className="ri-add-line" /> Create Event
                  </Link>
                )}
                {isHead && (
                  <>
                    <Link
                      to={`/club/edit/${club._id || club.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-neutral-800 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition font-semibold text-xs uppercase tracking-wider shadow-sm"
                    >
                      <i className="ri-settings-3-line" /> Club Settings
                    </Link>
                    <Link
                      to={`/club/${club._id || club.id}/team`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-neutral-800 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition font-semibold text-xs uppercase tracking-wider shadow-sm"
                    >
                      <i className="ri-team-line" /> Manage Members
                    </Link>
                    {/* <button
                      onClick={handleDeleteClub}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition font-semibold text-xs uppercase tracking-wider shadow-sm"
                    >
                      <i className="ri-delete-bin-line" /> Delete Club
                    </button> */}
                  </>
                )}
              </div>
            )}
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
          <div className="bg-white text-black border border-neutral-200 p-4 sm:p-5 rounded-xl min-w-0 shadow-sm">
            <p className="text-[12px] font-semibold tracking-wider text-neutral-400 mb-1">
              Faculty Coord.
            </p>
            <p className="font-semibold text-sm sm:text-base text-neutral-800 break-words leading-snug">
              {club.facultyName || club.facultyCoordinator?.name || "Not Assigned"}
            </p>
          </div>

          {/* Student Lead */}
          <div className="bg-white text-black border border-neutral-200 p-4 sm:p-4 rounded-xl min-w-0 shadow-sm">
            <p className="text-[12px] font-semibold tracking-wider text-neutral-400 mb-1 ">
              Student Lead
            </p>
            <p className="font-semibold text-sm sm:text-base text-neutral-800 break-words leading-snug">
              {club.studentCoordinators && club.studentCoordinators.length > 0
                ? club.studentCoordinators.join(", ")
                : "Not Assigned"}
            </p>
          </div>

          {/* Socials — spans 2 cols on mobile, 1 col on sm+ */}
          
          <div className="col-span-2 sm:col-span-1 bg-white border border-neutral-200 p-2 sm:p-4 rounded-xl shadow-sm">
            <p className="text-[12px] font-semibold tracking-wider text-neutral-400 mb-1 ">
              Connect with us
            </p>
            {/* <div className="flex flex-wrap gap-2">
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
                  if (platform.includes("website"))
                    return <EarthIcon {...iconProps} />;
                  if (platform.includes("whatsapp"))
                    return <MessageCircleIcon {...iconProps} />;
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
                    className="w-9 h-9 flex items-center justify-center rounded-l hover:border-neutral-300 transition-all"
                    title={link.platform}
                  >
                    {getIcon()}
                  </a>
                );
              })}
            </div> */}
             <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                {club.socialLinks.map((link, i) => {
                  const platform = link.platform?.toLowerCase() || "website";
                  const iconProps = { className: "w-4 h-4" };

                  const getIcon = () => {
                    if (platform.includes("instagram")) return <InstagramIcon {...iconProps} size={28}/>;
                    if (platform.includes("linkedin")) return <LinkedinIcon {...iconProps} size={28}/>;
                    if (platform.includes("twitter") || platform.includes("x")) return <TwitterIcon {...iconProps} size={28}/>;
                    if (platform.includes("github")) return <GithubIcon {...iconProps} size={28}/>;
                    if (platform.includes("whatsapp")) return <MessageCircleIcon {...iconProps} size={28}/>;
                    if (platform.includes("website")) return <EarthIcon {...iconProps} size={28}/>;
                    return <i className="ri-links-line text-sm" />;
                  };

                  return (
                    <a
                      key={link._id || i}
                      href={platform === "whatsapp" ? `https://wa.me/${link.url.replace(/\s+/g, "")}` : link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg  flex items-center justify-center text-neutral-600 dark:text-neutral-300 transition-all duration-300"
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
              className={`border p-4 rounded-xl shadow-sm transition-all duration-300 ${
                accent
                  ? "bg-white border-orange-500 ring-1 ring-orange-500"
                  : "bg-white border-neutral-200"
              }`}
            >
              <div
                className="text-3xl font-bold leading-none text-orange-600"
              >
                {num}
              </div>
              <div
                className={`text-[10px] font-bold uppercase tracking-wider mt-1.5 ${
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
              <h2 className="text-xl font-bold tracking-tight text-neutral-900 whitespace-nowrap">
                Live Events
              </h2>
              <div className="h-[1px] flex-1 bg-red-200" />
              <span className="relative flex h-3 w-3 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveEvents.map((e) => (
                <EventCard
                  key={e._id || e.id}
                  event={getFullEvent(e)}
                  isRegistered={registeredEvents.includes(e._id || e.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Upcoming Events ── */}
        <section>
          <div className="flex items-center gap-4 my-6">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 whitespace-nowrap">
              Upcoming
            </h2>
            <div className="h-[1px] flex-1 bg-neutral-200" />
          </div>
          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((e) => (
                <EventCard
                  key={e._id || e.id}
                  event={getFullEvent(e)}
                  isRegistered={registeredEvents.includes(e._id || e.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-dashed border-neutral-200 py-10 text-center rounded-xl">
              <p className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
                No upcoming events planned yet.
              </p>
            </div>
          )}
        </section>

        {/* ── Past Events ── */}
        {pastEvents.length > 0 && (
          <section>
            <div className="flex items-center gap-4 my-6">
              <h2 className="text-xl font-bold tracking-tight text-neutral-900 whitespace-nowrap opacity-60">
                Past Events
              </h2>
              <div className="h-[1px] flex-1 bg-neutral-200" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.map((e) => (
                <EventCard
                  key={e._id || e.id}
                  event={getFullEvent(e)}
                  isRegistered={registeredEvents.includes(e._id || e.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Gallery ── */}
        <section>
          <div className="flex items-center gap-4 my-6">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 whitespace-nowrap">
              Gallery
            </h2>
            <div className="h-[1px] flex-1 bg-neutral-200" />
          </div>

          {club.clubGallery && club.clubGallery.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {club.clubGallery.map((image, index) => (
                <div
                  key={index}
                  className="aspect-square overflow-hidden rounded-xl bg-gray-100 border border-neutral-250/50 shadow-sm"
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
            <div className="bg-white border border-dashed border-neutral-200 py-10 text-center rounded-xl">
              <p className="text-xs  tracking-wider text-neutral-400 ">
                Memories in the making. Photos from our past social change campaigns will appear here soon!
              </p>
            </div>
          )}
        </section>

        {/* ── Sponsors ── */}
        {club.clubSponsors && club.clubSponsors.length > 0 && (
          <section>
            <div className="flex items-center gap-4 my-6">
              <h2 className="text-xl font-bold tracking-tight text-neutral-900 whitespace-nowrap">
                Our Sponsors
              </h2>
              <div className="h-[1px] flex-1 bg-neutral-200" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {club.clubSponsors.map((image, index) => (
                <div
                  key={index}
                  className="bg-white border border-neutral-200 rounded-xl p-4 flex items-center justify-center h-32 hover:border-neutral-300 transition-colors shadow-sm"
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