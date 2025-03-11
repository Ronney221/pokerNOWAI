import { API_URL } from '../config/api';
import { getAuth } from 'firebase/auth';

export const saveUserData = async (userData) => {
  try {
    console.log('Sending user data to server:', userData); // Debug log
    
    // Get Firebase ID token
    const auth = getAuth();
    const idToken = await auth.currentUser.getIdToken();
    
    const response = await fetch(`${API_URL}/users/saveUserData`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': window.location.origin,
        'Authorization': `Bearer ${idToken}`
      },
      credentials: 'include',
      body: JSON.stringify(userData),
    });
    
    let data;
    const responseText = await response.text();
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse server response:', responseText);
      throw new Error('Invalid server response format');
    }

    if (!response.ok) {
      console.error('Server error response:', data);
      throw new Error(data.error || data.message || 'Server error: ' + response.status);
    }
    
    console.log('Server success response:', data); // Debug log
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const getUserSettings = async (firebaseUid) => {
  try {
    // Get Firebase ID token
    const auth = getAuth();
    const idToken = await auth.currentUser.getIdToken();
    
    const response = await fetch(`${API_URL}/users/${firebaseUid}/settings`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': window.location.origin,
        'Authorization': `Bearer ${idToken}`
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Failed to get user settings');
    }
    
    const data = await response.json();
    return data.user.settings;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const updateUserSettings = async (firebaseUid, settings) => {
  try {
    // Get Firebase ID token
    const auth = getAuth();
    const idToken = await auth.currentUser.getIdToken();
    
    const response = await fetch(`${API_URL}/users/${firebaseUid}/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': window.location.origin,
        'Authorization': `Bearer ${idToken}`
      },
      credentials: 'include',
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