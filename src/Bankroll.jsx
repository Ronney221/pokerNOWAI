import React, { useState, useEffect, useRef } from 'react';
import { 
  getPlayerPerformanceHistory, 
  trackPlayerPerformance, 
  updatePlayerPerformance, 
  deletePlayerPerformance 
} from './services/ledger';
import { useAuth } from './contexts/AuthContext';
import { toast } from 'react-toastify';
import { format, parseISO, isValid } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { pageTransitionVariants, containerVariants, itemVariants } from './animations/pageTransitions';
import Dashboard from './components/Dashboard';
import ReactDOM from 'react-dom';
import './index.css';

/**
 * Bankroll component that displays player performance data with CRUD functionality
 */
const Bankroll = () => {
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    sessionName: '',
    playerName: '',
    sessionDate: format(new Date(), 'yyyy-MM-dd'),
    buyIn: '',
    cashOut: '',
    denomination: 'dollars'
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [performanceToDelete, setPerformanceToDelete] = useState(null);
  const [isGlobalEditMode, setIsGlobalEditMode] = useState(false);
  const { currentUser } = useAuth();
  
  // Chart data
  const [chartData, setChartData] = useState(null);
  
  // Reference to chart container for responsiveness
  const chartRef = useRef(null);

  // Add state for multiple selection
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [isMultiDeleteModalOpen, setIsMultiDeleteModalOpen] = useState(false);

  useEffect(() => {
    fetchPerformanceData();
  }, [currentUser]);

  useEffect(() => {
    if (performanceData.length > 0) {
      prepareChartData();
    }
  }, [performanceData]);

  /**
   * Prepare data for the performance chart
   */
  const prepareChartData = () => {
    if (!performanceData || performanceData.length === 0) {
      return { labels: [], data: [], backgroundColor: '#36A2EB', borderColor: '#36A2EB' };
    }
    
    // Sort by date (oldest to newest)
    const sortedData = [...performanceData].sort((a, b) => new Date(a.sessionDate) - new Date(b.sessionDate));
    
    // Calculate running total for each entry
    const runningTotals = [];
    let runningTotal = 0;
    
    for (const item of sortedData) {
      runningTotal += item.profit;
      runningTotals.push({
        id: item._id,
        date: formatDate(item.sessionDate),
        profit: item.profit,
        runningTotal: runningTotal,
        sessionName: item.sessionName || 'Unnamed Game'
      });
    }
    
    const labels = runningTotals.map(item => item.date);
    // Always format profit in cents for consistency
    const data = runningTotals.map(item => item.runningTotal / 100);
    
    // Create color points for the chart - red below 0, green above 0
    const colorPoints = runningTotals.map(item => item.runningTotal < 0 ? '#FF6384' : '#36A2EB');
    
    // For the line chart, color based on final profit
    const isFinalProfitPositive = runningTotal >= 0;
    
    return {
      labels,
      data,
      backgroundColor: colorPoints,
      borderColor: isFinalProfitPositive ? '#36A2EB' : '#FF6384',
      // Add running totals for tooltips
      runningTotals
    };
  };

  /**
   * Calculate statistics about performance
   */
  const calculateStats = () => {
    if (!performanceData || performanceData.length === 0) {
      return {
        winningStreak: [],
        losingStreak: [],
        biggestWin: null,
        biggestLoss: null
      };
    }

    let currentWinStreak = [];
    let currentLoseStreak = [];
    let longestWinStreak = [];
    let longestLoseStreak = [];
    let biggestWin = null;
    let biggestLoss = null;

    // Sort sessions by date
    const sortedSessions = [...performanceData].sort((a, b) => 
      new Date(a.sessionDate) - new Date(b.sessionDate)
    );

    // Calculate streaks and biggest wins/losses
    sortedSessions.forEach(session => {
      // Update biggest win/loss
      if (!biggestWin || session.profit > biggestWin.profit) {
        biggestWin = session;
      }
      if (!biggestLoss || session.profit < biggestLoss.profit) {
        biggestLoss = session;
      }

      // Calculate streaks
      if (session.profit > 0) {
        if (currentLoseStreak.length > longestLoseStreak.length) {
          longestLoseStreak = [...currentLoseStreak];
        }
        currentLoseStreak = [];
        currentWinStreak.push(session);
      } else if (session.profit < 0) {
        if (currentWinStreak.length > longestWinStreak.length) {
          longestWinStreak = [...currentWinStreak];
        }
        currentWinStreak = [];
        currentLoseStreak.push(session);
      }
    });

    // Check final streaks
    if (currentWinStreak.length > longestWinStreak.length) {
      longestWinStreak = currentWinStreak;
    }
    if (currentLoseStreak.length > longestLoseStreak.length) {
      longestLoseStreak = currentLoseStreak;
    }

    return {
      winningStreak: longestWinStreak,
      losingStreak: longestLoseStreak,
      biggestWin,
      biggestLoss
    };
  };

  /**
   * Calculate total profit for a streak
   */
  const calculateStreakProfit = (sessions) => {
    return sessions.reduce((total, session) => total + session.profit, 0);
  };

  /**
   * Fetches performance data for the current user
   */
  const fetchPerformanceData = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getPlayerPerformanceHistory(currentUser.uid);
      
      // Sort by date (most recent first), and then by createdAt (most recent first)
      const sortedData = data.sort((a, b) => {
        // First compare dates
        const dateA = new Date(a.sessionDate).setHours(0, 0, 0, 0);
        const dateB = new Date(b.sessionDate).setHours(0, 0, 0, 0);
        
        if (dateB !== dateA) {
          return dateB - dateA;
        }
        
        // If dates are the same, sort by createdAt (most recent first)
        // Use timestamps for comparison, defaulting to 0 if createdAt doesn't exist
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      
      setPerformanceData(sortedData);
    } catch (error) {
      console.error('Error fetching performance data:', error);
      setError('Failed to load performance data. Please try again later.');
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format date string to readable format
   */
  const formatDate = (dateString) => {
    // Create a date object and keep it in local timezone
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };

  /**
   * Format date for input fields
   */
  const formatDateForInput = (dateString) => {
    // Create a date object and keep it in local timezone
    const date = new Date(dateString);
    return format(date, 'yyyy-MM-dd');
  };

  /**
   * Format date for storage
   */
  const formatDateForStorage = (dateString) => {
    // Create a date object in local timezone
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    // Set the time to noon to avoid any timezone issues
    date.setHours(12, 0, 0, 0);
    return date.toISOString();
  };

  /**
   * Initialize new session data with default values
   */
  const getDefaultNewSessionData = () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
    return {
      sessionName: '',
      playerName: '',
      sessionDate: format(today, 'yyyy-MM-dd'),
      buyIn: '',
      cashOut: '',
      denomination: 'dollars'
    };
  };

  /**
   * Format money value for display (always in whole dollars)
   */
  const formatMoney = (amount) => {
    // Convert cents to dollars and format to two decimal places
    return (amount / 100).toFixed(2);
  };

  /**
   * Convert display dollars to storage cents
   */
  const displayDollarsToCents = (dollars) => {
    if (!dollars) return 0;
    // Convert dollars (float/string) to cents (integer) for storage
    // Round to whole dollars (no cents)
    return Math.round(parseFloat(dollars)) * 100;
  };

  /**
   * Calculate total profit/loss
   */
  const calculateTotalProfit = () => {
    return performanceData.reduce((total, session) => total + session.profit, 0);
  };

  /**
   * Calculate total buy-in
   */
  const calculateTotalBuyIn = () => {
    return performanceData.reduce((total, session) => total + session.buyIn, 0);
  };

  /**
   * Calculate total cash-out
   */
  const calculateTotalCashOut = () => {
    return performanceData.reduce((total, session) => total + session.cashOut, 0);
  };

  /**
   * Handle input change for editable row
   */
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;
    
    // Parse numeric values
    if (name === 'buyIn' || name === 'cashOut') {
      parsedValue = parseFloat(value) || 0;
    }
    
    setEditFormData({
      ...editFormData,
      [name]: parsedValue
    });
  };

  /**
   * Handle input change for new session
   */
  const handleNewSessionInputChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;
    
    // Parse numeric values
    if (name === 'buyIn' || name === 'cashOut') {
      parsedValue = parseFloat(value) || 0;
    }
    
    setNewSessionData({
      ...newSessionData,
      [name]: parsedValue
    });
  };

  /**
   * Handle clicking on a session to edit
   */
  const handleEditClick = (session) => {
    // Don't allow editing if already editing another row
    if (editingRow) {
      toast.info('Please finish current edit before starting another');
      return;
    }
    
    setEditingRow(session._id);
    
    // Convert date format for the input field
    const formattedDate = formatDateForInput(session.sessionDate);
    
    // Display values in dollars (no longer need to convert based on denomination)
    const displayBuyIn = formatMoney(session.buyIn);
    const displayCashOut = formatMoney(session.cashOut);
    
    setEditFormData({
      sessionName: session.sessionName || '',
      playerName: session.playerName || '',
      sessionDate: formattedDate,
      buyIn: displayBuyIn,
      cashOut: displayCashOut,
      denomination: 'dollars'
    });
  };

  /**
   * Handle canceling an edit
   */
  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditFormData({});
  };

  /**
   * Save edited performance record
   */
  const handleSaveEdit = async (performanceId) => {
    try {
      if (!editFormData.playerName) {
        toast.error('Player name is required');
        return;
      }
      
      if (editFormData.buyIn === '' || editFormData.cashOut === '') {
        toast.error('Buy-in and cash-out values are required');
        return;
      }
      
      setLoading(true);
      
      // Format date for storage
      const storedDate = formatDateForStorage(editFormData.sessionDate);
      
      // Process monetary values correctly - keeping in whole dollars
      const buyIn = displayDollarsToCents(parseFloat(editFormData.buyIn) || 0);
      const cashOut = displayDollarsToCents(parseFloat(editFormData.cashOut) || 0);
      
      // Calculate profit (in cents)
      const profit = cashOut - buyIn;
      
      const updatedData = {
        sessionName: editFormData.sessionName,
        playerName: editFormData.playerName,
        sessionDate: storedDate,
        buyIn: buyIn,
        cashOut: cashOut,
        profit: profit,
        denomination: 'dollars' // Always dollars
      };
      
      await updatePlayerPerformance(performanceId, updatedData);
      
      // Update local state to reflect changes
      setPerformanceData(prevData => 
        prevData.map(item => 
          item._id === performanceId 
            ? { ...item, ...updatedData } 
            : item
        )
      );
      
      toast.success('Session updated successfully');
      setEditingRow(null);
      setEditFormData({});
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error('Failed to update session');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle selecting/deselecting sessions for bulk deletion
   */
  const handleSessionSelect = (performanceId) => {
    setSelectedSessions(prev => {
      if (prev.includes(performanceId)) {
        return prev.filter(id => id !== performanceId);
      } else {
        return [...prev, performanceId];
      }
    });
  };

  /**
   * Open modal for bulk deletion
   */
  const handleOpenMultiDeleteModal = () => {
    if (selectedSessions.length === 0) {
      toast.info('Please select sessions to delete');
      return;
    }
    setIsMultiDeleteModalOpen(true);
  };

  /**
   * Handle bulk deletion of selected sessions
   */
  const handleConfirmMultiDelete = async () => {
    try {
      setLoading(true);
      
      // Delete each selected session
      for (const performanceId of selectedSessions) {
        await deletePlayerPerformance(performanceId);
      }
      
      // Remove deleted sessions from state
      setPerformanceData(prevData => 
        prevData.filter(item => !selectedSessions.includes(item._id))
      );
      
      // Clear selection
      setSelectedSessions([]);
      setIsMultiDeleteModalOpen(false);
      
      toast.success(`Successfully deleted ${selectedSessions.length} sessions`);
    } catch (error) {
      console.error('Error deleting sessions:', error);
      toast.error('Failed to delete some sessions');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle deletion of a single session
   */
  const handleConfirmDelete = async () => {
    if (!performanceToDelete) return;
    
    try {
      setLoading(true);
      await deletePlayerPerformance(performanceToDelete._id);
      
      // Remove deleted session from state
      setPerformanceData(prevData => 
        prevData.filter(item => item._id !== performanceToDelete._id)
      );
      
      setIsDeleteModalOpen(false);
      setPerformanceToDelete(null);
      
      toast.success('Session deleted successfully');
      
      // Don't exit edit mode after deletion
      // This line was previously here, but we're removing it
      // setIsGlobalEditMode(false);
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Open add session modal
   */
  const handleOpenAddModal = () => {
    setNewSessionData(getDefaultNewSessionData());
    setIsAddModalOpen(true);
  };

  /**
   * Handle adding a new session
   */
  const handleAddSession = async () => {
    try {
      if (!newSessionData.playerName) {
        toast.error('Player name is required');
        return;
      }
      
      if (newSessionData.buyIn === '' || newSessionData.cashOut === '') {
        toast.error('Buy-in and cash-out values are required');
        return;
      }
      
      setLoading(true);
      
      // Format date for storage (to avoid timezone issues)
      const storedDate = formatDateForStorage(newSessionData.sessionDate);
      
      // Process monetary values to store as cents (whole dollars * 100)
      const buyIn = displayDollarsToCents(parseFloat(newSessionData.buyIn) || 0);
      const cashOut = displayDollarsToCents(parseFloat(newSessionData.cashOut) || 0);
      
      // Calculate profit
      const profit = cashOut - buyIn;
      
      // Create performance data object for API
      const performanceData = {
        firebaseUid: currentUser.uid,
        sessionName: newSessionData.sessionName,
        playerName: newSessionData.playerName,
        sessionDate: storedDate,
        buyIn,
        cashOut,
        profit,
        isManualEntry: true,
        denomination: 'dollars',
        createdAt: new Date().toISOString() // Add creation timestamp
      };
      
      // Call API to add session
      await trackPlayerPerformance(performanceData);
      
      toast.success('Session added successfully');
      setIsAddModalOpen(false);
      
      // Reset form data
      setNewSessionData(getDefaultNewSessionData());
      
      // Refresh performance data
      await fetchPerformanceData();
    } catch (error) {
      console.error('Error adding session:', error);
      toast.error('Failed to add session');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Display the chart
   */
  const displayChart = () => {
    if (!performanceData || performanceData.length === 0) {
      return (
        <div className="text-center p-8 bg-base-200 rounded-lg">
          <p>No performance data available. Add a session to see your chart.</p>
        </div>
      );
    }

    return <Dashboard performanceData={performanceData} />;
  };

  /**
   * Renders the loading state
   */
  if (loading) {
    return (
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageTransitionVariants}
        className="min-h-screen bg-gradient-to-b from-base-100 via-base-100/50 to-base-200/30 flex justify-center items-center"
      >
        <div className="loader">Loading...</div>
      </motion.div>
    );
  }

  /**
   * Renders when user is not logged in
   */
  if (!currentUser) {
    return (
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageTransitionVariants}
        className="min-h-screen bg-gradient-to-b from-base-100 via-base-100/50 to-base-200/30 flex items-center justify-center"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Performance Tracking</h2>
          <p className="mb-4">Please sign in to view your performance history.</p>
        </div>
      </motion.div>
    );
  }

  /**
   * Renders when there's an error
   */
  if (error) {
    return (
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageTransitionVariants}
        className="min-h-screen bg-gradient-to-b from-base-100 via-base-100/50 to-base-200/30 flex items-center justify-center"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Performance Tracking</h2>
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            className="btn btn-primary" 
            onClick={fetchPerformanceData}
          >
            Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransitionVariants}
      className="min-h-screen bg-gradient-to-b from-base-100 via-base-100/50 to-base-200/30"
    >
      {/* Background Elements - Make them more subtle and stable */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-40 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-secondary/5 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-accent/5 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="container mx-auto px-4 pt-32 pb-32 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Hero Section with Stats */}
          <div className="mb-12">
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Your Poker Journey
              </h1>
              <p className="text-lg opacity-80 max-w-2xl mx-auto">
                Track your bankroll, analyze your performance, and improve your game.
              </p>
            </motion.div>
          
            {/* Stats Cards */}
          <motion.div 
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
              <motion.div 
                variants={itemVariants} 
                className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200 hover:border-primary/50 transition-all duration-300"
                whileHover={{ y: -5 }}
              >
              <div className="card-body">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium opacity-70">Total Buy In</h3>
                      <p className="text-2xl font-bold">${formatMoney(calculateTotalBuyIn())}</p>
                    </div>
                  </div>
              </div>
            </motion.div>
            
              <motion.div 
                variants={itemVariants} 
                className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200 hover:border-secondary/50 transition-all duration-300"
                whileHover={{ y: -5 }}
              >
              <div className="card-body">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium opacity-70">Total Cash Out</h3>
                      <p className="text-2xl font-bold">${formatMoney(calculateTotalCashOut())}</p>
                    </div>
                  </div>
              </div>
            </motion.div>
            
              <motion.div 
                variants={itemVariants} 
                className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200 hover:border-accent/50 transition-all duration-300"
                whileHover={{ y: -5 }}
              >
              <div className="card-body">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium opacity-70">Current Bankroll</h3>
                      <p className={`text-2xl font-bold ${calculateTotalProfit() >= 0 ? 'text-success' : 'text-error'}`}>
                  ${formatMoney(calculateTotalProfit())}
                </p>
                    </div>
                  </div>
              </div>
            </motion.div>
          </motion.div>
          </div>

          {/* Performance Chart Section */}
          {performanceData.length > 0 && (
            <motion.div 
              variants={itemVariants}
              className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200 mb-8 overflow-hidden"
            >
              <div className="card-body p-6">
                <div className="w-full" style={{ minHeight: "600px" }}>
                  {displayChart()}
                </div>
              </div>
            </motion.div>
          )}

          {/* Main Action Buttons Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Add Session */}
              <motion.button
                onClick={handleOpenAddModal}
                className="group relative flex flex-col items-center gap-4 p-6 rounded-2xl bg-primary/10 hover:bg-primary/20 transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-primary/20 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
            </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-1">Add Session</h3>
                  <p className="text-sm opacity-70">Track a new session</p>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </motion.button>

              {/* Edit Sessions */}
              <motion.button
                onClick={() => {
                  setIsGlobalEditMode(!isGlobalEditMode);
                  if (isGlobalEditMode) {
                    setEditingRow(null);
                    setEditFormData({});
                  }
                }}
                className="group relative flex flex-col items-center gap-4 p-6 rounded-2xl bg-secondary/10 hover:bg-secondary/20 transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-secondary/20 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-1">{isGlobalEditMode ? 'Save Changes' : 'Edit Sessions'}</h3>
                  <p className="text-sm opacity-70">{isGlobalEditMode ? 'Save your edits' : 'Modify existing sessions'}</p>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-secondary scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </motion.button>
            </div>
          </div>

          {/* Session History Section with Integrated Actions */}
          {performanceData.length > 0 ? (
            <motion.div 
              variants={itemVariants}
              className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200"
            >
              <div className="card-body p-6">
                {/* Header with Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
                  
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Session History
                </h2>
                  {isGlobalEditMode && selectedSessions.length > 0 && (
                    <button 
                      className="btn btn-error btn-sm gap-2" 
                      onClick={handleOpenMultiDeleteModal}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Selected ({selectedSessions.length})
                    </button>
                  )}
                </div>

                {/* Edit Mode Instruction */}
                {isGlobalEditMode && !editingRow && (
                  <div className="alert alert-info mb-4 shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div>
                      <h3 className="font-bold">Edit Mode Active</h3>
                      <div className="text-sm">Select sessions to edit or delete by clicking on their rows.</div>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto overflow-y-visible">
                  <div className="min-w-full inline-block align-middle">
                    <div className="overflow-hidden">
                  <table className="table w-full">
                    <thead>
                          <tr className="bg-base-200/50">
                        {isGlobalEditMode && (
                              <th className="w-16">
                            <label>
                              <input
                                type="checkbox"
                                className="checkbox"
                                checked={selectedSessions.length === performanceData.length}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSessions(performanceData.map(item => item._id));
                                  } else {
                                    setSelectedSessions([]);
                                  }
                                }}
                              />
                            </label>
                          </th>
                        )}
                        <th>Date</th>
                        <th>Session</th>
                        <th>Player</th>
                            <th className="text-right">Buy-in</th>
                            <th className="text-right">Cash-out</th>
                            <th className="text-right">Profit/Loss</th>
                            {isGlobalEditMode && <th className="w-24">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                          {performanceData.map(session => (
                            <motion.tr 
                              key={session._id} 
                              className={`hover:bg-base-200/50 transition-colors ${editingRow === session._id ? 'bg-base-200/70' : ''}`}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              whileHover={{ scale: 1.01 }}
                              transition={{ duration: 0.2 }}
                            >
                              {isGlobalEditMode && (
                                <td>
                                  <label>
                                    <input
                                      type="checkbox"
                                      className="checkbox"
                                      checked={selectedSessions.includes(session._id)}
                                      onChange={() => handleSessionSelect(session._id)}
                                    />
                                  </label>
                                </td>
                              )}
                              <td className="font-medium">
                                {editingRow === session._id ? (
                            <input
                              type="date"
                              name="sessionDate"
                              value={editFormData.sessionDate}
                              onChange={handleEditInputChange}
                                    className="input input-bordered input-sm w-full"
                            />
                                ) : formatDate(session.sessionDate)}
                          </td>
                          <td>
                                {editingRow === session._id ? (
                            <input
                              type="text"
                              name="sessionName"
                              value={editFormData.sessionName}
                              onChange={handleEditInputChange}
                                    className="input input-bordered input-sm w-full"
                                    placeholder="Enter session name"
                            />
                                ) : (session.sessionName || 'Unnamed Game')}
                          </td>
                          <td>
                                {editingRow === session._id ? (
                            <input
                              type="text"
                              name="playerName"
                              value={editFormData.playerName}
                              onChange={handleEditInputChange}
                                    className="input input-bordered input-sm w-full"
                                    placeholder="Enter player name"
                            />
                                ) : session.playerName}
                          </td>
                              <td className="text-right">
                                {editingRow === session._id ? (
                            <input
                              type="number"
                              name="buyIn"
                              value={editFormData.buyIn}
                              onChange={handleEditInputChange}
                                    className="input input-bordered input-sm w-full text-right"
                                    step="1"
                              min="0"
                            />
                                ) : `$${formatMoney(session.buyIn)}`}
                          </td>
                              <td className="text-right">
                                {editingRow === session._id ? (
                            <input
                              type="number"
                              name="cashOut"
                              value={editFormData.cashOut}
                              onChange={handleEditInputChange}
                                    className="input input-bordered input-sm w-full text-right"
                                    step="1"
                              min="0"
                            />
                                ) : `$${formatMoney(session.cashOut)}`}
                          </td>
                              <td className={`text-right font-semibold ${session.profit >= 0 ? 'text-success' : 'text-error'}`}>
                                ${formatMoney(session.profit)}
                          </td>
                              {isGlobalEditMode && !editingRow && (
                                <td>
                                  <div className="flex gap-2 justify-end">
                              <button 
                                className="btn btn-ghost btn-xs"
                                      onClick={() => handleEditClick(session)}
                              >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                      </svg>
                              </button>
                            </div>
                            </td>
                          )}
                              {editingRow === session._id && (
                                <td>
                                  <div className="flex gap-2 justify-end">
                              <button
                                      className="btn btn-ghost btn-xs"
                                      onClick={handleCancelEdit}
                              >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                              </button>
                                    <button
                                      className="btn btn-ghost btn-xs"
                                      onClick={() => handleSaveEdit(session._id)}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                      </svg>
                                    </button>
                                  </div>
                            </td>
                          )}
                            </motion.tr>
                      ))}
                        </tbody>
                        <tfoot className="border-t-2 border-base-200">
                      <tr className="font-bold">
                        {isGlobalEditMode && <td></td>}
                        <td colSpan={3}>Totals</td>
                            <td className="text-right">${formatMoney(calculateTotalBuyIn())}</td>
                            <td className="text-right">${formatMoney(calculateTotalCashOut())}</td>
                            <td className={`text-right ${calculateTotalProfit() >= 0 ? 'text-success' : 'text-error'}`}>
                          ${formatMoney(calculateTotalProfit())}
                        </td>
                        {isGlobalEditMode && <td></td>}
                      </tr>
                        </tfoot>
                  </table>
                </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              variants={itemVariants}
              className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200"
            >
              <div className="card-body p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Start Tracking Your Performance</h3>
                  <p className="text-base-content/70 mb-8">
                    Add your first poker session to begin tracking your progress and analyzing your results.
                  </p>
                    <button 
                    className="btn btn-primary btn-lg gap-2"
                    onClick={handleOpenAddModal}
                  >
                    Add Your First Session
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    </button>
                  </div>
              </div>
            </motion.div>
          )}
          

          
          {/* Add Session Modal */}
          {isAddModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
              <div className="bg-base-100 p-6 rounded-lg w-11/12 max-w-md">
                <h3 className="text-lg font-bold mb-4">Add New Session</h3>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Session Name</span>
                  </label>
                  <input
                    type="text"
                    name="sessionName"
                    value={newSessionData.sessionName}
                    onChange={handleNewSessionInputChange}
                    placeholder="Enter session name"
                    className="input input-bordered w-full"
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Player Name</span>
                  </label>
                  <input
                    type="text"
                    name="playerName"
                    value={newSessionData.playerName}
                    onChange={handleNewSessionInputChange}
                    placeholder="Enter player name"
                    className="input input-bordered w-full"
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Session Date</span>
                  </label>
                  <input
                    type="date"
                    name="sessionDate"
                    value={newSessionData.sessionDate}
                    onChange={handleNewSessionInputChange}
                    className="input input-bordered w-full"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">
                        Buy-in Amount (in dollars)
                      </span>
                    </label>
                    <div className="input-group">
                      <span>$</span>
                      <input
                        type="number"
                        name="buyIn"
                        value={newSessionData.buyIn}
                        onChange={handleNewSessionInputChange}
                        placeholder="0"
                        className="input input-bordered w-full"
                        step="1"
                        min="0"
                      />
                    </div>
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">
                        Cash-out Amount (in dollars)
                      </span>
                    </label>
                    <div className="input-group">
                      <span>$</span>
                      <input
                        type="number"
                        name="cashOut"
                        value={newSessionData.cashOut}
                        onChange={handleNewSessionInputChange}
                        placeholder="0"
                        className="input input-bordered w-full"
                        step="1"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Profit/Loss Preview */}
                {(newSessionData.buyIn !== '' && newSessionData.cashOut !== '') && (
                  <div className="mt-4 p-3 bg-base-200 rounded-lg">
                    <div className="font-semibold">Profit/Loss Preview:</div>
                    <div className={`text-lg font-bold ${parseFloat(newSessionData.cashOut || 0) - parseFloat(newSessionData.buyIn || 0) >= 0 ? 'text-success' : 'text-error'}`}>
                      ${(parseFloat(newSessionData.cashOut || 0) - parseFloat(newSessionData.buyIn || 0)).toFixed(2)}
                    </div>
                  </div>
                )}
                
                <div className="modal-action mt-6">
                  <button 
                    className="btn" 
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleAddSession}
                    disabled={loading || !newSessionData.playerName || newSessionData.buyIn === '' || newSessionData.cashOut === ''}
                  >
                    {loading ? <span className="loading loading-spinner"></span> : 'Add Session'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Delete Confirmation Modal */}
          {isDeleteModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
              <div className="bg-base-100 p-6 rounded-lg w-11/12 max-w-md">
                <h3 className="text-lg font-bold mb-4">Confirm Deletion</h3>
                <p>Are you sure you want to delete this session?</p>
                {performanceToDelete && (
                  <p className="my-4 p-3 bg-base-200 rounded-lg">
                    <span className="font-semibold">{performanceToDelete.sessionName || 'Unnamed Game'}</span> 
                    <br />
                    <span className="text-sm opacity-80">{formatDate(performanceToDelete.sessionDate)}</span>
                    <br />
                    <span className="font-semibold">Profit/Loss:</span> <span className={performanceToDelete.profit >= 0 ? 'text-success' : 'text-error'}>
                      ${formatMoney(performanceToDelete.profit)}
                    </span>
                  </p>
                )}
                <div className="flex justify-end gap-2 mt-2">
                  <button 
                    className="btn btn-ghost" 
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setPerformanceToDelete(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-error" 
                    onClick={handleConfirmDelete}
                    disabled={loading}
                  >
                    {loading ? <span className="loading loading-spinner"></span> : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Multi-Delete Confirmation Modal */}
          {isMultiDeleteModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
              <div className="bg-base-100 p-6 rounded-lg w-11/12 max-w-md">
                <h3 className="text-lg font-bold mb-4">Confirm Multiple Deletion</h3>
                <p>Are you sure you want to delete {selectedSessions.length} selected sessions?</p>
                <p className="mt-2 text-warning">This action cannot be undone.</p>
                
                <div className="flex justify-end gap-2 mt-6">
                  <button 
                    className="btn btn-ghost" 
                    onClick={() => setIsMultiDeleteModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-error" 
                    onClick={handleConfirmMultiDelete}
                    disabled={loading}
                  >
                    {loading ? <span className="loading loading-spinner"></span> : `Delete ${selectedSessions.length} Sessions`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Sticky Action Bar */}
      {performanceData.length > 0 && (
        <motion.div 
          className="fixed bottom-0 left-0 right-0 bg-base-100/95 backdrop-blur-lg border-t border-base-200 shadow-lg z-50"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="container mx-auto px-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {/* Add Session */}
              <motion.button
                onClick={handleOpenAddModal}
                className="btn btn-primary gap-2 w-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Session
              </motion.button>

              {/* Edit Sessions */}
              <motion.button
                onClick={() => {
                  setIsGlobalEditMode(!isGlobalEditMode);
                  if (isGlobalEditMode) {
                    setEditingRow(null);
                    setEditFormData({});
                  }
                }}
                className={`btn gap-2 w-full ${isGlobalEditMode ? 'btn-secondary' : 'btn-outline'}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {isGlobalEditMode ? 'Save Changes' : 'Edit Sessions'}
              </motion.button>

              {/* Delete Selected Button (Only shows when sessions are selected) */}
              {isGlobalEditMode && selectedSessions.length > 0 && (
                <motion.button
                  onClick={handleOpenMultiDeleteModal}
                  className="btn btn-error gap-2 w-full sm:col-span-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Selected ({selectedSessions.length})
                </motion.button>
              )}
            </div>
      </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Bankroll; 