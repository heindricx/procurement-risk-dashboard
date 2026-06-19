import React from 'react';
import { motion } from 'framer-motion';

export const RankingsTable = ({ provinces }) => {
  if (!provinces || provinces.length === 0) return null;

  // Sort by highest fraud value
  const sorted = [...provinces].sort((a, b) => b.total_fraud_value_rp - a.total_fraud_value_rp).slice(0, 10);

  const formatRp = (num) => {
    if (num >= 1e12) return `Rp ${(num / 1e12).toFixed(1)} T`;
    if (num >= 1e9) return `Rp ${(num / 1e9).toFixed(1)} M`;
    return `Rp ${(num / 1e6).toFixed(1)} Jt`;
  };

  return (
    <motion.div 
      className="glass-panel" 
      style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
    >
      <h3 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Top 10 Provinsi Risiko Tertinggi</h3>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <table className="ranking-table">
          <thead>
            <tr>
              <th>Provinsi</th>
              <th>Anomali</th>
              <th>Potensi Kerugian</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, idx) => (
              <motion.tr 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.5 + (idx * 0.05) }}
              >
                <td>{p.provinsi}</td>
                <td>{p.total_anomalies.toLocaleString('id-ID')}</td>
                <td style={{ color: 'var(--accent-red)', fontWeight: 600 }}>{formatRp(p.total_fraud_value_rp)}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};
