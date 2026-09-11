import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function ConfirmModal({
  title,
  description,
  confirmLabel = 'Confirmar',
  confirmingLabel = 'Processando...',
  tone = 'danger',
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  confirmingLabel?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !submitting) {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, submitting]);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm();
    } catch {
      setError('Nao foi possivel concluir a acao. Tente novamente.');
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-[2px]"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-background p-5 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              tone === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-primary/10 text-primary'
            }`}
          >
            <AlertTriangle className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-sm text-foreground/55">{description}</p>
          </div>
        </div>

        {error ? (
          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50/80 px-3 py-2 text-xs font-medium text-rose-800">
            {error}
          </div>
        ) : null}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-foreground/[0.03] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={submitting}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 ${
              tone === 'danger' ? 'bg-rose-600' : 'bg-primary'
            }`}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? confirmingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
