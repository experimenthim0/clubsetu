import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { ArrowUpRightIcon } from "@/components/ui/arrow-up-right";
import { InstagramIcon } from "@/components/ui/instagram";
import { LinkedinIcon } from "@/components/ui/linkedin";
import { TwitterIcon } from "@/components/ui/twitter";
import { GithubIcon } from "@/components/ui/github";
import ScrollReveal from "../components/ScrollReveal";
import ClubCardSkeleton from "../components/skeletons/ClubCardSkeleton";
const ClubsPage = ({ isHome = false }) => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/clubs`,
        );
        setClubs(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching clubs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClubs();
  }, []);

  const clubsToShow = isHome ? clubs.slice(0, 6) : clubs;

  if (loading) {
    return (
      <div className={`${isHome ? "" : "min-h-screen bg-gray-50 py-12"} px-6`}>
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(isHome ? 6 : 9)].map((_, i) => (
            <ClubCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${isHome ? "" : "min-h-screen bg-gray-50 py-12"} px-6`}>
      {/* Page Header - Hide if on Home */}
      {!isHome && (
        <div className="text-center mb-14">
          <h1 className="text-4xl font-black text-black tracking-wide">
            NITJ Clubs & Societies
          </h1>
          <p className="mt-4 text-neutral-500 tracking-widest text-sm font-bold">
            Explore student clubs, connect with coordinators, and join
            activities.
          </p>
        </div>
      )}

      {/* Clubs Grid */}
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.isArray(clubsToShow) &&
          clubsToShow.map((club, index) => (
            <ScrollReveal
              direction="up"
              delay={(index % 3) * 0.1}
              key={club._id}
            >
              <div className="bg-white border-2 border-gray-300 rounded-2xl overflow-hidden flex flex-col h-full hover:shadow-lg transition-all">
                {/* Upper Section: Primary Branding */}
                <div className="bg-white p-6 text-black max-h-40">
                  <div className="flex items-center gap-4 mb-4">
                    {/* Logo: Rounded Square */}
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-gray-500 shrink-0 ">
                      {club.clubLogo ? (
                        <img
                          src={club.clubLogo}
                          alt={club.clubName}
                          className="w-full h-full object-contain filter brightness-110 rounded-full "
                        />
                      ) : (
                        <span className="font-black text-2xl italic text-black/90">
                          {club.clubName.charAt(0)}
                        </span>
                      )}
                    </div>
                    {/* Title & Category */}
                    <div>
                      <h2 className="text-2xl font-black leading-tight tracking-wide ">
                        {club.clubName}
                      </h2>
                      <p className="text-[10px] font-black uppercase tracking-widest text-black/70 mt-1">
                        {club.category || "Student Club"}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-black/80 leading-relaxed line-clamp-2">
                    {club.description ||
                      "The official student group dedicated to community, innovation, and campus spirit."}
                  </p>
                </div>

                {/* Lower Section: Details & Actions */}
                <div className="bg-white p-6 text-black flex flex-col justify-between flex-grow">
                  <div className="space-y-4 mb-6">
                    {/* Faculty Coordinator */}
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-black/60 block mb-1">
                        Faculty Coordinator
                      </span>
                      <p className="text-[15px] font-bold text-black">
                        {club.facultyCoordinators &&
                        club.facultyCoordinators.length > 0
                          ? club.facultyCoordinators
                              .map((f) => (typeof f === "object" ? f.name : f))
                              .join(", ")
                          : club.facultyName || "Coordinator Not Assigned"}
                      </p>
                    </div>

                    {/* Student Lead */}
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-black/60 block mb-1">
                        Student Lead
                      </span>
                      <p className="text-[15px] font-bold text-black">
                        {club.studentCoordinators &&
                        club.studentCoordinators.length > 0
                          ? club.studentCoordinators.join(", ")
                          : "Not Assigned"}
                      </p>
                    </div>

                    {/* Social Links */}
                    {club.socialLinks && club.socialLinks.length > 0 && (
                    <div>
                      <span className="text-[10px] font-black tracking-widest text-black/60 block mb-1">
                        Connect
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {club.socialLinks.map((link, i) => {
                          const platform = link.platform?.toLowerCase() || 'website';
                          const iconProps = { className: "w-5 h-5" };
                          
                          const getIcon = () => {
                            if (platform.includes('instagram')) return <InstagramIcon {...iconProps} />;
                            if (platform.includes('linkedin')) return <LinkedinIcon {...iconProps} />;
                            if (platform.includes('twitter') || platform.includes('x')) return <TwitterIcon {...iconProps} />;
                            if (platform.includes('github')) return <GithubIcon {...iconProps} />;
                            return <i className="ri-links-line text-lg" />;
                          };

                          return (
                            <a 
                              key={link._id || i}
                              href={platform === 'whatsapp' ? `https://wa.me/${link.url.replace(/\s+/g, '')}` : link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-10 h-10 flex items-center justify-center transition-all text-black/70 hover:text-black"
                              title={link.platform}
                            >
                              {getIcon()}
                            </a>
                          );
                        })}
                      </div>
                    </div>
                    )}
                  </div>

                  {/* Bottom Row: Actions */}
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/club/${club.slug || club._id}`}
                      className="flex-1 flex items-center justify-center gap-2 py-2 border border-black/40 rounded-xl text-[12px] font-bold uppercase tracking-widest hover:bg-black/10 transition-all font-black"
                    >
                         <ArrowUpRightIcon >
                               Explore
                          </ArrowUpRightIcon>

                    </Link>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
      </div>
    </div>
  );
};

export default ClubsPage;
