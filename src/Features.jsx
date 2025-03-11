// src/Features.jsx
import React from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { useAuth } from './contexts/AuthContext';
import {
  DocumentTextIcon,
  ChartPieIcon,
  CalculatorIcon, 
  CurrencyDollarIcon,
  ArrowRightIcon,
  CheckIcon,
  XMarkIcon,
  SparklesIcon,
  ChartBarIcon,
  UserGroupIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';
import './index.css';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const floatingAnimation = {
  initial: { y: 0 },
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const glowAnimation = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const shimmerAnimation = {
  initial: { backgroundPosition: "200% 0" },
  animate: {
    backgroundPosition: ["-200% 0", "200% 0"],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

// Add new animation variants after existing ones
const cardFlipAnimation = {
  front: {
    rotateY: 0,
    transition: { duration: 0.6 }
  },
  back: {
    rotateY: 180,
    transition: { duration: 0.6 }
  }
};

const demoCardAnimation = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  hover: { y: -5, transition: { duration: 0.2 } }
};

// Feature card component for the main features section
const FeatureCard = ({ icon: Icon, title, description }) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="bg-base-100/60 backdrop-blur-sm p-5 rounded-xl border border-base-200 shadow-sm"
  >
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-lg font-medium">{title}</h3>
    </div>
    <p className="text-sm text-base-content/70">{description}</p>
  </motion.div>
);

// Feature list item component for pricing plans
const FeatureItem = ({ included, children }) => (
  <li className="flex items-center gap-3 py-2">
    {included ? (
      <CheckIcon className="h-5 w-5 text-success flex-shrink-0" />
    ) : (
      <XMarkIcon className="h-5 w-5 text-base-content/30 flex-shrink-0" />
    )}
    <span className={included ? "text-base-content" : "text-base-content/50"}>
      {children}
    </span>
  </li>
);

// Pricing plan card component
const PlanCard = ({ plan, price, features, isPremium, onSelect }) => (
  <motion.div
    whileHover={{ y: -4 }}
    className={`relative bg-base-100/60 backdrop-blur-sm p-6 rounded-2xl border-2 
      ${isPremium ? 'border-primary shadow-lg' : 'border-base-200'}`}
  >
    {isPremium && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
          Recommended
        </span>
      </div>
    )}
    
    <div className="text-center mb-6">
      <h3 className="text-xl font-bold mb-2">{plan}</h3>
      <div className="flex items-end justify-center gap-1">
        <span className="text-3xl font-bold">{price}</span>
        {price !== 'Free' && <span className="text-base-content/70 mb-1">/month</span>}
      </div>
    </div>

    <ul className="space-y-1 mb-6">
      {features.map((feature, index) => (
        <FeatureItem key={index} included={feature.included}>
          {feature.text}
        </FeatureItem>
      ))}
    </ul>

    <button
      onClick={onSelect}
      className={`btn btn-block ${isPremium ? 'btn-primary' : 'btn-outline'}`}
      disabled={!isPremium && !onSelect}
    >
      {isPremium ? 'Upgrade Now' : 'Current Plan'}
    </button>
  </motion.div>
);

const CoreFeatureCard = ({ icon: Icon, title, steps, description }) => (
    <motion.div
    variants={fadeInUp}
      whileHover={{ 
        y: -8,
      scale: 1.02,
      boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
      transition: { duration: 0.3, ease: "easeOut" }
      }}
    transition={{ duration: 0.3 }}
    className="group bg-base-100/60 backdrop-blur-sm p-8 rounded-xl border border-base-200 shadow-lg hover:shadow-2xl hover:border-primary/20 transition-all duration-300"
    >
        <div className="flex items-center gap-4 mb-6">
      <div className="p-4 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
        <Icon className="h-7 w-7 text-primary" />
          </div>
      <h3 className="text-2xl font-bold bg-gradient-to-r from-base-content to-base-content/70 bg-clip-text text-transparent">
        {title}
      </h3>
        </div>
    <p className="text-base text-base-content/70 mb-8 leading-relaxed">{description}</p>
    {steps && (
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <h4 className="font-medium text-base-content/90">How to Use:</h4>
        <ul className="space-y-3 text-base text-base-content/70">
          {steps.map((step, index) => (
            <motion.li 
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex gap-3 items-start"
            >
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm">
                {index + 1}
              </span>
              {step}
            </motion.li>
          ))}
        </ul>
      </motion.div>
    )}
  </motion.div>
);

const PremiumFeatureCard = ({ icon: Icon, title, features }) => (
  <motion.div
    variants={fadeInUp}
    whileHover={{
      y: -8,
      scale: 1.02,
      boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
      transition: { duration: 0.3, ease: "easeOut" }
    }}
    className="card bg-gradient-to-br from-base-100/80 to-base-100/40 backdrop-blur-md border border-base-200 p-8 hover:border-primary/20 transition-all duration-300 shadow-lg hover:shadow-2xl"
  >
    <Icon className="h-16 w-16 text-primary mx-auto mb-6 opacity-90" />
    <h3 className="font-bold text-2xl mb-4 text-center bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
      {title}
    </h3>
    <ul className="space-y-3 text-base text-base-content/70">
      {features.map((feature, index) => (
        <motion.li
          key={index}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex gap-3 items-start"
        >
          <CheckIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          {feature}
        </motion.li>
      ))}
    </ul>
  </motion.div>
);

const Disclaimer = () => (
  <motion.div
    variants={fadeInUp}
    className="bg-base-200/50 backdrop-blur-sm rounded-xl p-6 border border-base-300 text-sm text-base-content/70"
  >
    <h4 className="font-medium text-base-content mb-3">Important Disclaimers:</h4>
    <ul className="space-y-2">
      <li>• PokerNowAI is not affiliated with, endorsed by, or associated with PokerNow.club.</li>
      <li>• This tool is designed for use with PokerNow.club's free-to-play poker platform only.</li>
      <li>• We do not promote or encourage real-money gambling.</li>
      <li>• All analysis and features are intended for entertainment and educational purposes only.</li>
      <li>• Pricing and features are subject to change at the creator's discretion.</li>
      <li>• We are not responsible for any financial decisions or losses.</li>
    </ul>
  </motion.div>
);

// Replace the DemoCard component with ScreenshotCard
const ScreenshotCard = ({ icon: Icon, title, description, imageSrc, imageAlt }) => (
  <motion.div
    variants={fadeInUp}
    whileHover={{
      y: -5,
      transition: { duration: 0.2 }
    }}
    className="bg-base-100/60 backdrop-blur-sm rounded-xl border border-base-200 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
  >
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-bold">{title}</h3>
      </div>
      <p className="text-sm text-base-content/70 mb-6">
        {description}
      </p>
    </div>
    <div className="relative aspect-[16/9] w-full overflow-hidden bg-base-300/20">
      <img 
        src={imageSrc} 
        alt={imageAlt}
        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
      />
    </div>
  </motion.div>
);

// Update the FlipCard component
const FlipCard = () => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div 
      className="relative h-[400px] w-full perspective-1000 mx-auto max-w-3xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="relative w-full h-full"
        animate={{ 
          rotateY: isHovered ? 180 : 0,
          scale: isHovered ? 1.02 : 1,
        }}
        transition={{ 
          duration: 0.6,
          ease: "easeOut",
          scale: {
            duration: 0.2
          }
        }}
        style={{
          transformStyle: "preserve-3d",
          transformOrigin: "center"
        }}
      >
        {/* Front - Winning Hands */}
        <motion.div
          className="absolute inset-0 bg-base-100/60 backdrop-blur-sm p-6 rounded-xl border border-base-200 shadow-lg"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden"
          }}
          animate={{
            boxShadow: isHovered 
              ? "0 20px 40px rgba(0,0,0,0.2)" 
              : "0 10px 20px rgba(0,0,0,0.1)"
          }}
        >
          <motion.h3 
            className="text-xl font-bold mb-4 text-center bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
            animate={{
              scale: isHovered ? 0.95 : 1,
              opacity: isHovered ? 0.8 : 1
            }}
          >
            Top Winning Hands
          </motion.h3>
          <motion.div
            className="relative overflow-hidden rounded-lg shadow-md"
            animate={{
              scale: isHovered ? 0.98 : 1
            }}
          >
            <img 
              src="/top winning hands.png" 
              alt="Top winning hands analysis"
              className="w-full h-[300px] object-cover"
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-base-100/10 to-transparent"
              animate={{
                opacity: isHovered ? 0.3 : 0
              }}
            />
          </motion.div>
        </motion.div>

        {/* Back - Losing Hands */}
        <motion.div
          className="absolute inset-0 bg-base-100/60 backdrop-blur-sm p-6 rounded-xl border border-base-200 shadow-lg"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
          animate={{
            boxShadow: isHovered 
              ? "0 20px 40px rgba(0,0,0,0.2)" 
              : "0 10px 20px rgba(0,0,0,0.1)"
          }}
        >
          <motion.h3 
            className="text-xl font-bold mb-4 text-center bg-gradient-to-r from-red-500 to-red-600/70 bg-clip-text text-transparent"
            animate={{
              scale: !isHovered ? 0.95 : 1,
              opacity: !isHovered ? 0.8 : 1
            }}
          >
            Top Losing Hands
          </motion.h3>
          <motion.div
            className="relative overflow-hidden rounded-lg shadow-md"
            animate={{
              scale: !isHovered ? 0.98 : 1
            }}
          >
            <img 
              src="/top losing hands.png" 
              alt="Top losing hands analysis"
              className="w-full h-[300px] object-cover"
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-base-100/10 to-transparent"
              animate={{
                opacity: !isHovered ? 0.3 : 0
              }}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div 
        className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-base-content/70 flex items-center gap-2"
        animate={{
          opacity: [0.5, 1, 0.5],
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
      >
        <span>Hover to flip</span>
        <motion.div
          animate={{
            x: [0, 10, 0],
            transition: {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        >
          ↔
        </motion.div>
    </motion.div>
    </div>
  );
};

const StatCard = ({ icon: Icon, value, label, gradient }) => (
  <motion.div
    variants={fadeInUp}
    className="p-6 bg-base-100/40 rounded-xl"
  >
    <div className="flex items-center gap-4">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h3 className="text-4xl font-bold mb-2">{value}</h3>
        <p className="text-base-content/70">{label}</p>
      </div>
    </div>
  </motion.div>
);

const Features = ({ handlePageChange }) => {
  const { currentUser } = useAuth();

  const handleStartAnalysis = () => {
    if (currentUser) {
      handlePageChange('fullLogUpload');
    } else {
      handlePageChange('register');
    }
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add scroll animation setup
  const { scrollYProgress } = useScroll();
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const smoothParallax = useSpring(parallaxY, { stiffness: 100, damping: 30 });

  const handAnalysisFeatures = [
    {
      icon: DocumentTextIcon,
      title: "Upload Hand History",
      description: "Upload your PokerNow.club game logs to analyze your play in free home games with friends.",
      steps: [
        "Export your game log from PokerNow.club",
        "Upload the game_log.csv file",
        "Enter your PokerNow username",
        "Get detailed insights about your play"
      ]
    },
    {
      icon: ChartPieIcon,
      title: "Analytics Dashboard",
      description: "Track player reveals, preflop investments, and key performance metrics. Free version includes top 10 largest preflop raises.",
      steps: [
        "View VPIP (Voluntary Money Put In Pot %) statistics",
        "Analyze preflop raise frequencies",
        "Review top 10 winning & losing hands",
        "Study detailed hand breakdowns with opponent cards"
      ]
    }
  ];

  const ledgerFeatures = [
    {
      icon: CalculatorIcon,
      title: "Smart Ledger Management",
      description: "Import your PokerNow.club ledger to calculate optimal play-money settlements between friends.",
      steps: [
        "Export your ledger from PokerNow.club",
        "Upload the ledger.csv file",
        "View automated settlement suggestions",
        "Track play-money results"
      ]
    },
    {
      icon: CurrencyDollarIcon,
      title: "Bankroll Tracking",
      description: "Comprehensive bankroll management with detailed statistics and performance tracking.",
      steps: [
        "Monitor buy-ins and cash-outs",
        "Track net profit/loss over time",
        "View biggest wins and win streaks",
        "Analyze performance graphs and trends"
      ]
    }
  ];

  // Pricing plan features
  const freePlanFeatures = [
    { included: true, text: "Basic hand history analysis" },
    { included: true, text: "Simple ledger management" },
    { included: true, text: "Basic performance metrics" },
    { included: true, text: "Session tracking" },
    { included: false, text: "Player playstyle analysis" },
    { included: false, text: "Weakness identification" },
    { included: false, text: "Hand range predictions" },
    { included: false, text: "Personalized strategy advice" },
    { included: false, text: "Advanced VPIP & betting metrics" },
  ];

  const premiumPlanFeatures = [
    { included: true, text: "Everything in Free plan" },
    { included: true, text: "AI-Powered Player Profiling™ - Know exactly who you're playing against" },
    { included: true, text: "Advanced Pattern Recognition - Spot profitable opportunities others miss" },
    { included: true, text: "Dynamic Range Analysis - Predict opponents' hands with confidence" },
    { included: true, text: "Real-time Strategy Coach - Get personalized advice as you play" },
    { included: true, text: "Pro-Level Analytics Suite - Track 20+ advanced metrics" },
    { included: true, text: "Priority 24/7 Support - Get help when you need it" },
    { included: true, text: "Early Access Program - Be first to try new features" },
    { included: true, text: "Unlimited Analysis - No restrictions on hand histories or sessions" }
  ];

  return (
    <div className="min-h-screen pt-36 pb-12 px-4 bg-gradient-to-br from-base-100 via-base-100/95 to-base-200/90">
      {/* Decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div style={{ y: smoothParallax }} className="relative w-full h-full">
          <div className="absolute top-1/4 -left-12 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 -right-12 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-3xl"></div>
        </motion.div>
      </div>

    <motion.div
        initial="initial"
        animate="animate"
        className="max-w-7xl mx-auto relative z-10"
    >
      {/* Hero Section */}
          <motion.div
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <div className="inline-block mb-6">
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium"
            >
              Free Poker Analytics for Everyone
            </motion.span>
          </div>
            <motion.h1
            className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-base-content via-base-content to-base-content/70 bg-clip-text text-transparent"
          >
            Turn Your Poker Game Into a 
            <span className="text-primary"> Winning Strategy</span>
            </motion.h1>
          <p className="text-xl md:text-2xl text-base-content/70 max-w-3xl mx-auto leading-relaxed mb-8">
            Analyze your play, track your progress, and improve your game with AI-powered insights
          </p>
          <motion.button
            variants={glowAnimation}
            animate="animate"
                className="btn btn-primary btn-lg group relative overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartAnalysis}
          >
            <span className="relative z-10">Start Free Analysis</span>
            <ArrowRightIcon className="h-5 w-5 ml-2 relative z-10 group-hover:translate-x-1 transition-transform" />
          </motion.button>
              <button 
            onClick={() => {
              handlePageChange('payment');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="btn btn-outline btn-lg ml-4 group"
          >
            View Pricing Plans
                <ArrowRightIcon className="h-4 w-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" />
              </button>
          <p className="text-sm text-base-content/70 mt-4">
            No credit card required • Instant access • Free forever plan
          </p>
            </motion.div>

        {/* Social Proof Section - NEW */}
          <motion.div
          variants={fadeInUp}
          className="text-center mb-32"
          >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={SparklesIcon}
              value="10K+"
              label="Hands Analyzed Daily"
            />
            <StatCard
              icon={UserGroupIcon}
              value="100+"
              label="Active Players"
            />
            <StatCard
              icon={ShieldCheckIcon}
              value="600K+"
              label="CSV Lines Processed"
            />
            <StatCard
              icon={RocketLaunchIcon}
              value="2ms"
              label="Processing Time"
            />
          </div>
          </motion.div>

        {/* Interactive Demo Section - Move up for immediate engagement */}
        <motion.div 
          variants={staggerContainer}
          className="mb-32"
        >
          <div className="text-center mb-16">
            <motion.h2 
              variants={fadeInUp}
              className="text-3xl font-bold mb-4"
            >
              See Your Game Through AI's Eyes
            </motion.h2>
        </div>
          <motion.div
            variants={fadeInUp}
            className="relative bg-base-100/60 backdrop-blur-xl rounded-2xl border border-base-200 p-8 mb-16"
          >
            <img 
              src="/ranges.png" 
              alt="Opponent range analysis interface"
              className="w-full max-w-4xl mx-auto rounded-xl shadow-lg"
            />
          </motion.div>
          <FlipCard />
        </motion.div>

        {/* Core Features - Moved up */}
        <motion.div 
          variants={staggerContainer}
          className="mb-32"
        >
          <div className="text-center mb-16">
            <motion.h2
              variants={fadeInUp}
              className="text-3xl font-bold mb-4"
            >
              Everything You Need to Start
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-xl text-base-content/70"
            >
              Powerful features available in our free plan
            </motion.p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {handAnalysisFeatures.map((feature, index) => (
              <CoreFeatureCard key={index} {...feature} />
            ))}
          </div>
          </motion.div>

        {/* Premium Features Section */}
        <motion.div 
          variants={staggerContainer}
          className="mb-32"
        >
          <div className="text-center mb-16">
          <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="inline-block mb-6"
          >
              <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                Premium Features
              </span>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl font-bold mb-4"
            >
              Unlock Your Full Potential
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-xl text-base-content/70 max-w-2xl mx-auto"
            >
              Get access to advanced AI insights and professional-grade analytics
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <PremiumFeatureCard
              icon={UserGroupIcon}
              title="AI-Powered Player Profiling™"
              features={[
                "Precise playing style classification",
                "Bet sizing patterns and tendencies",
                "Position-based strategy insights",
                "Hand range modeling"
              ]}
            />
            <PremiumFeatureCard
              icon={ShieldCheckIcon}
              title="Strategic Edge Detection"
              features={[
                "Identify exploitable betting patterns",
                "Spot psychological triggers",
                "Recognize tilt indicators",
                "Track position-based weaknesses"
              ]}
            />
            <PremiumFeatureCard
              icon={LightBulbIcon}
              title="Real-time Strategy Coach"
              features={[
                "Personalized preflop charts",
                "Situation-specific advice",
                "Bankroll management tips",
                "Performance improvement tracking"
              ]}
            />
          </div>
        </motion.div>

        {/* Analytics Preview - Show depth of features */}
        <motion.div 
          variants={fadeInUp}
          className="mb-32 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-3xl blur-3xl"></div>
          <div className="relative bg-base-100/60 backdrop-blur-xl rounded-2xl border border-base-200 p-12 text-center">
            <h3 className="text-3xl font-bold mb-8">Pro-Level Analytics Suite</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-base-100/40 rounded-lg p-3">
                <div className="font-medium mb-1">VPIP Analysis</div>
                <div className="text-base-content/70">Track voluntary put in pot %</div>
              </div>
              <div className="bg-base-100/40 rounded-lg p-3">
                <div className="font-medium mb-1">3-Bet Patterns</div>
                <div className="text-base-content/70">Analyze re-raising strategies</div>
              </div>
              <div className="bg-base-100/40 rounded-lg p-3">
                <div className="font-medium mb-1">4-Bet Stats</div>
                <div className="text-base-content/70">Monitor escalation tendencies</div>
              </div>
              <div className="bg-base-100/40 rounded-lg p-3">
                <div className="font-medium mb-1">Position Stats</div>
                <div className="text-base-content/70">Track position-based play</div>
              </div>
              <div className="bg-base-100/40 rounded-lg p-3">
                <div className="font-medium mb-1">Range Analysis</div>
                <div className="text-base-content/70">Predict likely holdings</div>
              </div>
              <div className="bg-base-100/40 rounded-lg p-3">
                <div className="font-medium mb-1">Win Rate</div>
                <div className="text-base-content/70">Track profitability metrics</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Final CTA Section - Updated */}
        <motion.div 
          variants={fadeInUp}
          className="text-center mb-32"
        >
          <h2 className="text-4xl font-bold mb-6">Ready to Improve Your Game?</h2>
          <p className="text-xl text-base-content/70 mb-8 max-w-2xl mx-auto">
            Join thousands of players who have already enhanced their poker strategy with our AI-powered analytics
          </p>
            <motion.button
            variants={glowAnimation}
            animate="animate"
              className="btn btn-primary btn-lg group relative overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              handlePageChange('payment');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <span className="relative z-10">View Pricing Plans</span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary to-primary-focus"
              initial={{ x: '100%' }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.3 }}
            />
            <ArrowRightIcon className="h-5 w-5 ml-2 relative z-10 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          <p className="text-sm text-base-content/70 mt-4">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </motion.div>

        {/* Trust & Security - Move to bottom */}
        <motion.div 
          variants={fadeInUp}
          className="mt-20 max-w-4xl mx-auto"
        >
          <Disclaimer />
          <motion.p 
            className="text-center text-xs text-base-content/50 mt-6"
            variants={fadeInUp}
          >
            PokerNow.club is a free-to-play poker platform. No download required - just share a room link to play private poker games with friends.
          </motion.p>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute top-20 right-20 w-32 h-32 bg-primary/5 rounded-full blur-2xl"
        variants={floatingAnimation}
        animate="animate"
      ></motion.div>
      <motion.div
        className="absolute bottom-20 left-20 w-32 h-32 bg-secondary/5 rounded-full blur-2xl"
        variants={floatingAnimation}
        animate="animate"
        style={{ animationDelay: "-2s" }}
      ></motion.div>

      <motion.div
        className="relative overflow-hidden"
        variants={shimmerAnimation}
        animate="animate"
        style={{
          backgroundImage: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
          backgroundSize: "200% 100%"
        }}
      >
        {/* Wrap PremiumFeatureCard components */}
          </motion.div>
        </div>
  );
};

export default Features;
