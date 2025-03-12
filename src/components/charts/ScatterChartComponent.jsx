import React, { useMemo, useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ZAxis,
  Legend
} from 'recharts';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const ScatterChartComponent = ({ data }) => {
  const [showBreakEvenLine, setShowBreakEvenLine] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState(null);

  // Add color intensity calculation function
  const getColorIntensity = (value, min, max, isProfit) => {
    if (isProfit) {
      // For profits, scale from light green to dark green
      const intensity = Math.min(Math.max((value - 0) / max, 0), 1);
      return `rgba(74, 222, 128, ${0.2 + intensity * 0.8})`; // #4ade80 with varying opacity
    } else {
      // For losses, scale from light red to dark red
      const maxLoss = Math.abs(Math.min(...data.map(d => d.profit).filter(p => p < 0)));
      const intensity = Math.min(Math.max(Math.abs(value) / maxLoss, 0), 1);
      const r = 248;
      const g = Math.round(113 + (200 - 113) * (1 - intensity)); // Interpolate from 113 to 200
      const b = Math.round(113 + (200 - 113) * (1 - intensity)); // Interpolate from 113 to 200
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  // Prepare chart data
  const { chartData, domains, stats } = useMemo(() => {
    if (!data || data.length === 0) return { chartData: [], domains: { min: 0, max: 1000 }, stats: {} };

    const processedData = data.map(session => ({
      buyIn: session.buyIn / 100,
      cashOut: session.cashOut / 100,
      profit: session.profit / 100,
      date: format(new Date(session.sessionDate), 'MMM d, yyyy'),
      sessionName: session.sessionName || 'Unnamed Game',
      roi: ((session.cashOut - session.buyIn) / session.buyIn) * 100
    }));

    // Calculate domains with padding
    const buyIns = processedData.map(d => d.buyIn);
    const cashOuts = processedData.map(d => d.cashOut);
    const allValues = [...buyIns, ...cashOuts];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min) * 0.1;

    // Calculate statistics
    const avgBuyIn = buyIns.reduce((a, b) => a + b, 0) / buyIns.length;
    const avgCashOut = cashOuts.reduce((a, b) => a + b, 0) / cashOuts.length;
    const profitableSessions = processedData.filter(d => d.profit > 0).length;
    const avgROI = processedData.reduce((a, b) => a + b.roi, 0) / processedData.length;

    return {
      chartData: processedData,
      domains: {
        min: Math.max(0, min - padding),
        max: max + padding
      },
      stats: {
        avgBuyIn,
        avgCashOut,
        profitableSessions,
        totalSessions: processedData.length,
        avgROI
      }
    };
  }, [data]);

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
          <p className="font-semibold mb-2">{data.sessionName}</p>
          <div className="space-y-2">
            <p className="text-sm mb-1">{data.date}</p>
            <p className="text-sm mb-1">Buy-in: ${data.buyIn.toFixed(2)}</p>
            <p className="text-sm mb-1">Cash-out: ${data.cashOut.toFixed(2)}</p>
            <p className={`text-sm font-semibold ${data.profit >= 0 ? 'text-success' : 'text-error'}`}>
              Profit: ${data.profit.toFixed(2)}
            </p>
            <p className={`text-xs ${data.roi >= 0 ? 'text-success' : 'text-error'}`}>
              ROI: {data.roi.toFixed(1)}%
            </p>
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
              <span className="label-text">Break-even Line</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={showBreakEvenLine}
                onChange={(e) => setShowBreakEvenLine(e.target.checked)}
              />
            </label>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Win Rate</div>
            <div className="stat-value text-success">
              {((stats.profitableSessions / stats.totalSessions) * 100).toFixed(1)}%
            </div>
            <div className="stat-desc">
              {stats.profitableSessions} of {stats.totalSessions} sessions
            </div>
          </div>
          <div className="stat">
            <div className="stat-title">Avg ROI</div>
            <div className={`stat-value ${stats.avgROI >= 0 ? 'text-success' : 'text-error'}`}>
              {stats.avgROI.toFixed(1)}%
            </div>
            <div className="stat-desc">Per session</div>
          </div>
        </div>
      </motion.div>

      {/* Chart */}
      <div className="h-[calc(100%-4rem)]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 60, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis
              type="number"
              dataKey="buyIn"
              name="Buy-in"
              unit="$"
              domain={[domains.min, domains.max]}
              tick={{ fill: '#666' }}
              tickLine={{ stroke: '#666' }}
              label={{ value: 'Buy-in ($)', position: 'bottom', fill: '#666' }}
            />
            <YAxis
              type="number"
              dataKey="cashOut"
              name="Cash-out"
              unit="$"
              domain={[domains.min, domains.max]}
              tick={{ fill: '#666' }}
              tickLine={{ stroke: '#666' }}
              label={{ value: 'Cash-out ($)', angle: -90, position: 'left', fill: '#666' }}
            />
            <ZAxis type="number" dataKey="profit" range={[50, 400]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              align="center"
              wrapperStyle={{ 
                paddingTop: '20px',
                bottom: '-50px'
              }}
            />

            {showBreakEvenLine && (
              <ReferenceLine
                segment={[
                  { x: domains.min, y: domains.min },
                  { x: domains.max, y: domains.max }
                ]}
                stroke="#666"
                strokeDasharray="3 3"
                label={{ value: 'Break-even', position: 'insideTopRight', fill: '#666' }}
              />
            )}

            <Scatter
              name="Poker Sessions"
              data={chartData}
              shape={(props) => {
                const { cx, cy } = props;
                const isProfit = props.payload.profit >= 0;
                const color = getColorIntensity(
                  props.payload.profit,
                  domains.min,
                  domains.max,
                  isProfit
                );
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill={color}
                    stroke={isProfit ? '#4ade80' : '#f87171'}
                    strokeWidth={1}
                    style={{ 
                      filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))'
                    }}
                  />
                );
              }}
              onClick={(data) => setSelectedPoint(data)}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Selected Point Modal */}
      <AnimatePresence>
        {selectedPoint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setSelectedPoint(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-base-100 p-6 rounded-lg shadow-xl max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">{selectedPoint.payload.sessionName}</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-base-200/50 rounded-lg p-3">
                    <div className="text-sm opacity-70">Buy-in</div>
                    <div className="text-lg font-semibold">${selectedPoint.payload.buyIn.toFixed(2)}</div>
                  </div>
                  <div className="bg-base-200/50 rounded-lg p-3">
                    <div className="text-sm opacity-70">Cash-out</div>
                    <div className="text-lg font-semibold">${selectedPoint.payload.cashOut.toFixed(2)}</div>
                  </div>
                </div>
                <div className="bg-base-200/50 rounded-lg p-3">
                  <div className="text-sm opacity-70">Profit/Loss</div>
                  <div className={`text-lg font-semibold ${selectedPoint.payload.profit >= 0 ? 'text-success' : 'text-error'}`}>
                    ${selectedPoint.payload.profit.toFixed(2)}
                  </div>
                </div>
                <div className="bg-base-200/50 rounded-lg p-3">
                  <div className="text-sm opacity-70">ROI</div>
                  <div className={`text-lg font-semibold ${selectedPoint.payload.roi >= 0 ? 'text-success' : 'text-error'}`}>
                    {selectedPoint.payload.roi.toFixed(1)}%
                  </div>
                </div>
                <div className="text-sm opacity-70 text-center">
                  {selectedPoint.payload.date}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScatterChartComponent; 