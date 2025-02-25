import { API_URL } from '../config/urls';

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