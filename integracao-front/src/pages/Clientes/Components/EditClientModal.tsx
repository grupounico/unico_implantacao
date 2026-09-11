import { useEffect, useState } from 'react';
import { ChevronDown, Loader2, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import {
  updateClient,
  type Client,
  type ClientProvider,
} from '../../../services/clients.service';
import { extractErrorMessage } from '../../../utils/error';

const INSTANCE_PLACEHOLDER: Record<ClientProvider, string> = {
  api: 'Ex: Drogaria Dom Bosco',
  file: 'C:\\dados\\catalogo.json',
  alpha7: '145.223.x.x',
  vetor: 'Ex: 2',
  automatiza: '189.89.222.5',
  deliverypharmacy: 'https://api.deliverypharmacy.com.br/v2/produto',
};

const SOURCE_INSTANCE_LABEL: Record<ClientProvider, string> = {
  api: 'Instância do cliente',
  file: 'Caminho do arquivo no servidor',
  alpha7: 'Host Alpha 7',
  vetor: 'Unidade Vetor',
  automatiza: 'Host MySQL Automatiza',
  deliverypharmacy: 'Endpoint Delivery Pharmacy',
};

const CREDENTIAL_LABEL: Record<ClientProvider, string> = {
  api: 'Token de integracao Trier',
  file: 'Nao se aplica',
  alpha7: 'Senha do banco',
  vetor: 'Token de integracao Vetor',
  automatiza: 'Senha do banco MySQL',
  deliverypharmacy: 'Token da API Delivery Pharmacy',
};

const PROVIDER_OPTIONS: Array<[ClientProvider, string]> = [
  ['api', 'API Trier'], ['file', 'Arquivo'], ['alpha7', 'Alpha 7'], ['vetor', 'Vetor'], ['automatiza', 'Automatiza'],
  ['deliverypharmacy', 'Delivery Pharmacy'],
];

export default function EditClientModal({
  client,
  onClose,
  onUpdated,
}: {
  client: Client;
  onClose: () => void;
  onUpdated: (client: Client) => void;
}) {
  const [name, setName] = useState(client.name);
  const [businessUnit, setBusinessUnit] = useState(client.businessUnit || '');
  const [cnpj, setCnpj] = useState(client.cnpj || '');
  const [clientInstance, setClientInstance] = useState(client.clientInstance || '');
  const [provider, setProvider] = useState<ClientProvider>(client.provider);
  const [instance, setInstance] = useState(client.providerConfig || '');
  const [credential, setCredential] = useState('');
  const [changingCredential, setChangingCredential] = useState(!client.credentialHint);
  const [alpha7Port, setAlpha7Port] = useState(String(client.alpha7Port || (client.provider === 'automatiza' ? 59001 : 5432)));
  const [alpha7Database, setAlpha7Database] = useState(client.alpha7Database || (client.provider === 'automatiza' ? 'automatiza' : ''));
  const [alpha7User, setAlpha7User] = useState(client.alpha7User || '');
  const [alpha7Schema] = useState(client.alpha7Schema || 'public');
  const [deliveryCompanyId, setDeliveryCompanyId] = useState(client.deliveryCompanyId || '');
  const [deliveryErpId, setDeliveryErpId] = useState(client.deliveryErpId || '');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providerOpen, setProviderOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !submitting) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, submitting]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {};

      if (name !== client.name) payload.name = name;
      if (businessUnit !== (client.businessUnit || '')) payload.businessUnit = businessUnit || undefined;
      if (cnpj !== (client.cnpj || '')) payload.cnpj = cnpj || undefined;
      if (clientInstance !== (client.clientInstance || '')) payload.clientInstance = clientInstance;
      if (provider !== client.provider) payload.provider = provider;
      if (provider !== 'api' && instance !== client.providerConfig) {
        payload.instance = instance;
      }
      if (credential) payload.credential = credential;
      if (provider === 'alpha7') {
        if (Number(alpha7Port) !== (client.alpha7Port || 5432)) payload.alpha7Port = Number(alpha7Port);
        if (alpha7Database !== (client.alpha7Database || '')) payload.alpha7Database = alpha7Database;
        if (alpha7User !== (client.alpha7User || '')) payload.alpha7User = alpha7User;
        if (alpha7Schema !== (client.alpha7Schema || 'public')) payload.alpha7Schema = alpha7Schema;
      }
      if (provider === 'deliverypharmacy') {
        if (deliveryCompanyId !== (client.deliveryCompanyId || '')) payload.deliveryCompanyId = deliveryCompanyId;
        if (deliveryErpId !== (client.deliveryErpId || '')) payload.deliveryErpId = deliveryErpId;
      }

      if (Object.keys(payload).length === 0) {
        onClose();
        return;
      }

      const updated = await updateClient(client.id, payload);
      onUpdated(updated);
    } catch (caught) {
      setError(extractErrorMessage(caught, 'Erro ao atualizar cliente.'));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-border bg-foreground/[0.02] px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:bg-background focus:ring-1 focus:ring-primary';
  const labelClass = 'mb-1.5 block text-xs font-medium text-foreground/70';
  const legendClass = 'text-xs font-medium uppercase tracking-wide text-foreground/45';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="custom-scrollbar max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-background shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-[-0.015em] text-foreground">Editar cliente</h2>
            <p className="mt-0.5 truncate text-sm text-foreground/60">{client.name}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-foreground/50 transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          className="space-y-6 px-6 py-6"
          autoComplete="off"
        >
          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50/80 px-3 py-2 text-xs font-medium text-rose-800">
              {error}
            </div>
          ) : null}

          <fieldset className="space-y-4">
            <legend className={legendClass}>Identificação</legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Nome do cliente</label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={inputClass}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className={labelClass}>CNPJ</label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(event) => setCnpj(event.target.value)}
                  className={inputClass}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Unidade ou filial</label>
                <input
                  type="text"
                  value={businessUnit}
                  onChange={(event) => setBusinessUnit(event.target.value)}
                  className={inputClass}
                  placeholder="Ex: Loja Centro"
                />
              </div>
              <div>
                <label className={labelClass}>Instância do cliente</label>
                <input
                  type="text"
                  value={clientInstance}
                  onChange={(event) => setClientInstance(event.target.value)}
                  className={inputClass}
                  placeholder="Ex: Drogaria Dom Bosco"
                  required
                />
                <p className="mt-1.5 text-[11px] leading-5 text-foreground/50">Identificação administrativa; não altera a integração selecionada.</p>
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4 border-t border-border pt-6">
            <legend className={legendClass}>Integração</legend>

            <div>
              <label className={labelClass}>Provedor</label>
              <div className="relative">
                <button type="button" onClick={() => setProviderOpen((open) => !open)} className={`${inputClass} flex items-center justify-between font-semibold`} aria-expanded={providerOpen}>
                  {PROVIDER_OPTIONS.find(([value]) => value === provider)?.[1]}
                  <ChevronDown className={`h-4 w-4 transition-transform ${providerOpen ? 'rotate-180' : ''}`} />
                </button>
                {providerOpen ? <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-background p-1 shadow-lg">
                  {PROVIDER_OPTIONS.map(([value, label]) => <button key={value} type="button" onClick={() => { setProvider(value); if (value === 'automatiza' && !alpha7Database) setAlpha7Database('automatiza'); if (value === 'automatiza' && alpha7Port === '5432') setAlpha7Port('59001'); if (value !== client.provider) setInstance(''); setProviderOpen(false); }} className={`block w-full rounded-md px-3 py-2 text-left text-sm ${provider === value ? 'bg-primary text-primary-foreground' : 'hover:bg-foreground/5'}`}>{label}</button>)}
                </div> : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {provider !== 'api' && provider !== 'deliverypharmacy' ? (
                <div>
                  <label className={labelClass}>{SOURCE_INSTANCE_LABEL[provider]}</label>
                  <input
                    type="text"
                    value={instance}
                    onChange={(event) => setInstance(event.target.value)}
                    className={inputClass}
                    placeholder={INSTANCE_PLACEHOLDER[provider]}
                    required
                  />
                </div>
              ) : null}

              {provider !== 'file' ? (
                <div className={provider === 'api' ? 'sm:col-span-2' : ''}>
                  <label className={labelClass}>{CREDENTIAL_LABEL[provider]}</label>
                  {!changingCredential && client.credentialHint ? (
                    <div className="flex items-center gap-2">
                      <span className="flex min-h-[42px] flex-1 items-center rounded-lg border border-border bg-foreground/[0.03] px-3 font-mono text-sm text-foreground">
                        {client.credentialHint}••••••••
                      </span>
                      <button
                        type="button"
                        onClick={() => setChangingCredential(true)}
                        className="shrink-0 rounded-lg border border-border px-3 py-2.5 text-xs font-semibold text-foreground/70 transition-colors hover:bg-foreground/[0.03]"
                      >
                        Alterar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        value={credential}
                        onChange={(event) => setCredential(event.target.value)}
                        className={inputClass}
                        placeholder={client.credentialHint ? 'Nova credencial' : ''}
                        autoFocus={Boolean(client.credentialHint)}
                      />
                      {client.credentialHint ? (
                        <button
                          type="button"
                          onClick={() => {
                            setCredential('');
                            setChangingCredential(false);
                          }}
                          className="shrink-0 rounded-lg border border-border px-3 py-2.5 text-xs font-semibold text-foreground/70 transition-colors hover:bg-foreground/[0.03]"
                        >
                          Cancelar
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {provider === 'alpha7' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Porta</label>
                  <input
                    type="text"
                    value={alpha7Port}
                    onChange={(event) => setAlpha7Port(event.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Database</label>
                  <input
                    type="text"
                    value={alpha7Database}
                    onChange={(event) => setAlpha7Database(event.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Usuario</label>
                  <input
                    type="text"
                    value={alpha7User}
                    onChange={(event) => setAlpha7User(event.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
              </div>
            ) : null}

            {provider === 'deliverypharmacy' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Empresa ID</label>
                  <input type="text" value={deliveryCompanyId} onChange={(event) => setDeliveryCompanyId(event.target.value)} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>ERP ID</label>
                  <input type="text" value={deliveryErpId} onChange={(event) => setDeliveryErpId(event.target.value)} className={inputClass} required />
                </div>
              </div>
            ) : null}
          </fieldset>

          <div className="flex justify-end gap-2 border-t border-border pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-foreground/[0.03] disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
