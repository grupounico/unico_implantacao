import { useState } from 'react';

import { TemplateForm } from './TemplateForm';
import { IVRGenerator } from './IVRGenerator';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import './TemplateCatalogPage.scss';

type TemplateField = {
  key: string;
  label: string;
  type?: string;
  placeholder?: string;
  width?: 'full' | 'half';
};

export interface CatalogTemplate {
  name: string;
  file: string;
  banner?: string;
  description?: string;
  fields: TemplateField[];
}

interface TemplateCatalogPageProps {
  title: string;
  templates: Record<string, CatalogTemplate>;
}

export function TemplateCatalogPage({
  title,
  templates,
}: TemplateCatalogPageProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [openModal, setOpenModal] = useState(false);
  const [manualAuthRequired, setManualAuthRequired] = useState(false);
  const [manualAuthMessage, setManualAuthMessage] = useState('');
  useBodyScrollLock(openModal);

  const template = selectedTemplate
    ? templates[selectedTemplate as keyof typeof templates]
    : null;

  function handleOpenModal(key: string) {
    setSelectedTemplate(key);
    setManualAuthRequired(false);
    setManualAuthMessage('');
    setOpenModal(true);
  }

  function handleCloseModal() {
    setOpenModal(false);
    setSelectedTemplate('');
    setFormData({});
    setManualAuthRequired(false);
    setManualAuthMessage('');
  }

  return (
    <div className="app-container flex h-screen max-h-screen max-w-screen flex-col overflow-hidden py-8 pr-5">
      <header className="app-header mb-5">
        <h1 className="text-3xl font-semibold opacity-90">{title}</h1>
      </header>

      <main className="app-main h-full max-w-screen overflow-y-auto">
        <div className="cards-grid grid grid-cols-1 gap-5 pt-2 sm:grid-cols-2 md:grid-cols-4">
          {Object.entries(templates).map(([key, item]) => (
            <div
              key={key}
              className={`integration-card ${selectedTemplate === key ? 'active' : ''}`}
              onClick={() => handleOpenModal(key)}
            >
              <div
                className="h-50 w-full rounded-xl bg-gray-300 bg-cover bg-center"
                style={{ backgroundImage: `url(${item.banner})` }}
              />
              <h3 className="overflow-hidden px-2 pt-4 text-ellipsis text-nowrap font-semibold">
                {item.name}
              </h3>
            </div>
          ))}
        </div>

        {template && openModal ? (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal" onClick={(event) => event.stopPropagation()}>
              <button className="close-button" onClick={handleCloseModal}>
                ×
              </button>

              <TemplateForm
                template={template}
                formData={formData}
                setFormData={setFormData}
                showManualAuthFields={manualAuthRequired}
                manualAuthMessage={manualAuthMessage}
              />
              <IVRGenerator
                template={template}
                formData={formData}
                closeModal={handleCloseModal}
                onRequireManualAuth={(message) => {
                  setManualAuthRequired(true);
                  setManualAuthMessage(message);
                }}
              />
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
