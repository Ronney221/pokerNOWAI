import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const usePremiumStatus = () => {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const apiBase = import.meta.env.VITE_HEROKU || 'http://127.0.0.1:5000';

  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${apiBase}/api/premium/status`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await currentUser.getIdToken()}`
          },
          credentials: 'same-origin'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch premium status');
        }

        const data = await response.json();
        setIsPremium(data.isPremium);
      } catch (err) {
        console.error('Error checking premium status:', err);
        setError(err.message);
        setIsPremium(false); // Default to non-premium on error
      } finally {
        setLoading(false);
      }
    };

    checkPremiumStatus();
  }, [currentUser, apiBase]);

  return { isPremium, loading, error };
}; 