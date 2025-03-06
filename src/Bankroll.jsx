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
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import { pageTransitionVariants, containerVariants, itemVariants } from './animations/pageTransitions';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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
        biggestWin: null,
        biggestLoss: null,
        winningStreak: [],
        losingStreak: []
      };
    }

    // Sort sessions by date
    const sortedSessions = [...performanceData].sort(
      (a, b) => new Date(a.sessionDate) - new Date(b.sessionDate)
    );

    // Find biggest win and loss
    let biggestWin = sortedSessions.reduce(
      (max, session) => (!max || session.profit > max.profit) ? session : max, 
      null
    );
    
    let biggestLoss = sortedSessions.reduce(
      (min, session) => (!min || session.profit < min.profit) ? session : min, 
      null
    );

    // If all sessions are wins or all are losses, handle appropriately
    if (biggestLoss && biggestLoss.profit >= 0) biggestLoss = null;
    if (biggestWin && biggestWin.profit <= 0) biggestWin = null;

    // Calculate winning and losing streaks
    let currentWinStreak = [];
    let currentLossStreak = [];
    let longestWinStreak = [];
    let longestLossStreak = [];

    // Find streaks
    for (const session of sortedSessions) {
      // If this is a winning session
      if (session.profit > 0) {
        // Add to current win streak
        currentWinStreak.push(session);
        // If we had a loss streak, check if it's the longest
        if (currentLossStreak.length > longestLossStreak.length) {
          longestLossStreak = [...currentLossStreak];
        }
        // Reset loss streak
        currentLossStreak = [];
      } 
      // If this is a losing session
      else if (session.profit < 0) {
        // Add to current loss streak
        currentLossStreak.push(session);
        // If we had a win streak, check if it's the longest
        if (currentWinStreak.length > longestWinStreak.length) {
          longestWinStreak = [...currentWinStreak];
        }
        // Reset win streak
        currentWinStreak = [];
      }
      // If profit is exactly 0, don't affect streaks
    }

    // Check final streaks
    if (currentWinStreak.length > longestWinStreak.length) {
      longestWinStreak = [...currentWinStreak];
    }
    if (currentLossStreak.length > longestLossStreak.length) {
      longestLossStreak = [...currentLossStreak];
    }

    return {
      biggestWin,
      biggestLoss,
      winningStreak: longestWinStreak,
      losingStreak: longestLossStreak
    };
  };

  /**
   * Calculate total profit for a streak
   */
  const calculateStreakProfit = (streak) => {
    if (!streak || streak.length === 0) return 0;
    return streak.reduce((sum, session) => sum + session.profit, 0);
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

    const chartData = prepareChartData();
    const stats = calculateStats();
    
    return (
      <div className="mb-8">
        <div className="mb-8 p-6 bg-base-200 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Performance Over Time</h3>
          <div className="h-64 md:h-80">
            <Line
              data={{
                labels: chartData.labels,
                datasets: [
                  {
                    label: 'Profit/Loss ($)',
                    data: chartData.data,
                    borderColor: chartData.borderColor,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderWidth: 2,
                    pointBackgroundColor: chartData.backgroundColor,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.3,
                    fill: true
                  }
                ]
              }}
              options={{
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const runningTotal = chartData.runningTotals[context.dataIndex];
                        return [
                          `Session: ${runningTotal.sessionName}`,
                          `Profit: $${formatMoney(runningTotal.profit)}`,
                          `Total: $${formatMoney(runningTotal.runningTotal)}`
                        ];
                      }
                    }
                  },
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    grid: {
                      color: 'rgba(200, 200, 200, 0.2)'
                    },
                    ticks: {
                      callback: (value) => `$${value.toFixed(2)}`
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    }
                  }
                }
              }}
            />
          </div>
        </div>
        
        {/* Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Best and Worst Session */}
          <div className="bg-base-200 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Best & Worst Sessions</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-success mb-2">Biggest Win</h4>
                {stats.biggestWin ? (
                  <div className="p-3 bg-base-300 rounded-lg">
                    <p className="font-bold text-success">
                      ${formatMoney(stats.biggestWin.profit)}
                    </p>
                    <p className="text-sm mt-1">
                      {stats.biggestWin.sessionName || 'Unnamed Game'}
                    </p>
                    <p className="text-xs opacity-70 mt-1">
                      {formatDate(stats.biggestWin.sessionDate)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm opacity-70">No winning sessions yet</p>
                )}
              </div>
              
              <div>
                <h4 className="font-semibold text-error mb-2">Biggest Loss</h4>
                {stats.biggestLoss ? (
                  <div className="p-3 bg-base-300 rounded-lg">
                    <p className="font-bold text-error">
                      ${formatMoney(stats.biggestLoss.profit)}
                    </p>
                    <p className="text-sm mt-1">
                      {stats.biggestLoss.sessionName || 'Unnamed Game'}
                    </p>
                    <p className="text-xs opacity-70 mt-1">
                      {formatDate(stats.biggestLoss.sessionDate)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm opacity-70">No losing sessions yet</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Winning and Losing Streaks */}
          <div className="bg-base-200 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Longest Streaks</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-success mb-2">Winning Streak</h4>
                {stats.winningStreak.length > 0 ? (
                  <div className="p-3 bg-base-300 rounded-lg">
                    <p className="font-bold">
                      {stats.winningStreak.length} session{stats.winningStreak.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-success font-semibold mt-1">
                      Total: ${formatMoney(calculateStreakProfit(stats.winningStreak))}
                    </p>
                    <p className="text-xs opacity-70 mt-1">
                      {formatDate(stats.winningStreak[0].sessionDate)} - {formatDate(stats.winningStreak[stats.winningStreak.length - 1].sessionDate)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm opacity-70">No winning streaks yet</p>
                )}
              </div>
              
              <div>
                <h4 className="font-semibold text-error mb-2">Losing Streak</h4>
                {stats.losingStreak.length > 0 ? (
                  <div className="p-3 bg-base-300 rounded-lg">
                    <p className="font-bold">
                      {stats.losingStreak.length} session{stats.losingStreak.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-error font-semibold mt-1">
                      Total: ${formatMoney(calculateStreakProfit(stats.losingStreak))}
                    </p>
                    <p className="text-xs opacity-70 mt-1">
                      {formatDate(stats.losingStreak[0].sessionDate)} - {formatDate(stats.losingStreak[stats.losingStreak.length - 1].sessionDate)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm opacity-70">No losing streaks yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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

      <div className="container mx-auto px-4 pt-32 pb-20 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex justify-between items-center mb-6">
            <motion.h2 
              variants={itemVariants}
              className="text-2xl font-bold"
            >
              Your Poker Performance
            </motion.h2>
            <motion.div 
              variants={itemVariants}
              className="flex gap-2"
            >
              <button 
                className="btn btn-primary"
                onClick={handleOpenAddModal}
              >
                Add Session
              </button>
              {performanceData.length > 0 && (
                <button 
                  className={`btn ${isGlobalEditMode ? 'btn-secondary' : 'btn-accent'}`}
                  onClick={() => {
                    setIsGlobalEditMode(!isGlobalEditMode);
                    if (isGlobalEditMode) {
                      setEditingRow(null);
                      setEditFormData({});
                    }
                  }}
                >
                  {isGlobalEditMode ? 'Save Changes' : 'Edit Sessions'}
                </button>
              )}
            </motion.div>
          </div>
          
          {/* Summary Cards */}
          <motion.div 
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <motion.div variants={itemVariants} className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Total Buy-in</h3>
                <p className="text-3xl font-bold">${formatMoney(calculateTotalBuyIn())}</p>
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Total Cash-out</h3>
                <p className="text-3xl font-bold">${formatMoney(calculateTotalCashOut())}</p>
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Total Profit/Loss</h3>
                <p className={`text-3xl font-bold ${calculateTotalProfit() >= 0 ? 'text-success' : 'text-error'}`}>
                  ${formatMoney(calculateTotalProfit())}
                </p>
              </div>
            </motion.div>
          </motion.div>
          
          {/* No Performance Data Yet */}
          {performanceData.length === 0 && (
            <div className="text-center p-8 mb-8 bg-base-200 rounded-lg">
              <h3 className="text-xl font-bold mb-4">No Performance Data Yet</h3>
              <p className="mb-4">Track your performance from the Saved Ledgers page or add a new session manually.</p>
              <button 
                className="btn btn-primary"
                onClick={handleOpenAddModal}
              >
                Add Your First Session
              </button>
            </div>
          )}
          
          {/* Performance Table */}
          {performanceData.length > 0 && (
            <div className="card bg-base-100 shadow-xl mb-8">
              <div className="card-body">
                <h3 className="card-title mb-4">Session History</h3>
                {/* Edit Mode Instruction */}
                {isGlobalEditMode && !editingRow && (
                  <div className="alert alert-info mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span>Select a session to edit by clicking on its row.</span>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        {isGlobalEditMode && (
                          <th>
                            <label>
                              <input
                                type="checkbox"
                                className="checkbox"
                                checked={selectedSessions.length === performanceData.length}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    // Select all
                                    setSelectedSessions(performanceData.map(item => item._id));
                                  } else {
                                    // Deselect all
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
                        <th>Buy-in</th>
                        <th>Cash-out</th>
                        <th>Profit/Loss</th>
                        {/* Only show actions column when in edit mode */}
                        {isGlobalEditMode && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {editingRow ? (
                        // Editing row UI
                        <tr>
                          {isGlobalEditMode && <td></td>}
                          <td>
                            <input
                              type="date"
                              name="sessionDate"
                              value={editFormData.sessionDate}
                              onChange={handleEditInputChange}
                              className="input input-bordered w-full"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              name="sessionName"
                              value={editFormData.sessionName}
                              onChange={handleEditInputChange}
                              placeholder="Session name"
                              className="input input-bordered w-full"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              name="playerName"
                              value={editFormData.playerName}
                              onChange={handleEditInputChange}
                              className="input input-bordered w-full"
                              placeholder="Player name"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              name="buyIn"
                              value={editFormData.buyIn}
                              onChange={handleEditInputChange}
                              className="input input-bordered w-full"
                              step="0.01"
                              min="0"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              name="cashOut"
                              value={editFormData.cashOut}
                              onChange={handleEditInputChange}
                              className="input input-bordered w-full"
                              step="0.01"
                              min="0"
                            />
                          </td>
                          <td className={`${editFormData.cashOut - editFormData.buyIn >= 0 ? 'text-success' : 'text-error'}`}>
                            ${editFormData.cashOut - editFormData.buyIn >= 0 ? (editFormData.cashOut - editFormData.buyIn).toFixed(2) : ((editFormData.cashOut - editFormData.buyIn) * -1).toFixed(2)}
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <button 
                                className="btn btn-primary btn-xs"
                                onClick={() => handleSaveEdit(editingRow)}
                              >
                                Save
                              </button>
                              <button 
                                className="btn btn-ghost btn-xs"
                                onClick={handleCancelEdit}
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                      
                      {/* Performance data rows */}
                      {performanceData.map(session => (
                        <tr key={session._id} className={editingRow === session._id ? 'bg-base-200' : ''}>
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
                          <td>{formatDate(session.sessionDate)}</td>
                          <td>{session.sessionName || 'Unnamed Game'}</td>
                          <td>{session.playerName}</td>
                          <td>${formatMoney(session.buyIn)}</td>
                          <td>${formatMoney(session.cashOut)}</td>
                          <td className={session.profit >= 0 ? 'text-success' : 'text-error'}>
                            ${formatMoney(session.profit)}
                          </td>
                          {/* Only show action buttons when in edit mode and actively editing a row */}
                          {isGlobalEditMode && !editingRow && (
                            <td>
                              <button
                                className="btn btn-xs btn-primary"
                                onClick={() => handleEditClick(session)}
                              >
                                Edit
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                      {/* Totals row */}
                      <tr className="font-bold">
                        {isGlobalEditMode && <td></td>}
                        <td colSpan={3}>Totals</td>
                        <td>${formatMoney(calculateTotalBuyIn())}</td>
                        <td>${formatMoney(calculateTotalCashOut())}</td>
                        <td className={calculateTotalProfit() >= 0 ? 'text-success' : 'text-error'}>
                          ${formatMoney(calculateTotalProfit())}
                        </td>
                        {isGlobalEditMode && <td></td>}
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                {/* Delete selected sessions button */}
                {isGlobalEditMode && selectedSessions.length > 0 && (
                  <div className="mt-4 flex justify-end">
                    <button 
                      className="btn btn-error" 
                      onClick={handleOpenMultiDeleteModal}
                    >
                      Delete Selected ({selectedSessions.length})
                    </button>
                  </div>
                )}
                
                {/* Edit Mode Controls */}
                {isGlobalEditMode && !editingRow && (
                  <div className="flex justify-end mt-4">
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setIsGlobalEditMode(false)}
                    >
                      Save
                    </button>
                  </div>
                )}
                
                {/* Edit Row Controls */}
                {editingRow && (
                  <div className="flex justify-end mt-4 gap-2">
                    <button 
                      className="btn btn-ghost"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleSaveEdit(editingRow)}
                      disabled={loading}
                    >
                      {loading ? <span className="loading loading-spinner"></span> : 'Save'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Performance chart and stats - moved to the bottom of the page */}
          {!loading && displayChart()}
          
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
    </motion.div>
  );
};

export default Bankroll; 