interface FilterBarProps {
  filters: {
    shipping_service: string;
    status: 'unprinted' | 'unconfirmed' | 'all';
  };
  onFilterChange: (filters: any) => void;
}

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const shippingServices = ['All', 'UPS', 'FedEx', 'USPS'];
  const statuses = [
    { value: 'all', label: 'All' },
    { value: 'unprinted', label: 'Unprinted' },
    { value: 'unconfirmed', label: 'Unconfirmed' },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Shipping Service
          </label>
          <select
            value={filters.shipping_service}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                shipping_service: e.target.value === 'All' ? '' : e.target.value,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {shippingServices.map((service) => (
              <option key={service} value={service === 'All' ? '' : service}>
                {service}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                status: e.target.value as 'unprinted' | 'unconfirmed' | 'all',
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
