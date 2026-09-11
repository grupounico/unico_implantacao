import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  CircleCheckBig,
  Clock3,
  Copy,
  Database,
  FileText,
  FileSpreadsheet,
  Loader2,
  Package,
  Pencil,
  RefreshCw,
  Search,
  Upload,
} from 'lucide-react';
import {
  getClient,
  getClientMultiProviderApiKey,
  regenerateClientMultiProviderApiKey,
  setupClientMultiProvider,
  type Client,
} from '../../services/clients.service';
import {
  listBancoUnicoImportItemFacets,
  listBancoUnicoImports,
  listBancoUnicoImportItems,
  type BancoUnicoImportJob,
  type BancoUnicoImportItem,
  type ItemFacetField,
} from '../../services/bancoUnicoImports.service';
import {
  itemStatusLabel,
  itemStatusTone,
  SOURCE_TYPE_LABEL,
} from '../Aplications/bancoUnicoImports.ui';
import StatusBadge from '../Aplications/StatusBadge';
import ConfirmModal from '../Aplications/ConfirmModal';
import EditClientModal from './Components/EditClientModal';
import ImportForm from './Components/ImportForm';
import ImportJobList from './Components/ImportJobList';
import ImportJobView from './Components/ImportJobView';
import { extractErrorMessage } from '../../utils/error';

type Tab = 'overview' | 'imports' | 'products';

const TABS: Array<{ key: Tab; label: string; icon: typeof Package }> = [
  { key: 'overview', label: 'Visão Geral', icon: Package },
  { key: 'imports', label: 'Importações', icon: Upload },
  { key: 'products', label: 'Produtos', icon: Database },
];

const PRODUCT_PAGE_SIZE = 10;

const PROVIDER_AVATAR: Partial<
  Record<Client['provider'], { src: string; alt: string }>
> = {
  api: { src: '/trier.jpg', alt: 'Trier' },
  alpha7: { src: '/Alpha.png', alt: 'Alpha 7' },
  vetor: { src: '/vetor.png', alt: 'Vetor' },
  automatiza: { src: '/automatiza.jpg', alt: 'Automatiza' },
};

