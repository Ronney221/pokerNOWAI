// src/Notes.jsx
import React from 'react';
import './index.css';

const Template2 = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto p-2 sm:p-4 md:p-6">
        <div className="mockup-window bg-base-300 border shadow-lg">
          <div className="bg-base-200 p-4 sm:p-8 md:p-16">
            <div className="flex flex-col space-y-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center">
                Template 2
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-center">
                This is a responsive template that works on all screen sizes!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Template2;
