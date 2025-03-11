import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useAuth } from './contexts/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'react-toastify';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const PricingTier = ({ 
  tier, 
  price, 
  features, 
  isPopular, 
  onSelect, 
  onPurchase, 
  buttonText = 'Purchase Now',
  statusText,
  isLoading,
  disabled = false
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5 }}
    className={`relative bg-base-100/60 backdrop-blur-sm p-8 rounded-2xl border-2 ${
      isPopular ? 'border-primary shadow-xl' : 'border-base-200'
    }`}
  >
    {isPopular && (
      <div className="absolute -top-8 left-1/2 -translate-x-1/2">
        <span className="px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
          Most Popular
        </span>
      </div>
    )}
    <div className="text-center mb-8">
      <h3 className="text-2xl font-bold mb-4">{tier}</h3>
      <div className="flex items-baseline justify-center gap-2">
        <span className="text-4xl font-bold">{price === 0 ? 'Free' : `$${price}`}</span>
        {price > 0 && <span className="text-base-content/70">/month</span>}
      </div>
    </div>
    <ul className="space-y-4 mb-8">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start gap-3">
          <CheckIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <span className="text-base-content/80">{feature}</span>
        </li>
      ))}
    </ul>
    <div className="space-y-3">
      {price === 0 ? (
        <button
          onClick={onSelect}
          className="btn btn-block btn-outline"
        >
          Get Started
        </button>
      ) : (
        <div className="space-y-2">
          {statusText && (
            <div className="text-sm text-base-content/70 text-center">
              {statusText}
            </div>
          )}
          <button
            onClick={onPurchase}
            className={`btn btn-block ${disabled ? 'btn-disabled' : 'btn-primary'}`}
            disabled={disabled || isLoading}
          >
            {isLoading ? (
              <span className="loading loading-spinner loading-sm mr-2"></span>
            ) : null}
            {buttonText}
          </button>
        </div>
      )}
    </div>
  </motion.div>
);

