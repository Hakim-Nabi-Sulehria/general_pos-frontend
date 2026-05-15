import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Badge } from "@/components/ui/badge";

// --- Fix for Default Marker Icon ---
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- CUSTOM PULSING MARKER ---
const createCustomIcon = (revenue: number, isSelected: boolean) => {
  const colorClass = isSelected
    ? "bg-orange-500"
    : revenue > 100000
    ? "bg-green-500"
    : "bg-blue-600";

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div class="relative flex items-center justify-center w-6 h-6">
        <span class="absolute w-full h-full rounded-full opacity-75 animate-ping ${colorClass}"></span>
        <span class="relative w-3 h-3 rounded-full border-2 border-white shadow-md ${colorClass}"></span>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

// --- SMART MAP CONTROLLER ---
// Ye component data change hone par Map ko move karega
function MapController({
  data,
  selectedBranchId,
}: {
  data: any[];
  selectedBranchId: string;
}) {
  const map = useMap();

  useEffect(() => {
    if (data && data.length > 0) {
      // Case 1: Agar koi specific Branch select hai to wahan Zoom karo
      if (selectedBranchId && selectedBranchId !== "ALL") {
        const target = data.find((b) => b.id === selectedBranchId);
        if (target) {
          map.flyTo([target.lat, target.lng], 13, { duration: 1.5 });
          return;
        }
      }

      // Case 2: Agar City select hui hai (Data filter hua hai), to pehli branch par focus karo
      // Ya phir Center nikaal lo (Simple approach: First branch location)
      const firstBranch = data[0];
      const zoomLevel = data.length === 1 ? 13 : 10; // Agar 1 branch hai to zoom in, zyada hain to zoom out

      map.flyTo([firstBranch.lat, firstBranch.lng], zoomLevel, {
        duration: 1.5,
      });
    } else {
      // Default Pakistan View
      map.flyTo([30.3753, 69.3451], 5, { duration: 1.5 });
    }
  }, [data, selectedBranchId, map]);

  return null;
}

interface BranchMapProps {
  data: any[];
  selectedBranchId: string;
  onSelectBranch: (id: string) => void;
}

export default function BranchMap({
  data,
  selectedBranchId,
  onSelectBranch,
}: BranchMapProps) {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative z-0">
      <MapContainer
        center={[30.3753, 69.3451]}
        zoom={5}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", background: "#e5e7eb" }}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

        {/* Controller jo Map ko hilaye ga */}
        <MapController data={data} selectedBranchId={selectedBranchId} />

        {data?.map((branch: any, idx: number) => (
          <Marker
            key={idx}
            position={[branch.lat, branch.lng]}
            icon={createCustomIcon(
              branch.revenue,
              branch.id === selectedBranchId
            )}
            eventHandlers={{
              click: () => onSelectBranch(branch.id),
            }}
          >
            <Popup className="custom-popup">
              <div className="p-1 min-w-[150px]">
                <h3 className="font-bold text-sm text-slate-800">
                  {branch.name}
                </h3>
                <p className="text-xs text-slate-500 mb-2">{branch.location}</p>
                <div className="flex justify-between items-center border-t border-slate-100 pt-2 mt-1">
                  <span className="text-xs font-semibold text-slate-600">
                    Revenue:
                  </span>
                  <span className="text-sm font-bold text-[#0078D4]">
                    ${branch.revenue.toLocaleString()}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
