import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isClubAdded, setIsClubAdded] = useState(false);
  const [winnings, setWinnings] = useState([]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const storedRole = localStorage.getItem('role');
    if (storedUser) {
      setUser(storedUser);
      setRole(storedRole);

      if (storedRole === 'club' && storedUser.clubId) {
        axios.get(`${import.meta.env.VITE_API_URL}/api/clubs/${storedUser.clubId}`)
          .then(res => {
            const club = res.data.club;
            if (club && (club.description || club.clubLogo || club.category)) {
              setIsClubAdded(true);
            }
          })
          .catch(err => {
            console.error("Error fetching club details in Profile.jsx:", err);
          });
      }

      if (storedRole === 'member' || storedRole === 'student') {
        axios.get(`${import.meta.env.VITE_API_URL}/api/events/user/${storedUser.id || storedUser._id}`)
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

 return (
  <div className="max-w-5xl mx-auto px-6 py-12">

    {/* Profile Card */}
    <div className="bg-white border border-neutral-200 rounded-xl p-6 md:p-8 mb-12 shadow-sm">
      <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 mb-8">
        Profile
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-neutral-700">
        <div>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Name</p>
          <p className="font-semibold text-lg text-neutral-800">{user.name}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Email</p>
          <p className="font-semibold text-lg text-neutral-800 break-all">
            {user.email}
          </p>
        </div>

        {(role === 'member' || role === 'student') && (
          <>
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Roll No</p>
              <p className="font-semibold text-neutral-800">{user.rollNo}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Branch / Year</p>
              <p className="font-semibold text-neutral-800">
                {user.branch} - {user.year}
              </p>
            </div>
          </>
        )}
      </div>


{(!['member', 'student'].includes(role)) && !user.isTwoStepEnabled && (
  <p className='text-neutral-600 mt-6 text-sm font-medium'> <i className="ri-error-warning-line mr-1 text-orange-500" /> Two Factor Authentication is disabled <Link to="/profile/edit" className="font-semibold text-orange-655 text-orange-600 hover:underline">Enable it</Link></p>
)}
   
      <div className="mt-8 pt-6 border-t border-neutral-100 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div>
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Social Profiles</h3>
                <div className="flex flex-wrap gap-2.5">
                    {user.githubProfile && (
                        <a href={user.githubProfile} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-orange-500/50 transition-colors shadow-sm">
                            <i className="ri-github-fill text-lg text-neutral-800" /> GitHub
                        </a>
                    )}
                    {user.linkedinProfile && (
                        <a href={user.linkedinProfile} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-medium text-blue-700 hover:bg-neutral-50 hover:border-blue-500/50 transition-colors shadow-sm">
                            <i className="ri-linkedin-box-fill text-lg" /> LinkedIn
                        </a>
                    )}
                    {user.xProfile && (
                        <a href={user.xProfile} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-900 hover:bg-neutral-50 hover:border-neutral-800/50 transition-colors shadow-sm">
                            <i className="ri-twitter-x-fill text-lg" /> X
                        </a>
                    )}
                    {user.instagramProfile && (
                        <a href={user.instagramProfile} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-medium text-pink-600 hover:bg-neutral-50 hover:border-pink-500/50 transition-colors shadow-sm">
                            <i className="ri-instagram-line text-lg" /> Instagram
                        </a>
                    )}
                    {user.whatsappNumber && (
                        <a href={`https://wa.me/${user.whatsappNumber.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-medium text-green-600 hover:bg-neutral-50 hover:border-green-500/50 transition-colors shadow-sm">
                            <i className="ri-whatsapp-line text-lg" /> WhatsApp
                        </a>
                    )}
                    {user.portfolioUrl && (
                        <a href={user.portfolioUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-medium text-orange-600 hover:bg-neutral-50 hover:border-orange-500/50 transition-colors shadow-sm">
                            <i className="ri-global-line text-lg" /> Portfolio
                        </a>
                    )}
                    {!user.githubProfile && !user.linkedinProfile && !user.xProfile && !user.instagramProfile && !user.whatsappNumber && !user.portfolioUrl && (
                        <p className="text-xs text-neutral-400 italic font-medium">No social profiles added.</p>
                    )}
                </div>
            </div>
            <div className="flex md:justify-end">
                <a href="/profile/edit" className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition font-semibold text-xs shadow-sm cursor-pointer border-0">
                    <i className="ri-edit-line text-sm" /> Edit Profile
                </a>
            </div>
      </div>
    </div>

    {/* Achievements / Trophy Room */}
    {(role === 'member' || role === 'student') && winnings.length > 0 && (
      <div className="mb-12 p-6 md:p-8 bg-amber-50/40 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/40 rounded-xl shadow-sm">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider mb-6 flex items-center gap-2 text-amber-800 dark:text-amber-400">
          <i className="ri-trophy-line text-amber-600 text-xl" /> Achievements & Winnings
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {winnings.map((w, index) => (
            <div key={index} className="flex items-center gap-4 bg-white dark:bg-neutral-900 p-4 border border-amber-100 dark:border-amber-900/20 rounded-xl shadow-xs">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center shrink-0">
                <i className="ri-award-fill text-amber-600 text-lg" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider leading-none mb-1">
                  {w.rank === 1 ? '🥇 1st Place / Winner' : w.rank === 2 ? '🥈 2nd Place / Runner Up' : w.rank === 3 ? '🥉 3rd Place' : `#${w.rank} Position`}
                </p>
                <Link to={`/event/${w.eventSlug}`} className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 hover:text-orange-600 dark:hover:text-orange-500 hover:underline truncate block">
                  {w.eventTitle}
                </Link>
                {w.clubName && (
                  <p className="text-[10px] text-neutral-400 font-medium">by {w.clubName}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {(role === 'member' || role === 'student') && (
      <div className="mt-8">
        <Link 
          to="/my-events" 
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-350 font-bold text-xs uppercase tracking-wider rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:text-orange-600 transition-colors shadow-sm cursor-pointer border-0"
        >
          <i className="ri-calendar-event-line text-sm" /> View My Events
        </Link>
      </div>
    )}

    {(role === 'club') && (
      <div className="mt-8 flex flex-wrap gap-4">
        <Link 
          to="/my-events" 
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-350 font-bold text-xs uppercase tracking-wider rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:text-orange-600 transition-colors shadow-sm cursor-pointer border-0"
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
    {(role === 'club') && (
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
