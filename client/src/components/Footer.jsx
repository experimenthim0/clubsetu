import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-t-2 border-black py-6 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-neutral-500 tracking-wide">
            © {new Date().getFullYear()} <span className="font-bold text-black">ClubSetu</span>. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
            <Link to="/privacy" className="text-[11px] text-neutral-500 hover:text-black font-medium transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-[11px] text-neutral-500 hover:text-black font-medium transition-colors">
              Terms & Conditions
            </Link>
            <Link to="/payment-policy" className="text-[11px] text-neutral-500 hover:text-black font-medium transition-colors">
              Payment Policy
            </Link>
            <Link to="/data-privacy" className="text-[11px] text-neutral-500 hover:text-black font-medium transition-colors">
              Data Privacy
            </Link>
          </div>

          <p className="text-[12px] text-neutral-500 tracking-wide">
            Crafted with <span className="text-red-500">♥</span> by{' '}
            <a
              href="https://nikhim.me"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-orange-600 hover:underline"
            >
              DevHim
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