const Payment = ({ handlePageChange }) => {
  const { currentUser, refreshUserStatus } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [userStatus, setUserStatus] = useState(null);

  // Fetch user status on mount
  useEffect(() => {
    const fetchUserStatus = async () => {
      if (!currentUser) return;
      
      try {
        const response = await fetch(`http://localhost:5000/api/users/${currentUser.uid}/status`);
        const data = await response.json();
        setUserStatus(data);
      } catch (error) {
        console.error('Error fetching user status:', error);
      }
    };

    fetchUserStatus();
  }, [currentUser]);

  const getPricingButtonContent = () => {
    if (!currentUser) {
      return {
        text: 'Sign Up to Start',
        onClick: () => handlePageChange('register'),
        disabled: false
      };
    }

    if (!userStatus) {
      return {
        text: 'Loading...',
        disabled: true
      };
    }

    if (userStatus.isPremium) {
      return {
        text: 'Already Premium',
        disabled: true,
        status: 'You have full access to all premium features'
      };
    }

    if (userStatus.isTrialActive) {
      const daysLeft = Math.ceil((new Date(userStatus.trialEndDate) - new Date()) / (1000 * 60 * 60 * 24));
      return {
        text: 'Upgrade to Premium',
        onClick: handlePurchase,
        disabled: isLoading,
        status: `${daysLeft} days left in trial`
      };
    }

    if (userStatus.hasUsedTrial) {
      return {
        text: 'Purchase Now',
        onClick: handlePurchase,
        disabled: isLoading,
        status: 'Trial period has ended'
      };
    }

    return {
      text: 'Start Free Trial',
      onClick: handleStartTrial,
      disabled: isLoading
    };
  };

  const handleStartTrial = async () => {
    if (!currentUser) {
      handlePageChange('register');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Show trial confirmation modal
    setShowTrialModal(true);
  };

  const confirmStartTrial = async () => {
    if (!tosAccepted) {
      toast.error('Please accept the Terms of Service to continue');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/users/start-trial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          email: currentUser.email
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start trial');
      }

      // Refresh user status to get updated trial status
      await refreshUserStatus();
      
      toast.success('Free trial activated successfully!');
      setShowTrialModal(false);
      handlePageChange('analytics');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error starting trial:', error);
      toast.error(error.message || 'Failed to start trial. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartAnalysis = () => {
    if (currentUser) {
      handlePageChange('fullLogUpload');
    } else {
      handlePageChange('register');
    }
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePurchase = () => {
    if (!currentUser) {
      handlePageChange('register');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Store the price ID in localStorage before navigating
    localStorage.setItem('stripePriceId', import.meta.env.VITE_STRIPE_PRICE_ID);

    // Navigate to the Stripe checkout page
    handlePageChange('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen pt-36 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block mb-6"
          >
            <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              Simple, Transparent Pricing
            </span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Choose the Perfect Plan for Your Game
          </h1>
          <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
            Start with our feature-rich free plan or unlock advanced AI insights with premium
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <PricingTier
            tier="Free"
            price={0}
            features={[
              "Basic hand history analysis",
              "Simple ledger management",
              "Basic performance metrics",
              "Session tracking",
              "Top 10 largest preflop raises",
              "Basic bankroll tracking",
              "Community support"
            ]}
            onSelect={handleStartAnalysis}
          />

          <PricingTier
            tier="Premium"
            price={9.99}
            isPopular={true}
            features={[
              "Everything in Free plan",
              "AI-Powered Player Profiling™",
              "Advanced Pattern Recognition",
              "Dynamic Range Analysis",
              "Real-time Strategy Coach",
              "Pro-Level Analytics Suite",
              "Priority 24/7 Support",
              "Early Access to New Features",
              "Unlimited Hand History Analysis"
            ]}
            onSelect={handleStartAnalysis}
            onPurchase={getPricingButtonContent().onClick}
            buttonText={getPricingButtonContent().text}
            statusText={getPricingButtonContent().status}
            isLoading={isLoading}
            disabled={getPricingButtonContent().disabled}
          />
        </div>

        {/* Trial Confirmation Modal */}
        {showTrialModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-base-100 rounded-2xl p-8 max-w-lg w-full shadow-xl border border-base-200"
            >
              <h3 className="text-2xl font-bold mb-4">Start Your Free Trial</h3>
              
              <div className="prose prose-sm mb-6">
                <p>
                  You're about to start your 14-day free trial of PokerNowAI Premium. Here's what you need to know:
                </p>
                <ul>
                  <li>Your trial will last for 14 days</li>
                  <li>You will have access to all premium features</li>
                  <li>No credit card required</li>
                  <li>You won't be charged after the trial expires</li>
                  <li>Your trial will automatically end after 14 days</li>
                </ul>
              </div>

              <div className="form-control mb-6">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={tosAccepted}
                    onChange={(e) => setTosAccepted(e.target.checked)}
                  />
                  <span className="label-text">
                    I agree to the <button onClick={() => window.open('/terms', '_blank')} className="link link-primary">Terms of Service</button> and understand that this is a trial of premium features
                  </span>
                </label>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowTrialModal(false)}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={confirmStartTrial}
                  disabled={isLoading || !tosAccepted}
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Starting Trial...
                    </>
                  ) : (
                    'Start Trial'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Only show the trial banner if user is eligible */}
        {(!userStatus?.isPremium && !userStatus?.isTrialActive && !userStatus?.hasUsedTrial) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-16 text-center"
          >
            <div className="bg-base-100/60 backdrop-blur-sm p-8 rounded-2xl border border-base-200 max-w-3xl mx-auto">
              <div className="flex flex-col items-center gap-6">
                <SparklesIcon className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="text-xl font-bold mb-2">Try Premium Risk-Free</h3>
                  <p className="text-base-content/70 mb-6">
                    Start your 14-day free trial of Premium. No credit card required.
                    Cancel anytime. Your data will never be used for real money gambling.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStartTrial}
                    className="btn btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Starting Trial...
                      </>
                    ) : (
                      'Start Free Trial'
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Payment; 