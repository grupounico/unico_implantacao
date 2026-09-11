import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Database, Eye, FileText, Filter, KeyRound, Lock, PauseCircle, Plus, RefreshCw, Search, ServerCog, SquareTerminal } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import { ModalFrame } from '../../components/ModalFrame';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useRequireAuth } from '../../hooks/useAuthRedirect';
import {
  createAiServiceInstance,
  fetchAiServiceInstanceLogs,
  fetchAiServiceInstanceStatus,
  listAiServiceInstances,
  restartAiServiceInstance,
  stopAiServiceInstance,
  type AiServiceBulkUpdateResult,
  type AiServiceInstance,
  type AiServiceInstanceStatus,
  type AiServiceInstanceType,
  updateAiServiceInstance,
  updateAllAiServiceInstances,
} from '../../services/aiServiceInstances.service';
import { extractErrorMessage } from '../../utils/error';

type InstanceActionType = 'update' | 'restart' | 'stop';
type StatusFilter = 'all' | 'online' | 'stopped';
type TypeFilter = 'all' | AiServiceInstanceType;
type FormData =
  | { tipo: 'alpha'; nome: string; openai_api_key: string; db_host: string; db_port: string; db_name: string; db_user: string; db_password: string; unidade_negocio_id: string }
  | { tipo: 'trier'; nome: string; token: string; openai_api_key: string };

const INITIAL_ALPHA_FORM: FormData = { tipo: 'alpha', nome: '', openai_api_key: '', db_host: '', db_port: '5432', db_name: '', db_user: '', db_password: '', unidade_negocio_id: '' };
const INITIAL_TRIER_FORM: FormData = { tipo: 'trier', nome: '', token: '', openai_api_key: '' };

function normalizeNumericValue(value: string) {
  const normalized = value.trim();
  return /^\d+$/.test(normalized) ? Number(normalized) : normalized;
}

function typeInfo(tipo: AiServiceInstanceType) {
  return tipo === 'trier'
    ? { label: 'API Trier', chip: 'border-sky-200 bg-sky-50 text-sky-700' }
    : { label: 'API Alpha', chip: 'border-violet-200 bg-violet-50 text-violet-700' };
}

function statusInfo(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'online') return { label: 'Online', cls: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' };
  if (normalized === 'stopped' || normalized === 'offline') return { label: 'Parada', cls: 'border-amber-200 bg-amber-50 text-amber-700', dot: 'bg-amber-500' };
  if (normalized === 'errored') return { label: 'Erro', cls: 'border-red-200 bg-red-50 text-red-700', dot: 'bg-red-500' };
  return { label: status || 'Desconhecido', cls: 'border-gray-200 bg-gray-50 text-gray-600', dot: 'bg-gray-400' };
}

