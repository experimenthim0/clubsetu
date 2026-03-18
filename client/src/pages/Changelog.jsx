import React from 'react';
import { Link } from 'react-router-dom';

const updates = [
  {
    hash: "a3f91c2",
    version: "v1.4.0",
    date: "Mar 18, 2024",
    title: "Security & Performance Audit",
    desc: "Significant upgrades to user security and frontend performance.",
    features: [
      "Implemented Password Reset via email for all users",
      "Added 'Change Password' section in user profiles",
      "Rate limiting (2 changes/day) for password updates",
      "Optimized Razorpay script loading & page speed",
      "Enhanced Club Head management with social media links",
    ],
  },
  {
    hash: "b7d42e8",
    version: "v1.3.0",
    date: "Mar 17, 2024",
    title: "Club Management Overhaul",
    desc: "Revamped how clubs are managed and displayed on the platform.",
    features: [
      "Separate 'Edit Club' page for club heads",
      "Redesigned Club Cards with neo-brutalist aesthetic",
      "Unique Club IDs for better identification",
      "Direct social media integration per club",
      "Improved admin approval flow for new registrations",
    ],
  },
  {
    hash: "c1e88a5",
    version: "v1.2.0",
    date: "Mar 02, 2024",
    title: "Payment & Event Features",
    desc: "Expansion of event management and financial tracking.",
    features: [
      "Razorpay integration for paid event registrations",
      "Payment Tracking dashboard for club organizers",
      "Customizable registration forms for complex events",
      "Automatic email receipts for payment confirmation",
      "Enhanced event feed with filtering and search",
    ],
  },
  {
    hash: "f3a22d1",
    version: "v1.1.0",
    date: "Feb 05, 2024",
    title: "Core Infrastructure",
    desc: "Strengthening the foundation for a more reliable experience.",
    features: [
      "PWA support for offline access",
      "Email verification system for new accounts",
      "Responsive navigation and footer system",
      "Role-based access control (Student vs Club Head)",

    ],
  },
];

const stats = [
  { label: "releases", value: "4", accent: true },
  { label: "features shipped", value: "20", accent: false },
  { label: "branch: main", value: null, accent: false },
  { label: "status: active", value: null, accent: true },
];

const Changelog = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] font-mono px-6 py-12 relative overflow-hidden">

      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(234,88,12,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(234,88,12,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-[11px] text-orange-600 opacity-70 tracking-widest mb-2">
            ~/clubsetu $ git log --oneline
          </p>
          <h1
            className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-2"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            PAST{" "}
            <span className="text-orange-600 underline underline-offset-4 decoration-black">
              UPDATES
            </span>
          </h1>
          <p className="text-[10px] text-neutral-600 tracking-[0.18em] uppercase">
            Evolution of ClubSetu Community Platform
          </p>
        </div>

        {/* Status bar */}
        <div className="flex flex-wrap justify-center gap-6 border-t border-b border-neutral-900 py-2.5 mb-10">
          {stats.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px] text-neutral-600 tracking-wide">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  s.accent ? "bg-orange-600" : "bg-neutral-700"
                }`}
              />
              {s.value && <strong className="text-neutral-400">{s.value}</strong>}
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[13px] top-0 bottom-0 w-0.5 bg-neutral-900" />

          <div className="flex flex-col gap-8">
            {updates.map((u, i) => (
              <div key={i} className="flex gap-5">

                {/* Dot */}
                <div className="flex flex-col items-center flex-shrink-0 w-7 pt-1.5 z-10">
                  <span
                    className="w-3 h-3 rounded-full bg-orange-600 border-2 border-[#0a0a0a] flex-shrink-0"
                    style={{ outline: "2px solid #EA580C" }}
                  />
                </div>

                {/* Card */}
                <div className="flex-1 bg-[#111] border-2 border-neutral-800 p-5 transition-all duration-150 hover:border-orange-600 hover:shadow-[4px_4px_0px_#EA580C]">

                  {/* Top row */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-[10px] text-orange-600 bg-orange-600/10 border border-orange-600/30 px-2 py-0.5 tracking-wide">
                      {u.hash}
                    </span>
                    <span className="text-[10px] text-white bg-black border border-neutral-700 px-2 py-0.5 font-bold tracking-wide">
                      {u.version}
                    </span>
                    <span className="text-[10px] text-neutral-600 ml-auto tracking-wide">
                      {u.date}
                    </span>
                  </div>

                  {/* Title */}
                  <h2
                    className="text-[15px] font-black text-white uppercase tracking-wide mb-1"
                    style={{ fontFamily: "'Syne', sans-serif" }}
                  >
                    {u.title}
                  </h2>

                  {/* Desc */}
                  <p className="text-[11px] text-neutral-600 mb-4 leading-relaxed">
                    {u.desc}
                  </p>

                  {/* Features */}
                  <ul className="flex flex-col gap-1.5">
                    {u.features.map((f, fi) => (
                      <li
                        key={fi}
                        className="flex items-start gap-2 text-[11px] text-neutral-500 leading-relaxed"
                      >
                        <span className="text-orange-600 font-bold flex-shrink-0">+</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link
            to="/contribute"
            className="inline-flex items-center gap-2 font-mono text-xs font-bold text-white uppercase tracking-widest bg-black border-2 border-black px-8 py-4 shadow-[6px_6px_0px_#EA580C] hover:shadow-none hover:translate-x-1.5 hover:translate-y-1.5 transition-all duration-100"
          >
            $ suggest --feature ↗
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Changelog;