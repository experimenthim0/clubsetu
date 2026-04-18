import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const storedRole = localStorage.getItem('role');
    if (storedUser) {
      setUser(storedUser);
      setRole(storedRole);
    }
    setLoading(false);
  }, []);

  if (!user) return <div className="text-center mt-10">Please login to view profile.</div>;
  if (loading) return <div className="text-center mt-10">Loading profile...</div>;

 return (
  <div className="max-w-5xl mx-auto px-6 py-12">

    {/* Profile Card */}
    <div className="bg-white border border-gray-200 rounded-xl p-8 mb-12">
      <h1 className="text-2xl font-semibold text-gray-800 mb-8">
        Profile
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-gray-700">
        <div>
          <p className="text-sm text-gray-500">Name</p>
          <p className="font-medium text-lg">{user.name}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Email</p>
          <p className="font-medium text-lg">
            {user.email}
          </p>
        </div>

        {(role === 'member' || role === 'student') && (
          <>
            <div>
              <p className="text-sm text-gray-500">Roll No</p>
              <p className="font-medium">{user.rollNo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Branch / Year</p>
              <p className="font-medium">
                {user.branch} - {user.year}
              </p>
            </div>
          </>
        )}

        {/* {(role === 'clubHead' || role === 'club-head' || role === 'club') && (
          <>
            <div>
              <p className="text-sm text-gray-500">Club Name</p>
              <p className="font-medium">{user.name}</p>
            </div>
           
          
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{user.phone}</p>
            </div>
          </>
        )} */}
      </div>


{(!['member', 'student'].includes(role)) && !user.isTwoStepEnabled && (
  <p className='text-black mt-4 text-sm '> <i className="ri-error-warning-line mr-1" /> Two Factor Authentication is disabled <Link to="/profile/edit" className="font-bold text-orange-600 hover:underline">Enable it</Link></p>
)}
   
      <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Social Profiles</h3>
                <div className="flex flex-wrap gap-4">
                    {user.githubProfile && (
                        <a href={user.githubProfile} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-700 hover:text-black">
                            <i className="ri-github-fill text-xl" /> GitHub
                        </a>
                    )}
                    {user.linkedinProfile && (
                        <a href={user.linkedinProfile} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-700 hover:text-blue-900">
                            <i className="ri-linkedin-box-fill text-xl" /> LinkedIn
                        </a>
                    )}
                    {user.xProfile && (
                        <a href={user.xProfile} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-black hover:opacity-70">
                            <i className="ri-twitter-x-fill text-xl" /> X
                        </a>
                    )}
                    {user.instagramProfile && (
                        <a href={user.instagramProfile} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-pink-600 hover:text-pink-800">
                            <i className="ri-instagram-line text-xl" /> Instagram
                        </a>
                    )}
                    {user.whatsappNumber && (
                        <a href={`https://wa.me/${user.whatsappNumber.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-green-600 hover:text-green-800">
                            <i className="ri-whatsapp-line text-xl" /> WhatsApp
                        </a>
                    )}
                    {user.portfolioUrl && (
                        <a href={user.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-orange-600 hover:text-orange-700">
                            <i className="ri-global-line text-xl" /> Portfolio
                        </a>
                    )}
                    {!user.githubProfile && !user.linkedinProfile && !user.xProfile && !user.instagramProfile && !user.whatsappNumber && !user.portfolioUrl && (
                        <p className="text-sm text-gray-400 italic">No social profiles added.</p>
                    )}
                </div>
            </div>
            <div className="flex items-end justify-end">
                <a href="/profile/edit" className="inline-flex items-center gap-2 px-6 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition font-medium">
                    <i className="ri-edit-line" /> Edit Profile
                </a>
            </div>
      </div>
    </div>

    {(role === 'member' || role === 'student') && (
      <div className="mt-8">
        <Link 
          to="/my-events" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-black/70 font-bold text-sm uppercase tracking-widest rounded-3xl  hover:bg-gray-300  transition-colors"
        >
          <i className="ri-calendar-event-line" /> View My Events
        </Link>
      </div>
    )}

    {(role === 'club') && (
      <div className="mt-8 flex flex-wrap gap-4">
        <Link 
          to="/my-events" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-black/70 font-bold text-sm uppercase tracking-widest rounded-3xl hover:bg-gray-300  transition-colors"
        >
          <i className="ri-calendar-event-line" /> My Events
        </Link>
        <Link 
          to="/payments" 
          className="text-white bg-[#0f1419] hover:bg-[#0f1419]/90 focus:ring-4 focus:outline-none focus:ring-[#0f1419]/50 box-border border border-transparent font-medium leading-5 rounded-base text-sm px-4 py-2.5 text-center inline-flex items-center dark:hover:bg-[#24292F] dark:focus:ring-[#24292F]/55 rounded-3xl"
        >
          <i className="ri-money-dollar-circle-line mr-2" /> Payment Tracking
        </Link>
        <Link 
          to={`/club/edit/${user.clubId || user.id}`} 
          className="text-white bg-[#0f1419] hover:bg-[#0f1419]/90 focus:ring-4 focus:outline-none focus:ring-[#0f1419]/50 box-border border border-transparent font-medium leading-5 rounded-base text-sm px-4 py-2.5 text-center inline-flex items-center dark:hover:bg-[#24292F] dark:focus:ring-[#24292F]/55 rounded-3xl"
        >
          <i className="ri-community-line mr-2" /> {!user.isClubAdded ? "Add Club on Website" : "Edit Club Details"}
        </Link>
      </div>
    )}

    {/* Bank Information section - Restored for Club Account */}
    {(role === 'club') && (
      <div className="mt-12 pt-8 border-t border-gray-100">
        <h2 className="text-xl font-bold text-black uppercase tracking-tighter mb-6 flex items-center gap-2">
          <i className="ri-bank-card-line text-orange-600" /> Bank / Payment Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-gray-700 bg-neutral-50 p-6 rounded-xl border border-neutral-100">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Bank Name</p>
            <p className="font-bold text-neutral-800">{user.bankName || 'Not Set'}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Account Holder</p>
            <p className="font-bold text-neutral-800">{user.accountHolderName || 'Not Set'}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Account Number</p>
            <p className="font-mono font-bold text-neutral-800">{user.accountNumber || 'Not Set'}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">IFSC Code</p>
            <p className="font-mono font-bold text-neutral-800">{user.ifscCode || 'Not Set'}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">UPI ID</p>
            <p className="font-bold text-orange-600 underline">{user.upiId || 'Not Set'}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Linked Phone</p>
            <p className="font-bold text-neutral-800">{user.bankPhone || 'Not Set'}</p>
          </div>
        </div>
      </div>
    )}

  </div>
  );
};

export default Profile;
