import React, { useMemo } from 'react';
import { format } from 'date-fns';

const AnalyticsPanel = ({ data }) => {
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Convert amounts to dollars
    const sessions = data.map(session => ({
      ...session,
      profit: session.profit / 100,
      buyIn: session.buyIn / 100,
      cashOut: session.cashOut / 100,
      date: new Date(session.sessionDate)
    }));

    // Sort sessions by date
    const sortedSessions = [...sessions].sort((a, b) => a.date - b.date);

    // Calculate streaks and performance metrics
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let bestWinStreak = { count: 0, profit: 0, sessions: [] };
    let worstLossStreak = { count: 0, profit: 0, sessions: [] };

    // Track current streaks
    let tempWinStreak = { count: 0, profit: 0, sessions: [] };
    let tempLossStreak = { count: 0, profit: 0, sessions: [] };

    sortedSessions.forEach(session => {
      if (session.profit > 0) {
        // Handle win
        currentWinStreak++;
        currentLossStreak = 0;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);

        // Update temp win streak
        tempWinStreak.count++;
        tempWinStreak.profit += session.profit;
        tempWinStreak.sessions.push(session);

        // Reset temp loss streak
        tempLossStreak = { count: 0, profit: 0, sessions: [] };

        // Update best win streak if better
        if (tempWinStreak.profit > bestWinStreak.profit) {
          bestWinStreak = { ...tempWinStreak };
        }
      } else if (session.profit < 0) {
        // Handle loss
        currentLossStreak++;
        currentWinStreak = 0;
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak);

        // Update temp loss streak
        tempLossStreak.count++;
        tempLossStreak.profit += session.profit;
        tempLossStreak.sessions.push(session);

        // Reset temp win streak
        tempWinStreak = { count: 0, profit: 0, sessions: [] };

        // Update worst loss streak if worse
        if (tempLossStreak.profit < worstLossStreak.profit) {
          worstLossStreak = { ...tempLossStreak };
        }
      } else {
        // Handle break-even (reset both streaks)
        currentWinStreak = 0;
        currentLossStreak = 0;
        tempWinStreak = { count: 0, profit: 0, sessions: [] };
        tempLossStreak = { count: 0, profit: 0, sessions: [] };
      }
    });

    // Calculate win rate and other metrics
    const winCount = sessions.filter(s => s.profit > 0).length;
    const lossCount = sessions.filter(s => s.profit < 0).length;
    const breakEvenCount = sessions.filter(s => s.profit === 0).length;
    const winRate = (winCount / sessions.length) * 100;

    // Find biggest win and loss
    const biggestWin = sessions.reduce((max, session) => 
      session.profit > max.profit ? session : max
    , { profit: -Infinity });

    const biggestLoss = sessions.reduce((min, session) => 
      session.profit < min.profit ? session : min
    , { profit: Infinity });

    // Calculate average win and loss
    const wins = sessions.filter(s => s.profit > 0);
    const losses = sessions.filter(s => s.profit < 0);
    const avgWin = wins.reduce((sum, s) => sum + s.profit, 0) / wins.length;
    const avgLoss = losses.reduce((sum, s) => sum + s.profit, 0) / losses.length;

    return {
      totalSessions: sessions.length,
      winCount,
      lossCount,
      breakEvenCount,
      winRate,
      maxWinStreak,
      maxLossStreak,
      bestWinStreak,
      worstLossStreak,
      biggestWin,
      biggestLoss,
      avgWin,
      avgLoss
    };
  }, [data]);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Win Streaks Card */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title text-lg mb-4">Winning Streaks</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Longest Win Streak</p>
              <p className="text-2xl font-bold text-success">
                {stats.maxWinStreak} Sessions
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Most Profitable Streak</p>
              <p className="text-2xl font-bold text-success">
                ${stats.bestWinStreak.profit.toFixed(2)}
              </p>
              <p className="text-xs text-base-content/60">
                {stats.bestWinStreak.count} sessions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recovery Opportunities Card */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title text-lg mb-4">Recovery Opportunities</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Longest Loss Streak</p>
              <p className="text-2xl font-bold text-error">
                {stats.maxLossStreak} Sessions
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Biggest Drawdown</p>
              <p className="text-2xl font-bold text-error">
                ${Math.abs(stats.worstLossStreak.profit).toFixed(2)}
              </p>
              <p className="text-xs text-base-content/60">
                {stats.worstLossStreak.count} sessions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Insights Card */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title text-lg mb-4">Performance Insights</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-1">Win Rate</p>
                <p className="text-2xl font-bold">
                  {stats.winRate.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Total Sessions</p>
                <p className="text-2xl font-bold">
                  {stats.totalSessions}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Average Win</p>
              <p className="text-lg font-semibold text-success">
                ${stats.avgWin.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Average Loss</p>
              <p className="text-lg font-semibold text-error">
                ${Math.abs(stats.avgLoss).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel; 