import React, { useState } from 'react';
import Header from '../components/layout/Header';

const MainLayout = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />
        <main className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
