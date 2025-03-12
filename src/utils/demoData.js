import { subDays, addDays } from 'date-fns';

const generateDemoData = () => {
  const today = new Date();
  const startDate = subDays(today, 30); // Start from 30 days ago
  const sessions = [];
  
  // Generate 15 sessions over the last 30 days
  for (let i = 0; i < 15; i++) {
    const sessionDate = addDays(startDate, Math.floor(Math.random() * 30));
    const buyIn = Math.floor(Math.random() * 500 + 100) * 100; // Random buy-in between $100-$600
    const profitMultiplier = (Math.random() * 2 - 0.5); // Random multiplier between -0.5 and 1.5
    const cashOut = Math.max(0, Math.floor(buyIn * (1 + profitMultiplier)));
    const profit = cashOut - buyIn;
    
    sessions.push({
      _id: `demo-${i}`,
      sessionName: `Demo Session ${i + 1}`,
      playerName: 'Demo Player',
      sessionDate: sessionDate.toISOString(),
      buyIn,
      cashOut,
      profit,
      denomination: 'dollars',
      createdAt: sessionDate.toISOString(),
      isDemo: true
    });
  }
  
  // Sort by date (most recent first)
  return sessions.sort((a, b) => new Date(b.sessionDate) - new Date(a.sessionDate));
};

export default generateDemoData; 