// src/analytics.jsx
import React, { useState } from 'react';
import './index.css';
import Papa from 'papaparse';
import stringSimilarity from 'string-similarity';
import { toast } from 'react-toastify';
import { useAuth } from './contexts/AuthContext';
import { saveLedgerData } from './services/ledger';

const Ledger = () => {
    const [parsedData, setParsedData] = useState([]);
    const [error, setError] = useState(null);
    const [aliasGroups, setAliasGroups] = useState([]); // Array of { group: string[], canonical: string, totals: {...} }
    const [groupingConfirmed, setGroupingConfirmed] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [aliasSummary, setAliasSummary] = useState({}); // Mapping: alias -> { buyIn, buyOut, stack, combined }
    const [saving, setSaving] = useState(false);
    const [sessionName, setSessionName] = useState('Poker Session');
    const [originalFileName, setOriginalFileName] = useState('');
    const { currentUser } = useAuth();
  
    // Helper: Compute aggregate data for each alias from parsedData
    const computeAliasSummary = (data) => {
      const summary = {};
      data.forEach((row) => {
        const name = row.player_nickname.trim();
        const buyIn = parseFloat(row.buy_in) || 0;
        const buyOut = parseFloat(row.buy_out) || 0;
        const stack = parseFloat(row.stack) || 0;
        if (!summary[name]) {
          summary[name] = { buyIn: 0, buyOut: 0, stack: 0 };
        }
        summary[name].buyIn += buyIn;
        summary[name].buyOut += buyOut;
        summary[name].stack += stack;
      });
      // Compute combined cash-out (buy_out + stack)
      Object.keys(summary).forEach((name) => {
        summary[name].combined = summary[name].buyOut + summary[name].stack;
      });
      return summary;
    };
  
    // Fuzzy grouping function using string-similarity
    const groupNicknames = (names, threshold = 0.7) => {
      const groups = [];
      const assigned = new Set();
  
      names.forEach((name) => {
        if (assigned.has(name)) return;
        // Create a new group for this name
        const group = [name];
        assigned.add(name);
        names.forEach((otherName) => {
          if (!assigned.has(otherName)) {
            const similarityScore = stringSimilarity.compareTwoStrings(
              name.toLowerCase(),
              otherName.toLowerCase()
            );
            if (similarityScore >= threshold) {
              group.push(otherName);
              assigned.add(otherName);
            }
          }
        });
        groups.push(group);
      });
      return groups;
    };
  
    // Handle CSV upload and parsing
    const handleFileUpload = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      // Reset state for new file
      setGroupingConfirmed(false);
      setTransactions([]);
      setAliasGroups([]);
      setAliasSummary({});
      setOriginalFileName(file.name);
      setSessionName(`Poker Session - ${new Date().toLocaleDateString()}`);
  
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const data = results.data;
            setParsedData(data);
            // Compute aggregated alias summary data
            const summary = computeAliasSummary(data);
            setAliasSummary(summary);
            // Get unique aliases
            const uniqueNames = Object.keys(summary);
            // Run fuzzy grouping on the unique names
            const groups = groupNicknames(uniqueNames);
            // For each group, compute total aggregates and set a default player name (first alias)
            const initialAliasGroups = groups.map((group) => {
              const totals = group.reduce(
                (acc, alias) => {
                  const { buyIn, buyOut, stack, combined } = summary[alias];
                  return {
                    buyIn: acc.buyIn + buyIn,
                    buyOut: acc.buyOut + buyOut,
                    stack: acc.stack + stack,
                    combined: acc.combined + combined,
                  };
                },
                { buyIn: 0, buyOut: 0, stack: 0, combined: 0 }
              );
              return { group, canonical: group[0], totals };
            });
            setAliasGroups(initialAliasGroups);
            toast.success("CSV file processed successfully!");
          } catch (err) {
            setError("Error processing CSV data.");
            console.error(err);
            toast.error("Error processing CSV data.");
          }
        },
        error: (err) => {
          setError("Error reading file.");
          console.error(err);
          toast.error("Error reading file.");
        },
      });
    };
  
    // Update player name for a group
    const handleCanonicalChange = (index, newCanonical) => {
      const updatedGroups = [...aliasGroups];
      updatedGroups[index].canonical = newCanonical;
      setAliasGroups(updatedGroups);
    };
  
    // When the user confirms the grouping, remap the parsedData to use player names
    const confirmGrouping = () => {
      // Build a mapping from each alias to its player name
      const aliasMapping = {};
      aliasGroups.forEach(({ group, canonical }) => {
        group.forEach((alias) => {
          aliasMapping[alias] = canonical;
        });
      });
  
      // Update the parsedData with player names
      const newData = parsedData.map((row) => {
        const original = row.player_nickname.trim();
        return { ...row, player_nickname: aliasMapping[original] || original };
      });
      setParsedData(newData);
      setGroupingConfirmed(true);
      toast.success("Groupings confirmed!");
    };
  
    // Go back to grouping view
    const backToGrouping = () => {
      setGroupingConfirmed(false);
    };
  
    // Settlement calculation function (using updated parsedData)
    const calculateSettlement = () => {
      // Group data by player_nickname
      const playerMap = {};
      parsedData.forEach((row) => {
        const name = row.player_nickname;
        const buyIn = parseFloat(row.buy_in) || 0;
        const buyOut = parseFloat(row.buy_out) || 0;
        const stack = parseFloat(row.stack) || 0;
  
        if (!playerMap[name]) {
          playerMap[name] = { totalBuyIn: 0, totalBuyOutStack: 0 };
        }
        playerMap[name].totalBuyIn += buyIn;
        playerMap[name].totalBuyOutStack += (buyOut + stack);
      });
  
      // Calculate each player's net balance (in dollars)
      const netBalances = [];
      Object.keys(playerMap).forEach((name) => {
        const { totalBuyIn, totalBuyOutStack } = playerMap[name];
        const net = (totalBuyOutStack - totalBuyIn) / 100;
        netBalances.push({ name, net });
      });
  
      // Compute settlement transactions
      const settlements = settleDebts(netBalances);
      setTransactions(settlements);
      toast.success("Settlements calculated successfully!");
    };
  
    // Simple settlement algorithm to minimize transactions:
    function settleDebts(netBalances) {
      const creditors = [];
      const debtors = [];
      netBalances.forEach((player) => {
        if (player.net > 0) {
          creditors.push({ ...player });
        } else if (player.net < 0) {
          debtors.push({ ...player });
        }
      });
      // Sort creditors (largest net first) and debtors (most negative first)
      creditors.sort((a, b) => b.net - a.net);
      debtors.sort((a, b) => a.net - b.net);
      const transactions = [];
      let i = 0;
      let j = 0;
      while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];
        const amount = Math.min(creditor.net, -debtor.net);
        transactions.push({
          from: debtor.name,
          to: creditor.name,
          amount: amount.toFixed(2),
        });
        debtor.net += amount;
        creditor.net -= amount;
        if (Math.abs(debtor.net) < 0.01) i++;
        if (Math.abs(creditor.net) < 0.01) j++;
      }
      return transactions;
    }
  
    // Aggregate confirmed groupings by player name so that duplicates are combined
    const aggregatedGroups = () => {
      const aggregated = {};
      aliasGroups.forEach((groupObj) => {
        const key = groupObj.canonical;
        if (!aggregated[key]) {
          aggregated[key] = {
            aliases: new Set(groupObj.group),
            totals: { ...groupObj.totals },
          };
        } else {
          groupObj.group.forEach((alias) => aggregated[key].aliases.add(alias));
          aggregated[key].totals.buyIn += groupObj.totals.buyIn;
          aggregated[key].totals.combined += groupObj.totals.combined;
        }
      });
      return Object.entries(aggregated); // [ [playerName, { aliases: Set, totals }], ... ]
    };
  
    // Save ledger to MongoDB (for logged-in users)
    const handleSaveLedger = async () => {
      if (!currentUser) {
        toast.error("You must be logged in to save ledger data");
        return;
      }
      
      if (transactions.length === 0) {
        toast.error("You must calculate settlements before saving");
        return;
      }
      
      try {
        setSaving(true);
        
        // Prepare player data from aliasGroups
        const players = aggregatedGroups().map(([playerName, { aliases, totals }]) => ({
          name: playerName,
          aliases: Array.from(aliases),
          buyIn: totals.buyIn,
          cashOut: totals.combined
        }));
        
        // Call the API to save ledger data
        const result = await saveLedgerData({
          firebaseUid: currentUser.uid,
          sessionName: sessionName,
          players: players,
          transactions: transactions,
          originalFileName: originalFileName
        });
        
        toast.success("Ledger saved successfully!");
      } catch (error) {
        console.error("Error saving ledger:", error);
        toast.error(`Failed to save ledger: ${error.message}`);
      } finally {
        setSaving(false);
      }
    };
  
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-4xl mx-auto p-2 sm:p-4 md:p-6">
          <div className="mockup-window bg-base-300 border shadow-lg">
            <div className="bg-base-200 p-4 sm:p-8 md:p-16">
              <div className="flex flex-col space-y-6">
                <div className="text-center space-y-4">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text">
                    Pokernow Ledger Calculator
                  </h1>
                  <div className="text-sm sm:text-base md:text-lg opacity-80 leading-relaxed">
                    <p>
                      Upload your CSV file. The CSV should include columns:{' '}
                      <code>player_nickname</code>, <code>buy_in</code>, <code>buy_out</code>, and <code>stack</code>.
                    </p>
                    <div className="mt-2 text-warning text-sm">
                      Note: The calculator will identify similar player nicknames and help settle transactions.
                    </div>
                  </div>
                </div>

                {/* File Upload Area */}
                <label className="flex flex-col items-center px-4 py-6 bg-base-300 text-center rounded-lg cursor-pointer border-2 border-dashed border-base-content/20 hover:border-primary/50 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="mt-2 text-base leading-normal">Select a CSV file</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".csv" 
                    onChange={handleFileUpload} 
                  />
                </label>

                {error && (
                  <div className="bg-error/20 text-error rounded-lg p-4 text-center">
                    <p>{error}</p>
                  </div>
                )}

                {/* Fuzzy grouping suggestions */}
                {aliasGroups.length > 0 && !groupingConfirmed && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-xl font-semibold">Confirm Alias Grouping</h3>
                      <p className="mt-2 opacity-80">
                        We detected similar nicknames with their aggregated financial data.
                        Adjust the Player Name if needed.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {aliasGroups.map((groupObj, index) => (
                        <div key={index} className="bg-base-300 rounded-lg p-4 shadow-sm">
                          <div className="mb-2 text-sm">
                            <span className="font-semibold">Aliases:</span> {groupObj.group.join(', ')}
                          </div>
                          <div className="mb-2 text-sm">
                            {groupObj.group.length > 1 ? (
                              <>
                                <span className="font-semibold">Group Totals:</span> Buy‑in: $
                                {(groupObj.totals.buyIn / 100).toFixed(2)}, Combined Cash‑out: $
                                {(groupObj.totals.combined / 100).toFixed(2)}
                              </>
                            ) : (
                              <>
                                <span className="font-semibold">Buy‑in:</span> $
                                {(aliasSummary[groupObj.group[0]].buyIn / 100).toFixed(2)},{' '}
                                <span className="font-semibold">Combined Cash‑out:</span> $
                                {(aliasSummary[groupObj.group[0]].combined / 100).toFixed(2)}
                              </>
                            )}
                          </div>
                          <div className="form-control">
                            <label className="label">
                              <span className="label-text">Player Name:</span>
                            </label>
                            <input
                              type="text"
                              value={groupObj.canonical}
                              onChange={(e) => handleCanonicalChange(index, e.target.value)}
                              className="input input-bordered input-sm w-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-center mt-6">
                      <button
                        onClick={confirmGrouping}
                        className="btn btn-primary"
                      >
                        Confirm Groupings
                      </button>
                    </div>
                  </div>
                )}

                {/* Confirmed groupings displayed in a table */}
                {groupingConfirmed && (
                  <div className="space-y-4">
                    <div className="divider"></div>
                    <div className="text-center">
                      <h3 className="text-xl font-semibold">Confirmed Groupings</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="table table-zebra w-full">
                        <thead>
                          <tr>
                            <th>Player Name</th>
                            <th>Aliases</th>
                            <th>Buy‑in</th>
                            <th>Combined Cash‑out</th>
                          </tr>
                        </thead>
                        <tbody>
                          {aggregatedGroups().map(([playerName, { aliases, totals }]) => (
                            <tr key={playerName}>
                              <td className="font-medium">{playerName}</td>
                              <td className="text-sm">{Array.from(aliases).join(", ")}</td>
                              <td>${(totals.buyIn / 100).toFixed(2)}</td>
                              <td>${(totals.combined / 100).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center gap-4 mt-6">
                      <button onClick={backToGrouping} className="btn btn-outline">
                        Back to Grouping
                      </button>
                      <button
                        onClick={calculateSettlement}
                        className="btn btn-primary"
                      >
                        Calculate Settlement
                      </button>
                    </div>
                  </div>
                )}

                {/* Settlement Transactions displayed in a table */}
                {transactions.length > 0 && (
                  <div className="space-y-4">
                    <div className="divider"></div>
                    <div className="text-center">
                      <h3 className="text-xl font-semibold">Settlement Transactions</h3>
                      <p className="mt-2 opacity-80">
                        Here are the optimal payments to settle all debts
                      </p>
                    </div>
                    
                    {currentUser && (
                      <div className="form-control w-full max-w-md mx-auto">
                        <label className="label">
                          <span className="label-text">Session Name (for saving)</span>
                        </label>
                        <input 
                          type="text"
                          value={sessionName}
                          onChange={(e) => setSessionName(e.target.value)}
                          className="input input-bordered w-full"
                          placeholder="Name this poker session"
                        />
                      </div>
                    )}
                    
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
                          {transactions.map((t, index) => (
                            <tr key={index}>
                              <td className="font-medium">{t.from}</td>
                              <td className="font-medium">{t.to}</td>
                              <td className="text-success font-medium">${t.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Save Ledger Button (Only for logged-in users) */}
                    {currentUser && (
                      <div className="flex justify-center mt-4">
                        <button 
                          onClick={handleSaveLedger}
                          disabled={saving}
                          className={`btn btn-success ${saving ? 'loading' : ''}`}
                        >
                          {saving ? 'Saving...' : 'Save Ledger'}
                        </button>
                      </div>
                    )}
                    
                    {/* Login Prompt (Only for non-logged-in users) */}
                    {!currentUser && transactions.length > 0 && (
                      <div className="alert alert-info mt-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <div>
                          <p className="font-semibold">Want to save this ledger?</p>
                          <p>Sign in to save your ledger data for future reference.</p>
                        </div>
                        <a href="/login" className="btn btn-sm">Login</a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
};

export default Ledger;
