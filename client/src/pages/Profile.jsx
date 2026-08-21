import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cachedFetch } from '../lib/cacheManager';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getMe } from '../services/userService';
import { getUserEvents } from '../services/eventService';

const ClubLogoImage = ({ clubLogo, clubName }) => {
  const { isDark } = useTheme();
  const fallbackLogo = isDark ? "/darkthemelogo.png" : "/lightthemelogo.png";
  const [logoSrc, setLogoSrc] = useState(() => clubLogo || fallbackLogo);

  useEffect(() => {
    if (clubLogo) {
      setLogoSrc(clubLogo);
    } else {
      setLogoSrc(fallbackLogo);
    }
  }, [clubLogo, fallbackLogo]);

  return (
    <img
      src={logoSrc}
      alt={clubName || 'Club Logo'}
      className="w-full h-full object-cover"
      onError={() => {
        if (logoSrc !== fallbackLogo) {
          setLogoSrc(fallbackLogo);
        }
      }}
    />
  );
};

const Profile = () => {
  const { user: authUser, role: authRole, setSession } = useAuth();
  const [user, setUser] = useState(authUser);
  const [role, setRole] = useState(authRole);
  const [loading, setLoading] = useState(true);
  const [isClubAdded, setIsClubAdded] = useState(false);
  const [winnings, setWinnings] = useState([]);
  const [clubsMap, setClubsMap] = useState({});

  useEffect(() => {
    cachedFetch('/api/clubs', { ttlMs: 15 * 60 * 1000 })
      .then(resData => {
        const clubsList = Array.isArray(resData) ? resData : (resData?.clubs || []);
        const map = {};
        clubsList.forEach(c => {
          if (c.clubLogo) {
            if (c.id || c._id) map[c.id || c._id] = c.clubLogo;
            if (c.slug) map[c.slug] = c.clubLogo;
            if (c.clubName) map[c.clubName.toLowerCase()] = c.clubLogo;
          }
        });
        setClubsMap(map);
      })
      .catch(err => console.debug("Could not fetch clubs map in Profile:", err));
  }, []);

  useEffect(() => {
    if (authUser) {
      setUser(authUser);
      setRole(authRole);

      // Fetch fresh profile from /api/users/me to ensure updated memberships, clubLogo, and role
      getMe()
        .then(res => {
          if (res.data?.user) {
            setUser(res.data.user);
            if (res.data.role) setRole(res.data.role);
            setSession(res.data.user, res.data.role || authRole);
          }
        })
        .catch(err => {
          console.debug("Could not refresh user profile in Profile.jsx:", err?.message);
        });

      if (authRole === 'club' && authUser.clubId) {
        cachedFetch(`/api/clubs/${authUser.clubId}`, { ttlMs: 30 * 60 * 1000 })
          .then(resData => {
            const club = resData?.club || resData;
            if (club && (club.description || club.clubLogo || club.category)) {
              setIsClubAdded(true);
            }
          })
          .catch(err => {
            console.error("Error fetching club details in Profile.jsx:", err);
          });
      }

      // Fetch events/winnings for student user
      const isStudentUser = Boolean(authUser?.rollNo || authUser?.branch || authRole === 'member' || authRole === 'student' || authRole !== 'club');
      if (isStudentUser) {
        getUserEvents(authUser.id || authUser._id)
          .then(res => {
            const participations = res.data || [];
            const winningsList = [];
            participations.forEach(p => {
              const ev = p.eventId || p.event;
              if (ev && ev.showWinner && ev.winners) {
                const match = ev.winners.find(w => 
                  (w.rollNo && w.rollNo.trim() === storedUser.rollNo?.trim()) ||
                  (w.name && w.name.toLowerCase().includes(storedUser.name.toLowerCase()))
                );
                if (match) {
                  winningsList.push({
                    eventTitle: ev.title,
                    eventSlug: ev.slug || ev.id || ev._id,
                    rank: match.rank,
                    date: ev.startTime,
                    clubName: ev.club?.clubName
                  });
                }
              }
            });
            setWinnings(winningsList);
          })
          .catch(err => {
            console.error("Error fetching winnings in Profile.jsx:", err);
          });
      }
    }
    setLoading(false);
  }, []);

  if (!user) return <div className="text-center mt-10">Please login to view profile.</div>;
  if (loading) return <div className="text-center mt-10">Loading profile...</div>;

  // Determine whether this is a Student Profile vs an Official Club Account
  const isStudentAccount = Boolean(user?.rollNo || user?.branch || user?.year || role === 'student' || role === 'member' || localStorage.getItem('role') === 'member' || localStorage.getItem('role') === 'student');
  const isClubAccount = !isStudentAccount && role === 'club';

  // Compute header role tag display
  let displayRoleTag = 'Student';
  if (isClubAccount) {
    displayRoleTag = 'Club Account';
  } else if (user?.memberships && user.memberships.length > 0) {
    const hasHead = user.memberships.some(m => m.role === 'CLUB_HEAD');
    const hasCoord = user.memberships.some(m => m.role === 'COORDINATOR');
    if (hasHead) displayRoleTag = 'Student • Club Head';
    else if (hasCoord) displayRoleTag = 'Student • Coordinator';
    else displayRoleTag = 'Student • Member';
  }

  // Initials for fallback avatar
  const profileInitials = (user?.name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">

      {/* Profile Card */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 md:p-8 mb-12 shadow-sm">
        {/* 1. Unified Profile Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 pb-8 border-b border-neutral-100">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left flex-1">
            {/* Avatar */}
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-[2px] border-neutral-200 dark:border-neutral-800 flex items-center justify-center shrink-0">
              {user.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl md:text-4xl font-bold text-black dark:text-white select-none">{profileInitials}</span>
              )}
            </div>

            {/* Identity details & Header Action Buttons */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
                  {user.name}
                </h1>
                <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider border border-orange-200 text-orange-600 bg-orange-50 rounded-full">
                  {displayRoleTag}
                </span>
              </div>
              <p className="text-sm font-medium text-neutral-500 mt-1 break-all">{user.email}</p>

              {/* Action Grouping: Action buttons directly adjacent to header details */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
                <Link 
                  to="/profile/edit" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-full transition-all font-semibold text-xs shadow-xs cursor-pointer border-0"
                >
                  <i className="ri-edit-line text-sm" /> Edit Profile
                </Link>
                {isStudentAccount && (
                  <Link 
                    to="/my-events" 
                    className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-orange-600 rounded-full transition-colors font-semibold text-xs shadow-xs cursor-pointer border-0"
                  >
                    <i className="ri-calendar-event-line text-sm" /> View My Events
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Structured Form & Field Data Layout */}
        {isStudentAccount && (
          <div className="pt-8">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">Academic & Account Attributes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {user.rollNo && (
                <div className="bg-neutral-50/70 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-700 rounded-xl p-4">
                  <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Roll No</p>
                  <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-mono">{user.rollNo}</p>
                </div>
              )}
              {user.branch && (
                <div className="bg-neutral-50/70 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-700 rounded-xl p-4">
                  <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Branch</p>
                  <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{user.branch}</p>
                </div>
              )}
              {user.year && (
                <div className="bg-neutral-50/70 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-700 rounded-xl p-4">
                  <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Academic Year</p>
                  <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{user.year}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {isClubAccount && !user.isTwoStepEnabled && (
          <p className='text-neutral-600 mt-6 text-sm font-medium'>
            <i className="ri-error-warning-line mr-1 text-orange-500" /> Two Factor Authentication is disabled <Link to="/profile/edit" className="font-semibold text-orange-600 hover:underline">Enable it</Link>
          </p>
        )}

        {/* Social Profiles */}
        <div className="mt-8 pt-6 border-t border-neutral-100">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Social Profiles</h3>
          <div className="flex flex-wrap gap-2.5">
            {user.githubProfile && (
              <a href={user.githubProfile} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-orange-500/50 transition-colors shadow-xs">
                <i className="ri-github-fill text-lg text-neutral-800" /> GitHub
              </a>
            )}
            {user.linkedinProfile && (
              <a href={user.linkedinProfile} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-medium text-blue-700 hover:bg-neutral-50 hover:border-blue-500/50 transition-colors shadow-xs">
                <i className="ri-linkedin-box-fill text-lg" /> LinkedIn
              </a>
            )}
            {user.xProfile && (
              <a href={user.xProfile} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-900 hover:bg-neutral-50 hover:border-neutral-800/50 transition-colors shadow-xs">
                <i className="ri-twitter-x-fill text-lg" /> X
              </a>
            )}
            {user.instagramProfile && (
              <a href={user.instagramProfile} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-medium text-pink-600 hover:bg-neutral-50 hover:border-pink-500/50 transition-colors shadow-xs">
                <i className="ri-instagram-line text-lg" /> Instagram
              </a>
            )}
            {user.whatsappNumber && (
              <a href={`https://wa.me/${user.whatsappNumber.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-medium text-green-600 hover:bg-neutral-50 hover:border-green-500/50 transition-colors shadow-xs">
                <i className="ri-whatsapp-line text-lg" /> WhatsApp
              </a>
            )}
            {user.portfolioUrl && (
              <a href={user.portfolioUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-medium text-orange-600 hover:bg-neutral-50 hover:border-orange-500/50 transition-colors shadow-xs">
                <i className="ri-global-line text-lg" /> Portfolio
              </a>
            )}
            {!user.githubProfile && !user.linkedinProfile && !user.xProfile && !user.instagramProfile && !user.whatsappNumber && !user.portfolioUrl && (
              <p className="text-xs text-neutral-400 italic font-medium">No social profiles added.</p>
            )}
          </div>
        </div>
      </div>

    {/* Portals & Delegated Tools Section */}
    {/* <div className="mb-12 p-6 md:p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm">
      <h2 className="text-lg font-bold text-neutral-900 dark:text-white tracking-wider mb-4 flex items-center gap-2">
        <i className="ri-shield-keyhole-line text-orange-600 dark:text-orange-500" /> Campus Portals & Management
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(user?.accessLevel === "central_organizer" || role === "central_organizer" || role === "admin" || role === "facultyCoordinator" || role === "club") && (
          <Link
            to="/central-organizer"
            className="group p-4 bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 rounded-xl hover:border-orange-500 transition-all flex items-start gap-3.5"
          >
            <div className="w-10 h-10 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <i className="ri-shield-star-line text-xl" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-orange-600 transition-colors">
                Central Organizer Portal
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                Create college-wide events, coordinate participating clubs, and delegate staff.
              </p>
            </div>
          </Link>
        )}
        <Link
          to="/event-staff"
          className="group p-4 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 rounded-xl hover:border-neutral-400 dark:hover:border-neutral-600 transition-all flex items-start gap-3.5"
        >
          <div className="w-10 h-10 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black flex items-center justify-center shrink-0 shadow-sm">
            <i className="ri-qr-scan-2-line text-xl" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-orange-600 transition-colors">
              Event Staff Portal
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
              Verify attendee tickets, scan QR attendance codes, and track registrations live.
            </p>
          </div>
        </Link>
      </div>
    </div> */}

    {/* Enrolled Clubs Section */}
    {isStudentAccount && (
      <div className="mb-12 p-6 md:p-8 bg-white border border-neutral-200 rounded-xl shadow-sm">
        <h2 className="text-lg font-bold text-neutral-900 tracking-wider mb-6 flex items-center gap-2">
          Enrolled Clubs & Societies
        </h2>
        {user?.memberships && user.memberships.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {user.memberships.map((m, index) => {
              const roleDisplay =
                m.role === "CLUB_HEAD"
                  ? "Club Head"
                  : m.role === "COORDINATOR"
                  ? "Coordinator"
                  : "Member";

              const badgeStyle =
                m.role === "CLUB_HEAD"
                  ? "border-amber-300 bg-amber-50 text-amber-800 font-bold"
                  : m.role === "COORDINATOR"
                  ? "border-orange-300 bg-orange-50 text-orange-800 font-bold"
                  : "border-neutral-200 bg-neutral-50 text-neutral-700 font-medium";

              const resolvedLogo =
                m.clubLogo ||
                m.club?.clubLogo ||
                clubsMap[m.clubId] ||
                clubsMap[m.slug] ||
                (m.clubName && clubsMap[m.clubName.toLowerCase()]);

              return (
                <Link
                  key={index}
                  to={`/club/${m.slug || m.clubId}`}
                  className="group bg-white border border-neutral-200 hover:border-orange-500 rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-300 hover:shadow-md"
                >
                  {/* Club Logo */}
                  <div className="w-14 h-14 rounded-full border border-neutral-200 overflow-hidden flex items-center justify-center bg-white mb-3 shadow-xs">
                    <ClubLogoImage
                      clubLogo={resolvedLogo}
                      clubName={m.clubName}
                    />
                  </div>

                  {/* Club Name */}
                  <h3 className="font-bold text-neutral-900 text-sm leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">
                    {m.clubName || "Club Details"}
                  </h3>

                  {/* Specific Role Tag in this Particular Club */}
                  <span className={`mt-3 px-3 py-1 text-[10px] uppercase tracking-wider border rounded-full ${badgeStyle}`}>
                    {roleDisplay}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-neutral-50 p-6 border border-neutral-200 rounded-xl text-center">
            <i className="ri-building-4-line text-3xl text-neutral-400/60 mb-2 inline-block" />
            <p className="text-sm font-semibold text-neutral-700">Not enrolled in any clubs yet</p>
            <p className="text-xs text-neutral-500 mt-1 mb-4">Discover campus clubs, join events, and get involved!</p>
            <Link 
              to="/clubs" 
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg transition-all shadow-xs"
            >
              <i className="ri-compass-3-line text-sm" /> Explore Clubs
            </Link>
          </div>
        )}
      </div>
    )}

    {/* Achievements / Trophy Room */}
    {isStudentAccount && (
      <div className="mb-12 p-6 md:p-8 bg-white border border-neutral-200 rounded-xl shadow-sm">
        <h2 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
          Achievements & Winnings
        </h2>
        {winnings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {winnings.map((w, index) => (
              <div key={index} className="flex items-center gap-4 bg-white p-4 border border-neutral-200 rounded-xl shadow-xs">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                  <i className="ri-award-fill text-amber-600 text-lg" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-amber-800 uppercase tracking-wider leading-none mb-1">
                    {w.rank === 1 ? '🥇 1st Place / Winner' : w.rank === 2 ? '🥈 2nd Place / Runner Up' : w.rank === 3 ? '🥉 3rd Place' : `#${w.rank} Position`}
                  </p>
                  <Link to={`/event/${w.eventSlug}`} className="text-sm font-semibold text-neutral-800 hover:text-orange-600 hover:underline truncate block">
                    {w.eventTitle}
                  </Link>
                  {w.clubName && (
                    <p className="text-[10px] text-neutral-400 font-medium">by {w.clubName}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-200 text-center">
            <i className="ri-trophy-line text-3xl text-amber-400/60 mb-2 inline-block" />
            <p className="text-sm font-semibold text-neutral-700">No achievements recorded yet</p>
            <p className="text-xs text-neutral-500 mt-1">Participate and win in campus events to earn trophies and appear on the leaderboard!</p>
          </div>
        )}
      </div>
    )}

    {isClubAccount && (
      <div className="mt-8 flex flex-wrap gap-4">
        <Link 
          to="/my-events" 
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-100 text-neutral-700 font-bold text-xs uppercase tracking-wider rounded-full hover:bg-neutral-200 hover:text-orange-600 transition-colors shadow-sm cursor-pointer border-0"
        >
          <i className="ri-calendar-event-line text-sm" /> My Events
        </Link>
        <Link 
          to="/payments" 
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wider rounded-full transition-colors shadow-sm cursor-pointer border-0"
        >
          <i className="ri-money-dollar-circle-line text-sm" /> Payment Tracking
        </Link>
        <Link 
          to={`/club/edit/${user.clubId || user.id}`} 
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider rounded-full transition-colors shadow-sm cursor-pointer border-0"
        >
          <i className="ri-community-line text-sm" /> {!isClubAdded ? "Add Club on Website" : "Edit Club Details"}
        </Link>
      </div>
    )}

    {/* Bank Information section - Restored for Club Account */}
    {isClubAccount && (
      <div className="mt-12 p-6 md:p-8 bg-white border border-neutral-200 rounded-xl shadow-sm">
        <h2 className="text-lg font-bold text-neutral-900 uppercase tracking-wider mb-6 flex items-center gap-2">
          <i className="ri-bank-card-line text-orange-600" /> Bank / Payment Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-neutral-600 bg-neutral-50/50 p-6 rounded-xl border border-neutral-200">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">Bank Name</p>
            <p className="font-semibold text-neutral-800">{user.bankName || 'Not Set'}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">Account Holder</p>
            <p className="font-semibold text-neutral-800">{user.accountHolderName || 'Not Set'}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">Account Number</p>
            <p className="font-mono font-semibold text-neutral-800">{user.accountNumber || 'Not Set'}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">IFSC Code</p>
            <p className="font-mono font-semibold text-neutral-800">{user.ifscCode || 'Not Set'}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">UPI ID</p>
            <p className="font-semibold text-orange-600">{user.upiId || 'Not Set'}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">Linked Phone</p>
            <p className="font-semibold text-neutral-800">{user.bankPhone || 'Not Set'}</p>
          </div>
        </div>
      </div>
    )}

  </div>
  );
};

export default Profile;
