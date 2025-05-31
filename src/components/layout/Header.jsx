import React, { useState, useEffect, useRef } from 'react';
import {
  FiSearch,
  FiHome,
  FiUser,
  FiChevronDown,
  FiLogOut,
  FiSun,
  FiMoon,
  FiVideo,
  FiPlay,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../Notification/NotificationBell';
import { Link } from 'react-router-dom';

const Header = ({ darkMode, setDarkMode }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="w-full px-6 py-4 bg-white/80 dark:bg-gray-800/90 backdrop-blur-md shadow-sm flex items-center justify-between sticky top-0 z-50">
      <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 px-3 py-1 rounded-xl shadow-md text-white font-bold text-lg tracking-wide hover:brightness-110 transition-all duration-300">
        E-milo
      </span>

      <div className="flex items-center gap-5">
        <FiSearch className="w-5 h-5 text-gray-600 dark:text-gray-300 hover:text-purple-600 cursor-pointer transition-colors" />
        <NotificationBell />
        <div className="flex items-center gap-4">
          <Link to="/" className="text-gray-600 hover:text-gray-900">
                  <FiHome className="w-6 h-6 text-gray-600 dark:text-gray-300 hover:text-purple-600 cursor-pointer transition-colors"/>
         </Link>
        </div>
        <div
          className="relative flex items-center gap-1 cursor-pointer"
          onClick={() => setShowDropdown(!showDropdown)}
          ref={dropdownRef}
        >
          <FiUser className="w-6 h-6 text-gray-600 dark:text-gray-300 hover:text-purple-600 transition-colors" />
          <FiChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          {showDropdown && (
            <div className="absolute right-0 top-10 w-40 bg-white dark:bg-gray-800 shadow-lg rounded-xl p-2 z-50">
              <button
                onClick={() => navigate('/logout')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-2"
              >
                <FiLogOut /> Logout
              </button>
            </div>
          )}
        </div>
        <Link to="/go-live" className="text-gray-600 hover:text-gray-900">
        <FiVideo className="w-6 h-6 text-gray-600 dark:text-gray-300 hover:text-purple-600 cursor-pointer transition-colors"/> 
        </Link>
         <Link to="/live-streams" className="text-gray-600 hover:text-gray-900">
                  <FiPlay className="w-6 h-6 text-gray-600 dark:text-gray-300 hover:text-purple-600 cursor-pointer transition-colors"/>
        </Link>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="ml-4 p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          {darkMode ? (
            <FiSun className="w-5 h-5 text-yellow-400" />
          ) : (
            <FiMoon className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
