import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';

export const MapComponent = ({ geoData, riskData }) => {
  if (!geoData || !riskData) return null;

  // Map riskData by province name
  const riskMap = {};
  let maxFraud = 0;
  riskData.provinces.forEach(p => {
    // Basic normalization for matching GeoJSON
    const pName = p.provinsi.toUpperCase();
    riskMap[pName] = p;
    if (p.total_fraud_value_rp > maxFraud) maxFraud = p.total_fraud_value_rp;
  });

  const getColor = (fraudValue) => {
    if (!fraudValue) return '#2c3e50';
    // Logarithmic scale for color
    const ratio = Math.pow(fraudValue / maxFraud, 0.5);
    
    // Gradient from dark blue to bright red
    const r = Math.floor(20 + (235 * ratio));
    const g = Math.floor(40 - (40 * ratio));
    const b = Math.floor(80 - (80 * ratio));
    
    return `rgb(${r}, ${g}, ${b})`;
  };

  const style = (feature) => {
    const pName = feature.properties.Propinsi.toUpperCase();
    const data = riskMap[pName];
    return {
      fillColor: getColor(data?.total_fraud_value_rp),
      weight: 1,
      opacity: 1,
      color: 'rgba(255,255,255,0.2)',
      dashArray: '3',
      fillOpacity: 0.8
    };
  };

  const formatRp = (num) => {
    if (!num) return "Rp 0";
    if (num >= 1e12) return `Rp ${(num / 1e12).toFixed(2)} Triliun`;
    if (num >= 1e9) return `Rp ${(num / 1e9).toFixed(2)} Miliar`;
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
      }
    });

    const tooltipContent = `
      <div style="font-family: var(--font-sans);">
        <h4 style="font-size: 1.1rem; color: var(--text-main); border-bottom: 1px solid var(--border-light); margin-bottom: 8px; padding-bottom: 8px; font-weight: 700;">${pName}</h4>
        <p style="margin: 4px 0; font-size: 0.9em; color: var(--text-secondary);">Total Proyek: <b style="color: var(--text-main)">${data ? data.total_projects.toLocaleString('id-ID') : 0}</b></p>
        <p style="margin: 4px 0; font-size: 0.9em; color: var(--text-secondary);">Proyek Anomali: <b style="color: var(--warning-orange)">${data ? data.total_anomalies.toLocaleString('id-ID') : 0}</b></p>
        <p style="margin: 4px 0; font-size: 0.9em; color: var(--text-secondary);">Potensi Kerugian: <b style="color: var(--danger-red)">${data ? formatRp(data.total_fraud_value_rp) : "Rp 0"}</b></p>
      </div>
    `;
    layer.bindTooltip(tooltipContent, { sticky: true, className: 'leaflet-tooltip-modern' });
  };

  return (
    <div className="map-container">
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
        <GeoJSON 
          data={geoData} 
          style={style} 
          onEachFeature={onEachFeature} 
        />
      </MapContainer>
    </div>
  );
};
