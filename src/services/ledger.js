import { API_URL } from '../config/api';

/**
 * Save ledger data to the database
 * 
 * @param {Object} ledgerData - The ledger data to save
 * @param {string} ledgerData.firebaseUid - Firebase UID of the user
 * @param {string} ledgerData.sessionName - Name of the poker session
 * @param {Array} ledgerData.transactions - Array of settlement transactions
 * @param {string} ledgerData.originalFileName - Name of the original CSV file (optional)
 * @param {Array} ledgerData.players - Array of player data (optional)
 * @returns {Promise<Object>} - Response from the server
 */
export const saveLedgerData = async (ledgerData) => {
  try {
    console.log('Saving ledger data:', ledgerData);
    const response = await fetch(`${API_URL}/analysis/save-ledger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ledgerData),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Server error response:', errorData);
      throw new Error(errorData || 'Failed to save ledger data');
    }
    
    const data = await response.json();
    console.log('Ledger saved successfully:', data);
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Get all ledgers for a user
 * 
 * @param {string} firebaseUid - Firebase UID of the user
 * @returns {Promise<Array>} - Array of ledger data
 */
export const getUserLedgers = async (firebaseUid) => {
  try {
    const response = await fetch(`${API_URL}/analysis/ledgers/${firebaseUid}`);
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Failed to fetch ledger data');
    }
    
    const data = await response.json();
    return data.ledgers;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Get a specific ledger by ID
 * 
 * @param {string} ledgerId - MongoDB ID of the ledger
 * @returns {Promise<Object>} - Ledger data
 */
export const getLedgerById = async (ledgerId) => {
  try {
    const response = await fetch(`${API_URL}/analysis/ledger/${ledgerId}`);
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Failed to fetch ledger data');
    }
    
    const data = await response.json();
    return data.ledger;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Delete a ledger by ID
 * 
 * @param {string} ledgerId - MongoDB ID of the ledger
 * @returns {Promise<Object>} - Response from the server
 */
export const deleteLedgerById = async (ledgerId) => {
  try {
    const response = await fetch(`${API_URL}/analysis/ledger/${ledgerId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Failed to delete ledger');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Get a shared ledger by ID (for public access)
 * 
 * @param {string} ledgerId - MongoDB ID of the ledger
 * @returns {Promise<Object>} - Ledger data
 */
export const getSharedLedgerById = async (ledgerId) => {
  try {
    const response = await fetch(`${API_URL}/analysis/shared-ledger/${ledgerId}`);
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Failed to fetch shared ledger data');
    }
    
    const data = await response.json();
    return data.ledger;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Track player performance from a ledger
 * 
 * @param {Object} performanceData - Player performance data
 * @param {string} performanceData.firebaseUid - Firebase UID of the user
 * @param {string} performanceData.ledgerId - ID of the ledger
 * @param {string} performanceData.playerName - Selected player name
 * @param {string} performanceData.sessionName - Name of the poker session
 * @param {Date} performanceData.sessionDate - Date of the session
 * @param {number} performanceData.buyIn - Player's buy-in amount
 * @param {number} performanceData.cashOut - Player's cash-out amount
 * @param {string} performanceData.denomination - Game denomination ('cents' or 'dollars')
 * @returns {Promise<Object>} - Response from the server
 */
export const trackPlayerPerformance = async (performanceData) => {
  try {
    console.log('Tracking player performance:', performanceData);
    const response = await fetch(`${API_URL}/analysis/track-performance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(performanceData),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Server error response:', errorData);
      throw new Error(errorData || 'Failed to track performance');
    }
    
    const data = await response.json();
    console.log('Performance tracked successfully:', data);
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Get player performance history
 * 
 * @param {string} firebaseUid - Firebase UID of the user
 * @returns {Promise<Array>} - Array of performance data
 */
export const getPlayerPerformanceHistory = async (firebaseUid) => {
  try {
    const response = await fetch(`${API_URL}/analysis/performance/${firebaseUid}`);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Server error response:', errorData);
      throw new Error(errorData || 'Failed to get performance history');
    }
    
    const data = await response.json();
    return data.performances || [];
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}; 