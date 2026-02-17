import React from 'react';
import { Link } from 'react-router-dom';

const Contribute = () => {
  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3 text-orange-600">
            <span className="block w-6 h-0.5 bg-orange-600" />
            <span className="text-[11px] font-bold uppercase tracking-widest">Open Source</span>
          </div>
          <h1 className="text-4xl font-black text-black tracking-tight">
            Contribute to <span className="text-orange-600">ClubSetu</span>
          </h1>
          <p className="text-neutral-600 mt-2 max-w-xl">
            ClubSetu is built for and by NIT Jalandhar students. We welcome contributions from developers, designers, and anyone passionate about improving campus life.
          </p>
        </div>

        {/* About the Project */}
        <section className="bg-white border-2 border-black rounded-sm p-8 shadow-[4px_4px_0px_#000] mb-8">
          <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
            <i className="ri-code-s-slash-line text-orange-600" />
            About the Project
          </h2>
          <p className="text-neutral-700 leading-relaxed mb-4">
            ClubSetu is a full-stack event management platform designed exclusively for NIT Jalandhar. It enables club heads to create and manage events, handle registrations with custom forms, process payments through Razorpay, and track payouts — all in one place.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Frontend', value: 'React + Vite', icon: 'ri-reactjs-line' },
              { label: 'Styling', value: 'Tailwind CSS', icon: 'ri-palette-line' },
              { label: 'Backend', value: 'Express + Node', icon: 'ri-server-line' },
              { label: 'Database', value: 'MongoDB', icon: 'ri-database-2-line' },
            ].map((tech) => (
              <div key={tech.label} className="bg-neutral-50 border border-neutral-200 rounded-sm p-4 text-center">
                <i className={`${tech.icon} text-2xl text-orange-600 mb-2 block`} />
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{tech.label}</p>
                <p className="text-sm font-bold text-black mt-1">{tech.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How to Contribute */}
        <section className="bg-white border-2 border-black rounded-sm p-8 shadow-[4px_4px_0px_#000] mb-8">
          <h2 className="text-xl font-black text-black mb-6 flex items-center gap-2">
            <i className="ri-git-merge-line text-orange-600" />
            How to Contribute
          </h2>
          <div className="space-y-6">
            {[
              {
                step: '01',
                title: 'Fork the Repository',
                desc: 'Fork the ClubSetu repo on GitHub and clone it to your local machine.',
                icon: 'ri-git-branch-line',
              },
              {
                step: '02',
                title: 'Set Up Locally',
                desc: 'Install dependencies for both client (npm install) and server (npm install). Set up your .env file with MongoDB URI and Razorpay keys.',
                icon: 'ri-terminal-box-line',
              },
              {
                step: '03',
                title: 'Pick an Issue or Feature',
                desc: 'Check the GitHub Issues tab for open bugs and feature requests, or propose your own improvement.',
                icon: 'ri-bug-line',
              },
              {
                step: '04',
                title: 'Create a Branch & Code',
                desc: 'Create a feature branch, make your changes, and test thoroughly before committing.',
                icon: 'ri-code-line',
              },
              {
                step: '05',
                title: 'Submit a Pull Request',
                desc: 'Push your branch and open a PR with a clear description of what you changed and why.',
                icon: 'ri-git-pull-request-line',
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-5 items-start">
                <div className="w-12 h-12 bg-black text-white rounded-sm flex items-center justify-center font-black text-sm flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold text-black flex items-center gap-2">
                    <i className={`${item.icon} text-orange-600`} />
                    {item.title}
                  </h3>
                  <p className="text-sm text-neutral-600 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Areas for Contribution */}
        <section className="bg-white border-2 border-black rounded-sm p-8 shadow-[4px_4px_0px_#000] mb-8">
          <h2 className="text-xl font-black text-black mb-6 flex items-center gap-2">
            <i className="ri-focus-3-line text-orange-600" />
            Areas We Need Help With
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: 'ri-bug-line', title: 'Bug Fixes', desc: 'Help us squash bugs and improve stability.' },
              { icon: 'ri-paint-brush-line', title: 'UI/UX Design', desc: 'Make the interface more intuitive and beautiful.' },
              { icon: 'ri-shield-check-line', title: 'Security', desc: 'Audit code, find vulnerabilities, improve auth.' },
              { icon: 'ri-speed-line', title: 'Performance', desc: 'Optimize API responses, lazy loading, caching.' },
              { icon: 'ri-smartphone-line', title: 'Mobile Responsiveness', desc: 'Ensure everything looks great on all devices.' },
              { icon: 'ri-notification-3-line', title: 'Notifications', desc: 'Add email/push notifications for events.' },
              { icon: 'ri-test-tube-line', title: 'Testing', desc: 'Write unit and integration tests.' },
              { icon: 'ri-file-text-line', title: 'Documentation', desc: 'Improve README, API docs, inline code comments.' },
            ].map((area) => (
              <div key={area.title} className="flex items-start gap-3 p-4 bg-neutral-50 rounded-sm border border-neutral-200 hover:border-orange-300 transition-colors">
                <i className={`${area.icon} text-xl text-orange-600 mt-0.5`} />
                <div>
                  <h3 className="font-bold text-sm text-black">{area.title}</h3>
                  <p className="text-xs text-neutral-600 mt-0.5">{area.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact the Maintainer */}
        <section className="bg-black text-white border-2 border-black rounded-sm p-8 shadow-[4px_4px_0px_#ea580c] mb-8">
          <h2 className="text-xl font-black mb-5 flex items-center gap-2">
            <i className="ri-user-heart-line text-orange-500" />
            Contact the Maintainer
          </h2>
          <p className="text-neutral-300 text-sm mb-6 leading-relaxed">
            ClubSetu is maintained by <strong className="text-white">Nikhil Yadav</strong>, a student at NIT Jalandhar. Feel free to reach out for questions, suggestions, or collaboration!
          </p>

          <div className="space-y-4">
            {/* Email */}
            <a
              href="mailto:contact.nikhim@gmail.com"
              className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-sm hover:bg-white/10 transition-colors group"
            >
              <div className="w-10 h-10 bg-orange-600 rounded-sm flex items-center justify-center">
                <i className="ri-mail-line text-white text-lg" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Email</p>
                <p className="text-white font-bold group-hover:text-orange-400 transition-colors">contact.nikhim@gmail.com</p>
              </div>
            </a>

            {/* Social Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SocialLink
                icon="ri-github-fill"
                label="GitHub"
                username="experimenthim0"
                href="https://github.com/experimenthim0"
                color="bg-neutral-800"
              />
              <SocialLink
                icon="ri-linkedin-box-fill"
                label="LinkedIn"
                username="Nikhil Yadav"
                href="https://linkedin.com/in/nikhilydv0148"
                color="bg-blue-800"
              />
              <SocialLink
                icon="ri-twitter-x-fill"
                label="X (Twitter)"
                username="@Nikhil0148"
                href="https://x.com/Nikhil0148"
                color="bg-neutral-800"
              />
              <SocialLink
                icon="ri-instagram-line"
                label="Instagram"
                username="@nikhim.me"
                href="https://instagram.com/nikhim.me"
                color="bg-pink-800"
              />
            </div>
          </div>
        </section>

        {/* Code of Conduct */}
        <section className="bg-white border-2 border-black rounded-sm p-8 shadow-[4px_4px_0px_#000] mb-8">
          <h2 className="text-xl font-black text-black mb-4 flex items-center gap-2">
            <i className="ri-heart-line text-orange-600" />
            Code of Conduct
          </h2>
          <ul className="space-y-3 text-sm text-neutral-700">
            {[
              'Be respectful and inclusive in all interactions.',
              'Write clean, well-commented code that follows existing patterns.',
              'Test your changes before submitting a PR.',
              'Report bugs through GitHub Issues with clear reproduction steps.',
              'Give credit where it\'s due — acknowledge others\' contributions.',
            ].map((rule, i) => (
              <li key={i} className="flex items-start gap-2">
                <i className="ri-checkbox-circle-fill text-green-600 mt-0.5 flex-shrink-0" />
                {rule}
              </li>
            ))}
          </ul>
        </section>

        {/* Back to home */}
        <div className="text-center py-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-black hover:text-orange-600 transition-colors"
          >
            <i className="ri-arrow-left-line" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

/* Helper component for social links */
const SocialLink = ({ icon, label, username, href, color }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-sm hover:bg-white/10 transition-colors group"
  >
    <div className={`w-9 h-9 ${color} rounded-sm flex items-center justify-center`}>
      <i className={`${icon} text-white text-lg`} />
    </div>
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{label}</p>
      <p className="text-white text-sm font-bold group-hover:text-orange-400 transition-colors">{username}</p>
    </div>
  </a>
);

export default Contribute;
