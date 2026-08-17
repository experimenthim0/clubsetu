import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-[#fefce8]/30 dark:bg-neutral-900/30 border-t border-gray-300 dark:border-neutral-800 py-4 px-6 hidden md:block">
      <div className="max-w-7xl mx-auto">
        <div className="flex  sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-neutral-500 tracking-wide">
            © {new Date().getFullYear()} <span className="font-light text-black logofont tracking-wider select-none">Campus<span className="text-orange-600">Node</span></span>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
           <Link to='/Team' className="text-[11px] text-neutral-500 hover:text-black font-medium transition-colors">
            Team
           </Link>
            <Link to="/contribute" className="text-[11px] text-neutral-500 hover:text-black font-medium transition-colors">
              Contribute
            </Link>
            <Link to="/faq" className="text-[11px] text-neutral-500 hover:text-black font-medium transition-colors">
              FAQ
            </Link>
            
          </div>

          
        </div>
      </div>
    </footer>
  );
};

export default Footer;
