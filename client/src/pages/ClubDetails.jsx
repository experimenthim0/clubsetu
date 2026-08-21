import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { deleteClub, getClubMembers } from "../services/clubService";
import { getUserEvents } from "../services/eventService";
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
import ShimmerText from "../components/ShimmerText";

import { ClubMemberRole } from "../types/index.js";

const MemberSocials = ({ student }) => {
  if (!student) return null;
  const links = [];

  const formatUrl = (url) => {
    if (!url) return "";
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
  };

  if (student.githubProfile) links.push({ url: formatUrl(student.githubProfile), icon: <GithubIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />, title: "GitHub" });
  if (student.linkedinProfile) links.push({ url: formatUrl(student.linkedinProfile), icon: <LinkedinIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />, title: "LinkedIn" });
  if (student.xProfile) links.push({ url: formatUrl(student.xProfile), icon: <TwitterIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />, title: "X" });
  if (student.instagramProfile) links.push({ url: formatUrl(student.instagramProfile), icon: <InstagramIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />, title: "Instagram" });
  if (student.whatsappNumber) links.push({ url: `https://wa.me/${student.whatsappNumber.replace(/[^\d+]/g, '')}`, icon: <MessageCircleIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />, title: "WhatsApp" });
  if (student.portfolioUrl) links.push({ url: formatUrl(student.portfolioUrl), icon: <EarthIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />, title: "Portfolio" });

  if (links.length === 0) return null;

  return (
    <div className="flex items-center justify-center flex-wrap gap-1 sm:gap-1.5 pt-2.5 sm:pt-3 mt-2 border-t border-neutral-100 dark:border-neutral-800 w-full">
      {links.map((l, idx) => (
        <a
          key={idx}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-neutral-50 dark:bg-neutral-800 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 dark:hover:text-white text-neutral-500 dark:text-neutral-400 border border-neutral-200/70 dark:border-neutral-700/70 flex items-center justify-center transition-all duration-200 shadow-2xs hover:scale-105"
          title={l.title}
        >
          {l.icon}
        </a>
      ))}
    </div>
  );
};

