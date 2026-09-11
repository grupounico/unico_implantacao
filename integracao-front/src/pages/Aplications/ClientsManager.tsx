import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, Search } from 'lucide-react';
import { useRequireAuth } from '../../hooks/useAuthRedirect';
import { listClients, type Client } from '../../services/clients.service';
import { SOURCE_TYPE_LABEL } from './bancoUnicoImports.ui';
import ClientFormModal from './ClientFormModal';

export default function ClientsManager() {
  const navigate = useNavigate();
  useRequireAuth();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [flashMessage, setFlashMessage] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);

  async function loadClients() {
    setLoading(true);
    try {
      const response = await listClients({ search, limit: 100 });
      setClients(response.data);
    } catch (error) {
      console.error(error);
      setFlashMessage({ tone: 'error', text: 'Erro ao carregar clientes.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadClients();
    }, 200);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    if (!flashMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => setFlashMessage(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [flashMessage]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-foreground/[0.015] font-sans text-foreground">
      <header className="sticky top-0 z-10 flex w-full shrink-0 flex-wrap items-center justify-between gap-4 border-b border-border bg-background px-6 py-3.5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            onClick={() => navigate('/main/clientes')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-foreground/50 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div className="h-6 w-px shrink-0 bg-border" />
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-foreground">Clientes</h1>
            <p className="hidden truncate text-xs text-foreground/50 sm:block">
              Cadastro de clientes e configuracao de origem por integracao
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" /> Novo cliente
        </button>
      </header>

      <main className="custom-scrollbar mx-auto flex min-h-0 w-full max-w-[1100px] flex-1 flex-col gap-5 overflow-y-auto p-5 lg:p-8">
        {flashMessage ? (
          <div
            className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${
              flashMessage.tone === 'success'
                ? 'border-emerald-200 bg-emerald-50/80 text-emerald-800'
                : 'border-rose-200 bg-rose-50/80 text-rose-800'
            }`}
          >
            {flashMessage.text}
          </div>
        ) : null}

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/35" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full max-w-sm rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="Buscar por nome, unidade ou CNPJ..."
          />
        </div>

        <div className="rounded-xl border border-border bg-background">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-foreground/40">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : clients.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-foreground/45">
              Nenhum cliente cadastrado.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {clients.map((client) => (
                <li key={client.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-3.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">{client.name}</div>
                    <div className="mt-0.5 truncate text-xs text-foreground/45">
                      {client.businessUnit ? `${client.businessUnit} Â· ` : ''}
                      {client.instance}
                    </div>
                  </div>
                  <span className="rounded-md bg-foreground/[0.05] px-2 py-1 text-xs font-medium text-foreground/65">
                    {SOURCE_TYPE_LABEL[client.provider]}
                  </span>
                  <span className="text-xs text-foreground/40 tabular-nums">
                    {client.cnpj || '-'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {showCreate ? (
        <ClientFormModal
          onClose={() => setShowCreate(false)}
          onCreated={(createdClient) => {
            setShowCreate(false);
            setSearch('');
            setClients((current) => {
              const next = [createdClient, ...current.filter((client) => client.id !== createdClient.id)];
              return next.sort((a, b) => a.name.localeCompare(b.name));
            });
            setFlashMessage({
              tone: 'success',
              text: `Cliente ${createdClient.name} criado com sucesso.`,
            });
            void loadClients();
          }}
        />
      ) : null}
    </div>
  );
}
