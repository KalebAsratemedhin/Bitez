import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = { lat: 9.678112707591637, lng: 39.532579779624946 };
const DEFAULT_ICON = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export interface LeafletMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: number | string;
  className?: string;
  /** Display mode: marker at this position */
  markerPosition?: { lat: number; lng: number } | null;
  popupText?: string;
  /** Display mode: circle (e.g. delivery area) */
  circleCenter?: { lat: number; lng: number } | null;
  circleRadius?: number | null;
  circleUseBrandColor?: boolean;
  /** Interactive mode: when set, map is clickable and calls this with (lat, lng) */
  onLocationSelect?: (lat: number, lng: number) => void;
  /** Interactive mode: current selected position (marker + circle center) */
  selectedPosition?: { lat: number; lng: number } | null;
  /** Interactive mode: circle radius when selectedPosition is set */
  deliveryRadius?: number | null;
}

function ClickableMarker({
  position,
  onLocationSelect,
  deliveryRadius,
  useBrandColor,
}: {
  position: { lat: number; lng: number } | null;
  onLocationSelect: (lat: number, lng: number) => void;
  deliveryRadius: number | null;
  useBrandColor: boolean;
}) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  if (!position) return null;
  return (
    <>
      <Marker position={position} icon={DEFAULT_ICON}>
        <Popup>Location</Popup>
      </Marker>
      {deliveryRadius != null && deliveryRadius > 0 && (
        <Circle
          center={position}
          radius={deliveryRadius}
          pathOptions={{
            color: useBrandColor ? "var(--brand)" : "blue",
            fillColor: useBrandColor ? "var(--brand)" : "blue",
            fillOpacity: 0.2,
          }}
        />
      )}
    </>
  );
}

export default function LeafletMap({
  center = DEFAULT_CENTER,
  zoom = 13,
  height = "320px",
  className = "",
  markerPosition = null,
  popupText,
  circleCenter = null,
  circleRadius = null,
  circleUseBrandColor = false,
  onLocationSelect,
  selectedPosition = null,
  deliveryRadius = null,
}: LeafletMapProps) {
  const isInteractive = !!onLocationSelect;
  const circlePos = isInteractive ? selectedPosition : circleCenter;
  const circleRad = isInteractive ? deliveryRadius : circleRadius;

  return (
    <div
      className={`leaflet-map-root ${className}`.trim()}
      style={{
        height: typeof height === "number" ? `${height}px` : height,
        width: "100%",
      }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {isInteractive ? (
          <ClickableMarker
            position={selectedPosition}
            onLocationSelect={onLocationSelect}
            deliveryRadius={deliveryRadius ?? 0}
            useBrandColor={true}
          />
        ) : (
          <>
            {markerPosition && (
              <Marker position={markerPosition} icon={DEFAULT_ICON}>
                {popupText ? <Popup>{popupText}</Popup> : null}
              </Marker>
            )}
            {circlePos && circleRad != null && circleRad > 0 && (
              <Circle
                center={circlePos}
                radius={circleRad}
                pathOptions={{
                  color: circleUseBrandColor ? "var(--brand)" : "blue",
                  fillColor: circleUseBrandColor ? "var(--brand)" : "blue",
                  fillOpacity: 0.2,
                }}
              />
            )}
          </>
        )}
      </MapContainer>
    </div>
  );
}
