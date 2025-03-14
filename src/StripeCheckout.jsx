import React, { useCallback, useState, useEffect } from "react";
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';
import { useAuth } from './contexts/AuthContext';
import { toast } from 'react-toastify';
import { API_URL, APP_URL } from './config/api';

// Debug logging function
const debugLog = (message, data) => {
  console.log(`[StripeCheckout Debug] ${message}:`, data);
};

// Initialize Stripe outside component
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

debugLog('Environment Config', {
  NODE_ENV: process.env.NODE_ENV,
  API_URL,
  APP_URL,
  stripeKeyPresent: !!STRIPE_PUBLIC_KEY
});

if (!STRIPE_PUBLIC_KEY) {
  console.error('Missing Stripe public key! Make sure VITE_STRIPE_PUBLIC_KEY is set in your .env file');
}

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

const StripeCheckout = ({ handlePageChange }) => {
  const { currentUser, refreshUserStatus } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState("");
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    const createCheckoutSession = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get priceId directly from environment variable
        const priceId = import.meta.env.VITE_STRIPE_PRICE_ID;
        
        if (!priceId) {
          throw new Error('Price ID is not configured in environment variables.');
        }

        debugLog('Starting checkout session creation', {
          priceId,
          userId: currentUser.uid,
          email: currentUser.email,
          stripePublicKey: STRIPE_PUBLIC_KEY ? 'present' : 'missing',
          displayName: currentUser.displayName,
          origin: window.location.origin
        });

        // Get Firebase ID token
        const idToken = await currentUser.getIdToken();
        debugLog('Got Firebase ID token', { tokenLength: idToken.length });

        const requestUrl = `${API_URL}/create-checkout-session`;
        debugLog('Making request to', { url: requestUrl });

        // Create checkout session
        const response = await fetch(requestUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          credentials: 'include',
          body: JSON.stringify({
            priceId,
            userId: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || currentUser.email.split('@')[0],
            successUrl: `${APP_URL}/payment?success=true`,
            cancelUrl: `${APP_URL}/payment?success=false`
          }),
        });

        debugLog('Got response', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        let data;
        const responseText = await response.text();
        debugLog('Response text', responseText);

        try {
          data = JSON.parse(responseText);
          debugLog('Parsed response data', data);
        } catch (e) {
          console.error('Failed to parse server response:', responseText);
          throw new Error('Invalid server response format');
        }

        if (!response.ok) {
          debugLog('Server error response', data);
          throw new Error(data.error || data.message || 'Server error: ' + response.status);
        }

        if (!data.clientSecret) {
          debugLog('Missing client secret in response', data);
          throw new Error('Invalid response: missing client secret');
        }

        debugLog('Checkout session created successfully', {
          sessionId: data.sessionId,
          hasClientSecret: !!data.clientSecret
        });

        setClientSecret(data.clientSecret);
        setSessionId(data.sessionId);
      } catch (err) {
        console.error('Checkout error:', err);
        debugLog('Checkout error details', {
          message: err.message,
          stack: err.stack,
          name: err.name
        });
        setError(err.message);
        toast.error('Failed to initialize checkout. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      createCheckoutSession();
    }
  }, [currentUser]);

  const handleComplete = useCallback(async () => {
    console.log('Checkout completed, verifying payment status...');
    
    try {
      // Wait a moment for the webhook to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify the session status
      const response = await fetch(`${API_URL}/session-status?session_id=${sessionId}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        credentials: 'include'
      });

      let data;
      const responseText = await response.text();
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse status response:', responseText);
        throw new Error('Invalid status response format');
      }
      
      if (!response.ok) {
        console.error('Status check error:', data);
        throw new Error(data.error || data.message || 'Failed to verify payment status');
      }

      if (data.status === 'complete') {
        console.log('Payment confirmed successful');
        
        // Refresh user status to get updated premium status
        await refreshUserStatus();
        
        // Show success message
        toast.success('Payment successful! Your premium access is now active.');
        
        // Redirect to analytics page
        handlePageChange('analytics');
      } else {
        console.log('Payment not completed:', data.status);
        toast.warning('Payment is still processing. Please wait...');
      }
    } catch (err) {
      console.error('Error verifying payment:', err);
      toast.error('There was an issue verifying your payment. Please contact support if the issue persists.');
    }
  }, [sessionId, handlePageChange, refreshUserStatus]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200/50 py-12 flex items-center justify-center">
        <div className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200 max-w-lg mx-4">
          <div className="card-body text-center p-8">
            <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
            <p className="opacity-70 mb-6">You need to be logged in to make a purchase.</p>
            <button 
              className="btn btn-primary"
              onClick={() => handlePageChange('login')}
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200/50 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
          <p className="text-lg opacity-70">Setting up your checkout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200/50 py-12 flex items-center justify-center">
        <div className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200 max-w-lg mx-4">
          <div className="card-body text-center p-8">
            <div className="text-error mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4">Checkout Error</h2>
            <p className="opacity-70 mb-6">{error}</p>
            <button 
              className="btn btn-primary"
              onClick={() => handlePageChange('payment')}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200/50 py-12 pt-36">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200">
            <div className="card-body">
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{ clientSecret }}
              >
                <EmbeddedCheckout onComplete={handleComplete} />
              </EmbeddedCheckoutProvider>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StripeCheckout; 