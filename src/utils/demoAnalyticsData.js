import { subDays, addDays } from 'date-fns';

const generateDemoAnalytics = () => {
  const today = new Date();
  const startDate = subDays(today, 30); // Start from 30 days ago
  
  // Generate demo player metrics
  const playerMetrics = generatePlayerMetrics();
  
  // Generate demo hands data
  const handsData = generateHandsData();
  
  // Generate demo player ranges
  const playerRanges = generatePlayerRanges();
  
  return {
    success: true,
    data: {
      analysis: [{
        analysisId: 'demo-analysis-1',
        name: 'Demo Analysis',
        timestamp: startDate.toISOString(),
        files: {
          charts: {
            "player_metrics_chart.json": playerMetrics,
            "chart_3bet.json": [],
            "chart_raise.json": [],
            "full_shows_chart.json": []
          },
          hands: {
            "DemoPlayer_top10_wins.json": handsData.wins,
            "DemoPlayer_top10_losses.json": handsData.losses
          },
          players: {
            "Player1.json": playerRanges.player1,
            "Player2.json": playerRanges.player2,
            "Player3.json": playerRanges.player3
          }
        }
      }]
    }
  };
};

const generatePlayerMetrics = () => {
  const players = ['Player1', 'Player2', 'Player3', 'Player4', 'Player5'];
  return players.map(player => ({
    Player: player,
    "Hands Played": Math.floor(Math.random() * 200) + 100,
    "VPIP": Math.floor(Math.random() * 30) + 20,
    "VPIP %": Math.floor(Math.random() * 30) + 20,
    "Threebet": Math.floor(Math.random() * 15) + 5,
    "Threebet %": Math.floor(Math.random() * 15) + 5
  }));
};

const generateHandsData = () => {
  const cardSuits = ['♠', '♥', '♦', '♣'];
  const cardValues = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  
  const generateRandomCard = () => {
    const value = cardValues[Math.floor(Math.random() * cardValues.length)];
    const suit = cardSuits[Math.floor(Math.random() * cardSuits.length)];
    return value + suit;
  };
  
  const generateRandomCards = (count) => {
    const cards = [];
    for (let i = 0; i < count; i++) {
      let card;
      do {
        card = generateRandomCard();
      } while (cards.includes(card));
      cards.push(card);
    }
    return `[${cards.join(', ')}]`;
  };
  
  const generateHand = (isWin) => {
    const handNumber = Math.floor(Math.random() * 1000) + 1;
    const myCards = generateRandomCards(2);
    const board = generateRandomCards(5);
    const opponent = generateRandomCards(2);
    const invested = Math.floor(Math.random() * 200) + 50;
    const multiplier = isWin ? (Math.random() * 2 + 1) : (Math.random() * 0.8);
    const collected = Math.floor(invested * multiplier);
    
    return {
      "Hand Number": handNumber,
      "My Cards": myCards,
      "Flop": board,
      "Turn": board,
      "River": board,
      "Opponent": opponent,
      "Invested": invested.toFixed(2),
      "Collected": collected.toFixed(2)
    };
  };
  
  return {
    wins: Array(10).fill(null).map(() => generateHand(true)),
    losses: Array(10).fill(null).map(() => generateHand(false))
  };
};

const generatePlayerRanges = () => {
  const betLevels = ['Raise', 'Call', '3Bet', '4Bet'];
  const cardSuits = ['♠', '♥', '♦', '♣'];
  const cardValues = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  
  const generateRandomCards = () => {
    const value1 = cardValues[Math.floor(Math.random() * cardValues.length)];
    const value2 = cardValues[Math.floor(Math.random() * cardValues.length)];
    const suit1 = cardSuits[Math.floor(Math.random() * cardSuits.length)];
    const suit2 = cardSuits[Math.floor(Math.random() * cardSuits.length)];
    return `[${value1}${suit1}, ${value2}${suit2}]`;
  };
  
  const generatePlayerRange = (count) => {
    return Array(count).fill(null).map(() => ({
      Player: `Player${Math.floor(Math.random() * 3) + 1}`,
      "Bet Level": betLevels[Math.floor(Math.random() * betLevels.length)],
      "Preflop Amount": (Math.floor(Math.random() * 200) + 20).toString(),
      "Show Details": generateRandomCards()
    }));
  };
  
  return {
    player1: generatePlayerRange(15),
    player2: generatePlayerRange(15),
    player3: generatePlayerRange(15)
  };
};

export default generateDemoAnalytics; 