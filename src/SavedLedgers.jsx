import React, { useState, useEffect } from 'react';
import { getUserLedgers, getLedgerById } from './services/ledger';
import { useAuth } from './contexts/AuthContext';
import { toast } from 'react-toastify';

const SavedLedgers = ({ setCurrentPage }) => {
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLedger, setSelectedLedger] = useState(null);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && !selectedLedger) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Your Saved Ledgers</h1>
        
        {error && (
          <div className="alert alert-error mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{error}</span>
          </div>
        )}

        {!selectedLedger ? (
          // List of ledgers
          <div className="overflow-x-auto">
            {ledgers.length === 0 ? (
              <div className="text-center py-8">
                <h2 className="text-xl font-semibold mb-2">No ledgers found</h2>
                <p className="mb-4">You haven't saved any ledgers yet.</p>
                <button 
                  onClick={() => setCurrentPage('ledger')} 
                  className="btn btn-primary"
                >
                  Create New Ledger
                </button>
              </div>
            ) : (
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Session Name</th>
                    <th>Date</th>
                    <th>Players</th>
                    <th>Transactions</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgers.map((ledger) => (
                    <tr key={ledger._id}>
                      <td>{ledger.sessionName}</td>
                      <td>{formatDate(ledger.sessionDate)}</td>
                      <td>{ledger.players?.length || 0}</td>
                      <td>{ledger.transactions?.length || 0}</td>
                      <td>
                        <button 
                          onClick={() => handleViewLedger(ledger._id)}
                          className="btn btn-sm btn-primary mr-2"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          // Ledger details view
          <div className="bg-base-200 p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{selectedLedger.sessionName}</h2>
              <div>
                <span className="text-sm opacity-70">
                  Saved on {formatDate(selectedLedger.createdAt)}
                </span>
                <button 
                  onClick={() => setSelectedLedger(null)} 
                  className="btn btn-sm btn-outline ml-4"
                >
                  Back to list
                </button>
              </div>
            </div>
            
            {/* Player Information */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-3">Players</h3>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Player Name</th>
                      <th>Buy-In</th>
                      <th>Cash-Out</th>
                      <th>Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedLedger.players.map((player, index) => (
                      <tr key={index}>
                        <td>{player.name}</td>
                        <td>${(player.buyIn / 100).toFixed(2)}</td>
                        <td>${(player.cashOut / 100).toFixed(2)}</td>
                        <td className={player.cashOut - player.buyIn > 0 ? 'text-success' : 'text-error'}>
                          ${((player.cashOut - player.buyIn) / 100).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Settlement Transactions */}
            <div>
              <h3 className="text-xl font-semibold mb-3">Settlement Transactions</h3>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>From</th>
                      <th>To</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedLedger.transactions.map((tx, index) => (
                      <tr key={index}>
                        <td>{tx.from}</td>
                        <td>{tx.to}</td>
                        <td className="text-success font-medium">${tx.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedLedgers; 