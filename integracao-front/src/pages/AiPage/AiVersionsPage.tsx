import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Database,
  RefreshCcw,
  RefreshCw,
  Search,
  Server,
  Wrench,
  X,
  Code2,
  Bot
} from 'lucide-react';
import { ModalFrame } from '../../components/ModalFrame';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  fetchAiInstallations,
  type AiComponentKey,
  type AiInstallationItem,
  reconfigureAiInstallation,
  updateAiInstallation,
  updateAllAiInstallations,
} from '../../services/aiInstallations.service';
import { useRequireAuth } from '../../hooks/useAuthRedirect';
import { requireAuthSession } from '../../utils/authSession';
import { extractErrorMessage } from '../../utils/error';

type InstanceSummary = {
  instance: string;
  count: number;
  outdatedCount: number;
  latestUpdatedAt: string;
};

type UpdateModalState =
  | { mode: 'single'; item: AiInstallationItem }
  | { mode: 'bulk'; instance: string | null }
  | null;

type ReconfigureModalState =
  | { item: AiInstallationItem }
  | null;

type ReconfigureFormState = {
  assistantId: string;
  assistantName: string;
  preProcessId: string;
  buscaProdutosId: string;
  downloadImagemId: string;
  gerarCheckoutId: string;
  transferirHumanoId: string;
  uraIaId: string;
  uraAbId: string;
  configSnapshotText: string;
  applyToClient: boolean;
  applyUraPatch: boolean;
  code: string;
};

const COMPONENT_LABELS: Record<AiComponentKey, string> = {
  assistant: 'Assistente',
  downloadImagem: 'Download imagem',
  buscaProdutos: 'Busca produtos',
  gerarCheckout: 'Gerar checkout',
  transferirHumano: 'Transferir humano',
  ura: 'URA IA',
  uraAb: 'URA AB',
  preProcess: 'Pré-processamento',
};

const COMPONENT_ORDER: AiComponentKey[] = [
  'assistant',
  'preProcess',
  'buscaProdutos',
  'downloadImagem',
  'gerarCheckout',
  'transferirHumano',
  'ura',
  'uraAb',
];

const UPDATE_EXCLUDED_COMPONENT_KEYS: AiComponentKey[] = ['ura', 'uraAb'];

const BULK_COMPONENT_ORDER = COMPONENT_ORDER.filter(
  (componentKey) => !UPDATE_EXCLUDED_COMPONENT_KEYS.includes(componentKey),
);

function buildInstancesSummary(rows: AiInstallationItem[]) {
  const map = new Map<string, InstanceSummary>();

  for (const item of rows) {
    const current = map.get(item.instance);
    if (!current) {
      map.set(item.instance, {
        instance: item.instance,
        count: 1,
        outdatedCount: item.updateAvailable ? 1 : 0,
        latestUpdatedAt: item.updatedAt,
      });
      continue;
    }

    current.count += 1;
    if (item.updateAvailable) {
      current.outdatedCount += 1;
    }

    if (new Date(item.updatedAt).getTime() > new Date(current.latestUpdatedAt).getTime()) {
      current.latestUpdatedAt = item.updatedAt;
    }
  }

  return Array.from(map.values()).sort((a, b) => a.instance.localeCompare(b.instance));
}

function providerLabel(provider: string) {
  const normalized = provider.trim().toLowerCase();

  if (normalized === 'alpha7') return 'Alpha 7';
  if (normalized === 'trier') return 'Trier';
  if (normalized === 'vannon') return 'Vannon';
  if (normalized === 'vetor') return 'Vetor';
  if (normalized === 'atendimento') return 'Atendimento';
  if (normalized === 'legacy') return 'Legado';
  return provider || 'Sem provider';
}

function isProviderUpdateBlocked(provider: string) {
  return provider.trim().toLowerCase() === 'atendimento';
}

function isReadyForUpdate(item: AiInstallationItem) {
  return item.updateAvailable && item.canUpdate;
}

function formatVersion(version: number | null) {
  return version === null ? '-' : `v${version}`;
}

function getAvailableComponentOptions(item: AiInstallationItem | null) {
  const pending = (item?.componentsNeedingUpdate ?? []).filter(
    (componentKey) => !UPDATE_EXCLUDED_COMPONENT_KEYS.includes(componentKey),
  );

  if (pending.length > 0) {
    return pending;
  }

  const automaticOptions = COMPONENT_ORDER.filter((componentKey) => {
    if (UPDATE_EXCLUDED_COMPONENT_KEYS.includes(componentKey)) {
      return false;
    }

    const installedVersion = item?.installedComponentVersions?.[componentKey] ?? null;
    const currentVersion = item?.currentComponentVersions?.[componentKey] ?? null;
    return installedVersion !== null || currentVersion !== null;
  });

  return automaticOptions;
}

