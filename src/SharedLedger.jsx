import React, { useState, useEffect } from 'react';
import { getSharedLedgerById } from './services/ledger';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

// Animation variants
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const SharedLedger = ({ ledgerId, setCurrentPage }) => {
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper: Format money amount based on denomination
  const formatMoney = (amount, denomination = 'cents') => {
    const divisor = denomination === 'cents' ? 100 : 1;
    return (amount / divisor).toFixed(2);
  };

  const fetchLedgerData = async () => {
    if (!ledgerId) {
      setError('No ledger ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getSharedLedgerById(ledgerId);
      setLedger(data);
    } catch (err) {
      console.error('Error fetching shared ledger:', err);
      setError('Failed to load the shared ledger. It may have been deleted or the link is invalid.');
      toast.error('Failed to load shared ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerData();
  }, [ledgerId]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format money display based on denomination
  const formatLedgerMoney = (amount) => {
    if (!amount) return '0.00';
    const isDollarsGame = ledger?.denomination === 'dollars';
    // For cents games, convert amount to dollars by dividing by 100
    // For dollar games, use the amount as is
    return isDollarsGame ? amount.toFixed(2) : (amount / 100).toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-b from-base-100 to-base-200">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-lg font-light animate-pulse">Loading shared poker results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200 flex items-center justify-center">
        <div className="card bg-base-100 shadow-xl max-w-md w-full">
          <div className="card-body items-center text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-error opacity-80 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-semibold mb-2">Error Loading Ledger</h2>
            <p className="text-base-content/70 mb-6">{error}</p>
            <button 
              onClick={() => setCurrentPage('home')} 
              className="btn btn-primary"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!ledger) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200 flex items-center justify-center">
        <div className="card bg-base-100 shadow-xl max-w-md w-full">
          <div className="card-body items-center text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 opacity-30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h2 className="text-2xl font-semibold mb-2">Ledger Not Found</h2>
            <p className="text-base-content/70 mb-6">The shared ledger could not be found. It may have been deleted or the link is incorrect.</p>
            <button 
              onClick={() => setCurrentPage('home')} 
              className="btn btn-primary"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200/50 py-12 pt-32">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Shared Poker Results
          </h1>
          <div className="flex justify-center items-center gap-2 text-base-content/70">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatDate(ledger.sessionDate)} at {formatTime(ledger.sessionDate)}</span>
          </div>
          <h2 className="text-2xl mt-6 font-semibold">{ledger.sessionName}</h2>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <motion.div 
            className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200"
            variants={itemVariants}
          >
            <div className="card-body">
              <h3 className="text-lg font-medium opacity-70">Total Players</h3>
              <p className="text-4xl font-bold text-primary">
                {ledger.players?.length || 0}
              </p>
            </div>
          </motion.div>

          <motion.div 
            className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200"
            variants={itemVariants}
          >
            <div className="card-body">
              <h3 className="text-lg font-medium opacity-70">Total Transactions</h3>
              <p className="text-4xl font-bold text-secondary">
                {ledger.transactions?.length || 0}
              </p>
            </div>
          </motion.div>

          <motion.div 
            className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200"
            variants={itemVariants}
          >
            <div className="card-body">
              <h3 className="text-lg font-medium opacity-70">Total Money Exchanged</h3>
              <p className="text-4xl font-bold text-accent">
                ${formatLedgerMoney(ledger.transactions.reduce((total, tx) => {
                  const isDollarsGame = ledger?.denomination === 'dollars';
                  const amount = parseFloat(tx.amount);
                  return total + (isDollarsGame ? amount : amount * 100);
                }, 0))}
              </p>
            </div>
          </motion.div>
        </div>
        {/* Players Section */}
        <div className="card bg-base-100 shadow-xl mb-10 overflow-hidden">
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Players and Results
            </h3>
            <div className="overflow-x-auto">
              <div className="min-w-full rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 bg-base-200 p-4 font-medium text-sm">
                  <div className="col-span-4">Player</div>
                  <div className="col-span-2 text-right">Buy-In</div>
                  <div className="col-span-2 text-right">Cash-Out</div>
                  <div className="col-span-4 text-right">Net Profit/Loss</div>
                </div>
                <div className="divide-y divide-base-200">
                  {ledger.players.map((player, index) => {
                    // For cents games, multiply by 100 to match internal storage format
                    // For dollar games, use amounts as is
                    // const isDollarsGame = ledger?.denomination === 'dollars';
                    // const amount = parseFloat(tx.amount);
                    // return total + (isDollarsGame ? amount : amount * 100);
                    const isDollarsGame = ledger?.denomination === 'dollars';
                    const buyIn = (isDollarsGame ? player.buyIn  : player.buyIn);
                    const cashOut = (isDollarsGame ? player.cashOut  : player.cashOut);
                    const profit = cashOut - buyIn;
                    
                    return (
                      <div key={index} className="grid grid-cols-12 p-4 hover:bg-base-200/50 transition-colors">
                        <div className="col-span-4 font-medium">{player.name}</div>
                        <div className="col-span-2 text-right">${formatLedgerMoney(buyIn)}</div>
                        <div className="col-span-2 text-right">${formatLedgerMoney(cashOut)}</div>
                        <div className={`col-span-4 text-right font-semibold ${profit > 0 ? 'text-success' : profit < 0 ? 'text-error' : ''}`}>
                          ${formatLedgerMoney(profit)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Action Buttons Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Go Back to Home */}
            <button
              onClick={() => setCurrentPage('home')}
              className="group relative flex flex-col items-center gap-4 p-6 rounded-2xl bg-accent/10 hover:bg-accent/20 transition-all duration-300"
            >
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-accent/20 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-1">Back to Home</h3>
                <p className="text-sm opacity-70">Return to home page</p>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-accent scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            </button>

            {/* Share Game */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Share link copied to clipboard!');
              }}
              className="group relative flex flex-col items-center gap-4 p-6 rounded-2xl bg-secondary/10 hover:bg-secondary/20 transition-all duration-300"
            >
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-secondary/20 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-1">Share Game</h3>
                <p className="text-sm opacity-70">Copy link to clipboard</p>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-secondary scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            </button>

            {/* Create New Game */}
            <button
              onClick={() => setCurrentPage('ledger')}
              className="group relative flex flex-col items-center gap-4 p-6 rounded-2xl bg-primary/10 hover:bg-primary/20 transition-all duration-300"
            >
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-primary/20 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-1">Create New Game</h3>
                <p className="text-sm opacity-70">Start a fresh session</p>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            </button>
          </div>
        </div>


        {/* Transactions Section */}
        <div className="card bg-base-100 shadow-xl overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Settlement Transactions
            </h3>
              <div className="text-sm text-base-content/70">
                {ledger.transactions.length} transactions
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-full rounded-lg overflow-hidden space-y-4">
                  {ledger.transactions.map((tx, index) => {
                  const isDollarsGame = ledger?.denomination === 'dollars';
                  const amount = isDollarsGame ? parseFloat(tx.amount) : parseFloat(tx.amount) * 100;
                      
                    return (
                    <div key={index} className="group flex items-center justify-between p-6 bg-base-200/30 rounded-2xl hover:bg-base-200/50 transition-all duration-300 cursor-pointer">
                      <div className="flex-1 grid grid-cols-7 items-center gap-4">
                        {/* From Player */}
                        <div className="col-span-2">
                          <div className="flex items-center gap-3 bg-base-200/50 px-4 py-2 rounded-xl group-hover:bg-base-200/70 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <span className="font-medium text-base-content/90">{tx.from}</span>
                          </div>
                        </div>

                        {/* Arrow and Amount */}
                        <div className="col-span-3 flex items-center justify-center gap-4">
                          <div className="w-12 h-[2px] bg-base-content/20 group-hover:bg-primary/30 transition-colors" />
                          <div className="font-semibold text-success bg-success/10 px-6 py-2 rounded-full group-hover:bg-success/20 transition-all duration-300 min-w-[120px] text-center">
                          ${formatLedgerMoney(amount)}
                          </div>
                          <div className="w-12 h-[2px] bg-base-content/20 group-hover:bg-primary/30 transition-colors" />
                        </div>

                        {/* To Player */}
                        <div className="col-span-2">
                          <div className="flex items-center gap-3 bg-base-200/50 px-4 py-2 rounded-xl group-hover:bg-base-200/70 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-secondary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <span className="font-medium text-base-content/90">{tx.to}</span>
                          </div>
                        </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer with attribution */}
        <div className="mt-10 text-center">
          <p className="text-sm opacity-60">
            This ledger was shared via pokerNOWAI.com
          </p>
          <button 
            onClick={() => setCurrentPage('ledger')} 
            className="btn btn-ghost btn-sm mt-2"
          >
            Create your own ledger
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharedLedger; 