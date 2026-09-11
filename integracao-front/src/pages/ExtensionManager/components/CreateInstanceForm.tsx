import { useState } from 'react';
import { Server } from 'lucide-react';

import ConfirmDialog from '../../../components/ConfirmDialog';
import { createInstance } from '../../../services/extension.service';
import { ExtensionFormCard } from './ExtensionFormCard';
import { useConfirmableSubmit } from './useConfirmableSubmit';

interface CreateInstanceFormProps {
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export function CreateInstanceForm({
  onSuccess,
  onError,
}: CreateInstanceFormProps) {
  const [formData, setFormData] = useState({
    client_name: '',
    instanceUrl: '',
  });

  const canSubmit = Boolean(formData.client_name && formData.instanceUrl);
  const { confirm, close, isOpen, loading, open } = useConfirmableSubmit({
    onSubmit: async () => {
      await createInstance(formData.client_name, formData.instanceUrl);
      setFormData({ client_name: '', instanceUrl: '' });
      onSuccess();
    },
    onError,
    fallbackMessage: 'Erro ao criar cliente.',
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (canSubmit) {
      open();
    }
  };

  return (
    <ExtensionFormCard
      icon={Server}
      title="Criar Cliente"
      onSubmit={handleSubmit}
      onTriggerSubmit={() => {
        if (canSubmit) {
          open();
        }
      }}
      submitLabel="Criar"
      footer={
        isOpen ? (
          <ConfirmDialog
            loading={loading}
            description={
              <p className="line-clamp-3">
                Tem certeza que deseja criar o cliente <b>{formData.client_name}</b> da
                instancia <b className="line-clamp-3">{formData.instanceUrl}</b>?
              </p>
            }
            confirmText="Criar"
            onClose={close}
            onConfirm={() => {
              void confirm();
            }}
          />
        ) : null
      }
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Nome do Cliente
        </label>
        <input
          type="text"
          required
          placeholder="Ex: Farmacia Central"
          className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-violet-500"
          value={formData.client_name}
          onChange={(event) =>
            setFormData({ ...formData, client_name: event.target.value })
          }
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          URL da Instancia
        </label>
        <input
          type="text"
          required
          placeholder="https://instancia.z-api.io/..."
          className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-violet-500"
          value={formData.instanceUrl}
          onChange={(event) =>
            setFormData({ ...formData, instanceUrl: event.target.value })
          }
        />
      </div>
    </ExtensionFormCard>
  );
}
