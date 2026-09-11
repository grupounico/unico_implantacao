import { useState } from 'react';
import { Settings } from 'lucide-react';

import ConfirmDialog from '../../../components/ConfirmDialog';
import { createConfig, type InstanceData } from '../../../services/extension.service';
import { CreatableSelect, SearchableSelect } from './CustomSelects';
import { ExtensionFormCard } from './ExtensionFormCard';
import { useConfirmableSubmit } from './useConfirmableSubmit';

interface CreateConfigFormProps {
  instancesList: InstanceData[];
  databaseOptions: string[];
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export function CreateConfigForm({
  instancesList,
  databaseOptions,
  onSuccess,
  onError,
}: CreateConfigFormProps) {
  const [formData, setFormData] = useState({
    config_name: '',
    instance_url: '',
    dbName: '',
  });

  const canSubmit = Boolean(
    formData.config_name &&
      formData.instance_url &&
      formData.dbName,
  );
  const { confirm, close, isOpen, loading, open } = useConfirmableSubmit({
    onSubmit: async () => {
      await createConfig(
        formData.config_name,
        formData.instance_url,
        formData.dbName,
      );
      setFormData({
        config_name: '',
        instance_url: '',
        dbName: '',
      });
      onSuccess();
    },
    onError,
    fallbackMessage: 'Erro ao criar configuracao.',
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (canSubmit) {
      open();
    }
  };

  const instanceOptions = instancesList.map((inst) => ({
    value: inst.instance_url,
    label: inst.client_name,
    subLabel: inst.instance_url,
  }));

  const selectedInstanceName =
    instancesList.find((item) => item.instance_url === formData.instance_url)
      ?.client_name || formData.instance_url;

  return (
    <ExtensionFormCard
      icon={Settings}
      title="Criar Configuracao"
      onSubmit={handleSubmit}
      onTriggerSubmit={() => {
        if (canSubmit) {
          open();
        }
      }}
      submitLabel="Salvar Configuracao"
      footer={
        isOpen ? (
          <ConfirmDialog
            loading={loading}
            description={
              <p>
                Deseja salvar a configuracao <strong>{formData.config_name}</strong> para o
                cliente <strong>{selectedInstanceName}</strong> no banco{' '}
                <strong>{formData.dbName}</strong>?
              </p>
            }
            confirmText="Salvar"
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
          Nome da Configuracao
        </label>
        <input
          type="text"
          required
          placeholder="Ex: Config Padrao V1"
          className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-violet-500"
          value={formData.config_name}
          onChange={(event) =>
            setFormData({ ...formData, config_name: event.target.value })
          }
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Vincular Instancia
        </label>
        <SearchableSelect
          options={instanceOptions}
          value={formData.instance_url}
          onChange={(value) =>
            setFormData({ ...formData, instance_url: String(value) })
          }
          placeholder="Pesquise e selecione a instancia..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nome do Banco
          </label>
          <CreatableSelect
            options={databaseOptions}
            value={formData.dbName}
            onChange={(value) => setFormData({ ...formData, dbName: value })}
            placeholder="Selecione ou digite..."
          />
        </div>
      </div>
    </ExtensionFormCard>
  );
}
