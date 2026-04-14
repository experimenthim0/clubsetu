import React from 'react';
import { Link } from 'react-router-dom';
import {InstagramIcon} from './ui/instagram';
import { LinkedinIcon } from './ui/linkedin';
import {TwitterIcon} from './ui/twitter';
import ScrollReveal from './ScrollReveal';
const HomeFooter = () => {
  const currentYear = new Date().getFullYear();

  
  const quickLinks = [
    { label: 'Events', to: '/events' },
    { label: 'Clubs', to: '/clubs' },
  
    { label: 'Event Guide', to: '/event-guide' },
   
     { label: 'FAQ', to: '/faq' },
    // { label: 'Register', to: '/register' },
    // { label: 'Login', to: '/login' },
  ];

  const otherLinks = [
    { label: 'NITJ Website', href: 'https://nitj.ac.in' },
    { label: 'Contact', href: 'mailto:clubsetu@nikhim.me' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ];

  return (
    <footer className="bg-[#fefce8]/30 text-black">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14 border-x border-gray-300">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

          {/* Brand column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="nitjlogo.png" alt="" className="w-11 h-12"/>
              <span className="font-extrabold text-[24px] tracking-wider text-black leading-none select-none logofont">CLUB
             <span className="text-orange-600 font-light tracking-wider">SETU</span>
            </span>
            </div>
            {/* <p className="text-[14px] text-neutral-400 leading-relaxed mb-4">
             ClubSetu is a platform built for NIT Jalandhar that connects students with campus clubs and events, making it easy to discover activities and manage participation in one place. </p> */}
            <div className=''>
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

          
          {/* About */}
        <div>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-neutral-700 mb-5">
              Other Links
            </h4>
            <ul className="space-y-3">
              {otherLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-[14px] text-neutral-800 hover:text-orange-500 transition-colors font-medium cursor-pointer"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
      </div>
      </div>

      {/* Bottom bar */}
     
    </footer>
  );
};

export default HomeFooter;
