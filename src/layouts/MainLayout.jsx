import React, { useState } from 'react';
import Header from '../components/layout/Header';

const MainLayout = ({ children, mainClassName = 'container mx-auto px-4 py-6' }) => {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />
        <main className={mainClassName}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
