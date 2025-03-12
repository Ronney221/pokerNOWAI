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
  const [selectedSession, setSelectedSession] = useState(null);

  // Add color intensity calculation function
  const getColorIntensity = (value, min, max, isProfit) => {
    if (isProfit) {
      // For profits, scale from white to dark green
      const intensity = (value - 0) / max;
      const whiteColor = [255, 255, 255]; // White
      const greenColor = [39, 174, 96]; // #27ae60
      return `rgb(${
        Math.round(whiteColor[0] + (greenColor[0] - whiteColor[0]) * intensity)},${
        Math.round(whiteColor[1] + (greenColor[1] - whiteColor[1]) * intensity)},${
        Math.round(whiteColor[2] + (greenColor[2] - whiteColor[2]) * intensity)})`
    } else {
      // For losses, scale from white to dark red
      const intensity = (Math.abs(value) - 0) / Math.abs(min);
      const whiteColor = [255, 255, 255]; // White
      const redColor = [192, 57, 43]; // #c0392b
      return `rgb(${
        Math.round(whiteColor[0] + (redColor[0] - whiteColor[0]) * intensity)},${
        Math.round(whiteColor[1] + (redColor[1] - whiteColor[1]) * intensity)},${
        Math.round(whiteColor[2] + (redColor[2] - whiteColor[2]) * intensity)})`
    }
  };

  // Prepare chart data with cumulative profit and moving average
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Sort by date
    const sortedData = [...data].sort((a, b) => 
      new Date(a.sessionDate) - new Date(b.sessionDate)
    );

    let cumulativeProfit = 0;
    let movingAverageWindow = [];

    // Process only days with actual games
    const dailyData = sortedData.map(session => {
      const profit = session.profit / 100;
      cumulativeProfit += profit;

      // Calculate moving average
      movingAverageWindow.push(profit);
      if (movingAverageWindow.length > maWindow) {
        movingAverageWindow.shift();
      }
      const movingAverage = movingAverageWindow.reduce((a, b) => a + b, 0) / movingAverageWindow.length;

      return {
        date: format(new Date(session.sessionDate), 'MMM d, yyyy'),
        rawDate: new Date(session.sessionDate),
        profit,
        cumulativeProfit,
        movingAverage,
        hasGame: true,
        sessionName: session.sessionName
      };
    });

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
      if (!data.hasGame) return null;

      const numericValue = typeof data.profit === 'number' ? data.profit : data?.totalProfit || 0;
      return (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200/50 p-4"
        >
          <p className="text-sm font-medium text-slate-600 mb-3">{data.sessionName || label}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-slate-500">Session Result</span>
              <span className={`text-sm font-medium ${numericValue >= 0 ? 'text-indigo-500' : 'text-indigo-400'}`}>
                ${numericValue.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-slate-500">Bankroll</span>
              <span className={`text-sm font-medium ${data.cumulativeProfit >= 0 ? 'text-indigo-500' : 'text-indigo-400'}`}>
                ${data.cumulativeProfit.toFixed(2)}
              </span>
            </div>
            {showMovingAverage && (
              <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">{maWindow}-Day MA</span>
                <span className="text-sm font-medium text-slate-600">
                  ${data.movingAverage.toFixed(2)}
                </span>
              </div>
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
        className="flex flex-wrap items-center justify-between gap-6 mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-600">
              Moving Average
            </label>
            <input
              type="checkbox"
              className="toggle toggle-sm bg-slate-200 checked:bg-indigo-500"
              checked={showMovingAverage}
              onChange={(e) => setShowMovingAverage(e.target.checked)}
            />
          </div>
          <AnimatePresence>
            {showMovingAverage && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
              >
                <select
                  className="select select-sm bg-white border-slate-200 text-slate-600 font-medium text-sm hover:border-slate-300 focus:border-indigo-500"
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

        <div className="flex gap-6">
          <div className="bg-indigo-50 rounded-lg px-4 py-2">
            <div className="text-xs text-indigo-600 font-medium">Peak Profit</div>
            <div className="text-lg font-semibold text-indigo-700">${maxProfit.toFixed(2)}</div>
          </div>
          <div className="bg-indigo-50 rounded-lg px-4 py-2">
            <div className="text-xs text-indigo-600 font-medium">Lowest Point</div>
            <div className="text-lg font-semibold text-indigo-700">${minProfit.toFixed(2)}</div>
          </div>
        </div>
      </motion.div>

      {/* Chart */}
      <div className="h-[calc(100%-5rem)] bg-base-100 rounded-xl p-6 shadow-sm border border-base-200">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 80, left: 50, bottom: 20 }}
            onMouseMove={(e) => {
              if (e && e.activeLabel) {
                setHoveredDate(e.activeLabel);
              }
            }}
            onMouseLeave={() => setHoveredDate(null)}
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(129, 140, 248)" stopOpacity={0.3}/>
                <stop offset="100%" stopColor="rgb(129, 140, 248)" stopOpacity={0}/>
              </linearGradient>
              <filter id="shadow" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                <feOffset dx="0" dy="4" result="offsetblur"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.2"/>
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="currentColor" 
              opacity={0.1}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: 'currentColor', fontSize: 12, opacity: 0.7 }}
              tickLine={false}
              axisLine={{ stroke: 'currentColor', opacity: 0.2 }}
              minTickGap={30}
              dy={8}
            />
            <YAxis
              tick={{ fill: 'currentColor', fontSize: 12, opacity: 0.7 }}
              tickLine={false}
              axisLine={{ stroke: 'currentColor', opacity: 0.2 }}
              tickFormatter={(value) => `$${value}`}
              dx={-8}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{
                stroke: 'currentColor',
                strokeWidth: 1,
                strokeDasharray: '4 4',
                opacity: 0.3
              }}
            />
            
            {/* Zero reference line */}
            <ReferenceLine 
              y={0} 
              stroke="currentColor" 
              strokeWidth={2}
              opacity={0.2}
            />
            
            {/* Max and min reference lines with adjusted positions */}
            <ReferenceLine 
              y={maxProfit + (maxProfit * 0.02)} // Move 2% above max
              stroke="#818cf8" 
              strokeWidth={1.5}
              label={{ 
                value: `$${maxProfit.toFixed(2)}`,
                position: 'right',
                fill: '#818cf8',
                fontSize: 12,
                fontWeight: 500
              }}
              isFront={true}
              strokeOpacity={0}
            />
            <ReferenceLine 
              y={minProfit - (Math.abs(minProfit) * 0.02)} // Move 2% below min
              stroke="#818cf8" 
              strokeWidth={1.5}
              label={{ 
                value: `$${minProfit.toFixed(2)}`,
                position: 'left',
                fill: '#818cf8',
                fontSize: 12,
                fontWeight: 500
              }}
              isFront={true}
              strokeOpacity={0}
            />
            
            {/* Reference lines without text (solid lines) */}
            <ReferenceLine 
              y={maxProfit} 
              stroke="#818cf8" 
              strokeWidth={1.5}
              strokeDasharray="none"
              opacity={0.5}
            />
            <ReferenceLine 
              y={minProfit} 
              stroke="#818cf8" 
              strokeWidth={1.5}
              strokeDasharray="none"
              opacity={0.5}
            />

            <Area
              type="natural"
              data={chartData}
              dataKey="cumulativeProfit"
              name="Cumulative Profit"
              stroke="#818cf8"
              strokeWidth={2.5}
              fill="url(#areaGradient)"
              fillOpacity={1}
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (!payload.hasGame) return null;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={3}
                    stroke="#818cf8"
                    strokeWidth={2}
                    fill="#fff"
                  />
                );
              }}
              activeDot={(props) => {
                const { cx, cy, payload } = props;
                if (!payload.hasGame) return null;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={6}
                    strokeWidth={2}
                    stroke="#fff"
                    fill="#818cf8"
                    filter="url(#shadow)"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (payload.hasGame) {
                        setSelectedSession(payload);
                      }
                    }}
                  />
                );
              }}
              isAnimationActive={true}
              animationDuration={1500}
              animationEasing="ease-in-out"
              connectNulls={true}
            />
            {showMovingAverage && (
              <Area
                type="natural"
                dataKey="movingAverage"
                stroke="#94a3b8"
                fill="none"
                name={`${maWindow}-Day Moving Average`}
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
                activeDot={(props) => {
                  const { cx, cy, payload } = props;
                  if (!payload.hasGame) return null;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4}
                      strokeWidth={2}
                      stroke="#fff"
                      fill="#94a3b8"
                    />
                  );
                }}
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-in-out"
                animationBegin={300}
                connectNulls={true}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Session Details Modal */}
      <AnimatePresence>
        {selectedSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setSelectedSession(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-base-100 p-6 rounded-lg shadow-xl max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">
                Session Details: {selectedSession.sessionName || format(new Date(selectedSession.rawDate), 'MMM d, yyyy')}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-base-200/50 rounded-lg p-3">
                    <div className="text-sm opacity-70">Session Result</div>
                    <div className={`text-lg font-semibold ${selectedSession.profit >= 0 ? 'text-success' : 'text-error'}`}>
                      ${selectedSession.profit.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-base-200/50 rounded-lg p-3">
                    <div className="text-sm opacity-70">Bankroll</div>
                    <div className={`text-lg font-semibold ${selectedSession.cumulativeProfit >= 0 ? 'text-success' : 'text-error'}`}>
                      ${selectedSession.cumulativeProfit.toFixed(2)}
                    </div>
                  </div>
                </div>
                {showMovingAverage && (
                  <div className="bg-base-200/50 rounded-lg p-3">
                    <div className="text-sm opacity-70">{maWindow}-Day Moving Average</div>
                    <div className="text-lg font-semibold">
                      ${selectedSession.movingAverage.toFixed(2)}
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

export default AreaChartComponent; 