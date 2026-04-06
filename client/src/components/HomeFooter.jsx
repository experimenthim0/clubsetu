import React from 'react';
import { Link } from 'react-router-dom';
import {InstagramIcon} from './ui/instagram';
import { LinkedinIcon } from './ui/linkedin';
import {TwitterIcon} from './ui/twitter';
import ScrollReveal from './ScrollReveal';
const HomeFooter = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' },
    { label: 'Changelog', to: '/changelog' },
    { label: 'Data Privacy', to: '/data-privacy' },
    { label: 'Payment Policy', to: '/payment-policy' },

   
    // { label: 'Login', to: '/login' },
  ];
  const quickLinks = [
    { label: 'Events', to: '/events' },
    { label: 'Clubs', to: '/clubs' },
    { label: 'ClubSetu Features', to: '/about-features' },
    { label: 'Event Guide', to: '/event-guide' },
    { label: 'Contribute', to: '/contribute' },
     { label: 'FAQ', to: '/faq' },
    // { label: 'Register', to: '/register' },
    // { label: 'Login', to: '/login' },
  ];

  return (
    <footer className="bg-white text-black">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14 border-x-2 border-gray-300">
        <ScrollReveal direction="up" distance={10}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

            {/* Brand column */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                
                <span className="font-extrabold text-[24px] tracking-wider text-black leading-none select-none logofont">
                Club<span className="text-orange-600">Setu</span>
              </span>
              </div>
              {/* <p className="text-[14px] text-neutral-400 leading-relaxed mb-4">
               ClubSetu is a platform built for NIT Jalandhar that connects students with campus clubs and events, making it easy to discover activities and manage participation in one place. </p> */}
             <p className='text-[14px] text-neutral-700 leading-relaxed mb-4'>Built with
          roommates and Crafted between classes, deadlines, and hostel Wi-Fi.</p>
              <div className="flex items-center gap-3">
                {[
                  { icon: <LinkedinIcon/>, href: 'https://github.com/experimenthim0' },
                  { icon: <InstagramIcon/>, href: 'https://instagram.com/nikhim.me' },
                  { icon: <TwitterIcon/>, href: 'https://x.com/Nikhil0148' },
                ].map((social) => (
                  <a
                    key={social.href}
                    href={social.href}
                    className="w-9 h-9  rounded-sm flex items-center justify-center text-black  transition-colors  "
                  >
                    {/* <i className={`${social.icon} text-base`} /> */}
                    {social.icon}
                  </a>
                ))}
              </div>
               <p className="text-[13px] text-neutral-500 mt-4">
                Have any questions or suggestion? Reach out to us at{' '}
                <a href="mailto:clubsetu@nikhim.me" className="text-orange-500 hover:underline font-medium">
                  clubsetu@nikhim.me
                </a>
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-neutral-700 mb-5">
                Quick Links
              </h4>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-[14px] text-neutral-800 hover:text-orange-500 transition-colors font-medium"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>

              <h4 className="text-[11px] font-bold uppercase tracking-widest text-neutral-700 mb-5">
                Legal
              </h4>
              <ul className="space-y-3">
                {footerLinks.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-[14px] text-neutral-800 hover:text-orange-500 transition-colors font-medium"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* About */}
            
          </div>
        </ScrollReveal>
      </div>

      {/* Bottom bar */}
     
    </footer>
  );
};

export default HomeFooter;