const ClubDetails = () => {
  const { slug } = useParams();
  const { isDark } = useTheme();
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [canEdit, setCanEdit] = useState(false);
  const [isHead, setIsHead] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
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

  const navigate = useNavigate();
  const { user: authUser, role: authRole } = useAuth();
  const [user, setUser] = useState(authUser);

  useEffect(() => {
    const fetchClubDetails = async () => {
      try {
        const clubData = await getPublicJson(
          `/api/clubs/${slug}`
        );
        setClub(clubData.club);
        setEvents(clubData.events);

        setUser(authUser);

        if (authUser && (authRole === "member" || authRole === "student")) {
          try {
            const regRes = await getUserEvents(authUser.id || authUser._id);
            setRegisteredEvents(
              regRes.data.filter((r) => r.eventId).map((r) => r.eventId.id || r.eventId._id)
            );
          } catch (regErr) {
            console.error("Error fetching user registrations:", regErr);
          }
        }

        // Fetch club members & derive RBAC flags
        if (clubData?.club) {
          const clubId = clubData.club._id || clubData.club.id;
          try {
            const membersRes = await getClubMembers(clubId);
            const memberList = membersRes.data || [];
            setMembers(memberList);
            if (authUser) {
              const membership = memberList.find(
                (m) => m.studentId === authUser.id || m.student?.id === authUser.id
              );
              setCanEdit(membership?.canEditEvents ?? false);
              setIsHead(membership?.role === ClubMemberRole.CLUB_HEAD);
            }
          } catch {
            // Not a member or fetch failed
          }
        }
      } catch (err) {
        console.error("Error fetching club details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClubDetails();
  }, [slug, authUser, authRole]);

  useEffect(() => {
    if (club) {
      document.title = `${club.clubName} - CampusNode`;
    }
  }, [club]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ShimmerText text="Loading..." className="text-sm font-semibold uppercase tracking-widest" />
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
      await deleteClub(club._id || club.id);
      navigate('/clubs');
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
    <div className="min-h-screen pb-20">
      {/* ── Hero ── */}
      <div className="bg-white text-black pt-20 pb-28 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-orange-500/10 blur-[120px] rounded-full -mr-20 -mt-20 pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          {/* Header block: Logo + Title (Column order on small devices, Row order on sm+) */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-4 text-center sm:text-left">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white border border-gray-200 rounded-full flex-shrink-0 overflow-hidden shadow-sm">
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
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight break-words">
              {club.clubName}
            </h1>
          </div>

          {/* Description with smooth height expansion animation & Expand button */}
          {(() => {
            const descText =
              club.description ||
              "The official student group dedicated to community, innovation, and campus spirit.";
            const isLong = descText.length > 120;
            return (
              <div className="text-center sm:text-left">
                <div
                  className={`transition-all duration-500 ease-in-out overflow-hidden max-w-3xl ${
                    isLong && !isDescriptionExpanded
                      ? "max-h-[4.5rem] line-clamp-3"
                      : "max-h-[1000px]"
                  }`}
                >
                  <p className="text-neutral-700 text-sm font-medium leading-relaxed">
                    {descText}
                  </p>
                </div>
                {isLong && (
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="mt-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 focus:outline-none inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>{isDescriptionExpanded ? "Show less" : "Expand"}</span>
                    <i
                      className={`ri-arrow-down-s-line text-sm transition-transform duration-300 ${
                        isDescriptionExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                )}
              </div>
            );
          })()}

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
                </>
              )}
            </div>
          )}
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
            <div className="flex flex-wrap gap-1.5 min-h-[32px] sm:mb-0 mb-2">
              {club.socialLinks.map((link, i) => {
                const platform = link.platform?.toLowerCase() || "website";
                const iconProps = { className: "w-6 h-6" };

                const getIcon = () => {
                  if (platform.includes("instagram")) return <InstagramIcon {...iconProps} size={28} />;
                  if (platform.includes("linkedin")) return <LinkedinIcon {...iconProps} size={28} />;
                  if (platform.includes("twitter") || platform.includes("x")) return <TwitterIcon {...iconProps} size={28} />;
                  if (platform.includes("github")) return <GithubIcon {...iconProps} size={28} />;
                  if (platform.includes("whatsapp")) return <MessageCircleIcon {...iconProps} size={28} />;
                  if (platform.includes("website")) return <EarthIcon {...iconProps} size={28} />;
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
              className={`border p-4 rounded-xl shadow-sm transition-all duration-300 ${accent
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
                className={`text-[10px] font-bold uppercase tracking-wider mt-1.5 ${accent ? "text-orange-600" : "text-neutral-400"
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
            <div className="flex items-center justify-between gap-3 my-6">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <h2 className="text-xl font-bold tracking-tight text-neutral-900 whitespace-nowrap opacity-60">
                  Past Events
                </h2>
                <span className="text-xs font-semibold text-neutral-400 bg-neutral-100 px-2.5 py-0.5 rounded-full">
                  {pastEvents.length}
                </span>
                <div className="h-[1px] flex-1 bg-neutral-200" />
              </div>
              {pastEvents.length > 6 && (
                <Link
                  to={`/events?club=${encodeURIComponent(club.clubName)}&status=ENDED`}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 shrink-0 transition-colors"
                >
                  <span>View All ({pastEvents.length})</span>
                  <i className="ri-arrow-right-line" />
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.slice(0, 6).map((e) => (
                <EventCard
                  key={e._id || e.id}
                  event={getFullEvent(e)}
                  isRegistered={registeredEvents.includes(e._id || e.id)}
                />
              ))}
            </div>
            {pastEvents.length > 6 && (
              <div className="mt-8 text-center">
                <Link
                  to={`/events?club=${encodeURIComponent(club.clubName)}&status=ENDED`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-orange-50 text-neutral-800 hover:text-orange-600 border border-neutral-200 hover:border-orange-300 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs hover:shadow-sm transition-all duration-200 group cursor-pointer"
                >
                  <span>View All {pastEvents.length} Past Events</span>
                  <i className="ri-arrow-right-line group-hover:translate-x-1 transition-transform text-sm" />
                </Link>
              </div>
            )}
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

        {/* ── Team & Members ── */}
        <section>
          {(() => {
            const studentMembers = members.filter((m) => {
              if (!m.student || !m.student.id || !m.student.name) return false;
              const sName = m.student.name.toLowerCase().trim();
              const cName = (club.clubName || "").toLowerCase().trim();
              const sEmail = (m.student.email || "").toLowerCase().trim();
              const cEmail = (club.clubEmail || "").toLowerCase().trim();

              if (cName && sName === cName) return false;
              if (cEmail && sEmail === cEmail) return false;
              return true;
            });

            const rolePriority = {
              [ClubMemberRole.CLUB_HEAD]: 1,
              CLUB_HEAD: 1,
              [ClubMemberRole.COORDINATOR]: 2,
              COORDINATOR: 2,
              [ClubMemberRole.MEMBER]: 3,
              MEMBER: 3,
            };

            const sortedMembers = [...studentMembers].sort((a, b) => {
              const pA = rolePriority[a.role] || 99;
              const pB = rolePriority[b.role] || 99;
              if (pA !== pB) return pA - pB;
              return (a.student?.name || "").localeCompare(b.student?.name || "");
            });

            return (
              <>
                <div className="flex items-center gap-4 my-6">
                  <h2 className="text-xl font-bold tracking-tight text-neutral-900 whitespace-nowrap">
                    Team & Members
                  </h2>
                  <div className="h-[1px] flex-1 bg-neutral-200 " />
                  {sortedMembers.length > 0 && (
                    <span className="text-xs font-semibold text-neutral-400 bg-neutral-100 px-2.5 py-1 rounded-full">
                      {sortedMembers.length} {sortedMembers.length === 1 ? "Member" : "Members"}
                    </span>
                  )}
                </div>

                {sortedMembers.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                    {sortedMembers.map((m) => {
                      const s = m.student;
                      const name = s.name;
                      const initials = name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();

                      const isClubHead = m.role === ClubMemberRole.CLUB_HEAD || m.role === "CLUB_HEAD";
                      const isCoordinator = m.role === ClubMemberRole.COORDINATOR || m.role === "COORDINATOR";

                      const roleTitle = isClubHead
                        ? "Club Head"
                        : isCoordinator
                        ? "Coordinator"
                        : "Member";

                      const roleBadgeStyle = isClubHead
                        ? " text-orange-600"
                        : isCoordinator
                        ? " text-sky-600"
                        : " text-neutral-600";

                     

                      return (
                        <div
                          key={m._id || m.id}
                          className="bg-white border border-neutral-200 rounded-2xl p-3.5 sm:p-4 md:p-5 shadow-xs hover:border-orange-500/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col items-center text-center group justify-between"
                        >
                          <div className="flex flex-col items-center text-center w-full">
                            {/* Photo / Avatar */}
                            <div className="relative mb-2.5 sm:mb-3">
                              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-neutral-200 overflow-hidden shrink-0 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-400 flex items-center justify-center text-white font-bold text-base sm:text-xl shadow-xs group-hover:border-orange-500/60 transition-colors duration-300">
                                {s.profileImage ? (
                                  <img
                                    src={s.profileImage}
                                    alt={name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <span>{initials}</span>
                                )}
                              </div>
                            </div>

                            {/* Name */}
                            <h3
                              className="font-bold text-neutral-900 text-xs sm:text-sm md:text-base leading-snug line-clamp-1 group-hover:text-orange-600 transition-colors"
                              title={name}
                            >
                              {name}
                            </h3>

                            {/* Role Badge */}
                            <span
                              className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border rounded-full mt-1.5 ${roleBadgeStyle}`}
                            >
                             
                              {roleTitle}
                            </span>

                            {/* Branch & Year */}
                            {(s.branch || s.year) && (
                              <p className="text-[10px] sm:text-xs font-semibold text-neutral-500 mt-1.5 line-clamp-1">
                                {s.branch ? `${s.branch}` : ""}
                                {s.branch && s.year ? " • " : ""}
                                {s.year ? `${s.year}` : ""}
                              </p>
                            )}
                          </div>

                          {/* Social Profiles */}
                          <MemberSocials student={s} />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white border border-dashed border-neutral-200 py-10 text-center rounded-xl">
                    <p className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
                      No team members listed yet.
                    </p>
                  </div>
                )}
              </>
            );
          })()}
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