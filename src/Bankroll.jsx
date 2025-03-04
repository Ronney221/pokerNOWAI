import React, { useState, useEffect } from 'react';
import { getPlayerPerformanceHistory } from './services/ledger';
import { useAuth } from './contexts/AuthContext';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

/**
 * Bankroll component that displays player performance data
 */
const Bankroll = () => {
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchPerformanceData();
  }, [currentUser]);

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
      
      // Sort by date, most recent first
      const sortedData = data.sort((a, b) => {
        return new Date(b.sessionDate) - new Date(a.sessionDate);
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
   * Format money value based on denomination
   */
  const formatMoney = (amount, denomination = 'cents') => {
    const divisor = denomination === 'cents' ? 100 : 1;
    return (amount / divisor).toFixed(2);
  };

  /**
   * Format date string to readable format
   */
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString || 'N/A';
    }
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
   * Renders the loading state
   */
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="loader">Loading...</div>
      </div>
    );
  }

  /**
   * Renders when user is not logged in
   */
  if (!currentUser) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Performance Tracking</h2>
        <p className="mb-4">Please sign in to view your performance history.</p>
      </div>
    );
  }

  /**
   * Renders when there's an error
   */
  if (error) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Performance Tracking</h2>
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          className="btn btn-primary" 
          onClick={fetchPerformanceData}
        >
          Try Again
        </button>
      </div>
    );
  }

  /**
   * Renders when there's no performance data
   */
  if (performanceData.length === 0) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Performance Tracking</h2>
        <p className="mb-4">You haven't tracked any poker sessions yet.</p>
        <p className="mb-4">Track your performance from the Saved Ledgers page to see your history here.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pt-64">
      <h2 className="text-2xl font-bold mb-6">Your Poker Performance</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">Total Sessions</h3>
            <p className="text-3xl font-bold">{performanceData.length}</p>
          </div>
        </div>
        
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">Total Buy-in</h3>
            <p className="text-3xl font-bold">${formatMoney(calculateTotalBuyIn(), 'cents')}</p>
          </div>
        </div>
        
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">Total Profit/Loss</h3>
            <p className={`text-3xl font-bold ${calculateTotalProfit() >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${formatMoney(calculateTotalProfit(), 'cents')}
            </p>
          </div>
        </div>
      </div>
      
      {/* Performance Table */}
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Date</th>
              <th>Game</th>
              <th>Player Name</th>
              <th>Buy-in</th>
              <th>Cash-out</th>
              <th>Profit/Loss</th>
            </tr>
          </thead>
          <tbody>
            {performanceData.map((session) => (
              <tr key={session._id}>
                <td>{formatDate(session.sessionDate)}</td>
                <td>{session.sessionName || 'Unnamed Game'}</td>
                <td>{session.playerName}</td>
                <td>${formatMoney(session.buyIn, session.denomination)}</td>
                <td>${formatMoney(session.cashOut, session.denomination)}</td>
                <td className={session.profit >= 0 ? 'text-green-500' : 'text-red-500'}>
                  ${formatMoney(session.profit, session.denomination)}
                </td>
              </tr>
            ))}
            
            {/* Totals Row */}
            <tr className="font-bold">
              <td colSpan={3}>Totals</td>
              <td>${formatMoney(calculateTotalBuyIn(), 'cents')}</td>
              <td>${formatMoney(calculateTotalCashOut(), 'cents')}</td>
              <td className={calculateTotalProfit() >= 0 ? 'text-green-500' : 'text-red-500'}>
                ${formatMoney(calculateTotalProfit(), 'cents')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Bankroll; 