export default function ClienteDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [client, setClient] = useState<Client | null>(null);
  const [clientLoading, setClientLoading] = useState(true);
  const [apiKeyCopyLabel, setApiKeyCopyLabel] = useState('Copiar API key');
  const [copyingApiKey, setCopyingApiKey] = useState(false);
  const [setupLabel, setSetupLabel] = useState('Realizar setup');
  const [multiProviderError, setMultiProviderError] = useState<string | null>(null);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [regenerateSuccess, setRegenerateSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [importRefreshKey, setImportRefreshKey] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);

  const [latestJob, setLatestJob] = useState<BancoUnicoImportJob | null>(null);
  const [products, setProducts] = useState<BancoUnicoImportItem[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productFilters, setProductFilters] = useState({
    status: [] as string[],
    ean: [] as string[],
    name: [] as string[],
    manufacturer: [] as string[],
    activeIngredient: [] as string[],
    hasError: [] as string[],
  });
  const [openFilterColumn, setOpenFilterColumn] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [productTotalItems, setProductTotalItems] = useState(0);

  const clientId = id ? Number(id) : null;

  // Load client
  useEffect(() => {
    if (!clientId) return;
    setClientLoading(true);
    getClient(clientId)
      .then(setClient)
      .catch(() => setClient(null))
      .finally(() => setClientLoading(false));
  }, [clientId]);

  // Clear import error
  useEffect(() => {
    if (!importError) return;
    const t = window.setTimeout(() => setImportError(null), 5000);
    return () => window.clearTimeout(t);
  }, [importError]);

  // Load latest job for overview metrics
  useEffect(() => {
    if (!clientId) return;
    listBancoUnicoImports({ clientId, limit: 1 })
      .then((res) => setLatestJob(res.data[0] || null))
      .catch(() => {});
  }, [clientId, importRefreshKey]);

  // Load products from latest job
  async function loadProducts(options?: { silent?: boolean }) {
    if (!latestJob) return;
    if (!options?.silent) setProductsLoading(true);
    try {
      const res = await listBancoUnicoImportItems(latestJob.id, {
        page: productPage,
        limit: PRODUCT_PAGE_SIZE,
        search: productSearch || undefined,
        status: productFilters.status.length
          ? productFilters.status
          : undefined,
        ean: productFilters.ean.length ? productFilters.ean : undefined,
        name: productFilters.name.length ? productFilters.name : undefined,
        manufacturer: productFilters.manufacturer.length
          ? productFilters.manufacturer
          : undefined,
        activeIngredient: productFilters.activeIngredient.length
          ? productFilters.activeIngredient
          : undefined,
        hasError: productFilters.hasError.length
          ? (productFilters.hasError as ('yes' | 'no')[])
          : undefined,
      });
      setProducts(res.data);
      setProductTotalPages(res.meta.totalPages);
      setProductTotalItems(res.meta.totalItems);
    } catch {
      /* silent */
    } finally {
      setProductsLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === 'products' && latestJob) {
      void loadProducts();
    }
  }, [activeTab, latestJob, productPage, productFilters, productSearch]);

  function toggleProductFilterValue<K extends keyof typeof productFilters>(
    key: K,
    value: string,
  ) {
    setProductFilters((current) => {
      const list = current[key];
      const next = list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value];
      return { ...current, [key]: next };
    });
    setProductPage(1);
  }

  function clearProductFilters() {
    setProductFilters({
      status: [],
      ean: [],
      name: [],
      manufacturer: [],
      activeIngredient: [],
      hasError: [],
    });
    setProductSearch('');
    setProductPage(1);
  }

  async function copyMultiProviderApiKey() {
    if (!client || copyingApiKey) return;

    setCopyingApiKey(true);
    setMultiProviderError(null);
    try {
      await navigator.clipboard.writeText(await getClientMultiProviderApiKey(client.id));
      setApiKeyCopyLabel('API key copiada');
    } catch (error) {
      setApiKeyCopyLabel('Copiar API key');
      setMultiProviderError(
        extractErrorMessage(error, 'Nao foi possivel copiar a API key. Tente novamente.'),
      );
    } finally {
      setCopyingApiKey(false);
    }

    window.setTimeout(() => setApiKeyCopyLabel('Copiar API key'), 3000);
  }

  async function regenerateApiKey() {
    if (!client) return;

    const updated = await regenerateClientMultiProviderApiKey(client.id);
    setClient(updated);
    setShowRegenerateConfirm(false);
    setRegenerateSuccess(true);
    window.setTimeout(() => setRegenerateSuccess(false), 4000);

    try {
      await navigator.clipboard.writeText(await getClientMultiProviderApiKey(updated.id));
    } catch {
      // Clipboard copy is a convenience on top of the (already successful)
      // regeneration - a failure here shouldn't read as the action failing.
    }
  }

  async function setupMultiProvider() {
    if (!client) return;

    setSetupLabel('Realizando setup...');
    setMultiProviderError(null);
    try {
      setClient(await setupClientMultiProvider(client.id));
      setSetupLabel('Realizar setup');
    } catch (error) {
      setSetupLabel('Realizar setup');
      setMultiProviderError(
        extractErrorMessage(error, 'Nao foi possivel concluir o setup. Tente novamente.'),
      );
    }
  }

  function toggleFilterColumn(key: string) {
    setOpenFilterColumn((current) => (current === key ? null : key));
  }

  const estoqueTotal = latestJob?.totalCatalogValid ?? 0;
  const noBanco = latestJob
    ? latestJob.totalExisting + latestJob.totalPublished
    : 0;
  const porcentagem =
    estoqueTotal > 0 ? Math.round((noBanco / estoqueTotal) * 100) : 0;
  const providerAvatar = client ? PROVIDER_AVATAR[client.provider] : null;
  const hasActiveProductFilters =
    Boolean(productSearch) ||
    Object.values(productFilters).some((list) => list.length > 0);

  if (clientLoading) {
    return (
      <main className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-foreground/40" />
      </main>
    );
  }

  if (!client) {
    return (
      <main className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-sm text-foreground/45">Cliente nao encontrado.</p>
        <button
          onClick={() => navigate('/main/clientes')}
          className="text-sm text-primary hover:underline"
        >
          Voltar para lista
        </button>
      </main>
    );
  }

  return (
    <main className="flex h-full w-full flex-col overflow-hidden bg-[#f8fafc] px-5 py-7 text-slate-950 sm:px-8 lg:px-10 lg:py-9">
      <button
        type="button"
        onClick={() => navigate('/main/clientes')}
        className="mb-6 inline-flex shrink-0 items-center gap-1.5 self-start text-sm font-semibold text-slate-500 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para Clientes
      </button>

      <header className="mb-6 shrink-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-lg font-semibold text-primary">
              {providerAvatar ? (
                <img
                  src={providerAvatar.src}
                  alt={providerAvatar.alt}
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(client.name)
              )}
            </div>
            <div className="min-w-0">
              <h1 className="mt-1 truncate text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
                {client.name}
              </h1>
              {client.businessUnit ? (
                <p className="mt-1 text-sm text-slate-500">
                  {client.businessUnit}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500">
                <span className="rounded-md bg-primary/10 px-2.5 py-1 font-semibold text-primary">
                  {SOURCE_TYPE_LABEL[client.provider] || client.provider}
                </span>
                <span className="flex items-center gap-1.5">
                  <Database size={12} className="text-slate-400" />{' '}
                  {client.clientInstance || 'Não informada'}
                </span>
                {client.cnpj ? (
                  <span className="flex items-center gap-1.5">
                    <FileText size={12} className="text-slate-400" />{' '}
                    {client.cnpj}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('imports');
                setActiveJobId(null);
                setShowImportForm(true);
              }}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[#0f50df] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Upload size={15} /> Nova importação
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#cbd7e6] bg-background px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Pencil size={15} /> Editar
            </button>
          </div>
        </div>
      </header>

      <nav
        className="mb-6 flex shrink-0  border-b border-[#dbe3ef]"
        aria-label="Seções do cliente"
      >
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key === 'imports') setActiveJobId(null);
              }}
              className={`-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Tab body — scrolls internally, the route shell above clips overflow */}
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-minimal pr-1">
        {activeTab === 'overview' ? (
          <div className="space-y-6 pb-4">
            <section className="grid overflow-hidden rounded-xl border border-[#dbe3ef] bg-background sm:grid-cols-3 sm:divide-x sm:divide-[#dbe3ef]">
              <Stat
                label="Produtos no estoque"
                value={estoqueTotal}
                detail="Itens encontrados no ambiente"
              />
              <Stat
                label="No Banco Único"
                value={noBanco}
                detail="Registros já disponíveis"
              />
              <Stat
                label="Cobertura"
                value={porcentagem}
                suffix="%"
                detail={`${noBanco.toLocaleString('pt-BR')} de ${estoqueTotal.toLocaleString('pt-BR')} itens`}
                progress={porcentagem}
              />
            </section>

            {client.provider !== 'file' ? (
              <section className="rounded-xl border border-[#dbe3ef] bg-background px-5 py-4 sm:px-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold tracking-[-0.015em] text-slate-950">
                      Consulta de EANs
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Chave de API para consultar EANs em múltiplos provedores.
                    </p>
                  </div>
                  <StatusBadge
                    label={
                      client.hasMultiProviderCredential && client.multiProviderTenantId != null
                        ? `Vinculado #${client.multiProviderTenantId}`
                        : 'Pendente'
                    }
                    tone={
                      client.hasMultiProviderCredential && client.multiProviderTenantId != null
                        ? 'success'
                        : 'warning'
                    }
                  />
                </div>
                <div className="mt-3">
                  {client.hasMultiProviderCredential && client.multiProviderTenantId != null ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={copyingApiKey}
                        onClick={() => void copyMultiProviderApiKey()}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#cbd7e6] px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
                      >
                        {copyingApiKey ? <Loader2 className="animate-spin" size={13} /> : <Copy size={13} />}
                        {apiKeyCopyLabel}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRegenerateConfirm(true)}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#cbd7e6] px-3 text-xs font-semibold text-slate-700 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                        title="Invalida a key atual e gera uma nova"
                      >
                        <RefreshCw size={13} />
                        Gerar nova key
                      </button>
                      {regenerateSuccess ? (
                        <span className="text-xs font-medium text-emerald-600">Nova key gerada e copiada.</span>
                      ) : null}
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={setupLabel === 'Realizando setup...'}
                      onClick={() => void setupMultiProvider()}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-wait disabled:opacity-70"
                    >
                      {setupLabel === 'Realizando setup...' ? <Loader2 className="animate-spin" size={13} /> : null}
                      {setupLabel}
                    </button>
                  )}
                  {multiProviderError ? (
                    <p
                      role="alert"
                      className="mt-2.5 rounded-lg border border-rose-200 bg-rose-50/80 px-3 py-2 text-xs font-medium text-rose-800"
                    >
                      {multiProviderError}
                    </p>
                  ) : null}
                </div>
              </section>
            ) : null}

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(410px,0.95fr)]">
              <div className="overflow-hidden rounded-xl border border-[#dbe3ef] bg-background">
                <div className="flex items-center justify-between gap-4 border-b border-[#dbe3ef] px-5 py-4 sm:px-6">
                  <div>
                    <h2 className="text-base font-semibold tracking-[-0.015em] text-slate-950">
                      Última importação
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Acompanhe a atividade mais recente deste cliente.
                    </p>
                  </div>
                  {latestJob ? (
                    <StatusBadge
                      label={
                        latestJob.status === 'completed'
                          ? 'Concluída'
                          : latestJob.status
                      }
                      tone={
                        latestJob.status === 'completed'
                          ? 'success'
                          : latestJob.status === 'failed'
                            ? 'danger'
                            : 'warning'
                      }
                    />
                  ) : null}
                </div>
                {latestJob ? (
                  <div className="p-5 sm:p-6">
                    <div className="grid gap-5 sm:grid-cols-3">
                      <OverviewDatum
                        label="Importação"
                        value={`#${latestJob.id}`}
                        icon={FileSpreadsheet}
                      />
                      <OverviewDatum
                        label="Criada em"
                        value={new Date(latestJob.createdAt).toLocaleString(
                          'pt-BR',
                          { dateStyle: 'short', timeStyle: 'short' },
                        )}
                        icon={Clock3}
                      />
                      <OverviewDatum
                        label="Solicitada por"
                        value={latestJob.requestedBy || 'Sistema'}
                        icon={CircleCheckBig}
                      />
                    </div>
                    <div className="mt-6 border-t border-[#dbe3ef] pt-5">
                      <p className="text-sm font-semibold text-slate-900">
                        {latestJob.currentMessage ||
                          'Importação pronta para acompanhamento.'}
                      </p>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-primary transition-[width] duration-300"
                          style={{
                            width: `${Math.max(0, Math.min(100, latestJob.progressPercent))}%`,
                          }}
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                        <span>
                          <strong className="font-semibold text-slate-900">
                            {latestJob.totalExisting.toLocaleString('pt-BR')}
                          </strong>{' '}
                          já existiam
                        </span>
                        <span>
                          <strong className="font-semibold text-slate-900">
                            {latestJob.totalSkipped.toLocaleString('pt-BR')}
                          </strong>{' '}
                          pulados
                        </span>
                        <span>
                          <strong className="font-semibold text-slate-900">
                            {latestJob.totalPublished.toLocaleString('pt-BR')}
                          </strong>{' '}
                          publicados
                        </span>
                        <span>
                          <strong className="font-semibold text-slate-900">
                            {latestJob.totalErrors.toLocaleString('pt-BR')}
                          </strong>{' '}
                          erros
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('imports');
                        setActiveJobId(latestJob.id);
                      }}
                      className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#cbd7e6] px-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      Ver detalhes da importação{' '}
                      <ArrowRight className="size-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                    <Upload className="size-7 text-primary" />
                    <h3 className="mt-3 text-sm font-semibold text-slate-900">
                      Nenhuma importação ainda
                    </h3>
                    <p className="mt-1 max-w-[34ch] text-sm leading-6 text-slate-500">
                      Faça a primeira importação para acompanhar produtos e
                      cobertura deste cliente.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('imports');
                        setShowImportForm(true);
                      }}
                      className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[#0f50df]"
                    >
                      Nova importação <ArrowRight className="size-4" />
                    </button>
                  </div>
                )}
              </div>

              <aside className="overflow-hidden rounded-xl border border-[#dbe3ef] bg-background">
                <div className="border-b border-[#dbe3ef] px-5 py-4 sm:px-6">
                  <h2 className="text-base font-semibold tracking-[-0.015em] text-slate-950">
                    Informações do ambiente
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Dados de conexão e identificação.
                  </p>
                </div>
                <dl className="divide-y divide-[#dbe3ef] px-5 sm:px-6">
                  <InfoRow
                    label="Provedor"
                    value={
                      SOURCE_TYPE_LABEL[client.provider] || client.provider
                    }
                  />
                  <InfoRow label="Instância" value={client.instance} />
                  <InfoRow
                    label="CNPJ"
                    value={client.cnpj || 'Não informado'}
                  />
                  <InfoRow
                    label="Credencial"
                    value={client.hasCredential ? 'Configurada' : 'Pendente'}
                    tone={client.hasCredential ? 'success' : 'warning'}
                  />
                  {client.provider === 'alpha7' ? (
                    <>
                      <InfoRow
                        label="Base Alpha 7"
                        value={client.alpha7Database || 'Não informada'}
                      />
                      <InfoRow
                        label="Schema"
                        value={client.alpha7Schema || 'Não informado'}
                      />
                    </>
                  ) : null}
                </dl>
              </aside>
            </section>
          </div>
        ) : null}

        {activeTab === 'imports' ? (
          <div className="space-y-5">
            {importError ? (
              <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50/80 px-4 py-2.5 text-sm font-medium text-rose-800">
                {importError}
              </div>
            ) : null}

            {activeJobId ? (
              <ImportJobView
                jobId={activeJobId}
                onBack={() => setActiveJobId(null)}
              />
            ) : (
              <ImportJobList
                clientId={client.id}
                onSelectJob={(job) => setActiveJobId(job.id)}
                onNewImport={() => setShowImportForm(true)}
                refreshKey={importRefreshKey}
              />
            )}

            {showImportForm ? (
              <ImportForm
                client={client}
                onClose={() => setShowImportForm(false)}
                onCreated={() => {
                  setImportRefreshKey((k) => k + 1);
                  setImportError(null);
                  setShowImportForm(false);
                }}
                onError={setImportError}
              />
            ) : null}
          </div>
        ) : null}

        {activeTab === 'products' ? (
          <section>
            {!latestJob ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-background py-16 text-center">
                <Database className="h-8 w-8 text-foreground/20" />
                <p className="mt-3 text-sm text-foreground/45">
                  Nenhuma importacao encontrada para este cliente.
                </p>
                <p className="mt-1 text-xs text-foreground/35">
                  Execute uma importacao na aba Importacoes para ver os produtos
                  aqui.
                </p>
                <button
                  onClick={() => setActiveTab('imports')}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <Upload size={15} /> Nova importacao
                </button>
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-center gap-2 text-xs text-foreground/45">
                  <span>Importacao:</span>
                  <span className="font-medium text-foreground/65">
                    #{latestJob.id}
                  </span>
                  <span>&middot;</span>
                  <span>{latestJob.currentMessage || 'Sem detalhes'}</span>
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <label className="relative block min-w-0 flex-1 max-w-sm">
                    <span className="sr-only">Buscar produto</span>
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/35" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setProductPage(1);
                      }}
                      placeholder="EAN, nome, fabricante..."
                      className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/15"
                    />
                  </label>
                  <span className="shrink-0 text-xs text-foreground/45 tabular-nums">
                    {productTotalItems} item{productTotalItems !== 1 ? 's' : ''}
                  </span>
                  {hasActiveProductFilters ? (
                    <button
                      type="button"
                      onClick={clearProductFilters}
                      className="shrink-0 text-xs font-medium text-primary hover:underline"
                    >
                      Limpar filtros
                    </button>
                  ) : null}
                </div>

                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-foreground/[0.025]">
                      <tr className="border-b border-border text-xs font-semibold text-foreground/55">
                        <ColumnFilterHeader
                          label="Status"
                          widthClass="w-[12%]"
                          count={productFilters.status.length}
                          isOpen={openFilterColumn === 'status'}
                          onToggle={() => toggleFilterColumn('status')}
                          onClose={() => setOpenFilterColumn(null)}
                        >
                          <FacetCheckboxList
                            options={STATUS_FILTER_OPTIONS}
                            selected={productFilters.status}
                            onToggle={(value) =>
                              toggleProductFilterValue('status', value)
                            }
                          />
                        </ColumnFilterHeader>
                        <ColumnFilterHeader
                          label="EAN"
                          widthClass="w-[13%]"
                          count={productFilters.ean.length}
                          isOpen={openFilterColumn === 'ean'}
                          onToggle={() => toggleFilterColumn('ean')}
                          onClose={() => setOpenFilterColumn(null)}
                        >
                          <RemoteFacetFilter
                            jobId={latestJob.id}
                            field="ean"
                            active={openFilterColumn === 'ean'}
                            selected={productFilters.ean}
                            onToggle={(value) =>
                              toggleProductFilterValue('ean', value)
                            }
                          />
                        </ColumnFilterHeader>
                        <ColumnFilterHeader
                          label="Produto"
                          widthClass="w-[30%]"
                          count={productFilters.name.length}
                          isOpen={openFilterColumn === 'name'}
                          onToggle={() => toggleFilterColumn('name')}
                          onClose={() => setOpenFilterColumn(null)}
                        >
                          <RemoteFacetFilter
                            jobId={latestJob.id}
                            field="name"
                            active={openFilterColumn === 'name'}
                            selected={productFilters.name}
                            onToggle={(value) =>
                              toggleProductFilterValue('name', value)
                            }
                          />
                        </ColumnFilterHeader>
                        <ColumnFilterHeader
                          label="Fabricante"
                          widthClass="w-[18%]"
                          count={productFilters.manufacturer.length}
                          isOpen={openFilterColumn === 'manufacturer'}
                          onToggle={() => toggleFilterColumn('manufacturer')}
                          onClose={() => setOpenFilterColumn(null)}
                        >
                          <RemoteFacetFilter
                            jobId={latestJob.id}
                            field="manufacturer"
                            active={openFilterColumn === 'manufacturer'}
                            selected={productFilters.manufacturer}
                            onToggle={(value) =>
                              toggleProductFilterValue('manufacturer', value)
                            }
                          />
                        </ColumnFilterHeader>
                        <ColumnFilterHeader
                          label="Principio Ativo"
                          widthClass="w-[14%]"
                          count={productFilters.activeIngredient.length}
                          isOpen={openFilterColumn === 'activeIngredient'}
                          onToggle={() =>
                            toggleFilterColumn('activeIngredient')
                          }
                          onClose={() => setOpenFilterColumn(null)}
                        >
                          <RemoteFacetFilter
                            jobId={latestJob.id}
                            field="activeIngredient"
                            active={openFilterColumn === 'activeIngredient'}
                            selected={productFilters.activeIngredient}
                            onToggle={(value) =>
                              toggleProductFilterValue(
                                'activeIngredient',
                                value,
                              )
                            }
                          />
                        </ColumnFilterHeader>
                        <ColumnFilterHeader
                          label="Erro"
                          widthClass="w-[13%]"
                          count={productFilters.hasError.length}
                          isOpen={openFilterColumn === 'hasError'}
                          onToggle={() => toggleFilterColumn('hasError')}
                          onClose={() => setOpenFilterColumn(null)}
                        >
                          <FacetCheckboxList
                            options={ERROR_FILTER_OPTIONS}
                            selected={productFilters.hasError}
                            onToggle={(value) =>
                              toggleProductFilterValue('hasError', value)
                            }
                          />
                        </ColumnFilterHeader>
                      </tr>
                    </thead>
                    <tbody>
                      {productsLoading ? (
                        Array.from({ length: 8 }, (_, i) => (
                          <ProductSkeletonRow key={i} index={i} />
                        ))
                      ) : products.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-12 text-center text-sm text-foreground/40"
                          >
                            Nenhum item encontrado.
                          </td>
                        </tr>
                      ) : (
                        products.map((p) => (
                          <tr
                            key={p.id}
                            className="border-b border-border last:border-0 hover:bg-foreground/[0.02] transition-colors"
                          >
                            <td className="px-4 py-3">
                              <StatusBadge
                                label={itemStatusLabel(p.status)}
                                tone={itemStatusTone(p.status)}
                              />
                            </td>
                            <td className="px-4 py-3 text-sm tabular-nums text-foreground/70 font-mono">
                              {p.ean || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className="font-medium text-foreground">
                                {p.nameNormalized || p.nameOriginal || '-'}
                              </span>
                              {p.nameNormalized &&
                              p.nameOriginal &&
                              p.nameNormalized !== p.nameOriginal ? (
                                <span className="ml-1.5 text-xs text-foreground/35">
                                  ({p.nameOriginal})
                                </span>
                              ) : null}
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground/65">
                              {p.manufacturer || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground/55">
                              {p.activeIngredient || '-'}
                            </td>
                            <td className="px-4 py-3 text-xs text-rose-500">
                              {p.errorMessage || ''}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {productTotalPages > 1 ? (
                    <footer className="flex items-center justify-between border-t border-border px-4 py-2.5">
                      <span className="text-xs text-foreground/50">
                        Pagina {productPage} de {productTotalPages}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={productPage <= 1}
                          onClick={() =>
                            setProductPage((c) => Math.max(1, c - 1))
                          }
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-foreground/60 border border-border rounded-lg disabled:cursor-not-allowed disabled:opacity-40 hover:bg-foreground/5 transition-colors"
                        >
                          <ArrowLeft size={14} /> Anterior
                        </button>
                        <button
                          type="button"
                          disabled={productPage >= productTotalPages}
                          onClick={() =>
                            setProductPage((c) =>
                              Math.min(productTotalPages, c + 1),
                            )
                          }
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-foreground/60 border border-border rounded-lg disabled:cursor-not-allowed disabled:opacity-40 hover:bg-foreground/5 transition-colors"
                        >
                          Proximo <ArrowRight size={14} />
                        </button>
                      </div>
                    </footer>
                  ) : null}
                </div>
              </>
            )}
          </section>
        ) : null}
      </div>

      {showEditModal ? (
        <EditClientModal
          client={client}
          onClose={() => setShowEditModal(false)}
          onUpdated={(updated) => {
            setClient(updated);
            setShowEditModal(false);
          }}
        />
      ) : null}

      {showRegenerateConfirm ? (
        <ConfirmModal
          title="Gerar nova API key"
          description={`Isso invalida imediatamente a API key atual do cliente "${client.name}" e gera outra no lugar. Qualquer integração usando a key antiga para de funcionar.`}
          confirmLabel="Gerar nova key"
          confirmingLabel="Gerando..."
          tone="danger"
          onClose={() => setShowRegenerateConfirm(false)}
          onConfirm={regenerateApiKey}
        />
      ) : null}
    </main>
  );
}

