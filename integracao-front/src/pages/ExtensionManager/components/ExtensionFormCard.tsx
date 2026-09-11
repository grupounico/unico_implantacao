import type { FormEventHandler, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface ExtensionFormCardProps {
  icon: LucideIcon;
  title: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onTriggerSubmit: () => void;
  submitLabel: string;
  submitTone?: 'violet' | 'green';
  children: ReactNode;
  footer?: ReactNode;
}

const submitToneClasses = {
  violet: 'bg-violet-600 hover:bg-violet-700',
  green: 'bg-green-600 hover:bg-green-700',
};

export function ExtensionFormCard({
  icon: Icon,
  title,
  onSubmit,
  onTriggerSubmit,
  submitLabel,
  submitTone = 'violet',
  children,
  footer,
}: ExtensionFormCardProps) {
  return (
    <div className="mx-auto max-w-xl animate-in fade-in slide-in-from-bottom-4 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-slate-800">
        <Icon className="h-6 w-6 text-violet-600" /> {title}
      </h2>

      <form className="space-y-4" onSubmit={onSubmit}>
        {children}

        <button
          type="button"
          onClick={onTriggerSubmit}
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold text-white transition-colors ${submitToneClasses[submitTone]}`}
        >
          {submitLabel}
        </button>

        {footer}
      </form>
    </div>
  );
}
