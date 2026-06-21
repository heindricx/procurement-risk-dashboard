import React, { useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { Layers } from 'lucide-react';

export const MapComponent = ({ geoData, riskData, onRegionClick }) => {
  const [filterType, setFilterType] = useState('semua');

  if (!geoData || !riskData || !riskData.provinces) return null;

  // Pilih tipe data
  const currentProvincesData = riskData.provinces[filterType] || riskData.provinces['semua'];

  // Map riskData by province name
  const riskMap = {};
  let maxScore = 0;
  currentProvincesData.forEach(p => {
    const pName = p.provinsi.toUpperCase();
    riskMap[pName] = p;
    if (p.avg_skor_risiko > maxScore) maxScore = p.avg_skor_risiko;
  });

  const getColor = (kategori, score) => {
    if (!kategori) return '#1e293b'; // Default dark blue for no data
    if (kategori === 'Anomali Ekstrem') return '#7F1D1D';
    if (kategori === 'Tinggi') return '#EF4444';
    if (kategori === 'Sedang') return '#F59E0B';
    return '#10B981'; // Rendah
  };

  const style = (feature) => {
    const pName = feature.properties.Propinsi.toUpperCase();
    const data = riskMap[pName];
    return {
      fillColor: getColor(data?.kategori_risiko, data?.avg_skor_risiko),
      weight: 1,
      opacity: 1,
      color: 'rgba(255,255,255,0.4)',
      dashArray: '3',
      fillOpacity: 0.85
    };
  };

  const formatRp = (num) => {
    if (!num) return "Rp 0";
    if (num >= 1e12) return `Rp ${(num / 1e12).toFixed(2)} T`;
    if (num >= 1e9) return `Rp ${(num / 1e9).toFixed(2)} M`;
    return `Rp ${(num / 1e6).toFixed(2)} Juta`;
  };

  const onEachFeature = (feature, layer) => {
    const pName = feature.properties.Propinsi.toUpperCase();
    const data = riskMap[pName];
    
    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 3,
          color: '#fff',
          dashArray: '',
          fillOpacity: 1
        });
        layer.bringToFront();
      },
      mouseout: (e) => {
        layer.setStyle(style(feature));
      },
      click: (e) => {
        if (onRegionClick) {
          onRegionClick(pName);
        }
      }
    });

    const tooltipContent = `
      <div style="font-family: var(--font-sans);">
        <h4 style="font-size: 1.1rem; color: var(--text-main); border-bottom: 1px solid var(--border-light); margin-bottom: 8px; padding-bottom: 8px; font-weight: 700;">${pName}</h4>
        <p style="margin: 4px 0; font-size: 0.9em; color: var(--text-secondary);">Filter: <b style="color: var(--text-main)">${filterType === 'semua' ? 'Keseluruhan' : (filterType === 'pemda' ? 'Pemerintah Daerah' : 'Kementerian / Lembaga')}</b></p>
        <p style="margin: 4px 0; font-size: 0.9em; color: var(--text-secondary);">Proyek Anomali: <b style="color: var(--warning-orange)">${data ? data.total_anomalies.toLocaleString('id-ID') : 0}</b></p>
        <p style="margin: 4px 0; font-size: 0.9em; color: var(--text-secondary);">Potensi Kerugian: <b style="color: var(--danger-red)">${data ? formatRp(data.total_fraud_value_rp) : "Rp 0"}</b></p>
        <div style="margin-top: 10px; background: rgba(0,0,0,0.03); padding: 6px; border-radius: 6px; display: inline-block;">
            <p style="margin: 0; font-size: 0.85rem; font-weight: 600;">Skor Risiko: ${data ? data.avg_skor_risiko.toFixed(1) : '0.0'}</p>
            <p style="margin: 0; font-size: 0.75rem; color: var(--text-secondary);">${data?.kategori_risiko || 'Rendah'}</p>
        </div>
        <p style="margin: 8px 0 0 0; font-size: 0.75em; color: var(--primary-blue); font-weight: 600;"><i>Klik untuk melihat detail proyek di tabel &rarr;</i></p>
      </div>
    `;
    layer.bindTooltip(tooltipContent, { sticky: true, className: 'leaflet-tooltip-modern' });
  };

  return (
    <div className="map-container" style={{ position: 'relative' }}>
      
      {/* Floating Controls */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', padding: '12px 16px', borderRadius: '12px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
            <Layers size={16} color="var(--primary-blue)" /> Filter Tingkat Instansi
        </div>
        <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            style={{ width: '100%', border: 'none', background: 'rgba(0,0,0,0.05)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', outline: 'none', fontWeight: 500 }}
        >
            <option value="semua">Semua Instansi</option>
            <option value="kementerian">Hanya Kementerian / Lembaga (Pusat)</option>
            <option value="pemda">Hanya Pemerintah Daerah</option>
        </select>
      </div>

      {/* Floating Legend */}
      <div style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 1000, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', padding: '15px', borderRadius: '12px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)', minWidth: '200px' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>Kategori Risiko Area</h4>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#7F1D1D' }}></div>
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Anomali Ekstrem (> 75)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#EF4444' }}></div>
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Risiko Tinggi (50-75)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#F59E0B' }}></div>
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Risiko Sedang (35-50)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#10B981' }}></div>
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Risiko Rendah (< 35)</span>
        </div>
      </div>

      <MapContainer 
        center={[-2.5, 118.0]} 
        zoom={5} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        {/* We use key={filterType} so the GeoJSON completely re-renders and re-colors when filter changes */}
        <GeoJSON 
          key={filterType}
          data={geoData} 
          style={style} 
          onEachFeature={onEachFeature} 
        />
      </MapContainer>
    </div>
  );
};
