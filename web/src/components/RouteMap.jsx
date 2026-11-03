import { useEffect, useRef, useState } from 'react';
import MapCanvas, { L, toLatLngs, pinIcon } from './MapCanvas.jsx';

/**
 * trips: [{ id, route, origin, destination, color, labels: ['A','B'] }]
 * shared: GeoJSON LineString of the overlapping stretch
 */
export default function RouteMap({ trips = [], shared = null, height = 380 }) {
  const [map, setMap] = useState(null);
  const groupRef = useRef(null);

  useEffect(() => {
    if (!map) return;
    if (!groupRef.current) groupRef.current = L.layerGroup().addTo(map);

    const group = groupRef.current;
    group.clearLayers();
    const bounds = [];

    trips.forEach((trip, index) => {
      const color = trip.color || (index === 0 ? '#2563eb' : '#db2777');
      const labels = trip.labels || (index === 0 ? ['A', 'B'] : ['C', 'D']);
      const latlngs = toLatLngs(trip.route?.coordinates || []);

      if (latlngs.length > 1) {
        L.polyline(latlngs, {
          color,
          weight: 5,
          opacity: 0.85,
          lineCap: 'round',
        }).addTo(group);
        bounds.push(...latlngs);
      }

      if (trip.origin) {
        const p = [trip.origin.lat, trip.origin.lng];
        L.marker(p, { icon: pinIcon(labels[0], color) }).addTo(group);
        bounds.push(p);
      }
      if (trip.destination) {
        const p = [trip.destination.lat, trip.destination.lng];
        L.marker(p, { icon: pinIcon(labels[1], color) }).addTo(group);
        bounds.push(p);
      }
    });

    if (shared?.coordinates?.length > 1) {
      L.polyline(toLatLngs(shared.coordinates), {
        color: '#f59e0b',
        weight: 8,
        opacity: 0.9,
        lineCap: 'round',
      }).addTo(group);
    }

    if (bounds.length) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 15 });
    }
  }, [map, trips, shared]);

  return (
    <div className="route-map" style={{ height }}>
      <MapCanvas onMap={setMap} />
    </div>
  );
}
