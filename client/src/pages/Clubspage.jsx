import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const ClubsPage = ({ isHome = false }) => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/clubs`);
        setClubs(res.data);
      } catch (err) {
        console.error("Error fetching clubs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClubs();
  }, []);

  const clubsToShow = isHome ? clubs.slice(0, 6) : clubs;

  if (loading) return <div className="text-center py-20">Loading clubs...</div>;

  return (
    <div className={`${isHome ? "" : "min-h-screen bg-gray-50 py-12"} px-6`}>
      {/* Page Header - Hide if on Home */}
      {!isHome && (
        <div className="text-center mb-14">
          <h1 className="text-4xl font-black text-black tracking-wide">
            NITJ Clubs & Societies
          </h1>
          <p className="mt-4 text-neutral-500 uppercase tracking-widest text-xs font-bold">
            Explore student clubs, connect with coordinators, and join
            activities.
          </p>
        </div>
      )}

      {/* Clubs Grid */}
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {clubsToShow.map((club) => (
          <div
            key={club._id}
            className="bg-white border-2 border-black rounded-sm  p-6 flex flex-col justify-between hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_#000] transition-all"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-16 h-16 border-2 border-black bg-white flex items-center justify-center p-1 shadow-[4px_4px_0px_#000]">
                  {club.clubLogo ? (
                    <img src={club.clubLogo} alt={club.clubName} className="w-full h-full object-contain" />
                  ) : (
                    <span className="font-black text-xl italic">{club.clubName.charAt(0)}</span>
                  )}
                </div>
                <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-orange-100 text-orange-600 border border-black rounded-sm">
                  {club.category || "Student Club"}
                </span>
              </div>

              <h2 className="text-2xl font-black text-black leading-tight uppercase tracking-wider">
                {club.clubName}
              </h2>

              <p className="text-sm text-neutral-600 mt-3 leading-relaxed line-clamp-2">
                {club.description || "The official student group dedicated to community, innovation, and campus spirit."}
              </p>

              <div className="mt-6 space-y-3">
                {club.facultyCoordinators && club.facultyCoordinators.length > 0 && (
                  <div className="border-2 border-gray-300 bg-neutral-50 px-4 py-2 ">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                      Faculty Coordinator
                    </p>
                    <p className="text-[11px] text-black font-bold">
                      {club.facultyCoordinators.join(", ")}
                    </p>
                  </div>
                )}
                
                <div className="border-2 border-gray-300 bg-neutral-50 px-4 py-2 ">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Student Lead
                  </p>
                  <p className="text-[11px] text-black font-bold">
                    {club.studentCoordinators && club.studentCoordinators.length > 0 ? club.studentCoordinators.join(", ") : club.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-4 border-t-2 border-black pt-6">
              <div className="flex gap-2">
                 {club.clubInstagram && (
                   <a href={club.clubInstagram} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center border-2 border-black hover:bg-black hover:text-white transition-all">
                     <i className="ri-instagram-line text-lg" />
                   </a>
                 )}
                 {club.clubLinkedin && (
                   <a href={club.clubLinkedin} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center border-2 border-black hover:bg-black hover:text-white transition-all">
                     <i className="ri-linkedin-fill text-lg" />
                   </a>
                 )}
              </div>
              <Link
                to={`/club/${club._id}`}
                className="flex-1 text-center py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest border-2 border-black hover:bg-orange-600 transition-all shadow-[4px_4px_0px_#ea580c] hover:shadow-none"
              >
                Explore →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* {!isHome && (
        <p className="text-center mt-12 text-neutral-500 uppercase tracking-widest text-[10px] font-bold">
          If you want to add your club or society, Click{" "}
          <a
            href="https://forms.gle/ZJKNhGXNrSkimWtG9"
            className="text-orange-600 underline"
          >
            here
          </a>
          .
        </p>
      )} */}
 <p className="text-center mt-8 text-neutral-500 uppercase tracking-widest text-xs font-bold">If you want to add your club or society, Click <a href="https://forms.gle/ZJKNhGXNrSkimWtG9" className="text-orange-600">here</a>.</p>
   


    </div>
  );
};

export default ClubsPage;
