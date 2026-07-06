import React, { useState, useEffect } from "react";
import axios from "axios";
import ScrollReveal from "../components/ScrollReveal";
import ClubCard from "../components/ClubCard";
import ClubCardSkeleton from "../components/skeletons/ClubCardSkeleton";
import { useTheme } from "../context/ThemeContext";

const ClubsPage = ({ isHome = false }) => {
  const { isDark } = useTheme();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isHome) {
      document.title = "Clubs & Societies - CampusNode";
    }
  }, [isHome]);

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

  const tickerItems = [
    'Aarogya Club', 'Team Cultural Affairs (TCA)', 'APOGEE (Space Club)', 'FinNest (Finance Society)', 
    'E-Cell', 'R-tist (Robotics Club)', 'LADC (Literary and Debating Club)', 'Kalakaar (Dramatics Club)', 
    'Bawre (Dramatics Club)', 'Netra (Photography Club)', 'Fine Arts Society (FAS)', 'Prayaas', 
    'Rajbhasha Samiti', 'Green Club', 'Sanskriti Club', 'Vortex (E-sports Club)', 
    'Yodha Club', 'Rural Activity Club', 'Innovation Club', 'Movie Club',
    'Fashion and Modelling Club', 'Chetna', 'SPIC MACAY', 'PACE (Computer Engineers)',
    'OpenGeest (CSE Society)', 'SOME (Mechanical Engineering)', 'SOECE (Electronics & Communication)', 
    'ChESS (Chemical Engineering)', 'SocCEr (Civil Engineering)', 'SOBER (Biotechnology Society)'
  ];

  if (loading) {
    return (
      <div className={`${isHome ? "" : "min-h-screen bg-gray-50 dark:bg-neutral-950 py-12"} px-3 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(isHome ? 6 : 9)].map((_, i) => (
            <ClubCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={isHome ? "" : "min-h-screen bg-gray-50 dark:bg-neutral-950 py-12 px-4 transition-colors duration-300"}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Geom:ital,wght@0,300..900;1,300..900&display=swap');`}</style>

      {/* Page Header - Hide if on Home */}
      {!isHome && (
        <div className="text-center mb-14">
          <h1 className="text-4xl font-black text-black dark:text-white tracking-wide">
            NITJ Clubs & Societies
          </h1>
          <p className="mt-4 text-neutral-500 dark:text-neutral-400 tracking-widest text-sm font-bold">
            Explore student clubs, connect with coordinators, and join
            activities.
          </p>
        </div>
      )}

      {clubsToShow.length === 0 && (
        <div className="text-center py-20 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <p className="text-lg font-medium text-gray-600 dark:text-neutral-300">
            No clubs and societies details found
          </p>
          <p className="text-sm text-gray-400 dark:text-neutral-500 mt-2">
            Please check back later for clubs and societies.
          </p>
        </div>
      )}

      {/* Clubs Grid */}
      <div className={isHome ? "grid md:grid-cols-2 lg:grid-cols-3 gap-8" : "max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8"}>
        {Array.isArray(clubsToShow) &&
          clubsToShow.map((club, index) => (
            <ScrollReveal
              direction="up"
              delay={(index % 3) * 0.08}
              key={club._id}
            >
              <ClubCard club={club} />
            </ScrollReveal>
          ))}
      </div>

      <div
        className="overflow-hidden py-3 mt-14 select-none"
        style={{ whiteSpace: 'nowrap' }}
      >
        <div
          className="inline-flex"
          style={{ animation: 'ticker 60s linear infinite', width: 'max-content' }}
        >
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-3.5 px-9 text-[20px] font-extrabold tracking-[-0.5px] text-neutral-400 dark:text-neutral-600"
              style={{ fontFamily: "'Geom', sans-serif" }}
            >
              {item}
            </span>
          ))}
        </div>
        <style>{`
          @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          .feature-card { position: relative; }
          .feature-card::before {
            content: "";
            position: absolute;
            inset: -2px;
            background: radial-gradient(
              300px circle at var(--x-px) var(--y-px),
              rgba(244, 87, 52, 0.25),
              transparent 30%
            );
            z-index: 1;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s;
          }
          .feature-card:hover::before {
            opacity: 1;
          }
        `}</style>
      </div>
    </div>
  );
};

export default ClubsPage;
