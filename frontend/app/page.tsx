'use client';

import { useEffect, useState } from 'react';
import { batchesApi } from '@/lib/api';
import type { LabelBatch } from '@/lib/types';
import BatchList from '@/components/BatchList';
import FilterBar from '@/components/FilterBar';

export default function HomePage() {
  const [batches, setBatches] = useState<LabelBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    shipping_service: '',
    status: 'all' as 'unprinted' | 'unconfirmed' | 'all',
  });

  useEffect(() => {
    loadBatches();
  }, [filters]);

  const loadBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await batchesApi.list(filters);
      setBatches(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Label Batches</h2>
        <button
          onClick={loadBatches}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          Refresh
        </button>
      </div>

      <FilterBar filters={filters} onFilterChange={setFilters} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <BatchList batches={batches} onUpdate={loadBatches} />
      )}
    </div>
  );
}
