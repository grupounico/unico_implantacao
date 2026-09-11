/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useRef, useState } from 'react';
import { Filter, Puzzle } from 'lucide-react';

import { CatalogCard } from '../../components/catalog/CatalogCard';
import { CatalogPageShell } from '../../components/catalog/CatalogPageShell';
import { IntegrationPreviewModal } from '../../components/IntegrationPreviewModal.tsx';
import { ModalFrame } from '../../components/ModalFrame';
import { TemplateForm } from '../../components/TemplateForm.tsx';
import { IVRGenerator } from '../../components/IVRGenerator.tsx';
import { templates } from '../../data/templates.ts';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useRequireAuth } from '../../hooks/useAuthRedirect';

interface IntegrationTemplate {
  name: string;
  file: string;
  banner?: string;
  active?: boolean;
  fields: any[];
  description?: string;
  type?: string;
}

type ModalStep = 'none' | 'preview' | 'install';

function getBadgeLabel(template: IntegrationTemplate) {
  if (template.active === false && template.type === 'Extensão') {
    return 'Extensão';
  }

  return template.active ? 'Ativo' : 'Inativo';
}

function getBadgeClassName(template: IntegrationTemplate) {
  if (template.active === false && template.type === 'Extensão') {
    return 'bg-blue-100 text-blue-700';
  }

  return template.active
    ? 'bg-background/90 text-green-600 dark:text-green-400'
    : 'bg-red-200 text-red-500';
}

export default function Integrations() {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [modalStep, setModalStep] = useState<ModalStep>('none');
  const [searchTerm, setSearchTerm] = useState('');
  const [manualAuthRequired, setManualAuthRequired] = useState(false);
  const [manualAuthMessage, setManualAuthMessage] = useState('');
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  useRequireAuth();
  useBodyScrollLock(modalStep !== 'none');

  const filteredTemplates = useMemo(() => {
    return Object.entries(templates as Record<string, IntegrationTemplate>).filter(
      ([, template]) =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm]);

  const template = selectedTemplate
    ? (templates[selectedTemplate as keyof typeof templates] as IntegrationTemplate)
    : null;

  function handleOpenPreview(key: string) {
    setSelectedTemplate(key);
    setManualAuthRequired(false);
    setManualAuthMessage('');
    setModalStep('preview');
  }

  function handleContinueInstall() {
    setModalStep('install');
  }

  function handleCloseModal() {
    setModalStep('none');
    window.setTimeout(() => {
      setSelectedTemplate('');
      setFormData({});
      setManualAuthRequired(false);
      setManualAuthMessage('');
    }, 200);
  }

  const handleEnterPress = () => {
    if (submitButtonRef.current) {
      submitButtonRef.current.click();
    }
  };

  return (
    <CatalogPageShell
      title="Catálogo de Integrações"
      description="Conecte suas ferramentas favoritas."
      icon={Puzzle}
      iconClassName="text-primary"
      searchTerm={searchTerm}
      onSearchTermChange={(event) => setSearchTerm(event.target.value)}
      searchPlaceholder="Buscar integração..."
      isEmpty={filteredTemplates.length === 0}
      emptyIcon={Filter}
      emptyTitle="Nenhuma integração encontrada"
      theme="system"
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredTemplates.map(([key, item]) => (
          <CatalogCard
            key={key}
            theme="system"
            selected={selectedTemplate === key}
            onClick={() => handleOpenPreview(key)}
            media={
              <div className="relative h-40 w-full overflow-hidden bg-muted">
                {item.banner ? (
                  <div
                    className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url(${item.banner})` }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <Puzzle className="h-12 w-12" />
                  </div>
                )}
              </div>
            }
            badge={
              <div
                className={`rounded-md px-2 py-1 text-xs font-semibold uppercase shadow-sm backdrop-blur-sm ${getBadgeClassName(item)}`}
              >
                {getBadgeLabel(item)}
              </div>
            }
          >
            <h3 className="mb-2 text-lg font-bold text-foreground transition-colors group-hover:text-primary">
              {item.name}
            </h3>
            <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
              {item.description ?? 'Integre e automatize processos.'}
            </p>
            <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {item.type || 'Automação'}
              </span>
              <button
                className={`text-sm font-medium ${
                  item.active ? 'text-primary' : 'text-muted-foreground'
                }`}
                disabled={!item.active}
              >
                Instalar &rarr;
              </button>
            </div>
          </CatalogCard>
        ))}
      </div>

      {template && modalStep === 'preview' ? (
        <IntegrationPreviewModal
          template={template}
          onClose={handleCloseModal}
          onContinue={handleContinueInstall}
        />
      ) : null}

      {template && modalStep === 'install' ? (
        <ModalFrame
          title={`Instalar ${template.name}`}
          onClose={handleCloseModal}
          maxWidthClassName="max-w-4xl"
          panelClassName="bg-background"
          bodyClassName="overflow-y-auto p-6 custom-scrollbar"
          closeButtonClassName="hover:bg-muted text-muted-foreground"
        >
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/20">
                Preencha os dados abaixo para gerar as credenciais da integração.
              </div>

              <TemplateForm
                template={template}
                formData={formData}
                setFormData={setFormData}
                showManualAuthFields={manualAuthRequired}
                manualAuthMessage={manualAuthMessage}
                onPressEnter={handleEnterPress}
              />
            </div>

            <div className="h-full min-h-[400px] overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <IVRGenerator
                template={template}
                formData={formData}
                closeModal={handleCloseModal}
                submitRef={submitButtonRef}
                onRequireManualAuth={(message) => {
                  setManualAuthRequired(true);
                  setManualAuthMessage(message);
                }}
              />
            </div>
          </div>
        </ModalFrame>
      ) : null}
    </CatalogPageShell>
  );
}
