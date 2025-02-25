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
  const [focused, setFocused] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const { signup, resendVerificationEmail, verificationStatus, currentUser } = useAuth();

  // Apple-inspired animation for form appearance
  useEffect(() => {
    const timer = setTimeout(() => {
      document.getElementById('register-form-container')?.classList.add('opacity-100', 'translate-y-0');
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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
    
    // Validate password as user types
    if (name === 'password') {
      validatePassword(value);
    }
  };
  
  const validatePassword = (password) => {
    if (!password) {
      setPasswordError(null);
      return false;
    }
    
    const hasMinLength = password.length >= 6;
    const hasUppercase = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasMinLength || !hasUppercase || !hasSpecialChar) {
      setPasswordError({
        hasMinLength,
        hasUppercase,
        hasSpecialChar
      });
      return false;
    }
    
    setPasswordError(null);
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (!validatePassword(formData.password)) {
      toast.error('Password does not meet requirements');
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
    setCurrentPage('home');
    toast.success('Welcome to PokerNowAI! Let\'s get started with your poker analysis.');
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-base-100 to-base-200 px-6">
        <div 
          id="register-form-container"
          className="w-full max-w-md transform transition-all duration-700 opacity-0 translate-y-4"
        >
          <div className="card bg-base-100 shadow-xl backdrop-blur-sm border border-base-300 overflow-hidden">
            <div className="card-body p-8">
              {verificationStatus === 'verified' ? (
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-light mb-2 text-success">Email Verified</h2>
                  <p className="text-base-content/70 mb-8">Your account is ready. You can now access all features.</p>
                  
                  <button 
                    onClick={handleGetStarted}
                    className="relative w-full transition-all duration-300 overflow-hidden group"
                  >
                    <div className="h-12 bg-gradient-to-r from-success to-success/80 rounded-xl flex items-center justify-center text-white font-medium group-hover:opacity-90 transition-opacity shadow-md">
                      Get Started Now
                    </div>
                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-success to-success/80 opacity-50 blur-lg transition-all duration-300 scale-90 group-hover:scale-100 group-hover:opacity-60"></div>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-light mb-2">Verify Your Email</h2>
                  <p className="text-base-content/70 mb-8">We've sent a verification email to <span className="font-medium">{formData.email}</span>. Please check your inbox and click the verification link.</p>
                  
                  <div className="w-full relative py-6 mb-8">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="animate-spin h-10 w-10 text-primary/20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    <div className="text-center text-base-content/50 text-sm">Waiting for verification...</div>
                  </div>
                  
                  <button 
                    onClick={handleResendVerification}
                    className="btn btn-outline btn-primary w-full h-12 rounded-xl"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Sending...</span>
                      </div>
                    ) : (
                      'Resend Verification Email'
                    )}
                  </button>
                  
                  <p className="mt-6 text-base-content/60 text-sm">
                    Already verified?{' '}
                    <span
                      className="text-primary font-medium cursor-pointer hover:underline"
                      onClick={() => setCurrentPage('login')}
                    >
                      Sign In
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-base-100 to-base-200 px-6">
      <div 
        id="register-form-container"
        className="w-full max-w-md transform transition-all duration-700 opacity-0 translate-y-4"
      >
        {/* Logo or Brand Element */}
        <div className="mb-10 text-center">
          {/* <div className="inline-block">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center mb-4 mx-auto shadow-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>  */}
          <h1 className="text-4xl font-light mb-1">Create Account</h1>
          <p className="text-base-content/60 text-sm">
            Begin your journey to better poker decisions
          </p>
        </div>

        <div className="card bg-base-100 shadow-xl backdrop-blur-sm border border-base-300">
          <div className="card-body p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email input */}
              <div className="space-y-2">
                <label className="text-sm font-medium pl-1 block">Email</label>
                <div 
                  className={`transition-all duration-300 rounded-xl border ${focused === 'email' ? 'border-primary shadow-sm' : 'border-base-300'} overflow-hidden bg-base-200/50`}
                >
                  <div className="flex items-center px-4 py-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={`h-5 w-5 mr-4 transition-all duration-300 ${focused === 'email' ? 'text-primary' : 'text-base-content/40'}`}
                    >
                      <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                      <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                    </svg>
                    <input
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused(null)}
                      className="grow bg-transparent border-none py-0 focus:outline-none focus:ring-0 text-base-content placeholder:text-base-content/30"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Username input */}
              <div className="space-y-2">
                <label className="text-sm font-medium pl-1 block">Username</label>
                <div 
                  className={`transition-all duration-300 rounded-xl border ${focused === 'username' ? 'border-primary shadow-sm' : 'border-base-300'} overflow-hidden bg-base-200/50`}
                >
                  <div className="flex items-center px-4 py-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={`h-5 w-5 mr-4 transition-all duration-300 ${focused === 'username' ? 'text-primary' : 'text-base-content/40'}`}
                    >
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                    </svg>
                    <input
                      type="text"
                      name="username"
                      placeholder="Choose a username"
                      value={formData.username}
                      onChange={handleChange}
                      onFocus={() => setFocused('username')}
                      onBlur={() => setFocused(null)}
                      className="grow bg-transparent border-none py-0 focus:outline-none focus:ring-0 text-base-content placeholder:text-base-content/30"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Password input */}
              <div className="space-y-2">
                <label className="text-sm font-medium pl-1 block">Password</label>
                <div 
                  className={`transition-all duration-300 rounded-xl border ${focused === 'password' ? 'border-primary shadow-sm' : 'border-base-300'} overflow-hidden bg-base-200/50`}
                >
                  <div className="flex items-center px-4 py-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={`h-5 w-5 mr-4 transition-all duration-300 ${focused === 'password' ? 'text-primary' : 'text-base-content/40'}`}
                    >
                      <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                    </svg>
                    <input
                      type="password"
                      name="password"
                      placeholder="Minimum 6 characters"
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused(null)}
                      className="grow bg-transparent border-none py-0 focus:outline-none focus:ring-0 text-base-content placeholder:text-base-content/30"
                    />
                  </div>
                </div>
                {/* Password requirements */}
                <div className="text-xs text-base-content/60 px-1">
                  <p>Password must have:</p>
                  <ul className="pl-4 mt-1 space-y-0.5">
                    <li className={`flex items-center gap-1 ${passwordError?.hasMinLength === false ? 'text-error/80' : passwordError?.hasMinLength === true ? 'text-success/80' : ''}`}>
                      <span className="inline-block w-1 h-1 rounded-full bg-current"></span> At least 6 characters
                    </li>
                    <li className={`flex items-center gap-1 ${passwordError?.hasUppercase === false ? 'text-error/80' : passwordError?.hasUppercase === true ? 'text-success/80' : ''}`}>
                      <span className="inline-block w-1 h-1 rounded-full bg-current"></span> One uppercase letter
                    </li>
                    <li className={`flex items-center gap-1 ${passwordError?.hasSpecialChar === false ? 'text-error/80' : passwordError?.hasSpecialChar === true ? 'text-success/80' : ''}`}>
                      <span className="inline-block w-1 h-1 rounded-full bg-current"></span> One special character
                    </li>
                  </ul>
                </div>
              </div>

              <button 
                type="submit" 
                className="relative w-full transition-all duration-300 overflow-hidden group mt-4"
                disabled={loading}
              >
                <div className="h-12 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center text-white font-medium group-hover:opacity-90 transition-opacity shadow-md">
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Creating Account</span>
                    </div>
                  ) : (
                    <span>Create Account</span>
                  )}
                </div>
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary to-secondary opacity-50 blur-lg transition-all duration-300 scale-90 group-hover:scale-100 group-hover:opacity-60"></div>
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-base-content/70">
            Already have an account?{' '}
            <span
              className="text-primary font-medium cursor-pointer hover:underline"
              onClick={() => setCurrentPage('login')}
            >
              Sign In
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
