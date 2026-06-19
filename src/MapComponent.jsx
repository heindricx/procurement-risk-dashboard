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
    if (!fraudValue) return '#2c3e50';
    // Logarithmic scale for color
    const ratio = Math.pow(fraudValue / maxFraud, 0.5);
    
    // Gradient from pale yellow/gold to deep blood red
    const r = Math.floor(255 - (87 * ratio)); // 255 -> 168
    const g = Math.floor(245 - (186 * ratio)); // 245 -> 59
    const b = Math.floor(220 - (178 * ratio)); // 220 -> 42
    
    return `rgb(${r}, ${g}, ${b})`;
  };

  const style = (feature) => {
    const pName = feature.properties.Propinsi.toUpperCase();
    const data = riskMap[pName];
    return {
      fillColor: getColor(data?.total_fraud_value_rp),
      weight: 1,
      opacity: 1,
      color: 'var(--panel-border)',
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
          weight: 2,
          color: 'var(--blood)',
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
      <div class="academia-tooltip">
        <h4 style="font-family: var(--font-display); color: var(--mahogany); border-bottom: 1px solid var(--panel-border); margin-bottom: 5px; padding-bottom: 5px;">${pName}</h4>
        <p style="margin: 3px 0; font-size: 0.9em; color: var(--text-body);">Total Proyek: <b>${data ? data.total_projects.toLocaleString('id-ID') : 0}</b></p>
        <p style="margin: 3px 0; font-size: 0.9em; color: var(--text-body);">Proyek Anomali: <b style="color: var(--mahogany-bright)">${data ? data.total_anomalies.toLocaleString('id-ID') : 0}</b></p>
        <p style="margin: 3px 0; font-size: 0.9em; color: var(--text-body);">Potensi Kerugian: <b style="color: var(--blood)">${data ? formatRp(data.total_fraud_value_rp) : "Rp 0"}</b></p>
      </div>
    `;
    layer.bindTooltip(tooltipContent, { sticky: true, className: 'leaflet-tooltip-academia' });
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
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
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
