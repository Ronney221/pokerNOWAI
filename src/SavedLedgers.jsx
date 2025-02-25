import React, { useState, useEffect } from 'react';
import { getUserLedgers, getLedgerById, deleteLedgerById } from './services/ledger';
import { useAuth } from './contexts/AuthContext';
import { toast } from 'react-toastify';

const SavedLedgers = ({ setCurrentPage }) => {
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [ledgerToDelete, setLedgerToDelete] = useState(null);
  const { currentUser } = useAuth();

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
    } catch (err) {
      console.error('Error fetching ledger details:', err);
      toast.error('Failed to load ledger details');
    } finally {
      setLoading(false);
    }
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

  const handleOpenShareModal = () => {
    if (!selectedLedger) return;
    
    // Generate a proper shareable URL using the shared-ledger route
    const baseUrl = window.location.origin;
    setShareUrl(`${baseUrl}/shared-ledger/${selectedLedger._id}`);
    setIsShareModalOpen(true);
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        toast.success('Link copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy link:', err);
        toast.error('Failed to copy link');
      });
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

  const calculateTotalProfit = (players) => {
    if (!players || players.length === 0) return 0;
    
    const winners = players.filter(player => player.cashOut > player.buyIn);
    return winners.reduce((total, player) => total + (player.cashOut - player.buyIn), 0) / 100;
  };

  const getPlayerWithHighestProfit = (players) => {
    if (!players || players.length === 0) return null;
    
    return players.reduce((highest, player) => {
      const profit = player.cashOut - player.buyIn;
      if (!highest || profit > (highest.cashOut - highest.buyIn)) {
        return player;
      }
      return highest;
    }, null);
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
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200/50 pt-32">
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="card bg-base-100 w-full max-w-md shadow-2xl animate-fadeIn">
            <div className="card-body">
              <h3 className="card-title text-xl text-warning">Delete Ledger?</h3>
              <p className="py-4">
                Are you sure you want to delete ledger "{ledgerToDelete?.sessionName}"? This action cannot be undone.
              </p>
              <div className="card-actions justify-end mt-6">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)} 
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteLedger} 
                  className="btn btn-error"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Deleting...
                    </>
                  ) : "Delete Ledger"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="card bg-base-100 w-full max-w-md shadow-2xl animate-fadeIn">
            <div className="card-body">
              <h3 className="card-title text-xl">Share Ledger</h3>
              <p className="text-sm text-base-content/70 mb-4">
                Copy the link below to share this ledger's results with others. Anyone with this link can view the results.
              </p>
              
              <div className="form-control">
                <div className="input-group">
                  <input 
                    type="text" 
                    value={shareUrl} 
                    readOnly 
                    className="input input-bordered w-full font-mono text-sm"
                  />
                  <button 
                    className="btn btn-primary" 
                    onClick={handleCopyShareLink}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy
                  </button>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => setIsShareModalOpen(false)} 
                  className="btn btn-ghost"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!selectedLedger ? (
        // List of ledgers view
        <div className="container mx-auto px-4 py-12">
          {/* Hero Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Your Poker History
            </h1>
            <p className="text-lg md:text-xl opacity-80 max-w-2xl mx-auto">
              Review your past sessions, track your progress, and gain insights from your poker journey.
            </p>
          </div>

          {error && (
            <div className="max-w-xl mx-auto mb-10">
              <div className="alert alert-error shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold">We encountered a problem</h3>
                  <div className="text-sm">{error}</div>
                </div>
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {ledgers.length === 0 ? (
            <div className="max-w-2xl mx-auto">
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body items-center text-center py-16">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 opacity-20 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h2 className="text-2xl font-medium mb-2">No Ledgers Found</h2>
                  <p className="text-base-content/70 mb-8">Your poker journey begins with your first saved ledger.</p>
                  <button 
                    onClick={() => setCurrentPage('ledger')} 
                    className="btn btn-primary btn-lg"
                  >
                    Create Your First Ledger
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Ledger Count Summary */}
              <div className="flex justify-between items-center mb-8 max-w-6xl mx-auto">
                <h2 className="text-xl font-medium">
                  {ledgers.length} {ledgers.length === 1 ? 'Session' : 'Sessions'} Recorded
                </h2>
                <button 
                  onClick={() => setCurrentPage('ledger')} 
                  className="btn btn-primary"
                >
                  Create New Ledger
                </button>
              </div>

              {/* Ledger Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {ledgers.map((ledger) => {
                  const totalProfit = calculateTotalProfit(ledger.players);
                  const topPlayer = getPlayerWithHighestProfit(ledger.players);
                  
                  return (
                    <div 
                      key={ledger._id} 
                      className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden relative group"
                      onClick={() => handleViewLedger(ledger._id)}
                    >
                      {/* Delete Button (top-right corner) */}
                      <button 
                        className="absolute top-2 right-2 btn btn-circle btn-xs btn-ghost opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={(e) => handleOpenDeleteModal(e, ledger)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      
                      <div className="card-body p-6">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="card-title text-lg font-medium truncate" title={ledger.sessionName}>
                            {ledger.sessionName}
                          </h3>
                          <div className="badge badge-ghost opacity-70">{formatDate(ledger.sessionDate)}</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 my-3">
                          <div className="stat p-0 m-0">
                            <div className="stat-title text-xs opacity-70">Players</div>
                            <div className="stat-value text-2xl">{ledger.players?.length || 0}</div>
                          </div>
                          <div className="stat p-0 m-0">
                            <div className="stat-title text-xs opacity-70">Transactions</div>
                            <div className="stat-value text-2xl">{ledger.transactions?.length || 0}</div>
                          </div>
                        </div>
                        
                        {topPlayer && (
                          <div className="mt-4 pt-4 border-t border-base-300">
                            <div className="text-xs opacity-70 mb-1">Top Player</div>
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{topPlayer.name}</span>
                              <span className={`font-semibold ${(topPlayer.cashOut - topPlayer.buyIn) > 0 ? 'text-success' : 'text-error'}`}>
                                ${((topPlayer.cashOut - topPlayer.buyIn) / 100).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="card-actions justify-end bg-base-200 p-4">
                        <button className="btn btn-sm btn-ghost">View Details</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      ) : (
        // Ledger detail view
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          {/* Header with back button */}
          <div className="flex items-center mb-6">
            <button 
              onClick={() => setSelectedLedger(null)} 
              className="btn btn-ghost btn-circle mr-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-grow">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {selectedLedger.sessionName}
              </h2>
              <div className="text-sm opacity-70 mt-1">
                {formatDate(selectedLedger.sessionDate)} at {formatTime(selectedLedger.sessionDate)}
              </div>
            </div>
            <button 
              onClick={(e) => handleOpenDeleteModal(e, selectedLedger)}
              className="btn btn-outline btn-error btn-sm ml-4"
            >
              Delete Ledger
            </button>
          </div>

          {/* Session Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="text-sm opacity-70 font-medium">Total Players</h3>
                <p className="text-3xl font-bold">{selectedLedger.players?.length || 0}</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="text-sm opacity-70 font-medium">Total Transactions</h3>
                <p className="text-3xl font-bold">{selectedLedger.transactions?.length || 0}</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="text-sm opacity-70 font-medium">Total Money Exchanged</h3>
                <p className="text-3xl font-bold">
                  ${selectedLedger.transactions.reduce((total, tx) => total + parseFloat(tx.amount), 0).toFixed(2)}
                </p>
              </div>
            </div>
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
                    {selectedLedger.players.map((player, index) => {
                      const profit = player.cashOut - player.buyIn;
                      return (
                        <div key={index} className="grid grid-cols-12 p-4 hover:bg-base-200/50 transition-colors">
                          <div className="col-span-4 font-medium">{player.name}</div>
                          <div className="col-span-2 text-right">${(player.buyIn / 100).toFixed(2)}</div>
                          <div className="col-span-2 text-right">${(player.cashOut / 100).toFixed(2)}</div>
                          <div className={`col-span-4 text-right font-semibold ${profit > 0 ? 'text-success' : profit < 0 ? 'text-error' : ''}`}>
                            ${(profit / 100).toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Section */}
          <div className="card bg-base-100 shadow-xl overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Settlement Transactions
              </h3>
              <div className="overflow-x-auto">
                <div className="min-w-full rounded-lg overflow-hidden">
                  <div className="grid grid-cols-9 bg-base-200 p-4 font-medium text-sm">
                    <div className="col-span-3">From</div>
                    <div className="col-span-3">To</div>
                    <div className="col-span-3 text-right">Amount</div>
                  </div>
                  <div className="divide-y divide-base-200">
                    {selectedLedger.transactions.map((tx, index) => (
                      <div key={index} className="grid grid-cols-9 p-4 hover:bg-base-200/50 transition-colors">
                        <div className="col-span-3 font-medium">{tx.from}</div>
                        <div className="col-span-3 font-medium">{tx.to}</div>
                        <div className="col-span-3 text-right text-success font-semibold">${parseFloat(tx.amount).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Export options */}
          <div className="flex justify-center mt-10 gap-4">
            <button 
              onClick={handleOpenShareModal}
              className="btn btn-outline btn-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Share Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedLedgers; 