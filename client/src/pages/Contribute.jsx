import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/* ─── tiny hook: detect when element enters viewport ─── */
const useInView = (threshold = 0.15) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
};

/* ─── Fade-up wrapper ─── */
const Reveal = ({ children, delay = 0, className = '' }) => {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

/* ─── Social link tile ─── */
const SocialLink = ({ icon, label, username, href, color }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="group flex items-center gap-3 p-4 border border-white/10 rounded-lg hover:border-orange-500/60 hover:bg-white/5 transition-all duration-200"
  >
    <div className={`w-10 h-10 ${color} rounded-md flex items-center justify-center shrink-0`}>
      <i className={`${icon} text-white text-lg`} />
    </div>
    <div className="min-w-0">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500">{label}</p>
      <p className="text-[13px] font-bold text-white/80 group-hover:text-orange-400 truncate transition-colors">{username}</p>
    </div>
    <i className="ri-arrow-right-up-line ml-auto text-neutral-600 group-hover:text-orange-500 transition-colors" />
  </a>
);

/* ─── Section label ─── */
const SectionLabel = ({ children }) => (
  <div className="flex items-center gap-3 mb-6">
    <span className="block h-px flex-1 bg-neutral-200" />
    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-neutral-400 whitespace-nowrap">{children}</span>
    <span className="block h-px flex-1 bg-neutral-200" />
  </div>
);

/* ══════════════════════════════════════════════════════════════ */
const Contribute = () => {
  return (
    <div className="min-h-screen bg-[#F8F7F4]" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Google font import ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,900;1,9..40,300&family=DM+Mono:wght@400;500&display=swap');
        .mono { font-family: 'DM Mono', monospace; }
        .step-bg { -webkit-text-stroke: 1px #e5e5e5; color: transparent; font-size: clamp(80px, 15vw, 140px); }
      `}</style>

      {/* ── Hero ── */}
      <div className="border-b-2 border-black bg-black text-white overflow-hidden relative">
        {/* decorative grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        {/* big decorative word */}
        <p className="absolute right-0 top-1/2 -translate-y-1/2 mono font-black text-white opacity-[0.04] text-[200px] leading-none select-none pointer-events-none pr-8 hidden lg:block">BUILD</p>

        <div className="max-w-4xl mx-auto px-6 lg:px-10 pt-16 pb-14 relative">
          <div className="inline-flex items-center gap-2 mb-5">
            <span className="w-5 h-5 rounded-sm bg-orange-600 flex items-center justify-center">
              <i className="ri-open-source-line text-white text-xs" />
            </span>
            <span className="mono text-[10px] tracking-[0.2em] text-orange-400 uppercase">Open Source · NIT Jalandhar</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black leading-[1.05] tracking-tight mb-5">
            Contribute to<br />
            Club<span className="text-orange-500">Setu</span>
          </h1>
          <p className="text-neutral-400 text-[15px] max-w-lg leading-relaxed">
            Built for and by NIT Jalandhar students. We welcome developers, designers, and anyone passionate about improving campus life.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-10 py-14 space-y-16">

        {/* ── Tech Stack ── */}
        <Reveal>
          <SectionLabel>The Stack</SectionLabel>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Frontend', value: 'React + Vite', icon: 'ri-reactjs-line', note: '18' },
              { label: 'Styling', value: 'Tailwind CSS', icon: 'ri-palette-line', note: 'v3' },
              { label: 'Backend', value: 'Express + Node', icon: 'ri-server-line', note: 'v20' },
              { label: 'Database', value: 'Neon(Postgres)', icon: 'ri-database-2-line', note: 'Cloud-native Postgres' },
              { label: 'ORM', value: 'Prisma', icon: 'ri-code-line', note: 'v5' }

            ].map((tech, i) => (
              <Reveal key={tech.label} delay={i * 60}>
                <div className="group bg-white border-2 border-neutral-200 hover:border-orange-500 rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(234,88,12,0.12)]">
                  <i className={`${tech.icon} text-2xl text-orange-600 mb-3 block`} />
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-1">{tech.label}</p>
                  <p className="text-[14px] font-black text-black">{tech.value}</p>
                  <span className="mono text-[10px] text-neutral-400">{tech.note}</span>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="text-[13px] text-neutral-600 mt-5 leading-relaxed">
            ClubSetu is a full-stack event management platform. Club heads create and manage events, handle registrations with custom forms, process payments through Razorpay, and track payouts — all in one place.
          </p>
        </Reveal>

        {/* ── How to Contribute ── */}
        <Reveal>
          <SectionLabel>How to Contribute</SectionLabel>
          <div className="space-y-0 border-l-2 border-black ml-6">
            {[
              { step: '01', title: 'Fork the Repository', desc: 'Fork the ClubSetu repo on GitHub and clone it to your local machine.', icon: 'ri-git-branch-line' },
              { step: '02', title: 'Set Up Locally', desc: 'Install dependencies for both client and server. Set up your .env file with database URL and other keys.', icon: 'ri-terminal-box-line' },
              { step: '03', title: 'Pick an Issue', desc: 'Check the GitHub Issues tab for open bugs and feature requests, or propose your own improvement.', icon: 'ri-bug-line' },
              { step: '04', title: 'Create a Branch & Code', desc: 'Create a feature branch, make your changes, and test thoroughly before committing.', icon: 'ri-code-line' },
              { step: '05', title: 'Submit a Pull Request', desc: 'Push your branch and open a PR with a clear description of what you changed and why.', icon: 'ri-git-pull-request-line' },
            ].map((item, i) => (
              <Reveal key={item.step} delay={i * 80}>
                <div className="relative flex gap-6 pl-8 pb-10 group">
                  {/* dot on timeline */}
                  <div className="absolute -left-[13px] top-1 w-6 h-6 bg-black rounded-full border-4 border-[#F8F7F4] group-hover:bg-orange-600 transition-colors duration-200 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>

                  {/* big step number behind */}
                  <div className="relative flex-1">
                    <div className="step-bg mono font-black leading-none absolute -top-4 -left-1 select-none pointer-events-none" style={{ WebkitTextStroke: '1.5px #e5e5e5', color: 'transparent' }}>
                      {item.step}
                    </div>
                    <div className="relative pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <i className={`${item.icon} text-orange-600`} />
                        <h3 className="font-black text-black text-[15px]">{item.title}</h3>
                      </div>
                      <p className="text-[13px] text-neutral-600 leading-relaxed max-w-lg">{item.desc}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>

        {/* ── Areas ── */}
        <Reveal>
          <SectionLabel>Areas We Need Help With</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: 'ri-bug-line', title: 'Bug Fixes', desc: 'Help us squash bugs and improve stability.' },
              { icon: 'ri-paint-brush-line', title: 'UI / UX Design', desc: 'Make the interface more intuitive and beautiful.' },
              { icon: 'ri-shield-check-line', title: 'Security', desc: 'Audit code, find vulnerabilities, improve auth.' },
              { icon: 'ri-speed-line', title: 'Performance', desc: 'Optimize API responses, lazy loading, caching.' },
              { icon: 'ri-smartphone-line', title: 'Mobile', desc: 'Ensure everything looks great on all devices.' },
              { icon: 'ri-notification-3-line', title: 'Notifications', desc: 'Add email/push notifications for events.' },
              { icon: 'ri-test-tube-line', title: 'Testing', desc: 'Write unit and integration tests.' },
              { icon: 'ri-file-text-line', title: 'Documentation', desc: 'Improve README, API docs, inline comments.' },
            ].map((area, i) => (
              <Reveal key={area.title} delay={i * 40}>
                <div className="group flex items-start gap-4 p-4 bg-white border-2 border-neutral-200 rounded-xl hover:border-orange-500 hover:shadow-[0_2px_16px_rgba(234,88,12,0.10)] transition-all duration-200 cursor-default">
                  <div className="w-9 h-9 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0 group-hover:bg-orange-600 group-hover:border-orange-600 transition-all duration-200">
                    <i className={`${area.icon} text-orange-600 group-hover:text-white transition-colors`} />
                  </div>
                  <div>
                    <h3 className="font-black text-[13px] text-black mb-0.5">{area.title}</h3>
                    <p className="text-[12px] text-neutral-500 leading-relaxed">{area.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>

        {/* ── Contact ── */}
        <Reveal>
          <SectionLabel>Maintainer</SectionLabel>
          <div className="bg-black rounded-2xl overflow-hidden border-2 border-black">
            {/* orange top stripe */}
            <div className="h-1.5 bg-orange-600 w-full" />

            <div className="p-8">
              <div className="flex items-start gap-4 mb-8">
                <div className="w-14 h-14 rounded-xl bg-orange-600 flex items-center justify-center shrink-0 text-2xl text-white">
                  <i className="ri-user-3-line" />
                </div>
                <div>
                  <p className="text-[9px] mono uppercase tracking-[0.2em] text-neutral-500 mb-1">Project Maintainer</p>
                  <h3 className="text-xl font-black text-white">Nikhil Yadav</h3>
                  <p className="text-[13px] text-neutral-400 mt-1">Student · NIT Jalandhar</p>
                </div>
              </div>

              <p className="text-neutral-400 text-[13px] leading-relaxed mb-7">
                Feel free to reach out for questions, suggestions, or collaboration on ClubSetu.
              </p>

              {/* Email */}
              <a
                href="mailto:contact.nikhim@gmail.com"
                className="group flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:border-orange-500/60 hover:bg-white/8 transition-all duration-200 mb-4"
              >
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center shrink-0">
                  <i className="ri-mail-line text-white" />
                </div>
                <div>
                  <p className="text-[9px] mono uppercase tracking-[0.2em] text-neutral-500">Email</p>
                  <p className="text-[13px] font-bold text-white group-hover:text-orange-400 transition-colors">contact.nikhim@gmail.com</p>
                </div>
                <i className="ri-arrow-right-up-line ml-auto text-neutral-600 group-hover:text-orange-500 transition-colors" />
              </a>

              {/* Social grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SocialLink icon="ri-github-fill" label="GitHub" username="experimenthim0" href="https://github.com/experimenthim0" color="bg-neutral-700" />
                <SocialLink icon="ri-linkedin-box-fill" label="LinkedIn" username="Nikhil Yadav" href="https://linkedin.com/in/nikhilydv0148" color="bg-blue-700" />
                <SocialLink icon="ri-twitter-x-fill" label="X / Twitter" username="@Nikhil0148" href="https://x.com/Nikhil0148" color="bg-neutral-700" />
                <SocialLink icon="ri-instagram-line" label="Instagram" username="@nikhim.me" href="https://instagram.com/nikhim.me" color="bg-pink-700" />
              </div>
            </div>
          </div>
        </Reveal>

        {/* ── Code of Conduct ── */}
        <Reveal>
          <SectionLabel>Code of Conduct</SectionLabel>
          <div className="bg-white border-2 border-neutral-200 rounded-2xl p-7">
            <ul className="space-y-4">
              {[
                'Be respectful and inclusive in all interactions.',
                'Write clean, well-commented code that follows existing patterns.',
                'Test your changes before submitting a PR.',
                'Report bugs through GitHub Issues with clear reproduction steps.',
                "Give credit where it's due — acknowledge others' contributions.",
              ].map((rule, i) => (
                <li key={i} className="flex items-start gap-3 text-[13px] text-neutral-700 leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                    <i className="ri-check-line text-emerald-600 text-[10px]" />
                  </span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* ── Footer nav ── */}
        <div className="flex items-center justify-between pt-4 border-t-2 border-black">
          <Link to="/" className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-black hover:text-orange-600 transition-colors">
            <i className="ri-arrow-left-line" /> Back to Home
          </Link>
          <span className="mono text-[10px] text-neutral-400">ClubSetu · Open Source</span>
        </div>

      </div>
    </div>
  );
};

export default Contribute;