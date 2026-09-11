import type { ReactNode } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  title?: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  tone?: 'primary' | 'dark' | 'danger';
  onClose: () => void;
  onConfirm: () => void;
}

const toneClasses = {
  primary: 'bg-violet-600 hover:bg-violet-700',
  dark: 'bg-slate-900 hover:bg-slate-800',
  danger: 'bg-red-600 hover:bg-red-700',
};

export default function ConfirmDialog({
  title = 'Confirmar acao',
  description = 'Essa acao nao podera ser desfeita. Deseja continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  loading = false,
  tone = 'primary',
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 text-center shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <h2 className="mb-2 text-lg font-bold text-slate-900">{title}</h2>
        <div className="mb-6 text-sm text-slate-600">{description}</div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex flex-1 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${toneClasses[tone]}`}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
