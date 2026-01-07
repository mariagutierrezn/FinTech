import React from 'react';

interface KPICardProps {
  title: string;
  value: string;
  trend: string;
  trendColor?: 'green' | 'yellow' | 'red' | 'gray';
  icon: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, trend, trendColor = 'gray', icon }) => {
  const trendColors = {
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
    gray: 'text-gray-400',
  };

  return (
    <div className="bg-admin-surface rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl">{icon}</span>
      </div>
      <h3 className="text-sm text-gray-400 mb-2">{title}</h3>
      <p className="text-3xl font-bold mb-2">{value}</p>
      <p className={`text-sm ${trendColors[trendColor]}`}>{trend}</p>
    </div>
  );
};

export default KPICard;
