import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EventFeed from './EventFeed';
import Clubspage from './Clubspage';
import ClubLeaderboard from '../components/ClubLeaderboard';
import HomeFooter from '../components/HomeFooter';
import Maintainance from './Maintainance';
import ScrollReveal from '../components/ScrollReveal';
import {ArrowRightIcon} from '../components/ui/arrow-right';
import { InstagramIcon } from '@/components/ui/instagram';
import { GithubIcon } from '@/components/ui/github';
import { LinkedinIcon } from '@/components/ui/linkedin';
import { MailIcon, Github, Linkedin, Twitter } from 'lucide-react';
import { AtSignIcon } from '@/components/ui/at-sign';
import { EarthIcon } from '@/components/ui/earth';
// Ticker items
const tickerItems = [
  'Workshops', 'Hackathons', 'Cultural Fests', 'Sports Meets',
  'Guest Lectures', 'Club Recruitments', 'Tech Talks', 'Campus Events',
];




// Icons are handled by Remix Icons (ri-)

const studentItems = [
  {
    icon: <i className="ri-chat-1-line" />,
    problem: "Cluttered WhatsApp groups",
    solution: "One clean feed for all technical, cultural, and sports events.",
  },
  {
    icon: <i className="ri-time-line" />,
    problem: "Missed registration deadlines",
    solution: "Instant alerts and one-click registration before seats fill.",
  },
  {
    icon: <i className="ri-user-line" />,
    problem: "Zero track record",
    solution: "Auto-build your profile with every event you participate in.",
  },
];

const clubFeatures = [
  { icon: <i className="ri-broadcast-line" />, title: "Reach everyone", desc: "Push to students interested in your domain." },
  { icon: <i className="ri-file-text-line" />, title: "E-certificates", desc: "Auto-generated for every participant." },
  { icon: <i className="ri-bar-chart-line" />, title: "Real-time analytics", desc: "See registrations by branch, live." },
  { icon: <i className="ri-award-line" />, title: "Club showcase", desc: "Dedicated profile for your past achievements." },
];

 let user = null;
  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined") {
      user = JSON.parse(storedUser);
    }
  } catch (err) {
    console.error("Error parsing user from local storage", err);
    localStorage.removeItem("user");
  }
// ── Reusable section label ──────────────────────────────────────────────────
const SectionLabel = ({ children, light = false }) => (
  <div className={`flex items-center gap-2 mb-5 ${light ? 'text-orange-600' : 'text-orange-600'}`}>
    <span className="text-[11px] font-bold uppercase tracking-[0.15em]">{children}</span>
  </div>
);

// ── Primary button ──────────────────────────────────────────────────────────
const BtnPrimary = ({ to, children }) => (
  <Link
    to={to}
    className="inline-flex items-center gap-2 px-8 py-3.5 bg-black text-white border-2 border-black text-[13px] font-bold uppercase tracking-widest rounded-sm hover:bg-orange-600 hover:border-orange-600 transition-all hover:-translate-y-px"
  >
    {children}
  </Link>
);

// ── Secondary button ────────────────────────────────────────────────────────
const BtnSecondary = ({ to, children }) => (
  <Link
    to={to}
    className="text-[#0a0a0a] bg-transparent hover:bg-[#0f1419] hover:text-[#ffffff] border-[#0a0a0a] dark:hover:bg-[#f5f5f5] dark:text-white dark:border-[#f5f5f5] dark:bg-transparent dark:hover:text-black dark:hover:border-[#f5f5f5] transition-all duration-200 ease-in-out focus:ring-4 focus:outline-none focus:ring-[#0f1419]/50 box-border border font-medium leading-5 text-md px-4 py-2.5 inline-flex items-center rounded-4xl cursor-pointer"
  >
    {children}
  </Link>
);

