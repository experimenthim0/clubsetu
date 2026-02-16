import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white border-t-2 border-black py-4 px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-[12px] text-neutral-500 tracking-wide">
          © {new Date().getFullYear()} <span className="font-bold text-black">ClubSetu</span>. All rights reserved.
        </p>
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
    </footer>
  );
};

export default Footer;
