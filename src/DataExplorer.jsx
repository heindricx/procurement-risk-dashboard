import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

export const DataExplorer = ({ anomalies }) => {
  const [filterProv, setFilterProv] = useState('');
  const [filterMetode, setFilterMetode] = useState('');
  const [filterLembaga, setFilterLembaga] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;

  // Derive unique options
  const provinces = useMemo(() => [...new Set(anomalies.map(a => a.provinsi))].sort(), [anomalies]);
  const methods = useMemo(() => [...new Set(anomalies.map(a => a.metode))].sort(), [anomalies]);
  const institutions = useMemo(() => [...new Set(anomalies.map(a => a.lembaga))].sort(), [anomalies]);

  const filteredData = useMemo(() => {
    return anomalies.filter(item => {
      if (filterProv && item.provinsi !== filterProv) return false;
      if (filterMetode && item.metode !== filterMetode) return false;
      if (filterLembaga && item.lembaga !== filterLembaga) return false;
      return true;
    });
  }, [anomalies, filterProv, filterMetode, filterLembaga]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const formatRp = (num) => {
    if (num >= 1e12) return `Rp ${(num / 1e12).toFixed(2)} T`;
    if (num >= 1e9) return `Rp ${(num / 1e9).toFixed(2)} M`;
    return `Rp ${(num / 1e6).toFixed(2)} Jt`;
  };

  // Reset page when filters change
  React.useEffect(() => { setPage(1); }, [filterProv, filterMetode, filterLembaga]);

  return (
    <motion.div 
      className="data-explorer-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="filters-bar glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', flexWrap: 'wrap' }}>
        <div style={{ color: 'var(--accent-cyan)', fontWeight: 600, marginRight: 'auto', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Intel Data Grid ({filteredData.length.toLocaleString('id-ID')} Records)
        </div>
        
        <select className="filter-select" value={filterProv} onChange={e => setFilterProv(e.target.value)}>
          <option value="">Semua Provinsi</option>
          {provinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        
        <select className="filter-select" value={filterMetode} onChange={e => setFilterMetode(e.target.value)}>
          <option value="">Semua Metode</option>
          {methods.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <select className="filter-select" value={filterLembaga} onChange={e => setFilterLembaga(e.target.value)}>
          <option value="">Semua Lembaga</option>
          {institutions.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>

      <div className="data-table-wrapper">
        <table className="nemesis-table">
          <thead>
            <tr>
              <th>Agenda</th>
              <th>Lembaga / Satker</th>
              <th>Provinsi / Kota</th>
              <th>Metode</th>
              <th>Pagu Asli</th>
              <th>Batas P90</th>
              <th>Potensi Fraud</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((row, idx) => (
              <motion.tr 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.01 }}
              >
                <td>
                  <div style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.agenda}>
                    {row.agenda}
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 500 }}>{row.lembaga}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.satker}</div>
                </td>
                <td>
                  <div>{row.provinsi}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.kota}</div>
                </td>
                <td>{row.metode}</td>
                <td style={{ color: 'var(--text-muted)' }}>{formatRp(row.pagu)}</td>
                <td style={{ color: 'var(--text-muted)' }}>{formatRp(row.p90)}</td>
                <td className="val-danger">+{formatRp(row.fraud_value)}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Halaman {page} dari {totalPages || 1}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            Previous
          </button>
          <button className="page-btn" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)}>
            Next
          </button>
        </div>
      </div>
    </motion.div>
  );
};
