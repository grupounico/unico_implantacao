import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronRight, Loader2, RefreshCw, Search, Trash2, Upload } from 'lucide-react';
import { deleteBancoUnicoImport, listBancoUnicoImports, retryBancoUnicoImport, type BancoUnicoImportJob } from '../../../services/bancoUnicoImports.service';
import { extractErrorMessage } from '../../../utils/error';
import { statusInfo } from '../../Aplications/bancoUnicoImports.ui';
import StatusBadge from '../../Aplications/StatusBadge';
import ConfirmModal from '../../Aplications/ConfirmModal';

type ImportJobListProps = { clientId: number; onSelectJob: (job: BancoUnicoImportJob) => void; onNewImport: () => void; refreshKey?: number };
const ACTIVE_JOB_STATUSES = new Set(['pending', 'claimed', 'processing', 'running', 'paused', 'cancelling']);

export default function ImportJobList({ clientId, onSelectJob, onNewImport, refreshKey }: ImportJobListProps) {
  const [jobs, setJobs] = useState<BancoUnicoImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<BancoUnicoImportJob | null>(null);
  const [retryingId, setRetryingId] = useState<number | null>(null);
  const [flashMessage, setFlashMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const loadJobs = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    try {
      const response = await listBancoUnicoImports({ page, limit: 8, search, clientId });
      setJobs(response.data);
      setTotalPages(response.meta.totalPages);
      setTotalItems(response.meta.totalItems);
    } catch (error) {
      if (!options?.silent) setFlashMessage({ tone: 'error', text: extractErrorMessage(error, 'Não foi possível carregar as importações.') });
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, [clientId, page, search]);

  useEffect(() => { void loadJobs(); }, [loadJobs, refreshKey]);
  useEffect(() => { const id = window.setInterval(() => void loadJobs({ silent: true }), 5000); return () => window.clearInterval(id); }, [loadJobs]);
  useEffect(() => { if (!flashMessage) return; const id = window.setTimeout(() => setFlashMessage(null), 5000); return () => window.clearTimeout(id); }, [flashMessage]);

  const hasSearch = search.trim().length > 0;

  async function retryJob(job: BancoUnicoImportJob) {
    setRetryingId(job.id);
    try {
      await retryBancoUnicoImport(job.id);
      setFlashMessage({ tone: 'success', text: `Importação #${job.id} reiniciada.` });
      await loadJobs({ silent: true });
    } catch (error) {
      setFlashMessage({ tone: 'error', text: extractErrorMessage(error, 'Não foi possível repetir a importação.') });
    } finally {
      setRetryingId(null);
    }
  }

  return (

    <div className='px-5 pb-2 flex flex-col gap-6'>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block min-w-0 flex-1"><span className="sr-only">Buscar importação</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/45" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/45 focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="Buscar por número ou status da importação" /></label>
        <span className="shrink-0 rounded-md bg-foreground/[0.05] px-2.5 py-1 text-xs font-semibold tabular-nums text-foreground/70">{totalItems} registro{totalItems !== 1 ? 's' : ''}</span>
        <button type="button" onClick={() => void loadJobs()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold text-foreground/80 transition-colors hover:bg-foreground/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><RefreshCw className="size-4" />Atualizar</button>
      </div>
    <section className="min-w-0 rounded-xl border border-border bg-background" aria-labelledby="imports-history-title">
      {flashMessage ? <FlashNotice message={flashMessage} onRetry={() => void loadJobs()} /> : null}

      

      <div className="overflow-x-auto" aria-live="polite">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="border-b border-border text-xs font-semibold text-foreground/55">
              <th className="px-5 py-2.5 text-left">Importação</th>
              <th className="px-4 py-2.5 text-left">Status</th>
              <th className="w-[220px] px-4 py-2.5 text-left">Progresso</th>
              <th className="px-4 py-2.5 text-right">Já no banco</th>
              <th className="px-4 py-2.5 text-right">Publicados</th>
              <th className="px-4 py-2.5 text-right">Ignorados</th>
              <th className="px-4 py-2.5 text-right">Erros</th>
              <th className="w-9 px-4 py-2.5" aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8}><LoadingState /></td></tr>
            ) : jobs.length === 0 ? (
              <tr><td colSpan={8}><EmptyState search={hasSearch} onNewImport={onNewImport} /></td></tr>
            ) : (
              jobs.map((job) => <JobRow key={job.id} job={job} onSelectJob={onSelectJob} onDelete={() => setDeleteTarget(job)} onRetry={() => void retryJob(job)} retrying={retryingId === job.id} />)
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3"><span className="text-sm text-foreground/60">Página <strong className="font-semibold text-foreground">{page}</strong> de {totalPages}</span><div className="flex gap-2"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="min-h-9 rounded-lg border border-border px-3 text-sm font-semibold text-foreground/80 transition-colors hover:bg-foreground/[0.04] disabled:cursor-not-allowed disabled:opacity-50">Anterior</button><button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages} className="min-h-9 rounded-lg border border-border px-3 text-sm font-semibold text-foreground/80 transition-colors hover:bg-foreground/[0.04] disabled:cursor-not-allowed disabled:opacity-50">Próxima</button></div></footer> : null}

      {deleteTarget ? <ConfirmModal title="Excluir importação" description={`Isso remove permanentemente a importação #${deleteTarget.id}, seus itens e eventos. Essa ação não pode ser desfeita.`} confirmLabel="Excluir" confirmingLabel="Excluindo…" tone="danger" onClose={() => setDeleteTarget(null)} onConfirm={async () => { await deleteBancoUnicoImport(deleteTarget.id); setDeleteTarget(null); setFlashMessage({ tone: 'success', text: `Importação #${deleteTarget.id} excluída.` }); await loadJobs({ silent: true }); }} /> : null}
    </section>
    </div>
  );
}

function JobRow({ job, onSelectJob, onDelete, onRetry, retrying }: { job: BancoUnicoImportJob; onSelectJob: (job: BancoUnicoImportJob) => void; onDelete: () => void; onRetry: () => void; retrying: boolean }) {
  const info = statusInfo(job.status);
  const deletable = !ACTIVE_JOB_STATUSES.has(job.status);
  const progress = Math.max(0, Math.min(100, job.progressPercent));
  return (
    <tr className="group cursor-pointer border-b border-border last:border-0 hover:bg-foreground/[0.02]" onClick={() => onSelectJob(job)}>
      <td className="min-w-0 max-w-[280px] px-5 py-3">
        <p className="text-sm font-semibold text-foreground">Importação #{job.id}</p>
        <p className="mt-0.5 truncate text-xs leading-5 text-foreground/55">{job.currentMessage || 'Aguardando atualização da execução.'}</p>
      </td>
      <td className="px-4 py-3"><StatusBadge label={info.label} tone={info.tone} /></td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 min-w-[100px] flex-1 overflow-hidden rounded-full bg-foreground/10"><div className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${progress}%` }} /></div>
          <span className="w-9 shrink-0 text-right text-xs font-medium tabular-nums text-foreground/60">{progress}%</span>
        </div>
      </td>
      <Metric value={job.totalExisting} />
      <Metric value={job.totalPublished} tone="success" />
      <Metric value={job.totalSkipped} tone="warning" />
      <Metric value={job.totalErrors} tone={job.totalErrors > 0 ? 'danger' : 'default'} />
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          {job.status === 'failed' ? (
            <button
              type="button"
              title={`Tentar novamente a importação #${job.id}`}
              aria-label={`Tentar novamente a importação #${job.id}`}
              disabled={retrying}
              onClick={(event) => { event.stopPropagation(); onRetry(); }}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/10 disabled:opacity-40"
            >
              {retrying ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            </button>
          ) : null}
          {deletable ? (
            <button
              type="button"
              title={`Excluir importação #${job.id}`}
              aria-label={`Excluir importação #${job.id}`}
              onClick={(event) => { event.stopPropagation(); onDelete(); }}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-foreground/35 opacity-0 transition-colors group-hover:opacity-100 hover:bg-foreground/[0.06] hover:text-rose-700 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
            >
              <Trash2 className="size-4" />
            </button>
          ) : null}
          <ChevronRight className="size-4 shrink-0 text-foreground/30 transition-colors group-hover:text-foreground/60" />
        </div>
      </td>
    </tr>
  );
}

function Metric({ value, tone = 'default' }: { value: number; tone?: 'default' | 'success' | 'warning' | 'danger' }) { const color = tone === 'success' ? 'text-emerald-700' : tone === 'warning' ? 'text-amber-700' : tone === 'danger' ? 'text-rose-700' : 'text-foreground/80'; return <td className={`px-4 py-3 text-right text-sm font-medium tabular-nums ${color}`}>{value.toLocaleString('pt-BR')}</td>; }
function LoadingState() { return <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-sm text-foreground/60"><Loader2 className="size-5 animate-spin text-primary" />Carregando importações…</div>; }
function EmptyState({ search, onNewImport }: { search: boolean; onNewImport: () => void }) { return <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center"><div className="flex size-10 items-center justify-center rounded-full bg-foreground/[0.06]"><Search className="size-5 text-foreground/45" /></div><h3 className="mt-4 text-sm font-semibold text-foreground">{search ? 'Nenhuma importação encontrada' : 'Ainda não há importações'}</h3><p className="mt-1 max-w-[36ch] text-sm leading-6 text-foreground/60">{search ? 'Tente buscar pelo número da importação ou limpe a pesquisa.' : 'Inicie a primeira execução deste cliente.'}</p>{!search ? <button type="button" onClick={onNewImport} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[#0f50df]"><Upload size={15} /> Nova importação</button> : null}</div>; }
function FlashNotice({ message, onRetry }: { message: { tone: 'success' | 'error'; text: string }; onRetry: () => void }) {
  if (message.tone === 'success') return <div role="status" className="mx-5 mt-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-medium text-emerald-800"><CheckCircle2 className="mt-0.5 size-4 shrink-0" /><span>{message.text}</span></div>;
  return <div role="alert" className="mx-5 mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-3 text-sm font-medium text-rose-800"><AlertCircle className="mt-0.5 size-4 shrink-0" /><span className="min-w-0 flex-1">{message.text}</span><button type="button" onClick={onRetry} className="shrink-0 underline underline-offset-2">Tentar novamente</button></div>;
}
