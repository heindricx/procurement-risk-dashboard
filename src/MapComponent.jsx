import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Tooltip } from 'react-leaflet';
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
    if (!fraudValue) return 'transparent'; // Let the Google Map show through
    // Logarithmic scale for color
    const ratio = Math.pow(fraudValue / maxFraud, 0.5);
    
    // Gradient from Google Yellow to Google Red
    // Yellow: 251, 188, 4 -> Red: 234, 67, 53
    const r = Math.floor(251 - (17 * ratio));
    const g = Math.floor(188 - (121 * ratio));
    const b = Math.floor(4 + (49 * ratio));
    
    return `rgb(${r}, ${g}, ${b})`;
  };

  const style = (feature) => {
    const pName = feature.properties.Propinsi.toUpperCase();
    const data = riskMap[pName];
    const hasData = data && data.total_fraud_value_rp > 0;
    
    return {
      fillColor: getColor(data?.total_fraud_value_rp),
      weight: hasData ? 1.5 : 1,
      opacity: 1,
      color: hasData ? '#ea4335' : '#bdc1c6', // Google Red or Google Grey border
      dashArray: hasData ? '' : '4',
      fillOpacity: hasData ? 0.6 : 0.1 // Semi-transparent so map labels show through
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
          weight: hasData ? 3 : 2,
          color: hasData ? '#b31412' : '#80868b', // Darker Google Red or Grey
          dashArray: '',
          fillOpacity: hasData ? 0.8 : 0.3
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
        zoomControl={false}
      >
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
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
