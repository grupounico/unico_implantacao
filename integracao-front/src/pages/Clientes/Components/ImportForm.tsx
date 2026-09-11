import { useEffect, useState } from 'react';
import { ChevronDown, Loader2, Play, Settings2, X } from 'lucide-react';
import {
  createBancoUnicoImport,
  type CreateBancoUnicoImportPayload,
} from '../../../services/bancoUnicoImports.service';
import type { Client } from '../../../services/clients.service';
import { extractErrorMessage } from '../../../utils/error';
import { SOURCE_TYPE_LABEL } from '../../Aplications/bancoUnicoImports.ui';

type ImportFormProps = {
  client: Client;
  onClose: () => void;
  onCreated: () => void;
  onError: (message: string) => void;
};

const INITIAL_FORM = {
  sourcePageSize: '999',
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
  useAiNormalization: true,
  limit: '',
  limitNew: '',
  offset: '0',
};

const INPUT_CLASS = 'w-full rounded-lg border border-border bg-foreground/[0.02] px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/45 focus:border-primary focus:bg-background focus:ring-1 focus:ring-primary';
const LEGEND_CLASS = 'text-xs font-medium uppercase tracking-wide text-foreground/45';

export default function ImportForm({ client, onClose, onCreated, onError }: ImportFormProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !submitting) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, submitting]);

  function handleChange<K extends keyof typeof INITIAL_FORM>(
    key: K,
    value: (typeof INITIAL_FORM)[K],
  ) {
    setValidationError(null);
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validateNumbers() {
    const values: Array<[string, string, boolean]> = [
      ['Lote de publicação', form.batchSize, false],
      ['Concorrência de classificação', form.classifyConcurrency, false],
      ['Limite de novos produtos', form.limitNew, true],
      ['Página de origem', form.sourcePageSize, false],
      ['Limite total', form.limit, true],
      ['Offset', form.offset, false],
      ['Concorrência de publicação', form.publishConcurrency, false],
      ['Lote de conferência', form.existingCheckBatchSize, false],
      ['Concorrência de conferência', form.existingCheckConcurrency, false],
    ];

    const invalid = values.find(([, value, optional]) => {
      if (!value && optional) return false;
      return !Number.isInteger(Number(value)) || Number(value) < 0;
    });

    if (invalid) {
      setValidationError(`${invalid[0]} deve ser um número inteiro igual ou maior que zero.`);
      return false;
    }
    return true;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validateNumbers()) return;

    setSubmitting(true);
    try {
      const payload: CreateBancoUnicoImportPayload = {
        clientId: client.id,
        sourcePageSize: Number(form.sourcePageSize),
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
        limitNew: form.limitNew ? Number(form.limitNew) : undefined,
        offset: Number(form.offset),
      };

      if (form.bancoUnicoAuthorization) payload.bancoUnicoAuthorization = form.bancoUnicoAuthorization;

      await createBancoUnicoImport(payload);
      setForm(INITIAL_FORM);
      setShowAdvanced(false);
      onCreated();
    } catch (error) {
      onError(extractErrorMessage(error, 'Não foi possível iniciar a importação. Revise os dados e tente novamente.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/30 backdrop-blur-[2px]" onClick={() => !submitting && onClose()}>
      <form
        onSubmit={(event) => void handleSubmit(event)}
        onClick={(event) => event.stopPropagation()}
        className="rise-in flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-[-0.015em] text-foreground">Nova importação</h2>
            <p className="mt-1 text-sm leading-5 text-foreground/60">Envia somente os produtos que ainda faltam no Banco Único.</p>
            <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground/70">
              {SOURCE_TYPE_LABEL[client.provider] || client.provider}
            </span>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="flex size-8 shrink-0 items-center justify-center rounded-lg text-foreground/50 transition-colors hover:bg-foreground/[0.06] hover:text-foreground">
            <X className="size-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto scrollbar-minimal px-6 py-6">
          <section aria-labelledby="import-scope-title">
            <div className="flex items-center justify-between gap-3">
              <h3 id="import-scope-title" className="text-sm font-semibold text-foreground">Escopo da execução</h3>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                Somente faltantes
              </span>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Limite de novos produtos" hint="Vazio para todos os faltantes.">
                <input type="number" min="0" inputMode="numeric" value={form.limitNew} onChange={(event) => handleChange('limitNew', event.target.value)} placeholder="Todos" className={INPUT_CLASS} />
              </Field>
              <Field label="Lote de publicação" hint="Quantidade enviada por vez.">
                <input type="number" min="1" inputMode="numeric" value={form.batchSize} onChange={(event) => handleChange('batchSize', event.target.value)} className={INPUT_CLASS} />
              </Field>
            </div>

            <ToggleField label="Somente classificar" description="Analisa e prepara os produtos, sem publicá-los no Banco Único." checked={form.mode === 'classify-only'} onChange={(checked) => handleChange('mode', checked ? 'classify-only' : 'publish')} className="mt-4" />
          </section>

          <section className="border-t border-border pt-6" aria-labelledby="advanced-import-title">
            <button type="button" onClick={() => setShowAdvanced((current) => !current)} aria-expanded={showAdvanced} aria-controls="advanced-import-settings" className="-mx-1 flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1 text-left text-sm font-semibold text-foreground/80 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              <span className="flex items-center gap-2"><Settings2 className="size-4" /> Ajustes avançados</span>
              <ChevronDown className={`size-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>

            {showAdvanced ? (
              <div id="advanced-import-settings" className="mt-5 space-y-6">
                <fieldset>
                  <legend className={LEGEND_CLASS}>Recorte e origem</legend>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <Field label="Página de origem" hint="Itens lidos por página."><input type="number" min="1" inputMode="numeric" value={form.sourcePageSize} onChange={(event) => handleChange('sourcePageSize', event.target.value)} className={INPUT_CLASS} /></Field>
                    <Field label="Offset" hint="Posição inicial na origem."><input type="number" min="0" inputMode="numeric" value={form.offset} onChange={(event) => handleChange('offset', event.target.value)} className={INPUT_CLASS} /></Field>
                  </div>
                </fieldset>

                <fieldset className="border-t border-border pt-6">
                  <legend className={LEGEND_CLASS}>Desempenho</legend>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <Field label="Concorrência de classificação"><input type="number" min="1" inputMode="numeric" value={form.classifyConcurrency} onChange={(event) => handleChange('classifyConcurrency', event.target.value)} className={INPUT_CLASS} /></Field>
                    <Field label="Concorrência de publicação"><input type="number" min="1" inputMode="numeric" value={form.publishConcurrency} onChange={(event) => handleChange('publishConcurrency', event.target.value)} className={INPUT_CLASS} /></Field>
                    <Field label="Lote de conferência"><input type="number" min="1" inputMode="numeric" value={form.existingCheckBatchSize} onChange={(event) => handleChange('existingCheckBatchSize', event.target.value)} className={INPUT_CLASS} /></Field>
                    <Field label="Concorrência de conferência"><input type="number" min="1" inputMode="numeric" value={form.existingCheckConcurrency} onChange={(event) => handleChange('existingCheckConcurrency', event.target.value)} className={INPUT_CLASS} /></Field>
                  </div>
                </fieldset>

                <fieldset className="space-y-3 border-t border-border pt-6">
                  <legend className={LEGEND_CLASS}>Exceções</legend>
                  <ToggleField label="Forçar reenvio de itens existentes" description="Ignora a conferência no Banco Único. Use apenas em correções controladas." tone="danger" checked={form.ignoreExistingCheck} onChange={(checked) => handleChange('ignoreExistingCheck', checked)} />
                  <ToggleField label="Desabilitar IA na normalização" description="Mantém a classificação, mas não normaliza com IA." checked={form.disableNormalizeAi} onChange={(checked) => handleChange('disableNormalizeAi', checked)} />
                  <ToggleField label="Desabilitar toda a IA" description="Processa sem classificação nem normalização assistida." checked={form.disableAi} onChange={(checked) => handleChange('disableAi', checked)} />
                </fieldset>
              </div>
            ) : null}
          </section>

          {validationError ? <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-800">{validationError}</p> : null}
        </div>

        <div className="shrink-0 border-t border-border bg-background px-6 py-4">
          <button type="submit" disabled={submitting} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[#0f50df] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? <><Loader2 className="size-4 animate-spin" /> Iniciando importação…</> : <><Play className="size-4" /> Iniciar importação</>}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="block text-xs font-medium text-foreground/70">{label}</span>
      {hint ? <span className="mt-0.5 block text-xs leading-4 text-foreground/45">{hint}</span> : null}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

function ToggleField({ label, description, checked, onChange, tone = 'default', className = '' }: { label: string; description: string; checked: boolean; onChange: (checked: boolean) => void; tone?: 'default' | 'danger'; className?: string }) {
  if (tone === 'danger') {
    return (
      <label className={`flex cursor-pointer items-start gap-3 rounded-lg border border-rose-200 bg-rose-50/70 p-3 transition-colors hover:border-rose-300 ${className}`}>
        <input type="checkbox" className="mt-0.5 size-4 accent-rose-600" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <span><span className="block text-sm font-semibold text-rose-900">{label}</span><span className="mt-0.5 block text-xs leading-5 text-rose-800">{description}</span></span>
      </label>
    );
  }

  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/35 hover:bg-foreground/[0.02] ${className}`}>
      <input type="checkbox" className="mt-0.5 size-4 accent-primary" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span><span className="block text-sm font-semibold text-foreground">{label}</span><span className="mt-0.5 block text-xs leading-5 text-foreground/60">{description}</span></span>
    </label>
  );
}
