import { useState } from "react";
import { Search, Sparkles, Ban, Layers } from "lucide-react";
import { services } from "../../data/services";
import { boundaryZones } from "../../data/infrastructure";
import type { Service, Category } from "../../types/service";
import type { BoundaryZone } from "../../types/infrastructure";
import { useCompatibility } from "../../hooks/useCompatibility";

// Categories for services (Infrastructure is separate)
const serviceCategories: Category[] = [
  "Frontend",
  "Backend",
  "Database",
  "Cache",
  "Queue",
  "Storage",
  "CDN",
  "Auth",
  "Search",
  "Monitoring",
  "Networking",
  "DevOps",
  "Integrations",
];

type CategoryFilter = Category | "All" | "Infrastructure";

interface ServiceItemProps {
  service: Service;
}

function ServiceItem({ service }: ServiceItemProps) {
  const { checkCompatibility } = useCompatibility();
  const compatibility = checkCompatibility(service);

  const onDragStart = (event: React.DragEvent, service: Service) => {
    // Prevent dragging if incompatible
    if (compatibility.isIncompatible) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify(service)
    );
    event.dataTransfer.effectAllowed = "move";
  };

  const isDisabled = compatibility.isIncompatible;
  const isRecommended = compatibility.isRecommended;

  return (
    <div
      draggable={!isDisabled}
      onDragStart={(e) => onDragStart(e, service)}
      className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all relative ${
        isDisabled
          ? "bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed"
          : isRecommended
          ? "bg-green-50 border-green-300 hover:border-green-500 cursor-move hover:shadow-md"
          : "bg-white hover:border-gray-400 cursor-move hover:shadow-md"
      }`}
      style={{
        borderColor: isDisabled
          ? undefined
          : isRecommended
          ? undefined
          : service.color,
      }}
      title={compatibility.reason}
    >
      <div
        className="w-3 h-3 rounded-full mt-0.5 shrink-0"
        style={{ backgroundColor: isDisabled ? "#9ca3af" : service.color }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <div
            className={`font-medium text-sm truncate ${
              isDisabled ? "text-gray-500" : "text-gray-800"
            }`}
          >
            {service.shortName}
          </div>
          {isRecommended && (
            <Sparkles className="w-3 h-3 text-green-600 shrink-0" />
          )}
          {isDisabled && <Ban className="w-3 h-3 text-red-500 shrink-0" />}
        </div>
        <div
          className={`text-xs mt-0.5 ${
            isDisabled ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {service.provider}
        </div>
        {compatibility.reason && (isRecommended || isDisabled) && (
          <div
            className={`text-xs mt-1 ${
              isRecommended ? "text-green-600" : "text-red-600"
            }`}
          >
            {compatibility.reason}
          </div>
        )}
      </div>
    </div>
  );
}

interface ZoneItemProps {
  zone: BoundaryZone;
}

function ZoneItem({ zone }: ZoneItemProps) {
  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData(
      "application/reactflow-zone",
      JSON.stringify(zone)
    );
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex items-start gap-3 p-3 rounded-lg border-2 bg-white hover:shadow-md cursor-move transition-all"
      style={{
        borderColor: zone.color,
        borderStyle: zone.borderStyle,
      }}
    >
      <div
        className="w-4 h-4 rounded mt-0.5 shrink-0"
        style={{
          backgroundColor: zone.backgroundColor,
          border: `2px ${zone.borderStyle} ${zone.color}`,
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-gray-800 truncate">
          {zone.shortName}
        </div>
        <div className="text-xs mt-0.5 text-gray-500">{zone.provider}</div>
        <div className="text-xs mt-1 text-gray-400 line-clamp-2">
          {zone.description}
        </div>
      </div>
    </div>
  );
}

export default function ComponentPalette() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>("All");

  // Filter services based on search and category
  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.provider.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      (selectedCategory !== "Infrastructure" &&
        service.category === selectedCategory);

    return matchesSearch && matchesCategory;
  });

  // Filter zones based on search
  const filteredZones = boundaryZones.filter((zone) => {
    return (
      zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zone.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zone.provider.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const isInfrastructureSelected = selectedCategory === "Infrastructure";

  return (
    <div className="w-80 bg-gray-100 border-r border-gray-300 flex flex-col h-full">
      <div className="p-4 border-b border-gray-300 bg-white">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Components</h2>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === "All"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            All
          </button>
          {/* Infrastructure category - special styling */}
          <button
            onClick={() => setSelectedCategory("Infrastructure")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1 ${
              selectedCategory === "Infrastructure"
                ? "bg-indigo-500 text-white"
                : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
            }`}
          >
            <Layers className="w-3 h-3" />
            Infrastructure
          </button>
          {serviceCategories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === category
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollable-panel">
        {isInfrastructureSelected ? (
          // Show boundary zones
          <>
            <div className="text-xs text-gray-600 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>
                Network boundaries for organizing your architecture
              </span>
            </div>
            {filteredZones.length === 0 ? (
              <div className="text-center text-gray-500 text-sm mt-8">
                No zones found
              </div>
            ) : (
              filteredZones.map((zone) => (
                <ZoneItem key={zone.id} zone={zone} />
              ))
            )}
          </>
        ) : // Show services
        filteredServices.length === 0 ? (
          <div className="text-center text-gray-500 text-sm mt-8">
            No services found
          </div>
        ) : (
          filteredServices.map((service) => (
            <ServiceItem key={service.id} service={service} />
          ))
        )}
      </div>

      <div className="p-4 border-t border-gray-300 bg-white">
        <div className="text-xs text-gray-600 text-center">
          {isInfrastructureSelected
            ? "Drag zones to create network boundaries"
            : "Drag components onto the canvas"}
        </div>
      </div>
    </div>
  );
}
