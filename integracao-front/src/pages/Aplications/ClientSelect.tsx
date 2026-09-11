import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Plus, Search } from 'lucide-react';
import { listClients, type Client } from '../../services/clients.service';
import { SOURCE_TYPE_LABEL } from './bancoUnicoImports.ui';
import ClientFormModal from './ClientFormModal';

export default function ClientSelect({
  value,
  onChange,
}: {
  value: Client | null;
  onChange: (client: Client) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timeoutId = window.setTimeout(() => {
      void listClients({ search, limit: 30 })
        .then((response) => {
          if (!cancelled) {
            setClients(response.data);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [open, search]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-lg border border-border bg-foreground/[0.02] px-3 py-2.5 text-left text-sm outline-none transition-colors hover:border-foreground/20 focus:border-primary focus:bg-background focus:ring-1 focus:ring-primary"
      >
        {value ? (
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium text-foreground">{value.name}</span>
            <span className="shrink-0 text-xs text-foreground/45">
              {SOURCE_TYPE_LABEL[value.provider]}
            </span>
          </span>
        ) : (
          <span className="text-foreground/40">Selecione um cliente...</span>
        )}
        <ChevronDown className="h-4 w-4 shrink-0 text-foreground/40" />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 overflow-hidden rounded-lg border border-border bg-background shadow-lg">
          <div className="relative border-b border-border p-2">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/35" />
            <input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar cliente..."
              className="w-full rounded-md border border-transparent bg-foreground/[0.03] py-2 pl-8 pr-2 text-sm outline-none focus:border-primary focus:bg-background"
            />
          </div>

          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-4 text-center text-xs text-foreground/45">Buscando...</div>
            ) : clients.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-foreground/45">
                Nenhum cliente encontrado.
              </div>
            ) : (
              clients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => {
                    onChange(client);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-foreground/[0.03] ${
                    value?.id === client.id ? 'bg-primary/[0.05]' : ''
                  }`}
                >
                  <span className="truncate font-medium text-foreground">{client.name}</span>
                  <span className="shrink-0 text-xs text-foreground/45">
                    {SOURCE_TYPE_LABEL[client.provider]}
                  </span>
                </button>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-left text-sm font-medium text-primary transition-colors hover:bg-primary/[0.04]"
          >
            <Plus className="h-3.5 w-3.5" /> Novo cliente
          </button>
        </div>
      ) : null}

      {showCreate ? (
        <ClientFormModal
          onClose={() => setShowCreate(false)}
          onCreated={(client) => {
            setShowCreate(false);
            setOpen(false);
            onChange(client);
          }}
        />
      ) : null}
    </div>
  );
}
