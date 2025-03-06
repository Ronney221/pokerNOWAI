// Animation variants for Framer Motion
export const pageTransitionVariants = {
  initial: { 
    opacity: 0,
    y: 20,
    position: 'absolute',
    width: '100%',
    left: 0,
    right: 0
  },
  animate: { 
    opacity: 1, 
    y: 0,
    position: 'relative',
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0,
    y: -20,
    position: 'absolute',
    width: '100%',
    left: 0,
    right: 0,
    transition: {
      duration: 0.3,
      ease: "easeIn"
    }
  }
};

export const containerVariants = {
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

export const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
}; 