const Home = () => {

  const [tab, setTab] = useState("students");

  useEffect(() => {
    document.title = "CampusNode | NITJ Clubs & Events";
  }, []);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--x-px", `${x}px`);
    e.currentTarget.style.setProperty("--y-px", `${y}px`);
  };
  
   const isMaintenance = import.meta.env.VITE_MAINTENANCE_MODE === 'true';
  if (isMaintenance) {
    return <Maintainance />;
  }
  const bgImages = ["hostels-day.jpeg","csh.jpeg", "mainbuilding.jpeg","hostels-night.jpeg","mainbld.jpeg"];
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % bgImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="myfont text-black bg-white">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col justify-center pt-24 pb-12 lg:pt-32 lg:pb-16 overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {bgImages.map((img, idx) => (
            <img 
              key={idx}
              src={img} 
              alt="University Campus" 
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${bgIndex === idx ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
          <div className="absolute inset-0 bg-white/20 dark:bg-black/60 backdrop-blur-[2px]"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/40 to-transparent dark:from-[#0a0a0a] dark:via-[#0a0a0a]/60 dark:to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white/90 to-transparent dark:from-[#0a0a0a]/90 dark:to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 lg:px-8 w-full">

         

          {/* Headline */}

          <ScrollReveal delay={0.2}>
            <h1 className="font-black text-[clamp(52px,8vw,108px)] leading-[1] tracking-[3px] text-black dark:text-white mb-0">
              Your Campus,<br />
              <span className="text-orange-600">Connected.</span>
            </h1>
          </ScrollReveal>

          {/* Sub + CTAs */}
          <ScrollReveal delay={0.3}>
            <div className="mt-12 flex flex-wrap items-end gap-10 justify-between">
              <div className="max-w-xl">
                <h2 className="text-lg md:text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3 leading-snug">
                  Events, Clubs, Lost & Found, and More — All in One Place.
                </h2>
                <p className="text-sm md:text-[15px] font-light text-neutral-700 dark:text-neutral-350 leading-relaxed">
                  CampusNode is a student platform for NIT Jalandhar that helps students discover campus events, join clubs and societies, find opportunities, stay updated with announcements, and recover lost items through an organized Lost & Found system. Our goal is to create a connected campus where students can easily access information, engage with communities, and never miss important opportunities.
                </p>
              </div>
              <div className="flex gap-3 flex-wrap">
               <Link
  to="/events"
  className="text-white bg-[#0f1419] hover:bg-transparent hover:text-[#0a0a0a] hover:border-[#0a0a0a] dark:bg-[#f5f5f5] dark:text-[#0a0a0a] dark:hover:bg-transparent dark:hover:text-[#f5f5f5] dark:hover:border-[#f5f5f5] transition-all duration-200 ease-in-out focus:ring-4 focus:outline-none focus:ring-[#0f1419]/50 box-border border border-transparent font-medium leading-5 text-sm px-4 py-2.5 inline-flex items-center rounded-4xl cursor-pointer"
>
  <i className="ri-calendar-event-line text-lg mr-2" /> Browse Events
</Link>

<Link
  to="/clubs"
  className="text-white bg-[#0f1419] hover:bg-transparent hover:text-[#0a0a0a] hover:border-[#0a0a0a] dark:bg-[#f5f5f5] dark:text-[#0a0a0a] dark:hover:bg-transparent dark:hover:text-[#f5f5f5] dark:hover:border-[#f5f5f5] transition-all duration-200 ease-in-out focus:ring-4 focus:outline-none focus:ring-[#0f1419]/50 box-border border border-transparent font-medium leading-5 text-sm px-4 py-2.5 inline-flex items-center rounded-4xl cursor-pointer"
>
  <i className="ri-group-line text-lg mr-2" /> Explore Clubs
</Link>

{!user && (
  <Link
    to="/login"
    className="text-white bg-[#0f1419] hover:bg-transparent hover:text-[#0a0a0a] hover:border-[#0a0a0a] dark:bg-[#f5f5f5] dark:text-[#0a0a0a] dark:hover:bg-transparent dark:hover:text-[#f5f5f5] dark:hover:border-[#f5f5f5] transition-all duration-200 ease-in-out focus:ring-4 focus:outline-none focus:ring-[#0f1419]/50 box-border border border-transparent font-medium leading-5 text-sm px-4 py-2.5 inline-flex items-center rounded-4xl cursor-pointer"
  >
    <i className="ri-login-box-line text-lg mr-2" /> Login / Signup
  </Link>
)}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── TICKER ───────────────────────────────────────────────────────── */}
      {/* <div
        className="overflow-hidden bg-orange-600 py-2 max-w-7xl mx-auto "
        style={{ whiteSpace: 'nowrap' }}
      >
        <div
          className="inline-flex"
          style={{ animation: 'ticker 22s linear infinite', width: 'max-content' }}
        >
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-3.5 px-9 text-white text-[12px] font-bold uppercase tracking-[0.1em]"
            >
              <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full flex-shrink-0" />
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
      </div> */}

      {/* ── LATEST EVENTS ────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#fefce8]/30 border-b-2 border-neutral-300">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-8">
          <ScrollReveal direction="up">
            <div className="mb-12">
              <SectionLabel>Latest Happenings</SectionLabel>
              <h2 className="font-black text-[clamp(28px,4vw,44px)] text-black leading-[1.1] tracking-wide">
                What's Buzzing<br />on Campus
              </h2>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <EventFeed limit={6} hideHeader={true} showFilters={false} onlyActive={true} />
          </ScrollReveal>
          <ScrollReveal delay={0.3}>
            <div className="flex justify-center mt-12">
              <BtnSecondary to="/events">
              <ArrowRightIcon size={20} >

                Explore All Events 
              </ArrowRightIcon>
              </BtnSecondary>
            </div>
          </ScrollReveal>
        </div>
      </section>

      

      {/* ── CLUBS ─────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#fefce8]/30 border-b-2 border-neutral-300">
        <div className="max-w-7xl mx-auto px-4">
          <ScrollReveal direction="up">
            <div className="mb-12">
             
              <h2 className="font-black text-[clamp(28px,4vw,44px)] text-black leading-[1.1] tracking-wide text-center">
                NITJ Clubs & Societies
              </h2>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <Clubspage isHome={true} />
          </ScrollReveal>
          <ScrollReveal delay={0.3}>
            <div className="flex justify-center mt-12">
              <BtnSecondary to="/clubs">
              <ArrowRightIcon  size={20}>

                Explore All 
              </ArrowRightIcon>
              </BtnSecondary>
            </div>
          </ScrollReveal>
        </div>
      </section>


      {/* ── LEADERBOARD ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#fefce8]/30 border-b-2 border-neutral-300">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            <div className="lg:col-span-4">
              <ScrollReveal direction="left">
                <SectionLabel>Campus Rankings</SectionLabel>
                <h2 className="font-black text-[clamp(28px,4vw,44px)] text-black leading-[1.1] tracking-wide mb-6">
                  Club<br /><span className="text-orange-600 text-6xl">Hall of Fame</span>
                </h2>
                <p className="text-neutral-500 leading-relaxed mb-8">
                  Recognition for the most active student organizations at NITJ. Activity is measured by the total number of events successfully hosted and registered through CampusNode.
                </p>
              
              </ScrollReveal>
            </div>
            <div className="lg:col-span-8">
              <ScrollReveal delay={0.2} direction="right">
                <ClubLeaderboard />
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOR STUDENTS ─────────────────────────────────────────────────── */}
         <section className="py-20 bg-[#fefce8]/30 border-b border-neutral-200">
      <div className="max-w-6xl mx-auto px-6">

        {/* Tab switcher */}
        <div className="flex border-b border-neutral-200 mb-12">
          {["students", "clubs"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 -mb-px
                ${tab === t
                  ? "border-orange-600 text-orange-600"
                  : "border-transparent text-neutral-400 hover:text-neutral-600"
                }`}
            >
              {t === "students" ? "For Students" : "For Clubs & Societies"}
            </button>
          ))}
        </div>

        {/* ── STUDENTS ── */}
        {tab === "students" && (
          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* Left: text */}
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-orange-600 mb-3">
                Students
              </p>
              <h2 className="text-4xl font-black leading-tight tracking-tight text-black mb-8">
                Never miss a<br />campus beat{" "}
                <span className="text-orange-600">again.</span>
              </h2>

              <div className="flex flex-col gap-4">
                {studentItems.map((item, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-9 h-9 flex-shrink-0 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                      {item.icon}
                    </div>
                    <div className="pt-0.5">
                      <p className="text-xs text-neutral-400 line-through mb-0.5">{item.problem}</p>
                      <p className="text-sm font-semibold text-black leading-snug">{item.solution}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button className="mt-8 inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 transition-colors text-white text-sm font-semibold px-5 py-2.5 rounded-lg">
                Join now
                <i className="ri-arrow-right-line" />
              </button>
            </div>

            {/* Right: image */}
            <div className="relative hidden md:block">
              <img
                src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80"
                alt="Student life"
                className="w-full h-[400px] object-cover rounded-xl border border-neutral-200"
                style={{ filter: "saturate(0.9)" }}
              />
              <div className="absolute -bottom-4 -right-4 bg-yellow-400 border-2 border-gray-500 dark:border-gray-200 rounded-lg px-4 py-3">
                <p className="text-lg font-black text-[#0d1422] leading-none">1-Click</p>
                <p className="text-[11px] text-[#0d1422] mt-0.5">Event Registration</p>
              </div>
            </div>
          </div>
        )}

        {/* ── CLUB HEADS ── */}
        {tab === "clubs" && (
          <div>
            <div className="mb-10">
              <p className="text-xs font-semibold tracking-widest uppercase text-orange-600 mb-3">
                Clubs & Societies
              </p>
              <h2 className="text-4xl font-black leading-tight tracking-tight text-black">
                Less logistics,{" "}
                <span className="text-orange-600">more impact.</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {clubFeatures.map((f, i) => (
                <div
                  key={i}
                  className="p-5 border border-neutral-200 rounded-xl hover:border-orange-400 transition-colors group"
                >
                  <div className="w-9 h-9 bg-orange-600 rounded-lg flex items-center justify-center text-white mb-4 group-hover:bg-orange-700 transition-colors">
                    {f.icon}
                  </div>
                  <p className="text-sm font-semibold text-black mb-1">{f.title}</p>
                  <p className="text-xs text-neutral-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            {/* Quote */}
            {/* <div className="border-l-4 border-orange-600 pl-5 py-1">
              <p className="text-base font-semibold text-black leading-snug">
                "Finally, no more manually checking 500 screenshots of payment proofs."
              </p>
              <p className="text-xs text-neutral-400 mt-1">— Club Coordinator, Engineering fest</p>
            </div> */}
          </div>
        )}

      </div>
    </section>


    

      {/* ---- ABOUT CAMPUSNODE ---- */}
     <section className="py-24 bg-[#fefce8]/30 border-b border-neutral-300">
  <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      <ScrollReveal direction="left">
        <div>
          <SectionLabel>Our Vision</SectionLabel>
          <h2 className="font-black text-[clamp(32px,4vw,56px)] leading-[1.1] tracking-tight text-black dark:text-white mb-8">
            Creating a Truly<br /><span className="text-orange-600">Connected Campus.</span>
          </h2>
          <div className="space-y-6 text-neutral-700 dark:text-neutral-300 leading-relaxed text-[17px]">
            <p>
              CampusNode serves as the central hub for the NIT Jalandhar community. By bringing together events, clubs, announcements, and a structured Lost & Found system, we simplify campus life. We believe that accessing campus resources, engaging with student organizations, and finding opportunities should be simple and seamless.
            </p>
            <p>
              Our vision is to build a vibrant and digitally integrated ecosystem where student groups can reach their audience effectively and students can easily discover their passions, collaborate on ideas, and never miss out on key campus events and opportunities.
            </p>
          </div>

          {/* Stats - Updated for Campus Scope */}
          <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-neutral-200">
            <div>
              <div className="text-4xl font-black text-black">25+</div>
              <div className="text-[11px] font-bold tracking-widest text-neutral-400 mt-1">Active Clubs & Societies</div>
            </div>
            <div>
              <div className="text-4xl font-black text-black">5k+</div>
              <div className="text-[11px] font-bold tracking-widest text-neutral-400 mt-1">Student Base</div>
            </div>
            <div>
              <div className="text-4xl font-black text-black">100%</div>
              <div className="text-[11px] font-bold  tracking-widest text-neutral-400 mt-1">NITJ Focused</div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal direction="right" delay={0.2}>
        <div className="flex gap-4 items-center justify-center lg:justify-end">
          {/* Visual placeholders for App Mockups or Campus Photos */}
          <div className="w-1/2 max-w-[280px] aspect-[3/4] border-2 border-gray-200 rounded-sm bg-neutral-100 overflow-hidden translate-y-8 ">
             <div className="w-full h-full flex items-center justify-center text-neutral-300">
               {/* <i className="ri-smartphone-line text-6xl" /> */}
               <img src="mainbuilding.jpeg" alt="oh not found" className="w-full h-full object-cover"/>
             </div>
          </div>
          <div className="w-1/2 max-w-[280px] aspect-[3/4] border-2 border-gray-200 rounded-sm bg-neutral-200 overflow-hidden -translate-y-4 ">
            <div className="w-full h-full flex items-center justify-center text-neutral-400">
             <img src="itbuilding.jpeg" alt="ohhhhhh not found yaar" className="w-full h-full object-cover"/>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  </div>
</section>

      {/* ── FACULTY & TEAM ────────────────────────────────────────────────── */}
      <section id="team" className="py-24 bg-neutral-50/50 dark:bg-neutral-950/20 border-b border-neutral-200 dark:border-neutral-850 scroll-mt-20 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-orange-500/[0.02] dark:bg-orange-500/[0.04] rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center mb-16 text-center max-w-3xl mx-auto">
            <ScrollReveal direction="up" delay={0.1}>
              <span className="text-orange-600 dark:text-orange-500 font-bold tracking-[0.2em] text-xs uppercase block mb-3">
                The Innovators
              </span>
            </ScrollReveal>
            
            <ScrollReveal direction="up" delay={0.2}>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white mb-6">
                The Minds Behind <span className="logofont font-light">Campus<span className="text-orange-600 dark:text-orange-500">Node</span></span>
              </h2>
            </ScrollReveal>
            
            <ScrollReveal direction="up" delay={0.3}>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base leading-relaxed font-light">
                We are student innovators, creators, and engineers building the digital gateway for NITJ.
              </p>
            </ScrollReveal>
          </div>

          {/* Responsive Grid Layout */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12">
            {[
              {
                id: '1',
                imageUrl: 'https://uxwing.com/wp-content/themes/uxwing/download/peoples-avatars/no-profile-picture-icon.png',
                socials: { github: 'https://github.com', linkedin: 'https://linkedin.com', twitter: 'https://twitter.com' }
              },
              {
                id: '2',
                imageUrl: 'https://uxwing.com/wp-content/themes/uxwing/download/peoples-avatars/no-profile-picture-icon.png',
                socials: { github: 'https://github.com', linkedin: 'https://linkedin.com', twitter: 'https://twitter.com' }
              },
              {
                id: '3',
                imageUrl: 'https://uxwing.com/wp-content/themes/uxwing/download/peoples-avatars/no-profile-picture-icon.png',
                socials: { github: 'https://github.com', linkedin: 'https://linkedin.com', twitter: 'https://twitter.com' }
              },
              {
                id: '4',
                imageUrl: 'https://uxwing.com/wp-content/themes/uxwing/download/peoples-avatars/no-profile-picture-icon.png',
                socials: { github: 'https://github.com', linkedin: 'https://linkedin.com' }
              },
              {
                id: '5',
                imageUrl: 'https://uxwing.com/wp-content/themes/uxwing/download/peoples-avatars/no-profile-picture-icon.png',
                socials: { github: 'https://github.com', linkedin: 'https://linkedin.com', twitter: 'https://twitter.com' }
              },
              {
                id: '6',
                imageUrl: 'https://uxwing.com/wp-content/themes/uxwing/download/peoples-avatars/no-profile-picture-icon.png',
                socials: { github: 'https://github.com', linkedin: 'https://linkedin.com' }
              },
              {
                id: '7',
                imageUrl: 'https://uxwing.com/wp-content/themes/uxwing/download/peoples-avatars/no-profile-picture-icon.png',
                socials: { github: 'https://github.com', linkedin: 'https://linkedin.com', twitter: 'https://twitter.com' }
              },
              {
                id: '8',
                imageUrl: 'https://uxwing.com/wp-content/themes/uxwing/download/peoples-avatars/no-profile-picture-icon.png',
                socials: { github: 'https://github.com', linkedin: 'https://linkedin.com', twitter: 'https://twitter.com' }
              }
            ].map((member, index) => (
              <ScrollReveal
                key={member.id}
                direction="up"
                delay={0.1 + (index % 4) * 0.08}
              >
                <div className="flex flex-col group">
                  {/* Image Container with square aspect ratio, rounded borders, and scale transition */}
                  <figure className="relative aspect-square overflow-hidden rounded-3xl bg-neutral-200 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 hover:border-neutral-355 dark:hover:border-neutral-700/60 transition-colors duration-300 hover:scale-[1.02] transition-transform duration-300 ease-out">
                    <img
                      src={member.imageUrl}
                      alt="Team Member"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/[0.02] dark:bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </figure>

                  {/* Details */}
                  <figcaption className="mt-4 flex flex-col gap-2">
                    <div>
                      <h3 className="text-base font-bold text-neutral-900 dark:text-white tracking-wide leading-snug">
                        Coming Soon..
                      </h3>
                      <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-0.5">
                        Coming Soon..
                      </p>
                    </div>

                    {/* Social links */}
                    <div className="flex flex-row gap-3.5 items-center">
                      {member.socials.github && (
                        <a
                          href={member.socials.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-450 dark:text-neutral-500 hover:text-black dark:hover:text-white transition-colors duration-250"
                          aria-label="GitHub"
                        >
                          <Github size={15} />
                        </a>
                      )}
                      {member.socials.linkedin && (
                        <a
                          href={member.socials.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-455 dark:text-neutral-500 hover:text-blue-600 dark:hover:text-white transition-colors duration-250"
                          aria-label="LinkedIn"
                        >
                          <Linkedin size={15} />
                        </a>
                      )}
                      {member.socials.twitter && (
                        <a
                          href={member.socials.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-455 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors duration-250"
                          aria-label="Twitter/X"
                        >
                          <Twitter size={15} />
                        </a>
                      )}
                    </div>
                  </figcaption>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Home Footer */}
      <HomeFooter />

    </div>
  );
};

export default Home;