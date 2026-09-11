import { useEffect, useState } from 'react';
import { ChevronDown, Loader2, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import {
  createClient,
  type Client,
  type ClientProvider,
} from '../../services/clients.service';
import { extractErrorMessage } from '../../utils/error';

const INITIAL_FORM = {
  name: '',
  businessUnit: '',
  cnpj: '',
  clientInstance: '',
  provider: 'api' as ClientProvider,
  instance: '',
  credential: '',
  alpha7Port: '5432',
  alpha7Database: '',
  alpha7User: '',
  alpha7Schema: 'public',
  automatizaShopId: '',
  deliveryCompanyId: '',
  deliveryErpId: '',
};

const INSTANCE_PLACEHOLDER: Record<ClientProvider, string> = {
  api: 'Ex: Drogaria Dom Bosco',
  file: 'C:\\dados\\catalogo.json',
  alpha7: '145.274.x.x',
  vetor: 'Ex: 2',
  automatiza: '00.000.000',
  deliverypharmacy: '',
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

export default function ClientFormModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (client: Client) => void;
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providerOpen, setProviderOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function handleChange<K extends keyof typeof INITIAL_FORM>(key: K, value: (typeof INITIAL_FORM)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectProvider(provider: ClientProvider) {
    setForm((current) => ({
      ...current,
      provider,
      alpha7Port: provider === 'automatiza' && current.alpha7Port === '5432' ? '59001' : current.alpha7Port,
      alpha7Database: provider === 'automatiza' && !current.alpha7Database ? 'automatiza' : current.alpha7Database,
    }));
    setProviderOpen(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const created = await createClient({
        name: form.name,
        businessUnit: form.businessUnit || undefined,
        cnpj: form.cnpj || undefined,
        clientInstance: form.clientInstance,
        provider: form.provider,
        instance: form.provider === 'deliverypharmacy' ? 'https://api.deliverypharmacy.com.br/v2/produto' : form.instance,
        credential: form.credential || undefined,
        alpha7Port: form.provider === 'alpha7' || form.provider === 'automatiza' ? Number(form.alpha7Port) : undefined,
        alpha7Database: form.provider === 'alpha7' || form.provider === 'automatiza' ? form.alpha7Database : undefined,
        alpha7User: form.provider === 'alpha7' || form.provider === 'automatiza' ? form.alpha7User : undefined,
        alpha7Schema: form.provider === 'alpha7' ? form.alpha7Schema : undefined,
        automatizaShopId: form.provider === 'automatiza' ? Number(form.automatizaShopId) : undefined,
        deliveryCompanyId: form.provider === 'deliverypharmacy' ? form.deliveryCompanyId : undefined,
        deliveryErpId: form.provider === 'deliverypharmacy' ? form.deliveryErpId : undefined,
      });
      onCreated(created);
    } catch (caught) {
      setError(extractErrorMessage(caught, 'Erro ao criar cliente.'));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-border bg-foreground/[0.02] px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:bg-background focus:ring-1 focus:ring-primary';
  const labelClass = 'mb-1.5 block text-xs font-medium text-foreground/55';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="custom-scrollbar max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-background p-5 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Novo cliente</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-foreground/45 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          className="mt-4 space-y-4"
          autoComplete="off"
        >
          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50/80 px-3 py-2 text-xs font-medium text-rose-800">
              {error}
            </div>
          ) : null}

          <div>
            <label className={labelClass}>Nome do cliente</label>
            <input
              type="text"
              name="client_name"
              autoComplete="organization"
              value={form.name}
              onChange={(event) => handleChange('name', event.target.value)}
              className={inputClass}
              placeholder="Ex: Farmacia Centro"
              required
              autoFocus
            />
          </div>

          <div>
            <label className={labelClass}>CNPJ</label>
            <input
              type="text"
              name="client_cnpj"
              autoComplete="off"
              value={form.cnpj}
              onChange={(event) => handleChange('cnpj', event.target.value)}
              className={inputClass}
              placeholder="Opcional"
            />
          </div>

          <div>
            <label className={labelClass}>Unidade ou filial</label>
            <input
              type="text"
              name="client_business_unit"
              autoComplete="organization"
              value={form.businessUnit}
              onChange={(event) => handleChange('businessUnit', event.target.value)}
              className={inputClass}
              placeholder="Ex: Loja Centro"
            />
          </div>

          <div>
            <label className={labelClass}>Instância do cliente</label>
            <input
              type="text"
              name="client_instance"
              autoComplete="off"
              value={form.clientInstance}
              onChange={(event) => handleChange('clientInstance', event.target.value)}
              className={inputClass}
              placeholder="Ex: Drogaria Dom Bosco"
              required
            />
            <p className="mt-1.5 text-[11px] leading-5 text-foreground/50">Identificação administrativa do cliente; não altera a integração selecionada.</p>
          </div>

          <div>
            <label className={labelClass}>Provedor</label>
            <div className="relative">
              <button type="button" onClick={() => setProviderOpen((open) => !open)} className={`${inputClass} flex items-center justify-between font-semibold`} aria-expanded={providerOpen}>
                {PROVIDER_OPTIONS.find(([value]) => value === form.provider)?.[1]}
                <ChevronDown className={`h-4 w-4 transition-transform ${providerOpen ? 'rotate-180' : ''}`} />
              </button>
              {providerOpen ? <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-background p-1 shadow-lg">
                {PROVIDER_OPTIONS.map(([value, label]) => <button key={value} type="button" onClick={() => selectProvider(value)} className={`block w-full rounded-md px-3 py-2 text-left text-sm ${form.provider === value ? 'bg-primary text-primary-foreground' : 'hover:bg-foreground/5'}`}>{label}</button>)}
              </div> : null}
            </div>
          </div>

          {form.provider !== 'api' && form.provider !== 'deliverypharmacy' ? (
            <div>
              <label className={labelClass}>{SOURCE_INSTANCE_LABEL[form.provider]}</label>
              <input
                type="text"
                name={form.provider === 'alpha7' ? 'alpha7_host' : form.provider === 'vetor' ? 'vetor_unit' : form.provider === 'automatiza' ? 'automatiza_host' : 'source_instance'}
                autoComplete="off"
                value={form.instance}
                onChange={(event) => handleChange('instance', event.target.value)}
                className={inputClass}
                placeholder={INSTANCE_PLACEHOLDER[form.provider]}
                required
              />
            </div>
          ) : null}

          {form.provider !== 'file' ? (
            <div>
              <label className={labelClass}>{CREDENTIAL_LABEL[form.provider]}</label>
              <input
                type="password"
                name={form.provider === 'api' ? 'api_token' : form.provider === 'vetor' ? 'vetor_token' : 'alpha7_password'}
                autoComplete="new-password"
                value={form.credential}
                onChange={(event) => handleChange('credential', event.target.value)}
                className={inputClass}
                required={form.provider === 'deliverypharmacy'}
              />
            </div>
          ) : null}

          {form.provider === 'alpha7' || form.provider === 'automatiza' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>{form.provider === 'automatiza' ? 'Porta MySQL' : 'Porta'}</label>
                <input
                  type="text"
                  name="alpha7_port"
                  autoComplete="off"
                  value={form.alpha7Port}
                  onChange={(event) => handleChange('alpha7Port', event.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Database</label>
                <input
                  type="text"
                  name="alpha7_database"
                  autoComplete="off"
                  value={form.alpha7Database}
                  onChange={(event) => handleChange('alpha7Database', event.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Usuario</label>
                <input
                  type="text"
                  name="alpha7_user"
                  autoComplete="username"
                  value={form.alpha7User}
                  onChange={(event) => handleChange('alpha7User', event.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              {form.provider === 'automatiza' ? (
                <div className="sm:col-span-2">
                  <label className={labelClass}>Shop ID</label>
                  <input type="number" min="1" name="automatiza_shop_id" autoComplete="off" value={form.automatizaShopId} onChange={(event) => handleChange('automatizaShopId', event.target.value)} className={inputClass} required />
                </div>
              ) : null}
            </div>
          ) : null}

          {form.provider === 'deliverypharmacy' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Empresa ID</label>
                <input type="text" name="delivery_company_id" autoComplete="off" value={form.deliveryCompanyId} onChange={(event) => handleChange('deliveryCompanyId', event.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>ERP ID</label>
                <input type="text" name="delivery_erp_id" autoComplete="off" value={form.deliveryErpId} onChange={(event) => handleChange('deliveryErpId', event.target.value)} className={inputClass} required />
              </div>
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-foreground/[0.03]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Criar cliente
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
