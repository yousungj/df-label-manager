interface PriorityFlagProps {
  hasUrgent: boolean;
}

export default function PriorityFlag({ hasUrgent }: PriorityFlagProps) {
  if (!hasUrgent) return null;

  return (
    <div className="flex items-center gap-1 text-red-600" title="Contains urgent orders">
      <svg
        className="w-5 h-5"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
          clipRule="evenodd"
        />
      </svg>
      <span className="text-xs font-semibold">URGENT</span>
    </div>
  );
}
