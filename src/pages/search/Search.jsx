import React from 'react';
import { FiSearch } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const SearchSidebar = ({ searchQuery, setSearchQuery, users }) => {
  return (
    <aside className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg sticky top-20 h-fit">
      <div className="relative mb-6">
        <FiSearch className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
        <h3 className="font-bold text-lg mb-4">Suggested for You</h3>
        <div className="space-y-4">
          {users.map((user, index) => (
            <div
              key={index}
              className="flex items-center justify-between group"
            >
              <Link
                to={`/profile/${user._id}`}
                className="flex items-center gap-3 group"
              >
                <img
                  className="w-10 h-10 rounded-full border-2 border-transparent group-hover:border-purple-500 transition-all"
                  alt={user.name}
                />
                <span className="group-hover:text-purple-600 transition-colors">
                  {user.name}
                </span>
              </Link>
              {/* <button
                className={`text-sm px-4 py-1.5 rounded-full ${
                  user.status === 'follow'
                    ? 'bg-purple-500 text-white hover:bg-purple-600'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                } transition-colors`}
              >
                {user.status === 'follow' ? 'Follow' : 'Following'}
              </button> */}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default SearchSidebar;
