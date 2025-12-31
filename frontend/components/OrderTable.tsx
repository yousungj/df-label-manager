'use client';

import { useState } from 'react';
import type { DFOrder } from '@/lib/types';
import { ordersApi } from '@/lib/api';
import StatusBadge from './StatusBadge';

interface OrderTableProps {
  orders: DFOrder[];
  onUpdate: () => void;
}

export default function OrderTable({ orders, onUpdate }: OrderTableProps) {
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrders(new Set(orders.map((o) => o.order_id)));
    } else {
      setSelectedOrders(new Set());
    }
  };

  const handleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleBulkShipConfirm = async () => {
    if (selectedOrders.size === 0) return;
    if (!confirm(`Ship confirm ${selectedOrders.size} orders?`)) return;

    try {
      await ordersApi.bulkShipConfirm({
        order_ids: Array.from(selectedOrders),
      });
      setSelectedOrders(new Set());
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to confirm shipments');
    }
  };

  const handleShipConfirm = async (orderId: string) => {
    try {
      await ordersApi.shipConfirm(orderId);
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to confirm shipment');
    }
  };

  const handleUpdatePriority = async (orderId: string, priority: 'normal' | 'high' | 'urgent') => {
    try {
      await ordersApi.updatePriority(orderId, { priority });
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update priority');
    }
  };

  const handleUpdateTracking = async (orderId: string) => {
    const tracking = prompt('Enter tracking number:');
    if (!tracking) return;

    try {
      await ordersApi.updateTracking(orderId, { tracking_number: tracking });
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update tracking');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 font-bold';
      case 'high':
        return 'text-orange-600 font-semibold';
      default:
        return 'text-gray-600';
    }
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        No orders in this batch
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Orders ({orders.length})
          </h3>
          {selectedOrders.size > 0 && (
            <button
              onClick={handleBulkShipConfirm}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Ship Confirm Selected ({selectedOrders.size})
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedOrders.size === orders.length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PO Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tracking
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.order_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedOrders.has(order.order_id)}
                    onChange={() => handleSelectOrder(order.order_id)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order.order_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {order.purchase_order_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={order.print_priority}
                    onChange={(e) =>
                      handleUpdatePriority(
                        order.order_id,
                        e.target.value as 'normal' | 'high' | 'urgent'
                      )
                    }
                    className={`text-sm border-0 bg-transparent focus:ring-0 ${getPriorityColor(
                      order.print_priority
                    )}`}
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {order.ship_confirmed_at ? (
                    <StatusBadge label="Confirmed" status="completed" />
                  ) : (
                    <StatusBadge label="Pending" status="pending" />
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {order.tracking_number || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    {!order.ship_confirmed_at && (
                      <button
                        onClick={() => handleShipConfirm(order.order_id)}
                        className="text-primary-600 hover:text-primary-800 font-medium"
                      >
                        Confirm
                      </button>
                    )}
                    <button
                      onClick={() => handleUpdateTracking(order.order_id)}
                      className="text-gray-600 hover:text-gray-800 font-medium"
                    >
                      Tracking
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
