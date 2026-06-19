import React from 'react';

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
    <div className="academia-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Top 10 Provinsi Risiko Tertinggi</h3>
      <div className="academia-table-container" style={{ flex: 1 }}>
        <table className="academia-table">
          <thead>
            <tr>
              <th>Provinsi</th>
              <th>Proyek</th>
              <th>Potensi Risiko</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => (
              <tr key={i}>
                <td>
                  <span style={{ color: 'var(--text-muted)', marginRight: '8px', fontSize: '0.8em' }}>{i + 1}</span>
                  {p.provinsi}
                </td>
                <td>{p.total_anomalies.toLocaleString('id-ID')}</td>
                <td style={{ color: 'var(--blood)', fontWeight: 600 }}>{formatRp(p.total_fraud_value_rp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
