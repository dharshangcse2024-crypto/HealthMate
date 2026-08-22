import React from 'react';
import { motion } from 'framer-motion';

const BmiGauge = ({ bmi, category, color }) => {
  // Map BMI to angle (15 to 40 BMI range → 0 to 180 degrees)
  const minBmi = 15;
  const maxBmi = 40;
  const clampedBmi = Math.max(minBmi, Math.min(maxBmi, bmi || minBmi));
  const angle = ((clampedBmi - minBmi) / (maxBmi - minBmi)) * 180;
  
  const radius = 80;
  const cx = 100;
  const cy = 100;
  
  // Needle animation logic below

  return (
    <svg viewBox="0 0 200 120" style={{ width: '100%', maxWidth: '220px' }}>
      {/* Background arc segments */}
      {/* Underweight: 0-36deg (info) */}
      <path d="M 20 100 A 80 80 0 0 1 42.9 39.5" fill="none" stroke="var(--info)" strokeWidth="12" strokeLinecap="round" opacity="0.6" />
      {/* Normal: 36-72deg (success/amber) */}
      <path d="M 42.9 39.5 A 80 80 0 0 1 100 20" fill="none" stroke="var(--success)" strokeWidth="12" strokeLinecap="round" opacity="0.6" />
      {/* Overweight: 72-108deg (warning/orange) */}
      <path d="M 100 20 A 80 80 0 0 1 157.1 39.5" fill="none" stroke="var(--warning)" strokeWidth="12" strokeLinecap="round" opacity="0.6" />
      {/* Obese: 108-180deg (error/red) */}
      <path d="M 157.1 39.5 A 80 80 0 0 1 180 100" fill="none" stroke="var(--error)" strokeWidth="12" strokeLinecap="round" opacity="0.6" />
      
      {/* Needle and Center Dot */}
      <motion.g
        initial={{ rotate: 0 }}
        animate={{ rotate: angle }}
        transition={{ type: 'spring', stiffness: 50, damping: 15, delay: 0.3 }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      >
        <line x1={cx} y1={cy} x2={cx - radius * 0.75} y2={cy} stroke={color || '#64748b'} strokeWidth="3" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="6" fill={color || '#64748b'} />
        <circle cx={cx} cy={cy} r="3" fill="white" />
      </motion.g>
      
      {/* BMI Value */}
      <motion.text 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
        x={cx} y={cy + 2} textAnchor="middle" fill="var(--text)" fontSize="10" fontWeight="bold" dy="-20"
      >
        {bmi || '--'}
      </motion.text>
      
      {/* Labels */}
      <text x="20" y="115" textAnchor="start" fill="var(--text-muted)" fontSize="7">15</text>
      <text x="180" y="115" textAnchor="end" fill="var(--text-muted)" fontSize="7">40</text>
    </svg>
  );
};

export default BmiGauge;
