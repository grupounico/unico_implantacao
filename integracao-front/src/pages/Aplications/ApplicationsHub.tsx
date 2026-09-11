import {
  Boxes,
  HardDriveDownload,
  Puzzle,
  ServerCog,
} from 'lucide-react';
import ApplicationModuleCard from '../../components/ApplicationModuleCard';
import { useRequireAuth } from '../../hooks/useAuthRedirect';

export default function ApplicationsHub() {
  useRequireAuth();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-gray-50 font-sans text-foreground">
      <header className="sticky top-0 z-10 flex shrink-0 flex-col justify-between gap-4 border-b border-border bg-background px-8 py-6 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Boxes className="h-7 w-7 text-primary" /> Servicos
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-foreground/60">
            Centralize a geracao de pacotes, extensoes e o provisionamento de
            APIs para as IAs.
          </p>
        </div>
      </header>

      <main className="scrollbar-clean min-h-0 flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <ApplicationModuleCard
              title="Pkg Generator"
              description="Mantem o fluxo existente de compilacao do executavel Alpha 7, com os mesmos campos de banco e chave de acesso."
              badge="Legado"
              icon={HardDriveDownload}
              path="/main/aplications/pkg-generator"
              points={[
                'Fluxo atual preservado',
                'Geracao de pacote ZIP',
                'Mesmo comportamento',
              ]}
            />

            <ApplicationModuleCard
              title="APIs para IAs"
              description="Gerencie as APIs que alimentam as IAs, com criacao de instancias, status operacional, logs e reinicio."
              badge="Novo modulo"
              icon={ServerCog}
              path="/main/aplications/ia-services"
              points={[
                'Criacao de instancias',
                'Listagem e status online',
                'Logs em tempo real',
              ]}
            />

            <ApplicationModuleCard
              title="Extensao Trier"
              description="Gere o ZIP da extensao Trier direto pela area de Servicos, com acompanhamento pelo popup global ate a finalizacao."
              badge="Novo modulo"
              icon={Puzzle}
              path="/main/aplications/trier-extension"
              points={[
                'Solicita apenas URL e token',
                'Download automatico do ZIP',
                'Mesma logica do popup do PKG',
              ]}
            />

            <ApplicationModuleCard
              title="Extensao Inova Farma"
              description="Gere o ZIP da extensao Inova Farma a partir do repositorio dedicado, alterando apenas a URL da instancia."
              badge="Novo modulo"
              icon={Puzzle}
              path="/main/aplications/inova-farma-extension"
              points={[
                'Solicita apenas URL da instancia',
                'Planilhas aplicadas automaticamente',
                'Download automatico do ZIP',
              ]}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
