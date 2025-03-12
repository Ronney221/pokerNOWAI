import React, { useMemo, useState } from 'react';
import { ResponsiveCalendar } from '@nivo/calendar';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const CalendarHeatmap = ({ data }) => {
  const [selectedDay, setSelectedDay] = useState(null);

  // Process data for the calendar
  const { calendarData, stats, dateRange, minMaxValues } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        calendarData: [],
        stats: {
          totalDays: 0,
          activeDays: 0,
          profitableDays: 0,
          maxDailyProfit: 0,
          avgDailyProfit: 0
        },
        dateRange: {
          from: new Date().toISOString().split('T')[0],
          to: new Date().toISOString().split('T')[0]
        },
        minMaxValues: {
          min: 0,
          max: 0
        }
      };
    }

    // Group sessions by date and calculate daily profits
    const dailyData = data.reduce((acc, session) => {
      const date = session.sessionDate.split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          sessions: [],
          totalProfit: 0
        };
      }
      acc[date].sessions.push({
        ...session,
        profit: session.profit / 100,
        buyIn: session.buyIn / 100,
        cashOut: session.cashOut / 100
      });
      acc[date].totalProfit += session.profit / 100;
      return acc;
    }, {});

    // Convert to Nivo calendar format and calculate stats
    let totalProfit = 0;
    let profitableDays = 0;
    let maxDailyProfit = -Infinity;
    let minDailyProfit = Infinity;
    let minDate = new Date();
    let maxDate = new Date(0);

    const formattedData = Object.entries(dailyData).map(([date, dayData]) => {
      // Update statistics
      const profit = Number(dayData.totalProfit);
      totalProfit += profit;
      if (profit > 0) profitableDays++;
      maxDailyProfit = Math.max(maxDailyProfit, profit);
      minDailyProfit = Math.min(minDailyProfit, profit);

      // Update date range
      const currentDate = new Date(date);
      if (currentDate < minDate) minDate = currentDate;
      if (currentDate > maxDate) maxDate = currentDate;

      return {
        day: date,
        value: profit,
        totalProfit: profit,
        sessions: dayData.sessions
      };
    });

    // Calculate total days in range (inclusive)
    const totalDaysInRange = Math.floor((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;

    return {
      calendarData: formattedData,
      stats: {
        totalDays: totalDaysInRange,
        activeDays: formattedData.length,
        profitableDays,
        maxDailyProfit,
        avgDailyProfit: totalProfit / formattedData.length
      },
      dateRange: {
        from: minDate.toISOString().split('T')[0],
        to: maxDate.toISOString().split('T')[0]
      },
      minMaxValues: {
        min: minDailyProfit,
        max: maxDailyProfit
      }
    };
  }, [data]);

  // Custom tooltip component
  const CustomTooltip = ({ day, value, data }) => {
    if (!day) return null;

    // Get sessions from the data object
    const sessions = Array.isArray(data?.sessions) ? data.sessions : [];
    
    // Ensure we have a numeric value
    let numericValue = 0;
    try {
      numericValue = Number(value);
      if (isNaN(numericValue)) {
        numericValue = Number(data?.totalProfit) || 0;
      }
    } catch {
      numericValue = 0;
    }
    
    return (
      <div className="card bg-base-100 shadow-xl p-4 border border-base-200">
        <p className="font-semibold mb-2">
          {format(parseISO(day), 'MMMM d, yyyy')}
        </p>
        {sessions.length > 0 ? (
          <>
            <p className="text-sm mb-1">
              Sessions: {sessions.length}
            </p>
            <p className={`text-sm font-semibold ${numericValue >= 0 ? 'text-success' : 'text-error'}`}>
              Net Profit: ${numericValue.toFixed(2)}
            </p>
            <div className="mt-2 border-t pt-2">
              <p className="text-sm font-semibold mb-1">Session Details:</p>
              <div className="max-h-32 overflow-y-auto">
                {sessions.map((session, idx) => (
                  <div key={idx} className="text-xs mb-1">
                    <span className="font-medium">{session.sessionName}</span>
                    <span className={Number(session.profit) >= 0 ? 'text-success' : 'text-error'}>
                      {' '}(${Number(session.profit).toFixed(2)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-base-content/60">No sessions</p>
        )}
      </div>
    );
  };

  return (
    <div className="h-full">
      {/* Stats */}
      <motion.div 
        className="flex flex-wrap items-center justify-between gap-4 mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 text-sm">
          <span className="text-error font-medium">${minMaxValues.min.toFixed(2)}</span>
          <div className="w-32 h-2 rounded-full bg-gradient-to-r from-error via-base-200 to-success"></div>
          <span className="text-success font-medium">${minMaxValues.max.toFixed(2)}</span>
        </div>
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Activity Rate</div>
            <div className="stat-value">
              {((stats.activeDays / stats.totalDays) * 100).toFixed(1)}%
            </div>
            <div className="stat-desc">
              {stats.activeDays} days played out of {stats.totalDays} days
            </div>
          </div>
          <div className="stat">
            <div className="stat-title">Win Rate</div>
            <div className="stat-value text-success">
              {((stats.profitableDays / stats.activeDays) * 100).toFixed(1)}%
            </div>
            <div className="stat-desc">
              {stats.profitableDays} profitable days
            </div>
          </div>
        </div>
      </motion.div>

      {/* Calendar */}
      <div className="h-[calc(100%-4rem)] w-full">
        <ResponsiveCalendar
          data={calendarData}
          from={dateRange.from}
          to={dateRange.to}
          emptyColor="#1e293b"
          colors={[
            'rgba(239, 68, 68, 0.9)',  // Bright red for biggest losses
            'rgba(239, 68, 68, 0.6)',  // Medium red
            'rgba(239, 68, 68, 0.3)',  // Light red
            'rgba(148, 163, 184, 0.2)', // Neutral for values near zero
            'rgba(34, 197, 94, 0.3)',  // Light green
            'rgba(34, 197, 94, 0.6)',  // Medium green
            'rgba(34, 197, 94, 0.9)',  // Bright green for biggest wins
          ]}
          minValue={minMaxValues.min}
          maxValue={minMaxValues.max}
          margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
          yearSpacing={40}
          monthBorderColor="#475569"
          dayBorderWidth={1}
          dayBorderColor="#475569"
          onClick={(day) => setSelectedDay(day)}
          tooltip={({ day, value, data }) => {
            const tooltipData = {
              day,
              value: Number(data?.totalProfit || value || 0),
              data: {
                sessions: data?.sessions || [],
                totalProfit: Number(data?.totalProfit || value || 0)
              }
            };
            return <CustomTooltip {...tooltipData} />;
          }}
          theme={{
            textColor: '#94a3b8',
            fontSize: 12,
            tooltip: {
              container: {
                background: 'transparent',
                boxShadow: 'none',
                padding: 0
              }
            }
          }}
          legends={[
            {
              anchor: 'bottom-right',
              direction: 'row',
              translateY: 36,
              itemCount: 7,
              itemWidth: 42,
              itemHeight: 36,
              itemsSpacing: 14,
              itemDirection: 'right-to-left'
            }
          ]}
        />
      </div>

      {/* Selected Day Modal */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setSelectedDay(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-base-100 p-6 rounded-lg shadow-xl max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">
                {format(parseISO(selectedDay.day), 'MMMM d, yyyy')}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-base-200/50 rounded-lg p-3">
                    <div className="text-sm opacity-70">Sessions</div>
                    <div className="text-lg font-semibold">
                      {selectedDay.data?.sessions?.length || 0}
                    </div>
                  </div>
                  <div className="bg-base-200/50 rounded-lg p-3">
                    <div className="text-sm opacity-70">Net Profit</div>
                    <div className={`text-lg font-semibold ${Number(selectedDay.value) >= 0 ? 'text-success' : 'text-error'}`}>
                      ${Number(selectedDay.value).toFixed(2)}
                    </div>
                  </div>
                </div>
                {selectedDay.data?.sessions?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Sessions:</h4>
                    <div className="space-y-2">
                      {selectedDay.data.sessions.map((session, idx) => (
                        <div key={idx} className="bg-base-200/50 p-3 rounded-lg">
                          <div className="font-medium">{session.sessionName}</div>
                          <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
                            <div>Buy-in: ${Number(session.buyIn).toFixed(2)}</div>
                            <div>Cash-out: ${Number(session.cashOut).toFixed(2)}</div>
                          </div>
                          <div className={`text-sm font-medium mt-1 ${Number(session.profit) >= 0 ? 'text-success' : 'text-error'}`}>
                            Profit: ${Number(session.profit).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalendarHeatmap; 