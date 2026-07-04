import React, { useEffect, useState } from 'react';

const NotificationPopup = ({ message, type = 'info', onClose, duration = 3000 }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!duration) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        onClose();
      }
    }, 30);

    return () => clearInterval(interval);
  }, [duration, onClose]);

  const getTheme = () => {
    switch (type) {
      case 'success':
        return {
          border: 'border-emerald-500 dark:border-emerald-500/60',
          accent: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20',
          progress: 'bg-emerald-500',
          tag: 'SUCCESS'
        };
      case 'error':
        return {
          border: 'border-rose-500 dark:border-rose-500/60',
          accent: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20',
          progress: 'bg-rose-500',
          tag: 'ERROR'
        };
      case 'warning':
        return {
          border: 'border-amber-500 dark:border-amber-500/60',
          accent: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20',
          progress: 'bg-amber-500',
          tag: 'WARNING'
        };
      default:
        return {
          border: 'border-orange-500 dark:border-orange-500/60',
          accent: 'text-orange-500 bg-orange-50 dark:bg-orange-950/20',
          progress: 'bg-orange-500',
          tag: 'INFO'
        };
    }
  };

  const theme = getTheme();

  return (
    <div className={`fixed top-20 right-6 z-[9999] max-w-sm w-full bg-white dark:bg-neutral-900 border-2 ${theme.border} text-black dark:text-white rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.05)] overflow-hidden transition-all duration-300 hover:scale-[1.02] animate-slide-in-right`}>
      <div className="p-4 flex items-start gap-3">
        {/* Status Tag */}
        <div className={`px-2 py-0.5 rounded text-[9px] font-black code-font uppercase tracking-widest ${theme.accent}`}>
          {theme.tag}
        </div>
        
        {/* Message */}
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-[12px] font-bold text-neutral-800 dark:text-neutral-200 leading-relaxed break-words">
            {message}
          </p>
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          aria-label="Dismiss notification"
        >
          <i className="ri-close-line text-lg" />
        </button>
      </div>

      {/* Progress Bar Loader */}
      {duration && (
        <div className="w-full h-[3px] bg-neutral-100 dark:bg-neutral-800">
          <div 
            className={`h-full ${theme.progress} transition-all duration-300 ease-out`} 
            style={{ width: `${progress}%` }} 
          />
        </div>
      )}

      <style>{`
        .code-font { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
        @keyframes slide-in-right {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default NotificationPopup;
