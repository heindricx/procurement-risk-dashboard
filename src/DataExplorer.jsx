import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabaseClient';
import { Search, Database, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const DataExplorer = ({ initialProvince, onProvinceChange }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters (Immediate state for inputs)
  const [filterProv, setFilterProv] = useState(initialProvince || '');
  const [filterMetode, setFilterMetode] = useState('');
  const [filterLembaga, setFilterLembaga] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Debounced states for querying
  const [debouncedProv, setDebouncedProv] = useState('');
  const [debouncedMetode, setDebouncedMetode] = useState('');
  const [debouncedLembaga, setDebouncedLembaga] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Expanded row state
  const [expandedRowId, setExpandedRowId] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 25; // Smaller chunks for responsiveness

  // Chart Data State
  const [chartData, setChartData] = useState([]);
  const [topLembagaData, setTopLembagaData] = useState([]);

  // Debounce logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedProv(filterProv);
      if (onProvinceChange) onProvinceChange(filterProv);
      setDebouncedMetode(filterMetode);
      setDebouncedLembaga(filterLembaga);
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [filterProv, filterMetode, filterLembaga, searchQuery]);

  // Handle incoming changes from Map clicking
  useEffect(() => {
    if (initialProvince !== undefined && initialProvince !== filterProv) {
      setFilterProv(initialProvince);
    }
  }, [initialProvince]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('procurement_anomalies')
        .select('*', { count: 'exact' });

      // Apply Filters
      if (debouncedProv) query = query.ilike('provinsi', `%${debouncedProv}%`);
      if (debouncedMetode) query = query.ilike('metode', `%${debouncedMetode}%`);
      if (debouncedLembaga) query = query.ilike('lembaga', `%${debouncedLembaga}%`);
      if (debouncedSearch) query = query.ilike('agenda', `%${debouncedSearch}%`);

      // Pagination & Sorting
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      query = query.order('skor_risiko', { ascending: false }).range(from, to);

      const { data: records, error, count } = await query;
      
      if (error) throw error;
      
      setData(records || []);
      if (count !== null) setTotalCount(count);

      // Simple client-side aggregation for charts based on current page data 
      // (For real prod we would do a separate aggregated query, but this works for interactivity demonstration)
      if (records) {
        // Pie Chart
        const catCounts = records.reduce((acc, curr) => {
          const cat = curr.kategori_risiko || 'Rendah';
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {});
        
        const COLORS = {
          'Rendah': '#10B981',
          'Sedang': '#F59E0B',
          'Tinggi': '#EF4444',
          'Anomali Ekstrem': '#7F1D1D'
        };

        const pieFormatted = Object.keys(catCounts).map(k => ({
          name: k,
          value: catCounts[k],
          color: COLORS[k] || '#888'
        }));
        setChartData(pieFormatted);

        // Bar Chart (Top 5 Lembaga by average risk on this page)
        const lembagaScores = {};
        records.forEach(r => {
          if (!lembagaScores[r.lembaga]) lembagaScores[r.lembaga] = { total: 0, count: 0 };
          lembagaScores[r.lembaga].total += r.skor_risiko;
          lembagaScores[r.lembaga].count += 1;
        });
        const barFormatted = Object.keys(lembagaScores)
          .map(k => ({
            name: k.substring(0, 15) + (k.length > 15 ? '...' : ''), // truncate long names
            avgRisk: Math.round(lembagaScores[k].total / lembagaScores[k].count)
          }))
          .sort((a,b) => b.avgRisk - a.avgRisk)
          .slice(0, 5);
        
        setTopLembagaData(barFormatted);
      }

    } catch (err) {
      console.error("Error fetching Supabase data:", err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedProv, debouncedMetode, debouncedLembaga, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedProv, debouncedMetode, debouncedLembaga, debouncedSearch]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const formatRp = (num) => {
    if (!num) return 'Rp 0';
    if (num >= 1e12) return `Rp ${(num / 1e12).toFixed(2)} T`;
    if (num >= 1e9) return `Rp ${(num / 1e9).toFixed(2)} M`;
    return `Rp ${(num / 1e6).toFixed(2)} Jt`;
  };

  const getRiskBadge = (category, score) => {
    let color = '#10B981'; // Rendah (Green)
    let bg = 'rgba(16, 185, 129, 0.1)';
    
    if (category === 'Sedang') {
      color = '#F59E0B'; // Yellow
      bg = 'rgba(245, 158, 11, 0.1)';
    } else if (category === 'Tinggi') {
      color = '#EF4444'; // Red
      bg = 'rgba(239, 68, 68, 0.1)';
    } else if (category === 'Anomali Ekstrem') {
      color = '#7F1D1D'; // Dark Red
      bg = 'rgba(127, 29, 29, 0.1)';
    }
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ background: bg, color: color, padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, display: 'inline-block', width: 'fit-content' }}>
          {category || 'Rendah'}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, paddingLeft: '4px' }}>
          Skor: {score ? score.toFixed(1) : '0.0'}
        </span>
      </div>
    );
  };

  const toggleRow = (id) => {
    if (expandedRowId === id) {
      setExpandedRowId(null);
    } else {
      setExpandedRowId(id);
    }
  };

  return (
    <motion.div 
      className="data-explorer-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      
      {/* Analytics Dashboard (Responsive Grid) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div className="modern-card" style={{ height: '300px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Distribusi Risiko Halaman Ini</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value} Proyek`, name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="modern-card" style={{ height: '300px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Top 5 Lembaga Berisiko</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topLembagaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip cursor={{ fill: 'transparent' }} />
              <Bar dataKey="avgRisk" fill="var(--danger-red)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="modern-card filter-wrapper" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ color: 'var(--text-main)', fontWeight: 600, marginRight: 'auto', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Database size={20} color="var(--primary-blue)" />
          Arsip Data ({totalCount.toLocaleString('id-ID')} Entri)
        </div>
        
        <div style={{ position: 'relative', flexGrow: 1, minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Ketik untuk mencari Agenda..." 
            className="filter-select"
            style={{ paddingLeft: '35px', backgroundImage: 'none', width: '100%' }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <input 
          type="text" 
          placeholder="Provinsi..." 
          className="filter-select"
          style={{ backgroundImage: 'none', flexGrow: 1, minWidth: '150px' }}
          value={filterProv}
          onChange={e => setFilterProv(e.target.value)}
        />
        
        <input 
          type="text" 
          placeholder="Lembaga..." 
          className="filter-select"
          style={{ backgroundImage: 'none', flexGrow: 1, minWidth: '150px' }}
          value={filterLembaga}
          onChange={e => setFilterLembaga(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="modern-card table-container" style={{ position: 'relative', padding: 0, overflow: 'hidden' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255, 255, 255, 0.7)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ color: 'var(--primary-blue)', fontWeight: 600, fontFamily: 'var(--font-sans)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="spinner" style={{ width: '24px', height: '24px', borderWidth: '3px' }}></div> Memuat...
            </div>
          </div>
        )}
        <table className="modern-table" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: '30px' }}></th>
              <th>Agenda</th>
              <th>Lembaga / Satker</th>
              <th>Pagu Asli</th>
              <th>Kategori Risiko</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {data.map((row, idx) => (
                <React.Fragment key={row.id || idx}>
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: (idx % 10) * 0.05 }}
                    onClick={() => toggleRow(row.id || idx)}
                    style={{ cursor: 'pointer', background: expandedRowId === (row.id || idx) ? 'rgba(0,113,227,0.02)' : 'transparent' }}
                  >
                    <td style={{ textAlign: 'center', color: 'var(--primary-blue)' }}>
                      {expandedRowId === (row.id || idx) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </td>
                    <td>
                      <div style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }} title={row.agenda}>
                        {row.agenda}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{row.lembaga}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{row.satker}</div>
                    </td>
                    <td style={{ color: 'var(--text-main)', fontWeight: 600 }}>{formatRp(row.pagu)}</td>
                    <td>{getRiskBadge(row.kategori_risiko, row.skor_risiko)}</td>
                  </motion.tr>
                  
                  {/* Expandable Details Panel */}
                  {expandedRowId === (row.id || idx) && (
                    <tr>
                      <td colSpan="5" style={{ padding: 0, borderBottom: '1px solid var(--border-light)' }}>
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          style={{ overflow: 'hidden', background: '#f9fafc' }}
                        >
                          <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                              <AlertTriangle size={20} color={row.fraud_value > 0 ? 'var(--danger-red)' : 'var(--primary-blue)'} style={{ marginTop: '2px' }} />
                              <div>
                                <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1rem' }}>Deskripsi Lengkap Agenda</h4>
                                <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                  {row.agenda}
                                </p>
                              </div>
                            </div>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginTop: '1rem', padding: '1rem', background: '#fff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                              <div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Lokasi / Metode</span>
                                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{row.provinsi} - {row.kota}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--primary-blue)', marginTop: '4px' }}>{row.metode}</div>
                              </div>
                              <div style={{ borderLeft: '1px solid rgba(0,0,0,0.05)', paddingLeft: '2rem' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Batas Kewajaran (P90)</span>
                                <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-main)' }}>{formatRp(row.p90)}</div>
                              </div>
                              <div style={{ borderLeft: '1px solid rgba(0,0,0,0.05)', paddingLeft: '2rem' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Nilai Pengajuan Aktual</span>
                                <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-main)' }}>{formatRp(row.pagu)}</div>
                              </div>
                              <div style={{ borderLeft: '1px solid rgba(0,0,0,0.05)', paddingLeft: '2rem' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--danger-red)', textTransform: 'uppercase' }}>Potensi Fraud (Excess)</span>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--danger-red)' }}>
                                  {row.fraud_value > 0 ? '+' : ''}{formatRp(row.fraud_value)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </AnimatePresence>
            {data.length === 0 && !loading && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  Tidak ada data yang ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '0 0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Halaman {page} dari {totalPages || 1}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="modern-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            Kembali
          </button>
          <button className="modern-btn" disabled={page >= totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)}>
            Lanjut
          </button>
        </div>
      </div>
    </motion.div>
  );
};
