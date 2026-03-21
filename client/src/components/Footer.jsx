import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-t-2 border-gray-300 py-4 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-neutral-500 tracking-wide">
            © {new Date().getFullYear()} <span className="font-bold text-black">Club<span className="text-orange-600">Setu</span></span>. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
           
            <Link to="/data-privacy" className="text-[11px] text-neutral-500 hover:text-black font-medium transition-colors">
              Data Privacy
            </Link>
            <Link to="/faq" className="text-[11px] text-neutral-500 hover:text-black font-medium transition-colors">
              FAQ
            </Link>
            
          </div>

<p className='text-[14px] text-neutral-500 font-semibold'>Crafted between classes, deadlines, and hostel Wi-Fi.</p>
          
        </div>
      </div>
    </footer>
  );
};

export default Footer;
