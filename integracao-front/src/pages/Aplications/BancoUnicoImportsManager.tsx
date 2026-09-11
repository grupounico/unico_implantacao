import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Play,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { useRequireAuth } from '../../hooks/useAuthRedirect';
import {
  createBancoUnicoImport,
  deleteBancoUnicoImport,
  listBancoUnicoImports,
  type BancoUnicoImportJob,
} from '../../services/bancoUnicoImports.service';
import type { Client } from '../../services/clients.service';
import { extractErrorMessage } from '../../utils/error';
import { statusInfo } from './bancoUnicoImports.ui';
import StatusBadge from './StatusBadge';
import ClientSelect from './ClientSelect';
import ConfirmModal from './ConfirmModal';

type JobStatusFilter = 'all' | 'pending' | 'running' | 'cancelling' | 'completed' | 'cancelled' | 'failed';

const ACTIVE_JOB_STATUSES = new Set(['pending', 'running', 'cancelling']);

const INITIAL_FORM = {
  sourcePageSize: '999',
  sourceAtivo: true,
  sourceIntegracaoEcommerce: true,
  sourceProcessaCustoMedio: false,
  bancoUnicoBaseUrl: 'https://unicocontato.tech/banco-unico',
  bancoUnicoAuthorization: '',
  batchSize: '50',
  classifyConcurrency: '5',
  publishConcurrency: '1',
  existingCheckBatchSize: '100',
  existingCheckConcurrency: '2',
  mode: 'publish' as 'publish' | 'classify-only',
  disableNormalizeAi: false,
  disableAi: false,
  forceTaxonomyAi: false,
  ignoreExistingCheck: false,
  useAiNormalization: false,
  limit: '',
  offset: '0',
};

