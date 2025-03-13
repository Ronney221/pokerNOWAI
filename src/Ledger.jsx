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
  
    // Helper: Format money amount based on current denomination
    const formatMoney = (amount) => {
      return (amount / getDivisor()).toFixed(2);
    };
  
    // Helper function to extract base name from alphanumeric pattern
    const getBaseName = (name) => {
      const match = name.match(/([A-Za-z]+)/);
      return match ? match[1].toLowerCase() : name.toLowerCase();
    };

    // Helper function to check name similarity with improved pattern matching
    const areSimilarNames = (name1, name2) => {
      const base1 = getBaseName(name1);
      const base2 = getBaseName(name2);
      
      // If base names are the same, consider them similar
      if (base1 === base2) return true;
      
      // For very short names (≤ 3 chars), require exact match
      if (name1.length <= 3 && name2.length <= 3) {
        return name1.toLowerCase() === name2.toLowerCase();
      }
      
      // Use string similarity for other cases
      return stringSimilarity.compareTwoStrings(
        name1.toLowerCase(),
        name2.toLowerCase()
      ) >= 0.7;
    };
  
    // Update the fuzzy grouping function with better pattern matching
    const groupNicknames = (names) => {
      const groups = [];
      const assigned = new Set();

      // Sort names alphabetically first
      const sortedNames = [...names].sort((a, b) => a.localeCompare(b));

      sortedNames.forEach((name) => {
        if (assigned.has(name)) return;
        
        // Create a new group for this name
        const group = [name];
        assigned.add(name);
        
        // Find similar names
        sortedNames.forEach((otherName) => {
          if (!assigned.has(otherName) && areSimilarNames(name, otherName)) {
            group.push(otherName);
            assigned.add(otherName);
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
      const newDenomination = e.target.value;
      setDenomination(newDenomination);
      
      // If we have transactions, recalculate them with the new denomination
      if (transactions.length > 0) {
        calculateSettlement();
      }
      
      // Show a toast to confirm the change
      toast.success(`Changed to ${newDenomination === 'cents' ? 'cents' : 'dollars'} denomination`);
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
  
    // Array of color classes for group icons
    const groupColors = [
      'bg-primary/20 text-primary',
      'bg-secondary/20 text-secondary',
      'bg-accent/20 text-accent',
      'bg-info/20 text-info',
      'bg-success/20 text-success',
      'bg-warning/20 text-warning'
    ];

    // Player colors for consistent coloring across the app
    const playerColors = {
      backgrounds: [
        'bg-rose-100 text-rose-700',
        'bg-amber-100 text-amber-700',
        'bg-emerald-100 text-emerald-700',
        'bg-sky-100 text-sky-700',
        'bg-violet-100 text-violet-700',
        'bg-fuchsia-100 text-fuchsia-700',
        'bg-lime-100 text-lime-700',
        'bg-cyan-100 text-cyan-700',
        'bg-indigo-100 text-indigo-700',
        'bg-orange-100 text-orange-700'
      ],
      icons: [
        'bg-rose-500/10 text-rose-500',
        'bg-amber-500/10 text-amber-500',
        'bg-emerald-500/10 text-emerald-500',
        'bg-sky-500/10 text-sky-500',
        'bg-violet-500/10 text-violet-500',
        'bg-fuchsia-500/10 text-fuchsia-500',
        'bg-lime-500/10 text-lime-500',
        'bg-cyan-500/10 text-cyan-500',
        'bg-indigo-500/10 text-indigo-500',
        'bg-orange-500/10 text-orange-500'
      ]
    };

    // Helper function to get consistent color for a player
    const getPlayerColorIndex = (playerName, playerList) => {
      return playerList.indexOf(playerName) % playerColors.backgrounds.length;
    };

    // Helper function to determine amount size category based on min/max values
    const getAmountSizeClass = (amount, transactions) => {
      const amounts = transactions.map(t => parseFloat(t.amount));
      const min = Math.min(...amounts);
      const max = Math.max(...amounts);
      const range = max - min;
      
      // Define 5 thresholds with exponential scaling for better visual distinction
      const threshold1 = min + (range * 0.15);  // 15%
      const threshold2 = min + (range * 0.35);  // 35%
      const threshold3 = min + (range * 0.60);  // 60%
      const threshold4 = min + (range * 0.85);  // 85%
      
      const currentAmount = parseFloat(amount);
      
      if (currentAmount >= threshold4) {
        return 'text-3xl font-bold tracking-tight scale-105 transition-all'; // Largest (85-100%)
      } else if (currentAmount >= threshold3) {
        return 'text-2xl font-bold transition-all'; // Large (60-85%)
      } else if (currentAmount >= threshold2) {
        return 'text-xl font-semibold transition-all'; // Medium (35-60%)
      } else if (currentAmount >= threshold1) {
        return 'text-lg font-medium transition-all'; // Small-medium (15-35%)
      }
      return 'text-base transition-all'; // Smallest (0-15%)
    };

    // Add smooth scroll behavior for section navigation
    const scrollToSection = (sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    // Split a group into two groups
    const handleSplitGroup = (groupIndex, aliasToSplit) => {
      const updatedGroups = [...aliasGroups];
      const currentGroup = updatedGroups[groupIndex];
      
      // Remove the alias from the current group
      const remainingAliases = currentGroup.group.filter(alias => alias !== aliasToSplit);
      const splitAlias = currentGroup.group.find(alias => alias === aliasToSplit);
      
      // Update the current group
      currentGroup.group = remainingAliases;
      // Update canonical name to be the remaining alias if there's only one left
      if (remainingAliases.length === 1) {
        currentGroup.canonical = remainingAliases[0];
      }
      currentGroup.totals = remainingAliases.reduce(
        (acc, alias) => {
          const { buyIn, buyOut, stack, combined } = aliasSummary[alias];
          return {
            buyIn: acc.buyIn + buyIn,
            buyOut: acc.buyOut + buyOut,
            stack: acc.stack + stack,
            combined: acc.combined + combined,
          };
        },
        { buyIn: 0, buyOut: 0, stack: 0, combined: 0 }
      );

      // Create a new group for the split alias
      const newGroup = {
        group: [splitAlias],
        canonical: splitAlias, // Set canonical name to the split alias
        totals: {
          buyIn: aliasSummary[splitAlias].buyIn,
          buyOut: aliasSummary[splitAlias].buyOut,
          stack: aliasSummary[splitAlias].stack,
          combined: aliasSummary[splitAlias].combined,
        }
      };

      // Add the new group
      updatedGroups.push(newGroup);
      setAliasGroups(updatedGroups);
      toast.success(`Split "${splitAlias}" into a separate group`);
    };
  
    // Add new function to handle drag end
    const onDragEnd = (result) => {
      if (!result.destination) return;
      
      const sourceIndex = result.source.index;
      const destIndex = result.destination.index;
      
      // If dropped on itself, do nothing
      if (sourceIndex === destIndex) return;
      
      const updatedGroups = [...aliasGroups];
      const sourceGroup = updatedGroups[sourceIndex];
      const destGroup = updatedGroups[destIndex];
      
      // Merge the groups
      const mergedGroup = {
        group: [...new Set([...sourceGroup.group, ...destGroup.group])],
        canonical: destGroup.canonical,
        totals: {
          buyIn: sourceGroup.totals.buyIn + destGroup.totals.buyIn,
          buyOut: sourceGroup.totals.buyOut + destGroup.totals.buyOut,
          stack: sourceGroup.totals.stack + destGroup.totals.stack,
          combined: sourceGroup.totals.combined + destGroup.totals.combined,
        }
      };
      
      // Remove both groups and add the merged one
      updatedGroups.splice(sourceIndex, 1);
      updatedGroups.splice(destIndex > sourceIndex ? destIndex - 1 : destIndex, 1);
      updatedGroups.push(mergedGroup);
      
      // Sort alphabetically
      updatedGroups.sort((a, b) => a.canonical.localeCompare(b.canonical));
      
      setAliasGroups(updatedGroups);
      toast.success('Groups merged successfully');
    };
  
    return (
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageTransitionVariants}
        className="min-h-screen bg-gradient-to-b from-base-100 to-base-200/50 pt-24 pb-20"
      >

        <div className="container mx-auto px-4 pt-8">
          {/* Hero Header with enhanced visual hierarchy */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center mb-16"
          >
            <motion.div 
              variants={itemVariants}
              className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/5 text-primary mb-6"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium">Poker Session Calculator</span>
            </motion.div>
            
            <motion.h1 
              variants={itemVariants}
              className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
            >
              Calculate Your PokerNow Settlements
            </motion.h1>
            <motion.p 
              variants={itemVariants}
              className="text-lg text-base-content/70 max-w-2xl mx-auto"
            >
              Upload your Ledger CSV, verify player names, and get optimal settlement calculations in seconds.
            </motion.p>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            className="max-w-4xl mx-auto space-y-12"
          >
            {/* File Upload Section with enhanced visual feedback */}
            <div className={`space-y-6 ${aliasGroups.length > 0 ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">Upload Session Data</h2>
                  <p className="text-base-content/70 mt-1">Start by uploading your poker session CSV file</p>
                </div>
              </div>

              <div 
                className={`group relative overflow-hidden rounded-2xl transition-all duration-300
                  ${isDragging 
                    ? 'bg-primary/5 border-primary border-opacity-50' 
                    : 'bg-base-200/50 hover:bg-base-200 border-base-300'
                  } 
                  border-2 border-dashed cursor-pointer`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleDropAreaClick}
              >
                {/* Upload Animation */}
                <div className={`absolute inset-0 bg-primary/5 transition-transform duration-700 ease-out
                  ${isDragging ? 'translate-y-0' : 'translate-y-full'}`} />
                
                <div className="relative z-10 flex flex-col items-center px-6 py-16">
                  <div className="w-20 h-20 mb-6">
                    <motion.div 
                      animate={isDragging ? { scale: 1.1, y: -10 } : { scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className={`w-full h-full rounded-2xl flex items-center justify-center
                        ${isDragging ? 'bg-primary/10 text-primary' : 'bg-base-300/50 text-base-content/40'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </motion.div>
                  </div>

                  <div className="text-center max-w-sm">
                    <motion.div
                      animate={isDragging ? { scale: 1.05 } : { scale: 1 }}
                      className="text-xl font-medium mb-2"
                    >
                      {isDragging ? 'Drop to upload' : 'Drop your CSV file here'}
                    </motion.div>
                    <p className="text-base-content/60 mb-4">or click to browse</p>
                    
                    {/* Required Columns Info */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-base-200/50">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-base-content/70">
                        Required: <code className="text-primary">player_nickname</code>, <code className="text-primary">buy_in</code>, <code className="text-primary">buy_out</code>, <code className="text-primary">stack</code>
                      </span>
                    </div>
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

            {/* Step 2: Select Denomination (Only show after CSV is uploaded) */}
            {aliasGroups.length > 0 && !groupingConfirmed && (
              <div className="mt-10 border-t border-base-200 pt-10">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-4">
                    <span className="text-lg font-bold">2</span>
                  </div>
                  <h2 className="text-2xl font-semibold">Select Game Denomination</h2>
                </div>
                
                <p className="text-base-content/70 pl-14 mb-6">
                  Choose whether your poker game is played with cents (100 cents = $1) or dollars.
                  This will affect how the amounts are displayed and calculated.
                </p>
                
                <div className="pl-14">
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
                
                <div className="pl-14 mb-6">
                  <p className="text-base-content/70">
                    Review and confirm player names. Similar names have been grouped together.
                    Remove the name from the groupings for incorrectly matched names.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {aliasGroups.map((groupObj, index) => {
                    const hasMultipleNames = groupObj.group.length > 1;
                    const profit = groupObj.totals.combined - groupObj.totals.buyIn;
                    // Use the first alias as a stable ID
                    const stableId = `group-${groupObj.group[0]}`;
                    
                    return (
                      <motion.div
                        key={stableId}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`card ${hasMultipleNames ? 'bg-primary/5 border border-primary/20' : 'bg-base-200'} 
                          shadow-xl hover:shadow-2xl transition-all duration-300`}
                      >
                        <div className="card-body p-6">
                          {/* Header with Stats */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                                ${groupColors[index % groupColors.length]}`}
                              >
                                <span className="text-lg font-bold">{index + 1}</span>
                              </div>
                              <div>
                                <h3 className="font-medium">Group #{index + 1}</h3>
                                <p className="text-sm opacity-70">{groupObj.group.length} {groupObj.group.length === 1 ? 'alias' : 'aliases'}</p>
                              </div>
                            </div>
                            <div className={`px-3 py-1.5 rounded-full
                              ${profit >= 0 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' 
                                : 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'}
                              border border-current border-opacity-10
                              font-semibold text-right text-base`}>
                              ${formatMoney(profit)}
                            </div>
                          </div>

                          {/* Aliases Section */}
                          <div className="bg-base-100/50 rounded-xl p-4 mb-4">
                            <div className="text-sm font-medium mb-2">Aliases</div>
                            <div className="flex flex-wrap gap-2">
                              {groupObj.group.map((alias, i) => (
                                <div 
                                  key={i} 
                                  className="group relative inline-flex items-center gap-1 bg-base-200/70 hover:bg-base-200 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  <span>{alias}</span>
                                  {hasMultipleNames && (
                                    <button
                                      onClick={() => handleSplitGroup(index, alias)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-error hover:text-error-content"
                                      title="Split this name into a separate group"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Financial Summary */}
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-base-100/50 rounded-xl p-4">
                              <div className="text-sm opacity-70 mb-1">Buy-in</div>
                              <div className="text-lg font-semibold">${formatMoney(groupObj.totals.buyIn)}</div>
                            </div>
                            <div className="bg-base-100/50 rounded-xl p-4">
                              <div className="text-sm opacity-70 mb-1">Cash-out</div>
                              <div className="text-lg font-semibold">${formatMoney(groupObj.totals.combined)}</div>
                            </div>
                          </div>

                          {/* Player Name Input */}
                          <div className="form-control">
                            <label className="label">
                              <span className="label-text font-medium">Player Name</span>
                              {hasMultipleNames && (
                                <span className="label-text-alt text-primary animate-pulse">
                                  Multiple aliases detected
                                </span>
                              )}
                            </label>
                            <input
                              type="text"
                              value={groupObj.canonical}
                              onChange={(e) => handleCanonicalChange(index, e.target.value)}
                              className="input input-bordered w-full"
                              placeholder="Enter player name"
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4 mt-8">
                  <button
                    onClick={confirmGrouping}
                    className="btn btn-primary"
                  >
                    Confirm Player Names
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Confirmed groupings displayed in a table */}
            {groupingConfirmed && (
              <div className="mt-10 border-t border-base-200 pt-10">                    
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold">Review Player Data</h2>
                    <p className="text-base-content/70 mt-1">Verify player results before calculating settlements</p>
                  </div>
                </div>

                {/* Session Name Input */}
                <div className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200 mb-8">
                  <div className="card-body">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <label className="label">
                          <span className="label-text font-medium">Session Name</span>
                        </label>
                        <input 
                          type="text"
                          value={sessionName}
                          onChange={(e) => setSessionName(e.target.value)}
                          className="input input-bordered w-full"
                          placeholder="Name this poker session"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Denomination Selection */}
                <div className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200 mb-8">
                  <div className="card-body">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <label className="label">
                          <span className="label-text font-medium">Game Denomination</span>
                        </label>
                        <div className="flex gap-4">
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
                  </div>
                </div>

                {/* Players Summary */}
                <motion.div 
                  className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="card-body p-8">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-base-200/50 rounded-xl p-4">
                        <div className="text-sm text-base-content/70 mb-1">Total Players</div>
                        <div className="text-2xl font-semibold">{aggregatedGroups().length}</div>
                      </div>
                      <div className="bg-base-200/50 rounded-xl p-4">
                        <div className="text-sm text-base-content/70 mb-1">Total Buy-in</div>
                        <div className="text-2xl font-semibold">
                          ${formatMoney(aggregatedGroups().reduce((sum, [_, { totals }]) => sum + totals.buyIn, 0))}
                        </div>
                      </div>
                      <div className="bg-base-200/50 rounded-xl p-4">
                        <div className="text-sm text-base-content/70 mb-1">Total Cash-out</div>
                        <div className="text-2xl font-semibold">
                          ${formatMoney(aggregatedGroups().reduce((sum, [_, { totals }]) => sum + totals.combined, 0))}
                        </div>
                      </div>
                    </div>

                    {/* Players List */}
                    <div className="space-y-4">
                      {(() => {
                        // Sort players by profit (highest to lowest)
                        const sortedGroups = aggregatedGroups().sort((a, b) => {
                          const profitA = a[1].totals.combined - a[1].totals.buyIn;
                          const profitB = b[1].totals.combined - b[1].totals.buyIn;
                          return profitB - profitA;
                        });

                        return sortedGroups.map(([playerName, { aliases, totals }], index) => {
                          const profit = totals.combined - totals.buyIn;
                          return (
                            <motion.div 
                              key={playerName}
                              className="group relative overflow-hidden"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              {/* Background decoration */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-base-200/0 to-base-200/5 
                                opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              
                              <div className="relative flex items-center gap-4 p-6 rounded-2xl bg-base-200/30 hover:bg-base-200/40 
                                transition-all duration-300">
                                {/* Player Icon and Name */}
                                <div className="flex-1">
                                  <motion.div 
                                    className="inline-flex items-center gap-3"
                                    whileHover={{ x: 5 }}
                                  >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                                      ${playerColors.icons[index % playerColors.icons.length]}`}>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                    </div>
                                    <div>
                                      {Array.from(aliases).length === 1 ? (
                                        <div className="font-medium text-lg">{playerName}</div>
                                      ) : (
                                        <>
                                          <div className="font-medium text-lg">{playerName}</div>
                                          <div className="text-sm text-base-content/70 flex flex-wrap gap-1 mt-1">
                                            {Array.from(aliases).map((alias, i) => (
                                              <span key={i} className="badge badge-sm badge-ghost">{alias}</span>
                                            ))}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </motion.div>
                                </div>

                                {/* Financial Info */}
                                <div className="flex items-center gap-8">
                                  <div className="text-right">
                                    <div className="text-sm text-base-content/70">Buy-in</div>
                                    <div className="font-medium">${formatMoney(totals.buyIn)}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm text-base-content/70">Cash-out</div>
                                    <div className="font-medium">${formatMoney(totals.combined)}</div>
                                  </div>
                                  <div className={`px-3 py-1.5 rounded-full
                                    ${profit >= 0 
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' 
                                      : 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'}
                                    border border-current border-opacity-10
                                    font-semibold text-right text-base`}>
                                    ${formatMoney(profit)}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </motion.div>

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
              <div className="mt-10 border-t border-base-200 pt-10" id="settlements">
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold">Settlement Plan</h2>
                    <p className="text-base-content/70 mt-1">Optimized payment plan to settle all debts</p>
                  </div>
                </div>

                <motion.div 
                  className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200 overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="card-body p-8">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-base-200/50 rounded-xl p-4">
                        <div className="text-sm text-base-content/70 mb-1">Total Transactions</div>
                        <div className="text-2xl font-semibold">{transactions.length}</div>
                      </div>
                      <div className="bg-base-200/50 rounded-xl p-4">
                        <div className="text-sm text-base-content/70 mb-1">Total Amount</div>
                        <div className="text-2xl font-semibold">
                          ${formatMoney(transactions.reduce((sum, t) => {
                            const amount = denomination === 'cents' 
                              ? parseFloat(t.amount) * 100  // Convert to cents for cents games
                              : parseFloat(t.amount);
                            return sum + amount;
                          }, 0))}
                        </div>
                      </div>
                      <div className="bg-base-200/50 rounded-xl p-4">
                        <div className="text-sm text-base-content/70 mb-1">Average Payment</div>
                        <div className="text-2xl font-semibold">
                          ${formatMoney(transactions.reduce((sum, t) => {
                            const amount = denomination === 'cents' 
                              ? parseFloat(t.amount) * 100  // Convert to cents for cents games
                              : parseFloat(t.amount);
                            return sum + amount;
                          }, 0) / transactions.length)}
                        </div>
                      </div>
                    </div>

                    {/* Transactions List */}
                    <div className="space-y-4">
                      {(() => {
                        const uniquePlayers = [...new Set(transactions.flatMap(t => [t.from, t.to]))];
                        
                        return transactions.map((t, index) => (
                          <motion.div 
                            key={index}
                            className="group relative overflow-hidden"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            {/* Background decoration */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-base-200/0 to-base-200/5 
                              opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            <div className="relative flex items-center gap-4 p-6 rounded-2xl bg-base-200/30 hover:bg-base-200/40 
                              transition-all duration-300">
                              {/* From Player */}
                              <div className="flex-1">
                                <motion.div 
                                  className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-base-100/80"
                                  whileHover={{ x: 5 }}
                                >
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center 
                                    ${playerColors.icons[getPlayerColorIndex(t.from, uniquePlayers)]}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                  </div>
                                  <span className="font-medium">{t.from}</span>
                                </motion.div>
                              </div>

                              {/* Arrow and Amount */}
                              <div className="flex items-center gap-4">
                                <motion.div 
                                  className="h-[2px] w-12 bg-base-content/10"
                                  initial={{ scaleX: 0 }}
                                  animate={{ scaleX: 1 }}
                                  transition={{ delay: index * 0.1 + 0.2 }}
                                />
                                
                                <motion.div 
                                  className={`${getAmountSizeClass(t.amount, transactions)} 
                                    px-6 py-2 rounded-full bg-emerald-500/10 text-emerald-600
                                    dark:bg-emerald-500/20 dark:text-emerald-400
                                    border border-emerald-500/10 dark:border-emerald-400/10
                                    shadow-sm backdrop-blur-sm text-center
                                    group-hover:scale-105 transition-transform duration-300`}
                                >
                                  ${t.amount}
                                </motion.div>
                                
                                <motion.div 
                                  className="h-[2px] w-12 bg-base-content/10"
                                  initial={{ scaleX: 0 }}
                                  animate={{ scaleX: 1 }}
                                  transition={{ delay: index * 0.1 + 0.2 }}
                                />
                              </div>

                              {/* To Player */}
                              <div className="flex-1 flex justify-end">
                                <motion.div 
                                  className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-base-100/80"
                                  whileHover={{ x: -5 }}
                                >
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center 
                                    ${playerColors.icons[getPlayerColorIndex(t.to, uniquePlayers)]}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                  </div>
                                  <span className="font-medium">{t.to}</span>
                                </motion.div>
                              </div>
                            </div>
                          </motion.div>
                        ));
                      })()}
                    </div>
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4 mt-8">
                  {currentUser ? (
                    !ledgerSaved ? (
                      <motion.button
                        onClick={handleSaveLedger}
                        disabled={saving}
                        className={`btn btn-primary btn-lg gap-2 min-w-[200px] ${saving ? 'loading' : ''}`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {saving ? 'Saving...' : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            Save Ledger
                          </>
                        )}
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={viewSavedLedgers}
                        className="btn btn-primary btn-lg gap-2 min-w-[200px]"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Saved Ledgers
                      </motion.button>
                    )
                  ) : (
                    <div className="card bg-base-100 shadow-lg border border-base-300 p-6">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-xl bg-info/10 text-info flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">Want to save this ledger?</h3>
                          <p className="text-base-content/70 text-sm mt-1">
                            Sign in to save your ledger data and track your poker progress.
                          </p>
                        </div>
                        <motion.button
                          onClick={() => setCurrentPage('login')}
                          className="btn btn-primary"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Sign In
                        </motion.button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    );
};

export default Ledger;