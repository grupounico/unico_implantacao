import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Database,
  HardDriveDownload,
  Key,
  Lock,
  Server,
  User,
  Zap,
} from 'lucide-react';
import {
  type PkgFormData,
  useGeneration,
} from '../../context/GenerationContext';

export function PkgGenerator() {
  const navigate = useNavigate();
  const { generateApp, status, operation } = useGeneration();

  const [formData, setFormData] = useState<PkgFormData>({
    nome_cliente: '',
    db_host: '',
    db_user: '',
    db_password: '',
    db_database: '',
    access_key: '',
  });

  const labelClass = 'mb-1 block text-sm font-medium text-foreground/80';
  const isBusy = status === 'generating';
  const isGeneratingPkg = isBusy && operation === 'pkg';

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    generateApp(formData);
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-gray-50 font-sans text-foreground">
      <header className="sticky top-0 z-10 flex shrink-0 flex-col justify-between gap-4 border-b border-border bg-background px-8 py-6 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <HardDriveDownload className="h-7 w-7 text-primary" /> Gerador de
            Executável
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            Geração de pacotes de instalação (.exe) para o Alpha 7.
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
        <div className="w-full max-w-4xl">
          <div className="animate-in slide-in-from-bottom-4 fade-in rounded-2xl border border-border bg-background p-8 shadow-sm">
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div className="mt-0.5 shrink-0 rounded-lg bg-blue-100 p-1.5 text-blue-600">
                <Zap className="h-4 w-4" />
              </div>
              <p className="text-sm text-blue-800">
                O sistema vai compilar e gerar um instalador Windows
                automaticamente com base nas credenciais abaixo. Confirme antes
                que os dados do banco estão corretos.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Nome do Cliente</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="nome_cliente"
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 pl-10 text-sm outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-primary"
                      value={formData.nome_cliente}
                      onChange={handleChange}
                      placeholder="Ex: Farmácia Central"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Host (IP)</label>
                  <div className="relative">
                    <Server className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="db_host"
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 pl-10 text-sm outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-primary"
                      value={formData.db_host}
                      onChange={handleChange}
                      placeholder="192.168.x.x"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Database Name</label>
                  <div className="relative">
                    <Database className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="db_database"
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 pl-10 text-sm outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-primary"
                      value={formData.db_database}
                      onChange={handleChange}
                      placeholder="db_cliente"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Usuário do Banco</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="db_user"
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 pl-10 text-sm outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-primary"
                      value={formData.db_user}
                      onChange={handleChange}
                      placeholder="postgres"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Senha do Banco</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      name="db_password"
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 pl-10 text-sm outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-primary"
                      value={formData.db_password}
                      placeholder="********"
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Chave de Acesso</label>
                  <div className="relative">
                    <Key className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="access_key"
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 pl-10 text-sm outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-primary"
                      value={formData.access_key}
                      onChange={handleChange}
                      placeholder="Auth Key"
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
                    ml-auto flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-bold text-primary-foreground transition-colors md:min-w-[200px] md:w-auto
                    ${
                      isBusy
                        ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                        : 'bg-primary hover:opacity-90'
                    }
                  `}
                >
                  {isGeneratingPkg ? (
                    'Gerando pacote...'
                  ) : isBusy ? (
                    'Aguardando processo atual...'
                  ) : (
                    <>
                      <HardDriveDownload className="h-5 w-5" /> Iniciar Geração
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
