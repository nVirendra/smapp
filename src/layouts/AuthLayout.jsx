import React from 'react';

const AuthLayout = ({ children, imageUrl }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="flex flex-col md:flex-row items-center w-full max-w-5xl bg-white/20 dark:bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden">
        {/* Left Visual */}
        <div
          className="hidden md:block w-full md:w-1/2 h-96 md:h-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${imageUrl})`,
          }}
        />

        {/* Right Content (Form) */}
        <div className="w-full md:w-1/2 p-10 space-y-6">
          {/* E-milo Logo */}
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-white tracking-wide">
              <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 px-3 py-1 rounded-xl shadow-md">
                E-milo
              </span>
            </h1>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
