import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const funnyMessages = [
  "Looks like this event got cancelled... along with this page.",
  "Even our best club heads couldn't find this page.",
  "This page went to grab chai and never came back.",
  "404: Page bunked class today.",
  "This page is as lost as a fresher on Day 1.",
  "Our server looked everywhere — under the chairs, behind the projector... nothing.",
  "Har Cheej hi available thodi hoti h bhai 😅",
  "Aaj is page ne bunk mar liya 😄",
  "Chai peene gya tha lekin page nahi aaya 😅",
  "Page ko kaam ke liye bheja tha but Reels scroll krne lg gya kya kre ab GenZ h 😅",
  "Page ko mummy ne dusra kam de diya toh aa nhi paya 😅",
  "Page ko jaate time papa ne pkd liya",
  "Page sister ke sath gappe marne lg gya or kam bhul gya 😅",
  "Oh bhai tu ye kha pr aa gaya 😅",
  "Abhi tk baat puri nhi hui 😅"
];

const NotFound = () => {
  const navigate = useNavigate();
  const [message] = useState(() => funnyMessages[Math.floor(Math.random() * funnyMessages.length)]);
  const [countdown, setCountdown] = useState(30);

  // Auto-redirect countdown
  useEffect(() => {
    if (countdown <= 0) {
      navigate('/');
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] flex items-center justify-center px-6 py-12 transition-colors duration-300 relative overflow-hidden">
      
      {/* Background dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
        style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      />

      <div className="relative z-10 max-w-md w-full text-center">

        {/* Giant 404 */}
        <div className="relative mb-6">
          <h1
            className="text-[130px] md:text-[160px] font-black leading-none tracking-tighter text-neutral-900 dark:text-white select-none transition-all duration-100"
            style={{
              textShadow: '4px 4px 0px #EA580C',
            }}
          >
            404
          </h1>
        </div>

        {/* Funny Tagline Card */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 mb-6 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600 mb-2">
            Page Not Found
          </p>
          <p className="text-sm md:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
            {message}
          </p>
        </div>

        {/* Redirect Countdown */}
        <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium mb-6 tracking-wide flex items-center justify-center gap-1.5">
          Auto-redirecting to home in{' '}
          <span className="inline-flex items-center justify-center w-7 h-7 bg-orange-600 text-white text-[11px] font-extrabold rounded-full shadow-sm">
            {countdown}
          </span>{' '}
          seconds
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <i className="ri-home-4-line mr-2" />
            Take Me Home
          </button>
          <button
            onClick={() => navigate('/events')}
            className="px-6 py-3 bg-white dark:bg-neutral-900 text-neutral-850 dark:text-neutral-200 text-xs font-bold uppercase tracking-wider border border-neutral-200 dark:border-neutral-850 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all cursor-pointer shadow-sm"
          >
            <i className="ri-calendar-event-line mr-2" />
            Browse Events
          </button>
        </div>

        {/* Footer */}
        <p className="mt-10 text-[10px] text-neutral-300 dark:text-neutral-700 tracking-widest font-bold uppercase flex items-center justify-center gap-1.5 flex-wrap">
          Error 404 • <span className="logofont font-light normal-case text-neutral-400 dark:text-neutral-500">Campus<span className="text-orange-600 dark:text-orange-500">Node</span></span> • You're off the map 🗺️
        </p>
      </div>
    </div>
  );
};

export default NotFound;
