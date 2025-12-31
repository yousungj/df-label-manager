interface StatusBadgeProps {
  label: string;
  status: 'completed' | 'pending' | 'urgent';
}

export default function StatusBadge({ label, status }: StatusBadgeProps) {
  const styles = {
    completed: 'bg-green-100 text-green-800 border-green-200',
    pending: 'bg-gray-100 text-gray-600 border-gray-200',
    urgent: 'bg-red-100 text-red-800 border-red-200',
  };

  const icons = {
    completed: '✓',
    pending: '○',
    urgent: '!',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      <span>{icons[status]}</span>
      {label}
    </span>
  );
}
