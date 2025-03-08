import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useAuth } from './contexts/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'react-toastify';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const PricingTier = ({ tier, price, features, isPopular, onSelect, onPurchase, isLoading }) => (
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
        <button
          onClick={onPurchase}
          className="btn btn-block btn-primary"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="loading loading-spinner loading-sm mr-2"></span>
          ) : null}
          {isLoading ? 'Processing...' : 'Purchase Now'}
        </button>
      )}
    </div>
  </motion.div>
);

const Payment = ({ handlePageChange }) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartAnalysis = () => {
    if (currentUser) {
      handlePageChange('fullLogUpload');
    } else {
      handlePageChange('register');
    }
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePurchase = async () => {
    if (!currentUser) {
      handlePageChange('register');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setIsLoading(true);
      
      // Call your backend to create a Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          priceId: 'price_XXXXX', // Your Stripe price ID
          email: currentUser.email
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      
      // Load Stripe
      const stripe = await stripePromise;
      
      // Redirect to Stripe checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Unable to process payment. Please try again later.');
    } finally {
      setIsLoading(false);
    }
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
            onPurchase={handlePurchase}
            isLoading={isLoading}
          />
        </div>

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
                  onClick={handleStartAnalysis}
                  className="btn btn-primary"
                >
                  Start Free Trial
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Payment; 