import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div
      className="relative h-[calc(100vh-128px)] -my-8 -mx-4 sm:-mx-6 lg:-mx-8 flex items-center justify-center text-center overflow-hidden bg-space-dark"
    >
      {/* Background image, base64 data, and overlay have been removed. The background is now a solid color. */}

      <div className="relative z-10 max-w-3xl px-4 animate-fade-in-up">
        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-bold font-display leading-tight tracking-tight text-white"
          style={{ animationDelay: '0.2s' }}
        >
          Explore Biology Beyond Earth
        </h1>
        <p
          className="mt-4 text-lg sm:text-xl text-space-text max-w-2xl mx-auto"
          style={{ animationDelay: '0.4s' }}
        >
          An interactive portal into NASA's Space Biology research, powered by AI.
        </p>
        <div
          className="mt-8"
          style={{ animationDelay: '0.6s' }}
        >
          <Link
            to="/explore"
            className="inline-block px-8 py-4 bg-gradient-to-r from-space-blue to-space-light-blue text-white font-bold text-lg rounded-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
          >
            Start Exploring
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;