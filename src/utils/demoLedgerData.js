import { subDays, addDays } from 'date-fns';

const generateDemoLedgers = () => {
  const today = new Date();
  const startDate = subDays(today, 30); // Start from 30 days ago
  const ledgers = [];
  
  // Generate 5 demo ledgers
  for (let i = 0; i < 5; i++) {
    const sessionDate = addDays(startDate, Math.floor(Math.random() * 30));
    const players = generateDemoPlayers();
    const transactions = generateDemoTransactions(players);
    
    ledgers.push({
      _id: `demo-ledger-${i}`,
      sessionName: `Demo Game ${i + 1}`,
      sessionDate: sessionDate.toISOString(),
      players,
      transactions,
      denomination: 'dollars',
      createdAt: sessionDate.toISOString(),
      isDemo: true
    });
  }
  
  // Sort by date (most recent first)
  return ledgers.sort((a, b) => new Date(b.sessionDate) - new Date(a.sessionDate));
};

const generateDemoPlayers = () => {
  const playerNames = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank'];
  const numPlayers = Math.floor(Math.random() * 3) + 4; // 4-6 players
  const players = [];
  
  // Shuffle and take random number of players
  const selectedNames = playerNames
    .sort(() => Math.random() - 0.5)
    .slice(0, numPlayers);
  
  selectedNames.forEach(name => {
    const buyIn = Math.floor(Math.random() * 400 + 100); // $100-$500 buy-in
    const profitMultiplier = (Math.random() * 2 - 0.5); // Random multiplier between -0.5 and 1.5
    const cashOut = Math.max(0, Math.floor(buyIn * (1 + profitMultiplier)));
    
    players.push({
      name,
      buyIn,
      cashOut
    });
  });
  
  return players;
};

const generateDemoTransactions = (players) => {
  const transactions = [];
  
  // Find winners and losers
  const winners = players.filter(p => p.cashOut > p.buyIn)
    .map(p => ({ ...p, toReceive: p.cashOut - p.buyIn }));
  const losers = players.filter(p => p.cashOut < p.buyIn)
    .map(p => ({ ...p, toPay: p.buyIn - p.cashOut }));

  // For each loser, distribute their losses among winners proportionally
  losers.forEach(loser => {
    let remainingToPay = loser.toPay;
    const totalWinnings = winners.reduce((sum, w) => sum + w.toReceive, 0);

    winners.forEach((winner, index) => {
      if (remainingToPay <= 0) return;

      // Calculate this winner's share of the loss
      const proportion = winner.toReceive / totalWinnings;
      const amount = Math.min(
        remainingToPay,
        Math.round(loser.toPay * proportion)
      );

      if (amount > 0) {
        transactions.push({
          from: loser.name,
          to: winner.name,
          amount: amount
        });
        remainingToPay -= amount;
      }
    });

    // If there's still remaining amount due to rounding, add it to the last transaction
    if (remainingToPay > 0 && transactions.length > 0) {
      const lastTx = transactions[transactions.length - 1];
      if (lastTx.from === loser.name) {
        lastTx.amount += remainingToPay;
      }
    }
  });

  return transactions;
};

export default generateDemoLedgers; 