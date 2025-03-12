import React, { useState, useEffect } from 'react';
import { Analytics } from "@vercel/analytics/react";
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';

// Protected routes configuration
const PROTECTED_ROUTES = {
  fullLogUpload: true,
  analytics: false,
  'saved-ledgers': false,
  bankroll: false,
  ledger: false
};

const Navbar = ({ setCurrentPage }) => {
  const { currentUser, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const handlePageChange = (page) => {
    // Check if the route is protected and user is not logged in
    if (PROTECTED_ROUTES[page] && !currentUser) {
      setCurrentPage('register');
      // Smooth scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setCurrentPage(page);
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    try {
      await logout();
      handlePageChange('home');
      setIsProfileOpen(false);
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <motion.div 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-md ${
      scrolled 
          ? 'bg-base-100/90 shadow-lg py-3' 
          : 'bg-base-100/50 py-5'
      }`}
    >
      <Analytics />
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Left section - Logo */}
          <button 
            className="btn btn-ghost text-xl sm:text-2xl normal-case font-bold tracking-tight hover:bg-transparent"
            onClick={() => handlePageChange('home')}
          >
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              pokerNOWAI
            </span>
          </button>

          {/* Center/Right Navigation Links */}
          <nav className="hidden md:flex items-center">
            <div className="flex items-center gap-5">
            <button
                onClick={() => handlePageChange('features')}
                className="btn btn-ghost normal-case font-medium rounded-lg hover:bg-base-200"
              >
                Features
              </button>
            <span className="w-px h-6 bg-base-content/10"></span>
              {/* Primary Actions */}
              <button
                onClick={() => handlePageChange('fullLogUpload')}
                className="btn btn-ghost normal-case font-medium rounded-lg hover:bg-base-200"
              >
                Upload Hand History
              </button>
              <button
                onClick={() => handlePageChange('analytics')}
                className="btn btn-ghost normal-case font-medium rounded-lg hover:bg-base-200"
              >
                Analytics
              </button>

              {/* Divider */}
              <span className="w-px h-6 bg-base-content/10"></span>

              {/* Secondary Actions */}
              <button
                onClick={() => handlePageChange('ledger')}
                className="btn btn-ghost normal-case font-medium rounded-lg hover:bg-base-200"
              >
                Upload Ledger
              </button>
              <button
                onClick={() => handlePageChange('saved-ledgers')}
                className="btn btn-ghost normal-case font-medium rounded-lg hover:bg-base-200"
              >
                Ledger History
              </button>
        <button 
                onClick={() => handlePageChange('bankroll')}
                className="btn btn-ghost normal-case font-medium rounded-lg hover:bg-base-200"
        >
                Bankroll
        </button>
      </div>
          </nav>

          {/* Right Section - User Controls */}
          <div className="flex items-center gap-2 sm:gap-4">
        {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="btn btn-ghost btn-circle hover:bg-base-200"
              onClick={toggleTheme}
            >
              {isDark ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </motion.button>

        {currentUser ? (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="btn btn-ghost rounded-full hover:bg-base-200 flex items-center gap-3 px-4"
                >
              <div className="avatar placeholder">
                    <div className="bg-primary text-primary-content rounded-full w-9">
                      <span className="text-lg font-medium">
                    {currentUser.displayName ? 
                      currentUser.displayName[0].toUpperCase() : 
                      currentUser.email.split('@')[0][0].toUpperCase()}
                  </span>
                </div>
              </div>
                  <span className="font-medium opacity-90">
                    {currentUser.displayName || currentUser.email.split('@')[0]}
                  </span>
                </motion.button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-56 bg-base-100/95 backdrop-blur-md rounded-xl p-2 shadow-xl border border-base-200"
                    >
                      <motion.button
                        whileHover={{ x: 4 }}
                        onClick={() => {
                          handlePageChange('profile');
                          setIsProfileOpen(false);
                        }}
                        className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-base-200 transition-colors"
                      >
                        <UserCircleIcon className="h-4 w-4" />
                        <span>Profile</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ x: 4 }}
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full p-2 rounded-lg text-error hover:bg-base-200 transition-colors"
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4" />
                        <span>Sign out</span>
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
                </div>
            ) : (
              <div className="flex gap-3 items-center">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn btn-ghost normal-case font-medium rounded-lg hover:bg-base-200"
                  onClick={() => handlePageChange('login')}
                >
                  Sign in
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn btn-primary normal-case font-medium shadow-sm hover:shadow-md transition-all duration-300 rounded-lg"
                  onClick={() => handlePageChange('register')}
            >
              Sign up
                </motion.button>
          </div>
        )}
      </div>
    </div>
      </div>
    </motion.div>
  );
};

// Add this to your CSS file or style block
const style = document.createElement('style');
style.textContent = `
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;
document.head.appendChild(style);

export default Navbar;
