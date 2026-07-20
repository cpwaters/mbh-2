import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';

// Vite doesn't resolve Leaflet's default marker icon URLs correctly, so point
// them at the bundled assets directly.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function coloredDotIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 2px rgba(0,0,0,0.5);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

const originIcon = coloredDotIcon('#16a34a');
const destinationIcon = coloredDotIcon('#dc2626');

export interface Pin {
  lat: number;
  lng: number;
  label?: string;
}

interface FitBoundsProps {
  points: Pin[];
}

function FitBounds({ points }: FitBoundsProps) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 13);
    } else {
      map.fitBounds(
        points.map((p) => [p.lat, p.lng]),
        { padding: [40, 40] }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(points), map]);
  return null;
}

interface LiveLocationMapProps {
  currentLocation?: Pin;
  origin?: Pin;
  destination?: Pin;
  /** Actual road-following route geometry (e.g. from OSRM). Falls back to a
   *  straight dashed line between origin/destination when not provided. */
  routeGeometry?: Pin[];
}

export default function LiveLocationMap({ currentLocation, origin, destination, routeGeometry }: LiveLocationMapProps) {
  const hasRoute = routeGeometry && routeGeometry.length > 1;
  const points = hasRoute
    ? [...routeGeometry, currentLocation].filter((p): p is Pin => !!p)
    : [origin, destination, currentLocation].filter((p): p is Pin => !!p);
  const center = points[0] ?? { lat: 51.5074, lng: -0.1278 };

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {hasRoute ? (
        <Polyline
          positions={routeGeometry.map((p) => [p.lat, p.lng])}
          pathOptions={{ color: '#2563eb', weight: 4 }}
        />
      ) : (
        origin &&
        destination && (
          <Polyline
            positions={[
              [origin.lat, origin.lng],
              [destination.lat, destination.lng],
            ]}
            pathOptions={{ color: '#2563eb', weight: 3, dashArray: '8 8' }}
          />
        )
      )}

      {origin && (
        <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
          <Popup>{origin.label || 'Origin'}</Popup>
        </Marker>
      )}

      {destination && (
        <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
          <Popup>{destination.label || 'Destination'}</Popup>
        </Marker>
      )}

      {currentLocation && (
        <Marker position={[currentLocation.lat, currentLocation.lng]}>
          <Popup>{currentLocation.label || 'Current location'}</Popup>
        </Marker>
      )}

      <FitBounds points={points} />
    </MapContainer>
  );
}
