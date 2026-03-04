"use client";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet-routing-machine";
import { PopulatedDelivery } from "@/types/delivery";

function getOrderCoords(orderId: PopulatedDelivery["orderId"]): { lat: number; lng: number } | null {
  if (!orderId || typeof orderId !== "object") return null;
  const coords = (orderId as { coordinates?: { lat?: number; lng?: number } }).coordinates;
  if (!coords || typeof coords.lat !== "number" || typeof coords.lng !== "number") return null;
  return { lat: coords.lat, lng: coords.lng };
}

function getRestaurantCoords(orderId: PopulatedDelivery["orderId"]): [number, number] | null {
  if (!orderId || typeof orderId !== "object") return null;
  const rest = (orderId as { restaurantID?: { location?: { coordinates?: number[] } } }).restaurantID;
  const loc = rest?.location?.coordinates;
  if (!Array.isArray(loc) || loc.length < 2 || typeof loc[0] !== "number" || typeof loc[1] !== "number")
    return null;
  return [loc[0], loc[1]];
}

const DeliveryDetailsPage = ({ delivery }: { delivery: PopulatedDelivery }) => {
  useEffect(() => {
    if (!delivery?.orderId) return;
    const dest = getOrderCoords(delivery.orderId);
    const restCoords = getRestaurantCoords(delivery.orderId);
    if (!dest || !restCoords) return;

    const map = L.map("map").setView([restCoords[0], restCoords[1]], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    const routingControl = L.Routing.control({
      waypoints: [L.latLng(restCoords[0], restCoords[1]), L.latLng(dest.lat, dest.lng)],
      routeWhileDragging: false,
      draggableWaypoints: false,
      createMarker: () => null,
    });
    routingControl.addTo(map);

    return () => {
      map.remove();
    };
  }, [delivery]);

  if (!delivery) return null;

  const dest = getOrderCoords(delivery.orderId);
  const restCoords = getRestaurantCoords(delivery.orderId);
  const canShowMap = dest && restCoords;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-4">
      <h1 className="text-2xl font-bold">Delivery Route</h1>
      {canShowMap ? (
        <div id="map" className="h-[500px] rounded-md overflow-hidden" />
      ) : (
        <p className="text-stone-500 text-sm py-4">Route not available (missing restaurant or delivery coordinates).</p>
      )}
    </div>
  );
};

export default DeliveryDetailsPage;
