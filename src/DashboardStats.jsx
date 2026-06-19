import React from 'react';

const StatCard = ({ title, value, subtitle, type }) => {
  return (
    <div className={`modern-card stat-card ${type}`}>
      <h3>{title}</h3>
      <div className="value">{value}</div>
      <div className="subtitle">{subtitle}</div>
    </div>
  );
};

export const DashboardStats = ({ metadata }) => {
  if (!metadata) return null;
  
  const formatRp = (num) => {
    if (num >= 1e12) return `Rp ${(num / 1e12).toFixed(2)} Triliun`;
    if (num >= 1e9) return `Rp ${(num / 1e9).toFixed(2)} Miliar`;
    if (num >= 1e6) return `Rp ${(num / 1e6).toFixed(2)} Juta`;
    return `Rp ${num.toLocaleString('id-ID')}`;
  };

  const anomalyRate = ((metadata.total_national_anomalies / metadata.total_national_projects) * 100).toFixed(1);

  return (
    <>
      <StatCard 
        title="Total Anomali (P90)" 
        value={metadata.total_national_anomalies.toLocaleString('id-ID')} 
        subtitle={`${anomalyRate}% dari total proyek nasional`}
        type="danger"
        delay={0.1}
      />
      <StatCard 
        title="Potensi Kerugian/Fraud" 
        value={formatRp(metadata.total_national_fraud_value_rp)} 
        subtitle="Akumulasi markup melebihi P90"
        type="warning"
        delay={0.2}
      />
      <StatCard 
        title="Total Pengadaan" 
        value={metadata.total_national_projects.toLocaleString('id-ID')} 
        subtitle={`Total Pagu: ${formatRp(metadata.total_national_pagu_rp)}`}
        type="info"
        delay={0.3}
      />
    </>
  );
};
