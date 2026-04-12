import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import EventFeed from './EventFeed';
import Clubspage from './Clubspage';
import HomeFooter from '../components/HomeFooter';
import Maintainance from './Maintainance';
import ScrollReveal from '../components/ScrollReveal';
import {ArrowRightIcon} from '../components/ui/arrow-right';
import { InstagramIcon } from '@/components/ui/instagram';
import { GithubIcon } from '@/components/ui/github';
import { LinkedinIcon } from '@/components/ui/linkedin';
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
    <span className={`block w-6 h-0.5 ${light ? 'bg-orange-600' : 'bg-orange-600'}`} />
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
    className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-black border-2 border-black text-[13px] font-bold uppercase tracking-widest rounded-sm hover:bg-yellow-400 hover:border-yellow-400 transition-all hover:-translate-y-px"
  >
    {children}
  </Link>
);

const Home = () => {

 const [tab, setTab] = useState("students");

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

  return (
    <div className="myfont text-black bg-white">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col justify-center pt-24 pb-12 lg:pt-32 lg:pb-16 overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img 
            // src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
            src="csh.jpeg" 
            alt="University Campus" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[3px]"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/50 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white/90 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 lg:px-8 w-full">

         

          {/* Headline */}

          <ScrollReveal delay={0.2}>
            <h1 className="font-black text-[clamp(52px,8vw,108px)] leading-[1] tracking-[3px] text-black mb-0">
              Discover<br />
              <span className="text-orange-600">Clubs & Events</span><br />
              at NITJ...
            </h1>
          </ScrollReveal>

          {/* Sub + CTAs */}
          <ScrollReveal delay={0.3}>
            <div className="mt-12 flex flex-wrap items-end gap-10 justify-between">
              <p className="text-[17px] font-light text-neutral-600 max-w-sm leading-relaxed">
                ClubSetu connects NIT Jalandhar students with campus clubs and events in one place. 
                Discover clubs, explore upcoming events, and stay updated with everything happening on campus.
              </p>
              <div className="flex gap-3 flex-wrap">
               <Link
  to="/events"
  className="text-white bg-[#0f1419] hover:bg-transparent hover:text-black hover:border-black transition-all duration-200 ease-in-out focus:ring-4 focus:outline-none focus:ring-[#0f1419]/50 box-border border border-transparent font-medium leading-5 text-sm px-4 py-2.5 inline-flex items-center rounded-4xl cursor-pointer"
>
  <i className="ri-calendar-event-line text-lg mr-2" /> Browse Events
</Link>

<Link
  to="/clubs"
  className="text-white bg-[#0f1419] hover:bg-transparent hover:text-black hover:border-black transition-all duration-200 ease-in-out focus:ring-4 focus:outline-none focus:ring-[#0f1419]/50 box-border border border-transparent font-medium leading-5 text-sm px-4 py-2.5 inline-flex items-center rounded-4xl cursor-pointer"
>
  <i className="ri-group-line text-lg mr-2" /> Explore Clubs
</Link>

{!user && (
  <Link
    to="/login"
    className="text-white bg-[#0f1419] hover:bg-transparent hover:text-black hover:border-black transition-all duration-200 ease-in-out focus:ring-4 focus:outline-none focus:ring-[#0f1419]/50 box-border border border-transparent font-medium leading-5 text-sm px-4 py-2.5 inline-flex items-center rounded-4xl cursor-pointer"
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
      <div
        className="overflow-hidden bg-orange-600  py-3 mt-10"
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
      </div>

      {/* ── LATEST EVENTS ────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#fefce8]/30 border-b-2 border-neutral-300">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
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
              <ArrowRightIcon >

                View All Events 
              </ArrowRightIcon>
              </BtnSecondary>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── CLUBS ─────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#fefce8]/30 border-b-2 border-neutral-300">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
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
              <ArrowRightIcon >

                View More 
              </ArrowRightIcon>
              </BtnSecondary>
            </div>
          </ScrollReveal>
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
              {t === "students" ? "For Students" : "For Club Heads"}
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
              <div className="absolute -bottom-4 -right-4 bg-yellow-400 border-2 border-gray-200 rounded-lg px-4 py-3">
                <p className="text-lg font-black leading-none">1-Click</p>
                <p className="text-[11px] text-neutral-700 mt-0.5">Event Registration</p>
              </div>
            </div>
          </div>
        )}

        {/* ── CLUB HEADS ── */}
        {tab === "clubs" && (
          <div>
            <div className="mb-10">
              <p className="text-xs font-semibold tracking-widest uppercase text-orange-600 mb-3">
                Club heads
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
            <div className="border-l-4 border-orange-600 pl-5 py-1">
              <p className="text-base font-semibold text-black leading-snug">
                "Finally, no more manually checking 500 screenshots of payment proofs."
              </p>
              <p className="text-xs text-neutral-400 mt-1">— Club head, Engineering fest</p>
            </div>
          </div>
        )}

      </div>
    </section>


    

      {/* ---- ABOUT CLUBSETU ---- */}
     <section className="py-24 bg-[#fefce8]/30 border-b border-neutral-300">
  <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      <ScrollReveal direction="left">
        <div>
          <SectionLabel>Our Vision</SectionLabel>
          <h2 className="font-black text-[clamp(32px,4vw,56px)] leading-[1.1] tracking-tight text-black mb-8">
            The Digital Pulse of<br /><span className="text-orange-600">NITJ Campus Life.</span>
          </h2>
          <div className="space-y-6 text-neutral-700 leading-relaxed text-[17px]">
            <p>
              ClubSetu is the unified digital gateway designed specifically for the NIT Jalandhar community. We eliminate the chaos of multiple WhatsApp groups and scattered posters by providing a single, seamless platform where clubs can thrive and students can discover their passions.
            </p>
            <p>
              By centralizing event registrations, club memberships, and campus updates, we are building a more connected and engaged student body. Our mission is to ensure that no opportunity at NITJ goes unnoticed and every talent finds its stage.
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
      <section id="team" className="py-24 bg-[#fefce8]/30 border-b border-neutral-300 scroll-mt-20">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8 text-center">
          <ScrollReveal direction="up">
  <div className="mb-16">
    <h2 className="font-black text-[clamp(32px,4vw,56px)] leading-[1.1] tracking-tight text-black mb-4">
      The Minds Behind <span className="border-b-4 border-orange-600">ClubSetu</span>
    </h2>
    <p className="text-neutral-600 max-w-2xl mx-auto text-[18px] leading-relaxed">
      We are a team of passionate student developers and campus leaders dedicated to 
      bridging the gap between NITJ clubs and students through seamless digital experiences.
    </p>
  </div>
</ScrollReveal>

          {/* Faculty Coordinator */}
          <ScrollReveal direction="up" delay={0.1}>
            <div className="mb-20">
              <div className="inline-block relative">
              
                <div 
                  onMouseMove={handleMouseMove}
                  className="feature-card relative border-2 rounded-sm  border-gray-200 bg-white p-8 max-w-md mx-auto group hover:-translate-y-1 transition-all"
                >
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-24 h-24 shrink-0  border-2 border-gray-500 bg-neutral-500 overflow-hidden flex items-center justify-center">
                      <i className="ri-user-star-line text-4xl text-neutral-300" />
                    </div>
                    <div className="text-left">
                      <div className="text-[11px] font-semibold tracking-[0.2em] text-orange-600 mb-1">Faculty Coordinator</div>
                      <h3 className="text-2xl font-black text-black mb-2">Himanshu Yadav</h3>
                      <div className="flex gap-3 text-neutral-700">
                        <a href="#" className="hover:text-orange-600"><i className="ri-linkedin-box-fill text-xl" /></a>
                        <a href="#" className="hover:text-orange-600"><i className="ri-mail-fill text-xl" /></a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Team Members Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Coming Soon", role: "Coming Soon", github: "#", linkedin: "#" },
              { name: "Coming Soon", role: "Coming Soon", github: "#", linkedin: "#" },
              { name: "Coming Soon", role: "Coming Soon", github: "#", linkedin: "#" },
              { name: "Coming Soon", role: "Coming Soon", github: "#", linkedin: "#" },
              { name: "Coming Soon", role: "Coming Soon", github: "#", linkedin: "#" },
              { name: "Coming Soon", role: "Coming Soon", github: "#", linkedin: "#" },
            ].map((member, i) => (
              <ScrollReveal key={i} direction="up" delay={0.1 + (i * 0.05)}>
                <div 
                  onMouseMove={handleMouseMove}
                  className="feature-card border-2 border-gray-200 bg-white rounded-sm overflow-hidden flex transition-all group"
                >
                  <div className="relative z-10 flex w-full">
                    <div className="w-1/3 aspect-[3/4] bg-neutral-100 border-r-2 border-gray-100 flex items-center justify-center text-neutral-300 overflow-hidden">
                      <i className="ri-user-3-line text-4xl" />
                    </div>
                    <div className="w-2/3 p-4 flex flex-col justify-center text-left">
                      <h3 className="font-bold text-[18px] text-black leading-tight mb-1 transition-colors tracking-wider">{member.name}</h3>
                      <p className="text-[12px] font-medium text-neutral-500 mb-4">{member.role}</p>
                      <div className="flex gap-2.5 mt-auto">
                        <a href={member.github} className="w-8 h-8 flex items-center justify-center  text-black rounded-sm transition-colors">
                          {/* <i className="ri-github-fill" /> */}
                         <GithubIcon/>
                        </a>
                        <a href={member.linkedin} className="w-8 h-8 flex items-center justify-center  text-black rounded-sm transition-colors">
                          <LinkedinIcon/>
                        </a>
                      </div>
                    </div>
                  </div>
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