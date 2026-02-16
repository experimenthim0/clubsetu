
import React, { useEffect } from 'react';

const NotificationPopup = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-100 border-green-500 text-green-800';
      case 'error':
        return 'bg-red-100 border-red-500 text-red-800';
      case 'warning':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      default:
        return 'bg-white border-gray-300 text-gray-800';
    }
  };

  const getIcon = () => {
    switch (type) {
        case 'success': return 'ri-checkbox-circle-line';
        case 'error': return 'ri-error-warning-line';
        case 'warning': return 'ri-alert-line';
        default: return 'ri-information-line';
    }
  }

  return (
    <div className={`fixed top-24 right-5 z-50 flex items-center gap-3 px-6 py-4 rounded-lg shadow-xl border-l-4 transform transition-all duration-500 ease-in-out hover:scale-105 animate-slide-in-right ${getStyles()}`}>
      <i className={`${getIcon()} text-xl`}></i>
      <span className="font-medium text-sm">{message}</span>
      <button onClick={onClose} className="ml-4 hover:opacity-70">
        <i className="ri-close-line"></i>
      </button>
      <style>{`
        @keyframes slide-in-right {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
            animation: slide-in-right 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default NotificationPopup;
