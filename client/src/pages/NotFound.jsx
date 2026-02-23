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
  "Abhi tk baat puri nhi hui 😅",
  ""
];

const NotFound = () => {
  const navigate = useNavigate();
  const [message] = useState(() => funnyMessages[Math.floor(Math.random() * funnyMessages.length)]);
  const [glitch, setGlitch] = useState(false);
  const [countdown, setCountdown] = useState(30);

  // Glitch effect every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 200);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="min-h-screen bg-white flex items-center justify-center px-6 relative overflow-hidden">

      {/* Background dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      />

      {/* Floating emoji decorations */}
      <div className="absolute top-20 left-10 text-6xl animate-bounce opacity-20 select-none" style={{ animationDelay: '0s', animationDuration: '3s' }}>🤷</div>
      <div className="absolute top-40 right-16 text-5xl animate-bounce opacity-15 select-none" style={{ animationDelay: '1s', animationDuration: '4s' }}>🔍</div>
      <div className="absolute bottom-32 left-20 text-5xl animate-bounce opacity-15 select-none" style={{ animationDelay: '0.5s', animationDuration: '3.5s' }}>🫠</div>
      <div className="absolute bottom-20 right-24 text-6xl animate-bounce opacity-20 select-none" style={{ animationDelay: '1.5s', animationDuration: '2.5s' }}>💀</div>

      <div className="relative z-10 max-w-lg w-full text-center">

        {/* Giant 404 */}
        <div className="relative mb-6">
          <h1
            className={`text-[160px] md:text-[200px] font-black leading-none tracking-tighter text-black select-none transition-all duration-100 ${glitch ? 'translate-x-1 text-orange-600' : ''}`}
            style={{
              textShadow: glitch
                ? '-3px 0 #EA580C, 3px 0 #000, 0 3px #EA580C'
                : '4px 4px 0px #EA580C',
            }}
          >
            404
          </h1>
          {/* Strikethrough decoration */}
          <div className="absolute top-1/2 left-0 right-0 h-[3px] bg-orange-600 -translate-y-1/2 opacity-30" />
        </div>

        {/* Funny tagline */}
        <div className="border-2 border-black rounded-sm p-5 mb-6 bg-neutral-50 shadow-[4px_4px_0px_#0D0D0D]">
          <p className="text-[11px] font-bold uppercase tracking-widest text-orange-600 mb-2">
            Page Not Found
          </p>
          <p className="text-[16px] text-neutral-700 leading-relaxed font-medium">
            {message}
          </p>
        </div>

        {/* Redirect countdown */}
        <p className="text-[12px] text-neutral-400 font-medium mb-6 tracking-wide">
          Auto-redirecting to home in{' '}
          <span className="inline-flex items-center justify-center w-7 h-7 bg-black text-white text-[11px] font-black rounded-full">
            {countdown}
          </span>{' '}
          seconds
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3.5 bg-black text-white text-[12px] font-bold uppercase tracking-widest border-2 border-black rounded-sm hover:bg-orange-600 hover:border-orange-600 transition-all cursor-pointer shadow-[3px_3px_0px_#EA580C] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px]"
          >
            <i className="ri-home-4-line mr-2" />
            Take Me Home
          </button>
          <button
            onClick={() => navigate('/events')}
            className="px-8 py-3.5 bg-white text-black text-[12px] font-bold uppercase tracking-widest border-2 border-black rounded-sm hover:bg-yellow-400 transition-all cursor-pointer shadow-[3px_3px_0px_#0D0D0D] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px]"
          >
            <i className="ri-calendar-event-line mr-2" />
            Browse Events
          </button>
        </div>

        {/* Fun footer */}
        <p className="mt-10 text-[11px] text-neutral-300 uppercase tracking-widest font-bold">
          Error 404 • ClubSetu • You're off the map 🗺️
        </p>
      </div>
    </div>
  );
};

export default NotFound;
