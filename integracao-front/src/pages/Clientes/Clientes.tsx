import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UsersRound,
} from 'lucide-react';
import { ClientHasImportsError, deleteClient, listClients, type Client } from '../../services/clients.service';
import { SOURCE_TYPE_LABEL } from '../Aplications/bancoUnicoImports.ui';
import ClientFormModal from '../Aplications/ClientFormModal';
import ConfirmModal from '../Aplications/ConfirmModal';
import EditClientModal from './Components/EditClientModal';

const PAGE_SIZE = 10;

export default function Clientes() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [forceDeleteTarget, setForceDeleteTarget] = useState<{ client: Client; jobCount: number } | null>(null);
  const [flashMessage, setFlashMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  async function loadClients(options?: { silent?: boolean }) {
    if (!options?.silent) setLoading(true);
    try {
      const response = await listClients({ page, limit: PAGE_SIZE, search });
      setClients(response.data);
      setTotalPages(Math.max(1, response.meta.totalPages));
      setTotalItems(response.meta.totalItems);
    } catch {
      setFlashMessage({ tone: 'error', text: 'Não foi possível carregar os clientes.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadClients();
  }, [page, search]);

  useEffect(() => {
    if (!flashMessage) return;
    const timeoutId = window.setTimeout(() => setFlashMessage(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [flashMessage]);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  async function handleDeleteConfirm(client: Client, force = false) {
    try {
      await deleteClient(client.id, { force });
      setDeleteTarget(null);
      setForceDeleteTarget(null);
      setFlashMessage({ tone: 'success', text: `Cliente ${client.name} excluído.` });
      void loadClients({ silent: true });
    } catch (error) {
      if (error instanceof ClientHasImportsError) {
        setDeleteTarget(null);
        setForceDeleteTarget({ client, jobCount: error.jobCount });
        return;
      }
      throw error;
    }
  }

  return (
    <main className="custom-scrollbar h-full overflow-y-auto bg-[#f8fafc] px-5 py-8 text-slate-950 sm:px-8 lg:px-10 lg:py-10">
      <div className="mx-auto w-full max-w-[1440px]">
        <header className="flex flex-col gap-5 border-b border-[#dbe3ef] pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Operação</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-slate-950">Clientes</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Gerencie os bancos e ambientes dos seus clientes em um único lugar.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void loadClients()}
              disabled={loading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#cbd7e6] bg-background px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[#0f50df] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Plus className="size-4" />
              Novo cliente
            </button>
          </div>
        </header>

        {flashMessage ? (
          <div
            role="status"
            className={`mt-6 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium ${flashMessage.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}
          >
            {flashMessage.text}
          </div>
        ) : null}

        <section className="mt-7" aria-labelledby="client-list-title">
          <div className="flex flex-col gap-4 pb-5 lg:flex-row lg:items-center lg:justify-between">
            <label className="flex min-h-11 w-full max-w-xl items-center gap-3 rounded-lg border border-[#cbd7e6] bg-background px-3.5 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 lg:w-[460px]">
              <Search className="size-4 shrink-0 text-slate-400" />
              <span className="sr-only">Pesquisar clientes</span>
              <input
                type="search"
                value={search}
                onChange={(event) => handleSearch(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                placeholder="Pesquisar por nome, instância ou CNPJ"
              />
            </label>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><UsersRound className="size-4" /></span>
              <span><strong className="font-semibold text-slate-900">{totalItems}</strong> cliente{totalItems !== 1 ? 's' : ''} encontrado{totalItems !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#dbe3ef] bg-background">
            <div className="flex items-center justify-between border-b border-[#dbe3ef] px-5 py-4 sm:px-6">
              <div>
                <h2 id="client-list-title" className="text-base font-semibold tracking-[-0.015em] text-slate-950">Base de clientes</h2>
                <p className="mt-0.5 text-xs text-slate-500">Acesse detalhes ou atualize os dados de cada ambiente.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] border-collapse text-left">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                  <tr className="border-b border-[#dbe3ef]">
                    <th scope="col" className="px-5 py-3.5 sm:px-6">Cliente</th>
                    <th scope="col" className="px-5 py-3.5">Instância</th>
                    <th scope="col" className="px-5 py-3.5">Provedor</th>
                    <th scope="col" className="px-5 py-3.5">CNPJ</th>
                    <th scope="col" className="px-5 py-3.5 text-right sm:px-6">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dbe3ef]">
                  {loading ? (
                    <tr><td colSpan={5} className="px-6 py-20 text-center"><span className="inline-flex items-center gap-3 text-sm text-slate-500"><Loader2 className="size-5 animate-spin text-primary" />Carregando clientes...</span></td></tr>
                  ) : clients.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-20 text-center"><UsersRound className="mx-auto size-7 text-slate-400" /><h3 className="mt-3 text-sm font-semibold text-slate-900">Nenhum cliente encontrado</h3><p className="mt-1 text-sm text-slate-500">Tente uma busca diferente ou cadastre um novo cliente.</p></td></tr>
                  ) : clients.map((client) => (
                    <tr key={client.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-5 py-4 sm:px-6"><div className="max-w-[280px] truncate text-sm font-semibold text-slate-900">{client.name}</div>{client.businessUnit ? <div className="mt-0.5 max-w-[280px] truncate text-xs text-slate-500">{client.businessUnit}</div> : <div className="mt-0.5 text-xs text-slate-400">ID #{client.id}</div>}</td>
                      <td className="max-w-[230px] truncate px-5 py-4 text-sm text-slate-600">{client.instance || '—'}</td>
                      <td className="px-5 py-4"><span className="inline-flex max-w-[150px] truncate rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{SOURCE_TYPE_LABEL[client.provider] || client.provider}</span></td>
                      <td className="px-5 py-4 text-sm tabular-nums text-slate-600">{client.cnpj || '—'}</td>
                      <td className="px-5 py-4 sm:px-6"><div className="flex justify-end gap-2"><button type="button" onClick={() => navigate(`/main/clientes/${client.id}`)} className="flex size-9 items-center justify-center rounded-lg border border-[#dbe3ef] text-slate-600 transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" aria-label={`Ver detalhes de ${client.name}`} title="Ver detalhes"><Eye className="size-4" /></button><button type="button" onClick={() => setEditClient(client)} className="flex size-9 items-center justify-center rounded-lg border border-[#dbe3ef] text-slate-600 transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" aria-label={`Editar ${client.name}`} title="Editar"><Pencil className="size-4" /></button><button type="button" onClick={() => setDeleteTarget(client)} className="flex size-9 items-center justify-center rounded-lg border border-[#dbe3ef] text-rose-700 transition-colors hover:border-rose-300 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600" aria-label={`Excluir ${client.name}`} title="Excluir"><Trash2 className="size-4" /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="flex flex-col gap-4 border-t border-[#dbe3ef] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-sm text-slate-500">Página <strong className="font-semibold text-slate-900">{page}</strong> de <strong className="font-semibold text-slate-900">{totalPages}</strong></p>
              <div className="flex items-center gap-2">
                <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#dbe3ef] px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><ArrowLeft className="size-4" />Anterior</button>
                <span className="inline-flex min-h-10 items-center rounded-lg bg-slate-100 px-3 text-sm font-semibold tabular-nums text-slate-700">{page} / {totalPages}</span>
                <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#dbe3ef] px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Próximo<ArrowRight className="size-4" /></button>
              </div>
            </footer>
          </div>
        </section>
      </div>

      {showCreate ? <ClientFormModal onClose={() => setShowCreate(false)} onCreated={(created) => { setShowCreate(false); setFlashMessage({ tone: 'success', text: `Cliente ${created.name} criado com sucesso.` }); void loadClients({ silent: true }); }} /> : null}
      {editClient ? <EditClientModal client={editClient} onClose={() => setEditClient(null)} onUpdated={(updated) => { setEditClient(null); setFlashMessage({ tone: 'success', text: `Cliente ${updated.name} atualizado.` }); setClients((current) => current.map((client) => client.id === updated.id ? updated : client)); }} /> : null}
      {deleteTarget ? (
        <ConfirmModal
          title="Excluir cliente"
          description={`Isso remove permanentemente o cliente "${deleteTarget.name}". Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          confirmingLabel="Excluindo..."
          tone="danger"
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => handleDeleteConfirm(deleteTarget)}
        />
      ) : null}
      {forceDeleteTarget ? (
        <ConfirmModal
          title="Cliente possui importações"
          description={`O cliente "${forceDeleteTarget.client.name}" tem ${forceDeleteTarget.jobCount} importação${forceDeleteTarget.jobCount !== 1 ? 'ões' : ''} registrada${forceDeleteTarget.jobCount !== 1 ? 's' : ''}. Excluir o cliente apaga tudo em cadeia (importações, itens e logs). Deseja realmente excluir?`}
          confirmLabel="Excluir tudo"
          confirmingLabel="Excluindo..."
          tone="danger"
          onClose={() => setForceDeleteTarget(null)}
          onConfirm={() => handleDeleteConfirm(forceDeleteTarget.client, true)}
        />
      ) : null}
    </main>
  );
}
