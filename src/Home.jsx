// src/Home.jsx
import React from 'react';
import { useAuth } from './contexts/AuthContext';
import './index.css';

const Home = ({ setCurrentPage }) => {
  const { currentUser } = useAuth();

  const handleGetStarted = () => {
    setCurrentPage(currentUser ? 'fullLogUpload' : 'register');
  };

  return (
    <div className="flex flex-col font-sans">
      {/* Hero Section */}
      <section className="min-h-[80vh] flex items-center justify-center bg-gradient-to-b from-primary/5 to-base-100">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Transform Your Poker Game with AI
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto leading-relaxed">
            Turn your poker hand history into powerful insights. Make data-driven decisions and improve your win rate with advanced analytics.
          </p>
          <div className="flex justify-center">
            <button 
              onClick={handleGetStarted}
              className="btn btn-primary btn-lg font-medium"
            >
              Get Started - It's Free
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-base-200">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Powerful Features for Serious Players
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Hand Analysis Card */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="text-primary mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="card-title text-xl">Detailed Hand Analysis</h3>
                <p className="opacity-80">
                  Get comprehensive hand-by-hand breakdowns showing net profit, aggression metrics, and key actions for every hand.
                </p>
              </div>
            </div>

            {/* Win/Loss Card */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="text-secondary mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="card-title text-xl">Win/Loss Breakdown</h3>
                <p className="opacity-80">
                  Identify your most profitable hands and learn from your losses with detailed win/loss charts and analysis.
                </p>
              </div>
            </div>

            {/* Opponent Stats Card */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="text-accent mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="card-title text-xl">Opponent Statistics</h3>
                <p className="opacity-80">
                  Extract crucial opponent data like VPIP, PFR, and 3-bet sizing to exploit their tendencies.
                </p>
              </div>
            </div>

            {/* Bankroll Card */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="text-success mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="card-title text-xl">Bankroll Tracking</h3>
                <p className="opacity-80">
                  Monitor your contributions, winnings, and net profit over time with our comprehensive ledger system.
                </p>
              </div>
            </div>

            {/* Stack Analysis Card */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="text-info mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="card-title text-xl">Stack Analysis</h3>
                <p className="opacity-80">
                  Track your stack changes and identify crucial moments that impact your chip count.
                </p>
              </div>
            </div>

            {/* AI Advice Card */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="text-warning mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="card-title text-xl">AI-Powered Advice</h3>
                <p className="opacity-80">
                  Receive personalized strategy recommendations based on your playing style and history.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
            <div className="flex-1 max-w-md">
              <div className="steps steps-vertical">
                <div className="step step-primary">Upload your hand history</div>
                <div className="step step-primary">Our AI processes the data</div>
                <div className="step step-primary">Review your personalized insights</div>
                <div className="step">Improve your game</div>
              </div>
            </div>
            <div className="flex-1 max-w-md">
              <div className="mockup-window border bg-base-300">
                <div className="flex justify-center px-4 py-16 bg-base-200">
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-4">Ready to elevate your game?</h3>
                    <button 
                      onClick={() => setCurrentPage('register')}
                      className="btn btn-primary"
                    >
                      Start Analyzing Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
