import { API_URL } from '../config/urls';

export const saveUserData = async (userData) => {
  try {
    console.log('Sending data to server:', userData); // Log outgoing data
    const response = await fetch(`${API_URL}/users/saveUserData`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    console.log('Server response:', data); // Log server response
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}; 