'use client';

import { useRouter } from 'next/navigation';
import type { LabelBatch } from '@/lib/types';
import StatusBadge from './StatusBadge';
import PriorityFlag from './PriorityFlag';
import { batchesApi } from '@/lib/api';

interface BatchCardProps {
  batch: LabelBatch;
  onUpdate: () => void;
}

export default function BatchCard({ batch, onUpdate }: BatchCardProps) {
  const router = useRouter();

  const handleViewPdf = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await batchesApi.getPdfUrl(batch.batch_id);
      window.open(response.data.url, '_blank');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to get PDF URL');
    }
  };

  const handleMarkPrinted = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await batchesApi.markPrinted(batch.batch_id);
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to mark as printed');
    }
  };

  const handleShipConfirmAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Ship confirm all orders in this batch?')) return;
    try {
      await batchesApi.shipConfirmAll(batch.batch_id);
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to confirm shipments');
    }
  };

  const getShippingServiceIcon = (service: string) => {
    const icons: { [key: string]: string } = {
      UPS: '📦',
      FedEx: '✈️',
      USPS: '📮',
    };
    return icons[service] || '🚚';
  };

  return (
    <div
      onClick={() => router.push(`/batches/${batch.batch_id}`)}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 p-6"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getShippingServiceIcon(batch.shipping_service)}</span>
          <span className="font-semibold text-gray-900">{batch.shipping_service}</span>
        </div>
        <PriorityFlag hasUrgent={false} />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
        {batch.batch_file_name}
      </h3>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <p>Orders: <span className="font-semibold">{batch.total_orders}</span></p>
        <p>Downloaded: {new Date(batch.downloaded_at).toLocaleDateString()}</p>
      </div>

      <div className="flex gap-2 mb-4">
        <StatusBadge
          label="Printed"
          status={batch.batch_printed_at ? 'completed' : 'pending'}
        />
        <StatusBadge
          label="Confirmed"
          status={batch.batch_confirmed_at ? 'completed' : 'pending'}
        />
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={handleViewPdf}
          className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
        >
          View PDF
        </button>
        {!batch.batch_printed_at && (
          <button
            onClick={handleMarkPrinted}
            className="w-full px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm font-medium"
          >
            Mark Printed
          </button>
        )}
        {!batch.batch_confirmed_at && (
          <button
            onClick={handleShipConfirmAll}
            className="w-full px-3 py-2 bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 text-sm font-medium"
          >
            Ship Confirm All
          </button>
        )}
      </div>
    </div>
  );
}
