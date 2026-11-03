import { useEffect, useRef } from 'react';
import L from 'leaflet';

export function pinIcon(label, color) {
  return L.divIcon({
    className: 'along-pin',
    html: `<span style="background:${color}">${label}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export function toLatLngs(coords = []) {
  return coords.map(([lng, lat]) => [lat, lng]);
}

export default function MapCanvas({
  center = [12.9716, 77.5946],
  zoom = 12,
  className = '',
  onMap,
  onClick,
}) {
  const elRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!elRef.current || mapRef.current) return undefined;

    const map = L.map(elRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: true,
    }).setView(center, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    mapRef.current = map;
    if (onMap) onMap(map);

    const timer = setTimeout(() => map.invalidateSize(), 150);
    return () => {
      clearTimeout(timer);
      map.remove();
      mapRef.current = null;
    };
    // The map is created once; later props are handled by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !onClick) return undefined;
    const handler = (event) => onClick(event.latlng, event);
    map.on('click', handler);
    return () => map.off('click', handler);
  }, [onClick]);

  return <div ref={elRef} className={`map ${className}`.trim()} />;
}

export { L };
