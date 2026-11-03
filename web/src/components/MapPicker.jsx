import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import MapCanvas, { L, pinIcon } from './MapCanvas.jsx';
import PlaceField from './PlaceField.jsx';

const coordsOf = (place) => [place.lat, place.lng];

export default function MapPicker({
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
}) {
  const [map, setMap] = useState(null);
  const [active, setActive] = useState(origin ? 'destination' : 'origin');
  const groupRef = useRef(null);
  const reqRef = useRef({ origin: 0, destination: 0 });

  // Once a pickup is chosen, the next map tap should set the drop-off.
  useEffect(() => {
    if (origin && !destination) setActive('destination');
    if (!origin) setActive('origin');
  }, [Boolean(origin), Boolean(destination)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!map) return;
    if (!groupRef.current) groupRef.current = L.layerGroup().addTo(map);

    const group = groupRef.current;
    group.clearLayers();
    const bounds = [];

    if (origin) {
      L.marker(coordsOf(origin), { icon: pinIcon('A', '#0f766e') }).addTo(group);
      bounds.push(coordsOf(origin));
    }
    if (destination) {
      L.marker(coordsOf(destination), { icon: pinIcon('B', '#e11d48') }).addTo(group);
      bounds.push(coordsOf(destination));
    }
    if (origin && destination) {
      L.polyline([coordsOf(origin), coordsOf(destination)], {
        color: '#0f766e',
        weight: 3,
        opacity: 0.55,
        dashArray: '7 9',
      }).addTo(group);
    }

    if (bounds.length === 2) {
      map.fitBounds(bounds, { padding: [46, 46], maxZoom: 14 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    }
  }, [map, origin, destination]);

  const handleClick = async (latlng) => {
    const field = active;
    const key = field === 'origin' ? 'origin' : 'destination';
    const setter = field === 'origin' ? onOriginChange : onDestinationChange;
    const requestId = ++reqRef.current[key];

    setter({ name: 'Locating…', lat: latlng.lat, lng: latlng.lng });
    if (field === 'origin') setActive('destination');

    const fallback = {
      name: `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`,
      lat: latlng.lat,
      lng: latlng.lng,
    };

    try {
      const data = await api(
        `/geocode/reverse?lat=${latlng.lat}&lng=${latlng.lng}`,
        { auth: false },
      );
      if (reqRef.current[key] !== requestId) return;
      const place = data.place || {};
      setter({ name: place.name || fallback.name, lat: latlng.lat, lng: latlng.lng });
    } catch {
      if (reqRef.current[key] !== requestId) return;
      setter(fallback);
    }
  };

  return (
    <div className="picker">
      <div className="picker-fields">
        <PlaceField
          label="Pickup"
          tone="a"
          value={origin}
          onChange={onOriginChange}
          placeholder="Search a starting point"
          active={active === 'origin'}
          onActivate={() => setActive('origin')}
        />
        <PlaceField
          label="Drop-off"
          tone="b"
          value={destination}
          onChange={onDestinationChange}
          placeholder="Search where you're going"
          active={active === 'destination'}
          onActivate={() => setActive('destination')}
        />
      </div>

      <div className="picker-toolbar">
        <div className="segmented" role="group" aria-label="Which pin to set on the map">
          <button
            type="button"
            className={active === 'origin' ? 'on' : ''}
            onClick={() => setActive('origin')}
          >
            Set pickup
          </button>
          <button
            type="button"
            className={active === 'destination' ? 'on' : ''}
            onClick={() => setActive('destination')}
          >
            Set drop-off
          </button>
        </div>
        <span className="picker-hint">
          Tap the map to drop the {active === 'origin' ? 'pickup' : 'drop-off'} pin
        </span>
      </div>

      <MapCanvas className="map-picker-canvas" onMap={setMap} onClick={handleClick} />

      {(!origin || !destination) && (
        <p className="picker-tip">
          <span>Tip:</span> search an address above, or tap anywhere on the map.
        </p>
      )}
    </div>
  );
}
