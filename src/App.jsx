import React, { useState, useEffect } from 'react';
import { DashboardStats } from './DashboardStats';
import { MapComponent } from './MapComponent';
import { RankingsTable } from './RankingsTable';
import { DataExplorer } from './DataExplorer';
import { Activity, Map as MapIcon, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [riskData, setRiskData] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [anomaliesData, setAnomaliesData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [riskRes, geoRes, anomaliesRes] = await Promise.all([
          fetch('/data/procurement_risk_map.json'),
          fetch('/data/indonesia.geojson'),
          fetch('/data/top_anomalies.json')
        ]);
        
        const riskJson = await riskRes.json();
        const geoJson = await geoRes.json();
        const anomaliesJson = await anomaliesRes.json();
        
        setRiskData(riskJson);
        setGeoData(geoJson);
        setAnomaliesData(anomaliesJson);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="header">
        <div>
          <h1>PANTAUANG KITA</h1>
          <div className="header-subtitle">National Procurement Risk Radar</div>
        </div>
        
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => setActiveTab('map')}
          >
            Peta Nasional
          </button>
          <button 
            className={`tab-btn ${activeTab === 'data' ? 'active' : ''}`}
            onClick={() => setActiveTab('data')}
          >
            Arsip Data
          </button>
        </div>
      </header>
      
      <main className="main-content">
        <AnimatePresence mode="wait">
          {activeTab === 'map' && (
            <motion.div 
              key="map-view"
              className="main-content"
              style={{ width: '100%' }}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              <aside className="sidebar">
                <DashboardStats metadata={riskData?.metadata} />
                <RankingsTable provinces={riskData?.provinces} />
              </aside>
              <MapComponent geoData={geoData} riskData={riskData} />
            </motion.div>
          )}

          {activeTab === 'data' && (
            <motion.div 
              key="data-view"
              className="main-content"
              style={{ width: '100%' }}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              <DataExplorer anomalies={anomaliesData} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
