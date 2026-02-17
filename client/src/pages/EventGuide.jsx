import React from 'react';
import { Link } from 'react-router-dom';

const EventGuide = () => {
  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3 text-orange-600">
            <span className="block w-6 h-0.5 bg-orange-600" />
            <span className="text-[11px] font-bold uppercase tracking-widest">Documentation</span>
          </div>
          <h1 className="text-4xl font-black text-black tracking-tight">
            Event <span className="text-orange-600">Creation</span> Guide
          </h1>
          <p className="text-neutral-600 mt-2 max-w-xl">
            Everything you need to know about creating and managing events on ClubSetu. This guide covers all available options, field types, and best practices.
          </p>
        </div>

        {/* Who can create */}
        <section className="bg-white border-2 border-black rounded-sm p-8 shadow-[4px_4px_0px_#000] mb-8">
          <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
            <i className="ri-user-star-line text-orange-600" />
            Who Can Create Events?
          </h2>
          <p className="text-neutral-700 leading-relaxed mb-4">
            Only registered <strong>Club Heads</strong> can create events on ClubSetu. Each club head represents an official NITJ club and is responsible for managing their events, registrations, and payments.
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-sm p-4 text-sm text-orange-800">
            <i className="ri-information-line mr-1" />
            If you're a student who wants to create events, register as a Club Head with your club's credentials.
          </div>
        </section>

        {/* Types of Events */}
        <section className="bg-white border-2 border-black rounded-sm p-8 shadow-[4px_4px_0px_#000] mb-8">
          <h2 className="text-xl font-black text-black mb-6 flex items-center gap-2">
            <i className="ri-calendar-event-line text-orange-600" />
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
              <div key={item.title} className="flex gap-4 p-4 bg-neutral-50 rounded-sm border border-neutral-200">
                <div className="w-10 h-10 bg-orange-100 rounded-sm flex items-center justify-center text-orange-600 flex-shrink-0">
                  <i className={`${item.icon} text-xl`} />
                </div>
                <div>
                  <h3 className="font-bold text-black text-sm">{item.title}</h3>
                  <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* All Fields Explained */}
        <section className="bg-white border-2 border-black rounded-sm p-8 shadow-[4px_4px_0px_#000] mb-8">
          <h2 className="text-xl font-black text-black mb-6 flex items-center gap-2">
            <i className="ri-file-list-3-line text-orange-600" />
            Event Fields — Complete Reference
          </h2>

          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400 mb-4">Basic Information</h3>
              <div className="space-y-4">
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
            <div className="pt-4 border-t border-neutral-100">
              <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400 mb-4">Scheduling</h3>
              <div className="space-y-4">
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
            <div className="pt-4 border-t border-neutral-100">
              <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400 mb-4">Capacity & Pricing</h3>
              <div className="space-y-4">
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
            <div className="pt-4 border-t border-neutral-100">
              <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400 mb-4">Eligibility Filters</h3>
              <div className="space-y-4">
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
            <div className="pt-4 border-t border-neutral-100">
              <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400 mb-4">Registration Form Customization</h3>
              <div className="space-y-4">
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
        <section className="bg-white border-2 border-black rounded-sm p-8 shadow-[4px_4px_0px_#000] mb-8">
          <h2 className="text-xl font-black text-black mb-6 flex items-center gap-2">
            <i className="ri-magic-line text-orange-600" />
            Custom Field Types
          </h2>
          <p className="text-neutral-600 text-sm mb-6">
            Custom fields let you collect additional information from students during registration. Here are the available types:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-2 border-black">
              <thead>
                <tr className="bg-neutral-100 border-b-2 border-black">
                  <th className="px-5 py-3 text-xs font-black uppercase tracking-widest">Type</th>
                  <th className="px-5 py-3 text-xs font-black uppercase tracking-widest">Use Case</th>
                  <th className="px-5 py-3 text-xs font-black uppercase tracking-widest">Example</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                <tr>
                  <td className="px-5 py-3 font-bold text-sm">Text</td>
                  <td className="px-5 py-3 text-sm text-neutral-600">Short answers</td>
                  <td className="px-5 py-3 text-sm text-neutral-500 italic">Team Name, Dietary Preference</td>
                </tr>
                <tr className="bg-neutral-50">
                  <td className="px-5 py-3 font-bold text-sm">Link / URL</td>
                  <td className="px-5 py-3 text-sm text-neutral-600">Web links</td>
                  <td className="px-5 py-3 text-sm text-neutral-500 italic">GitHub Repo, Project Demo</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-bold text-sm">Long Text</td>
                  <td className="px-5 py-3 text-sm text-neutral-600">Paragraphs, detailed answers</td>
                  <td className="px-5 py-3 text-sm text-neutral-500 italic">Why do you want to join?</td>
                </tr>
                <tr className="bg-neutral-50">
                  <td className="px-5 py-3 font-bold text-sm">Dropdown</td>
                  <td className="px-5 py-3 text-sm text-neutral-600">Select from predefined options</td>
                  <td className="px-5 py-3 text-sm text-neutral-500 italic">T-Shirt Size (S, M, L, XL)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Tips */}
        <section className="bg-black text-white border-2 border-black rounded-sm p-8 shadow-[4px_4px_0px_#ea580c] mb-8">
          <h2 className="text-xl font-black mb-5 flex items-center gap-2">
            <i className="ri-lightbulb-flash-line text-yellow-400" />
            Pro Tips
          </h2>
          <ul className="space-y-3 text-sm text-neutral-300">
            {[
              'Set a registration deadline 1-2 hours before the event to avoid last-minute chaos.',
              'Use custom fields to collect team info for hackathons — like Team Name, GitHub Repo URL, and Tech Stack.',
              'For paid events, add your bank details in your profile so the admin can process payouts.',
              'Use "Unlimited Seats" for open events like workshops where space isn\'t a concern.',
              'Require LinkedIn/GitHub profiles for tech events to get a sense of participant skill levels.',
              'Upload an attractive event banner — events with images get significantly more registrations.',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <i className="ri-arrow-right-s-line text-orange-500 mt-0.5 flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <div className="text-center py-8">
          <Link
            to="/create"
            className="inline-flex items-center gap-2 px-8 py-4 bg-orange-600 text-white border-2 border-black font-bold text-sm uppercase tracking-widest rounded-sm hover:bg-black hover:border-black transition-all shadow-[4px_4px_0px_#000] hover:-translate-y-1"
          >
            <i className="ri-add-line text-lg" />
            Create Your First Event
          </Link>
        </div>
      </div>
    </div>
  );
};

/* Helper component for field rows */
const FieldRow = ({ name, required, type, desc, example }) => (
  <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 py-3 border-b border-neutral-50">
    <div className="sm:w-44 flex-shrink-0">
      <span className="font-bold text-sm text-black">{name}</span>
      {required && <span className="text-orange-600 ml-1">*</span>}
      <span className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mt-0.5">{type}</span>
    </div>
    <div className="flex-1">
      <p className="text-sm text-neutral-700 leading-relaxed">{desc}</p>
      {example && (
        <p className="text-xs text-neutral-400 mt-1 italic">
          Example: {example}
        </p>
      )}
    </div>
  </div>
);

export default EventGuide;
