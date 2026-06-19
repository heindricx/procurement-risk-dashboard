import React, { useState, useEffect } from 'react';
import { DashboardStats } from './DashboardStats';
import { MapComponent } from './MapComponent';
import { RankingsTable } from './RankingsTable';
import { Activity } from 'lucide-react';

function App() {
  const [riskData, setRiskData] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [riskRes, geoRes] = await Promise.all([
          fetch('/data/procurement_risk_map.json'),
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity color="var(--accent-red)" size={28} />
          <h1>National Procurement Risk Radar</h1>
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Model: QRLGBM P90 Threshold
        </div>
      </header>
      
      <main className="main-content">
        <aside className="sidebar">
          <DashboardStats metadata={riskData?.metadata} />
          <RankingsTable provinces={riskData?.provinces} />
        </aside>
        
        <MapComponent geoData={geoData} riskData={riskData} />
      </main>
    </div>
  );
}

export default App;