export default function BancoUnicoImportsManager() {
  const navigate = useNavigate();
  useRequireAuth();

  const [form, setForm] = useState(INITIAL_FORM);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [jobs, setJobs] = useState<BancoUnicoImportJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobSearch, setJobSearch] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState<JobStatusFilter>('all');
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsTotalPages, setJobsTotalPages] = useState(1);
  const [jobsTotalItems, setJobsTotalItems] = useState(0);
  const [flashMessage, setFlashMessage] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BancoUnicoImportJob | null>(null);

  async function loadJobs(options?: { silent?: boolean }) {
    if (!options?.silent) {
      setJobsLoading(true);
    }

    try {
      const response = await listBancoUnicoImports({
        page: jobsPage,
        limit: 12,
        search: jobSearch,
        status: jobStatusFilter === 'all' ? undefined : jobStatusFilter,
      });
      setJobs(response.data);
      setJobsTotalPages(response.meta.totalPages);
      setJobsTotalItems(response.meta.totalItems);
    } catch (error) {
      setFlashMessage({
        tone: 'error',
        text: extractErrorMessage(error, 'Erro ao carregar importacoes.'),
      });
    } finally {
      setJobsLoading(false);
    }
  }

  useEffect(() => {
    void loadJobs();
  }, [jobsPage, jobSearch, jobStatusFilter]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadJobs({ silent: true });
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [jobsPage, jobSearch, jobStatusFilter]);

  useEffect(() => {
    if (!flashMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => setFlashMessage(null), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [flashMessage]);

  function handleFormChange<K extends keyof typeof INITIAL_FORM>(
    key: K,
    value: (typeof INITIAL_FORM)[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!selectedClient) {
      setFlashMessage({ tone: 'error', text: 'Selecione um cliente para iniciar a subida.' });
      return;
    }

    setSubmitting(true);

    try {
      const created = await createBancoUnicoImport({
        clientId: selectedClient.id,
        sourcePageSize: Number(form.sourcePageSize),
        sourceAtivo: form.sourceAtivo,
        sourceIntegracaoEcommerce: form.sourceIntegracaoEcommerce,
        sourceProcessaCustoMedio: form.sourceProcessaCustoMedio,
        bancoUnicoBaseUrl: form.bancoUnicoBaseUrl,
        bancoUnicoAuthorization: form.bancoUnicoAuthorization,
        batchSize: Number(form.batchSize),
        classifyConcurrency: Number(form.classifyConcurrency),
        publishConcurrency: Number(form.publishConcurrency),
        existingCheckBatchSize: Number(form.existingCheckBatchSize),
        existingCheckConcurrency: Number(form.existingCheckConcurrency),
        mode: form.mode,
        disableNormalizeAi: form.disableNormalizeAi,
        disableAi: form.disableAi,
        forceTaxonomyAi: form.forceTaxonomyAi,
        ignoreExistingCheck: form.ignoreExistingCheck,
        useAiNormalization: form.useAiNormalization,
        limit: form.limit ? Number(form.limit) : undefined,
        offset: Number(form.offset),
      });

      await loadJobs({ silent: true });
      navigate(`/main/aplications/banco-unico-imports/${created.id}`);
    } catch (error) {
      setFlashMessage({
        tone: 'error',
        text: extractErrorMessage(error, 'Erro ao iniciar importacao.'),
      });
    } finally {
      setSubmitting(false);
    }
  }

  const activeJobCount = jobs.filter((job) =>
    ACTIVE_JOB_STATUSES.has(job.status),
  ).length;
  const completedJobCount = jobs.filter((job) => job.status === 'completed').length;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-foreground/[0.015] font-sans text-foreground">
      <header className="sticky top-0 z-10 flex w-full shrink-0 flex-wrap items-center justify-between gap-4 border-b border-border bg-background px-6 py-3.5 sm:flex-row">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            onClick={() => navigate('/main/aplications')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-foreground/50 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div className="h-6 w-px shrink-0 bg-border" />
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-foreground">
              Subidas Banco Unico
            </h1>
            <p className="hidden truncate text-xs text-foreground/50 sm:block">
              Importacao de catalogo por cliente, em tempo real
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-5 border-x border-border px-5 text-sm md:flex">
          <div className="flex items-baseline gap-1.5">
            <span className="font-semibold tabular-nums text-foreground">{activeJobCount}</span>
            <span className="text-xs text-foreground/50">ativas</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-semibold tabular-nums text-foreground">{completedJobCount}</span>
            <span className="text-xs text-foreground/50">concluidas</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => navigate('/main/aplications/banco-unico-imports/clientes')}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-foreground/80 transition-colors hover:border-foreground/20 hover:text-foreground"
          >
            <Users className="h-3.5 w-3.5" /> Clientes
          </button>
          <button
            onClick={() => void loadJobs()}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-foreground/80 transition-colors hover:border-foreground/20 hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Atualizar
          </button>
        </div>
      </header>

      <main className="custom-scrollbar mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col gap-6 overflow-y-auto p-5 lg:flex-row lg:items-start lg:gap-8 lg:p-8">
        <aside className="flex w-full shrink-0 flex-col gap-5 lg:sticky lg:top-0 lg:w-[460px] lg:self-start">
          <form
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
            className="space-y-5 rounded-xl border border-border bg-background p-5"
          >
            <div>
              <h2 className="text-sm font-semibold text-foreground">Nova subida</h2>
              <p className="mt-1 text-xs text-foreground/50">
                Configure a origem e inicie o processamento sem sair do modulo.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground/55">
                Cliente
              </label>
              <ClientSelect value={selectedClient} onChange={setSelectedClient} />
              {selectedClient ? (
                <p className="mt-1.5 text-xs text-foreground/45">
                  Origem e credenciais herdadas do cadastro do cliente.
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground/55">
                Authorization Banco Unico (opcional)
              </label>
              <input
                type="password"
                value={form.bancoUnicoAuthorization}
                onChange={(event) =>
                  handleFormChange('bancoUnicoAuthorization', event.target.value)
                }
                className="w-full rounded-lg border border-border bg-foreground/[0.02] px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:bg-background focus:ring-1 focus:ring-primary"
                placeholder="Deixe em branco se a API nao exigir"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground/55">
                  Lote de publicacao
                </label>
                <input
                  value={form.batchSize}
                  onChange={(event) => handleFormChange('batchSize', event.target.value)}
                  className="w-full rounded-lg border border-border bg-foreground/[0.02] px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:bg-background focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground/55">
                  Concorrencia classificacao
                </label>
                <input
                  value={form.classifyConcurrency}
                  onChange={(event) =>
                    handleFormChange('classifyConcurrency', event.target.value)
                  }
                  className="w-full rounded-lg border border-border bg-foreground/[0.02] px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:bg-background focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-foreground/65">
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={form.mode === 'classify-only'}
                  onChange={(event) =>
                    handleFormChange(
                      'mode',
                      event.target.checked ? 'classify-only' : 'publish',
                    )
                  }
                />
                Apenas classificar
              </label>
              <label className="inline-flex items-center gap-2 text-xs font-medium text-foreground/65">
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={form.forceTaxonomyAi}
                  onChange={(event) =>
                    handleFormChange('forceTaxonomyAi', event.target.checked)
                  }
                />
                Forcar IA na arvore
              </label>
              <label className="inline-flex items-center gap-2 text-xs font-medium text-foreground/65">
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={form.ignoreExistingCheck}
                  onChange={(event) =>
                    handleFormChange('ignoreExistingCheck', event.target.checked)
                  }
                />
                Ignorar consulta de existentes
              </label>
              <label className="inline-flex items-center gap-2 text-xs font-medium text-foreground/65">
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={form.useAiNormalization}
                  onChange={(event) =>
                    handleFormChange('useAiNormalization', event.target.checked)
                  }
                />
                Usar IA na normalizacao
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Iniciando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> Iniciar subida
                </>
              )}
            </button>
          </form>

          <div className="space-y-3 rounded-xl border border-border bg-background p-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/35" />
              <input
                value={jobSearch}
                onChange={(event) => {
                  setJobSearch(event.target.value);
                  setJobsPage(1);
                }}
                className="w-full rounded-lg border border-border bg-foreground/[0.02] py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary focus:bg-background focus:ring-1 focus:ring-primary"
                placeholder="Buscar cliente ou origem..."
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                ['all', 'Todas'],
                ['running', 'Rodando'],
                ['completed', 'Concluidas'],
                ['failed', 'Falhas'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setJobStatusFilter(value as JobStatusFilter);
                    setJobsPage(1);
                  }}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    jobStatusFilter === value
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/55 hover:bg-foreground/[0.04] hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-6">
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

          <div className="rounded-xl border border-border bg-background">
            <div className="flex items-baseline justify-between gap-3 border-b border-border px-5 py-3.5">
              <h2 className="text-sm font-semibold text-foreground">Historico de importacoes</h2>
              <span className="text-xs text-foreground/45">
                {jobsTotalItems} importacao(oes)
              </span>
            </div>

            {jobsLoading ? (
              <div className="flex h-40 items-center justify-center text-foreground/40">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-foreground/45">
                Nenhuma importacao encontrada.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {jobs.map((job) => {
                  const info = statusInfo(job.status);
                  const deletable = !ACTIVE_JOB_STATUSES.has(job.status);
                  return (
                    <li key={job.id} className="group flex items-center">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/main/aplications/banco-unico-imports/${job.id}`)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            navigate(`/main/aplications/banco-unico-imports/${job.id}`);
                          }
                        }}
                        className="grid flex-1 cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-3.5 text-left transition-colors hover:bg-foreground/[0.02] sm:grid-cols-[140px_1fr_140px_auto]"
                      >
                        <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
                          <span className="text-xs font-medium text-foreground/40 tabular-nums">#{job.id}</span>
                          <span className="truncate text-sm font-semibold text-foreground">{job.clientName}</span>
                        </div>

                        <p className="col-span-3 truncate text-xs text-foreground/50 sm:col-span-1">
                          {job.currentMessage || 'Sem detalhes recentes.'}
                        </p>

                        <div className="flex items-center gap-2.5">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-foreground/[0.06]">
                            <div
                              className="h-full rounded-full bg-primary transition-[width]"
                              style={{ width: `${job.progressPercent}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-xs font-medium tabular-nums text-foreground/55">
                            {job.progressPercent}%
                          </span>
                        </div>

                        <StatusBadge label={info.label} tone={info.tone} />
                      </div>

                      {deletable ? (
                        <button
                          type="button"
                          title="Excluir importacao"
                          onClick={() => setDeleteTarget(job)}
                          className="mr-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-foreground/30 opacity-0 transition-colors hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 focus-visible:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-foreground/50">
              <span>Pagina {jobsPage} de {jobsTotalPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setJobsPage((current) => Math.max(1, current - 1))}
                  disabled={jobsPage === 1}
                  className="rounded-md border border-border px-2.5 py-1.5 font-medium transition-colors hover:bg-foreground/[0.03] disabled:opacity-35"
                >
                  Anterior
                </button>
                <button
                  onClick={() =>
                    setJobsPage((current) => Math.min(jobsTotalPages, current + 1))
                  }
                  disabled={jobsPage >= jobsTotalPages}
                  className="rounded-md border border-border px-2.5 py-1.5 font-medium transition-colors hover:bg-foreground/[0.03] disabled:opacity-35"
                >
                  Proxima
                </button>
              </div>
            </div>
          </div>

        </section>
      </main>

      {deleteTarget ? (
        <ConfirmModal
          title="Excluir importacao"
          description={`Isso remove permanentemente a importacao #${deleteTarget.id} (${deleteTarget.clientName}), seus itens e eventos. Essa acao nao pode ser desfeita.`}
          confirmLabel="Excluir importacao"
          confirmingLabel="Excluindo..."
          tone="danger"
          onClose={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await deleteBancoUnicoImport(deleteTarget.id);
            setDeleteTarget(null);
            await loadJobs({ silent: true });
          }}
        />
      ) : null}
    </div>
  );
}