function buildReconfigureFormState(item: AiInstallationItem): ReconfigureFormState {
  return {
    assistantId: item.assistantId || '',
    assistantName: item.assistantName || '',
    preProcessId: item.preProcessId || '',
    buscaProdutosId: item.buscaProdutosId || '',
    downloadImagemId: item.downloadImagemId || '',
    gerarCheckoutId: item.gerarCheckoutId || '',
    transferirHumanoId: item.transferirHumanoId || '',
    uraIaId: item.uraIaId || '',
    uraAbId: item.uraAbId || '',
    configSnapshotText: JSON.stringify(item.configSnapshot ?? {}, null, 2),
    applyToClient: true,
    applyUraPatch: true,
    code: '',
  };
}

export default function AiVersionsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AiInstallationItem[]>([]);
  const [instances, setInstances] = useState<InstanceSummary[]>([]);
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [flashMessage, setFlashMessage] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AiInstallationItem | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [updateModal, setUpdateModal] = useState<UpdateModalState>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [selectedComponentKey, setSelectedComponentKey] = useState<AiComponentKey | ''>('');
  const [selectedBulkProvider, setSelectedBulkProvider] = useState('');
  const [reconfigureModal, setReconfigureModal] = useState<ReconfigureModalState>(null);
  const [reconfigureForm, setReconfigureForm] = useState<ReconfigureFormState | null>(null);
  const [reconfiguring, setReconfiguring] = useState(false);

  useRequireAuth();
  useBodyScrollLock(Boolean(updateModal) || Boolean(reconfigureModal));

  const loadInstances = useCallback(async () => {
    setLoading(true);
    setError('');
    setSelected(null);

    try {
      const data = await fetchAiInstallations({ limit: 5000 });
      setItems([]);
      setInstances(buildInstancesSummary(data));
      setAvailableProviders(
        Array.from(new Set(data.map((item) => item.provider).filter(Boolean))).sort((a, b) =>
          providerLabel(a).localeCompare(providerLabel(b)),
        ),
      );
      setSelectedInstance('');
    } catch (requestError) {
      console.error(requestError);
      setError(
        extractErrorMessage(requestError, 'Falha ao carregar as instalações de IA.'),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInstanceInstallations = useCallback(async (instance: string) => {
    setLoading(true);
    setError('');
    setSelected(null);

    try {
      const data = await fetchAiInstallations({
        limit: 5000,
        instance,
      });
      setItems(data);
      setAvailableProviders(
        Array.from(new Set(data.map((item) => item.provider).filter(Boolean))).sort((a, b) =>
          providerLabel(a).localeCompare(providerLabel(b)),
        ),
      );
      setSelectedInstance(instance);
    } catch (requestError) {
      console.error(requestError);
      setError(
        extractErrorMessage(
          requestError,
          'Falha ao carregar as instalações da instância selecionada.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInstances();
  }, [loadInstances]);

  useEffect(() => {
    if (!flashMessage) return undefined;

    const timeout = window.setTimeout(() => setFlashMessage(''), 5000);
    return () => window.clearTimeout(timeout);
  }, [flashMessage]);

  const filteredInstances = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return instances;

    return instances.filter((item) => item.instance.toLowerCase().includes(term));
  }, [instances, search]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;

    return items.filter((item) => {
      const haystack = [
        item.instance,
        item.assistantName || '',
        item.assistantId || '',
        item.provider,
        item.source,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [items, search]);

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(new Date(value));

  async function executeSingleUpdate(item: AiInstallationItem, code: string) {
    const session = requireAuthSession();
    setUpdatingId(item.id);
    setError('');

    try {
      const result = await updateAiInstallation({
        id: item.id,
        requestedBy: session.authUsername || 'Sistema',
        code: code || undefined,
        componentKey: selectedComponentKey || undefined,
      });

      setFlashMessage(result.message || 'Atualização concluída com sucesso.');

      if (selectedInstance) {
        await loadInstanceInstallations(selectedInstance);
      } else {
        await loadInstances();
      }
    } catch (requestError) {
      console.error(requestError);
      setError(
        extractErrorMessage(requestError, 'Falha ao atualizar a instalação.'),
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function executeBulkUpdate(code: string) {
    const session = requireAuthSession();
    setBulkUpdating(true);
    setError('');

    try {
      const result = await updateAllAiInstallations({
        requestedBy: session.authUsername || 'Sistema',
        code: code || undefined,
        instance: selectedInstance || undefined,
        provider: selectedBulkProvider || undefined,
        componentKey: selectedComponentKey || undefined,
      });

      setFlashMessage(
        result.failed > 0
          ? `Atualização concluída com ${result.failed} falha(s).`
          : (result.skipped || 0) > 0
            ? `${result.updated} instalação(ões) atualizada(s) e ${result.skipped} ignorada(s) por falta de dados.`
          : result.updated > 0
            ? `${result.updated} instalação(ões) atualizada(s) com sucesso.`
            : 'Nenhuma instalação precisava de atualização.',
      );

      if (selectedInstance) {
        await loadInstanceInstallations(selectedInstance);
      } else {
        await loadInstances();
      }
    } catch (requestError) {
      console.error(requestError);
      setError(
        extractErrorMessage(
          requestError,
          'Falha ao atualizar as instalações em lote.',
        ),
      );
    } finally {
      setBulkUpdating(false);
    }
  }

  function handleSingleUpdate(item: AiInstallationItem) {
    if (!isReadyForUpdate(item) || updatingId !== null || bulkUpdating) {
      return;
    }

    setTwoFactorCode('');
    setSelectedComponentKey('');
    setUpdateModal({ mode: 'single', item });
  }

  function handleUpdateAll() {
    if (bulkUpdating) return;

    setTwoFactorCode('');
    setSelectedComponentKey('');
    setSelectedBulkProvider('');
    setUpdateModal({ mode: 'bulk', instance: selectedInstance || null });
  }

  function handleOpenReconfigureModal(item: AiInstallationItem) {
    setReconfigureModal({ item });
    setReconfigureForm(buildReconfigureFormState(item));
  }

  async function handleConfirmReconfigureModal() {
    if (!reconfigureModal || !reconfigureForm) {
      return;
    }

    const session = requireAuthSession();
    setReconfiguring(true);
    setError('');

    try {
      const parsedConfigSnapshot = JSON.parse(reconfigureForm.configSnapshotText || '{}');

      const result = await reconfigureAiInstallation({
        id: reconfigureModal.item.id,
        requestedBy: session.authUsername || 'Sistema',
        code: reconfigureForm.code.trim() || undefined,
        assistantId: reconfigureForm.assistantId.trim(),
        assistantName: reconfigureForm.assistantName.trim(),
        preProcessId: reconfigureForm.preProcessId.trim(),
        buscaProdutosId: reconfigureForm.buscaProdutosId.trim(),
        downloadImagemId: reconfigureForm.downloadImagemId.trim(),
        gerarCheckoutId: reconfigureForm.gerarCheckoutId.trim(),
        transferirHumanoId: reconfigureForm.transferirHumanoId.trim(),
        uraIaId: reconfigureForm.uraIaId.trim(),
        uraAbId: reconfigureForm.uraAbId.trim(),
        configSnapshot: parsedConfigSnapshot,
        applyToClient: reconfigureForm.applyToClient,
        applyUraPatch: reconfigureForm.applyUraPatch,
      });

      setFlashMessage(result.message || 'Configuracao atualizada com sucesso.');
      setReconfigureModal(null);
      setReconfigureForm(null);

      if (selectedInstance) {
        await loadInstanceInstallations(selectedInstance);
      } else {
        await loadInstances();
      }
    } catch (requestError) {
      console.error(requestError);
      setError(
        extractErrorMessage(
          requestError,
          'Falha ao reconfigurar a instalacao da IA.',
        ),
      );
    } finally {
      setReconfiguring(false);
    }
  }

  async function handleConfirmUpdateModal() {
    const code = twoFactorCode.trim();
    if (!updateModal) {
      return;
    }

    const currentModal = updateModal;
    setUpdateModal(null);
    setSelectedBulkProvider('');

    if (currentModal.mode === 'single') {
      await executeSingleUpdate(currentModal.item, code);
      return;
    }

    await executeBulkUpdate(code);
  }

  const updateModalComponentOptions = useMemo(() => {
    if (!updateModal || updateModal.mode !== 'single') {
      return BULK_COMPONENT_ORDER;
    }

    return getAvailableComponentOptions(updateModal.item);
  }, [updateModal]);

  const bulkProviderOptions = useMemo(() => {
    if (!updateModal || updateModal.mode !== 'bulk') {
      return [];
    }

    if (selectedInstance) {
      return Array.from(new Set(items.map((item) => item.provider).filter(Boolean))).sort((a, b) =>
        providerLabel(a).localeCompare(providerLabel(b)),
      );
    }

    return availableProviders;
  }, [availableProviders, items, selectedInstance, updateModal]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 font-sans">
      
      {/* HEADER FIXO */}
      <header className="sticky top-0 z-30 flex-shrink-0 border-b border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <button
              onClick={() => navigate('/main/iaPage')}
              className="mb-3 inline-flex items-center gap-2 rounded-md px-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para criação de IAs
            </button>

            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <Brain className="h-7 w-7 text-violet-600" />
              Monitoramento e Versões
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Gerencie a versão instalada de cada IA nos clientes e aplique atualizações.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {selectedInstance && (
              <div className="group relative flex items-center justify-center">
                <button
                  onClick={() => loadInstances()}
                  disabled={loading || bulkUpdating}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 active:scale-95 disabled:opacity-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="pointer-events-none absolute top-full z-50 mt-2 whitespace-nowrap rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 translate-y-1">
                  Listar todos os clientes
                  <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-800"></div>
                </div>
              </div>
            )}

            <div className="group relative flex items-center justify-center">
              <button
                onClick={() => navigate('/main/iaPage/templates')}
                disabled={loading || bulkUpdating}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600 shadow-sm transition-all hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300 active:scale-95 disabled:opacity-50"
              >
                <Database className="h-4 w-4" />
              </button>
              <div className="pointer-events-none absolute top-full z-50 mt-2 whitespace-nowrap rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 translate-y-1">
                Gerenciar templates
                <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-800"></div>
              </div>
            </div>

            <div className="group relative flex items-center justify-center">
              <button
                onClick={() => (selectedInstance ? loadInstanceInstallations(selectedInstance) : loadInstances())}
                disabled={loading || bulkUpdating}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 active:scale-95 disabled:opacity-50"
              >
                <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin text-violet-600' : ''}`} />
              </button>
              <div className="pointer-events-none absolute top-full z-50 mt-2 whitespace-nowrap rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 translate-y-1">
                Sincronizar dados
                <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-800"></div>
              </div>
            </div>

            {/* Divisor Visual */}
            <div className="mx-1 h-6 w-px bg-slate-200"></div>

            <div className="group relative flex items-center justify-center">
              <button
                onClick={handleUpdateAll}
                disabled={loading || bulkUpdating}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-sm transition-all hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-300 active:scale-95 disabled:opacity-50"
              >
                <Wrench className={`h-4 w-4 ${bulkUpdating ? 'animate-spin' : ''}`} />
              </button>
              <div className="pointer-events-none absolute top-full z-50 mt-2 whitespace-nowrap rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 translate-y-1 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2">
                {selectedInstance ? 'Atualizar esta instância' : 'Atualizar todos os clientes'}
                <div className="absolute -top-1 right-3 sm:right-auto sm:left-1/2 h-2 w-2 sm:-translate-x-1/2 rotate-45 bg-slate-800"></div>
              </div>
            </div>
          </div>
        </div>

        {/* FEEDBACKS (Sticky Header) */}
        <div className="mt-4 empty:hidden">
          {flashMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800 shadow-sm animate-in fade-in slide-in-from-top-2">
              {flashMessage}
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800 shadow-sm animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}
        </div>
      </header>

      {/* ÁREA DE CONTEÚDO PRINCIPAL (Scrollable) */}
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-6">
        
        {/* BARRA DE PESQUISA GERAL */}
        <div className="mb-6 w-full max-w-md flex-shrink-0">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                selectedInstance
                  ? `Buscar IA em ${selectedInstance}...`
                  : 'Buscar cliente por instância...'
              }
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-inner outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            />
          </div>
        </div>

        {/* VISÃO 1: LISTA DE INSTÂNCIAS GERAIS */}
        {!selectedInstance ? (
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex-shrink-0 border-b border-slate-100 bg-slate-50/50 px-5 py-4 text-sm font-bold text-slate-700">
              Clientes encontrados: {filteredInstances.length}
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-white/95 text-xs font-bold uppercase tracking-wider text-slate-500 shadow-sm backdrop-blur">
                  <tr>
                    <th className="px-6 py-4">Instância</th>
                    <th className="px-6 py-4">Total de IAs</th>
                    <th className="px-6 py-4">Desatualizadas</th>
                    <th className="px-6 py-4">Última Sincronização</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {!loading && filteredInstances.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-slate-400">
                        <Server className="mx-auto h-8 w-8 opacity-20 mb-3" />
                        Nenhum cliente encontrado.
                      </td>
                    </tr>
                  ) : null}

                  {filteredInstances.map((item) => (
                    <tr key={item.instance} className="group transition-colors hover:bg-slate-50/80">
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                          <Server className="h-4 w-4" />
                          <span className="max-w-[300px] truncate">{item.instance}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-md bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700">
                          {item.count} instaladas
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {item.outdatedCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {item.outdatedCount} pendentes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Todas em dia
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          {formatDate(item.latestUpdatedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => loadInstanceInstallations(item.instance)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 active:scale-95 group-hover:border-violet-300 group-hover:text-violet-700"
                        >
                          Ver IAs
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          /* VISÃO 2: DETALHES DE UMA INSTÂNCIA ESPECÍFICA (Split Screen) */
          <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row">
            
            {/* Lado Esquerdo: Tabela de IAs */}
            <section className="flex min-h-0 flex-[1.65] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex-shrink-0 border-b border-slate-100 bg-slate-50/50 px-5 py-4">
                <h2 className="text-sm font-bold text-slate-800">
                  Instância: <span className="text-violet-700">{selectedInstance}</span>
                </h2>
                <p className="mt-0.5 text-xs font-medium text-slate-500">
                  {filteredItems.length} IAs instaladas
                </p>
              </div>

              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-white/95 text-xs font-bold uppercase tracking-wider text-slate-500 shadow-sm backdrop-blur">
                    <tr>
                      <th className="px-5 py-4">IA / Provider</th>
                      <th className="px-5 py-4">Versão</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {!loading && filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-16 text-center text-slate-400">
                          <Bot className="mx-auto h-8 w-8 opacity-20 mb-3" />
                          Nenhuma IA encontrada para esta busca.
                        </td>
                      </tr>
                    ) : null}

                    {filteredItems.map((item) => {
                      const readyForUpdate = isReadyForUpdate(item);
                      const isBlocked = isProviderUpdateBlocked(item.provider);
                      const isSelectedRow = selected?.id === item.id;

                      return (
                        <tr
                          key={item.id}
                          className={`group transition-colors hover:bg-slate-50 ${
                            isSelectedRow ? 'bg-violet-50/40 border-l-2 border-l-violet-500' : 'border-l-2 border-l-transparent'
                          }`}
                        >
                          <td className="px-5 py-4 align-top">
                            <div className="font-bold text-slate-900">
                              {item.assistantName || 'IA sem nome'}
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600 border border-slate-200">
                                {providerLabel(item.provider)}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 align-top">
                            <div className="text-xs text-slate-700 font-medium">
                              Instalada: <span className="font-mono text-slate-500">{formatVersion(item.installedVersion)}</span>
                            </div>
                            <div className="mt-0.5 text-xs text-slate-700 font-medium">
                              Em Produção: <span className="font-mono text-slate-500">{formatVersion(item.currentVersion)}</span>
                            </div>
                            
                            {item.componentsNeedingUpdate.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {item.componentsNeedingUpdate.map((key) => (
                                  <span key={key} className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                                    {COMPONENT_LABELS[key]}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4 align-top">
                            <div className="flex flex-col items-start gap-1.5">
                              {item.updateAvailable ? (
                                <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                                  <AlertTriangle className="h-3 w-3" /> Desatualizada
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                                  <CheckCircle2 className="h-3 w-3" /> OK
                                </span>
                              )}
                              
                              {item.updateAvailable && (
                                <span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                  readyForUpdate ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                  isBlocked ? 'bg-red-50 border-red-200 text-red-700' :
                                  'bg-slate-100 border-slate-200 text-slate-600'
                                }`}>
                                  {readyForUpdate ? 'Pronta' : isBlocked ? 'Bloqueado' : 'Incompleta'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 align-top text-right">
                            <div className="flex flex-col gap-2 items-end">
                              <button
                                onClick={() => setSelected(item)}
                                className={`inline-flex w-fit items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all focus:outline-none focus:ring-2 active:scale-95 ${
                                  isSelectedRow ? 'bg-violet-100 border-violet-200 text-violet-700 focus:ring-violet-200' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 focus:ring-slate-200'
                                }`}
                              >
                                <Database className="h-3.5 w-3.5" /> Detalhes
                              </button>
                              
                              <button
                                onClick={() => void handleSingleUpdate(item)}
                                disabled={!readyForUpdate || updatingId === item.id || bulkUpdating}
                                className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 active:scale-95 disabled:opacity-40 disabled:grayscale"
                              >
                                <RefreshCw className={`h-3.5 w-3.5 ${updatingId === item.id ? 'animate-spin' : ''}`} />
                                Update
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Lado Direito: Detalhes da IA selecionada */}
            <aside className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
              <div className="flex-shrink-0 border-b border-slate-200 bg-white px-5 py-4 shadow-sm z-10">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-violet-600" />
                    <h2 className="text-sm font-bold text-slate-900">Configuração e Setup</h2>
                  </div>
                  {selected && (
                    <button
                      onClick={() => handleOpenReconfigureModal(selected)}
                      className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 transition-all hover:bg-violet-100"
                    >
                      <Wrench className="h-3.5 w-3.5" />
                      Editar setup
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-auto p-5 custom-scrollbar">
                {selected ? (
                  <div className="space-y-6 pb-6">
                    
                    {/* Card: Info Básica */}
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                      <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Informações do Agente
                      </div>
                      <div className="p-4 space-y-3 text-sm">
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                          <span className="text-slate-500">Nome:</span>
                          <span className="font-bold text-slate-900">{selected.assistantName || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                          <span className="text-slate-500">Provider:</span>
                          <span className="font-medium text-slate-900">{providerLabel(selected.provider)}</span>
                        </div>
                        <div className="flex justify-between pb-1">
                          <span className="text-slate-500">Origem:</span>
                          <span className="font-medium text-slate-900">{selected.source || '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card: IDs Técnicos */}
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                      <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                        IDs Técnicos (Typebot/IA)
                      </div>
                      <div className="p-4 grid grid-cols-1 gap-2 text-xs font-mono text-slate-600">
                        <div className="flex flex-col gap-1 rounded bg-slate-50 p-2 border border-slate-100">
                          <span className="font-sans text-[10px] font-bold uppercase text-slate-400">Assistant ID</span>
                          {selected.assistantId || '-'}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1 rounded bg-slate-50 p-2 border border-slate-100">
                            <span className="font-sans text-[10px] font-bold uppercase text-slate-400">Pré Process</span>
                            {selected.preProcessId || '-'}
                          </div>
                          <div className="flex flex-col gap-1 rounded bg-slate-50 p-2 border border-slate-100">
                            <span className="font-sans text-[10px] font-bold uppercase text-slate-400">Busca Prod</span>
                            {selected.buscaProdutosId || '-'}
                          </div>
                          <div className="flex flex-col gap-1 rounded bg-slate-50 p-2 border border-slate-100">
                            <span className="font-sans text-[10px] font-bold uppercase text-slate-400">Down. Img</span>
                            {selected.downloadImagemId || '-'}
                          </div>
                          <div className="flex flex-col gap-1 rounded bg-slate-50 p-2 border border-slate-100">
                            <span className="font-sans text-[10px] font-bold uppercase text-slate-400">Checkout</span>
                            {selected.gerarCheckoutId || '-'}
                          </div>
                          <div className="flex flex-col gap-1 rounded bg-slate-50 p-2 border border-slate-100">
                            <span className="font-sans text-[10px] font-bold uppercase text-slate-400">Transf. Humano</span>
                            {selected.transferirHumanoId || '-'}
                          </div>
                          <div className="flex flex-col gap-1 rounded bg-slate-50 p-2 border border-slate-100">
                            <span className="font-sans text-[10px] font-bold uppercase text-slate-400">URA IA</span>
                            {selected.uraIaId || '-'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card: Versões por Componente */}
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                       <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Detalhe de Versões
                      </div>
                      <div className="p-4 space-y-2">
                        {COMPONENT_ORDER.map((componentKey) => {
                          const installed = selected.installedComponentVersions?.[componentKey] ?? null;
                          const current = selected.currentComponentVersions?.[componentKey] ?? null;
                          if (installed === null && current === null) return null;

                          const needsUpdate = selected.componentsNeedingUpdate.includes(componentKey);

                          return (
                            <div key={componentKey} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                              <span className="text-xs font-bold text-slate-700">{COMPONENT_LABELS[componentKey]}</span>
                              <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                                <span>{formatVersion(installed)} → {formatVersion(current)}</span>
                                <span className={`h-2 w-2 rounded-full ${needsUpdate ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Card: Código Fonte (Snapshot) */}
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/50 px-4 py-3">
                        <Code2 className="h-4 w-4 text-slate-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Variáveis Salvas (Snapshot)
                        </span>
                      </div>
                      <pre
                        className="w-full max-h-[300px] overflow-auto bg-[#0d1117] p-4 font-mono text-[11px] leading-relaxed text-slate-300 custom-scrollbar"
                        style={{ tabSize: 2 }}
                      >
                        {JSON.stringify(selected.configSnapshot ?? {}, null, 2)}
                      </pre>
                    </div>

                    {/* Erros e Avisos */}
                    {selected.lastSyncError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm">
                        <div className="font-bold mb-1 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Erro de Sincronização</div>
                        <span className="text-xs">{selected.lastSyncError}</span>
                      </div>
                    )}

                    {isProviderUpdateBlocked(selected.provider) && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm">
                        <div className="font-bold mb-1 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Atualização Indisponível</div>
                        <span className="text-xs">IAs de atendimento "Personalizado" não entram no fluxo de atualização automática.</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                    <Database className="mb-4 h-12 w-12 opacity-20" />
                    <p className="text-sm font-medium">Selecione uma IA na lista<br/>para inspecionar a configuração.</p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* MODAL DE ATUALIZAÇÃO (2FA) */}
            {reconfigureModal && reconfigureForm && (
        <ModalFrame
          onClose={() => {
            if (!reconfiguring) {
              setReconfigureModal(null);
              setReconfigureForm(null);
            }
          }}
          maxWidthClassName="max-w-3xl"
          bodyClassName="bg-white p-0 rounded-2xl overflow-y-auto"
          header={
            <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50 px-6 py-5">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Reconfigurar Instalação
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Edite IDs e vari?veis salvas. Se quiser, o Integra reaplica isso no cliente usando o template atual do backend.
                </p>
              </div>
              <button
                onClick={() => {
                  if (!reconfiguring) {
                    setReconfigureModal(null);
                    setReconfigureForm(null);
                  }
                }}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          }
        >
          <div className="space-y-6 p-6">
            <div className="rounded-xl border border-violet-100 bg-violet-50 p-4 text-sm text-violet-900 shadow-sm">
              Você está reconfigurando a IA <strong>{reconfigureModal.item.assistantName || reconfigureModal.item.assistantId}</strong> da instância <strong>{reconfigureModal.item.instance}</strong>.
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                ['assistantId', 'Assistant ID'],
                ['assistantName', 'Nome da IA'],
                ['preProcessId', 'Pre Process ID'],
                ['buscaProdutosId', 'Busca Produtos ID'],
                ['downloadImagemId', 'Download Imagem ID'],
                ['gerarCheckoutId', 'Gerar Checkout ID'],
                ['transferirHumanoId', 'Transferir Humano ID'],
                ['uraIaId', 'URA IA ID'],
                ['uraAbId', 'URA AB ID'],
              ].map(([field, label]) => (
                <div key={field} className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={reconfigureForm[field as keyof ReconfigureFormState] as string}
                    onChange={(event) =>
                      setReconfigureForm((current) =>
                        current
                          ? { ...current, [field]: event.target.value }
                          : current,
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Config Snapshot (JSON)
              </label>
              <textarea
                value={reconfigureForm.configSnapshotText}
                onChange={(event) =>
                  setReconfigureForm((current) =>
                    current
                      ? { ...current, configSnapshotText: event.target.value }
                      : current,
                  )
                }
                rows={12}
                className="w-full rounded-xl border border-slate-200 bg-[#0d1117] px-4 py-3 font-mono text-xs text-slate-200 shadow-sm outline-none transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={reconfigureForm.applyToClient}
                  onChange={(event) =>
                    setReconfigureForm((current) =>
                      current
                        ? { ...current, applyToClient: event.target.checked }
                        : current,
                    )
                  }
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                <span>
                  <strong className="block text-slate-900">Reaplicar no cliente</strong>
                  Atualiza a configuração no cliente usando o template atual do backend.
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={reconfigureForm.applyUraPatch}
                  onChange={(event) =>
                    setReconfigureForm((current) =>
                      current
                        ? { ...current, applyUraPatch: event.target.checked }
                        : current,
                    )
                  }
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                <span>
                  <strong className="block text-slate-900">Patch seguro na URA</strong>
                  Mantêm a URA customizada e ajusta apenas as variáveis do primeiro JavaScript.
                </span>
              </label>
            </div>

            {reconfigureForm.applyToClient && (
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Código de Autenticação (2FA opcional)
                </label>
                <input
                  type="text"
                  value={reconfigureForm.code}
                  onChange={(event) =>
                    setReconfigureForm((current) =>
                      current ? { ...current, code: event.target.value } : current,
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  placeholder="Usado apenas como fallback manual"
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (!reconfiguring) {
                    setReconfigureModal(null);
                    setReconfigureForm(null);
                  }
                }}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmReconfigureModal()}
                disabled={reconfiguring}
                className="flex-1 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:opacity-50"
              >
                {reconfiguring ? 'Salvando...' : 'Salvar configuração'}
              </button>
            </div>
          </div>
        </ModalFrame>
      )}

{updateModal && (
        <ModalFrame
          onClose={() => {
            if (updatingId === null && !bulkUpdating) {
              setUpdateModal(null);
              setTwoFactorCode('');
              setSelectedComponentKey('');
              setSelectedBulkProvider('');
            }
          }}
          maxWidthClassName="max-w-md"
          bodyClassName="bg-white p-0 rounded-2xl overflow-hidden"
          header={
            <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50 px-6 py-5">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {updateModal.mode === 'single' ? 'Confirmar Atualização' : 'Atualização em Lote'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  O backend pode autenticar automaticamente com a conta técnica configurada.
                </p>
              </div>
              <button
                onClick={() => {
                  if (updatingId === null && !bulkUpdating) {
                    setUpdateModal(null);
                    setTwoFactorCode('');
                    setSelectedComponentKey('');
                    setSelectedBulkProvider('');
                  }
                }}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          }
        >
          <div className="space-y-6 p-6">
            <div className="rounded-xl border border-violet-100 bg-violet-50 p-4 text-sm text-violet-900 line-clamp-3 shadow-sm ">
              {updateModal.mode === 'single' ? (
                <>
                  Você está atualizando a IA <strong className="font-bold">{updateModal.item.assistantName || updateModal.item.assistantId}</strong> na instância <strong className="font-bold">{updateModal.item.instance}</strong>.
                </>
              ) : updateModal.instance ? (
                <>
                  Você está prestando a atualizar <strong>todas as IAs desatualizadas</strong> da instância <strong className="font-bold">{updateModal.instance}</strong>.
                </>
              ) : (
                <>Você está prestando a atualizar <strong>todas as instalações de todos os clientes</strong>. Esta operação pode demorar.</>
              )}
            </div>

            {updateModal.mode === 'bulk' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Selecionar Provider (Opcional)
                </label>
                <select
                  value={selectedBulkProvider}
                  onChange={(event) => setSelectedBulkProvider(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                >
                  <option value="">
                    {selectedInstance
                      ? 'Todos os providers desta instância'
                      : 'Todos os providers elegíveis'}
                  </option>
                  {bulkProviderOptions.map((provider) => (
                    <option key={provider} value={provider}>
                      Somente: {providerLabel(provider)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Selecionar Fluxo (Opcional)
              </label>
              <select
                value={selectedComponentKey}
                onChange={(event) => setSelectedComponentKey(event.target.value as AiComponentKey | '')}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              >
                <option value="">
                  {updateModal.mode === 'single' ? 'Todos os fluxos pendentes desta IA' : 'Todos os fluxos elegíveis'}
                </option>
                {updateModalComponentOptions.map((key) => (
                  <option key={key} value={key}>
                    Somente: {COMPONENT_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Código de Autenticação (2FA opcional)
              </label>
              <input
                type="text"
                autoFocus
                value={twoFactorCode}
                onChange={(event) => setTwoFactorCode(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void handleConfirmUpdateModal();
                  }
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                placeholder="Usado apenas como fallback manual"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (updatingId === null && !bulkUpdating) {
                    setUpdateModal(null);
                    setTwoFactorCode('');
                    setSelectedComponentKey('');
                    setSelectedBulkProvider('');
                  }
                }}
                disabled={updatingId !== null || bulkUpdating}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 active:scale-95 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmUpdateModal()}
                disabled={updatingId !== null || bulkUpdating}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${updatingId !== null || bulkUpdating ? 'animate-spin' : ''}`} />
                Confirmar
              </button>
            </div>
          </div>
        </ModalFrame>
      )}
    </div>
  );
}
