import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    // Read from localStorage on init (matches the blocking script in index.html)
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    const favicon = document.getElementById('dynamic-favicon');
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      if (favicon) favicon.href = '/darkthemelogo.png';
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      if (favicon) favicon.href = '/lightthemelogo2.png';
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
