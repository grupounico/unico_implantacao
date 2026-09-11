/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/TemplateForm.tsx

interface Field {
  key: string;
  label: string;
  type?: string;
  placeholder?: string;
  width?: 'full' | 'half';
}

interface TemplateData {
  name: string;
  file?: string;
  fields?: Field[];
  context?: string;
  contextMode?: 'editable' | 'hidden';
  contextLabel?: string;
  contextPlaceholder?: string;
  [key: string]: any;
}

interface Props {
  template?: TemplateData;
  formData: Record<string, string>;
  setFormData: (data: Record<string, string>) => void;
  isIaSetup?: boolean;
  showManualAuthFields?: boolean;
  manualAuthMessage?: string;
  onPressEnter?: () => void;
}

export function TemplateForm({
  template,
  formData,
  setFormData,
  isIaSetup = false,
  showManualAuthFields = false,
  manualAuthMessage = '',
  onPressEnter,
}: Props) {
  const handleChange = (key: string, value: string) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onPressEnter) {
      e.preventDefault();
      onPressEnter();
    }
  };

  const showIaContextField = isIaSetup && template?.contextMode !== 'hidden';
  const iaInputClassName =
    'w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500';

  if (isIaSetup) {
    return (
      <form className="mb-2 h-full">
        <div
          className={
            showIaContextField
              ? 'grid h-full grid-cols-1 gap-6 lg:grid-cols-2'
              : 'h-full'
          }
        >
          <div
            className={`custom-scrollbar overflow-y-auto ${
              showIaContextField ? 'space-y-4 pr-2 lg:max-h-none' : 'space-y-6 pr-1'
            }`}
          >
            <div className="px-1">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Basico
              </label>
              <div
                className={
                  showIaContextField ? 'space-y-3' : 'grid gap-3 sm:grid-cols-2'
                }
              >
                <div>
                  <input
                    type="text"
                    className={iaInputClassName}
                    placeholder="Nome da IA"
                    value={formData['name'] || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    className={iaInputClassName}
                    placeholder="URL da Instancia"
                    value={formData['instance'] || ''}
                    onChange={(e) => handleChange('instance', e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>
            </div>

            {template?.fields && template.fields.length > 0 ? (
              <div className="px-1">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Configuracoes Especificas
                </label>

                <div
                  className={
                    showIaContextField
                      ? 'flex flex-wrap gap-3'
                      : 'grid gap-3 sm:grid-cols-2'
                  }
                >
                  {template.fields.map((field) => (
                    <div
                      key={field.key}
                      className={
                        showIaContextField
                          ? field.width === 'half'
                            ? 'w-[calc(50%-6px)]'
                            : 'w-full'
                          : field.width === 'half'
                            ? 'sm:col-span-1'
                            : 'sm:col-span-2'
                      }
                    >
                      <label className="ml-1 mb-1 block text-[10px] font-bold uppercase text-slate-400">
                        {field.label}
                      </label>
                      <input
                        type={field.type || 'text'}
                        className={iaInputClassName}
                        placeholder={field.placeholder}
                        min={field.key === 'quantidade_de_produtos' ? 1 : undefined}
                        max={field.key === 'quantidade_de_produtos' ? 7 : undefined}
                        value={formData[field.key] || ''}
                        onChange={(e) =>
                          handleChange(field.key, e.target.value)
                        }
                        onKeyDown={handleKeyDown}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {showManualAuthFields ? (
              <div className="px-1 pb-1">
                {manualAuthMessage ? (
                  <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    {manualAuthMessage}
                  </div>
                ) : null}
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Código de autenticação
                </label>
                <div className={showIaContextField ? '' : 'grid gap-3 sm:grid-cols-2'}>
                  <input
                    type="text"
                    className={`${iaInputClassName} ${
                      showIaContextField ? '' : 'sm:col-span-2'
                    }`}
                    placeholder="Informe o código de autenticação do seu usuário"
                    value={formData['code'] || ''}
                    onChange={(e) => handleChange('code', e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>
            ) : null}
          </div>

          {showIaContextField ? (
            <div className="flex h-full min-h-[300px] flex-col">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                {template?.contextLabel || 'Prompt do Sistema (Contexto)'}
              </label>
              <textarea
                className="custom-scrollbar flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed outline-none shadow-inner focus:ring-2 focus:ring-violet-500"
                placeholder={
                  template?.contextPlaceholder || 'Digite o prompt do sistema...'
                }
                value={formData['context'] || ''}
                onChange={(e) => handleChange('context', e.target.value)}
              />
            </div>
          ) : null}
        </div>
      </form>
    );
  }

  return (
    <form className="mb-6 space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Instancia
        </label>
        <input
          type="text"
          className="w-full rounded-lg border border-gray-300 bg-gray-100 p-2 outline-none transition-colors focus:ring-2 focus:ring-blue-500"
          placeholder="https://sua-instancia.com"
          value={formData['instanceURL'] || ''}
          onChange={(e) => handleChange('instanceURL', e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {template?.fields?.map((field) => (
        <div key={field.key}>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {field.label}
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-gray-300 bg-gray-100 p-2 outline-none transition-colors focus:ring-2 focus:ring-blue-500"
            value={formData[field.key] || ''}
            onChange={(e) => handleChange(field.key, e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
      ))}

      {showManualAuthFields ? (
        <div className="space-y-2">
          {manualAuthMessage ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {manualAuthMessage}
            </div>
          ) : null}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Código de autenticação
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 bg-gray-100 p-2 outline-none transition-colors focus:ring-2 focus:ring-blue-500"
              placeholder="Informe o código de autenticação do seu usuário"
              value={formData['code'] || ''}
              onChange={(e) => handleChange('code', e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>
      ) : null}
    </form>
  );
}
