import React from 'react';
import { motion } from 'framer-motion';

/**
 * LoaderOne
 * Minimalist, high-performance pulse loader from Aceternity UI.
 * Three synchronized pulsing dots in deep Mandate Navy (#080F1C).
 */
export const LoaderOne = ({ className = '', color = '#080F1C', size = 14 }) => {
  const transition = {
    repeat: Infinity,
    repeatType: 'loop',
    duration: 1,
    ease: 'easeInOut',
  };

  const dotStyle = {
    width: size,
    height: size,
    borderRadius: '50%',
    backgroundColor: color,
    display: 'inline-block',
  };

  return (
    <div
      className={`flex items-center justify-center space-x-2.5 ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
      }}
    >
      <motion.div
        style={dotStyle}
        animate={{
          scale: [1, 1.45, 1],
          opacity: [1, 0.35, 1],
        }}
        transition={transition}
      />
      <motion.div
        style={dotStyle}
        animate={{
          scale: [1, 1.45, 1],
          opacity: [1, 0.35, 1],
        }}
        transition={{
          ...transition,
          delay: 0.2,
        }}
      />
      <motion.div
        style={dotStyle}
        animate={{
          scale: [1, 1.45, 1],
          opacity: [1, 0.35, 1],
        }}
        transition={{
          ...transition,
          delay: 0.4,
        }}
      />
    </div>
  );
};

export function LoaderOneDemo() {
  return <LoaderOne />;
}

export default LoaderOne;
