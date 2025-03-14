import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

// Chart Components
import AreaChartComponent from './charts/AreaChartComponent';
import ScatterChartComponent from './charts/ScatterChartComponent';
import HistogramChart from './charts/HistogramChart';
import CalendarHeatmap from './charts/CalendarHeatmap';

// Analytics Components
import AnalyticsPanel from './analytics/AnalyticsPanel';

// Shared Components
import DateRangeFilter from './filters/DateRangeFilter';
import PlayerFilter from './filters/PlayerFilter';

const chartTypes = [
  {
    id: 'area',
    name: 'Cumulative Performance',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    )
  },
  {
    id: 'scatter',
    name: 'Buy-in vs Cash-out',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    )
  },
  {
    id: 'histogram',
    name: 'Profit Distribution',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  {
    id: 'calendar',
    name: 'Session Calendar',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  }
];

const Dashboard = ({ performanceData }) => {
  const [selectedChartType, setSelectedChartType] = useState('area');
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [filteredData, setFilteredData] = useState(performanceData);

  useEffect(() => {
    let filtered = [...performanceData];

    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.sessionDate);
        return sessionDate >= dateRange.start && sessionDate <= dateRange.end;
      });
    }

    if (selectedPlayers.length > 0) {
      filtered = filtered.filter(session => 
        selectedPlayers.includes(session.playerName)
      );
    }

    setFilteredData(filtered);
  }, [performanceData, dateRange, selectedPlayers]);

  const renderChart = () => {
    switch (selectedChartType) {
      case 'area':
        return <AreaChartComponent data={filteredData} />;
      case 'scatter':
        return <ScatterChartComponent data={filteredData} />;
      case 'histogram':
        return <HistogramChart data={filteredData} />;
      case 'calendar':
        return <CalendarHeatmap data={filteredData} />;
      default:
        return <AreaChartComponent data={filteredData} />;
    }
  };

  return (
    <div className="bg-gradient-to-b from-base-100 via-base-100/50 to-base-200/30 min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            Performance Analytics
          </h1>
        </motion.div>

        {/* Chart Type Selection with Enhanced UI */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            {/* Left side - Chart Type Selection */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {chartTypes.map((chart) => (
                <motion.button
                  key={chart.id}
                  onClick={() => setSelectedChartType(chart.id)}
                  className={`
                    relative overflow-hidden rounded-xl p-3
                    ${selectedChartType === chart.id
                      ? 'bg-primary text-primary-content shadow-lg'
                      : 'bg-base-200 hover:bg-base-300 text-base-content hover:shadow-md'
                    }
                    transition-all duration-300 ease-in-out
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex flex-col items-center gap-2">
                    {chart.icon}
                    <span className="font-medium text-sm">{chart.name}</span>
                  </div>
                  {selectedChartType === chart.id && (
                    <motion.div
                      className="absolute bottom-0 left-0 h-1 bg-primary-content"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Right side - Filters */}
            <div className="flex items-center gap-4 bg-base-100 rounded-xl px-4 py-2 shadow-sm border border-base-200">
              <DateRangeFilter
                onDateRangeChange={range => setDateRange(range)}
              />
              <div className="h-8 w-px bg-base-300/50" /> {/* Vertical divider */}
              <PlayerFilter
                data={performanceData}
                selectedPlayers={selectedPlayers}
                onSelectedPlayersChange={setSelectedPlayers}
              />
            </div>
          </div>
        </div>

        {/* Chart Display with Enhanced Card */}
        <motion.div
          layout
          className="card bg-base-100 shadow-xl backdrop-blur-sm border border-base-200 mb-16"
        >
          <div className="card-body p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary/90 to-secondary/90 bg-clip-text text-transparent">
                Session History
              </h2>
              <div className="text-sm text-base-content/60">
                {filteredData.length} sessions
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedChartType}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="w-full h-[500px]"
              >
                {renderChart()}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Analytics Panel with Enhanced Spacing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AnalyticsPanel data={filteredData} />
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard; 