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
  
  // First, generate buy-ins for all players
  let totalBuyIn = 0;
  selectedNames.forEach(name => {
    const buyIn = Math.floor(Math.random() * 400 + 100); // $100-$500 buy-in
    totalBuyIn += buyIn;
    players.push({ name, buyIn, cashOut: 0 });
  });

  // Then, distribute the total buy-in amount among players for cash-outs
  let remainingAmount = totalBuyIn;
  for (let i = 0; i < players.length - 1; i++) {
    // For all but the last player, assign a random cash-out
    const maxCashOut = remainingAmount - (players.length - i - 1) * 50; // Ensure at least $50 left for each remaining player
    const minCashOut = 0;
    const cashOut = Math.floor(Math.random() * (maxCashOut - minCashOut)) + minCashOut;
    players[i].cashOut = cashOut;
    remainingAmount -= cashOut;
  }
  // Last player gets the remaining amount to ensure total cash-out equals total buy-in
  players[players.length - 1].cashOut = remainingAmount;
  
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
          amount: amount.toFixed(2)
        });
        remainingToPay -= amount;
      }
    });

    // If there's still remaining amount due to rounding, add it to the last transaction
    if (remainingToPay > 0 && transactions.length > 0) {
      const lastTx = transactions[transactions.length - 1];
      if (lastTx.from === loser.name) {
        lastTx.amount = (parseFloat(lastTx.amount) + remainingToPay).toFixed(2);
      }
    }
  });

  return transactions;
};

export default generateDemoLedgers; 