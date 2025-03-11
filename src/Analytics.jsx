// src/analytics.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from './contexts/AuthContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from './config/api';
import './index.css';

const Analytics = ({ setCurrentPage }) => {
  const { currentUser } = useAuth();
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [selectedPlayerTab, setSelectedPlayerTab] = useState(null);
  const [selectedChartTab, setSelectedChartTab] = useState('chart_3bet');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedView, setSelectedView] = useState(null);
  const [userStatus, setUserStatus] = useState(null);

  // Separate base URLs for different types of endpoints
  const herokuBase = import.meta.env.VITE_HEROKU; // Heroku for Python analysis backend

  // Add view navigation array
  const viewOrder = ['ranges', 'metrics', 'hands'];
  
  // Add navigation functions
  const navigateView = (direction) => {
    if (!selectedView) return;
    
    const currentIndex = viewOrder.indexOf(selectedView);
    if (currentIndex === -1) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % viewOrder.length;
    } else {
      newIndex = (currentIndex - 1 + viewOrder.length) % viewOrder.length;
    }
    
    setSelectedView(viewOrder[newIndex]);
  };

  // Sorting function
  const sortData = (data, key, direction) => {
    if (!data) return [];
    return [...data].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Handle sort click
  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Sort indicator component
  const SortIndicator = ({ column }) => {
    if (sortConfig.key !== column) return null;
    return (
      <span className="ml-1">
        {sortConfig.direction === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  // Reusable card coloring function
  const renderColoredCards = (cards) => {
    if (!cards) return <span className="opacity-25">Not Shown</span>;
    
    return cards.replace(/['\[\]]/g, '').split(',').map((card, i, arr) => {
      const trimmedCard = card.trim();
      const suit = trimmedCard.slice(-1);
      const isRedSuit = ['♥', '♦'].includes(suit);
      
      return (
        <span key={i} className={isRedSuit ? 'text-red-500' : ''}>
          {trimmedCard}{i < arr.length - 1 ? ' ' : ''}
        </span>
      );
    });
  };

  // Fetch analysis data with Heroku base
  useEffect(() => {
    const fetchAnalysis = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        //console.log('Fetching analysis data...');
        //console.log('API URL:', `${herokuBase}/api/analysis/${currentUser.uid}`);
        
        const response = await fetch(
          `${herokuBase}/api/analysis/${currentUser.uid}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            credentials: 'same-origin'
          }
        );
        
        //console.log('Response status:', response.status);
        
        const data = await response.json().catch(e => {
          console.error('Error parsing JSON:', e);
          return null;
        });
        
        //('API Response:', data);
        
        if (!response.ok) {
          throw new Error(
            (data && data.error) || 
            `API request failed with status ${response.status}`
          );
        }
        
        if (!data || !data.success || !data.data) {
          throw new Error('Invalid response format from API');
        }
        
        // Get the most recent analysis from the array
        const analyses = data.data.analysis;
        if (!analyses || !Array.isArray(analyses) || analyses.length === 0) {
          throw new Error('No analyses found');
        }
        
        // Sort analyses by timestamp in descending order and get the most recent
        const sortedAnalyses = analyses.sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        );
        const mostRecentAnalysis = sortedAnalyses[0];
        
        //console.log('Most recent analysis:', mostRecentAnalysis);
        
        // Validate the analysis data structure
        if (!mostRecentAnalysis.files || 
            !mostRecentAnalysis.files.charts || 
            !mostRecentAnalysis.files.hands) {
          throw new Error('Invalid analysis data structure');
        }
        
        // Set both the full data and the selected analysis
        setAnalysisData({
          ...data.data,
          analysis: sortedAnalyses // Store all analyses
        });
        setSelectedAnalysis(mostRecentAnalysis); // Set the most recent as selected
        
        // Set initial selected player from the first available player
        if (mostRecentAnalysis.files.players && 
            Object.keys(mostRecentAnalysis.files.players).length > 0) {
          const firstPlayer = Object.keys(mostRecentAnalysis.files.players)[0];
          setSelectedPlayerTab(firstPlayer.replace('.json', ''));
        }
        
      } catch (err) {
        console.error('Error fetching analysis:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
        setLoading(false); // Also set the other loading state
      }
    };

    if (currentUser) {
      fetchAnalysis();
    }
  }, [currentUser, herokuBase]);

  // Format date helper function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Player Card Component with enhanced design
  const PlayerCard = ({ player }) => {
    if (!player) return null;
    return (
      <div className="card bg-base-100/90 shadow-xl hover:shadow-2xl transition-all duration-300 backdrop-blur-sm border border-base-200">
        <div className="card-body p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-medium tracking-tight">{player.Player}</h3>
            <span className={`text-2xl font-medium tracking-tight text-center mx-auto ${
              player["Bet Level"].toLowerCase() === 'raise' 
                ? 'text/75' 
                : 'text-primary'
            }`}>
              {player["Bet Level"]}
            </span>
          </div>
          <div className="space-y-6">
            <div className="text-center py-4">
              <span className={`text-5xl font-bold bg-gradient-to-r ${
                // Normalize the amount between 0-1 based on min/max in the dataset
                (() => {
                  const amount = parseFloat(player["Preflop Amount"]);
                  // Hardcoded reasonable ranges since we don't have access to full dataset
                  const min = 2;    // Minimum expected amount
                  const max = 1000; // Maximum reasonable amount
                  const normalized = Math.min(1, Math.max(0, (amount - min) / (max - min)));
                  // More subtle, professional color gradients based on amount
                  if (normalized < 0.005) return 'from-slate-400 to-slate-500';  // Lowest amounts
                  if (normalized < 0.01) return 'from-slate-500 to-slate-600';   // Very low
                  if (normalized < 0.025) return 'from-slate-600 to-slate-700';  // Low
                  if (normalized < 0.05) return 'from-slate-700 to-slate-800';   // Medium-low
                  if (normalized < 0.1) return 'from-zinc-600 to-zinc-700';      // Medium
                  if (normalized < 0.25) return 'from-zinc-700 to-zinc-800';     // Medium-high
                  if (normalized < 0.5) return 'from-zinc-800 to-stone-800';     // High
                  if (normalized < 0.75) return 'from-stone-700 to-stone-800';   // Very high
                  return 'from-stone-800 to-stone-900';                          // Highest amounts
                })()
              } bg-clip-text text-transparent animate-gradient`}>
                ${player["Preflop Amount"]}
              </span>
            </div>
            <div className="text-center py-2 px-4 bg-base-200/50 rounded-xl backdrop-blur-sm">
              <p className="text-3xl font-medium tracking-tight">
                {renderColoredCards(player["Show Details"])}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Chart Card Component with enhanced design
  const ChartCard = ({ data }) => {
    if (!data) return null;

    // Safely access and format the data with defaults
    const playerName = data.Player || 'Unknown Player';
    const preflopAmount = data["Preflop Amount"] || '0';
    const showDetails = data["Show Details"] || 'No Details';
    
    if (playerName === 'Unknown Player') return null;
    return (
      <div className="card bg-base-100/90 shadow-xl hover:shadow-2xl transition-all duration-300 backdrop-blur-sm border border-base-200">
        <div className="card-body p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-medium tracking-tight text-center mx-auto">{playerName}</h3>
          </div>
          <div className="space-y-6">
            <div className="text-center py-4">
              <span className={`text-5xl font-bold bg-gradient-to-r ${
                // Normalize the amount between 0-1 based on min/max in the dataset
                (() => {
                  const amount = parseFloat(preflopAmount);
                  // Hardcoded reasonable ranges since we don't have access to full dataset
                  const min = 2;    // Minimum expected amount
                  const max = 1000; // Maximum reasonable amount
                  const normalized = Math.min(1, Math.max(0, (amount - min) / (max - min)));
                  
                  // More subtle, professional color gradients based on amount
                  if (normalized < 0.05) return 'from-slate-400 to-slate-500';   // Lowest amounts
                  if (normalized < 0.10) return 'from-slate-500 to-slate-600';   // Very low
                  if (normalized < 0.15) return 'from-slate-600 to-slate-700';   // Low
                  if (normalized < 0.20) return 'from-slate-700 to-slate-800';   // Medium-low
                  if (normalized < 0.25) return 'from-zinc-600 to-zinc-700';     // Medium
                  if (normalized < 0.5) return 'from-zinc-700 to-zinc-800';      // Medium-high
                  if (normalized < 0.75) return 'from-stone-700 to-stone-800';   // High
                  return 'from-stone-800 to-stone-900';                          // Highest amounts
                })()
              } bg-clip-text text-transparent animate-gradient`}>
                ${preflopAmount}
              </span>
            </div>
            <div className="text-center py-2 px-4 bg-base-200/50 rounded-xl backdrop-blur-sm">
              <p className="text-3xl font-medium tracking-tight">
                {renderColoredCards(showDetails)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Metrics Table Component
  const MetricsTable = ({ metrics }) => {
    const sortedMetrics = useMemo(() => {
      return sortData(metrics, sortConfig.key, sortConfig.direction);
    }, [metrics, sortConfig]);

    const columns = [
      { key: 'Player', label: 'Player' },
      { key: 'Hands Played', label: 'Hands' },
      { key: 'VPIP', label: 'VPIP' },
      { key: 'VPIP %', label: 'VPIP %' },
      { key: 'Threebet', label: '3Bet' },
      { key: 'Threebet %', label: '3Bet %' }
    ];

    return (
      <div className="overflow-x-auto">
        <table className="table table-lg w-full">
          <thead>
            <tr className="bg-base-200/50 backdrop-blur-sm">
              {columns.map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className="cursor-pointer hover:bg-base-300/50 transition-colors px-6 py-4"
                >
                  <div className="flex items-center">
                    <span className="text-base font-medium">{label}</span>
                    <SortIndicator column={key} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedMetrics?.map((metric, index) => (
              <tr key={index} className="hover:bg-base-200/30 transition-colors">
                <td className="px-6 py-4 font-medium">{metric.Player}</td>
                <td className="px-6 py-4">{metric["Hands Played"]}</td>
                <td className="px-6 py-4">{metric.VPIP}</td>
                <td className="px-6 py-4">{metric["VPIP %"]}%</td>
                <td className="px-6 py-4">{metric.Threebet}</td>
                <td className="px-6 py-4">{metric["Threebet %"]}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Enhanced Hands Table Component
  const HandsTable = ({ hands, title, playerName }) => {
    const sortedHands = useMemo(() => {
      return sortData(hands, sortConfig.key, sortConfig.direction);
    }, [hands, sortConfig]);

    const columns = [
      { key: 'Hand Number', label: 'Hand #' },
      { key: 'Player', label: 'Player' },
      { key: 'My Cards', label: 'Cards' },
      { key: 'Board', label: 'Board' }, // Combined board column
      { key: 'Opponent', label: 'Opponent' },
      { key: 'Invested', label: 'Invested' },
      { key: 'Collected', label: 'Collected' },
      { key: 'Net', label: 'Net' }
    ];

    return (
      <div className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200">
        <div className="card-body p-6">
          <h3 className="card-title text-2xl font-bold mb-6">{title}</h3>
          <div className="overflow-x-auto">
            <table className="table table-lg w-full">
              <thead>
                <tr className="bg-base-200/50 backdrop-blur-sm">
                  {columns.map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className="cursor-pointer hover:bg-base-300/50 transition-colors px-6 py-4"
                    >
                      <div className="flex items-center">
                        <span className="text-base font-medium">{label}</span>
                        <SortIndicator column={key} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedHands?.map((hand, index) => {
                  const net = parseFloat(hand.Collected) - parseFloat(hand.Invested);
                  // Get the most significant board state
                  const board = hand.River && hand.River !== "[]" ? hand.River :
                               hand.Turn && hand.Turn !== "[]" ? hand.Turn :
                               hand.Flop && hand.Flop !== "[]" ? hand.Flop : "Taken Down Preflop";
                               
                  const boardColored = board === "Taken Down Preflop" ? 
                    <span className="opacity-25">{board}</span> : 
                    renderColoredCards(board);
                               
                  return (
                    <tr key={index} className="hover:bg-base-200/30 transition-colors">
                      <td className="px-6 py-4">{hand["Hand Number"]}</td>
                      <td className="px-6 py-4 font-medium">{playerName}</td>
                      <td className="px-6 py-4 font-medium">
                        {renderColoredCards(hand["My Cards"])}
                      </td>
                      <td className="px-6 py-4">{boardColored}</td>
                      <td className="px-6 py-4">
                        {renderColoredCards(hand.Opponent)}
                      </td>
                      <td className="px-6 py-4">${parseFloat(hand.Invested).toFixed(2)}</td>
                      <td className="px-6 py-4">${parseFloat(hand.Collected).toFixed(2)}</td>
                      <td className={`px-6 py-4 font-medium ${net >= 0 ? 'text-success' : 'text-error'}`}>
                        ${net.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const AnalysisCard = ({ title, description, icon, type, isPremium }) => (
    <motion.div
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      className={`card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 border border-base-200 backdrop-blur-sm ${isPremium ? 'bg-emerald-500' : ''}`}
    >
      <div className="card-body p-8">
        <div className="mb-6 bg-primary/10 p-4 rounded-xl w-fit">
          {icon}
        </div>
        <h3 className="text-2xl font-bold mb-3">{title}</h3>
        <p className="opacity-80 mb-4">{description}</p>
        <div className="mt-auto">
          <button 
            onClick={() => setSelectedView(type)}
            className="btn btn-ghost text-primary btn-sm px-0 hover:bg-transparent hover:text-primary/80"
          >
            Analyze
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add user status fetch with API_URL
  useEffect(() => {
    const fetchUserStatus = async () => {
      if (!currentUser?.uid) return;
      
      try {
        console.log('Fetching user status from:', `${API_URL}/users/${currentUser.uid}/status`);
        const response = await fetch(
          `${API_URL}/users/${currentUser.uid}/status`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            credentials: 'include'
          }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch user status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('User Status Response:', data);
        
        setUserStatus(data);
      } catch (err) {
        console.error('Error fetching user status:', err);
      }
    };

    fetchUserStatus();
  }, [currentUser]);

  // Debug logging for user status
  useEffect(() => {
    console.log('Current User Status:', {
      uid: currentUser?.uid,
      userStatus,
      isPremium: userStatus?.isPremium,
      isTrialActive: userStatus?.isTrialActive,
      hasAccess: userStatus?.isPremium || userStatus?.isTrialActive
    });
  }, [currentUser, userStatus]);

  // Modify the premium content check to use userStatus
  const shouldShowPremiumContent = userStatus?.isPremium || userStatus?.isTrialActive;
  
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200/50 py-12 flex items-center justify-center">
        <div className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200 max-w-lg mx-4">
          <div className="card-body text-center p-8">
            <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
            <p className="opacity-70 mb-6">You need to be logged in to view analytics.</p>
            <button className="btn btn-primary" onClick={() => handlePageChange('login')}>
              Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200/50 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
          <p className="text-lg opacity-70">Loading your analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200/50 py-12 flex items-center justify-center">
        <div className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200 max-w-lg mx-4">
          <div className="card-body text-center p-8">
            <div className="text-error mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4">Error Loading Analysis</h2>
            <p className="opacity-70 mb-6">{error}</p>
            <button className="btn btn-primary" onClick={() => handlePageChange('fullLogUpload')}>
              Upload Hand History
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200/50 py-12 relative pt-96">
      {/* Background elements */}
      <div className="absolute top-40 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-secondary/5 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-accent/5 rounded-full blur-3xl"></div>
    
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Poker Analysis Dashboard
          </h1>
          
          {/* Analysis Selection Dropdown */}
          <div className="max-w-md mx-auto mb-8">
            <div className="dropdown w-full">
              <label tabIndex={0} className="btn btn-lg w-full">
                {selectedAnalysis ? 
                  selectedAnalysis.name || `Analysis from ${formatDate(selectedAnalysis.timestamp)}` : 
                  'Select Analysis'}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </label>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-200 rounded-box w-full max-h-96 overflow-y-auto">
                {analysisData?.analysis
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                  .map((analysis) => (
                    <li key={analysis.analysisId} className="mb-2">
                      <div className="flex items-center justify-between p-3 hover:bg-base-300 rounded-lg">
                        <button 
                          className="flex-1 text-left"
                          onClick={() => setSelectedAnalysis(analysis)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {analysis.name || `Analysis ${formatDate(analysis.timestamp)}`}
                            </span>
                            <span className="text-sm opacity-70">
                              {formatDate(analysis.timestamp)}
                            </span>
                          </div>
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
        
        <AnimatePresence mode="wait">
          {selectedAnalysis && !selectedView && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              <AnalysisCard
                title="Player Analysis Dashboard"
                description="Deep dive into individual players: view their preflop ranges, betting patterns, and detailed metrics all in one place."
                type="ranges"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
                isPremium={false}
              />

              <AnalysisCard
                title="Player Metrics"
                description="Track your VPIP, 3-bet%, and other key metrics to understand and improve your playing style."
                type="metrics"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                }
                isPremium={false}
              />

              <AnalysisCard
                title="Notable Hands"
                description="Review your biggest wins and losses to understand what situations are most profitable for you."
                type="hands"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                }
                isPremium={false}
              />

              {/* <AnalysisCard
                title="Chart Analysis"
                description="Explore different chart types including 3Bet, Raise, and Full Shows to understand betting patterns."
                type="charts"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                }
                isPremium={true}
              /> */}
            </motion.div>
          )}

          {selectedAnalysis && selectedView && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200 relative"
            >
              {/* Navigation Arrows */}
              <button 
                className="btn btn-circle btn-lg btn-ghost absolute top-1/2 -left-20 transform -translate-y-1/2 hidden md:flex items-center justify-center w-16 h-16 hover:bg-base-200/50"
                onClick={() => navigateView('prev')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                className="btn btn-circle btn-lg btn-ghost absolute top-1/2 -right-20 transform -translate-y-1/2 hidden md:flex items-center justify-center w-16 h-16 hover:bg-base-200/50"
                onClick={() => navigateView('next')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <div className="card-body p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold">
                    {selectedView === 'ranges' && 'Opponent Preflop Ranges'}
                    {selectedView === 'metrics' && 'Player Metrics'}
                    {selectedView === 'hands' && 'Notable Hands'}
                    {selectedView === 'charts' && 'Chart Analysis'}
                  </h2>
                  <button 
                    className="btn btn-ghost btn-circle"
                    onClick={() => setSelectedView(null)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Mobile Navigation (only visible on small screens) */}
                <div className="flex justify-between items-center mb-4 md:hidden">
                  <button 
                    className="btn btn-circle btn-ghost"
                    onClick={() => navigateView('prev')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button 
                    className="btn btn-circle btn-ghost"
                    onClick={() => navigateView('next')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                
                {selectedView === 'ranges' && (
                  <>
                    <div className="mb-8">
                      {/* Player Selection */}
                      <h3 className="text-lg font-medium mb-4 opacity-70">Select Player to Analyze</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {selectedAnalysis?.files.players && Object.keys(selectedAnalysis.files.players).map((player) => (
                          <button
                            key={player}
                            className={`btn btn-lg h-auto py-4 ${selectedPlayerTab === player.replace('.json', '') ? 'btn-primary' : 'btn-ghost'} w-full`}
                            onClick={() => setSelectedPlayerTab(player.replace('.json', ''))}
                          >
                            {player.replace('.json', '')}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {selectedPlayerTab && (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={selectedPlayerTab}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-8"
                        >
                          {/* Player Metrics Summary */}
                          {selectedAnalysis?.files.charts?.["player_metrics_chart.json"] && (
                            <div className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200">
                              <div className="card-body p-8">
                                <div className="flex items-center justify-between mb-6">
                                  <h3 className="card-title text-2xl">Player Performance Metrics</h3>
                                </div>
                                {selectedAnalysis.files.charts["player_metrics_chart.json"]
                                  .filter(metric => {
                                    const normalizedMetricPlayer = metric.Player.toLowerCase().replace(/\s+/g, '');
                                    const normalizedSelectedPlayer = selectedPlayerTab.toLowerCase().replace(/\s+/g, '');
                                    return normalizedMetricPlayer === normalizedSelectedPlayer && metric["Hands Played"] > 0;
                                  })
                                  .map((metric, index) => (
                                    <div key={index} className="flex justify-between gap-4">
                                      <div className="stat flex-1 bg-base-200/50 rounded-xl p-6 text-center">
                                        <div className="stat-title text-lg opacity-80">Hands Played</div>
                                        <div className="stat-value text-4xl text-primary">{metric["Hands Played"]}</div>
                                        <div className="stat-desc text-lg">Total Hands</div>
                                      </div>
                                      <div className="stat flex-1 bg-base-200/50 rounded-xl p-6 text-center">
                                        <div className="stat-title text-lg opacity-80">VPIP</div>
                                        <div className="stat-value text-4xl">{metric["VPIP %"]}%</div>
                                        <div className="stat-desc text-lg">{metric["VPIP"]} voluntary hands</div>
                          </div>
                        </div>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Player Range Analysis Section */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-xl font-medium">Range Analysis</h3>
                              <div className="text-sm opacity-70">
                                Showing first 12 preflop actions
                              </div>
                            </div>
                            
                            {/* Preflop Ranges Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              {selectedAnalysis?.files.players && 
                                selectedAnalysis.files.players[`${selectedPlayerTab}.json`]
                                  ?.filter(player => player)
                                  .slice(0, shouldShowPremiumContent ? undefined : 12)
                                  .map((player, index) => (
                                    <PlayerCard key={index} player={player} />
                                  ))}
                            </div>

                            {/* Premium/Trial Prompt - Only show if user has no access */}
                            {selectedAnalysis?.files.players && 
                             selectedAnalysis.files.players[`${selectedPlayerTab}.json`]?.length > 12 &&
                             !shouldShowPremiumContent && (
                              <div className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200 p-8 text-center mt-8">
                                <div className="text-warning mb-4">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                </div>
                                <h3 className="text-xl font-bold mb-2">
                                  See {selectedAnalysis.files.players[`${selectedPlayerTab}.json`].length - 12} More Preflop Actions
                                </h3>
                                <p className="text-base-content/70 mb-6">
                                  Start your free trial to unlock all preflop actions and get complete insights into player tendencies.
                                </p>
                                <div className="flex justify-center gap-4">
                                  <button 
                                    onClick={() => handlePageChange('payment')}
                                    className="btn btn-primary"
                                  >
                                    Start Free Trial
                                  </button>
                                </div>
                                <p className="text-sm text-base-content/70 mt-4">
                                  No credit card required • 14-day free trial • Cancel anytime
                                </p>
                              </div>
                            )}
                          </div>

                          {/* No Data Message */}
                          {(!selectedAnalysis?.files.players?.[`${selectedPlayerTab}.json`] ||
                            selectedAnalysis.files.players[`${selectedPlayerTab}.json`].length === 0) && (
                            <div className="text-center py-8">
                              <div className="text-warning mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                              <p className="text-lg opacity-70">No range data available for this player</p>
                        </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </>
                )}

                {selectedView === 'metrics' && (
                  <div>
                    {selectedAnalysis?.files.charts?.["player_metrics_chart.json"] ? (
                      <MetricsTable metrics={selectedAnalysis.files.charts["player_metrics_chart.json"]} />
                    ) : (
                      <p className="text-center text-base-content/70 py-8">No player metrics available</p>
                    )}
                  </div>
                )}

                {selectedView === 'hands' && (
                  <div className="space-y-8">
                    {selectedAnalysis?.files.hands && 
                     Object.keys(selectedAnalysis.files.hands).length > 0 ? (
                      (() => {
                        const playerName = Object.keys(selectedAnalysis.files.hands)
                          .find(key => key.endsWith('_top10_wins.json'))
                          ?.split('_')[0];

                        return (
                          <>
                            <HandsTable 
                              hands={selectedAnalysis.files.hands[`${playerName}_top10_wins.json`]}
                              title="Top Winning Hands" 
                              playerName={playerName}
                            />
                            <HandsTable 
                              hands={selectedAnalysis.files.hands[`${playerName}_top10_losses.json`]}
                              title="Top Losing Hands"
                              playerName={playerName}
                            />
                          </>
                        );
                      })()
                    ) : (
                      <div className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200">
                        <div className="card-body text-center py-8">
                          <div className="text-warning mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                          <p className="text-lg text-base-content/70">
                            No notable hands were found in your PokerNow CSV log. This could happen if no significant hands were played or if the log file was incomplete.
                          </p>
                </div>
              </div>
                    )}
                  </div>
                )}

                {selectedView === 'charts' && (
                  <>
                    <div className="flex flex-col md:flex-row gap-6 mb-8">
                      {/* Chart Type Selection */}
                      <div className="flex-1">
                        <h3 className="text-lg font-medium mb-4 opacity-70">Chart Type</h3>
                        <div className="flex flex-wrap gap-2">
                          <button
                            className={`btn ${selectedChartTab === 'chart_3bet' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setSelectedChartTab('chart_3bet')}
                          >
                            3Bet Chart
                          </button>
                          <button
                            className={`btn ${selectedChartTab === 'chart_raise' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setSelectedChartTab('chart_raise')}
                          >
                            Raise Chart
                          </button>
                          <button
                            className={`btn ${selectedChartTab === 'full_shows_chart' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setSelectedChartTab('full_shows_chart')}
                          >
                            Full Shows
                  </button>
                </div>
              </div>
            </div>
            
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedChartTab}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                      >
                        {selectedAnalysis?.files.charts && selectedChartTab && 
                          selectedAnalysis.files.charts[`${selectedChartTab}.json`]
                            ?.filter(chart => chart)
                            .map((chart, index) => (
                              <ChartCard key={index} data={chart} />
                            ))}
                      </motion.div>
                    </AnimatePresence>

                    {/* Add Premium Lock for Chart Analysis */}
                    <div className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200">
                      <div className="card-body p-8 text-center">
                        <div className="text-warning mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                        <h2 className="text-3xl font-bold mb-4">Premium Feature</h2>
                        <p className="text-lg text-base-content/70 mb-6">
                          Chart Analysis is a premium feature that provides deep insights into betting patterns and player tendencies.
                        </p>
                        <button className="btn btn-primary btn-lg">
                          Upgrade to Premium
                  </button>
                </div>
              </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Analytics;