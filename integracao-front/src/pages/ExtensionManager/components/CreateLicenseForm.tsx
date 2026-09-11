import { useState } from 'react';
import { Plus } from 'lucide-react';

import ConfirmDialog from '../../../components/ConfirmDialog';
import {
  createLicense,
  type ConfigData,
  type InstanceData,
} from '../../../services/extension.service';
import { SearchableSelect } from './CustomSelects';
import { ExtensionFormCard } from './ExtensionFormCard';
import { useConfirmableSubmit } from './useConfirmableSubmit';

interface CreateLicenseFormProps {
  instancesList: InstanceData[];
  configsList: ConfigData[];
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export function CreateLicenseForm({
  instancesList,
  configsList,
  onSuccess,
  onError,
}: CreateLicenseFormProps) {
  const [formData, setFormData] = useState({ instance_url: '', config_id: '' });

  const canSubmit = Boolean(formData.instance_url && formData.config_id);
  const { confirm, close, isOpen, loading, open } = useConfirmableSubmit({
    onSubmit: async () => {
      await createLicense(formData.instance_url, Number(formData.config_id));
      setFormData({ instance_url: '', config_id: '' });
      onSuccess();
    },
    onError,
    fallbackMessage: 'Erro ao criar licenca.',
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

  const configOptions = configsList.map((conf) => ({
    value: conf.id,
    label: `${conf.id} - ${conf.config_name}`,
    subLabel: conf.instancias?.client_name || 'Sem Instancia',
  }));

  const selectedInstanceName =
    instancesList.find((item) => item.instance_url === formData.instance_url)
      ?.client_name || 'Desconhecido';
  const selectedConfigName =
    configsList.find((item) => item.id === Number(formData.config_id))
      ?.config_name || 'Desconhecida';

  return (
    <ExtensionFormCard
      icon={Plus}
      title="Gerar Licenca"
      onSubmit={handleSubmit}
      onTriggerSubmit={() => {
        if (canSubmit) {
          open();
        }
      }}
      submitLabel="Gerar Chave de Licenca"
      submitTone="green"
      footer={
        isOpen ? (
          <ConfirmDialog
            loading={loading}
            description={
              <p>
                Gerar nova licenca para o cliente <strong>{selectedInstanceName}</strong>{' '}
                usando a configuracao <strong>{selectedConfigName}</strong>?
              </p>
            }
            confirmText="Gerar Licenca"
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
          Selecione a Instancia
        </label>
        <SearchableSelect
          options={instanceOptions}
          value={formData.instance_url}
          onChange={(value) =>
            setFormData({ ...formData, instance_url: String(value) })
          }
          placeholder="Buscar instancia..."
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Selecione a Configuracao
        </label>
        <SearchableSelect
          options={configOptions}
          value={Number(formData.config_id)}
          onChange={(value) =>
            setFormData({ ...formData, config_id: String(value) })
          }
          placeholder="Buscar configuracao por ID ou Nome..."
        />
        <p className="mt-1 text-xs text-gray-400">
          Exibe: ID - Nome Config | Cliente vinculado
        </p>
      </div>
    </ExtensionFormCard>
  );
}
