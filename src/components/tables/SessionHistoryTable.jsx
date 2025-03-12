import React from 'react';
import { motion } from 'framer-motion';

const SessionHistoryTable = ({
  performanceData,
  isGlobalEditMode,
  selectedSessions,
  editingRow,
  editFormData,
  formatDate,
  formatMoney,
  handleSessionSelect,
  handleEditInputChange,
  handleEditClick,
  handleCancelEdit,
  handleSaveEdit,
  calculateTotalBuyIn,
  calculateTotalCashOut,
  calculateTotalProfit
}) => {
  return (
    <div className="overflow-x-auto overflow-y-visible">
      <div className="min-w-full inline-block align-middle">
        <div className="overflow-hidden">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-200/50">
                {isGlobalEditMode && (
                  <th className="w-16">
                    <label>
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={selectedSessions.length === performanceData.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSessions(performanceData.map(item => item._id));
                          } else {
                            setSelectedSessions([]);
                          }
                        }}
                      />
                    </label>
                  </th>
                )}
                <th>Date</th>
                <th>Session</th>
                <th>Player</th>
                <th className="text-right">Buy-in</th>
                <th className="text-right">Cash-out</th>
                <th className="text-right">Profit/Loss</th>
                {isGlobalEditMode && <th className="w-24">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {performanceData.map(session => (
                <motion.tr 
                  key={session._id} 
                  className={`hover:bg-base-200/50 transition-colors ${editingRow === session._id ? 'bg-base-200/70' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                >
                  {isGlobalEditMode && (
                    <td>
                      <label>
                        <input
                          type="checkbox"
                          className="checkbox"
                          checked={selectedSessions.includes(session._id)}
                          onChange={() => handleSessionSelect(session._id)}
                        />
                      </label>
                    </td>
                  )}
                  <td className="font-medium">
                    {editingRow === session._id ? (
                      <input
                        type="date"
                        name="sessionDate"
                        value={editFormData.sessionDate}
                        onChange={handleEditInputChange}
                        className="input input-bordered input-sm w-full"
                      />
                    ) : formatDate(session.sessionDate)}
                  </td>
                  <td>
                    {editingRow === session._id ? (
                      <input
                        type="text"
                        name="sessionName"
                        value={editFormData.sessionName}
                        onChange={handleEditInputChange}
                        className="input input-bordered input-sm w-full"
                        placeholder="Enter session name"
                      />
                    ) : (session.sessionName || 'Unnamed Game')}
                  </td>
                  <td>
                    {editingRow === session._id ? (
                      <input
                        type="text"
                        name="playerName"
                        value={editFormData.playerName}
                        onChange={handleEditInputChange}
                        className="input input-bordered input-sm w-full"
                        placeholder="Enter player name"
                      />
                    ) : session.playerName}
                  </td>
                  <td className="text-right">
                    {editingRow === session._id ? (
                      <input
                        type="number"
                        name="buyIn"
                        value={editFormData.buyIn}
                        onChange={handleEditInputChange}
                        className="input input-bordered input-sm w-full text-right"
                        step="1"
                        min="0"
                      />
                    ) : `$${formatMoney(session.buyIn)}`}
                  </td>
                  <td className="text-right">
                    {editingRow === session._id ? (
                      <input
                        type="number"
                        name="cashOut"
                        value={editFormData.cashOut}
                        onChange={handleEditInputChange}
                        className="input input-bordered input-sm w-full text-right"
                        step="1"
                        min="0"
                      />
                    ) : `$${formatMoney(session.cashOut)}`}
                  </td>
                  <td className={`text-right font-semibold ${session.profit >= 0 ? 'text-success' : 'text-error'}`}>
                    ${formatMoney(session.profit)}
                  </td>
                  {isGlobalEditMode && !editingRow && (
                    <td>
                      <div className="flex gap-2 justify-end">
                        <button 
                          className="btn btn-ghost btn-xs"
                          onClick={() => handleEditClick(session)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  )}
                  {editingRow === session._id && (
                    <td>
                      <div className="flex gap-2 justify-end">
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={handleCancelEdit}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => handleSaveEdit(session._id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-base-200">
              <tr className="font-bold">
                {isGlobalEditMode && <td></td>}
                <td colSpan={3}>Totals</td>
                <td className="text-right">${formatMoney(calculateTotalBuyIn())}</td>
                <td className="text-right">${formatMoney(calculateTotalCashOut())}</td>
                <td className={`text-right ${calculateTotalProfit() >= 0 ? 'text-success' : 'text-error'}`}>
                  ${formatMoney(calculateTotalProfit())}
                </td>
                {isGlobalEditMode && <td></td>}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SessionHistoryTable; 