// src/analytics.jsx
import React from 'react';
import './index.css';

const Analytics = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200/50 py-20 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-40 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-secondary/5 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-accent/5 rounded-full blur-3xl"></div>
    
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-3">
            <div className="badge badge-primary badge-outline p-3 font-medium text-sm mb-4">Coming Soon</div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Advanced Analytics
              </h1>
          <p className="text-xl opacity-70 max-w-2xl mx-auto leading-relaxed">
            Detailed analysis and visualization of your poker performance.
            Get actionable insights that will transform your game.
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto">
          {/* Coming Soon Card */}
          <div className="card bg-base-100/90 shadow-2xl backdrop-blur-sm overflow-hidden border border-base-300">
            <div className="card-body p-8 md:p-12">
              <div className="flex flex-col lg:flex-row items-center gap-12">
                <div className="flex-1">
                  <div className="relative">
                    <div className="absolute -top-6 -left-6 w-24 h-24 bg-primary/20 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-secondary/20 rounded-full blur-2xl"></div>
                    
                    <div className="relative z-10">
                      <div className="flex justify-center mb-8">
                        <div className="w-24 h-24 bg-base-200/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                      </div>
                      
                      <h2 className="text-3xl font-bold mb-4 text-center">Be the First to Know</h2>
                      <p className="opacity-70 text-center mb-8 leading-relaxed">
                        We're building powerful analytics tools that will transform your poker game with AI-powered insights. Subscribe to be notified when we launch.
                      </p>
                      
                      <div className="flex justify-center gap-3 flex-wrap">
                        <div className="badge badge-lg badge-primary badge-outline p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer">Win Rate Analysis</div>
                        <div className="badge badge-lg badge-secondary badge-outline p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer">Decision Tracking</div>
                        <div className="badge badge-lg badge-accent badge-outline p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer">Opponent Profiling</div>
                        <div className="badge badge-lg badge-neutral badge-outline p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer">Position Stats</div>
                      </div>
                      
                      <div className="mt-10">
                        <div className="flex justify-center mb-2">
                          <div className="join w-full max-w-md shadow-md">
                            <input className="input input-bordered join-item flex-1" placeholder="Your email"/>
                            <button className="btn btn-primary join-item group">
                              Notify Me
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <p className="text-xs opacity-50 text-center">We respect your privacy. No spam, ever.</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 relative min-h-[300px] lg:min-h-[400px]">
                  {/* Mockup Analytics Dashboard */}
                  <div className="absolute inset-0 backdrop-blur-sm bg-base-300/50 rounded-xl overflow-hidden shadow-2xl border border-base-200">
                    <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                    
                    <div className="absolute top-0 left-0 right-0 h-12 bg-base-300/80 backdrop-blur-md border-b border-base-content/10 flex items-center px-4">
                      <div className="w-3 h-3 rounded-full bg-error mr-2"></div>
                      <div className="w-3 h-3 rounded-full bg-warning mr-2"></div>
                      <div className="w-3 h-3 rounded-full bg-success mr-2"></div>
                      <span className="text-xs opacity-50 ml-2">Analytics Dashboard</span>
                    </div>
                    
                    <div className="absolute top-16 left-4 right-4 h-24 bg-base-100/50 rounded backdrop-blur-sm border border-base-200">
                      <div className="h-full flex items-center justify-around">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary/80">67%</div>
                          <div className="text-xs opacity-50">Win Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-secondary/80">$2,450</div>
                          <div className="text-xs opacity-50">Profit</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-accent/80">234</div>
                          <div className="text-xs opacity-50">Hands</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="absolute top-48 left-4 right-4 bottom-4">
                      <div className="h-full grid grid-cols-2 gap-4">
                        <div className="bg-base-100/50 rounded backdrop-blur-sm relative overflow-hidden border border-base-200">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-32 h-32 rounded-full border-8 border-primary/20 border-t-primary animate-spin"></div>
                          </div>
                        </div>
                        <div className="bg-base-100/50 rounded backdrop-blur-sm relative overflow-hidden border border-base-200">
                          <div className="absolute top-0 left-0 right-0 h-8 flex items-center px-3">
                            <div className="text-xs opacity-50">Top Hands</div>
                          </div>
                          <div className="absolute top-10 left-3 right-3 bottom-3">
                            <div className="h-6 bg-base-300/70 rounded-sm mb-2 w-full flex items-center px-2">
                              <span className="text-xs opacity-50">A♠ A♥</span>
                              <div className="ml-auto w-1/2 h-2 bg-base-100 rounded-full overflow-hidden">
                                <div className="h-full bg-success w-4/5"></div>
                              </div>
                            </div>
                            <div className="h-6 bg-base-300/70 rounded-sm mb-2 w-full flex items-center px-2">
                              <span className="text-xs opacity-50">K♠ K♦</span>
                              <div className="ml-auto w-1/2 h-2 bg-base-100 rounded-full overflow-hidden">
                                <div className="h-full bg-success w-3/5"></div>
                              </div>
                            </div>
                            <div className="h-6 bg-base-300/70 rounded-sm mb-2 w-full flex items-center px-2">
                              <span className="text-xs opacity-50">Q♠ Q♣</span>
                              <div className="ml-auto w-1/2 h-2 bg-base-100 rounded-full overflow-hidden">
                                <div className="h-full bg-error w-2/5"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="absolute inset-0 bg-grid-pattern bg-primary/5 opacity-20 pointer-events-none"></div>
                    <div className="absolute inset-0 backdrop-blur-sm flex items-center justify-center bg-base-300/20">
                      <span className="bg-primary/20 text-base-content px-4 py-2 rounded-md backdrop-blur-md text-lg font-medium">Coming Soon</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Feature Previews */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card bg-base-100/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:translate-y-[-5px] border border-base-200">
              <div className="card-body">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">Performance Metrics</h3>
                </div>
                <p className="opacity-70 text-sm leading-relaxed">
                  Track your win rate, ROI, and key performance indicators over time with interactive charts and reports.
                </p>
                <div className="mt-4">
                  <button className="btn btn-ghost btn-sm text-primary px-0 hover:bg-transparent hover:text-primary/80 group">
                    Learn more
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="card bg-base-100/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:translate-y-[-5px] border border-base-200">
              <div className="card-body">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-secondary/10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">Hand History Analysis</h3>
                </div>
                <p className="opacity-70 text-sm leading-relaxed">
                  Review hand histories with AI-powered insights that highlight optimal plays and potential improvements.
                </p>
                <div className="mt-4">
                  <button className="btn btn-ghost btn-sm text-secondary px-0 hover:bg-transparent hover:text-secondary/80 group">
                    Learn more
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="card bg-base-100/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:translate-y-[-5px] border border-base-200">
              <div className="card-body">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-accent/10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">Opponent Database</h3>
                </div>
                <p className="opacity-70 text-sm leading-relaxed">
                  Build and maintain profiles on your opponents, with detailed statistics and tendencies to exploit.
                </p>
                <div className="mt-4">
                  <button className="btn btn-ghost btn-sm text-accent px-0 hover:bg-transparent hover:text-accent/80 group">
                    Learn more
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Promotional Banner */}
          <div className="mt-20 card bg-gradient-to-r from-primary/20 via-base-300/50 to-secondary/20 shadow-xl">
            <div className="card-body p-8 md:p-10">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3">Ready to Elevate Your Game?</h3>
                  <p className="opacity-70 mb-6">
                    Get started with our basic analytics features while we develop our advanced platform. Upload your hand history to see what insights you can gain today.
                  </p>
                  <button className="btn btn-primary">
                    Try Basic Analytics
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-base-100/50 backdrop-blur-sm flex items-center justify-center shadow-xl border border-base-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 md:h-16 md:w-16 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
