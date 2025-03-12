import React, { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';
import { format, subDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const AreaChartComponent = ({ data }) => {
  const [showMovingAverage, setShowMovingAverage] = useState(false);
  const [maWindow, setMaWindow] = useState(7);
  const [hoveredDate, setHoveredDate] = useState(null);

  // Prepare chart data with cumulative profit and moving average
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Sort by date
    const sortedData = [...data].sort((a, b) => 
      new Date(a.sessionDate) - new Date(b.sessionDate)
    );

    let cumulativeProfit = 0;
    let movingAverageWindow = [];
    let profitPerDay = new Map();

    // Calculate daily profits first
    sortedData.forEach(session => {
      const date = format(new Date(session.sessionDate), 'yyyy-MM-dd');
      const profit = session.profit / 100;
      profitPerDay.set(date, (profitPerDay.get(date) || 0) + profit);
    });

    // Fill in missing dates with zero profit
    const startDate = new Date(sortedData[0].sessionDate);
    const endDate = new Date(sortedData[sortedData.length - 1].sessionDate);
    const dailyData = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const profit = profitPerDay.get(dateStr) || 0;
      cumulativeProfit += profit;

      // Calculate moving average
      movingAverageWindow.push(profit);
      if (movingAverageWindow.length > maWindow) {
        movingAverageWindow.shift();
      }
      const movingAverage = movingAverageWindow.reduce((a, b) => a + b, 0) / movingAverageWindow.length;

      dailyData.push({
        date: format(currentDate, 'MMM d, yyyy'),
        rawDate: currentDate,
        profit,
        cumulativeProfit,
        movingAverage,
      });

      currentDate = subDays(currentDate, -1);
    }

    return dailyData;
  }, [data, maWindow]);

  // Calculate min and max values for reference lines
  const { maxProfit, minProfit } = useMemo(() => {
    if (chartData.length === 0) return { maxProfit: 0, minProfit: 0 };
    return {
      maxProfit: Math.max(...chartData.map(d => d.cumulativeProfit)),
      minProfit: Math.min(...chartData.map(d => d.cumulativeProfit))
    };
  }, [chartData]);

  // Custom tooltip content
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      const numericValue = typeof data.profit === 'number' ? data.profit : data?.totalProfit || 0;
      return (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-base-100 shadow-xl p-4 border border-base-200"
        >
          <p className="font-semibold mb-2">{label}</p>
          <div className="space-y-2">
            <p className="text-sm">
              Daily Profit: 
              <span className={numericValue >= 0 ? ' text-success' : ' text-error'}>
                {' '}${numericValue.toFixed(2)}
              </span>
            </p>
            <p className={`text-sm font-semibold ${numericValue >= 0 ? 'text-success' : 'text-error'}`}>
              Net Profit: ${numericValue.toFixed(2)}
            </p>
            {showMovingAverage && (
              <p className="text-sm text-primary">
                {maWindow}-Day MA: ${data.movingAverage.toFixed(2)}
              </p>
            )}
          </div>
        </motion.div>
      );
    }
    return null;
  };

  return (
    <div className="h-full">
      {/* Chart Controls */}
      <motion.div 
        className="flex flex-wrap items-center justify-between gap-4 mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <div className="form-control">
            <label className="label cursor-pointer gap-2">
              <span className="label-text">Moving Average</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={showMovingAverage}
                onChange={(e) => setShowMovingAverage(e.target.checked)}
              />
            </label>
          </div>
          <AnimatePresence>
            {showMovingAverage && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="form-control w-32"
              >
                <select
                  className="select select-bordered select-sm"
                  value={maWindow}
                  onChange={(e) => setMaWindow(Number(e.target.value))}
                >
                  <option value={3}>3-Day MA</option>
                  <option value={7}>7-Day MA</option>
                  <option value={14}>14-Day MA</option>
                  <option value={30}>30-Day MA</option>
                </select>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Peak Profit</div>
            <div className="stat-value text-success">${maxProfit.toFixed(2)}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Lowest Point</div>
            <div className="stat-value text-error">${minProfit.toFixed(2)}</div>
          </div>
        </div>
      </motion.div>

      {/* Chart */}
      <div className="h-[calc(100%-4rem)]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            onMouseMove={(e) => {
              if (e && e.activeLabel) {
                setHoveredDate(e.activeLabel);
              }
            }}
            onMouseLeave={() => setHoveredDate(null)}
            tooltip={({ day, value, data }) => {
              const tooltipData = {
                day,
                value: data?.totalProfit || value,
                data: {
                  sessions: data?.sessions || [],
                  totalProfit: data?.totalProfit || value
                }
              };
              return <CustomTooltip {...tooltipData} />;
            }}
          >
            <defs>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#36A2EB" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#36A2EB" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#666' }}
              tickLine={{ stroke: '#666' }}
              minTickGap={30}
            />
            <YAxis
              tick={{ fill: '#666' }}
              tickLine={{ stroke: '#666' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Zero reference line */}
            <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
            
            {/* Max and min reference lines */}
            <ReferenceLine 
              y={maxProfit} 
              stroke="#2ecc71" 
              strokeDasharray="3 3"
              label={{ 
                value: 'Peak', 
                position: 'right',
                fill: '#2ecc71'
              }} 
            />
            <ReferenceLine 
              y={minProfit} 
              stroke="#e74c3c" 
              strokeDasharray="3 3"
              label={{ 
                value: 'Bottom', 
                position: 'right',
                fill: '#e74c3c'
              }} 
            />

            <Area
              type="monotone"
              dataKey="cumulativeProfit"
              stroke="#36A2EB"
              fillOpacity={1}
              fill="url(#colorProfit)"
              name="Cumulative Profit"
              strokeWidth={2}
              isAnimationActive={true}
              animationDuration={1000}
              animationEasing="ease-in-out"
            />
            {showMovingAverage && (
              <Area
                type="monotone"
                dataKey="movingAverage"
                stroke="#FF6384"
                fill="none"
                name={`${maWindow}-Day Moving Average`}
                strokeWidth={2}
                strokeDasharray="5 5"
                isAnimationActive={true}
                animationDuration={1000}
                animationEasing="ease-in-out"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AreaChartComponent; 