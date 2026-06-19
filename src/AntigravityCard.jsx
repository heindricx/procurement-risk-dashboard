import React, { useRef } from 'react';
import { motion } from 'framer-motion';

export const AntigravityCard = ({ children, className = '', delay = 0, style = {} }) => {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate rotation based on cursor position relative to the center of the card
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const xAxis = (centerX - x) / 25; // Adjusted sensitivity
    const yAxis = (centerY - y) / 25;
    
    cardRef.current.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg) translateY(-10px)`;
    cardRef.current.style.transition = 'none';
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transition = 'transform 0.5s ease';
    cardRef.current.style.transform = 'rotateY(0deg) rotateX(0deg) translateY(0px)';
  };

  return (
    <motion.div
      ref={cardRef}
      className={`antigravity-glass-card ${className}`}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
};
