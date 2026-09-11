import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalFrameProps {
  title?: ReactNode;
  children: ReactNode;
  onClose: () => void;
  header?: ReactNode;
  maxWidthClassName?: string;
  overlayClassName?: string;
  panelClassName?: string;
  bodyClassName?: string;
  closeButtonClassName?: string;
}

export function ModalFrame({
  title,
  children,
  onClose,
  header,
  maxWidthClassName = 'max-w-4xl',
  overlayClassName = 'bg-slate-900/60 backdrop-blur-sm',
  panelClassName = 'bg-white',
  bodyClassName = '',
  closeButtonClassName = 'hover:bg-gray-200 text-gray-500',
}: ModalFrameProps) {
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 ${overlayClassName}`}>
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className={`relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${maxWidthClassName} ${panelClassName}`}
        onClick={(event) => event.stopPropagation()}
      >
        {header ?? (
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-6 py-4">
            <h2 className="text-lg font-bold text-slate-800">{title}</h2>
            <button
              onClick={onClose}
              className={`rounded-full p-2 transition-colors ${closeButtonClassName}`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className={bodyClassName}>{children}</div>
      </div>
    </div>
  );
}
