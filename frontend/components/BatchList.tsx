import type { LabelBatch } from '@/lib/types';
import BatchCard from './BatchCard';

interface BatchListProps {
  batches: LabelBatch[];
  onUpdate: () => void;
}

export default function BatchList({ batches, onUpdate }: BatchListProps) {
  if (batches.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No batches found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {batches.map((batch) => (
        <BatchCard key={batch.batch_id} batch={batch} onUpdate={onUpdate} />
      ))}
    </div>
  );
}
