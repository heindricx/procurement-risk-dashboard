import React, { useState, useEffect } from 'react';
import { DashboardStats } from './DashboardStats';
import { MapComponent } from './MapComponent';
import { RankingsTable } from './RankingsTable';
import { DataExplorer } from './DataExplorer';
import { Activity, Map as MapIcon, Database, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [riskData, setRiskData] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Global filter state to allow Map to communicate with DataExplorer
  const [globalFilterProv, setGlobalFilterProv] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [riskRes, geoRes] = await Promise.all([
          fetch(`/data/procurement_risk_map.json?v=${Date.now()}`),
          fetch('/data/indonesia.geojson')
        ]);
        
        const riskJson = await riskRes.json();
        const geoJson = await geoRes.json();
        
        setRiskData(riskJson);
        setGeoData(geoJson);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleMapClick = (provinceName) => {
    setGlobalFilterProv(provinceName);
    setActiveTab('data');
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="loading-screen" style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#0f172a' }}>
        <div className="spinner" style={{ width: '50px', height: '50px', borderTopColor: '#3b82f6' }}></div>
        <h2 style={{ color: '#fff', marginTop: '1rem', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>Memuat PantaUang Kita...</h2>
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{ maxWidth: '1600px' }}>
      
      {/* Hero Section */}
      <motion.header 
        className="hero-section"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="hero-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '1rem' }}>
            <ShieldAlert size={40} color="var(--primary-blue)" />
            <h1 className="hero-title">PANTAUANG KITA</h1>
          </div>
          <p className="hero-description">
            Sistem Deteksi Dini (Early Warning System) Risiko Pengadaan Barang & Jasa Nasional berbasis *Machine Learning* dan *Quantile Regression*.
          </p>
        </div>
        
        <div className="hero-nav">
          <button 
            className={`hero-tab-btn ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => setActiveTab('map')}
          >
            <MapIcon size={18} /> Radar Peta
          </button>
          <button 
            className={`hero-tab-btn ${activeTab === 'data' ? 'active' : ''}`}
            onClick={() => setActiveTab('data')}
          >
            <Database size={18} /> Arsip Anomali
          </button>
        </div>
      </motion.header>
      
      <main className="main-content-fluid">
        <AnimatePresence mode="wait">
          {activeTab === 'map' && (
            <motion.div 
              key="map-view"
              className="map-layout-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Map taking prominent central/left space */}
              <div className="map-primary-container">
                <MapComponent geoData={geoData} riskData={riskData} onRegionClick={handleMapClick} />
              </div>

              {/* Sidebar stats on the right */}
              <aside className="sidebar-stats">
                <DashboardStats metadata={riskData?.metadata} />
                <RankingsTable provinces={riskData?.provinces?.semua || riskData?.provinces} />
              </aside>
            </motion.div>
          )}

          {activeTab === 'data' && (
            <motion.div 
              key="data-view"
              style={{ width: '100%' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, type: "spring" }}
            >
              <DataExplorer 
                initialProvince={globalFilterProv} 
                onProvinceChange={setGlobalFilterProv} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