function integrityInfo(integridade: string) {
  if (integridade === 'ok') return { label: 'Integra', cls: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
  if (integridade === 'sem_pm2') return { label: 'Sem PM2', cls: 'border-amber-200 bg-amber-50 text-amber-700' };
  if (integridade === 'sem_diretorio') return { label: 'Sem diretório', cls: 'border-red-200 bg-red-50 text-red-700' };
  if (integridade === 'inconsistente') return { label: 'Inconsistente', cls: 'border-orange-200 bg-orange-50 text-orange-700' };
  return { label: integridade || 'Desconhecida', cls: 'border-gray-200 bg-gray-50 text-gray-600' };
}

export default function AiServicesManager() {
  const navigate = useNavigate();
  useRequireAuth();
  const [formData, setFormData] = useState<FormData>(INITIAL_ALPHA_FORM);
  const [instances, setInstances] = useState<AiServiceInstance[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [flashMessage, setFlashMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [refreshingList, setRefreshingList] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [confirmingCreate, setConfirmingCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<AiServiceInstanceStatus | null>(null);
  const [logsModal, setLogsModal] = useState<{ instance: AiServiceInstance; lines: string[]; loading: boolean } | null>(null);
  const [pendingAction, setPendingAction] = useState<{ type: InstanceActionType; instance: AiServiceInstance } | null>(null);
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);
  const [confirmingUpdateAll, setConfirmingUpdateAll] = useState(false);
  const [updatingAll, setUpdatingAll] = useState(false);
  const [bulkUpdateResult, setBulkUpdateResult] = useState<AiServiceBulkUpdateResult | null>(null);

  useBodyScrollLock(isCreateModalOpen || confirmingCreate || Boolean(selectedStatus) || Boolean(logsModal) || Boolean(pendingAction) || confirmingUpdateAll || Boolean(bulkUpdateResult));

  useEffect(() => {
    if (!flashMessage) return;
    const timeoutId = window.setTimeout(() => setFlashMessage(null), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [flashMessage]);

  async function loadInstances(options?: { silent?: boolean }) {
    if (options?.silent) setRefreshingList(true);
    else setLoadingList(true);
    try {
      setInstances(await listAiServiceInstances());
    } catch (error) {
      setFlashMessage({ tone: 'error', text: extractErrorMessage(error, 'Erro ao carregar instâncias.') });
    } finally {
      setLoadingList(false);
      setRefreshingList(false);
    }
  }

  useEffect(() => {
    void loadInstances();
  }, []);

  const filteredInstances = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return instances.filter((inst) => {
      const matchesSearch = !search || inst.nome.toLowerCase().includes(search) || String(inst.porta || '').toLowerCase().includes(search) || inst.tipo.toLowerCase().includes(search);
      const normalizedStatus = inst.status.trim().toLowerCase();
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'online' && normalizedStatus === 'online') || (statusFilter === 'stopped' && normalizedStatus !== 'online');
      const matchesType = typeFilter === 'all' || inst.tipo === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [instances, searchTerm, statusFilter, typeFilter]);

  const grouped = useMemo(() => ({
    alpha: filteredInstances.filter((item) => item.tipo === 'alpha'),
    trier: filteredInstances.filter((item) => item.tipo === 'trier'),
  }), [filteredInstances]);

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }) as FormData);
  }

  async function executeCreateInstance() {
    if (creating) return;
    setCreating(true);
    try {
      const payload = formData.tipo === 'alpha'
        ? { tipo: 'alpha' as const, nome: formData.nome, openai_api_key: formData.openai_api_key, db_host: formData.db_host, db_port: normalizeNumericValue(formData.db_port), db_name: formData.db_name, db_user: formData.db_user, db_password: formData.db_password, unidade_negocio_id: normalizeNumericValue(formData.unidade_negocio_id) }
        : {
            tipo: 'trier' as const,
            nome: formData.nome,
            env: {
              TRIER_TOKEN: formData.token,
              ...(formData.openai_api_key.trim()
                ? { OPENAI_API_KEY: formData.openai_api_key.trim() }
                : {}),
            },
          };
      await createAiServiceInstance(payload);
      setFormData(payload.tipo === 'alpha' ? INITIAL_ALPHA_FORM : INITIAL_TRIER_FORM);
      setConfirmingCreate(false);
      setIsCreateModalOpen(false);
      setFlashMessage({ tone: 'success', text: `${typeInfo(payload.tipo).label} "${payload.nome}" criada com sucesso.` });
      await loadInstances({ silent: true });
    } catch (error) {
      setConfirmingCreate(false);
      setFlashMessage({ tone: 'error', text: extractErrorMessage(error, 'Erro ao criar instância.') });
    } finally {
      setCreating(false);
    }
  }

  async function handleOpenStatus(instance: AiServiceInstance) {
    try {
      setSelectedStatus(await fetchAiServiceInstanceStatus(instance.nome, instance.tipo));
    } catch (error) {
      setFlashMessage({ tone: 'error', text: extractErrorMessage(error, 'Erro ao consultar status.') });
    }
  }

  async function handleOpenLogs(instance: AiServiceInstance) {
    setLogsModal({ instance, lines: [], loading: true });
    try {
      const data = await fetchAiServiceInstanceLogs(instance.nome, instance.tipo, 50);
      setLogsModal({ instance, lines: data.linhas ?? [], loading: false });
    } catch {
      setLogsModal({ instance, lines: ['Erro ao carregar os logs.'], loading: false });
    }
  }

  async function handleConfirmAction() {
    if (!pendingAction) return;
    const { instance, type } = pendingAction;
    const key = `${instance.tipo}:${instance.nome}`;
    setActionLoadingKey(key);
    try {
      if (type === 'update') {
        const result = await updateAiServiceInstance(instance.nome, instance.tipo);
        setFlashMessage({ tone: 'success', text: result.atualizado ? `${typeInfo(instance.tipo).label} "${instance.nome}" atualizada${result.dependencias_atualizadas ? ' com dependências reinstaladas' : ''}.` : `${typeInfo(instance.tipo).label} "${instance.nome}" já estava atualizada.` });
      } else if (type === 'restart') {
        await restartAiServiceInstance(instance.nome, instance.tipo);
        setFlashMessage({ tone: 'success', text: `${typeInfo(instance.tipo).label} "${instance.nome}" reiniciada.` });
      } else {
        await stopAiServiceInstance(instance.nome, instance.tipo);
        setFlashMessage({ tone: 'success', text: `${typeInfo(instance.tipo).label} "${instance.nome}" parada.` });
      }
      setPendingAction(null);
      await loadInstances({ silent: true });
    } catch (error) {
      setFlashMessage({ tone: 'error', text: extractErrorMessage(error, 'Erro ao executar ação.') });
    } finally {
      setActionLoadingKey(null);
    }
  }

  async function handleConfirmUpdateAll() {
    if (updatingAll) return;
    setUpdatingAll(true);
    try {
      const result = await updateAllAiServiceInstances(typeFilter);
      setBulkUpdateResult(result);
      setFlashMessage({ tone: result.falhas > 0 ? 'error' : 'success', text: result.falhas > 0 ? `Atualização concluída com ${result.falhas} falha(s).` : result.atualizadas > 0 ? `${result.atualizadas} instância(s) atualizada(s) com sucesso.` : 'Nenhuma instância tinha commit novo.' });
      setConfirmingUpdateAll(false);
      await loadInstances({ silent: true });
    } catch (error) {
      setFlashMessage({ tone: 'error', text: extractErrorMessage(error, 'Erro ao atualizar instâncias.') });
      setConfirmingUpdateAll(false);
    } finally {
      setUpdatingAll(false);
    }
  }

  const labelClass = 'mb-2 block text-[10px] font-bold uppercase tracking-wider text-foreground/50';
  const inputClass = 'w-full rounded-xl border border-border bg-background p-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary focus:border-transparent';

  function renderCard(instance: AiServiceInstance) {
    const status = statusInfo(instance.status);
    const type = typeInfo(instance.tipo);
    const integrity = integrityInfo(instance.integridade);
    const key = `${instance.tipo}:${instance.nome}`;
    const busy = actionLoadingKey === key;
    return (
      <article key={key} className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border bg-background p-5 shadow-sm transition-all sm:flex-row sm:items-center sm:justify-between hover:border-gray-300 hover:shadow-md">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${status.dot}`} />
            <h3 className="truncate text-lg font-bold text-foreground">{instance.nome}</h3>
            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${type.chip}`}>{type.label}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${status.cls}`}>{status.label}</span>
            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${integrity.cls}`}>{integrity.label}</span>
            <span className="text-sm font-medium text-foreground/60">Porta {instance.porta || '-'}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button onClick={() => void handleOpenStatus(instance)} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground/80 hover:bg-gray-50 sm:text-sm"><Eye className="h-4 w-4 text-gray-400" /> Status</button>
          <button onClick={() => void handleOpenLogs(instance)} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground/80 hover:bg-gray-50 sm:text-sm"><FileText className="h-4 w-4 text-gray-400" /> Logs</button>
          <button onClick={() => setPendingAction({ type: 'update', instance })} disabled={busy || updatingAll} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 sm:text-sm"><RefreshCw className={`h-4 w-4 ${busy && pendingAction?.type === 'update' ? 'animate-spin' : ''}`} /> Atualizar</button>
          <button onClick={() => setPendingAction({ type: 'restart', instance })} disabled={busy || updatingAll} className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50 sm:text-sm"><RefreshCw className="h-4 w-4" /> Restart</button>
          <button onClick={() => setPendingAction({ type: 'stop', instance })} disabled={busy || updatingAll} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 sm:text-sm"><PauseCircle className="h-4 w-4" /> Parar</button>
        </div>
      </article>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-gray-50/50 font-sans text-foreground">
      <header className="sticky top-0 z-10 flex w-full shrink-0 flex-wrap justify-between gap-4 border-b border-border bg-background px-6 py-5 shadow-sm sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <button onClick={() => navigate('/main/aplications')} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-foreground/60 transition-colors hover:bg-gray-50 hover:text-foreground"><ArrowLeft className="h-5 w-5" /></button>
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 truncate text-xl font-bold text-foreground"><ServerCog className="h-6 w-6 shrink-0 text-primary" /><span className="truncate">Serviços IA</span></h1>
            <p className="mt-0.5 hidden truncate text-sm text-foreground/60 sm:block">Gestão operacional das APIs Alpha e Trier.</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <button onClick={() => setConfirmingUpdateAll(true)} disabled={updatingAll || loadingList || filteredInstances.length === 0} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-bold text-foreground shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${updatingAll ? 'animate-spin' : ''}`} /> Atualizar {typeFilter === 'all' ? 'Todas' : typeInfo(typeFilter).label}</button>
          <button onClick={() => setIsCreateModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90"><Plus className="h-4 w-4" /> Nova Instância</button>
        </div>
      </header>

      <main className="custom-scrollbar mx-auto flex min-h-0 w-full max-w-[1480px] flex-1 flex-col gap-6 overflow-y-auto p-6 lg:flex-row lg:items-start lg:gap-8 lg:p-8 min-w-0">
        <aside className="flex w-full shrink-0 flex-col gap-6 lg:sticky lg:top-0 lg:w-[320px] lg:self-start">
          <div className="space-y-6 rounded-2xl border border-border bg-background p-5 shadow-sm">
            <div>
              <label className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground/50"><Search className="h-4 w-4" /> Pesquisar</label>
              <input type="text" placeholder="Nome, porta ou tipo..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-full rounded-xl border border-border bg-gray-50/50 p-3 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary focus:bg-background" />
            </div>
            <hr className="border-border" />
            <div>
              <label className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground/50"><Filter className="h-4 w-4" /> Tipo de API</label>
              <div className="flex flex-col gap-2">{[{ id: 'all', label: 'Todas as APIs' }, { id: 'alpha', label: 'API Alpha' }, { id: 'trier', label: 'API Trier' }].map((filter) => <button key={filter.id} onClick={() => setTypeFilter(filter.id as TypeFilter)} className={`rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition-all ${typeFilter === filter.id ? 'border-primary/30 bg-primary/5 text-primary shadow-sm' : 'border-transparent text-foreground/70 hover:bg-gray-50'}`}>{filter.label}</button>)}</div>
            </div>
            <hr className="border-border" />
            <div>
              <label className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground/50"><Filter className="h-4 w-4" /> Status Operacional</label>
              <div className="flex flex-col gap-2">{[{ id: 'all', label: 'Todas as instâncias' }, { id: 'online', label: 'Apenas Online' }, { id: 'stopped', label: 'Apenas Paradas' }].map((filter) => <button key={filter.id} onClick={() => setStatusFilter(filter.id as StatusFilter)} className={`rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition-all ${statusFilter === filter.id ? 'border-primary/30 bg-primary/5 text-primary shadow-sm' : 'border-transparent text-foreground/70 hover:bg-gray-50'}`}>{filter.label}</button>)}</div>
            </div>
            <hr className="border-border" />
            <button onClick={() => void loadInstances({ silent: true })} disabled={refreshingList} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${refreshingList ? 'animate-spin' : ''}`} /> {refreshingList ? 'Atualizando...' : 'Atualizar Lista'}</button>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-6">
          {flashMessage ? <div className={`rounded-xl border px-4 py-3 text-sm font-medium shadow-sm ${flashMessage.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>{flashMessage.text}</div> : null}
          {loadingList ? <div className="flex h-64 items-center justify-center rounded-2xl border border-border border-dashed bg-background text-foreground/50"><RefreshCw className="h-6 w-6 animate-spin text-gray-400" /></div> : filteredInstances.length === 0 ? <div className="flex h-64 items-center justify-center rounded-2xl border border-border border-dashed bg-background text-foreground/50">Nenhuma instância encontrada</div> : <>
            {(typeFilter === 'all' || typeFilter === 'alpha') && grouped.alpha.length > 0 ? <div className="space-y-3"><h2 className="text-lg font-bold text-foreground">API Alpha</h2><div className="flex flex-col gap-3">{grouped.alpha.map(renderCard)}</div></div> : null}
            {(typeFilter === 'all' || typeFilter === 'trier') && grouped.trier.length > 0 ? <div className="space-y-3"><h2 className="text-lg font-bold text-foreground">API Trier</h2><div className="flex flex-col gap-3">{grouped.trier.map(renderCard)}</div></div> : null}
          </>}
        </section>
      </main>

      {isCreateModalOpen ? <ModalFrame onClose={() => setIsCreateModalOpen(false)} maxWidthClassName="max-w-2xl" bodyClassName="p-0" header={<div className="flex items-center justify-between border-b border-border bg-background px-6 py-5"><h2 className="flex items-center gap-2 text-xl font-bold text-foreground"><ServerCog className="h-6 w-6 text-primary" /> Nova Instância</h2><button onClick={() => setIsCreateModalOpen(false)} className="p-2 text-foreground/50 hover:text-foreground">X</button></div>}>
        <form onSubmit={(event) => { event.preventDefault(); setConfirmingCreate(true); }} className="flex max-h-[78vh] flex-col bg-gray-50/50">
          <div className="custom-scrollbar flex-1 space-y-8 overflow-y-auto p-6">
            <section>
              <label className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary"><ServerCog className="h-4 w-4" /> Tipo de Serviço</label>
              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => setFormData(INITIAL_ALPHA_FORM)} className={`rounded-2xl border p-4 text-left transition-all ${formData.tipo === 'alpha' ? 'border-violet-300 bg-violet-50 shadow-sm' : 'border-border bg-background'}`}><div className="font-bold text-foreground">API Alpha</div></button>
                <button type="button" onClick={() => setFormData(INITIAL_TRIER_FORM)} className={`rounded-2xl border p-4 text-left transition-all ${formData.tipo === 'trier' ? 'border-sky-300 bg-sky-50 shadow-sm' : 'border-border bg-background'}`}><div className="font-bold text-foreground">API Trier</div></button>
              </div>
            </section>
            <section>
              <label className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary"><ServerCog className="h-4 w-4" /> Informações Básicas</label>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><label className={labelClass}>Nome da Instância</label><input name="nome" required value={formData.nome} onChange={handleInputChange} className={inputClass} placeholder={formData.tipo === 'alpha' ? 'Ex: alpha7-loja-centro' : 'Ex: trier-farmacia-centro'} /></div>
                {formData.tipo === 'alpha' ? <div className="sm:col-span-2"><label className={labelClass}>Unidade de Negócio (ID)</label><input name="unidade_negocio_id" required value={formData.unidade_negocio_id} onChange={handleInputChange} className={inputClass} placeholder="Ex: 65984" /></div> : null}
              </div>
            </section>
            {formData.tipo === 'alpha' ? <section><label className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary"><Database className="h-4 w-4" /> Banco de Dados</label><div className="grid gap-4 sm:grid-cols-2"><div><label className={labelClass}>DB Host</label><input name="db_host" required value={formData.db_host} onChange={handleInputChange} className={inputClass} /></div><div><label className={labelClass}>DB Port</label><input name="db_port" required value={formData.db_port} onChange={handleInputChange} className={inputClass} /></div><div><label className={labelClass}>DB Name</label><input name="db_name" required value={formData.db_name} onChange={handleInputChange} className={inputClass} /></div><div><label className={labelClass}>DB User</label><input name="db_user" required value={formData.db_user} onChange={handleInputChange} className={inputClass} /></div><div className="sm:col-span-2"><label className={labelClass}>DB Password</label><input name="db_password" type="password" required value={formData.db_password} onChange={handleInputChange} className={inputClass} /></div></div></section> : <section><label className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary"><KeyRound className="h-4 w-4" /> Token de Integração</label><div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><label className={labelClass}>TRIER_TOKEN</label><input name="token" required value={formData.token} onChange={handleInputChange} className={inputClass} placeholder="Cole o token enviado pela Trier" /></div></div></section>}
            <section><label className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary"><Lock className="h-4 w-4" /> Segurança</label><div><label className={labelClass}>OpenAI API Key{formData.tipo === 'trier' ? ' (opcional)' : ''}</label><input name="openai_api_key" type="password" required={formData.tipo === 'alpha'} value={formData.openai_api_key} onChange={handleInputChange} className={inputClass} placeholder="sk-proj-..." /></div></section>
          </div>
          <div className="flex shrink-0 justify-end gap-3 border-t border-border bg-background p-6"><button type="button" onClick={() => setIsCreateModalOpen(false)} className="rounded-xl px-6 py-3 text-sm font-semibold text-foreground hover:bg-gray-100">Cancelar</button><button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-bold text-primary-foreground shadow-sm hover:opacity-90"><Plus className="h-4 w-4" /> Configurar {typeInfo(formData.tipo).label}</button></div>
        </form>
      </ModalFrame> : null}

      {confirmingCreate ? <ConfirmDialog title={`Criar ${typeInfo(formData.tipo).label}`} description={`Deseja provisionar a instância "${formData.nome}"?`} confirmText="Provisionar" tone="primary" loading={creating} onClose={() => { if (!creating) setConfirmingCreate(false); }} onConfirm={() => void executeCreateInstance()} /> : null}
      {selectedStatus ? <ModalFrame onClose={() => setSelectedStatus(null)} maxWidthClassName="max-w-3xl" bodyClassName="p-0" header={<div className="flex items-center justify-between border-b border-border bg-background px-6 py-4"><h2 className="truncate pr-4 text-lg font-bold text-foreground">Status: {selectedStatus.tipo ? `${typeInfo(selectedStatus.tipo).label} / ` : ''}{selectedStatus.nome}</h2><button onClick={() => setSelectedStatus(null)} className="text-foreground/50 hover:text-foreground">Fechar</button></div>}><div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-6"><div className="rounded-xl border border-border bg-background p-4 shadow-sm"><span className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground/50">Status</span><span className="block font-bold text-foreground">{statusInfo(selectedStatus.status).label}</span></div><div className="rounded-xl border border-border bg-background p-4 shadow-sm"><span className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground/50">Integridade</span><span className="block font-bold text-foreground">{integrityInfo(selectedStatus.integridade).label}</span></div><div className="rounded-xl border border-border bg-background p-4 shadow-sm"><span className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground/50">Porta</span><span className="block font-bold text-foreground">{selectedStatus.porta || '-'}</span></div><div className="rounded-xl border border-border bg-background p-4 shadow-sm"><span className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground/50">PM2 ID</span><span className="block font-bold text-foreground">{selectedStatus.pm2_id ?? '-'}</span></div></div></ModalFrame> : null}
      {logsModal ? <ModalFrame onClose={() => setLogsModal(null)} maxWidthClassName="max-w-4xl" bodyClassName="p-0" header={<div className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-6 py-4"><h2 className="flex items-center gap-2 truncate pr-4 text-lg font-bold text-white"><SquareTerminal className="h-5 w-5 shrink-0" /><span className="truncate">Logs: {typeInfo(logsModal.instance.tipo).label} / {logsModal.instance.nome}</span></h2><div className="flex gap-2"><button onClick={() => void handleOpenLogs(logsModal.instance)} className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">Atualizar</button><button onClick={() => setLogsModal(null)} className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">Fechar</button></div></div>}><div className="bg-gray-950 p-6">{logsModal.loading ? <div className="flex h-40 items-center justify-center text-gray-400"><RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Carregando logs...</div> : <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-gray-800 bg-black/40 p-4 font-mono text-sm leading-relaxed text-emerald-400">{logsModal.lines.map((line, index) => <div key={index} className="whitespace-pre-wrap break-words">{line}</div>)}</div>}</div></ModalFrame> : null}
      {pendingAction ? <ConfirmDialog title={pendingAction.type === 'update' ? 'Atualizar instância?' : pendingAction.type === 'restart' ? 'Reiniciar instância?' : 'Parar instância?'} description={pendingAction.type === 'update' ? `Deseja atualizar ${typeInfo(pendingAction.instance.tipo).label} "${pendingAction.instance.nome}"?` : `Deseja realmente ${pendingAction.type === 'restart' ? 'reiniciar' : 'parar'} ${typeInfo(pendingAction.instance.tipo).label} "${pendingAction.instance.nome}"?`} confirmText={pendingAction.type === 'update' ? 'Atualizar' : pendingAction.type === 'restart' ? 'Reiniciar' : 'Parar'} tone={pendingAction.type === 'stop' ? 'danger' : 'primary'} loading={actionLoadingKey === `${pendingAction.instance.tipo}:${pendingAction.instance.nome}`} onClose={() => { if (actionLoadingKey !== `${pendingAction.instance.tipo}:${pendingAction.instance.nome}`) setPendingAction(null); }} onConfirm={() => void handleConfirmAction()} /> : null}
      {confirmingUpdateAll ? <ConfirmDialog title="Atualizar instâncias?" description="A fila processará as instâncias uma por vez, com pull, reinstalação de dependências quando necessário e restart apenas se houver commit novo." confirmText="Atualizar" tone="primary" loading={updatingAll} onClose={() => { if (!updatingAll) setConfirmingUpdateAll(false); }} onConfirm={() => void handleConfirmUpdateAll()} /> : null}
      {bulkUpdateResult ? <ModalFrame onClose={() => setBulkUpdateResult(null)} maxWidthClassName="max-w-4xl" bodyClassName="p-0" header={<div className="flex items-center justify-between border-b border-border bg-background px-6 py-4"><div><h2 className="text-lg font-bold text-foreground">Resultado da atualização em lote</h2><p className="mt-1 text-sm text-foreground/60">{bulkUpdateResult.atualizadas} atualizada(s), {bulkUpdateResult.falhas} falha(s), total de {bulkUpdateResult.total}.</p></div><button onClick={() => setBulkUpdateResult(null)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground/70 hover:bg-gray-50">Fechar</button></div>}><div className="max-h-[70vh] space-y-3 overflow-y-auto bg-gray-50/50 p-6">{bulkUpdateResult.resultados.map((item) => <article key={`${item.tipo}:${item.nome}`} className={`rounded-2xl border p-4 shadow-sm ${item.sucesso ? item.atualizado ? 'border-emerald-200 bg-emerald-50/60' : 'border-border bg-background' : 'border-red-200 bg-red-50/60'}`}><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-base font-bold text-foreground">{item.nome}</h3><span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${typeInfo(item.tipo).chip}`}>{typeInfo(item.tipo).label}</span></div><p className={`mt-1 text-sm ${item.sucesso ? 'text-foreground/70' : 'text-red-700'}`}>{item.sucesso ? item.mensagem || 'Atualização concluída.' : item.erro || 'Falha ao atualizar a instância.'}</p></div></article>)}</div></ModalFrame> : null}
    </div>
  );
}
