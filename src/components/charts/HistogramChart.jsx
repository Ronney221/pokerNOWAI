import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const HistogramChart = ({ data }) => {
  const [binCount, setBinCount] = useState(10);
  const [selectedBin, setSelectedBin] = useState(null);

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

  // Calculate histogram data and statistics
  const { histogramData, stats } = useMemo(() => {
    if (!data || data.length === 0) return { histogramData: [], stats: {} };

    // Extract profits and convert to dollars
    const profits = data.map(session => session.profit / 100);
    
    // Calculate basic statistics
    const mean = profits.reduce((a, b) => a + b, 0) / profits.length;
    const sortedProfits = [...profits].sort((a, b) => a - b);
    const median = sortedProfits[Math.floor(sortedProfits.length / 2)];
    const variance = profits.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / profits.length;
    const stdDev = Math.sqrt(variance);
    
    // Calculate bin width based on data range
    const min = Math.min(...profits);
    const max = Math.max(...profits);
    const binWidth = (max - min) / binCount;

    // Initialize bins
    const bins = Array(binCount).fill(0).map((_, i) => ({
      start: min + i * binWidth,
      end: min + (i + 1) * binWidth,
      count: 0,
      sessions: []
    }));

    // Fill bins
    profits.forEach((profit, idx) => {
      const binIndex = Math.min(
        Math.floor((profit - min) / binWidth),
        binCount - 1
      );
      bins[binIndex].count++;
      bins[binIndex].sessions.push({
        ...data[idx],
        profit: profit
      });
    });

    // Format bin labels and calculate percentages
    const formattedBins = bins.map(bin => ({
      range: `$${bin.start.toFixed(0)} to $${bin.end.toFixed(0)}`,
      count: bin.count,
      percentage: (bin.count / profits.length) * 100,
      sessions: bin.sessions,
      start: bin.start,
      end: bin.end,
      midpoint: (bin.start + bin.end) / 2,
      isProfit: (bin.start + bin.end) / 2 > 0,
      value: (bin.start + bin.end) / 2  // Add midpoint value for color scaling
    }));

    return {
      histogramData: formattedBins,
      stats: {
        mean,
        median,
        stdDev,
        min: sortedProfits[0],
        max: sortedProfits[sortedProfits.length - 1],
        totalSessions: profits.length
      }
    };
  }, [data, binCount]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-base-100 shadow-xl p-4 border border-base-200"
        >
          <p className="font-semibold mb-2">Profit Range</p>
          <div className="space-y-2">
            <p className="text-sm mb-1">{data.range}</p>
            <p className="text-sm mb-1">Sessions: {data.count}</p>
            <p className="text-sm mb-1">
              Percentage: {data.percentage.toFixed(1)}%
            </p>
            {data.sessions.length > 0 && (
              <div className="mt-2 border-t pt-2">
                <p className="text-sm font-semibold mb-1">Sessions in this range:</p>
                <div className="max-h-32 overflow-y-auto">
                  {data.sessions.map((session, idx) => (
                    <div key={idx} className="text-xs mb-1">
                      <span className="font-medium">{session.sessionName || 'Unnamed Game'}</span>
                      <span className={session.profit >= 0 ? 'text-success' : 'text-error'}>
                        {' '}(${session.profit.toFixed(2)})
                      </span>
                    </div>
                  ))}
                </div>
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
      {/* Controls */}
      <motion.div 
        className="flex flex-wrap items-center justify-between gap-4 mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="form-control w-full max-w-lg">
            <label className="label">
              <span className="label-text">Number of Bins: {binCount}</span>
            </label>
            <input
              type="range"
              min="5"
              max="30"
              value={binCount}
              onChange={(e) => setBinCount(Number(e.target.value))}
              className="range range-primary"
              step="5"
            />
            <div className="w-full flex justify-between text-xs px-2 mt-1">
              <span>5</span>
              <span>10</span>
              <span>15</span>
              <span>20</span>
              <span>25</span>
              <span>30</span>
            </div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Mean Profit</div>
            <div className={`stat-value ${stats.mean >= 0 ? 'text-success' : 'text-error'}`}>
              ${stats.mean?.toFixed(2)}
            </div>
            <div className="stat-desc">Average per session</div>
          </div>
          <div className="stat">
            <div className="stat-title">Median Profit</div>
            <div className={`stat-value ${stats.median >= 0 ? 'text-success' : 'text-error'}`}>
              ${stats.median?.toFixed(2)}
            </div>
            <div className="stat-desc">Middle value</div>
          </div>
        </div>
      </motion.div>

      {/* Chart */}
      <div className="h-[calc(100%-4rem)]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={histogramData}
            margin={{ top: 20, right: 20, bottom: 60, left: 20 }}
            onClick={(data) => {
              if (data && data.activePayload && data.activePayload[0]) {
                setSelectedBin(data);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis
              dataKey="range"
              tick={(props) => {
                const { x, y, payload } = props;
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text
                      x={0}
                      y={0}
                      dy={16}
                      textAnchor="end"
                      fill="#666"
                      transform="rotate(-45)"
                    >
                      {payload.value}
                    </text>
                  </g>
                );
              }}
              tickLine={{ stroke: '#666' }}
              label={{ value: 'Profit Range', position: 'bottom', fill: '#666' }}
              height={80}
            />
            <YAxis
              tick={{ fill: '#666' }}
              tickLine={{ stroke: '#666' }}
              label={{
                value: 'Number of Sessions',
                angle: -90,
                position: 'left',
                fill: '#666'
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              align="center"
              wrapperStyle={{ 
                paddingTop: '20px',
                bottom: '-50px'
              }}
            />
            <ReferenceLine x="0" stroke="#666" />
            
            <ReferenceLine
              x={stats.mean}
              stroke="#36A2EB"
              strokeDasharray="3 3"
              label={{
                value: 'Mean',
                position: 'top',
                fill: '#36A2EB'
              }}
            />
            <ReferenceLine
              x={stats.median}
              stroke="#FF6384"
              strokeDasharray="3 3"
              label={{
                value: 'Median',
                position: 'top',
                fill: '#FF6384'
              }}
            />
            
            <Bar
              name="Poker Sessions"
              dataKey="count"
              className="cursor-pointer"
              style={{ cursor: 'pointer' }}
              shape={(props) => {
                const { x, y, width, height } = props;
                const isProfit = props.payload.isProfit;
                const color = getColorIntensity(
                  props.payload.value,
                  stats.min,
                  stats.max,
                  isProfit
                );
                const strokeColor = isProfit ? '#27ae60' : '#c0392b';
                return (
                  <path
                    d={`M ${x},${y + height} h ${width} v ${-height} h ${-width} z`}
                    fill={color}
                    stroke={strokeColor}
                    strokeWidth={1}
                    opacity={0.8}
                  />
                );
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Selected Bin Modal */}
      <AnimatePresence>
        {selectedBin && selectedBin.activePayload && selectedBin.activePayload[0] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setSelectedBin(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-base-100 p-6 rounded-lg shadow-xl max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">
                Sessions in Range: {selectedBin.activePayload[0].payload.range}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-base-200/50 rounded-lg p-3">
                    <div className="text-sm opacity-70">Session Count</div>
                    <div className="text-lg font-semibold">
                      {selectedBin.activePayload[0].payload.count}
                    </div>
                  </div>
                  <div className="bg-base-200/50 rounded-lg p-3">
                    <div className="text-sm opacity-70">Percentage</div>
                    <div className="text-lg font-semibold">
                      {selectedBin.activePayload[0].payload.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                {selectedBin.activePayload[0].payload.sessions?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Sessions:</h4>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {selectedBin.activePayload[0].payload.sessions.map((session, idx) => (
                        <div key={idx} className="bg-base-200/50 p-2 rounded">
                          <div className="font-medium">{session.sessionName || 'Unnamed Game'}</div>
                          <div className={`text-sm ${session.profit >= 0 ? 'text-success' : 'text-error'}`}>
                            ${session.profit.toFixed(2)}
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

export default HistogramChart; 