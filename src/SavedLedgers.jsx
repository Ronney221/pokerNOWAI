import React, { useState, useEffect } from 'react';
import { getUserLedgers, getLedgerById, deleteLedgerById, trackPlayerPerformance } from './services/ledger';
import { useAuth } from './contexts/AuthContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import ReactDOM from 'react-dom';
import './index.css';

// Animation variants for Framer Motion
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", stiffness: 100 }
  },
  hover: { 
    y: -8,
    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    transition: { 
      type: "spring", 
      stiffness: 400,
      damping: 15
    }
  },
  tap: { scale: 0.98 }
};

const pageTransitionVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: "easeIn"
    }
  }
};

const SavedLedgers = ({ setCurrentPage }) => {
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [ledgerToDelete, setLedgerToDelete] = useState(null);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const { currentUser } = useAuth();

  // Helper: Format money amount based on denomination
  const formatMoney = (amount, denomination = 'cents') => {
    const divisor = denomination === 'cents' ? 100 : 1;
    return (amount / divisor).toFixed(2);
  };

  useEffect(() => {
    // Redirect if not logged in
    if (!currentUser) {
      setCurrentPage('login');
      return;
    }

    // Fetch user's ledgers
    const fetchLedgers = async () => {
      try {
        setLoading(true);
        const data = await getUserLedgers(currentUser.uid);
        setLedgers(data || []);
      } catch (err) {
        console.error('Error fetching ledgers:', err);
        setError('Failed to load your saved ledgers. Please try again.');
        toast.error('Failed to load ledgers');
      } finally {
        setLoading(false);
      }
    };

    fetchLedgers();
  }, [currentUser, setCurrentPage]);

  const handleViewLedger = async (ledgerId) => {
    try {
      setLoading(true);
      const ledger = await getLedgerById(ledgerId);
      setSelectedLedger(ledger);
      
      // Add a smooth scroll to top
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } catch (err) {
      console.error('Error fetching ledger details:', err);
      toast.error('Failed to load ledger details');
    } finally {
      setLoading(false);
    }
  };

  // Format money display based on ledger's saved denomination
  const formatLedgerMoney = (amount, ledger) => {
    const isDollarsGame = ledger?.denomination === 'dollars';
    return isDollarsGame ? amount.toFixed(2) : (amount / 100).toFixed(2);
  };

  const handleOpenDeleteModal = (e, ledger) => {
    e.stopPropagation(); // Prevent card click event (which would open the ledger)
    setLedgerToDelete(ledger);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteLedger = async () => {
    if (!ledgerToDelete) return;
    
    try {
      setLoading(true);
      await deleteLedgerById(ledgerToDelete._id);
      
      // Update the UI by removing the deleted ledger
      if (selectedLedger && selectedLedger._id === ledgerToDelete._id) {
        setSelectedLedger(null);
      }
      
      setLedgers(ledgers.filter(ledger => ledger._id !== ledgerToDelete._id));
      toast.success('Ledger deleted successfully');
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error('Error deleting ledger:', err);
      toast.error('Failed to delete ledger');
    } finally {
      setLoading(false);
      setLedgerToDelete(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate total profit across all players
  const calculateTotalProfit = (players, ledger) => {
    if (!players || players.length === 0) return 0;
    
    // Sum up all positive profits (winners only)
    const winners = players.filter(player => player.cashOut > player.buyIn);
    const isDollarsGame = ledger?.denomination === 'dollars';
    
    return winners.reduce((total, player) => {
      const profit = player.cashOut - player.buyIn;
      return total + (isDollarsGame ? profit : profit / 100);
    }, 0);
  };

  // Get player with highest profit
  const getPlayerWithHighestProfit = (players, ledger) => {
    if (!players || players.length === 0) return null;
    const isDollarsGame = ledger?.denomination === 'dollars';
    
    return players.reduce((max, player) => {
      const currentProfit = isDollarsGame 
        ? (player.cashOut - player.buyIn)
        : (player.cashOut - player.buyIn) / 100;
      const maxProfit = max 
        ? (isDollarsGame ? (max.cashOut - max.buyIn) : (max.cashOut - max.buyIn) / 100)
        : -Infinity;
      
      return (!max || currentProfit > maxProfit) ? player : max;
    }, null);
  };

  // Handle opening the track performance modal
  const handleOpenTrackModal = () => {
    if (!currentUser) {
      toast.info('Please sign in to track your performance');
      setCurrentPage('login');
      return;
    }
    
    if (!selectedLedger || !selectedLedger.players || selectedLedger.players.length === 0) {
      toast.error('No players found in this ledger');
      return;
    }
    
    setSelectedPlayer(null);
    setIsTrackModalOpen(true);
  };

  // Handle player selection
  const handlePlayerSelect = (player) => {
    setSelectedPlayer(player);
  };

  // Handle tracking performance
  const handleTrackPerformance = async () => {
    if (!selectedPlayer) {
      toast.error('Please select a player');
      return;
    }
    
    try {
      setTrackingLoading(true);
      
      // Normalize monetary values to whole dollars
      // If it's a cents game, round to nearest dollar
      // If it's a dollars game, use as is
      const isDollarsGame = selectedLedger.denomination === 'dollars';
      
      // For cents games, divide by 100 to get dollar value, then round to nearest whole dollar
      // For dollar games, just use the value directly
      // Multiply by 100 to convert to cents for storage
      const buyInCents = isDollarsGame
        ? Math.round(selectedPlayer.buyIn)  * 100  // Dollar games - keep as whole dollars
        : Math.round(selectedPlayer.buyIn / 100) * 100;  // Cents games - round to nearest dollar
      
      const cashOutCents = isDollarsGame
        ? Math.round(selectedPlayer.cashOut) * 100  // Dollar games - keep as whole dollars
        : Math.round(selectedPlayer.cashOut / 100) * 100;  // Cents games - round to nearest dollar
      
      const performanceData = {
        firebaseUid: currentUser.uid,
        ledgerId: selectedLedger._id,
        playerName: selectedPlayer.name,
        sessionName: selectedLedger.sessionName,
        sessionDate: selectedLedger.sessionDate,
        buyIn: buyInCents,
        cashOut: cashOutCents,
        denomination: 'dollars' // Always use dollars as display denomination
      };
      
      await trackPlayerPerformance(performanceData);
      setIsTrackModalOpen(false);

      // Create a custom modal instead of using toast
      const modalRoot = document.createElement('div');
      modalRoot.id = 'success-modal';
      modalRoot.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50';
      document.body.appendChild(modalRoot);

      const handleDismiss = () => {
        document.body.removeChild(modalRoot);
      };

      const handleViewBankroll = () => {
        handleDismiss();
        setCurrentPage('bankroll');
      };

      ReactDOM.render(
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="card bg-base-100 shadow-xl border border-base-200 w-full max-w-sm mx-4"
        >
          <div className="card-body p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg">Performance Tracked!</h3>
                <p className="text-base-content/70 text-sm">
                  {selectedPlayer.name}'s results have been added to your bankroll
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-base-200/50 rounded-lg p-3">
                <div className="text-sm text-base-content/70">Buy-in</div>
                <div className="text-lg font-semibold">${formatLedgerMoney(selectedPlayer.buyIn, selectedLedger)}</div>
              </div>
              <div className="bg-base-200/50 rounded-lg p-3">
                <div className="text-sm text-base-content/70">Cash-out</div>
                <div className="text-lg font-semibold">${formatLedgerMoney(selectedPlayer.cashOut, selectedLedger)}</div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleViewBankroll}
                className="btn btn-primary flex-1"
              >
                View Bankroll
              </button>
              <button
                onClick={handleDismiss}
                className="btn btn-ghost flex-1"
              >
                Continue
              </button>
            </div>
          </div>
        </motion.div>,
        modalRoot
      );

    } catch (error) {
      console.error('Error tracking performance:', error);
      toast.error(`Failed to track performance: ${error.message}`);
    } finally {
      setTrackingLoading(false);
    }
  };

  // Format transaction amount based on denomination
  const formatTransactionAmount = (amount, ledger) => {
    const isDollarsGame = ledger?.denomination === 'dollars';
    // If it's a cents game, multiply by 100 to get the correct amount
    const adjustedAmount = isDollarsGame ? parseFloat(amount) : parseFloat(amount) * 100;
    return formatLedgerMoney(adjustedAmount, ledger);
  };

  if (loading && !selectedLedger && ledgers.length === 0) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-b from-base-100 to-base-200">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-lg font-light animate-pulse">Loading your poker history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200/50 pt-32 pb-20">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-40 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-secondary/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-accent/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <AnimatePresence mode="wait">
          {selectedLedger ? (
            // Detail View
            <motion.div
              key="detail-view"
              variants={pageTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="max-w-6xl mx-auto"
            >
              {/* Back button and header */}
              <div className="flex items-center mb-8">
                <motion.button 
                  onClick={() => setSelectedLedger(null)} 
                  className="btn btn-ghost btn-circle mr-4"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>
                <div className="flex-grow">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {selectedLedger.sessionName}
                  </h2>
                  <div className="text-sm opacity-70 mt-1">
                    {formatDate(selectedLedger.sessionDate)} at {formatTime(selectedLedger.sessionDate)}
                  </div>
                </div>
              </div>

              
              
              {/* Content sections */}
              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <motion.div 
                    className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200"
                    variants={itemVariants}
                  >
                    <div className="card-body">
                      <h3 className="text-lg font-medium opacity-70">Total Players</h3>
                      <p className="text-4xl font-bold text-primary">{selectedLedger.players?.length || 0}</p>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200"
                    variants={itemVariants}
                  >
                    <div className="card-body">
                      <h3 className="text-lg font-medium opacity-70">Total Transactions</h3>
                      <p className="text-4xl font-bold text-secondary">{selectedLedger.transactions?.length || 0}</p>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200"
                    variants={itemVariants}
                  >
                    <div className="card-body">
                      <h3 className="text-lg font-medium opacity-70">Total Money Exchanged</h3>
                      <p className="text-4xl font-bold text-accent">
                        ${formatLedgerMoney(selectedLedger.transactions.reduce((total, tx) => {
                          // For cents games, convert amount to cents before adding
                          const amount = selectedLedger.denomination === 'cents' 
                            ? parseFloat(tx.amount) * 100 
                            : parseFloat(tx.amount);
                          return total + amount;
                        }, 0), selectedLedger)}
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Players Table */}
                <motion.div 
                  className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200"
                  variants={itemVariants}
                >
                  <div className="card-body">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold">Players and Results</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="table w-full">
                        <thead>
                          <tr className="bg-base-200/50">
                            <th>Player</th>
                            <th className="text-right">Buy-in</th>
                            <th className="text-right">Cash-out</th>
                            <th className="text-right">Net Profit/Loss</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedLedger.players.map((player, index) => {
                            const profit = player.cashOut - player.buyIn;
                            return (
                              <motion.tr 
                                key={index}
                                className="hover:bg-base-200/30 transition-colors"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                              >
                                <td className="font-medium">{player.name}</td>
                                <td className="text-right">${formatLedgerMoney(player.buyIn, selectedLedger)}</td>
                                <td className="text-right">${formatLedgerMoney(player.cashOut, selectedLedger)}</td>
                                <td className={`text-right font-semibold ${profit > 0 ? 'text-success' : profit < 0 ? 'text-error' : ''}`}>
                                  ${formatLedgerMoney(profit, selectedLedger)}
                                </td>
                              </motion.tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
                  
                  {/* Main Action Buttons Section */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Share Game */}
                  <motion.button
                    onClick={() => {
                      const baseUrl = window.location.origin;
                      const shareUrl = `${baseUrl}/shared-ledger/${selectedLedger._id}`;
                      navigator.clipboard.writeText(shareUrl)
                        .then(() => toast.success('Share link copied to clipboard!'))
                        .catch(err => {
                          console.error('Failed to copy link:', err);
                          toast.error('Failed to copy link');
                        });
                    }}
                    className="group relative flex flex-col items-center gap-4 p-6 rounded-2xl bg-secondary/10 hover:bg-secondary/20 transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
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
                  </motion.button>

                  {/* Add to Bankroll */}
                  <motion.button
                    onClick={handleOpenTrackModal}
                    className="group relative flex flex-col items-center gap-4 p-6 rounded-2xl bg-primary/10 hover:bg-primary/20 transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="w-16 h-16 flex items-center justify-center rounded-full bg-primary/20 group-hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-1">Add to Bankroll</h3>
                      <p className="text-sm opacity-70">Track your performance</p>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                  </motion.button>

                  {/* Delete Game */}
                  <motion.button
                    onClick={(e) => handleOpenDeleteModal(e, selectedLedger)}
                    className="group relative flex flex-col items-center gap-4 p-6 rounded-2xl bg-error/10 hover:bg-error/20 transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="w-16 h-16 flex items-center justify-center rounded-full bg-error/20 group-hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-1">Delete Game</h3>
                      <p className="text-sm opacity-70">Remove permanently</p>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-error scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                  </motion.button>
                </div>
              </div>

                {/* Transactions Table */}
                <motion.div 
                  className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200"
                  variants={itemVariants}
                >
                  <div className="card-body">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        Settlement Transactions
                      </h3>
                      <div className="text-sm text-base-content/70">
                        {selectedLedger.transactions.length} transactions
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <div className="min-w-full rounded-lg overflow-hidden space-y-4">
                        {selectedLedger.transactions.map((tx, index) => {
                          // For cents games, convert amount to cents before adding
                          const amount = selectedLedger.denomination === 'cents' 
                            ? parseFloat(tx.amount) * 100  // First 100 for dollars->cents, second 100 to match player amounts
                            : parseFloat(tx.amount) * 100;
                            
                          return (
                            <motion.div 
                              key={index}
                              className="group flex items-center justify-between p-6 bg-base-200/30 rounded-2xl hover:bg-base-200/50 transition-all duration-300 cursor-pointer"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                            >
                              <div className="flex-1 grid grid-cols-7 items-center gap-4">
                                {/* From Player */}
                                <div className="col-span-2">
                                  <motion.div 
                                    className="flex items-center gap-3 bg-base-200/50 px-4 py-2 rounded-xl group-hover:bg-base-200/70 transition-colors"
                                    whileHover={{ x: 5 }}
                                  >
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                    </div>
                                    <span className="font-medium text-base-content/90">{tx.from}</span>
                                  </motion.div>
                                </div>

                                {/* Arrow and Amount */}
                                <div className="col-span-3 flex items-center justify-center gap-4">
                                  <motion.div 
                                    className="w-12 h-[2px] bg-base-content/20 group-hover:bg-primary/30 transition-colors"
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ delay: index * 0.1 + 0.2 }}
                                  />
                                  <motion.div 
                                    className="font-semibold text-success bg-success/10 px-6 py-2 rounded-full group-hover:bg-success/20 transition-all duration-300 min-w-[120px] text-center"
                                    whileHover={{ y: -2 }}
                                  >
                                    ${formatLedgerMoney(amount, selectedLedger)}
                                  </motion.div>
                                  <motion.div 
                                    className="w-12 h-[2px] bg-base-content/20 group-hover:bg-primary/30 transition-colors"
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ delay: index * 0.1 + 0.2 }}
                                  />
                                </div>

                                {/* To Player */}
                                <div className="col-span-2">
                                  <motion.div 
                                    className="flex items-center gap-3 bg-base-200/50 px-4 py-2 rounded-xl group-hover:bg-base-200/70 transition-colors"
                                    whileHover={{ x: -5 }}
                                  >
                                    <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-secondary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                    </div>
                                    <span className="font-medium text-base-content/90">{tx.to}</span>
                                  </motion.div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            // List View - Your existing list view code
            <motion.div
              key="list-view"
              variants={pageTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {/* Hero Header */}
              <motion.div 
                className="text-center mb-16"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Your Poker History
                </h1>
                <p className="text-lg opacity-80 max-w-2xl mx-auto">
                  Review your past sessions, track your progress, and gain insights from your poker journey.
                </p>
              </motion.div>

              {error && (
                <motion.div 
                  className="max-w-xl mx-auto mb-10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="alert alert-error shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h3 className="font-bold">We encountered a problem</h3>
                      <div className="text-sm">{error}</div>
                    </div>
                    <motion.button 
                      className="btn btn-sm btn-outline"
                      onClick={() => window.location.reload()}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Retry
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {loading ? (
                <div className="flex justify-center items-center min-h-[400px]">
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
                    <p className="text-lg opacity-70 animate-pulse">Loading your poker history...</p>
                  </motion.div>
                </div>
              ) : ledgers.length === 0 ? (
                <motion.div 
                  className="max-w-2xl mx-auto"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200">
                    <div className="card-body items-center text-center py-16">
                      <motion.div 
                        className="mb-8"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </motion.div>
                      <h2 className="text-2xl font-bold mb-4">No Ledgers Found</h2>
                      <p className="text-base-content/70 mb-8">Your poker journey begins with your first saved ledger.</p>
                      <motion.button 
                        onClick={() => setCurrentPage('ledger')} 
                        className="btn btn-primary btn-lg gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Create Your First Ledger
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <motion.div 
                      className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200"
                      variants={itemVariants}
                    >
                      <div className="card-body">
                        <h3 className="text-lg font-medium opacity-70">Total Sessions</h3>
                        <p className="text-4xl font-bold text-primary">{ledgers.length}</p>
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200"
                      variants={itemVariants}
                    >
                      <div className="card-body">
                        <h3 className="text-lg font-medium opacity-70">Total Players</h3>
                        <p className="text-4xl font-bold text-secondary">
                          {ledgers.reduce((total, ledger) => total + (ledger.players?.length || 0), 0)}
                        </p>
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200"
                      variants={itemVariants}
                    >
                      <div className="card-body">
                        <h3 className="text-lg font-medium opacity-70">Total Transactions</h3>
                        <p className="text-4xl font-bold text-accent">
                          {ledgers.reduce((total, ledger) => total + (ledger.transactions?.length || 0), 0)}
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      Recent Sessions
                    </h2>
                    <motion.button 
                      onClick={() => setCurrentPage('ledger')} 
                      className="btn btn-primary gap-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      New Session
                    </motion.button>
                  </div>

                  {/* Ledger Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                      {ledgers.map((ledger) => {
                        const totalProfit = calculateTotalProfit(ledger.players, ledger);
                        const topPlayer = getPlayerWithHighestProfit(ledger.players, ledger);
                        
                        return (
                          <motion.div 
                            key={ledger._id} 
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            whileHover="hover"
                            whileTap="tap"
                            layoutId={ledger._id}
                            className="card bg-base-100/90 shadow-xl border border-base-200 overflow-hidden group cursor-pointer relative"
                            onClick={() => handleViewLedger(ledger._id)}
                          >
                            {/* Highlight gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/5 group-hover:to-primary/10 transition-all duration-500"></div>
                            
                            {/* Delete Button */}
                            <motion.button 
                              className="absolute top-2 right-2 btn btn-circle btn-xs btn-ghost opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-base-100/80"
                              onClick={(e) => handleOpenDeleteModal(e, ledger)}
                              whileHover={{ scale: 1.1, backgroundColor: 'rgb(239 68 68 / 0.2)' }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </motion.button>
                            
                            <div className="card-body p-6 relative">
                              <motion.div 
                                className="flex justify-between items-start mb-4"
                                initial={{ y: 0 }}
                                whileHover={{ y: -2 }}
                              >
                                <h3 className="card-title text-lg font-medium truncate" title={ledger.sessionName}>
                                  {ledger.sessionName}
                                </h3>
                                <div className="badge badge-ghost opacity-70">{formatDate(ledger.sessionDate)}</div>
                              </motion.div>
                              
                              <div className="grid grid-cols-2 gap-4 my-4">
                                <motion.div 
                                  className="stat bg-base-200/50 rounded-xl p-4 relative overflow-hidden group/stat"
                                  whileHover={{ scale: 1.02 }}
                                >
                                  <div className="absolute inset-0 bg-primary/0 group-hover/stat:bg-primary/5 transition-colors duration-300"></div>
                                  <div className="stat-title text-xs opacity-70">Players</div>
                                  <div className="stat-value text-2xl relative z-10">{ledger.players?.length || 0}</div>
                                </motion.div>
                                <motion.div 
                                  className="stat bg-base-200/50 rounded-xl p-4 relative overflow-hidden group/stat"
                                  whileHover={{ scale: 1.02 }}
                                >
                                  <div className="absolute inset-0 bg-primary/0 group-hover/stat:bg-primary/5 transition-colors duration-300"></div>
                                  <div className="stat-title text-xs opacity-70">Transactions</div>
                                  <div className="stat-value text-2xl relative z-10">{ledger.transactions?.length || 0}</div>
                                </motion.div>
                              </div>
                              
                              {topPlayer && (
                                <motion.div 
                                  className="mt-4 pt-4 border-t border-base-300"
                                  initial={{ y: 0 }}
                                  whileHover={{ y: -2 }}
                                >
                                  <div className="text-xs opacity-70 mb-1">Top Player</div>
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">{topPlayer.name}</span>
                                    <span className={`font-semibold ${(topPlayer.cashOut - topPlayer.buyIn) > 0 ? 'text-success' : 'text-error'}`}>
                                      ${formatLedgerMoney((topPlayer.cashOut - topPlayer.buyIn), ledger)}
                                    </span>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                            
                            <div className="card-actions justify-end bg-base-200/50 p-4 relative group-hover:bg-base-200/80 transition-colors duration-300">
                              <motion.button 
                                className="btn btn-primary btn-sm gap-2"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewLedger(ledger._id);
                                }}
                              >
                                View Details
                                <motion.svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  className="h-4 w-4" 
                                  fill="none" 
                                  viewBox="0 0 24 24" 
                                  stroke="currentColor"
                                  initial={{ x: 0 }}
                                  whileHover={{ x: 2 }}
                                  transition={{ type: "spring", stiffness: 400 }}
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </motion.svg>
                              </motion.button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="card bg-base-100 w-full max-w-md shadow-2xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="card-body">
                <h3 className="card-title text-xl text-warning">Delete Ledger?</h3>
                <p className="py-4">
                  Are you sure you want to delete ledger "{ledgerToDelete?.sessionName}"? This action cannot be undone.
                </p>
                <div className="card-actions justify-end mt-6">
                  <motion.button 
                    onClick={() => setIsDeleteModalOpen(false)} 
                    className="btn btn-ghost"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button 
                    onClick={handleDeleteLedger} 
                    className="btn btn-error"
                    disabled={loading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {loading ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Deleting...
                      </>
                    ) : "Delete Ledger"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Track Performance Modal */}
      <AnimatePresence>
        {isTrackModalOpen && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="card bg-base-100 w-full max-w-md shadow-2xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="card-body">
                <h3 className="card-title text-xl">Track Player Performance</h3>
                <p className="text-sm text-base-content/70 mb-4">
                  Select a player to track their performance in your bankroll.
                </p>
                
                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-base-100">
                  {selectedLedger?.players.map((player, index) => (
                    <motion.div
                      key={index}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedPlayer?.name === player.name 
                          ? 'border-primary bg-primary/10' 
                          : 'border-base-300 hover:border-primary'
                      }`}
                      onClick={() => handlePlayerSelect(player)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{player.name}</span>
                        <span className={`font-semibold ${(player.cashOut - player.buyIn) >= 0 ? 'text-success' : 'text-error'}`}>
                          ${formatLedgerMoney((player.cashOut - player.buyIn), selectedLedger)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <div className="mt-6 flex justify-end gap-2 border-t pt-4">
                  <motion.button 
                    onClick={() => setIsTrackModalOpen(false)}
                    className="btn btn-ghost"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button 
                    onClick={handleTrackPerformance}
                    className="btn btn-primary"
                    disabled={!selectedPlayer || trackingLoading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {trackingLoading ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Tracking...
                      </>
                    ) : "Track Performance"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SavedLedgers; 