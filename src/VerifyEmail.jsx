import React, { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { toast } from 'react-toastify';

const VerifyEmail = ({ setCurrentPage }) => {
  const [verifying, setVerifying] = useState(true);
  const { verifyEmail } = useAuth();

  useEffect(() => {
    const verifyEmailWithCode = async () => {
      try {
        // Get the verification code from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const actionCode = urlParams.get('oobCode');

        if (actionCode) {
          await verifyEmail(actionCode);
          toast.success('Email verified successfully!');
          setCurrentPage('template2');
        } else {
          toast.error('No verification code found in URL');
          setCurrentPage('login');
        }
      } catch (error) {
        toast.error(error.message || 'Failed to verify email');
        setCurrentPage('login');
      } finally {
        setVerifying(false);
      }
    };

    verifyEmailWithCode();
  }, [verifyEmail, setCurrentPage]);

  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content text-center">
        <div className="max-w-md">
          {verifying ? (
            <>
              <h1 className="text-3xl font-bold">Verifying your email...</h1>
              <div className="mt-4">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            </>
          ) : (
            <h1 className="text-3xl font-bold">Redirecting...</h1>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail; 