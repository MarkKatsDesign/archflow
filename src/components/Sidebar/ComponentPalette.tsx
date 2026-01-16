import { useState, useRef, useEffect } from "react";
import { Search, Sparkles, Ban, Layers, LayoutGrid, List } from "lucide-react";
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
type ViewMode = "list" | "compact";

const VIEW_MODE_KEY = "archflow_sidebar_view_mode";

interface ServiceItemProps {
  service: Service;
  viewMode: ViewMode;
}

function ServiceItem({ service, viewMode }: ServiceItemProps) {
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

  // Compact view - smaller cards in a grid
  if (viewMode === "compact") {
    return (
      <div
        draggable={!isDisabled}
        onDragStart={(e) => onDragStart(e, service)}
        className={`p-2 rounded-lg border transition-all card-hover ${
          isDisabled
            ? "bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 opacity-50 cursor-not-allowed"
            : isRecommended
            ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 hover:border-green-400 cursor-move"
            : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 cursor-move"
        }`}
        style={{
          borderLeftWidth: "3px",
          borderLeftColor: isDisabled ? "#9ca3af" : service.color,
        }}
        title={compatibility.reason || `${service.name} - ${service.provider}`}
      >
        <div className="flex items-center gap-1.5">
          <span
            className={`text-xs font-medium truncate ${
              isDisabled ? "text-gray-500 dark:text-gray-400" : "text-gray-800 dark:text-gray-200"
            }`}
          >
            {service.shortName}
          </span>
          {isRecommended && (
            <Sparkles className="w-3 h-3 text-green-600 dark:text-green-400 shrink-0" />
          )}
          {isDisabled && <Ban className="w-3 h-3 text-red-500 shrink-0" />}
        </div>
      </div>
    );
  }

  // List view - original full cards
  return (
    <div
      draggable={!isDisabled}
      onDragStart={(e) => onDragStart(e, service)}
      className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all relative card-hover ${
        isDisabled
          ? "bg-gray-100 dark:bg-slate-800 border-gray-300 dark:border-slate-600 opacity-50 cursor-not-allowed"
          : isRecommended
          ? "bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700 hover:border-green-500 cursor-move"
          : "bg-white dark:bg-slate-800 hover:border-gray-400 dark:hover:border-slate-500 cursor-move"
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
              isDisabled ? "text-gray-500 dark:text-gray-400" : "text-gray-800 dark:text-gray-200"
            }`}
          >
            {service.shortName}
          </div>
          {isRecommended && (
            <Sparkles className="w-3 h-3 text-green-600 dark:text-green-400 shrink-0" />
          )}
          {isDisabled && <Ban className="w-3 h-3 text-red-500 shrink-0" />}
        </div>
        <div
          className={`text-xs mt-0.5 ${
            isDisabled ? "text-gray-400" : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {service.provider}
        </div>
        {compatibility.reason && (isRecommended || isDisabled) && (
          <div
            className={`text-xs mt-1 ${
              isRecommended ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
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
      className="flex items-start gap-3 p-3 rounded-lg border-2 bg-white dark:bg-slate-800 cursor-move transition-all card-hover"
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
        <div className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">
          {zone.shortName}
        </div>
        <div className="text-xs mt-0.5 text-gray-500 dark:text-gray-400">{zone.provider}</div>
        <div className="text-xs mt-1 text-gray-400 dark:text-gray-500 line-clamp-2">
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
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(VIEW_MODE_KEY);
    return (saved as ViewMode) || "list";
  });
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [showScrollFade, setShowScrollFade] = useState(false);

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  // Check if category pills need scroll fade
  useEffect(() => {
    const checkScroll = () => {
      if (categoryScrollRef.current) {
        const { scrollWidth, clientWidth } = categoryScrollRef.current;
        setShowScrollFade(scrollWidth > clientWidth);
      }
    };
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

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
    <div className="w-80 bg-gray-50 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col h-full transition-colors">
      {/* Header section */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        {/* Title and view toggle */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Components</h2>
          {!isInfrastructureSelected && (
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === "list"
                    ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("compact")}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === "compact"
                    ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
                title="Compact view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Search input */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 dark:bg-slate-800 dark:text-gray-200 dark:placeholder-gray-500 transition-all"
          />
        </div>

        {/* Category pills - horizontal scroll */}
        <div
          ref={categoryScrollRef}
          className={`flex gap-1.5 overflow-x-auto scrollable-horizontal pb-1 ${
            showScrollFade ? "scroll-fade-horizontal" : ""
          }`}
        >
          <button
            onClick={() => setSelectedCategory("All")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              selectedCategory === "All"
                ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm"
                : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
            }`}
          >
            All
          </button>
          {/* Infrastructure category - special styling */}
          <button
            onClick={() => setSelectedCategory("Infrastructure")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap inline-flex items-center gap-1 ${
              selectedCategory === "Infrastructure"
                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm"
                : "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60"
            }`}
          >
            <Layers className="w-3 h-3" />
            Infra
          </button>
          {serviceCategories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                selectedCategory === category
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Service/Zone list */}
      <div className="flex-1 overflow-y-auto p-3 scrollable-panel">
        {isInfrastructureSelected ? (
          // Show boundary zones
          <>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2 px-1">
              <Layers className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <span>Network boundaries for organizing your architecture</span>
            </div>
            <div className="space-y-2">
              {filteredZones.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 text-sm mt-8">
                  No zones found
                </div>
              ) : (
                filteredZones.map((zone) => (
                  <ZoneItem key={zone.id} zone={zone} />
                ))
              )}
            </div>
          </>
        ) : // Show services
        filteredServices.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm mt-8">
            No services found
          </div>
        ) : viewMode === "compact" ? (
          // Compact grid view
          <div className="grid grid-cols-2 gap-2">
            {filteredServices.map((service) => (
              <ServiceItem
                key={service.id}
                service={service}
                viewMode={viewMode}
              />
            ))}
          </div>
        ) : (
          // List view
          <div className="space-y-2">
            {filteredServices.map((service) => (
              <ServiceItem
                key={service.id}
                service={service}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {isInfrastructureSelected
            ? "Drag zones to create network boundaries"
            : "Drag components onto the canvas"}
        </div>
      </div>
    </div>
  );
}
