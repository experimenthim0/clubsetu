import React from 'react';
import { Link } from 'react-router-dom';
import EventFeed from './EventFeed';
import Clubspage from './Clubspage';
import HomeFooter from '../components/HomeFooter';

// Ticker items
const tickerItems = [
  'Workshops', 'Hackathons', 'Cultural Fests', 'Sports Meets',
  'Guest Lectures', 'Club Recruitments', 'Tech Talks', 'Campus Events',
];

// ── Reusable section label ──────────────────────────────────────────────────
const SectionLabel = ({ children, light = false }) => (
  <div className={`flex items-center gap-2 mb-5 ${light ? 'text-yellow-400' : 'text-orange-600'}`}>
    <span className={`block w-6 h-0.5 ${light ? 'bg-yellow-400' : 'bg-orange-600'}`} />
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
  return (
    <div className="myfont text-black bg-white">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="min-h-screen flex flex-col justify-center bg-white border-b-2 border-black pt-16 pb-0">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8 w-full">

          {/* Top badges */}
          <div className="flex items-center justify-between mb-14 flex-wrap gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              {/* <span className="inline-flex items-center gap-2 bg-orange-600 text-white text-[11px] font-bold uppercase tracking-[0.12em] px-4 py-1.5 rounded-full">
                <i className="ri-fire-fill" /> Trending on Campus
              </span> */}
              <span className="inline-flex items-center gap-2 bg-black text-white text-[11px] font-bold uppercase tracking-[0.12em] px-4 py-1.5 rounded-full">
                <i className="ri-school-line" /> Exclusively for NITJ
              </span>
            </div>
            {/* <span className="bg-yellow-400 border-2 border-black text-black text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-sm">
              2026 Edition
            </span> */}
          </div>

          {/* Headline */}
          <h1 className="font-black text-[clamp(52px,8vw,108px)] leading-[1] tracking-[-3px] text-black mb-0">
            Discover<br />
            <span className="text-orange-600">&amp; Manage</span><br />
            College Events.
          </h1>

          {/* Sub + CTAs */}
          <div className="mt-12 flex flex-wrap items-end gap-10">
            <p className="text-[17px] font-light text-neutral-600 max-w-sm leading-relaxed">
              The ultimate hub for students and clubs. Join the community, explore passions, and never miss out on campus life.
            </p>
            <div className="flex gap-3 flex-wrap">
              <BtnPrimary to="/events">
                <i className="ri-calendar-event-line text-sm" /> Explore Events
              </BtnPrimary>
              <BtnSecondary to="/register">
                <i className="ri-user-add-line text-sm" /> Get Started
              </BtnSecondary>
            </div>
          </div>

          {/* Hero image strip */}
          <div className="mt-14 border-2 border-black rounded-sm overflow-hidden relative">
            <img
              src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
              alt="Campus Life"
              className="w-full h-72 object-cover object-[center_40%] block"
              style={{ filter: 'saturate(0.8)' }}
            />
            <div className="absolute bottom-4 left-4 bg-black text-white text-[11px] font-bold uppercase tracking-[0.12em] px-4 py-2 rounded-sm">
              NITJ · Jalandhar
            </div>
            <div className="absolute bottom-4 right-4 bg-yellow-400 text-black text-[12px] font-black px-4 py-2 rounded-sm border-2 border-black">
              10+ Events Hosted
            </div>
          </div>
        </div>
      </section>

      {/* ── TICKER ───────────────────────────────────────────────────────── */}
      <div
        className="overflow-hidden bg-orange-600 border-b-2 border-black py-3"
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
        <style>{`@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
      </div>

      {/* ── LATEST EVENTS ────────────────────────────────────────────────── */}
      <section className="py-24 bg-white border-b-2 border-black">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
          <div className="mb-12">
            <SectionLabel>Latest Happenings</SectionLabel>
            <h2 className="font-black text-[clamp(28px,4vw,44px)] text-black leading-[1.1] tracking-tight">
              What's Buzzing<br />on Campus
            </h2>
          </div>
          <EventFeed limit={6} hideHeader={true} />
          <div className="flex justify-center mt-12">
            <BtnSecondary to="/events">
              View All Events <i className="ri-arrow-right-line text-sm" />
            </BtnSecondary>
          </div>
        </div>
      </section>

      {/* ── CLUBS ─────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-orange-50 border-b-2 border-black">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
          <div className="mb-12">
            <SectionLabel>Our Clubs</SectionLabel>
            <h2 className="font-black text-[clamp(28px,4vw,44px)] text-black leading-[1.1] tracking-tight">
              Find Your<br />Community
            </h2>
          </div>
          <Clubspage isHome={true} />
          <div className="flex justify-center mt-12">
            <BtnSecondary to="/clubs">
              View More <i className="ri-arrow-right-line text-sm" />
            </BtnSecondary>
          </div>
        </div>
      </section>

      {/* ── FOR STUDENTS ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-white border-b-2 border-black">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-20 items-center">

          {/* Image */}
          <div className="relative">
            {/* Offset border */}
            <div className="absolute -top-4 -left-4 w-full h-full border-2 border-orange-600 rounded-sm pointer-events-none" />
            <img
              src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              alt="Student Life"
              className="relative w-full h-[460px] object-cover rounded-sm border-2 border-black block"
              style={{ filter: 'saturate(0.9)' }}
            />
            {/* Floating badge */}
            <div className="absolute -bottom-5 -right-5 bg-yellow-400 border-2 border-black rounded-sm px-5 py-4 hidden md:block">
              <div className="text-[22px] font-black leading-none">1-Click</div>
              <div className="text-[12px] text-neutral-700 mt-1">Event Registration</div>
            </div>
          </div>

          {/* Text */}
          <div>
            <SectionLabel>For Students</SectionLabel>
            <h2 className="font-black text-[clamp(32px,4vw,52px)] leading-[1.1] tracking-tight text-black mb-10">
              Never Miss a<br />Campus Beat<br /><span className="text-orange-600">Again.</span>
            </h2>

            <div className="flex flex-col gap-7">
              {[
                {
                  problem: 'Cluttered WhatsApp Groups',
                  solution: 'One clean feed for all technical, cultural, and sports events.',
                  icon: 'ri-whatsapp-line',
                },
                {
                  problem: 'Missed Registration Deadlines',
                  solution: 'Get instant opportunities and register with a single click.',
                  icon: 'ri-timer-flash-line',
                },
                {
                  problem: 'Zero Track Record',
                  solution: 'Build your profile. We track every event you participate in.',
                  icon: 'ri-profile-line',
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-11 h-11 flex-shrink-0 bg-orange-50 border-2 border-orange-600 rounded-sm flex items-center justify-center text-orange-600 text-lg">
                    <i className={item.icon} />
                  </div>
                  <div>
                    <div className="text-[12px] text-neutral-400 line-through tracking-wide mb-1">{item.problem}</div>
                    <div className="text-[16px] font-bold text-black leading-snug">{item.solution}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <BtnPrimary to="/register">
                <i className="ri-arrow-right-line text-sm" /> Join Now — It's Free
              </BtnPrimary>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOR CLUB HEADS ───────────────────────────────────────────────── */}
      <section className="py-24 bg-neutral-950 border-b-2 border-neutral-800">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8">

          {/* Header */}
          <div className="flex items-end justify-between mb-14 flex-wrap gap-6">
            <div>
              <SectionLabel light>For Club Heads</SectionLabel>
              <h2 className="font-black text-[clamp(32px,4vw,56px)] leading-[1.1] tracking-tight text-white">
                Less Logistics,<br /><span className="text-orange-500">More Impact.</span>
              </h2>
            </div>
            <p className="text-[15px] text-neutral-400 max-w-xs leading-relaxed">
              Stop wrestling with Google Forms and messy spreadsheets. We give you a command center for your entire event lifecycle.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
            {[
              { title: 'Reach Everyone',     desc: 'Push notifications to students interested in your domain.(Coming Soon)',      icon: 'ri-broadcast-line' },
              { title: 'Digital Attendance', desc: 'Scan QR codes to mark attendance instantly. (Coming Soon)',     icon: 'ri-qr-scan-2-line' },
              { title: 'Real-time Analytics',desc: 'See who is registering and from which branch.',                 icon: 'ri-bar-chart-groupped-line' },
              { title: 'Showcase Legacy',    desc: 'A dedicated club profile to showcase your past achievements.(Coming Soon)',   icon: 'ri-trophy-line' },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-neutral-900 border border-neutral-800 p-7 hover:border-orange-600 hover:-translate-y-1 transition-all group"
              >
                <div className="w-12 h-12 bg-orange-600 rounded-sm flex items-center justify-center text-white text-xl mb-5">
                  <i className={item.icon} />
                </div>
                <h3 className="text-white font-bold text-[18px] mb-2.5">{item.title}</h3>
                <p className="text-neutral-500 text-[14px] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Quote strip */}
          <div className="mt-0.5 border border-neutral-800 overflow-hidden relative">
            <img
              src="https://plus.unsplash.com/premium_photo-1691699251519-6f2ec51a3a37?q=80&w=1331&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Event Organizer"
              className="w-full h-56 object-cover object-[center_50%] block"
              style={{ filter: 'saturate(0) brightness(0.8)' }}
            />
            <div className="absolute inset-0 flex items-center justify-center px-6">
              <div className="bg-orange-600 text-white font-black text-[clamp(16px,2.5vw,30px)] px-8 py-4 rounded-sm text-center tracking-tight leading-snug max-w-2xl">
                "Finally, no more manually checking 500 screenshots of payment proofs."
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-yellow-50 border-b-2 border-black">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8">

          <div className="flex items-center justify-between mb-16 flex-wrap gap-4">
            <h2 className="font-black text-[clamp(28px,4vw,48px)] text-black leading-none tracking-tight">
              How It Works
            </h2>
            <span className="bg-yellow-400 border-2 border-black text-[11px] font-bold uppercase tracking-[0.1em] px-4 py-2 rounded-sm">
              3 Simple Steps
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 border-2 border-black rounded-sm overflow-hidden">
            {[
              { step: '01', title: 'Discover',    desc: 'Browse a curated feed of workshops, cultural fests, and hackathons happening on campus.', icon: 'ri-compass-3-line' },
              { step: '02', title: 'Register',    desc: 'Sign up for events instantly. Get a personalized dashboard to track your participation.', icon: 'ri-edit-circle-line' },
              { step: '03', title: 'Participate', desc: 'Show up with your digital pass and build a track record that lasts beyond graduation.',   icon: 'ri-user-heart-line' },
            ].map((card, i) => (
              <div
                key={i}
                className={`bg-white p-12 relative ${i < 2 ? 'border-r-2 border-black' : ''} border-t-[3px] border-t-black`}
              >
                {/* Ghost step number */}
                <span className="absolute top-3 right-4 font-black text-[72px] leading-none text-neutral-300 select-none pointer-events-none">
                  {card.step}
                </span>
                <div className="w-13 h-13 w-[52px] h-[52px] bg-black rounded-sm flex items-center justify-center text-white text-[22px] mb-6">
                  <i className={card.icon} />
                </div>
                <h3 className="font-black text-[26px] text-black mb-3 relative z-10">{card.title}</h3>
                <p className="text-[15px] text-neutral-600 leading-relaxed relative z-10">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* <section className="py-20 bg-white border-t-2 border-black">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <SectionLabel>Testimonials</SectionLabel>
              <h2 className="font-black text-[clamp(28px,4vw,48px)] text-black leading-none tracking-tight">
                What Our Community Says
              </h2>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <button className="w-12 h-12 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors">
                <i className="ri-arrow-left-line text-lg" />
              </button>
              <button className="w-12 h-12 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors">
                <i className="ri-arrow-right-line text-lg" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Yash Sharma",
                role: "Computer Science Student",
                quote: "This platform transformed how I experience campus life. I never miss a hackathon now!",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
              },
              {
                name: "Ajeet Yadav",
                role: "Kabbadi Club Head",
                quote: "Managing events has never been easier. The analytics dashboard is a game-changer.",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
              },
              {
                name: "Himanshu Yadav",
                role: "Student",
                quote: "From discovery to participation, the entire flow is seamless. Highly recommended!",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
              }
            
            ].map((t, i) => (
              <div
                key={i}
                className="border-2 border-black bg-white p-8 relative hover:shadow-lg transition-shadow"
              >
                <div className="absolute top-4 right-4 text-orange-600 text-2xl">
                  <i className="ri-double-quotes-r" />
                </div>
                <p className="text-neutral-600 italic mb-6 text-lg leading-relaxed">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-4">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-12 h-12 rounded-full border-2 border-black object-cover"
                  />
                  <div>
                    <div className="font-bold text-black">{t.name}</div>
                    <div className="text-sm text-neutral-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section> */}

     {/* <section className="py-20 bg-yellow-50 border-t-2 border-black">
  <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
    <div className="flex items-center justify-center mb-12">
      <div className=" p-8 text-center">
        <h2 className="font-black text-[clamp(28px,4vw,48px)] text-black leading-none tracking-tight text-center relative inline-block after:content-[''] after:block after:w-16 after:h-1 after:bg-black after:mx-auto after:mt-2">
          Request for more features
        </h2>
        
        <a 
          href="mailto:clubsetu@nikhim.me" 
          className="text-2xl text-orange-600 font-bold p-4 hover:text-gray-600 transition-colors duration-300 block"
        >
          clubsetu@nikhim.me
        </a>
      </div>
    </div>
  </div>
</section> */}

      {/* Home Footer */}
      <HomeFooter />

    </div>
  );
};

export default Home;