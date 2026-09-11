import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';

import ConfirmDialog from '../../components/ConfirmDialog';
import { useRequireAuth } from '../../hooks/useAuthRedirect';
import {
  deleteLicense,
  listConfigs,
  listInstances,
  listLicenses,
  toggleLicense,
  type ConfigData,
  type InstanceData,
  type LicenseData,
  unbindLicense,
} from '../../services/extension.service';
import { getDatabases } from '../../services/database.service';
import { CreateConfigForm } from './components/CreateConfigForm';
import { CreateInstanceForm } from './components/CreateInstanceForm';
import { CreateLicenseForm } from './components/CreateLicenseForm';
import { LicenseList, type LicenseBulkAction } from './components/LicenseList';
import { Toast } from './components/SharedUI';

interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
}

type ExtensionTab =
  | 'licenses'
  | 'new-instance'
  | 'new-config'
  | 'new-license';

export default function ExtensionManager() {
  useRequireAuth();

  const [activeTab, setActiveTab] = useState<ExtensionTab>('licenses');
  const [loading, setLoading] = useState(false);
  const [licenses, setLicenses] = useState<LicenseData[]>([]);
  const [instancesList, setInstancesList] = useState<InstanceData[]>([]);
  const [configsList, setConfigsList] = useState<ConfigData[]>([]);
  const [databaseOptions, setDatabaseOptions] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    if (activeTab === 'licenses') {
      void fetchLicenses();
    }

    if (activeTab === 'new-config' || activeTab === 'new-license') {
      void loadAuxiliaryData();
    }
  }, [activeTab]);

  const fetchLicenses = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const data = await listLicenses();
      setLicenses(data ?? []);
    } catch (error) {
      console.error(error);
      setToastMsg('Erro ao carregar licencas.');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const loadAuxiliaryData = async () => {
    try {
      const [instances, configs] = await Promise.all([listInstances(), listConfigs()]);
      setInstancesList(instances || []);
      setConfigsList(configs || []);

      const dbResponse = await getDatabases(1, 100);

      if (dbResponse?.data) {
        setDatabaseOptions(dbResponse.data.map((db) => db.name));
      }
    } catch (error) {
      console.error('Erro ao carregar listas auxiliares', error);
      setToastMsg('Erro ao carregar listas auxiliares.');
    }
  };

  const openConfirm = (
    title: string,
    message: string,
    onConfirm: () => Promise<void>,
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        await onConfirm();
      },
    });
  };

  const handleToggleLicense = (license: LicenseData) => {
    const clientName =
      license.configs?.instancias?.client_name || 'cliente selecionado';

    openConfirm(
      license.is_active ? 'Desativar licenca?' : 'Ativar licenca?',
      `Isso ${license.is_active ? 'bloqueara' : 'liberara'} o acesso para ${clientName}.`,
      async () => {
        setLoading(true);

        try {
          await toggleLicense(license.license_key, !!license.is_active);
          await fetchLicenses(false);
          setToastMsg('Status da licenca atualizado.');
        } catch (error) {
          console.error(error);
          setToastMsg('Erro ao alterar status da licenca.');
        } finally {
          setLoading(false);
        }
      },
    );
  };

  const handleDeleteLicense = (key: string) => {
    openConfirm('Excluir licenca?', 'Esta acao e irreversivel.', async () => {
      setLoading(true);

      try {
        await deleteLicense(key);
        await fetchLicenses(false);
        setToastMsg('Licenca excluida.');
      } catch (error) {
        console.error(error);
        setToastMsg('Erro ao excluir licenca.');
      } finally {
        setLoading(false);
      }
    });
  };

  const handleUnbindMachine = (license: LicenseData) => {
    openConfirm(
      'Desconectar maquina?',
      `Isso removera o vinculo com a maquina ID: "${license.activated_machine_id}".`,
      async () => {
        setLoading(true);

        try {
          await unbindLicense(license.license_key);
          await fetchLicenses(false);
          setToastMsg('Maquina desconectada da licenca.');
        } catch (error) {
          console.error(error);
          setToastMsg('Erro ao desconectar maquina.');
        } finally {
          setLoading(false);
        }
      },
    );
  };

  const executeBulkAction = async (
    action: LicenseBulkAction,
    targets: LicenseData[],
  ) => {
    let success = 0;
    let failed = 0;

    for (const license of targets) {
      try {
        if (action === 'activate') {
          await toggleLicense(license.license_key, false);
        } else if (action === 'deactivate') {
          await toggleLicense(license.license_key, true);
        } else if (action === 'unbind') {
          await unbindLicense(license.license_key);
        } else {
          await deleteLicense(license.license_key);
        }

        success += 1;
      } catch (error) {
        failed += 1;
        console.error('Falha em lote para licenca:', license.license_key, error);
      }
    }

    await fetchLicenses(false);

    const doneLabel: Record<LicenseBulkAction, string> = {
      activate: 'ativada(s)',
      deactivate: 'desativada(s)',
      unbind: 'desconectada(s)',
      delete: 'excluida(s)',
    };

    if (failed === 0) {
      setToastMsg(`${success} licenca(s) ${doneLabel[action]} com sucesso.`);
      return;
    }

    setToastMsg(`${success} sucesso e ${failed} erro(s) na operacao em lote.`);
  };

  const handleBulkAction = (
    action: LicenseBulkAction,
    targets: LicenseData[],
    scopeLabel: string,
  ) => {
    if (targets.length === 0) {
      setToastMsg('Nenhuma licenca elegivel para esta acao.');
      return;
    }

    const actionVerb: Record<LicenseBulkAction, string> = {
      activate: 'ativar',
      deactivate: 'desativar',
      unbind: 'desconectar',
      delete: 'excluir',
    };

    openConfirm(
      `Confirmar ${actionVerb[action]} em lote?`,
      `Deseja ${actionVerb[action]} ${targets.length} licenca(s) ${scopeLabel}?`,
      async () => {
        setLoading(true);

        try {
          await executeBulkAction(action, targets);
        } finally {
          setLoading(false);
        }
      },
    );
  };

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-slate-50 font-sans text-slate-800">
      <header className="sticky top-0 z-10 flex flex-col justify-between gap-4 border-b border-gray-200 bg-white px-8 py-6 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Shield className="h-7 w-7 text-primary" /> Gestao de Extensoes
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gerencie instancias, configuracoes e licencas.
          </p>
        </div>

        <div className="flex rounded-xl bg-gray-100 p-1">
          {[
            { id: 'licenses', label: 'Licencas' },
            { id: 'new-instance', label: '+ Cliente' },
            { id: 'new-config', label: '+ Config' },
            { id: 'new-license', label: '+ Licenca' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ExtensionTab)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-violet-600 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="custom-scrollbar flex-1 overflow-y-auto p-8">
        {activeTab === 'licenses' ? (
          <LicenseList
            licenses={licenses}
            loading={loading}
            onToggle={handleToggleLicense}
            onDelete={handleDeleteLicense}
            onUnbind={handleUnbindMachine}
            onBulkAction={handleBulkAction}
            onCopy={(text) => {
              void navigator.clipboard.writeText(text);
              setToastMsg('Chave copiada.');
            }}
          />
        ) : null}

        {activeTab === 'new-instance' ? (
          <CreateInstanceForm
            onSuccess={() => {
              setToastMsg('Instancia criada.');
              setActiveTab('new-config');
            }}
            onError={(msg) => setToastMsg(msg)}
          />
        ) : null}

        {activeTab === 'new-config' ? (
          <CreateConfigForm
            instancesList={instancesList}
            databaseOptions={databaseOptions}
            onSuccess={() => {
              setToastMsg('Configuracao criada.');
              setActiveTab('new-license');
            }}
            onError={(msg) => setToastMsg(msg)}
          />
        ) : null}

        {activeTab === 'new-license' ? (
          <CreateLicenseForm
            instancesList={instancesList}
            configsList={configsList}
            onSuccess={() => {
              setToastMsg('Licenca criada.');
              setActiveTab('licenses');
              void fetchLicenses();
            }}
            onError={(msg) => setToastMsg(msg)}
          />
        ) : null}
      </main>

      {toastMsg ? <Toast message={toastMsg} onClose={() => setToastMsg(null)} /> : null}

      {confirmModal.isOpen ? (
        <ConfirmDialog
          title={confirmModal.title}
          description={confirmModal.message}
          confirmText="Confirmar"
          tone="dark"
          onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
          onConfirm={() => {
            void confirmModal.onConfirm();
          }}
        />
      ) : null}
    </div>
  );
}
