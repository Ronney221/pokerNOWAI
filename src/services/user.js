import { API_URL } from '../config/api';

export const saveUserData = async (userData) => {
  try {
    console.log('Sending user data to server:', userData); // Debug log
    const response = await fetch(`${API_URL}/users/saveUserData`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Server error response:', errorData); // Debug log
      throw new Error(errorData || 'Failed to save user data');
    }
    
    const data = await response.json();
    console.log('Server success response:', data); // Debug log
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const getUserSettings = async (firebaseUid) => {
  try {
    const response = await fetch(`${API_URL}/users/${firebaseUid}/settings`);
    const data = await response.json();
    return data.user.settings;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const updateUserSettings = async (firebaseUid, settings) => {
  try {
    const response = await fetch(`${API_URL}/users/${firebaseUid}/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ settings }),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Failed to update user settings');
    }
    
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}; 