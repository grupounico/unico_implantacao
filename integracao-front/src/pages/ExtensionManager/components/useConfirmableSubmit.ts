import { useState } from 'react';

import { extractErrorMessage } from '../../../utils/error';

interface UseConfirmableSubmitOptions {
  onSubmit: () => Promise<void>;
  onError: (message: string) => void;
  fallbackMessage?: string;
}

export function useConfirmableSubmit({
  onSubmit,
  onError,
  fallbackMessage = 'Nao foi possivel concluir a operacao.',
}: UseConfirmableSubmitOptions) {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const close = () => setIsOpen(false);
  const open = () => setIsOpen(true);

  const confirm = async () => {
    setLoading(true);

    try {
      await onSubmit();
      setIsOpen(false);
    } catch (error) {
      onError(extractErrorMessage(error, fallbackMessage));
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    isOpen,
    open,
    close,
    confirm,
  };
}
