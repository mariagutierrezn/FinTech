import React from 'react';
import { motion } from 'framer-motion';

interface RiskScoreBarProps {
  score: number;
  status: 'APPROVED' | 'SUSPICIOUS' | 'REJECTED';
}

export const RiskScoreBar: React.FC<RiskScoreBarProps> = ({ score, status }) => {
  const getColor = () => {
    switch (status) {
      case 'APPROVED':
        return 'bg-user-approved';
      case 'SUSPICIOUS':
        return 'bg-user-warning';
      case 'REJECTED':
        return 'bg-user-error';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">Risk Score</span>
        <span className="text-sm font-bold text-gray-900">{score}/100</span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${getColor()}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};
