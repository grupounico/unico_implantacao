import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Minimize2,
  X,
} from 'lucide-react';
import { useGeneration } from '../context/GenerationContext';

export function GlobalStatusPopup() {
  const {
    status,
    feedback,
    isMinimized,
    closePopup,
    toggleMinimize,
    operation,
  } = useGeneration();

  const operationLabel =
    operation === 'trierExtension'
      ? 'Extensao Trier'
      : operation === 'inovaFarmaExtension'
        ? 'Extensao Inova Farma'
        : 'Executavel Alpha 7';

  if (status === 'idle') return null;

  return (
    <div
      className={`
        fixed bottom-6 right-6 z-[9999] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all duration-300 ease-in-out
        ${isMinimized ? 'h-16 w-16 cursor-pointer rounded-full hover:scale-105' : 'w-96'}
      `}
      onClick={isMinimized ? toggleMinimize : undefined}
    >
      <div
        className={`flex items-center justify-between p-4 ${
          isMinimized ? 'h-full justify-center p-0' : 'border-b border-gray-100 bg-gray-50'
        }`}
      >
        {isMinimized ? (
          <div className="relative flex h-full w-full items-center justify-center">
            {status === 'generating' && (
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-6 w-6 text-green-600" />
            )}
            {status === 'error' && (
              <AlertCircle className="h-6 w-6 text-red-600" />
            )}
          </div>
        ) : (
          <>
            <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-700">
              {status === 'generating'
                ? `Gerando ${operationLabel}`
                : status === 'success'
                  ? 'Concluido'
                  : 'Erro'}
            </h4>
            <div className="flex items-center gap-1">
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  toggleMinimize();
                }}
                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-200"
              >
                <Minimize2 className="h-4 w-4" />
              </button>

              {(status === 'success' || status === 'error') && (
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    closePopup();
                  }}
                  className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-100 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {!isMinimized && (
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="mt-1 shrink-0">
              {status === 'generating' && (
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              )}
              {status === 'success' && (
                <CheckCircle className="h-8 w-8 text-green-500" />
              )}
              {status === 'error' && (
                <AlertCircle className="h-8 w-8 text-red-500" />
              )}
            </div>

            <div className="flex-1">
              <p className="mb-1 font-medium text-gray-900">
                {status === 'generating'
                  ? `${operationLabel} em andamento`
                  : status === 'success'
                    ? 'Sucesso!'
                    : 'Falha'}
              </p>
              <p className="break-words text-sm leading-snug text-gray-500">
                {feedback}
              </p>
            </div>
          </div>

          {status === 'generating' && (
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-2/3 animate-[shimmer_1.5s_infinite] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)] bg-blue-500"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
