/**
 * Animation variants for framer-motion
 * A collection of reusable animations for components
 */

import { Variants } from 'framer-motion';

// Basic entrance animations
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: 0.5
    }
  }
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
      mass: 0.8
    }
  }
};

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
      mass: 0.8
    }
  }
};

export const slideIn: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

// Scale animations
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  }
};

export const scaleOut: Variants = {
  hidden: { opacity: 0, scale: 1.1 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  }
};

// List item animations for staggered children
export const listContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      when: "beforeChildren",
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export const listItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  }
};

// Card animations
export const cardHover = {
  scale: 1.02,
  y: -5,
  transition: {
    type: "spring",
    stiffness: 400,
    damping: 15
  }
};

// Button animations
export const buttonTap = {
  scale: 0.95,
  transition: {
    type: "spring",
    stiffness: 400,
    damping: 17
  }
};

// Complex animations
export const pulseAnimation = {
  animate: {
    scale: [1, 1.03, 1],
    opacity: [0.7, 1, 0.7],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

export const shimmer = {
  animate: {
    backgroundPosition: ["0% 0%", "100% 100%"],
  },
  transition: {
    repeat: Infinity,
    repeatType: "mirror",
    ease: "linear",
    duration: 2
  }
};

export const float = {
  animate: {
    y: [0, -10, 0],
  },
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

export const spinSlow = {
  animate: {
    rotate: 360
  },
  transition: {
    repeat: Infinity,
    ease: "linear",
    duration: 20
  }
};

// Page transitions
export const pageTransition: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.15,
      ease: "easeOut",
      duration: 0.3
    }
  },
  exit: {
    opacity: 0,
    transition: {
      when: "afterChildren",
      staggerChildren: 0.05,
      staggerDirection: -1,
      ease: "easeIn",
      duration: 0.2
    }
  }
};

export const contentTransition: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      ease: "easeOut",
      duration: 0.4
    }
  },
  exit: {
    opacity: 0,
    y: 15,
    transition: {
      ease: "easeIn",
      duration: 0.2
    }
  }
};

// Modal animations
export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: 0.2
    }
  },
  exit: {
    opacity: 0,
    transition: {
      delay: 0.1,
      duration: 0.2
    }
  }
};

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.2
    }
  }
};

// Border animations
export const borderPulse = {
  animate: {
    boxShadow: [
      "0 0 0 0px rgba(16, 185, 129, 0.2)",
      "0 0 0 4px rgba(16, 185, 129, 0.2)",
      "0 0 0 0px rgba(16, 185, 129, 0.2)"
    ]
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

// Text typing animation helper
export const createTypewriterVariants = (text: string): Variants => {
  return {
    hidden: { width: "0%" },
    visible: {
      width: "100%",
      transition: {
        duration: text.length * 0.05, // Adjust speed as needed
        ease: "easeInOut"
      }
    }
  };
};

// Skew animation for card flips
export const skewCard: Variants = {
  hidden: { opacity: 0, rotateY: -20, rotateX: 10 },
  visible: { 
    opacity: 1, 
    rotateY: 0, 
    rotateX: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

// Path drawing for SVG animations
export const drawPath = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { 
    pathLength: 1, 
    opacity: 1,
    transition: {
      pathLength: { 
        type: "spring", 
        duration: 1.5, 
        bounce: 0 
      },
      opacity: { 
        duration: 0.3 
      }
    }
  }
};

// Utility function to create staggered children container
export const createStaggerContainer = (staggerDelay = 0.1, initialDelay = 0.2): Variants => {
  return {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: staggerDelay,
        delayChildren: initialDelay
      }
    }
  };
}; 