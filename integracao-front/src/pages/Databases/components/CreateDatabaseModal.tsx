import { Database, Loader2 } from 'lucide-react';

import { ModalFrame } from '../../../components/ModalFrame';

interface CreateDatabaseModalProps {
  value: string;
  isSubmitting: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export function CreateDatabaseModal({
  value,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
}: CreateDatabaseModalProps) {
  return (
    <ModalFrame
      title={
        <span className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-600" />
          Criar Nova Database
        </span>
      }
      onClose={onClose}
      maxWidthClassName="max-w-md"
      bodyClassName="p-6"
    >
      <form onSubmit={onSubmit}>
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nome do Banco de Dados
          </label>
          <input
            type="text"
            autoFocus
            placeholder="Ex: cliente_loja_01"
            className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={isSubmitting}
          />
          <p className="mt-2 text-xs text-gray-500">
            O nome será higienizado automaticamente (apenas minúsculas, números,
            hífens e underlines).
          </p>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !value.trim()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Banco'
            )}
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}