const STATUS_FILTER_OPTIONS = [
  { value: 'loaded', label: 'Carregados' },
  { value: 'classified', label: 'Clarificados' },
  { value: 'prepared', label: 'Preparados' },
  { value: 'published', label: 'Publicados' },
  { value: 'already_exists', label: 'Existiam' },
  { value: 'invalid_ean', label: 'EAN invalido' },
  { value: 'classification_error', label: 'Erro classificacao' },
  { value: 'publish_error', label: 'Erro publicacao' },
];

const ERROR_FILTER_OPTIONS = [
  { value: 'yes', label: 'Com erro' },
  { value: 'no', label: 'Sem erro' },
];

function ColumnFilterHeader({
  label,
  widthClass,
  count,
  isOpen,
  onToggle,
  onClose,
  children,
}: {
  label: string;
  widthClass: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const active = count > 0;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }

    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setPosition({ top: rect.bottom + 6, left: rect.left });

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      )
        return;
      onClose();
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', onClose, true);
    window.addEventListener('resize', onClose);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', onClose, true);
      window.removeEventListener('resize', onClose);
    };
  }, [isOpen, onClose]);

  return (
    <th className={`px-4 py-2.5 text-left align-middle ${widthClass}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        className={`flex items-center gap-1.5 transition-colors ${active ? 'text-primary' : 'hover:text-foreground'}`}
      >
        {label}
        {active ? (
          <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-primary">
            {count}
          </span>
        ) : (
          <ChevronDown className="size-3 shrink-0 text-foreground/35" />
        )}
      </button>

      {isOpen && position
        ? createPortal(
            <div
              ref={popoverRef}
              style={{
                position: 'fixed',
                top: position.top,
                left: position.left,
              }}
              className="z-50 w-64 rounded-lg border border-border bg-background p-2 shadow-[0_8px_24px_rgba(0,0,0,0.14)]"
            >
              {children}
            </div>,
            document.body,
          )
        : null}
    </th>
  );
}

function FacetCheckboxList({
  options,
  selected,
  onToggle,
}: {
  options: Array<{ value: string; label: string }>;
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="max-h-64 space-y-0.5 overflow-y-auto scrollbar-minimal">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs font-normal text-foreground transition-colors hover:bg-foreground/[0.04]"
        >
          <input
            type="checkbox"
            className="size-3.5 shrink-0 accent-primary"
            checked={selected.includes(option.value)}
            onChange={() => onToggle(option.value)}
          />
          <span className="truncate">{option.label}</span>
        </label>
      ))}
    </div>
  );
}

const FACET_DEFAULT_LIMIT = 5;
const FACET_SEARCH_LIMIT = 20;
const FACET_SEARCH_DEBOUNCE_MS = 250;

function RemoteFacetFilter({
  jobId,
  field,
  active,
  selected,
  onToggle,
}: {
  jobId: number;
  field: ItemFacetField;
  active: boolean;
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setLoading(true);
    const timeout = window.setTimeout(() => {
      listBancoUnicoImportItemFacets(jobId, field, {
        search: search || undefined,
        limit: search ? FACET_SEARCH_LIMIT : FACET_DEFAULT_LIMIT,
      })
        .then((values) => {
          if (!cancelled) setOptions(values);
        })
        .catch(() => {
          if (!cancelled) setOptions([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, FACET_SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [active, jobId, field, search]);

  useEffect(() => {
    if (!active) setSearch('');
  }, [active]);

  // keep already-selected values visible/checked even if a later search narrows them out
  const displayOptions = Array.from(new Set([...selected, ...options]));

  return (
    <div>
      <input
        type="text"
        autoFocus
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Pesquisar..."
        className="w-full rounded-md border border-border bg-foreground/[0.02] px-2 py-1.5 text-xs font-normal text-foreground outline-none transition-colors placeholder:text-foreground/40 focus:border-primary focus:bg-background focus:ring-1 focus:ring-primary"
      />
      <div className="mt-2 max-h-64 space-y-0.5 overflow-y-auto scrollbar-minimal">
        {loading ? (
          <p className="px-2 py-2 text-xs text-foreground/40">Carregando…</p>
        ) : displayOptions.length === 0 ? (
          <p className="px-2 py-2 text-xs text-foreground/40">
            Nenhum valor encontrado.
          </p>
        ) : (
          displayOptions.map((value) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs font-normal text-foreground transition-colors hover:bg-foreground/[0.04]"
            >
              <input
                type="checkbox"
                className="size-3.5 shrink-0 accent-primary"
                checked={selected.includes(value)}
                onChange={() => onToggle(value)}
              />
              <span className="truncate">{value}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

const SKELETON_NAME_WIDTHS = ['70%', '55%', '82%', '62%'];
const SKELETON_SUB_WIDTHS = ['40%', '30%', '48%'];
const SKELETON_MANUFACTURER_WIDTHS = ['5rem', '6.5rem', '4rem'];
const SKELETON_INGREDIENT_WIDTHS = ['3.5rem', '5rem', '0'];

function ProductSkeletonRow({ index }: { index: number }) {
  const bar = 'animate-pulse rounded bg-foreground/10';
  const delay = { animationDelay: `${(index % 6) * 60}ms` };

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/10"
            style={delay}
          />
          <span className={`h-3 w-14 ${bar}`} style={delay} />
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`block h-3 w-20 ${bar}`} style={delay} />
      </td>
      <td className="px-4 py-3">
        <span
          className={`block h-3 ${bar}`}
          style={{
            width: SKELETON_NAME_WIDTHS[index % SKELETON_NAME_WIDTHS.length],
            ...delay,
          }}
        />
        <span
          className={`mt-1.5 block h-2.5 ${bar}`}
          style={{
            width: SKELETON_SUB_WIDTHS[index % SKELETON_SUB_WIDTHS.length],
            ...delay,
          }}
        />
      </td>
      <td className="px-4 py-3">
        <span
          className={`block h-3 ${bar}`}
          style={{
            width:
              SKELETON_MANUFACTURER_WIDTHS[
                index % SKELETON_MANUFACTURER_WIDTHS.length
              ],
            ...delay,
          }}
        />
      </td>
      <td className="px-4 py-3">
        {SKELETON_INGREDIENT_WIDTHS[
          index % SKELETON_INGREDIENT_WIDTHS.length
        ] !== '0' ? (
          <span
            className={`block h-3 ${bar}`}
            style={{
              width:
                SKELETON_INGREDIENT_WIDTHS[
                  index % SKELETON_INGREDIENT_WIDTHS.length
                ],
              ...delay,
            }}
          />
        ) : null}
      </td>
      <td className="px-4 py-3" />
    </tr>
  );
}

function getInitials(value: string) {
  return (
    value
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  );
}

function Stat({
  label,
  value,
  suffix = '',
  detail,
  progress,
}: {
  label: string;
  value: number;
  suffix?: string;
  detail: string;
  progress?: number;
}) {
  return (
    <div className="min-w-0 px-5 py-5 sm:px-6">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <p className="mt-1.5 text-3xl font-semibold tracking-[-0.03em] tabular-nums text-slate-950">
        {value.toLocaleString('pt-BR')}
        {suffix}
      </p>
      {progress !== undefined ? (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      ) : null}
      <p className="mt-3 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function OverviewDatum({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof FileSpreadsheet;
}) {
  return (
    <div className="min-w-0">
      <Icon className="size-4 text-primary" />
      <dt className="mt-3 text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 truncate text-sm font-semibold text-slate-900">
        {value}
      </dd>
    </div>
  );
}

function InfoRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'success' | 'warning';
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd
        className={`max-w-[60%] truncate text-right text-sm font-semibold ${tone === 'success' ? 'text-emerald-700' : tone === 'warning' ? 'text-amber-700' : 'text-slate-900'}`}
      >
        {value}
      </dd>
    </div>
  );
}
