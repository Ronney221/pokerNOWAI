import { API_URL } from '../config/api';

export const createUserWithOAuth = async (userData) => {
  try {
    // Format the user data to match the existing user schema
    const formattedUserData = {
      firebaseUid: userData.firebaseUid,
      email: userData.email,
      username: userData.username || userData.email.split('@')[0],
      displayName: userData.displayName || userData.username || userData.email.split('@')[0],
      lastLogin: new Date(),
      photoURL: userData.photoURL
    };

    console.log('Sending OAuth user data to server:', formattedUserData);

    const response = await fetch(`${API_URL}/users/saveUserData`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formattedUserData),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Server error response:', errorData);
      throw new Error(errorData.error || 'Failed to create user account');
    }

    const data = await response.json();
    console.log('Server success response:', data);
    return data;
  } catch (error) {
    console.error('Error creating user with OAuth:', error);
    throw error;
  }
}; 