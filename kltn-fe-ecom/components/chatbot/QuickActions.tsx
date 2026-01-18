'use client';

interface QuickAction {
  label: string;
  action: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 py-2">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.action}
          className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors border border-gray-300"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

