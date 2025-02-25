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
      <section className="min-h-screen flex items-center justify-center py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10"></div>
        
        {/* Enhanced animated background elements */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Floating cards */}
        <div className="absolute top-1/4 right-[15%] w-50 opacity-70 rotate-6 hidden lg:block">
          <div className="card bg-base-100/80 backdrop-blur-sm shadow-xl">
            <div className="card-body p-4">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm">
                  <p className="font-bold">Session Profit</p>
                  <p className="text-success">+$777.77</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-1/3 left-[10%] w-50 opacity-70 -rotate-3 hidden lg:block">
          <div className="card bg-base-100/80 backdrop-blur-sm shadow-xl">
            <div className="card-body p-4">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <div className="text-sm">
                  <p className="font-bold">Win Rate</p>
                  <p className="text-secondary">62.5%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-tight">
              Transform Your Poker Game with AI
            </h1>
            <p className="text-xl md:text-2xl mb-10 opacity-80 max-w-3xl mx-auto leading-relaxed">
              Turn your poker hand history into powerful insights. Make data-driven decisions and improve your win rate.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handleGetStarted}
                className="btn btn-primary btn-lg shadow-lg hover:shadow-xl transition-all duration-300 font-medium animate-fadeIn group"
              >
                Get Started - It's Free
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
              <button 
                onClick={() => setCurrentPage('ledger')}
                className="btn btn-outline btn-lg hover:bg-base-200 transition-all duration-300 font-medium animate-fadeIn"
                style={{ animationDelay: '200ms' }}
              >
                Try Ledger Calculator
              </button>
            </div>
            
            {/* Enhanced Stats Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-20 animate-fadeIn" style={{ animationDelay: '400ms' }}>
              <div className="flex flex-col items-center p-6 rounded-xl backdrop-blur-sm bg-base-100/30 hover:bg-base-100/50 transition-all duration-300 hover:scale-105 hover:shadow-lg group">
                <div className="stat-value text-4xl font-bold text-primary mb-2 relative">
                  10K+
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-primary/20 rounded-full animate-ping"></span>
                </div>
                <div className="stat-desc text-lg opacity-70 group-hover:opacity-100 transition-opacity">Hands Analyzed</div>
              </div>
              <div className="flex flex-col items-center p-6 rounded-xl backdrop-blur-sm bg-base-100/30 hover:bg-base-100/50 transition-all duration-300 hover:scale-105 hover:shadow-lg group">
                <div className="stat-value text-4xl font-bold text-secondary mb-2">500+</div>
                <div className="stat-desc text-lg opacity-70 group-hover:opacity-100 transition-opacity">Active Players</div>
              </div>
              <div className="flex flex-col items-center p-6 rounded-xl backdrop-blur-sm bg-base-100/30 hover:bg-base-100/50 transition-all duration-300 hover:scale-105 hover:shadow-lg group">
                <div className="stat-value text-4xl font-bold text-accent mb-2">98%</div>
                <div className="stat-desc text-lg opacity-70 group-hover:opacity-100 transition-opacity">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-base-200 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-primary/5 via-transparent to-secondary/5"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 inline-block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Powerful Features for Serious Players
            </h2>
            <p className="text-xl opacity-70 max-w-2xl mx-auto">
              Our comprehensive set of tools gives you everything you need to analyze, improve, and excel at your poker game.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Hand Analysis Card */}
            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:translate-y-[-5px] h-full">
              <div className="card-body p-8">
                <div className="mb-6 bg-primary/10 p-4 rounded-xl w-fit">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3">Detailed Hand Analysis</h3>
                <p className="opacity-80 mb-4">
                  Get comprehensive hand-by-hand breakdowns showing net profit, aggression metrics, and key actions for every hand.
                </p>
                <div className="mt-auto">
                  <button className="btn btn-ghost text-primary btn-sm px-0 hover:bg-transparent hover:text-primary/80">
                    Learn more
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Win/Loss Card */}
            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:translate-y-[-5px] h-full">
              <div className="card-body p-8">
                <div className="mb-6 bg-secondary/10 p-4 rounded-xl w-fit">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3">Win/Loss Breakdown</h3>
                <p className="opacity-80 mb-4">
                  Identify your most profitable hands and learn from your losses with detailed win/loss charts and analysis.
                </p>
                <div className="mt-auto">
                  <button className="btn btn-ghost text-secondary btn-sm px-0 hover:bg-transparent hover:text-secondary/80">
                    Learn more
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Opponent Stats Card */}
            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:translate-y-[-5px] h-full">
              <div className="card-body p-8">
                <div className="mb-6 bg-accent/10 p-4 rounded-xl w-fit">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3">Opponent Statistics</h3>
                <p className="opacity-80 mb-4">
                  Extract crucial opponent data like VPIP, PFR, and 3-bet sizing to exploit their tendencies.
                </p>
                <div className="mt-auto">
                  <button className="btn btn-ghost text-accent btn-sm px-0 hover:bg-transparent hover:text-accent/80">
                    Learn more
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Bankroll Card */}
            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:translate-y-[-5px] h-full">
              <div className="card-body p-8">
                <div className="mb-6 bg-success/10 p-4 rounded-xl w-fit">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3">Bankroll Tracking</h3>
                <p className="opacity-80 mb-4">
                  Monitor your contributions, winnings, and net profit over time with our comprehensive ledger system.
                </p>
                <div className="mt-auto">
                  <button className="btn btn-ghost text-success btn-sm px-0 hover:bg-transparent hover:text-success/80">
                    Learn more
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Stack Analysis Card */}
            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:translate-y-[-5px] h-full">
              <div className="card-body p-8">
                <div className="mb-6 bg-info/10 p-4 rounded-xl w-fit">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3">Stack Analysis</h3>
                <p className="opacity-80 mb-4">
                  Track your stack changes and identify crucial moments that impact your chip count.
                </p>
                <div className="mt-auto">
                  <button className="btn btn-ghost text-info btn-sm px-0 hover:bg-transparent hover:text-info/80">
                    Learn more
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* AI Advice Card */}
            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:translate-y-[-5px] h-full">
              <div className="card-body p-8">
                <div className="mb-6 bg-warning/10 p-4 rounded-xl w-fit">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3">AI-Powered Advice</h3>
                <p className="opacity-80 mb-4">
                  Receive personalized strategy recommendations based on your playing style and history.
                </p>
                <div className="mt-auto">
                  <button className="btn btn-ghost text-warning btn-sm px-0 hover:bg-transparent hover:text-warning/80">
                    Learn more
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 inline-block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-xl opacity-70 max-w-2xl mx-auto">
              Our simple process takes you from raw data to actionable insights in just a few clicks.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="flex flex-col space-y-12">
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-content flex items-center justify-center text-xl font-bold">1</div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Upload Your Hand History</h3>
                    <p className="opacity-70">
                      Simply upload your poker hand history files or input your ledger data. We support PokerNow and many other formats.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-secondary text-secondary-content flex items-center justify-center text-xl font-bold">2</div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">AI-Powered Analysis</h3>
                    <p className="opacity-70">
                      Our advanced algorithms process your data, identifying patterns, strengths, weaknesses, and opportunities for improvement.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-accent text-accent-content flex items-center justify-center text-xl font-bold">3</div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Review Personalized Insights</h3>
                    <p className="opacity-70">
                      Explore comprehensive reports with detailed metrics, visualizations, and actionable recommendations.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-success text-success-content flex items-center justify-center text-xl font-bold">4</div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Elevate Your Game</h3>
                    <p className="opacity-70">
                      Apply your new insights at the table and track your progress over time to continuously improve your results.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <div className="card bg-base-100 shadow-2xl">
                <div className="card-body p-10">
                  <h3 className="text-2xl font-bold mb-6 text-center">Ready to elevate your game?</h3>
                  <p className="text-center opacity-70 mb-8">
                    Join thousands of players who have already improved their win rate with our platform.
                  </p>
                  <div className="flex justify-center">
                    <button 
                      onClick={() => setCurrentPage('register')}
                      className="btn btn-primary btn-lg shadow-lg"
                    >
                      Start Analyzing Now
                    </button>
                  </div>
                  <div className="mt-8 pt-8 border-t border-base-200">
                    <div className="flex justify-between">
                      <div className="text-center">
                        <div className="stat-value text-2xl font-bold">24/7</div>
                        <div className="text-xs opacity-70">Support</div>
                      </div>
                      <div className="text-center">
                        <div className="stat-value text-2xl font-bold">Free</div>
                        <div className="text-xs opacity-70">Basic Plan</div>
                      </div>
                      <div className="text-center">
                        <div className="stat-value text-2xl font-bold">Secure</div>
                        <div className="text-xs opacity-70">Data Protection</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials - Coming Soon */}
      {/* <section className="py-12 bg-base-200">
        <div className="container mx-auto px-4">
          <div className="card bg-base-100 shadow-xl overflow-hidden">
            <div className="card-body p-8 sm:p-12">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="flex-1">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Join Our Community</h2>
                  <p className="opacity-70 mb-6">
                    Be part of a growing community of poker enthusiasts who are leveraging data to improve their game.
                  </p>
                  <button 
                    onClick={() => setCurrentPage('register')}
                    className="btn btn-primary btn-lg"
                  >
                    Sign Up Now
                  </button>
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="stats shadow">
                    <div className="stat place-items-center">
                      <div className="stat-title">Beta Users</div>
                      <div className="stat-value text-primary">500+</div>
                      <div className="stat-desc">Active players</div>
                    </div>
                    <div className="stat place-items-center">
                      <div className="stat-title">Hands</div>
                      <div className="stat-value text-secondary">10K+</div>
                      <div className="stat-desc">Analyzed daily</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      <div className="mb-20"></div> {/* Add space before footer */}
    </div>
  );
};

export default Home;
