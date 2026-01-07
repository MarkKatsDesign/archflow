import { useState } from 'react';
import { Search } from 'lucide-react';
import { services } from '../../data/services';
import type { Service, Category } from '../../types/service';

const categories: Category[] = [
  'Frontend',
  'Backend',
  'Database',
  'Cache',
  'Queue',
  'Storage',
  'CDN',
  'Auth',
  'Analytics',
  'Search',
  'Monitoring',
];

interface ServiceItemProps {
  service: Service;
}

function ServiceItem({ service }: ServiceItemProps) {
  const onDragStart = (event: React.DragEvent, service: Service) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(service));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, service)}
      className="flex items-start gap-3 p-3 bg-white rounded-lg border-2 hover:border-gray-400 cursor-move transition-all hover:shadow-md"
      style={{ borderColor: service.color }}
    >
      <div
        className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0"
        style={{ backgroundColor: service.color }}
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-gray-800 truncate">
          {service.shortName}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {service.provider}
        </div>
      </div>
    </div>
  );
}

export default function ComponentPalette() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.provider.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' || service.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

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
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === 'All'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredServices.length === 0 ? (
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
          Drag components onto the canvas
        </div>
      </div>
    </div>
  );
}
