import { API_URL, PYTHON_API_URL } from '../config/api';

export const uploadPokerLogs = async (files, userId) => {
  try {
    const response = await fetch(`${API_URL}/analysis/upload-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files,
        userId
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Upload failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const getUserAnalyses = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/analysis/user/${userId}`);
    const data = await response.json();
    return data.analyses;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const getAnalysisStatus = async (analysisId) => {
  try {
    const response = await fetch(`${API_URL}/analysis/${analysisId}`);
    const data = await response.json();
    return data.analysis;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const getUserPokerLogs = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/analysis/logs/${userId}`);
    const data = await response.json();
    return data.logs;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Process poker log files with Python scripts via PythonAnywhere
 * @param {Object} fileData - Object containing file content and metadata
 * @param {string} playerName - The player name to analyze in the log
 * @returns {Promise} - Promise that resolves with processing job information
 */
export const processPokerLogWithPython = async (fileData, playerName) => {
  try {
    // Create FormData object to send file
    const formData = new FormData();
    
    // Create a File object from the content
    const fileBlob = new Blob([fileData.content], { type: 'text/csv' });
    const file = new File([fileBlob], fileData.name, { type: 'text/csv' });
    
    // Append file and player name to form data
    formData.append('file', file);
    formData.append('player_name', playerName);
    
    // Send to Python API for processing
    const response = await fetch(`${PYTHON_API_URL}/process-poker-log`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to process poker log');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Python API Error:', error);
    throw error;
  }
};

/**
 * Check the status of a processing job
 * @param {string} jobId - The ID of the processing job
 * @returns {Promise} - Promise that resolves with job status information
 */
export const checkProcessingStatus = async (jobId) => {
  try {
    const response = await fetch(`${PYTHON_API_URL}/job-status/${jobId}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to check job status');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Python API Error:', error);
    throw error;
  }
};

/**
 * Get results for a completed processing job
 * @param {string} jobId - The ID of the completed processing job
 * @returns {Promise} - Promise that resolves with job results
 */
export const getProcessingResults = async (jobId) => {
  try {
    const response = await fetch(`${PYTHON_API_URL}/job-results/${jobId}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to get job results');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Python API Error:', error);
    throw error;
  }
};