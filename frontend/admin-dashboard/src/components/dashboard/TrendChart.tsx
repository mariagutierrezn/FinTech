import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TrendChart: React.FC = () => {
  // Mock data - en producción, obtener del backend
  const data = [
    { time: '00:00', approved: 120, suspicious: 30, rejected: 10 },
    { time: '04:00', approved: 90, suspicious: 25, rejected: 8 },
    { time: '08:00', approved: 180, suspicious: 40, rejected: 15 },
    { time: '12:00', approved: 250, suspicious: 60, rejected: 25 },
    { time: '16:00', approved: 200, suspicious: 45, rejected: 18 },
    { time: '20:00', approved: 150, suspicious: 35, rejected: 12 },
    { time: '24:00', approved: 100, suspicious: 28, rejected: 10 },
  ];

  return (
    <div className="bg-admin-surface rounded-xl p-6">
      <h2 className="text-xl font-bold mb-6">Tendencia de Transacciones (Últimas 24h)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="time" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#374151',
              border: 'none',
              borderRadius: '8px',
              color: '#F9FAFB',
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="approved" stroke="#10B981" name="Aprobadas" strokeWidth={2} />
          <Line type="monotone" dataKey="suspicious" stroke="#FBBF24" name="Sospechosas" strokeWidth={2} />
          <Line type="monotone" dataKey="rejected" stroke="#F87171" name="Rechazadas" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendChart;
