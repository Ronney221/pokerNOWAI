import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from './contexts/AuthContext';
import { toast } from 'react-toastify';

const apiBase = import.meta.env.VITE_HEROKU || 'http://localhost:5000';

const StripeReturn = ({ handlePageChange }) => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [customerEmail, setCustomerEmail] = useState('');
  const { currentUser, refreshUserStatus } = useAuth();

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setStatus('error');
      return;
    }

    const checkStatus = async () => {
      try {
        const response = await fetch(`${apiBase}/api/session-status?session_id=${sessionId}`);
        if (!response.ok) {
          throw new Error('Failed to check session status');
        }

        const data = await response.json();
        setStatus(data.status);
        setCustomerEmail(data.customer_email);

        // If payment was successful
        if (data.status === 'complete') {
          try {
            // Refresh user status to get updated premium status
            await refreshUserStatus();
            toast.success('Premium access activated successfully!');
            
            // Redirect to analytics after a delay
            setTimeout(() => {
              handlePageChange('analytics');
            }, 5000);
          } catch (error) {
            console.error('Error refreshing user status:', error);
            toast.error('Payment successful but there was an error updating your status. Please contact support.');
          }
        }
      } catch (error) {
        console.error('Error checking session status:', error);
        setStatus('error');
      }
    };

    checkStatus();
  }, [searchParams, handlePageChange, refreshUserStatus]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200/50 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
          <p className="text-lg opacity-70">Processing your payment...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200/50 py-12 flex items-center justify-center">
        <div className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200 max-w-lg mx-4">
          <div className="card-body text-center p-8">
            <div className="text-error mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4">Payment Error</h2>
            <p className="opacity-70 mb-6">Something went wrong with your payment. Please try again.</p>
            <button 
              className="btn btn-primary"
              onClick={() => handlePageChange('payment')}
            >
              Return to Payment
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'open') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200/50 py-12 flex items-center justify-center">
        <div className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200 max-w-lg mx-4">
          <div className="card-body text-center p-8">
            <h2 className="text-2xl font-bold mb-4">Payment Incomplete</h2>
            <p className="opacity-70 mb-6">Your payment is not complete. Please try again.</p>
            <button 
              className="btn btn-primary"
              onClick={() => handlePageChange('payment')}
            >
              Return to Payment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200/50 py-12 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-base-100/90 shadow-xl backdrop-blur-sm border border-base-200 max-w-lg mx-4"
      >
        <div className="card-body text-center p-8">
          <div className="text-success mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4">Payment Successful!</h2>
          <p className="opacity-70 mb-6">
            Thank you for your purchase! A confirmation email will be sent to {customerEmail}.
          </p>
          <p className="text-sm opacity-50 mb-4">
            You will be redirected to the analytics page in a few seconds...
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => handlePageChange('analytics')}
          >
            Go to Analytics
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default StripeReturn; 