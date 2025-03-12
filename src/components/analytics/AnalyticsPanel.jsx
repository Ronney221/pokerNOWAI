import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const AnalyticsPanel = ({ data }) => {
  // Helper function to format money
  const formatMoney = (amount) => {
    return (amount / 100).toFixed(2);
  };

  // Helper function to format date
  const formatDate = (date) => {
    return format(new Date(date), 'MMM d, yyyy');
  };

  // Helper function to calculate streak profit
  const calculateStreakProfit = (streak) => {
    return streak.reduce((acc, session) => acc + session.profit, 0);
  };

  // Calculate statistics including streaks
  const calculateStats = () => {
    if (!data || data.length === 0) return {
      winningStreak: [],
      losingStreak: [],
      biggestWin: null,
      biggestLoss: null
    };

    let currentWinStreak = [];
    let currentLossStreak = [];
    let longestWinStreak = [];
    let longestLossStreak = [];
    let biggestWin = null;
    let biggestLoss = null;

    // Sort sessions by date
    const sortedSessions = [...data].sort((a, b) => 
      new Date(a.sessionDate) - new Date(b.sessionDate)
    );

    sortedSessions.forEach(session => {
      // Track biggest win/loss
      if (!biggestWin || session.profit > biggestWin.profit) {
        biggestWin = session;
      }
      if (!biggestLoss || session.profit < biggestLoss.profit) {
        biggestLoss = session;
      }

      // Track streaks
      if (session.profit > 0) {
        currentWinStreak.push(session);
        if (currentLossStreak.length > longestLossStreak.length) {
          longestLossStreak = [...currentLossStreak];
        }
        currentLossStreak = [];
      } else if (session.profit < 0) {
        currentLossStreak.push(session);
        if (currentWinStreak.length > longestWinStreak.length) {
          longestWinStreak = [...currentWinStreak];
        }
        currentWinStreak = [];
      }
    });

    // Check final streaks
    if (currentWinStreak.length > longestWinStreak.length) {
      longestWinStreak = currentWinStreak;
    }
    if (currentLossStreak.length > longestLossStreak.length) {
      longestLossStreak = currentLossStreak;
    }

    return {
      winningStreak: longestWinStreak,
      losingStreak: longestLossStreak,
      biggestWin,
      biggestLoss
    };
  };

  return (
    <>
      {data.length > 0 && (
        <motion.div 
          variants={itemVariants}
          className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Winning Streaks Card */}
          <motion.div 
            className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200"
            whileHover={{ y: -5 }}
          >
            <div className="card-body">
              <h3 className="text-xl font-bold flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-success/5 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-success/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                Winning Streaks
              </h3>
              
              <div className="space-y-6">
                {/* Longest Win Streak */}
                <div className="bg-base-200/50 rounded-xl p-4">
                  <div className="text-sm text-base-content/70 mb-2">Longest Win Streak</div>
                  {calculateStats().winningStreak.length > 0 ? (
                    <>
                      <div className="text-2xl font-bold text-success mb-2">
                        {calculateStats().winningStreak.length} Sessions 🔥
                      </div>
                      <div className="text-sm opacity-70">
                        {formatDate(calculateStats().winningStreak[0].sessionDate)} - {formatDate(calculateStats().winningStreak[calculateStats().winningStreak.length - 1].sessionDate)}
                      </div>
                      <div className="text-success font-semibold mt-2 opacity-90">
                        Total Profit: ${formatMoney(calculateStreakProfit(calculateStats().winningStreak))} 💰
                      </div>
                    </>
                  ) : (
                    <div className="text-base opacity-70">No winning streak yet 🎲</div>
                  )}
                </div>

                {/* Biggest Single Win */}
                <div className="bg-base-200/50 rounded-xl p-4">
                  <div className="text-sm text-base-content/70 mb-2">Biggest Single Win</div>
                  {calculateStats().biggestWin ? (
                    <>
                      <div className="text-2xl font-bold text-success/90 mb-2">
                        ${formatMoney(calculateStats().biggestWin.profit)} 🎯
                      </div>
                      <div className="text-sm opacity-70">
                        {calculateStats().biggestWin.sessionName || 'Unnamed Game'}
                      </div>
                      <div className="text-sm opacity-70">
                        {formatDate(calculateStats().biggestWin.sessionDate)}
                      </div>
                    </>
                  ) : (
                    <div className="text-base opacity-70">No wins recorded yet 🎲</div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Losing Streaks Card */}
          <motion.div 
            className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200"
            whileHover={{ y: -5 }}
          >
            <div className="card-body">
              <h3 className="text-xl font-bold flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-error/5 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-error/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                  </svg>
                </div>
                Unlucky Streaks
              </h3>
              
              <div className="space-y-6">
                {/* Longest Losing Streak */}
                <div className="bg-base-200/50 rounded-xl p-4">
                  <div className="text-sm text-base-content/70 mb-2">Longest Downswing</div>
                  {calculateStats().losingStreak.length > 0 ? (
                    <>
                      <div className="text-2xl font-bold text-error/80 mb-2">
                        {calculateStats().losingStreak.length} Sessions 📉
                      </div>
                      <div className="text-sm opacity-70">
                        {formatDate(calculateStats().losingStreak[0].sessionDate)} - {formatDate(calculateStats().losingStreak[calculateStats().losingStreak.length - 1].sessionDate)}
                      </div>
                      <div className="text-error/90 font-semibold mt-2">
                        Total Loss: ${formatMoney(Math.abs(calculateStreakProfit(calculateStats().losingStreak)))} 🥶
                      </div>
                    </>
                  ) : (
                    <div className="text-base opacity-70">No losing streak yet! 🍀</div>
                  )}
                </div>

                {/* Biggest Single Loss */}
                <div className="bg-base-200/50 rounded-xl p-4">
                  <div className="text-sm text-base-content/70 mb-2">Biggest Single Loss</div>
                  {calculateStats().biggestLoss ? (
                    <>
                      <div className="text-2xl font-bold text-error/80 mb-2">
                        ${formatMoney(Math.abs(calculateStats().biggestLoss.profit))} 😅
                      </div>
                      <div className="text-sm opacity-70">
                        {calculateStats().biggestLoss.sessionName || 'Unnamed Game'}
                      </div>
                      <div className="text-sm opacity-70">
                        {formatDate(calculateStats().biggestLoss.sessionDate)}
                      </div>
                    </>
                  ) : (
                    <div className="text-base opacity-70">No losses yet! 🎰</div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Additional Statistics Card */}
          <motion.div 
            className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200 md:col-span-2"
            whileHover={{ y: -5 }}
          >
            <div className="card-body">
              <h3 className="text-xl font-bold flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                Performance Insights
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Win Rate */}
                <div className="bg-base-200/50 rounded-xl p-4">
                  <div className="text-sm text-base-content/70 mb-2">Win Rate</div>
                  <div className="text-2xl font-bold">
                    {Math.round((data.filter(session => session.profit > 0).length / data.length) * 100)}%
                  </div>
                  <div className="text-sm opacity-70">
                    {data.filter(session => session.profit > 0).length} winning sessions
                  </div>
                </div>

                {/* Average Win */}
                <div className="bg-base-200/50 rounded-xl p-4">
                  <div className="text-sm text-base-content/70 mb-2">Average Win</div>
                  <div className="text-2xl font-bold text-success/90">
                    ${formatMoney(data.filter(session => session.profit > 0).reduce((acc, session) => acc + session.profit, 0) / data.filter(session => session.profit > 0).length || 0)}
                  </div>
                  <div className="text-sm opacity-70">Per winning session</div>
                </div>

                {/* Average Loss */}
                <div className="bg-base-200/50 rounded-xl p-4">
                  <div className="text-sm text-base-content/70 mb-2">Average Loss</div>
                  <div className="text-2xl font-bold text-error/80">
                    ${formatMoney(Math.abs(data.filter(session => session.profit < 0).reduce((acc, session) => acc + session.profit, 0) / data.filter(session => session.profit < 0).length || 0))}
                  </div>
                  <div className="text-sm opacity-70">Per losing session</div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default AnalyticsPanel; 