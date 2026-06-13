import React from 'react';
import { Link } from 'react-router-dom';

const EventGuide = () => {
  return (
    <div className="min-h-screen bg-neutral-50/50 py-12 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3 text-orange-600">
            <span className="block w-6 h-[1px] bg-orange-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Documentation</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight">
            Event <span className="text-orange-600">Creation</span> Guide
          </h1>
          <p className="text-neutral-600 mt-2 max-w-xl text-sm md:text-base leading-relaxed">
            Everything you need to know about creating and managing events on Campus<span className='text-orange-600 font-semibold'>Node</span>. This guide covers all available options, field types, and best practices.
          </p>
        </div>

        {/* Who can create */}
        <section className="bg-white border border-neutral-200 rounded-xl p-8 mb-8 shadow-sm">
          <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2.5">
            <i className="ri-user-star-line text-orange-600 text-xl" />
            Who Can Create Events?
          </h2>
          <p className="text-neutral-600 leading-relaxed mb-4 text-sm">
            Only registered <strong className="text-neutral-800">Club Heads</strong> can create events on Campus<span className='text-orange-600 font-semibold'>Node</span>. Each club head represents an official NITJ club and is responsible for managing their events, registrations, and payments.
          </p>
          <div className="bg-orange-50/60 border border-orange-100 rounded-lg p-4 text-xs md:text-sm text-orange-800 flex items-center gap-2">
            <i className="ri-information-line text-orange-600 text-base shrink-0" />
            <span>If you're a student who wants to create events, register as a Club Head with your club's credentials.</span>
          </div>
        </section>

        {/* Types of Events */}
        <section className="bg-white border border-neutral-200 rounded-xl p-8 mb-8 shadow-sm">
          <h2 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2.5">
            <i className="ri-calendar-event-line text-orange-600 text-xl" />
            Types of Events You Can Create
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: 'ri-code-box-line',
                title: 'Hackathons',
                desc: 'Coding competitions with team formation, custom fields for GitHub repos and tech stacks.',
              },
              {
                icon: 'ri-presentation-line',
                title: 'Workshops & Seminars',
                desc: 'Technical/non-technical sessions with limited or unlimited seats and optional fees.',
              },
              {
                icon: 'ri-trophy-line',
                title: 'Competitions & Contests',
                desc: 'Quiz, debate, coding contests with eligibility filters by program and year.',
              },
              {
                icon: 'ri-music-2-line',
                title: 'Cultural Events',
                desc: 'Open mic, talent shows, fests — set up paid entry and custom registration forms.',
              },
              {
                icon: 'ri-team-line',
                title: 'Club Meetups',
                desc: 'Regular club meetings with unlimited seats and no entry fee.',
              },
              {
                icon: 'ri-lightbulb-line',
                title: 'Guest Lectures',
                desc: 'Talks by industry professionals, limited seats with first-come-first-served registration.',
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 p-4 bg-neutral-50/50 rounded-xl border border-neutral-200/60 hover:border-orange-500/25 hover:bg-white hover:shadow-sm transition-all duration-300">
                <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className={`${item.icon} text-lg`} />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800 text-sm">{item.title}</h3>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* All Fields Explained */}
        <section className="bg-white border border-neutral-200 rounded-xl p-8 mb-8 shadow-sm">
          <h2 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2.5">
            <i className="ri-file-list-3-line text-orange-600 text-xl" />
            Event Fields — Complete Reference
          </h2>

          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-4 block">Basic Information</span>
              <div className="space-y-1">
                <FieldRow
                  name="Event Title"
                  required
                  type="Text"
                  desc="The name of your event. Keep it concise and descriptive."
                  example="CodeSprint 3.0 — 24hr Hackathon"
                />
                <FieldRow
                  name="Description"
                  type="Long Text"
                  desc="Detailed description of the event, rules, what to expect, prizes, etc."
                  example="A 24-hour hackathon open to all BTech students..."
                />
                <FieldRow
                  name="Venue"
                  required
                  type="Dropdown"
                  desc="Select from NITJ campus venues: Student Activity Centre, IT Building, Central Lawn, Mega Ground, MBH Ground, OAT, CSH, VCH, or Others."
                />
                <FieldRow
                  name="Event Image URL"
                  type="URL"
                  desc="A link to the event's banner image. Use an image hosting service like Imgur or Cloudinary."
                  example="https://i.imgur.com/abc123.jpg"
                />
              </div>
            </div>

            {/* Scheduling */}
            <div className="pt-5 border-t border-neutral-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-4 block">Scheduling</span>
              <div className="space-y-1">
                <FieldRow
                  name="Start Time"
                  required
                  type="Date & Time"
                  desc="When the event begins. Used to calculate event status (upcoming / live / ended)."
                />
                <FieldRow
                  name="End Time"
                  required
                  type="Date & Time"
                  desc="Must be after start time. Once end time passes, the event is marked as 'Ended'."
                />
                <FieldRow
                  name="Registration Deadline"
                  type="Date & Time"
                  desc="Optional. If set, registrations close at this time instead of start time. Must be before or equal to start time."
                />
              </div>
            </div>

            {/* Capacity & Pricing */}
            <div className="pt-5 border-t border-neutral-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-4 block">Capacity & Pricing</span>
              <div className="space-y-1">
                <FieldRow
                  name="Total Seats"
                  required
                  type="Number / Toggle"
                  desc="Set a specific seat count, or toggle 'Unlimited Seats' for open events. When seats are limited, once full, new registrations go to waitlist."
                />
                <FieldRow
                  name="Entry Fee"
                  type="Radio (Free / Paid)"
                  desc="Toggle between free and paid events. For paid events, enter the amount in ₹. Payments are processed securely through Razorpay."
                />
              </div>
            </div>

            {/* Eligibility */}
            <div className="pt-5 border-t border-neutral-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-4 block">Eligibility Filters</span>
              <div className="space-y-1">
                <FieldRow
                  name="Allowed Programs"
                  type="Checkboxes"
                  desc="Choose which programs can register — BTech, MTech, or both. At least one must be selected."
                />
                <FieldRow
                  name="Allowed Years"
                  type="Checkboxes / Toggle"
                  desc="By default all years can register. Uncheck 'Allow All Years' to restrict to specific years (1st–5th)."
                />
              </div>
            </div>

            {/* Registration Form */}
            <div className="pt-5 border-t border-neutral-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-4 block">Registration Form Customization</span>
              <div className="space-y-1">
                <FieldRow
                  name="Required Student Info"
                  type="Checkboxes"
                  desc="Select which profile fields students must have filled before registering: GitHub, LinkedIn, X (Twitter), or Portfolio URL."
                />
                <FieldRow
                  name="Custom Fields"
                  type="Dynamic Builder"
                  desc="Add custom questions to the registration form — like Google Forms. Each field has a label, type (Text, URL, Long Text, Dropdown), and can be marked required."
                />
              </div>
            </div>
          </div>
        </section>

        {/* Custom Field Types */}
        <section className="bg-white border border-neutral-200 rounded-xl p-8 mb-8 shadow-sm">
          <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2.5">
            <i className="ri-magic-line text-orange-600 text-xl" />
            Custom Field Types
          </h2>
          <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
            Custom fields let you collect additional information from students during registration. Here are the available types:
          </p>
          <div className="overflow-hidden border border-neutral-200 rounded-xl shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-500">Type</th>
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-500">Use Case</th>
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-500">Example</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  <tr>
                    <td className="px-5 py-3.5 font-semibold text-neutral-800 text-sm">Text</td>
                    <td className="px-5 py-3.5 text-sm text-neutral-600">Short answers</td>
                    <td className="px-5 py-3.5 text-sm text-neutral-400 italic">Team Name, Dietary Preference</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3.5 font-semibold text-neutral-800 text-sm">Link / URL</td>
                    <td className="px-5 py-3.5 text-sm text-neutral-600">Web links</td>
                    <td className="px-5 py-3.5 text-sm text-neutral-400 italic">GitHub Repo, Project Demo</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3.5 font-semibold text-neutral-800 text-sm">Long Text</td>
                    <td className="px-5 py-3.5 text-sm text-neutral-600">Paragraphs, detailed answers</td>
                    <td className="px-5 py-3.5 text-sm text-neutral-400 italic">Why do you want to join?</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3.5 font-semibold text-neutral-800 text-sm">Dropdown</td>
                    <td className="px-5 py-3.5 text-sm text-neutral-600">Select from predefined options</td>
                    <td className="px-5 py-3.5 text-sm text-neutral-400 italic">T-Shirt Size (S, M, L, XL)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Tips */}
        <section className="bg-neutral-900 text-white rounded-xl p-8 mb-8 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 blur-[80px] rounded-full pointer-events-none -mr-16 -mt-16" />
          
          <h2 className="text-lg font-bold mb-5 flex items-center gap-2.5 text-white relative z-10">
            <i className="ri-lightbulb-line text-amber-400 text-xl" />
            Pro Tips
          </h2>
          <ul className="space-y-4 text-sm text-neutral-300 relative z-10">
            {[
              'Set a registration deadline 1-2 hours before the event to avoid last-minute chaos.',
              'Use custom fields to collect team info for hackathons — like Team Name, GitHub Repo URL, and Tech Stack.',
              'For paid events, add your bank details in your profile so the admin can process payouts.',
              'Use "Unlimited Seats" for open events like workshops where space isn\'t a concern.',
              'Require LinkedIn/GitHub profiles for tech events to get a sense of participant skill levels.',
              'Upload an attractive event banner — events with images get significantly more registrations.',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <i className="ri-arrow-right-s-line text-orange-500 mt-0.5 flex-shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

/* Helper component for field rows */
const FieldRow = ({ name, required, type, desc, example }) => (
  <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 py-4 border-b border-neutral-100/70">
    <div className="sm:w-44 flex-shrink-0">
      <span className="font-semibold text-sm text-neutral-800">{name}</span>
      {required && <span className="text-orange-600 ml-0.5">*</span>}
      <span className="block text-[9px] font-bold uppercase tracking-wider text-neutral-400 mt-1">{type}</span>
    </div>
    <div className="flex-grow">
      <p className="text-sm text-neutral-600 leading-relaxed">{desc}</p>
      {example && (
        <p className="text-xs text-neutral-400 mt-1.5 italic">
          Example: {example}
        </p>
      )}
    </div>
  </div>
);

export default EventGuide;
