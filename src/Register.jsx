// src/Hero.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { toast } from 'react-toastify';

const Register = ({ setCurrentPage }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  });
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const { signup, resendVerificationEmail, verificationStatus, currentUser } = useAuth();

  // Monitor verification status changes
  useEffect(() => {
    if (verificationStatus === 'verified' && verificationSent) {
      toast.success('Email verified successfully!');
    }
  }, [verificationStatus, verificationSent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await signup(formData.email, formData.password, formData.username);
      setVerificationSent(true);
      toast.success('Account created! Please check your email to verify your account.');
    } catch (error) {
      toast.error(error.message || 'Failed to create account');
      setVerificationSent(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      await resendVerificationEmail();
      toast.success('Verification email resent! Please check your inbox.');
    } catch (error) {
      toast.error(error.message || 'Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = () => {
    setCurrentPage('template2');
    toast.success('Welcome to PokerNowAI! Let\'s get started with your poker analysis.');
  };

  if (verificationSent) {
    return (
      <div className="hero bg-base-200 min-h-screen">
        <div className="hero-content text-center">
          <div className="max-w-md space-y-4">
            {verificationStatus === 'verified' ? (
              <>
                <div className="flex flex-col items-center gap-4">
                  <div className="text-success">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h1 className="text-4xl font-bold text-success">Email Verified!</h1>
                  <p className="text-xl">Congratulations! Your account is now ready.</p>
                  <button 
                    onClick={handleGetStarted}
                    className="btn btn-primary btn-lg mt-4 w-full"
                  >
                    Get Started Now - It's Free!
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold">Verify Your Email</h1>
                <p className="py-2">
                  We've sent a verification email to {formData.email}. 
                  Please check your inbox and click the verification link to complete your registration.
                </p>
                <div className="flex justify-center py-4">
                  <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
                <div className="text-sm text-gray-600 text-center">
                  Waiting for verification...
                </div>
                <button 
                  onClick={handleResendVerification}
                  className="btn btn-outline btn-primary w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="loading loading-dots loading-sm"></span>
                  ) : (
                    'Resend Verification Email'
                  )}
                </button>
                <p className="mt-4">
                  Already verified?{' '}
                  <span
                    className="text-blue-500 cursor-pointer"
                    onClick={() => setCurrentPage('login')}
                  >
                    Login
                  </span>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hero bg-base-200 min-h-screen">
      <div className="hero-content text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-5xl font-bold">Elevate Your Game</h1>
          <p className="py-2">
            Track, analyze, and dominate every hand with our easy-to-use poker tracker. Your winning edge is just a click away.
          </p>
          <form onSubmit={handleSubmit} className="space-y-2">
            {/* Email input */}
            <label className="input input-bordered flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-4 w-4 opacity-70"
              >
                <path
                  d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z"
                />
                <path
                  d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z"
                />
              </svg>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="grow"
                required
              />
            </label>

            {/* Username input */}
            <label className="input input-bordered flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-4 w-4 opacity-70"
              >
                <path
                  d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z"
                />
              </svg>
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                className="grow"
                required
              />
            </label>

            {/* Password input */}
            <label className="input input-bordered flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-4 w-4 opacity-70"
              >
                <path
                  fillRule="evenodd"
                  d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="grow"
                required
                minLength={6}
              />
            </label>

            <button 
              type="submit" 
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-dots loading-md"></span>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>
          <p className="mt-4">
            Already have an account?{' '}
            <span
              className="text-blue-500 cursor-pointer"
              onClick={() => setCurrentPage('login')}
            >
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
