import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Boxes,
  CheckCircle2,
  Clock3,
  Database,
  Info,
  Loader2,
  Search,
  StopCircle,
  Trash2,
  User,
} from 'lucide-react';
import { useRequireAuth } from '../../hooks/useAuthRedirect';
import {
  cancelBancoUnicoImport,
  deleteBancoUnicoImport,
  getBancoUnicoImport,
  listBancoUnicoImportItems,
  type BancoUnicoImportEvent,
  type BancoUnicoImportItem,
  type BancoUnicoImportJobDetail,
} from '../../services/bancoUnicoImports.service';
import { extractErrorMessage } from '../../utils/error';
import { API_BASE } from '../../services/api';
import {
  formatDateTime,
  itemStatusLabel,
  itemStatusTone,
  MODE_LABEL,
  SOURCE_TYPE_LABEL,
  statusInfo,
} from './bancoUnicoImports.ui';
import StatusBadge from './StatusBadge';
import ConfirmModal from './ConfirmModal';
import BancoUnicoImportConsole from './BancoUnicoImportConsole';

const ACTIVE_JOB_STATUSES = new Set(['pending', 'running', 'cancelling']);

const FUNNEL_STEPS: Array<{
  key: keyof Pick<
    BancoUnicoImportJobDetail,
    'totalSelected' | 'totalExisting' | 'totalPrepared' | 'totalPublished' | 'totalErrors'
  >;
  label: string;
  tone: string;
}> = [
  { key: 'totalSelected', label: 'Selecionados', tone: 'text-foreground' },
  { key: 'totalExisting', label: 'Ja existiam', tone: 'text-foreground/70' },
  { key: 'totalPrepared', label: 'Preparados', tone: 'text-primary' },
  { key: 'totalPublished', label: 'Subidos', tone: 'text-emerald-600' },
  { key: 'totalErrors', label: 'Erros', tone: 'text-rose-600' },
];

const ITEM_STATUS_FILTERS = [
  { value: 'all', label: 'Todos os status' },
  { value: 'loaded', label: 'Carregados' },
  { value: 'invalid_ean', label: 'EAN invalido' },
  { value: 'already_exists', label: 'Ja existiam' },
  { value: 'classified', label: 'Clarificados' },
  { value: 'prepared', label: 'Preparados' },
  { value: 'published', label: 'Subidos' },
  { value: 'skipped_taxonomy', label: 'Sem arvore' },
  { value: 'classification_error', label: 'Erro classificacao' },
  { value: 'publish_error', label: 'Erro publicacao' },
] as const;

function parseLoadingSourceHint(message: string | null) {
  const normalized = String(message || '');
  const match = normalized.match(/Pagina\s+(\d+)\s+\((\d+)\s+acumulados\)/i);
  if (!match) {
    return null;
  }

  return {
    page: Number(match[1]),
    loaded: Number(match[2]),
  };
}

