// src/ledger.jsx
import React, { useState, useRef } from 'react';
import './index.css';
import Papa from 'papaparse';
import stringSimilarity from 'string-similarity';
import { toast } from 'react-toastify';
import { useAuth } from './contexts/AuthContext';
import { saveLedgerData } from './services/ledger';
import { motion, AnimatePresence } from 'framer-motion';
import { pageTransitionVariants, containerVariants, itemVariants } from './animations/pageTransitions';

const Ledger = ({ setCurrentPage }) => {
    const [parsedData, setParsedData] = useState([]);
    const [error, setError] = useState(null);
    const [aliasGroups, setAliasGroups] = useState([]); // Array of { group: string[], canonical: string, totals: {...} }
    const [groupingConfirmed, setGroupingConfirmed] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [aliasSummary, setAliasSummary] = useState({}); // Mapping: alias -> { buyIn, buyOut, stack, combined }
    const [saving, setSaving] = useState(false);
    const [ledgerSaved, setLedgerSaved] = useState(false);
    const [sessionName, setSessionName] = useState('Poker Session');
    const [denomination, setDenomination] = useState('cents'); // 'cents' or 'dollars'
    const [originalFileName, setOriginalFileName] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
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
  
    // Helper: Get divisor based on denomination
    const getDivisor = () => denomination === 'cents' ? 100 : 1;
  
    // Format money amount based on current denomination
    const formatMoney = (amount) => {
      return (amount / getDivisor()).toFixed(2);
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
  
    // Process the file (whether from input change or drop)
    const processFile = (file) => {
      if (!file) return;
      // Reset state for new file
      setGroupingConfirmed(false);
      setTransactions([]);
      setAliasGroups([]);
      setAliasSummary({});
      setOriginalFileName(file.name);
      setSessionName(`Poker Session - ${new Date().toLocaleDateString()}`);
      setLedgerSaved(false);
  
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
  
    // Handle file input change
    const handleFileUpload = (e) => {
      const file = e.target.files[0];
      processFile(file);
    };
    
    // Handle denomination change
    const handleDenominationChange = (e) => {
      setDenomination(e.target.value);
    };
    
    // Handle drag events
    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };
    
    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };
    
    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragging) {
        setIsDragging(true);
      }
    };
    
    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        // Check if it's a CSV file
        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          processFile(file);
        } else {
          setError("Please upload a CSV file.");
          toast.error("Please upload a CSV file.");
        }
      }
    };
    
    // Click handler for the drop area
    const handleDropAreaClick = () => {
      fileInputRef.current.click();
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
  
    // Simple settlement algorithm to minimize transactions:
    function settleDebts(netBalances) {
      const creditors = [];
      const debtors = [];
      const isDollarsGame = denomination === 'dollars';

      netBalances.forEach((player) => {
        // For cents games, convert to dollars for display
        const adjustedNet = isDollarsGame ? player.net : player.net / 100;
        if (adjustedNet > 0) {
          creditors.push({ ...player, net: adjustedNet });
        } else if (adjustedNet < 0) {
          debtors.push({ ...player, net: adjustedNet });
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
        
        // Round to 2 decimal places for display
        const roundedAmount = Math.round(amount * 100) / 100;
        
        transactions.push({
          from: debtor.name,
          to: creditor.name,
          amount: roundedAmount.toFixed(2)
        });
        
        debtor.net += amount;
        creditor.net -= amount;
        
        if (Math.abs(debtor.net) < 0.01) i++;
        if (Math.abs(creditor.net) < 0.01) j++;
      }
      
      return transactions;
    }
  
    // Calculate settlement calculation function (using updated parsedData)
    const calculateSettlement = () => {
      // Group data by player_nickname
      const playerMap = {};
      const isDollarsGame = denomination === 'dollars';
      
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

      // Calculate each player's net balance
      const netBalances = [];
      Object.keys(playerMap).forEach((name) => {
        const { totalBuyIn, totalBuyOutStack } = playerMap[name];
        // Keep original values for settlement calculation
        const net = totalBuyOutStack - totalBuyIn;
        netBalances.push({ name, net });
      });

      // Compute settlement transactions
      const settlements = settleDebts(netBalances);
      setTransactions(settlements);
      toast.success("Settlements calculated successfully!");
    };
  
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
          originalFileName: originalFileName,
          denomination: denomination // Save the denomination setting
        });
        
        toast.success("Ledger saved successfully!");
        setLedgerSaved(true);
      } catch (error) {
        console.error("Error saving ledger:", error);
        toast.error(`Failed to save ledger: ${error.message}`);
      } finally {
        setSaving(false);
      }
    };

    // Navigate to saved ledgers page
    const viewSavedLedgers = () => {
      setCurrentPage('saved-ledgers');
    };
  
    return (
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageTransitionVariants}
        className="min-h-screen bg-gradient-to-b from-base-100 to-base-200/50 pt-32 pb-20"
      >
        <div className="container mx-auto px-4">
          {/* Hero Header */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center mb-12"
          >
            <motion.h1 
              variants={itemVariants}
              className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
            >
              Ledger Calculator
            </motion.h1>
            <motion.p 
              variants={itemVariants}
              className="text-lg opacity-80 max-w-2xl mx-auto"
            >
              Process your poker session data, match player names, and calculate optimal settlements quickly and easily.
            </motion.p>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            className="max-w-5xl mx-auto"
          >
            <div className="card bg-base-100 shadow-xl overflow-hidden">
              <div className="p-8">
                {/* Step 1: Denomination Selection */}
                <div className={`space-y-6 ${aliasGroups.length > 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-4">
                      <span className="text-lg font-bold">1</span>
                    </div>
                    <h2 className="text-2xl font-semibold">Select Game Denomination</h2>
                  </div>
                  
                  <p className="text-base-content/70 pl-14">
                    Choose whether your poker game is played with cents (100 cents = $1) or dollars.
                  </p>
                  
                  <div className="pl-14 mt-4">
                    <div className="flex gap-6">
                      <label className="flex items-center gap-3 p-4 border border-base-300 rounded-lg cursor-pointer hover:bg-base-200/50 transition-colors">
                        <input
                          type="radio"
                          name="denomination"
                          value="cents"
                          checked={denomination === 'cents'}
                          onChange={handleDenominationChange}
                          className="radio radio-primary"
                        />
                        <div>
                          <div className="font-medium">Cents</div>
                          <div className="text-sm text-base-content/70">example: 0.25/0.50</div>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-4 border border-base-300 rounded-lg cursor-pointer hover:bg-base-200/50 transition-colors">
                        <input
                          type="radio"
                          name="denomination"
                          value="dollars"
                          checked={denomination === 'dollars'}
                          onChange={handleDenominationChange}
                          className="radio radio-primary"
                        />
                        <div>
                          <div className="font-medium">Dollars</div>
                          <div className="text-sm text-base-content/70">example: 1/2</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Step 2: Upload CSV */}
                <div className={`space-y-6 mt-10 border-t border-base-200 pt-10 ${aliasGroups.length > 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-4">
                      <span className="text-lg font-bold">2</span>
                    </div>
                    <h2 className="text-2xl font-semibold">Upload your CSV file</h2>
                  </div>
                  
                  <p className="text-base-content/70 pl-14">
                    The CSV should include columns: <code className="bg-base-200 px-1 rounded">player_nickname</code>, <code className="bg-base-200 px-1 rounded">buy_in</code>, <code className="bg-base-200 px-1 rounded">buy_out</code>, and <code className="bg-base-200 px-1 rounded">stack</code>.
                  </p>
                  
                  <div 
                    className={`flex flex-col items-center px-6 py-10 mt-2 ml-14 bg-base-200 text-center rounded-xl cursor-pointer border-2 border-dashed ${isDragging ? 'border-primary border-opacity-70 bg-primary bg-opacity-5' : 'border-base-content border-opacity-10 hover:border-primary hover:border-opacity-50'} transition-colors`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleDropAreaClick}
                  >
                    <div className="flex flex-col items-center max-w-md">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-16 w-16 ${isDragging ? 'text-primary' : 'text-base-content/40'} mb-2 transition-colors`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="text-xl font-medium mb-2">
                        {isDragging ? 'Drop your CSV file here' : 'Drop your CSV file here'}
                      </div>
                      <p className="text-base-content/60 mb-4">or click to browse</p>
                      <div className="flex items-center text-sm text-base-content/60">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        The calculator will identify similar player names
                      </div>
                    </div>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      className="hidden" 
                      accept=".csv" 
                      onChange={handleFileUpload} 
                    />
                  </div>
                </div>

                {error && (
                  <div className="mt-8">
                    <div className="alert alert-error">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 stroke-current shrink-0" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h3 className="font-bold">Error</h3>
                        <div className="text-sm">{error}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Fuzzy grouping suggestions */}
                {aliasGroups.length > 0 && !groupingConfirmed && (
                  <div className="mt-10 border-t border-base-200 pt-10">
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-4">
                        <span className="text-lg font-bold">3</span>
                      </div>
                      <h2 className="text-2xl font-semibold">Confirm Player Names</h2>
                    </div>
                    
                    <p className="text-base-content/70 mb-8 pl-14">
                      We detected similar nicknames with their aggregated financial data.
                      Please review and adjust the Player Names if needed.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      {aliasGroups.map((groupObj, index) => {
                        const hasMultipleNames = groupObj.group.length > 1;
                        return (
                          <div 
                            key={index} 
                            className={`card ${hasMultipleNames ? 'bg-primary/5 border border-primary/20' : 'bg-base-200'} shadow-sm hover:shadow transition-all`}
                          >
                            <div className="card-body p-5">
                              <div className="mb-3 flex items-start justify-between">
                                <div>
                                  <h3 className="font-medium">Aliases</h3>
                                  <div className="text-sm mt-1 flex flex-wrap gap-1">
                                    {groupObj.group.map((alias, i) => (
                                      <span key={i} className="badge badge-sm">{alias}</span>
                                    ))}
                                  </div>
                                </div>
                                <div className={`badge ${hasMultipleNames ? 'badge-primary' : 'badge-outline'} ${hasMultipleNames ? 'animate-pulse' : ''}`}>
                                  {groupObj.group.length} {groupObj.group.length === 1 ? 'name' : 'names'}
                                </div>
                              </div>
                              
                              <div className="mb-3 text-sm grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-xs opacity-70">Buy-in</span>
                                  <div className="font-medium">${formatMoney(groupObj.totals.buyIn)}</div>
                                </div>
                                <div>
                                  <span className="text-xs opacity-70">Cash-out</span>
                                  <div className="font-medium">${formatMoney(groupObj.totals.combined)}</div>
                                </div>
                              </div>
                              
                              <div className="form-control">
                                <label className="label">
                                  <span className="label-text font-medium">Player Name</span>
                                </label>
                                <input
                                  type="text"
                                  value={groupObj.canonical}
                                  onChange={(e) => handleCanonicalChange(index, e.target.value)}
                                  className="input input-bordered w-full"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="flex justify-center mt-8">
                      <button
                        onClick={confirmGrouping}
                        className="btn btn-primary btn-lg"
                      >
                        Confirm Player Names
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 4: Confirmed groupings displayed in a table */}
                {groupingConfirmed && (
                  <div className="mt-10 border-t border-base-200 pt-10">                    
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-4">
                        <span className="text-lg font-bold">4</span>
                      </div>
                      <h2 className="text-2xl font-semibold">Review Player Data</h2>
                    </div>
                    
                    <div className="card bg-base-200 overflow-hidden">
                      <div className="p-6">
                        <div className="overflow-x-auto">
                          <table className="table w-full">
                            <thead>
                              <tr className="bg-base-300">
                                <th>Player Name</th>
                                <th>Aliases</th>
                                <th className="text-right">Buy‑in</th>
                                <th className="text-right">Cash‑out</th>
                              </tr>
                            </thead>
                            <tbody>
                              {aggregatedGroups().map(([playerName, { aliases, totals }]) => (
                                <tr key={playerName} className="hover">
                                  <td className="font-medium">{playerName}</td>
                                  <td className="text-sm text-base-content/70">
                                    <div className="flex flex-wrap gap-1">
                                      {Array.from(aliases).map((alias, i) => (
                                        <span key={i} className="badge badge-sm badge-ghost">{alias}</span>  
                                      ))}
                                    </div>
                                  </td>
                                  <td className="text-right">${formatMoney(totals.buyIn)}</td>
                                  <td className="text-right">${formatMoney(totals.combined)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center gap-4 mt-8">
                      <button 
                        onClick={backToGrouping} 
                        className="btn btn-outline"
                      >
                        Edit Player Names
                      </button>
                      <button
                        onClick={calculateSettlement}
                        className="btn btn-primary"
                      >
                        Calculate Settlements
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 5: Settlement Transactions displayed in a table */}
                {transactions.length > 0 && (
                  <div className="mt-10 border-t border-base-200 pt-10">
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-4">
                        <span className="text-lg font-bold">5</span>
                      </div>
                      <h2 className="text-2xl font-semibold">Settlement Transactions</h2>
                    </div>
                    
                    <p className="text-base-content/70 mb-8 pl-14">
                      Here are the optimal payments to settle all debts between players.
                    </p>
                    
                    <div className="card bg-base-200 overflow-hidden mb-8">
                      <div className="p-6">
                        <div className="overflow-x-auto">
                          <table className="table w-full">
                            <thead>
                              <tr className="bg-base-300">
                                <th>From</th>
                                <th>To</th>
                                <th className="text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {transactions.map((t, index) => (
                                <tr key={index} className="hover">
                                  <td className="font-medium">{t.from}</td>
                                  <td className="font-medium">{t.to}</td>
                                  <td className="text-success font-semibold text-right">${t.amount}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                    
                    {/* Save Options */}
                    {currentUser && !ledgerSaved && (
                      <div className="card bg-base-100 shadow-lg border border-base-300 p-6 mb-8">
                        <h3 className="text-xl font-medium mb-4">Save this Ledger</h3>
                        <div className="form-control mb-6">
                          <label className="label">
                            <span className="label-text">Session Name</span>
                          </label>
                          <input 
                            type="text"
                            value={sessionName}
                            onChange={(e) => setSessionName(e.target.value)}
                            className="input input-bordered w-full"
                            placeholder="Name this poker session"
                          />
                          <label className="label">
                            <span className="label-text-alt text-base-content/60">This name will help you identify this session later</span>
                          </label>
                        </div>
                        
                        <button 
                          onClick={handleSaveLedger}
                          disabled={saving}
                          className={`btn btn-success ${saving ? 'loading' : ''}`}
                        >
                          {saving ? 'Saving Ledger...' : 'Save Ledger'}
                        </button>
                      </div>
                    )}

                    {/* View Saved Ledgers (after saving) */}
                    {currentUser && ledgerSaved && (
                      <div className="card bg-base-100 shadow-lg border border-base-300 p-6 mb-8">
                        <div className="flex items-center mb-4">
                          <div className="flex-shrink-0 mr-4">
                            <div className="w-12 h-12 bg-success/20 text-success rounded-full flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-xl font-medium text-success">Ledger Saved Successfully!</h3>
                            <p className="text-base-content/70 text-sm mt-1">
                              Your ledger data has been saved as "{sessionName}"
                            </p>
                          </div>
                        </div>
                        
                        <button 
                          onClick={viewSavedLedgers}
                          className="btn btn-primary mt-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          View Saved Ledgers
                        </button>
                      </div>
                    )}
                    
                    {/* Login Prompt (Only for non-logged-in users) */}
                    {!currentUser && transactions.length > 0 && (
                      <div className="card bg-base-100 shadow-lg border border-base-300 p-6">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold">Want to save this ledger?</h3>
                            <p className="text-base-content/70 mt-1">Sign in to save your ledger data for future reference and access more features.</p>
                          </div>
                          <a href="/login" className="btn btn-info">Login</a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
};

export default Ledger;