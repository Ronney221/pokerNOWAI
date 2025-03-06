// src/Home.jsx
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './contexts/AuthContext';
import {
  ChartBarIcon,
  CalculatorIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartPieIcon,
  TrophyIcon,
  ArrowRightIcon,
  SparklesIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import './index.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

const FeatureCard = ({ icon: Icon, title, description, onClick, delay, page }) => {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ 
        y: -8,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
      className="group relative bg-base-100/50 backdrop-blur-md rounded-2xl overflow-hidden cursor-pointer border border-base-content/5"
      onClick={onClick}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Content */}
      <div className="relative p-8 flex flex-col h-full">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        </div>
        
        <p className="text-base-content/70 group-hover:text-base-content/90 transition-colors duration-300 mb-6">
          {description}
        </p>
        
        <div className="mt-auto flex items-center text-primary font-medium">
          <span className="group-hover:mr-2 transition-all duration-300">Learn more</span>
          <ArrowRightIcon className="h-4 w-4 opacity-0 group-hover:opacity-100 transform translate-x--4 group-hover:translate-x-0 transition-all duration-300" />
        </div>
      </div>
    </motion.div>
  );
};

const StatCard = ({ icon: Icon, label, value, gradient }) => (
  <motion.div
    variants={itemVariants}
    className="relative overflow-hidden rounded-2xl bg-base-100/50 backdrop-blur-md border border-base-content/5"
  >
    <div className={`absolute inset-0 opacity-[0.03] ${gradient}`} />
    <div className="relative p-6 flex items-center gap-4">
      <div className="p-3 rounded-xl bg-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div>
        <p className="text-4xl font-bold tracking-tight">{value}</p>
        <p className="text-base-content/70 text-sm">{label}</p>
      </div>
    </div>
  </motion.div>
);

const features = [
  {
    icon: DocumentTextIcon,
    title: "Hand History Analysis",
    description: "Upload your poker hand history for instant AI-powered insights and analysis.",
    page: "fullLogUpload"
  },
  {
    icon: ChartPieIcon,
    title: "Advanced Analytics",
    description: "Deep dive into your game with comprehensive statistics and visualizations.",
    page: "analytics"
  },
  {
    icon: CalculatorIcon,
    title: "Smart Ledger",
    description: "Effortlessly track and manage your poker sessions with automated calculations.",
    page: "ledger"
  },
  {
    icon: CurrencyDollarIcon,
    title: "Bankroll Management",
    description: "Monitor your bankroll growth with detailed performance tracking.",
    page: "bankroll"
  }
];

// Protected routes configuration - keep in sync with Navbar.jsx
const PROTECTED_ROUTES = {
  fullLogUpload: true,
  analytics: true,
  'saved-ledgers': true,
  bankroll: true,
  ledger: false
};

const Home = ({ setCurrentPage }) => {
  const { currentUser } = useAuth();

  useEffect(() => {
    // Smooth scroll to top when component mounts
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handlePageChange = (page) => {
    // Check if the route is protected and user is not logged in
    if (PROTECTED_ROUTES[page] && !currentUser) {
      setCurrentPage('register');
      // Smooth scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setCurrentPage(page);
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Update feature click handler to use handlePageChange
  const handleFeatureClick = (page) => {
    handlePageChange(page);
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
      className="min-h-screen"
    >
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-32">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.15, 0.1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              variants={itemVariants}
              className="inline-block mb-6 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm"
            >
              <span className="mr-2">✨</span>
              Revolutionizing Poker Analytics
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-5xl sm:text-6xl md:text-7xl font-bold mb-8 tracking-tight"
            >
              Transform Your{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Poker Game
              </span>{' '}
              with AI
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl md:text-2xl mb-12 text-base-content/70 leading-relaxed max-w-3xl mx-auto"
            >
              Leverage advanced AI analytics to make data-driven decisions and improve your win rate.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={() => handlePageChange(currentUser ? 'fullLogUpload' : 'register')}
                className="btn btn-primary btn-lg group relative overflow-hidden"
              >
                <span className="relative z-10">Get Started Free</span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
              <button
                onClick={() => handlePageChange('ledger')}
                className="btn btn-outline btn-lg group"
              >
                Try Ledger Calculator
                <ArrowRightIcon className="h-4 w-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <StatCard
              icon={SparklesIcon}
              value="10K+"
              label="Hands Analyzed Daily"
              gradient="bg-gradient-to-br from-primary to-secondary"
            />
            <StatCard
              icon={UserGroupIcon}
              value="500+"
              label="Active Players"
              gradient="bg-gradient-to-br from-secondary to-accent"
            />
            <StatCard
              icon={ShieldCheckIcon}
              value="98%"
              label="Accuracy Rate"
              gradient="bg-gradient-to-br from-accent to-primary"
            />
            <StatCard
              icon={RocketLaunchIcon}
              value="35%"
              label="Win Rate Increase"
              gradient="bg-gradient-to-br from-primary to-secondary"
            />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            className="text-center mb-16"
          >
            <motion.h2
              variants={itemVariants}
              className="text-4xl md:text-5xl font-bold mb-6"
            >
              Powerful Features for{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Winning Players
              </span>
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-xl text-base-content/70 max-w-2xl mx-auto"
            >
              Our comprehensive toolkit helps you analyze, improve, and excel at your poker game.
            </motion.p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                {...feature}
                onClick={() => handleFeatureClick(feature.page)}
                delay={0.1 * index}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        
        <div className="container mx-auto px-4 relative">
          <motion.div
            variants={containerVariants}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.h2
              variants={itemVariants}
              className="text-4xl md:text-5xl font-bold mb-6"
            >
              Ready to{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Level Up
              </span>{' '}
              Your Game?
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-xl text-base-content/70 mb-12 max-w-2xl mx-auto"
            >
              Join thousands of players who have already transformed their poker game with our AI-powered analytics.
            </motion.p>
            <motion.button
              variants={itemVariants}
              onClick={() => handlePageChange('register')}
              className="btn btn-primary btn-lg group relative overflow-hidden"
            >
              <span className="relative z-10">Get Started Free</span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.button>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
};

export default Home;