export default function BancoUnicoImportJobView() {
  const navigate = useNavigate();
  const params = useParams<{ jobId: string }>();
  const jobId = Number(params.jobId);
  useRequireAuth();

  const [job, setJob] = useState<BancoUnicoImportJobDetail | null>(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [events, setEvents] = useState<BancoUnicoImportEvent[]>([]);
  const [items, setItems] = useState<BancoUnicoImportItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsSearch, setItemsSearch] = useState('');
  const [itemsStatus, setItemsStatus] = useState('all');
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsTotalPages, setItemsTotalPages] = useState(1);
  const [itemsTotalItems, setItemsTotalItems] = useState(0);
  const [flashMessage, setFlashMessage] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [streamConnected, setStreamConnected] = useState(false);
  const [itemsRealtimeTick, setItemsRealtimeTick] = useState(0);
  const itemsRealtimeRefreshRef = useRef<number | null>(null);

  useEffect(() => {
    setEvents([]);
  }, [jobId]);

  async function loadJob(options?: { silent?: boolean }) {
    try {
      const detail = await getBancoUnicoImport(jobId);
      setJob(detail);
      if (!options?.silent) {
        setEvents(detail.recentEvents);
      }
    } catch (error) {
      if (!options?.silent) {
        setNotFound(true);
      }
      setFlashMessage({
        tone: 'error',
        text: extractErrorMessage(error, 'Erro ao carregar detalhes da importacao.'),
      });
    } finally {
      setJobLoading(false);
    }
  }

  async function loadItems(options?: { silent?: boolean }) {
    if (!options?.silent) {
      setItemsLoading(true);
    }

    try {
      const response = await listBancoUnicoImportItems(jobId, {
        page: itemsPage,
        limit: 14,
        search: itemsSearch,
        status: itemsStatus === 'all' ? undefined : itemsStatus,
      });
      setItems(response.data);
      setItemsTotalPages(response.meta.totalPages);
      setItemsTotalItems(response.meta.totalItems);
    } catch (error) {
      setFlashMessage({
        tone: 'error',
        text: extractErrorMessage(error, 'Erro ao carregar itens da importacao.'),
      });
    } finally {
      setItemsLoading(false);
    }
  }

  useEffect(() => {
    if (!jobId) {
      return;
    }

    void loadJob();
  }, [jobId]);

  useEffect(() => {
    if (!jobId) {
      return;
    }

    void loadItems();
  }, [jobId, itemsPage, itemsSearch, itemsStatus, itemsRealtimeTick]);

  useEffect(() => {
    if (!flashMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => setFlashMessage(null), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [flashMessage]);

  useEffect(() => {
    if (!job || !ACTIVE_JOB_STATUSES.has(job.status)) {
      return;
    }

    const streamUrl = `${API_BASE}/api/banco-unico-imports/${jobId}/stream`;
    const eventSource = new EventSource(streamUrl);

    eventSource.addEventListener('open', () => {
      setStreamConnected(true);
    });

    eventSource.addEventListener('job', (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as BancoUnicoImportJobDetail;
        if (payload.id !== jobId) {
          return;
        }

        setJob(payload);
      } catch (error) {
        console.error(error);
      }
    });

    eventSource.addEventListener('event', (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as BancoUnicoImportEvent;
        if (payload.jobId !== jobId) {
          return;
        }

        setEvents((current) => {
          if (current.some((item) => item.id === payload.id)) {
            return current;
          }

          return [...current, payload].slice(-300);
        });
      } catch (error) {
        console.error(error);
      }
    });

    eventSource.addEventListener('items_changed', (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as {
          jobId: number;
        };
        if (payload.jobId !== jobId) {
          return;
        }

        if (itemsRealtimeRefreshRef.current) {
          window.clearTimeout(itemsRealtimeRefreshRef.current);
        }

        itemsRealtimeRefreshRef.current = window.setTimeout(() => {
          setItemsRealtimeTick((current) => current + 1);
          itemsRealtimeRefreshRef.current = null;
        }, 120);
      } catch (error) {
        console.error(error);
      }
    });

    eventSource.addEventListener('heartbeat', () => {
      setStreamConnected(true);
    });

    eventSource.onerror = () => {
      setStreamConnected(false);
    };

    return () => {
      if (itemsRealtimeRefreshRef.current) {
        window.clearTimeout(itemsRealtimeRefreshRef.current);
        itemsRealtimeRefreshRef.current = null;
      }
      setStreamConnected(false);
      eventSource.close();
    };
  }, [jobId, job?.status]);

  useEffect(() => {
    if (!job || !ACTIVE_JOB_STATUSES.has(job.status)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadItems({ silent: true });
      if (!streamConnected) {
        void loadJob({ silent: true });
      }
    }, streamConnected ? 8000 : 3000);

    return () => window.clearInterval(intervalId);
  }, [jobId, job?.status, itemsPage, itemsSearch, itemsStatus, streamConnected]);

  async function handleCancelJob() {
    setCancelling(true);
    try {
      await cancelBancoUnicoImport(jobId);
      setFlashMessage({ tone: 'success', text: 'Cancelamento solicitado.' });
      await loadJob();
    } catch (error) {
      setFlashMessage({
        tone: 'error',
        text: extractErrorMessage(error, 'Erro ao cancelar importacao.'),
      });
    } finally {
      setCancelling(false);
    }
  }

  if (jobLoading) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-foreground/[0.015]">
        <Loader2 className="h-6 w-6 animate-spin text-foreground/40" />
      </div>
    );
  }

  if (notFound || !job) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3 bg-foreground/[0.015] text-center">
        <AlertTriangle className="h-6 w-6 text-foreground/30" />
        <p className="text-sm text-foreground/55">Importacao nao encontrada.</p>
        <button
          onClick={() => navigate('/main/aplications/banco-unico-imports')}
          className="text-sm font-medium text-primary hover:underline"
        >
          Voltar para a lista
        </button>
      </div>
    );
  }

  const status = statusInfo(job.status);
  const isActive = ACTIVE_JOB_STATUSES.has(job.status);
  const loadingSourceHint = parseLoadingSourceHint(job.currentMessage);
  const isLoadingSourceStage = job.currentStage === 'loading_source';
  const shouldShowSourceLoadingNotice =
    isActive && isLoadingSourceStage && job.itemCount === 0;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-foreground/[0.015] font-sans text-foreground">
      <header className="sticky top-0 z-10 flex w-full shrink-0 flex-wrap items-center justify-between gap-4 border-b border-border bg-background px-6 py-3.5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            onClick={() => navigate('/main/aplications/banco-unico-imports')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-foreground/50 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div className="h-6 w-px shrink-0 bg-border" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-foreground/40 tabular-nums">#{job.id}</span>
              <h1 className="truncate text-base font-semibold text-foreground">{job.clientName}</h1>
              <StatusBadge label={status.label} tone={status.tone} />
            </div>
            <p className="hidden truncate text-xs text-foreground/50 sm:block">
              {job.currentMessage || 'Sem mensagem de progresso.'}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isActive ? (
            <button
              onClick={() => void handleCancelJob()}
              disabled={cancelling}
              className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50"
            >
              <StopCircle className="h-4 w-4" />
              {cancelling ? 'Solicitando...' : 'Cancelar'}
            </button>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-foreground/60 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            >
              <Trash2 className="h-4 w-4" /> Excluir
            </button>
          )}
        </div>
      </header>

      <main className="custom-scrollbar mx-auto flex min-h-0 w-full max-w-[1500px] flex-1 flex-col gap-6 overflow-y-auto p-5 lg:p-8">
        {flashMessage ? (
          <div
            className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium ${
              flashMessage.tone === 'success'
                ? 'border-emerald-200 bg-emerald-50/80 text-emerald-800'
                : 'border-rose-200 bg-rose-50/80 text-rose-800'
            }`}
          >
            {flashMessage.tone === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            {flashMessage.text}
          </div>
        ) : null}

        {/* Progresso, funil e metadados: uma seção só, dividida por border-t — não três cards empilhados */}
        <div className="rounded-xl border border-border bg-background">
          <div className="p-5">
            <div className="flex items-center justify-between text-xs font-medium text-foreground/50">
              <span>Progresso geral</span>
              <span className="tabular-nums">
                {job.progressCurrent}/{job.progressTotal || 0} &middot; {job.progressPercent}%
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-foreground/[0.06]">
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{ width: `${job.progressPercent}%` }}
              />
            </div>
            {job.currentStage ? (
              <p className="mt-2 text-xs text-foreground/45">Etapa atual: {job.currentStage}</p>
            ) : null}
          </div>

          {shouldShowSourceLoadingNotice ? (
            <div className="flex items-start gap-3 border-t border-border px-5 py-3 text-sm text-foreground/70">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="font-medium text-foreground">
                  A importacao ainda esta carregando o catalogo da origem.
                </p>
                <p className="mt-1 text-foreground/55">
                  Os itens carregados pela origem podem aparecer na tabela durante esta etapa e ser atualizados conforme avancam no processamento.
                  {loadingSourceHint
                    ? ` Ate agora foram carregados ${loadingSourceHint.loaded} produto(s) da pagina ${loadingSourceHint.page}.`
                    : ' Aguarde as proximas paginas para acompanhar os registros na tabela abaixo.'}
                </p>
              </div>
            </div>
          ) : null}

          <div className="grid border-t border-border xl:grid-cols-[1.4fr_1fr]">
            <div className="p-5">
              <h2 className="text-sm font-semibold text-foreground">Funil de processamento</h2>
              <div className="mt-4 flex items-stretch gap-1 overflow-x-auto">
                {FUNNEL_STEPS.map((step, index) => (
                  <div key={step.key} className="flex items-stretch">
                    <div className="flex min-w-[104px] flex-col justify-center px-3 py-2">
                      <span className="text-xs text-foreground/45">{step.label}</span>
                      <span className={`mt-1 text-2xl font-semibold tabular-nums ${step.tone}`}>
                        {job[step.key]}
                      </span>
                    </div>
                    {index < FUNNEL_STEPS.length - 1 ? (
                      <div className="flex items-center px-1 text-foreground/20">&rarr;</div>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-border pt-3 text-xs text-foreground/50">
                <span>Amostra analisada: <strong className="font-semibold text-foreground/75">{job.totalSampled}</strong></span>
                <span>Catalogo valido: <strong className="font-semibold text-foreground/75">{job.totalCatalogValid}</strong></span>
                <span>EANs invalidos: <strong className="font-semibold text-foreground/75">{job.totalInvalidEans}</strong></span>
                <span>Ignorados: <strong className="font-semibold text-foreground/75">{job.totalSkipped}</strong></span>
              </div>
            </div>

            <div className="border-t border-border p-5 xl:border-l xl:border-t-0">
              <h2 className="text-sm font-semibold text-foreground">Detalhes da execucao</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-1.5 text-foreground/50">
                    <Database className="h-3.5 w-3.5 text-foreground/35" /> Origem
                  </dt>
                  <dd className="truncate text-right font-medium text-foreground">
                    {SOURCE_TYPE_LABEL[job.sourceType] || job.sourceType}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-1.5 text-foreground/50">
                    <Boxes className="h-3.5 w-3.5 text-foreground/35" /> Modo
                  </dt>
                  <dd className="truncate text-right font-medium text-foreground">
                    {MODE_LABEL[job.mode] || job.mode}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-1.5 text-foreground/50">
                    <User className="h-3.5 w-3.5 text-foreground/35" /> Solicitado por
                  </dt>
                  <dd className="truncate text-right font-medium text-foreground">
                    {job.requestedBy || '-'}
                  </dd>
                </div>
                <div className="border-t border-border pt-3" />
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-1.5 text-foreground/50">
                    <Clock3 className="h-3.5 w-3.5 text-foreground/35" /> Criada
                  </dt>
                  <dd className="text-right text-foreground/75">{formatDateTime(job.createdAt)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-1.5 text-foreground/50">
                    <Clock3 className="h-3.5 w-3.5 text-foreground/35" /> Iniciada
                  </dt>
                  <dd className="text-right text-foreground/75">{formatDateTime(job.startedAt)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-1.5 text-foreground/50">
                    <CheckCircle2 className="h-3.5 w-3.5 text-foreground/35" /> Finalizada
                  </dt>
                  <dd className="text-right text-foreground/75">{formatDateTime(job.finishedAt)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Tier 3: live log console — the primary diagnostic surface while a job runs */}
        <BancoUnicoImportConsole
          jobId={jobId}
          events={events}
          streamConnected={streamConnected}
        />

        {/* Tier 4: items table */}
        <div className="grid gap-6">
          <div className="rounded-xl border border-border bg-background">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Itens da importacao</h3>
                <p className="mt-0.5 text-xs text-foreground/45">
                  Busca paginada por EAN, nome e fabricante · atualizacao em tempo real
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/35" />
                  <input
                    value={itemsSearch}
                    onChange={(event) => {
                      setItemsSearch(event.target.value);
                      setItemsPage(1);
                    }}
                    className="rounded-lg border border-border bg-foreground/[0.02] py-2 pl-8 pr-3 text-sm outline-none transition-colors focus:border-primary focus:bg-background focus:ring-1 focus:ring-primary"
                    placeholder="Buscar item..."
                  />
                </div>

                <select
                  value={itemsStatus}
                  onChange={(event) => {
                    setItemsStatus(event.target.value);
                    setItemsPage(1);
                  }}
                  className="rounded-lg border border-border bg-foreground/[0.02] px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:bg-background focus:ring-1 focus:ring-primary"
                >
                  {ITEM_STATUS_FILTERS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {itemsLoading ? (
              <div className="flex h-40 items-center justify-center text-foreground/50">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2 px-6 text-center text-foreground/50">
                <p>
                  {shouldShowSourceLoadingNotice
                    ? 'Ainda nao ha itens exibidos; a origem continua sendo carregada.'
                    : 'Nenhum item para os filtros atuais.'}
                </p>
                {shouldShowSourceLoadingNotice ? (
                  <p className="text-xs text-foreground/40">
                    A tabela sera atualizada automaticamente conforme novas paginas forem entrando.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border text-xs font-medium text-foreground/45">
                      <th className="px-5 py-2.5 font-medium">Status</th>
                      <th className="px-3 py-2.5 font-medium">EAN</th>
                      <th className="px-3 py-2.5 font-medium">Produto</th>
                      <th className="px-3 py-2.5 font-medium">Fabricante</th>
                      <th className="px-3 py-2.5 font-medium">Erro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((item) => (
                      <tr key={item.id} className="align-top transition-colors hover:bg-foreground/[0.02]">
                        <td className="px-5 py-3">
                          <StatusBadge
                            label={itemStatusLabel(item.status)}
                            tone={itemStatusTone(item.status)}
                          />
                        </td>
                        <td className="px-3 py-3 text-sm tabular-nums text-foreground/60">
                          {item.ean || '-'}
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-sm font-medium text-foreground">
                            {item.nameNormalized || item.nameOriginal || '-'}
                          </div>
                          {item.nameOriginal &&
                          item.nameNormalized &&
                          item.nameOriginal !== item.nameNormalized ? (
                            <div className="mt-0.5 text-xs text-foreground/40">
                              Original: {item.nameOriginal}
                            </div>
                          ) : null}
                          {item.activeIngredient ? (
                            <div className="mt-0.5 text-xs text-foreground/40">
                              {item.activeIngredient}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-3 py-3 text-sm text-foreground/60">
                          {item.manufacturer || '-'}
                        </td>
                        <td className="px-3 py-3 text-sm text-foreground/60">
                          {item.errorMessage || item.skippedReason || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-foreground/50">
              <span>{itemsTotalItems} item(ns)</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setItemsPage((current) => Math.max(1, current - 1))}
                  disabled={itemsPage === 1}
                  className="rounded-md border border-border px-2.5 py-1.5 font-medium transition-colors hover:bg-foreground/[0.03] disabled:opacity-35"
                >
                  Anterior
                </button>
                <span className="tabular-nums">
                  {itemsPage}/{itemsTotalPages}
                </span>
                <button
                  onClick={() => setItemsPage((current) => Math.min(itemsTotalPages, current + 1))}
                  disabled={itemsPage >= itemsTotalPages}
                  className="rounded-md border border-border px-2.5 py-1.5 font-medium transition-colors hover:bg-foreground/[0.03] disabled:opacity-35"
                >
                  Proxima
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showDeleteConfirm ? (
        <ConfirmModal
          title="Excluir importacao"
          description={`Isso remove permanentemente a importacao #${job.id} (${job.clientName}), seus itens e eventos. Essa acao nao pode ser desfeita.`}
          confirmLabel="Excluir importacao"
          confirmingLabel="Excluindo..."
          tone="danger"
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={async () => {
            await deleteBancoUnicoImport(jobId);
            navigate('/main/aplications/banco-unico-imports');
          }}
        />
      ) : null}
    </div>
  );
}
