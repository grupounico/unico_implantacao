import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  HardDriveDownload,
  Link as LinkIcon,
  Sheet,
  Zap,
} from 'lucide-react';
import {
  type InovaFarmaExtensionFormData,
  useGeneration,
} from '../../context/GenerationContext';
import { useRequireAuth } from '../../hooks/useAuthRedirect';

const INITIAL_FORM_DATA: InovaFarmaExtensionFormData = {
  instance_url: '',
  storage_spreadsheet_id: '',
  budgets_spreadsheet_id: '',
};

export default function InovaFarmaExtensionGenerator() {
  const navigate = useNavigate();
  const { generateInovaFarmaExtension, status, operation } = useGeneration();
  const [formData, setFormData] = useState<InovaFarmaExtensionFormData>(
    INITIAL_FORM_DATA,
  );

  useRequireAuth();

  const labelClass = 'mb-1 block text-sm font-medium text-foreground/80';
  const isBusy = status === 'generating';
  const isGeneratingInova =
    isBusy && operation === 'inovaFarmaExtension';

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    generateInovaFarmaExtension(formData);
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-gray-50 font-sans text-foreground">
      <header className="sticky top-0 z-10 flex shrink-0 flex-col justify-between gap-4 border-b border-border bg-background px-8 py-6 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <HardDriveDownload className="h-7 w-7 text-primary" /> Gerador de
            Extensao Inova Farma
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            Gera o ZIP final da extensao Inova Farma com a URL da instancia e
            os IDs das planilhas do cliente.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/main/aplications')}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
      </header>

      <main className="scrollbar-clean flex min-h-0 flex-1 items-start justify-center overflow-y-auto p-8">
        <div className="w-full max-w-4xl space-y-6">
          <div className="animate-in slide-in-from-bottom-4 fade-in rounded-2xl border border-border bg-background p-8 shadow-sm">
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div className="mt-0.5 shrink-0 rounded-lg bg-blue-100 p-1.5 text-blue-600">
                <Zap className="h-4 w-4" />
              </div>
              <p className="text-sm text-blue-800">
                O backend clona o repositorio da extensao Inova Farma, usa o
                `.env.example` do proprio projeto e sobrescreve a URL da
                instancia e os dois IDs de planilhas informados na instalacao.
              </p>
            </div>

            <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="mt-0.5 shrink-0 rounded-lg bg-emerald-100 p-1.5 text-emerald-600">
                <Sheet className="h-4 w-4" />
              </div>
              <p className="text-sm text-emerald-800">
                Variaveis aplicadas no build:
                {' '}
                `VITE_INSTANCE_URL`, `VITE_STORAGE_SPREADSHEET_ID` e
                {' '}
                `VITE_BUDGETS_SPREADSHEET_ID`.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label htmlFor="instance_url" className={labelClass}>
                    URL da Instancia
                  </label>
                  <div className="relative">
                    <LinkIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      id="instance_url"
                      type="url"
                      name="instance_url"
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 pl-10 text-sm outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-primary"
                      value={formData.instance_url}
                      onChange={handleChange}
                      placeholder="https://drogacertamt.atenderbem.com/"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="storage_spreadsheet_id" className={labelClass}>
                    Spreadsheet de Estoque
                  </label>
                  <div className="relative">
                    <Sheet className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      id="storage_spreadsheet_id"
                      type="text"
                      name="storage_spreadsheet_id"
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 pl-10 text-sm outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-primary"
                      value={formData.storage_spreadsheet_id}
                      onChange={handleChange}
                      placeholder="1G96d8aNt3no5VjIU7SFF_LbDw1qGMKD2Si2H-8RlplQ"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="budgets_spreadsheet_id" className={labelClass}>
                    Spreadsheet de Orcamentos
                  </label>
                  <div className="relative">
                    <Sheet className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      id="budgets_spreadsheet_id"
                      type="text"
                      name="budgets_spreadsheet_id"
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 pl-10 text-sm outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-primary"
                      value={formData.budgets_spreadsheet_id}
                      onChange={handleChange}
                      placeholder="1ValGoJDuUAdJhv7YMiqxJfPptDyJzr1wzwhOU10nYvY"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t border-border pt-6">
                <button
                  type="submit"
                  disabled={isBusy}
                  className={`
                    ml-auto flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-bold text-primary-foreground transition-colors md:min-w-[240px] md:w-auto
                    ${
                      isBusy
                        ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                        : 'bg-primary hover:opacity-90'
                    }
                  `}
                >
                  {isGeneratingInova ? (
                    'Gerando extensao...'
                  ) : isBusy ? (
                    'Aguardando processo atual...'
                  ) : (
                    <>
                      <HardDriveDownload className="h-5 w-5" /> Iniciar Geracao
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
