'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { batchesApi, ordersApi } from '@/lib/api';
import type { LabelBatch, DFOrder } from '@/lib/types';
import OrderTable from '@/components/OrderTable';
import StatusBadge from '@/components/StatusBadge';

export default function BatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.id as string;

  const [batch, setBatch] = useState<LabelBatch | null>(null);
  const [orders, setOrders] = useState<DFOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (batchId) {
      loadBatchAndOrders();
    }
  }, [batchId]);

  const loadBatchAndOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const [batchResponse, ordersResponse] = await Promise.all([
        batchesApi.get(batchId),
        ordersApi.listByBatch(batchId),
      ]);
      setBatch(batchResponse.data);
      setOrders(ordersResponse.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load batch details');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPrinted = async () => {
    if (!batch) return;
    try {
      await batchesApi.markPrinted(batchId);
      await loadBatchAndOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to mark as printed');
    }
  };

  const handleShipConfirmAll = async () => {
    if (!batch) return;
    if (!confirm('Ship confirm all orders in this batch?')) return;
    try {
      await batchesApi.shipConfirmAll(batchId);
      await loadBatchAndOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to confirm shipments');
    }
  };

  const handleViewPdf = async () => {
    if (!batch) return;
    try {
      const response = await batchesApi.getPdfUrl(batchId);
      window.open(response.data.url, '_blank');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to get PDF URL');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error || 'Batch not found'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push('/')}
        className="text-primary-600 hover:text-primary-800 flex items-center"
      >
        ← Back to Batches
      </button>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {batch.batch_file_name}
            </h2>
            <div className="space-y-1 text-sm text-gray-600">
              <p>Batch ID: {batch.batch_id}</p>
              <p>Shipping Service: <span className="font-semibold">{batch.shipping_service}</span></p>
              <p>Total Orders: {batch.total_orders}</p>
              <p>Downloaded: {new Date(batch.downloaded_at).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <StatusBadge
              label="Printed"
              status={batch.batch_printed_at ? 'completed' : 'pending'}
            />
            <StatusBadge
              label="Confirmed"
              status={batch.batch_confirmed_at ? 'completed' : 'pending'}
            />
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={handleViewPdf}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            View PDF
          </button>
          {!batch.batch_printed_at && (
            <button
              onClick={handleMarkPrinted}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Mark Printed
            </button>
          )}
          {!batch.batch_confirmed_at && (
            <button
              onClick={handleShipConfirmAll}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Ship Confirm All
            </button>
          )}
        </div>
      </div>

      <OrderTable orders={orders} batchId={batchId} onUpdate={loadBatchAndOrders} />
    </div>
  );
}
