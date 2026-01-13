import React from 'react';
import { NavLink } from 'react-router-dom';
import { RocketIcon } from './icons/RocketIcon';
import ThemeToggle from './ThemeToggle';

const Header: React.FC = () => {
  const linkStyle = "px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-space-text-dim hover:text-gray-900 dark:hover:text-space-text hover:bg-gray-200 dark:hover:bg-space-blue transition-colors";
  const activeLinkStyle = "bg-space-light-blue text-white";

  return (
    <header className="bg-white/80 dark:bg-space-dark/80 backdrop-blur-sm sticky top-0 z-50 shadow-md dark:shadow-lg dark:shadow-black/20">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <NavLink to="/" className="flex-shrink-0 flex items-center gap-2 text-gray-900 dark:text-white font-display">
              <RocketIcon className="h-8 w-8 text-space-accent" />
              <span className="text-xl font-bold">BioNova-X</span>
            </NavLink>
          </div>
          <div className="flex items-center">
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <NavLink to="/" className={({ isActive }) => `${linkStyle} ${isActive ? activeLinkStyle : ''}`} end>
                  Home
                </NavLink>
                <NavLink to="/explore" className={({ isActive }) => `${linkStyle} ${isActive ? activeLinkStyle : ''}`}>
                  Explore Data
                </NavLink>
                <NavLink to="/about" className={({ isActive }) => `${linkStyle} ${isActive ? activeLinkStyle : ''}`}>
                  About
                </NavLink>
              </div>
            </div>
            <div className="ml-4">
                <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;