import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from './supabaseClient';
import { Search, Database } from 'lucide-react';

export const DataExplorer = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterProv, setFilterProv] = useState('');
  const [filterMetode, setFilterMetode] = useState('');
  const [filterLembaga, setFilterLembaga] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Options for Dropdowns (Static for now to save network calls, or dynamically fetched)
  const [provinces, setProvinces] = useState([]);
  const [methods, setMethods] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 50;

  // Fetch unique filter options once
  useEffect(() => {
    const fetchFilters = async () => {
      // Just fetch some unique values to populate dropdowns
      // To be completely dynamic and fast, we can hardcode or do a distinct query.
      // Since Supabase REST doesn't support SELECT DISTINCT natively without RPC, 
      // we will just leave the dropdowns empty or fetch top 100 to populate.
      // For a massive dataset, we should ideally use RPC.
      // Let's assume the user types the search or we leave it as an input for simplicity,
      // but let's try a generic text input for these fields instead of massive dropdowns.
    };
    fetchFilters();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('procurement_anomalies')
        .select('*', { count: 'exact' });

      // Apply Filters
      if (filterProv) query = query.ilike('provinsi', `%${filterProv}%`);
      if (filterMetode) query = query.ilike('metode', `%${filterMetode}%`);
      if (filterLembaga) query = query.ilike('lembaga', `%${filterLembaga}%`);
      if (searchQuery) query = query.ilike('agenda', `%${searchQuery}%`);

      // Pagination & Sorting (Sort by fraud_value descending)
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      query = query.order('fraud_value', { ascending: false }).range(from, to);

      const { data: records, error, count } = await query;
      
      if (error) throw error;
      
      setData(records || []);
      if (count !== null) setTotalCount(count);

    } catch (err) {
      console.error("Error fetching Supabase data:", err);
    } finally {
      setLoading(false);
    }
  }, [page, filterProv, filterMetode, filterLembaga, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filterProv, filterMetode, filterLembaga, searchQuery]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const formatRp = (num) => {
    if (!num) return 'Rp 0';
    if (num >= 1e12) return `Rp ${(num / 1e12).toFixed(2)} T`;
    if (num >= 1e9) return `Rp ${(num / 1e9).toFixed(2)} M`;
    return `Rp ${(num / 1e6).toFixed(2)} Jt`;
  };

  return (
    <motion.div 
      className="data-explorer-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="filters-bar antigravity-glass-card" style={{ padding: '1rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ color: 'var(--accent-cyan)', fontWeight: 600, marginRight: 'auto', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Database size={20} />
          Supabase Grid ({totalCount.toLocaleString('id-ID')} Records)
        </div>
        
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Cari Agenda..." 
            className="filter-select"
            style={{ paddingLeft: '35px', backgroundImage: 'none' }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <input 
          type="text" 
          placeholder="Filter Provinsi" 
          className="filter-select"
          style={{ backgroundImage: 'none' }}
          value={filterProv}
          onChange={e => setFilterProv(e.target.value)}
        />
        
        <input 
          type="text" 
          placeholder="Filter Lembaga" 
          className="filter-select"
          style={{ backgroundImage: 'none' }}
          value={filterLembaga}
          onChange={e => setFilterLembaga(e.target.value)}
        />
      </div>

      <div className="data-table-wrapper" style={{ position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,7,10,0.5)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="spinner"></div>
          </div>
        )}
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
            {data.map((row, idx) => (
              <motion.tr 
                key={row.id || idx}
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
                <td className="val-danger">{row.fraud_value > 0 ? '+' : ''}{formatRp(row.fraud_value)}</td>
              </motion.tr>
            ))}
            {data.length === 0 && !loading && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Tidak ada data yang ditemukan.
                </td>
              </tr>
            )}
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
          <button className="page-btn" disabled={page >= totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)}>
            Next
          </button>
        </div>
      </div>
    </motion.div>
  );
};
