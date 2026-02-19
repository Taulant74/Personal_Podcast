import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Header() {
  const { isLoggedIn, username, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Navigation */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
              <span className="text-2xl">🎧</span>
              <span className="font-bold text-xl text-white hidden sm:inline">Personal Podcast</span>
            </Link>

            <nav className="flex items-center gap-6">
              <a href="/" className="text-gray-300 hover:text-white font-medium transition">
                Home
              </a>
              <a href="/episodes" className="text-gray-300 hover:text-white font-medium transition">
                Episodes
              </a>
            </nav>
          </div>

          {/* Auth Buttons or User Info */}
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <span className="text-gray-300 font-medium hidden sm:inline">
                  {username}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600/80 hover:bg-red-700 text-white font-medium rounded-lg transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-300 hover:text-white font-medium transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-green-500 hover:from-indigo-700 hover:to-green-600 text-white font-medium rounded-lg transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
