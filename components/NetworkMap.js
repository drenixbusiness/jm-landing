'use client';

import { useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ADDRESS } from '@/lib/site';

// Office map: dark CARTO basemap re-tinted to the site palette, with the Lombard HQ as a road-sign marker.
// MapLibre is only loaded when the map scrolls into view.
const CARTO_KEY = process.env.NEXT_PUBLIC_CARTO_KEY;
const STYLE = `https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json${CARTO_KEY ? `?api_key=${CARTO_KEY}` : ''}`;

// 21W311 Ahlstrand Rd, Lombard, IL 60148 (US Census geocoder match).
const HQ = { tag: 'HQ', name: 'Lombard, IL', sub: '21W311 Ahlstrand Rd', at: [-88.04084, 41.83283] };
const DIRECTIONS = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ADDRESS)}`;

function signMarker({ tag, name, sub }) {
  const el = document.createElement('div');
  el.className = 'map-sign';
  el.innerHTML = `<div class="map-sign__plate"><span class="map-sign__tag">${tag}</span><b>${name}</b><small>${sub}</small></div>`;
  return el;
}

// Re-tint CARTO Dark Matter toward the site's near-black teal palette.
function retint(map) {
  for (const layer of map.getStyle().layers) {
    const { id, type } = layer;
    try {
      if (type === 'background') map.setPaintProperty(id, 'background-color', '#0a0f12');
      else if (type === 'fill' && /water/.test(id)) map.setPaintProperty(id, 'fill-color', '#0a1b1f');
      else if (type === 'fill' && /landcover|landuse|park/.test(id)) map.setPaintProperty(id, 'fill-color', '#0d1517');
      else if (type === 'fill' && /building/.test(id)) map.setPaintProperty(id, 'fill-color', '#121c1e');
      else if (type === 'line' && /boundary|admin/.test(id)) map.setPaintProperty(id, 'line-color', '#1d3a36');
      else if (type === 'line' && /motorway|trunk|highway|primary/.test(id) && /fill/.test(id)) map.setPaintProperty(id, 'line-color', '#1c3b37');
      else if (type === 'symbol' && map.getLayoutProperty(id, 'text-field')) {
        map.setPaintProperty(id, 'text-color', /place|city|country|state/.test(id) ? '#8fb3ab' : '#5f7a75');
        map.setPaintProperty(id, 'text-halo-color', '#0a0f12');
      }
    } catch { /* layer without that property */ }
  }
}

export default function NetworkMap() {
  const box = useRef(null);
  const [state, setState] = useState('idle'); // idle | loading | ready | error

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let map = null;
    let disposed = false;
    let started = false;

    const start = async () => {
      started = true;
      setState('loading');
      try {
        const mod = await import('maplibre-gl');
        const maplibregl = mod.default || mod;
        if (disposed) return;
        maplibregl.setWorkerUrl?.('/maplibre/maplibre-gl-worker.mjs');
        map = new maplibregl.Map({
          container: el,
          style: STYLE,
          center: HQ.at,
          zoom: 13.2,
          minZoom: 4,
          maxZoom: 17,
          attributionControl: { compact: true },
          cooperativeGestures: true,
          dragRotate: false,
          pitchWithRotate: false,
          fadeDuration: 0,
        });
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
        map.touchZoomRotate.disableRotation();

        map.on('load', () => {
          if (disposed) return;
          retint(map);
          map.addSource('hq', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'Point', coordinates: HQ.at } } });
          map.addLayer({ id: 'hq-glow', type: 'circle', source: 'hq', paint: { 'circle-radius': 26, 'circle-color': '#1fbf8f', 'circle-opacity': 0.22, 'circle-blur': 0.7 } });
          map.addLayer({ id: 'hq-dot', type: 'circle', source: 'hq', paint: { 'circle-radius': 7, 'circle-color': '#ffffff', 'circle-stroke-color': '#1fbf8f', 'circle-stroke-width': 4 } });
          new maplibregl.Marker({ element: signMarker(HQ), anchor: 'bottom', offset: [0, -16] }).setLngLat(HQ.at).addTo(map);
          // Keep the sign comfortably in frame (it sits above the point).
          map.panBy([0, -50], { duration: 0 });
          setState('ready');
        });
        map.on('error', (e) => { if (!map.loaded()) console.warn('[map]', e?.error?.message || e); });
      } catch (err) {
        console.warn('[map] failed to load', err);
        setState('error');
      }
    };

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) start();
    }, { rootMargin: '300px 0px' });
    io.observe(el);

    return () => {
      disposed = true;
      io.disconnect();
      map?.remove();
    };
  }, []);

  return (
    <figure className="netmap" data-state={state}>
      <div className="netmap__canvas" ref={box} role="region" aria-label={`Map: Joshua Meuzelaar LLC office, ${ADDRESS}`} />
      {state !== 'ready' && (
        <div className="netmap__placeholder" aria-hidden="true">
          {state === 'error' ? 'Map unavailable' : 'Loading map…'}
        </div>
      )}
      <figcaption className="netmap__card">
        <span className="netmap__eyebrow">OUR OFFICE</span>
        <b>{ADDRESS}</b>
        <a href={DIRECTIONS} target="_blank" rel="noopener noreferrer">Get directions →</a>
      </figcaption>
    </figure>
  );
}
