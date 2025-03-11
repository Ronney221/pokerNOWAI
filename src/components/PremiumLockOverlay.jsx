import React from 'react';

export const PremiumLockOverlay = ({ remainingItems, feature = "items", onUpgrade }) => {
  return (
    <div className="col-span-full">
      <div className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200 p-8 text-center">
        <div className="text-warning mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2">Premium Feature</h3>
        <p className="text-base-content/70 mb-4">
          Upgrade to view <strong className="text-lg">{remainingItems}</strong> more {feature} and unlock advanced analysis features.
        </p>
        <button 
          className="btn btn-primary"
          onClick={onUpgrade}
        >
          Upgrade to Premium
        </button>
      </div>
    </div>
  );
}; 