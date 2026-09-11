import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bot,
  Code2,
  History,
  Layers3,
  Maximize2,
  RefreshCcw,
  Save,
  Search,
  Sparkles,
  UploadCloud,
  Workflow,
  Trash2,
} from 'lucide-react';
import { ModalFrame } from '../../components/ModalFrame';
import { useRequireAuth } from '../../hooks/useAuthRedirect';
import { templates } from '../../data/templates_ia';
import {
  discardAiTemplateWorkspaceDraft,
  fetchAiTemplateWorkspace,
  fetchAiTemplateWorkspaces,
  type AiTemplateReleaseScope,
  releaseAiTemplateWorkspaceDraft,
  rollbackAiTemplateWorkspace,
  saveAiTemplateWorkspaceDraft,
  type AiProviderTemplatePackageItem,
  type AiTemplateBaseItem,
  type AiTemplateWorkspace,
  type AiTemplateWorkspaceSummary,
} from '../../services/aiTemplateManager.service';
import type { AiComponentKey } from '../../services/aiInstallations.service';
import { extractErrorMessage } from '../../utils/error';

type ProviderDraft = {
  baseTemplateName: string;
  templateName: string;
  contentType: string;
  sourcePath: string | null;
  baseTemplateContent: string;
  assistantTemplate: string;
  preProcessTemplate: string;
  buscaProdutosTemplate: string;
  downloadImagemTemplate: string;
  gerarCheckoutTemplate: string;
  transferirHumanoTemplate: string;
  uraTemplate: string;
  uraAbTemplate: string;
};

type TabType = 'dashboard' | 'base' | 'flows' | 'history';
type DraftSaveScope = 'all' | 'base' | AiComponentKey;
type FullscreenEditorState =
  | {
      mode: 'base';
      title: string;
      field: 'baseTemplateContent';
      initialValue: string;
    }
  | {
      mode: 'flow';
      title: string;
      field: keyof Omit<
        ProviderDraft,
        | 'baseTemplateName'
        | 'templateName'
        | 'contentType'
        | 'sourcePath'
        | 'baseTemplateContent'
      >;
      initialValue: string;
    }
  | null;

const COMPONENT_EDITORS: Array<{
  key: keyof Omit<
    ProviderDraft,
    | 'baseTemplateName'
    | 'templateName'
    | 'contentType'
    | 'sourcePath'
    | 'baseTemplateContent'
  >;
  componentKey: AiComponentKey;
  label: string;
  description: string;
}> = [
  {
    key: 'assistantTemplate',
    componentKey: 'assistant',
    label: 'Template Principal',
    description: 'Prompt e configuração central.',
  },
  {
    key: 'preProcessTemplate',
    componentKey: 'preProcess',
    label: 'Pré-processamento',
    description: 'Limpeza de contexto antes da execução.',
  },
  {
    key: 'buscaProdutosTemplate',
    componentKey: 'buscaProdutos',
    label: 'Busca de Produtos',
    description: 'Fluxo para consultas e produtos.',
  },
  {
    key: 'downloadImagemTemplate',
    componentKey: 'downloadImagem',
    label: 'Download de Imagem',
    description: 'Captura e preparação de imagens.',
  },
  {
    key: 'gerarCheckoutTemplate',
    componentKey: 'gerarCheckout',
    label: 'Gerar Checkout',
    description: 'Fluxo de montagem e geração do checkout.',
  },
  {
    key: 'transferirHumanoTemplate',
    componentKey: 'transferirHumano',
    label: 'Transferir Humano',
    description: 'Fluxo de transferência para atendimento humano.',
  },
  {
    key: 'uraTemplate',
    componentKey: 'ura',
    label: 'URA IA',
    description: 'Fluxo principal de URA.',
  },
  {
    key: 'uraAbTemplate',
    componentKey: 'uraAb',
    label: 'URA AB',
    description: 'Fluxo complementar de apoio.',
  },
];

const AUTOMATIC_VARIABLES = [
  'instance',
  'name',
  'username',
  'password',
  'code',
  'assistantId',
  'preProcessId',
  'buscaProdutosId',
  'downloadImagemId',
  'gerarCheckoutId',
  'transferirHumanoId',
  'uraIaId',
  'uraAbId',
];

const COMPONENT_AUTOMATIC_VARIABLES: Partial<Record<AiComponentKey, string>> = {
  preProcess: 'preProcessId',
  buscaProdutos: 'buscaProdutosId',
  downloadImagem: 'downloadImagemId',
  gerarCheckout: 'gerarCheckoutId',
  transferirHumano: 'transferirHumanoId',
  ura: 'uraIaId',
  uraAb: 'uraAbId',
};

const COMPONENT_LABELS: Record<AiComponentKey, string> = {
  assistant: 'template principal',
  preProcess: 'pré-processamento',
  buscaProdutos: 'busca de produtos',
  downloadImagem: 'download de imagem',
  gerarCheckout: 'gerar checkout',
  transferirHumano: 'transferir humano',
  ura: 'URA IA',
  uraAb: 'URA AB',
};

const COMPONENT_FIELD_BY_KEY: Record<
  AiComponentKey,
  keyof Omit<
    ProviderDraft,
    | 'baseTemplateName'
    | 'templateName'
    | 'contentType'
    | 'sourcePath'
    | 'baseTemplateContent'
  >
> = {
  assistant: 'assistantTemplate',
  preProcess: 'preProcessTemplate',
  buscaProdutos: 'buscaProdutosTemplate',
  downloadImagem: 'downloadImagemTemplate',
  gerarCheckout: 'gerarCheckoutTemplate',
  transferirHumano: 'transferirHumanoTemplate',
  ura: 'uraTemplate',
  uraAb: 'uraAbTemplate',
};

function emptyDraft(): ProviderDraft {
  return {
    baseTemplateName: '',
    templateName: '',
    contentType: 'json-template',
    sourcePath: null,
    baseTemplateContent: '',
    assistantTemplate: '',
    preProcessTemplate: '',
    buscaProdutosTemplate: '',
    downloadImagemTemplate: '',
    gerarCheckoutTemplate: '',
    transferirHumanoTemplate: '',
    uraTemplate: '',
    uraAbTemplate: '',
  };
}

function buildDraftFromWorkspace(
  workspace: AiTemplateWorkspace | null,
): ProviderDraft {
  if (!workspace) return emptyDraft();
  if (workspace.draft) {
    return { ...workspace.draft };
  }
  return {
    baseTemplateName: workspace.baseCurrent?.templateName || '',
    templateName: workspace.packageCurrent?.templateName || '',
    contentType: workspace.baseCurrent?.contentType || 'json-template',
    sourcePath: workspace.baseCurrent?.sourcePath || null,
    baseTemplateContent: workspace.baseCurrent?.templateContent || '',
    assistantTemplate: workspace.packageCurrent?.assistantTemplate || '',
    preProcessTemplate: workspace.packageCurrent?.preProcessTemplate || '',
    buscaProdutosTemplate:
      workspace.packageCurrent?.buscaProdutosTemplate || '',
    downloadImagemTemplate:
      workspace.packageCurrent?.downloadImagemTemplate || '',
    gerarCheckoutTemplate:
      workspace.packageCurrent?.gerarCheckoutTemplate || '',
    transferirHumanoTemplate:
      workspace.packageCurrent?.transferirHumanoTemplate || '',
    uraTemplate: workspace.packageCurrent?.uraTemplate || '',
    uraAbTemplate: workspace.packageCurrent?.uraAbTemplate || '',
  };
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getProviderDisplayInfo(provider: string) {
  const template = templates[provider as keyof typeof templates];
  return {
    displayName: template?.name || provider,
    description:
      template?.description || 'Provider gerenciado para instalação.',
    fields: template?.fields || [],
  };
}

function getSupportedFlowEditors(supportedComponents: AiComponentKey[]) {
  const supportedSet = new Set(supportedComponents);
  return COMPONENT_EDITORS.filter((item) =>
    supportedSet.has(item.componentKey),
  );
}

function areDraftsDifferent(left: ProviderDraft, right: ProviderDraft) {
  return Object.keys(left).some(
    (key) =>
      left[key as keyof ProviderDraft] !== right[key as keyof ProviderDraft],
  );
}

function isBaseDraftDifferent(left: ProviderDraft, right: ProviderDraft) {
  return (
    left.baseTemplateName !== right.baseTemplateName ||
    left.contentType !== right.contentType ||
    left.sourcePath !== right.sourcePath ||
    left.baseTemplateContent !== right.baseTemplateContent
  );
}

function isFlowDraftDifferent(
  left: ProviderDraft,
  right: ProviderDraft,
  flowKey: AiComponentKey,
) {
  const field = COMPONENT_FIELD_BY_KEY[flowKey];
  return (
    left.templateName !== right.templateName || left[field] !== right[field]
  );
}

function VersionHistoryBlock({
  title,
  rows,
  currentVersion,
  onRollback,
}: {
  title: string;
  rows: Array<AiTemplateBaseItem | AiProviderTemplatePackageItem>;
  currentVersion: number | null;
  onRollback: (version: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3 font-semibold text-slate-700">
        {title}
      </div>
      <div className="p-2">
        {rows.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">
            Sem histórico.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.slice(0, 8).map((item) => (
              <li
                key={item.version}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/50"
              >
                <div>
                  <div className="flex items-center gap-2 font-medium text-slate-900">
                    v{item.version}
                    {currentVersion === item.version && (
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-700">
                        Atual
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatDate(item.updatedAt)}
                  </div>
                </div>
                {currentVersion !== item.version && (
                  <button
                    onClick={() => onRollback(item.version)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  >
                    Restaurar
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function AiTemplateManagerPage() {
  const navigate = useNavigate();
  const [workspaceSummaries, setWorkspaceSummaries] = useState<
    AiTemplateWorkspaceSummary[]
  >([]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [workspace, setWorkspace] = useState<AiTemplateWorkspace | null>(null);
  const [draft, setDraft] = useState<ProviderDraft>(emptyDraft);
  const [search, setSearch] = useState('');

  // UX State
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [activeFlowKey, setActiveFlowKey] =
    useState<AiComponentKey>('assistant');
  const [fullscreenEditor, setFullscreenEditor] =
    useState<FullscreenEditorState>(null);

  // Loading & Actions State
  const [loadingList, setLoadingList] = useState(false);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [error, setError] = useState('');
  const [flashMessage, setFlashMessage] = useState('');

  useRequireAuth();

  const baseDraft = useMemo(
    () => buildDraftFromWorkspace(workspace),
    [workspace],
  );
  const hasLocalChanges = useMemo(
    () => areDraftsDifferent(draft, baseDraft),
    [draft, baseDraft],
  );
  const hasBaseLocalChanges = useMemo(
    () => isBaseDraftDifferent(draft, baseDraft),
    [draft, baseDraft],
  );
  const hasActiveFlowLocalChanges = useMemo(
    () => isFlowDraftDifferent(draft, baseDraft, activeFlowKey),
    [draft, baseDraft, activeFlowKey],
  );

  const providerCards = useMemo(() => {
    const term = search.trim().toLowerCase();
    return workspaceSummaries
      .map((item) => ({ ...item, ...getProviderDisplayInfo(item.provider) }))
      .filter(
        (item) =>
          !term ||
          [item.provider, item.displayName]
            .join(' ')
            .toLowerCase()
            .includes(term),
      );
  }, [search, workspaceSummaries]);

  const selectedCard = useMemo(() => {
    if (!selectedProvider) return null;
    const summary = workspaceSummaries.find(
      (item) => item.provider === selectedProvider,
    );
    if (!summary) return null;

    return {
      ...summary,
      ...getProviderDisplayInfo(selectedProvider),
    };
  }, [selectedProvider, workspaceSummaries]);

  const supportedComponents = useMemo(
    () => workspace?.supportedComponents || [],
    [workspace],
  );
  const supportedFlowEditors = useMemo(
    () => getSupportedFlowEditors(supportedComponents),
    [supportedComponents],
  );
  const automaticVariables = useMemo(() => {
    const dynamicVariables = supportedComponents
      .map((componentKey) => COMPONENT_AUTOMATIC_VARIABLES[componentKey])
      .filter(Boolean) as string[];

    return Array.from(
      new Set([...AUTOMATIC_VARIABLES.slice(0, 6), ...dynamicVariables]),
    );
  }, [supportedComponents]);

  const loadWorkspace = useCallback(async (provider: string) => {
    if (!provider) return;
    setLoadingWorkspace(true);
    setError('');
    try {
      const data = await fetchAiTemplateWorkspace(provider);
      setWorkspace(data);
      setDraft(buildDraftFromWorkspace(data));
      setSelectedProvider(provider);
      setActiveTab('dashboard'); // Reset tab on provider change
    } catch (err) {
      setError(extractErrorMessage(err, 'Falha ao carregar o workspace.'));
    } finally {
      setLoadingWorkspace(false);
    }
  }, []);

  const loadSummaries = useCallback(
    async (preferredProvider?: string) => {
      setLoadingList(true);
      setError('');
      try {
        const data = await fetchAiTemplateWorkspaces();
        setWorkspaceSummaries(data);
        const nextProvider =
          preferredProvider ||
          selectedProvider ||
          data[0]?.provider ||
          'alpha7';
        if (nextProvider) await loadWorkspace(nextProvider);
      } catch (err) {
        setError(
          extractErrorMessage(err, 'Falha ao carregar lista de templates.'),
        );
      } finally {
        setLoadingList(false);
      }
    },
    [loadWorkspace, selectedProvider],
  );

  useEffect(() => {
    void loadSummaries();
  }, [loadSummaries]);

  useEffect(() => {
    if (!flashMessage) return;
    const timeout = window.setTimeout(() => setFlashMessage(''), 4000);
    return () => window.clearTimeout(timeout);
  }, [flashMessage]);

  useEffect(() => {
    if (!supportedFlowEditors.length) return;

    const currentFlowIsSupported = supportedFlowEditors.some(
      (item) => item.componentKey === activeFlowKey,
    );

    if (!currentFlowIsSupported) {
      setActiveFlowKey(supportedFlowEditors[0].componentKey);
    }
  }, [activeFlowKey, supportedFlowEditors]);

  function updateDraftField<K extends keyof ProviderDraft>(
    field: K,
    value: ProviderDraft[K],
  ) {
    setDraft((curr) => ({ ...curr, [field]: value }));
  }

  async function handleProviderSelection(provider: string) {
    if (provider === selectedProvider) return;
    if (hasLocalChanges) {
      if (
        !window.confirm(
          'Existem alteracoes nao salvas. Descartar e trocar de provider?',
        )
      )
        return;
    }
    await loadWorkspace(provider);
  }

  async function handleSaveDraft() {
    if (!selectedProvider || !workspace || savingDraft) return;
    setSavingDraft(true);
    setError('');
    try {
      const res = await saveAiTemplateWorkspaceDraft(selectedProvider, draft);
      setWorkspace(res.data);
      setDraft(buildDraftFromWorkspace(res.data));
      setFlashMessage(res.message);
      setWorkspaceSummaries(await fetchAiTemplateWorkspaces());
    } catch (err) {
      setError(extractErrorMessage(err, 'Falha ao salvar rascunho.'));
    } finally {
      setSavingDraft(false);
    }
  }

  function buildScopedDraftPayload(
    scope: DraftSaveScope,
  ): Partial<ProviderDraft> {
    if (scope === 'all') {
      return draft;
    }

    if (scope === 'base') {
      return {
        baseTemplateName: draft.baseTemplateName,
        contentType: draft.contentType,
        sourcePath: draft.sourcePath,
        baseTemplateContent: draft.baseTemplateContent,
      };
    }

    const field = COMPONENT_FIELD_BY_KEY[scope];
    return {
      templateName: draft.templateName,
      [field]: draft[field],
    };
  }

  async function handleSaveDraftScope(scope: DraftSaveScope) {
    if (!selectedProvider || !workspace || savingDraft) return;

    const currentDraft = draft;
    setSavingDraft(true);
    setError('');

    try {
      const res = await saveAiTemplateWorkspaceDraft(
        selectedProvider,
        buildScopedDraftPayload(scope),
      );
      setWorkspace(res.data);
      setDraft(
        scope === 'all' ? buildDraftFromWorkspace(res.data) : currentDraft,
      );
      setFlashMessage(
        scope === 'all'
          ? res.message
          : scope === 'base'
            ? 'Rascunho do template base salvo.'
            : `Rascunho do fluxo ${COMPONENT_LABELS[scope]} salvo.`,
      );
      setWorkspaceSummaries(await fetchAiTemplateWorkspaces());
    } catch (err) {
      setError(extractErrorMessage(err, 'Falha ao salvar rascunho.'));
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleDiscardDraft() {
    if (!selectedProvider || !workspace) return;
    if (
      !window.confirm(
        'Descartar o rascunho salvo e voltar ao estado de produção?',
      )
    )
      return;
    setSavingDraft(true);
    setError('');
    try {
      const res = await discardAiTemplateWorkspaceDraft(selectedProvider);
      setWorkspace(res.data);
      setDraft(buildDraftFromWorkspace(res.data));
      setFlashMessage(res.message);
      setWorkspaceSummaries(await fetchAiTemplateWorkspaces());
    } catch (err) {
      setError(extractErrorMessage(err, 'Falha ao descartar rascunho.'));
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleReleaseScope(scope: AiTemplateReleaseScope) {
    if (!selectedProvider || !workspace) return;
    if (hasLocalChanges)
      return setError('Salve o rascunho local antes de liberar para produção.');
    if (!workspace.draft) return setError('Não há rascunho para publicar.');

    const scopeLabel =
      scope === 'all'
        ? 'TODOS os fluxos e base'
        : scope === 'base'
          ? 'o Template Base'
          : `o fluxo ${COMPONENT_LABELS[scope]}`;
    if (!window.confirm(`Confirma o envio de ${scopeLabel} para produção?`))
      return;

    setReleasing(true);
    setError('');
    try {
      const res = await releaseAiTemplateWorkspaceDraft(
        selectedProvider,
        scope,
      );
      setWorkspace(res.data);
      setDraft(buildDraftFromWorkspace(res.data));
      setFlashMessage(res.message);
      setWorkspaceSummaries(await fetchAiTemplateWorkspaces());
    } catch (err) {
      setError(extractErrorMessage(err, 'Falha ao liberar produção.'));
    } finally {
      setReleasing(false);
    }
  }

  async function handleRollback(baseVersion?: number, packageVersion?: number) {
    if (!selectedProvider) return;
    if (
      !window.confirm(
        'Confirma o rollback? Isso criará uma nova versão em produção baseada no histórico.',
      )
    )
      return;
    setReleasing(true);
    setError('');
    try {
      const res = await rollbackAiTemplateWorkspace(selectedProvider, {
        baseVersion,
        packageVersion,
      });
      setWorkspace(res.data);
      setDraft(buildDraftFromWorkspace(res.data));
      setFlashMessage(res.message);
      setWorkspaceSummaries(await fetchAiTemplateWorkspaces());
    } catch (err) {
      setError(extractErrorMessage(err, 'Falha ao realizar rollback.'));
    } finally {
      setReleasing(false);
    }
  }

  // Derived state for the Flows tab
  const activeFlowData = supportedFlowEditors.find(
    (c) => c.componentKey === activeFlowKey,
  );
  const fullscreenEditorDirty = useMemo(() => {
    if (!fullscreenEditor) return false;
    return draft[fullscreenEditor.field] !== fullscreenEditor.initialValue;
  }, [draft, fullscreenEditor]);

  function openBaseFullscreenEditor() {
    setFullscreenEditor({
      mode: 'base',
      title: 'Template Base',
      field: 'baseTemplateContent',
      initialValue: draft.baseTemplateContent,
    });
  }

  function openFlowFullscreenEditor() {
    if (!activeFlowData) return;

    setFullscreenEditor({
      mode: 'flow',
      title: activeFlowData.label,
      field: activeFlowData.key,
      initialValue: draft[activeFlowData.key],
    });
  }

  function handleCloseFullscreenEditor() {
    setFullscreenEditor(null);
  }

  function handleCancelFullscreenEditor() {
    if (!fullscreenEditor) return;
    updateDraftField(fullscreenEditor.field, fullscreenEditor.initialValue);
    setFullscreenEditor(null);
  }

  function handleSaveFullscreenEditor() {
    if (!fullscreenEditorDirty) {
      setFullscreenEditor(null);
      return;
    }

    setFullscreenEditor((current) =>
      current
        ? {
            ...current,
            initialValue: draft[current.field],
          }
        : null,
    );
    setFullscreenEditor(null);
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* Top Navigation Bar - Clean & Minimal */}
      <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/main/iaPage/list')}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            title="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <h1 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Layers3 className="h-4 w-4 text-violet-600" />
            Workspace de Templates da IA
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {flashMessage && (
            <span className="mr-4 text-xs font-medium text-emerald-600 animate-pulse">
              {flashMessage}
            </span>
          )}
          {error && (
            <span className="mr-4 text-xs font-medium text-red-600">
              {error}
            </span>
          )}

        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Left Sidebar - Providers List */}
        <aside className="flex w-72 flex-col border-r border-slate-200 bg-white">
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar provider..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar">
            <div className="space-y-1">
              {providerCards.map((item) => {
                const isActive = item.provider === selectedProvider;
                return (
                  <button
                    key={item.provider}
                    onClick={() => void handleProviderSelection(item.provider)}
                    className={`flex w-full flex-col gap-1 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      isActive
                        ? 'bg-violet-50 text-violet-900'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-bold ${isActive ? 'text-violet-900' : 'text-slate-900'}`}
                      >
                        {item.displayName}
                      </span>
                      {item.hasDraftChanges && (
                        <div
                          className="h-2 w-2 rounded-full bg-amber-400"
                          title="Rascunho pendente"
                        />
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {item.provider}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main Workspace Area */}
        <main className="flex min-w-0 flex-1 flex-col bg-slate-50">
          {workspace && selectedCard ? (
            <>
              {/* Workspace Header & Actions */}
              <div className="z-10 border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {selectedCard.displayName}
                    </h2>
                    <div className="mt-1.5 flex items-center gap-3 text-xs font-medium">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 ${
                          hasLocalChanges
                            ? 'border-amber-200 bg-amber-50 text-amber-700'
                            : 'border-slate-200 bg-slate-100 text-slate-600'
                        }`}
                      >
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${
                            hasLocalChanges ? 'bg-amber-500' : 'bg-slate-400'
                          }`}
                        />
                        {hasLocalChanges
                          ? 'Modificado na tela'
                          : 'Sincronizado com rascunho'}
                      </span>
                      <span className="text-slate-400">|</span>
                      <span
                        className={`${
                          workspace.hasDraftChanges
                            ? 'font-semibold text-blue-600'
                            : 'text-slate-600'
                        }`}
                      >
                        {workspace.hasDraftChanges
                          ? 'Rascunho difere de Produção'
                          : 'Rascunho = Produção'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="group relative flex items-center justify-center">
                      <button
                        onClick={() => void handleDiscardDraft()}
                        disabled={!workspace.draft || savingDraft || releasing}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-slate-200 active:scale-95 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 translate-y-1 whitespace-nowrap rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
                        Descartar rascunho
                        <div className="absolute -top-1 right-3 h-2 w-2 rotate-45 bg-slate-800 sm:left-1/2 sm:right-auto sm:-translate-x-1/2" />
                      </div>
                    </div>

                    <div className="group relative flex items-center justify-center">
                      <button
                        onClick={() => void handleSaveDraft()}
                        disabled={!hasLocalChanges || savingDraft || releasing}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600 shadow-sm transition-all hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300 active:scale-95 disabled:opacity-50"
                      >
                        <Save
                          className={`h-4 w-4 ${savingDraft ? 'animate-pulse' : ''}`}
                        />
                      </button>
                      <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 translate-y-1 whitespace-nowrap rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
                        Salvar tudo
                        <div className="absolute -top-1 right-3 h-2 w-2 rotate-45 bg-slate-800 sm:left-1/2 sm:right-auto sm:-translate-x-1/2" />
                      </div>
                    </div>

                    <div className="group relative flex items-center justify-center">
                      <button
                        onClick={() => void handleReleaseScope('all')}
                        disabled={
                          !workspace.draft ||
                          savingDraft ||
                          releasing ||
                          hasLocalChanges
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-sm transition-all hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-300 active:scale-95 disabled:opacity-50"
                      >
                        <UploadCloud
                          className={`h-4 w-4 ${releasing ? 'animate-pulse' : ''}`}
                        />
                      </button>
                      <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 translate-y-1 whitespace-nowrap rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
                        Liberar tudo para produção
                        <div className="absolute -top-1 right-3 h-2 w-2 rotate-45 bg-slate-800 sm:left-1/2 sm:right-auto sm:-translate-x-1/2" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-6">
                  {[
                    { id: 'dashboard', label: 'Painel Geral', icon: Sparkles },
                    { id: 'base', label: 'Template Base', icon: Bot },
                    { id: 'flows', label: 'Fluxos de IA', icon: Workflow },
                    {
                      id: 'history',
                      label: 'Histórico & Variáveis',
                      icon: History,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabType)}
                      className={`group flex items-center gap-2 border-b-2 pb-3 text-sm font-semibold transition-colors ${
                        activeTab === tab.id
                          ? 'border-violet-600 text-violet-700'
                          : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                      }`}
                    >
                      <tab.icon
                        className={`h-4 w-4 ${
                          activeTab === tab.id
                            ? 'text-violet-600'
                            : 'text-slate-400 group-hover:text-slate-500'
                        }`}
                      />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'dashboard' && (
                  <div className="mx-auto max-w-4xl space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-sm font-bold text-slate-900">
                          Versões Atuais (Produção)
                        </h3>
                        <div className="space-y-4">
                          <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-sm text-slate-600">
                              Template Base
                            </span>
                            <span className="font-bold text-slate-900">
                              {workspace.baseCurrent
                                ? `v${workspace.baseCurrent.version}`
                                : 'Nenhum'}
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-sm text-slate-600">
                              Pacote de Fluxos
                            </span>
                            <span className="font-bold text-slate-900">
                              {workspace.packageCurrent
                                ? `v${workspace.packageCurrent.version}`
                                : 'Nenhum'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-sm font-bold text-slate-900">
                          Status do Rascunho Local
                        </h3>
                        <div className="space-y-4">
                          <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-sm text-slate-600">
                              Última modificação
                            </span>
                            <span className="font-medium text-slate-900">
                              {workspace.draft
                                ? formatDate(workspace.draft.updatedAt)
                                : 'Sem rascunho'}
                            </span>
                          </div>
                          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                            <strong>Como funciona:</strong> Altere os arquivos
                            nas abas <em>Template Base</em> ou <em>Fluxos</em>.
                            Salve o rascunho para garantir o progresso e clique
                            em liberar para enviar para produção.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'base' && (
                  <div className="flex h-full flex-col gap-4">
                    <div className="flex items-end justify-between">
                      <div className="flex w-full max-w-2xl gap-4">
                        <div className="flex-1 space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600">
                            Nome do Template
                          </label>
                          <input
                            value={draft.baseTemplateName}
                            onChange={(e) =>
                              updateDraftField(
                                'baseTemplateName',
                                e.target.value,
                              )
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                          />
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600">
                            Caminho de Origem (Opcional)
                          </label>
                          <input
                            value={draft.sourcePath || ''}
                            onChange={(e) =>
                              updateDraftField(
                                'sourcePath',
                                e.target.value || null,
                              )
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="group relative flex items-center justify-center">
                          <button
                            onClick={openBaseFullscreenEditor}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 active:scale-95"
                          >
                            <Maximize2 className="h-4 w-4" />
                          </button>
                          <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 translate-y-1 whitespace-nowrap rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                            Abrir editor maximizado
                            <div className="absolute -top-1 right-3 h-2 w-2 rotate-45 bg-slate-800" />
                          </div>
                        </div>

                        <div className="group relative flex items-center justify-center">
                          <button
                            onClick={() => void handleSaveDraftScope('base')}
                            disabled={
                              !hasBaseLocalChanges || savingDraft || releasing
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600 shadow-sm transition-all hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300 active:scale-95 disabled:opacity-50"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 translate-y-1 whitespace-nowrap rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                            Salvar rascunho da base
                            <div className="absolute -top-1 right-3 h-2 w-2 rotate-45 bg-slate-800" />
                          </div>
                        </div>

                        <div className="group relative flex items-center justify-center">
                          <button
                            onClick={() => void handleReleaseScope('base')}
                            disabled={
                              !workspace.draft ||
                              savingDraft ||
                              releasing ||
                              hasLocalChanges
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-sm transition-all hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-300 active:scale-95 disabled:opacity-50"
                          >
                            <UploadCloud className="h-4 w-4" />
                          </button>
                          <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 translate-y-1 whitespace-nowrap rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                            Liberar base para produção
                            <div className="absolute -top-1 right-3 h-2 w-2 rotate-45 bg-slate-800" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <textarea
                      value={draft.baseTemplateContent}
                      onChange={(e) =>
                        updateDraftField('baseTemplateContent', e.target.value)
                      }
                      className="custom-scrollbar flex-1 w-full resize-none rounded-xl border border-slate-200 bg-[#0d1117] p-4 font-mono text-[13px] leading-relaxed text-slate-50 shadow-inner outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                      spellCheck={false}
                    />
                  </div>
                )}

                {activeTab === 'flows' && (
                  <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold text-slate-700">
                          Nome do Pacote:
                        </label>
                        <input
                          value={draft.templateName}
                          onChange={(e) =>
                            updateDraftField('templateName', e.target.value)
                          }
                          className="w-64 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-violet-400"
                        />
                      </div>
                    </div>

                    <div className="flex min-h-0 flex-1">
                      <div className="w-64 overflow-y-auto border-r border-slate-100 bg-slate-50/30">
                        {supportedFlowEditors.map((comp) => (
                          <button
                            key={comp.key}
                            onClick={() => setActiveFlowKey(comp.componentKey)}
                            className={`w-full border-l-2 px-4 py-3 text-left transition-colors ${
                              activeFlowKey === comp.componentKey
                                ? 'border-violet-600 bg-violet-50/50 text-violet-900'
                                : 'border-transparent text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <div className="text-sm font-semibold">
                              {comp.label}
                            </div>
                            <div className="mt-0.5 truncate text-[10px] text-slate-500">
                              {comp.description}
                            </div>
                          </button>
                        ))}
                      </div>

                      <div className="flex flex-1 flex-col bg-slate-50 p-4">
                        {activeFlowData ? (
                          <>
                            <div className="mb-3 flex items-center justify-between">
                              <div>
                                <h3 className="font-bold text-slate-900">
                                  {activeFlowData.label}
                                </h3>
                                <p className="text-xs text-slate-500">
                                  Versão em Produção:{' '}
                                  {workspace.packageCurrent
                                    ?.componentVersions?.[activeFlowKey] ??
                                    'Sem versão'}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="group relative flex items-center justify-center">
                                  <button
                                    onClick={openFlowFullscreenEditor}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 active:scale-95"
                                  >
                                    <Maximize2 className="h-4 w-4" />
                                  </button>
                                  <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 translate-y-1 whitespace-nowrap rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                                    Abrir editor maximizado
                                    <div className="absolute -top-1 right-3 h-2 w-2 rotate-45 bg-slate-800" />
                                  </div>
                                </div>

                                <div className="group relative flex items-center justify-center">
                                  <button
                                    onClick={() =>
                                      void handleSaveDraftScope(activeFlowKey)
                                    }
                                    disabled={
                                      !hasActiveFlowLocalChanges ||
                                      savingDraft ||
                                      releasing
                                    }
                                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600 shadow-sm transition-all hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300 active:scale-95 disabled:opacity-50"
                                  >
                                    <Save className="h-4 w-4" />
                                  </button>
                                  <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 translate-y-1 whitespace-nowrap rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                                    Salvar este fluxo
                                    <div className="absolute -top-1 right-3 h-2 w-2 rotate-45 bg-slate-800" />
                                  </div>
                                </div>

                                <div className="group relative flex items-center justify-center">
                                  <button
                                    onClick={() =>
                                      void handleReleaseScope(activeFlowKey)
                                    }
                                    disabled={
                                      !workspace.draft ||
                                      savingDraft ||
                                      releasing ||
                                      hasLocalChanges
                                    }
                                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-sm transition-all hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-300 active:scale-95 disabled:opacity-50"
                                  >
                                    <UploadCloud className="h-4 w-4" />
                                  </button>
                                  <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 translate-y-1 whitespace-nowrap rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                                    Publicar este fluxo
                                    <div className="absolute -top-1 right-3 h-2 w-2 rotate-45 bg-slate-800" />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <textarea
                              value={draft[activeFlowData.key]}
                              onChange={(e) =>
                                updateDraftField(
                                  activeFlowData.key,
                                  e.target.value,
                                )
                              }
                              className="custom-scrollbar flex-1 w-full resize-none rounded-xl border border-slate-200 bg-[#0d1117] p-4 font-mono text-[13px] leading-relaxed text-slate-50 shadow-inner outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                              spellCheck={false}
                            />
                          </>
                        ) : (
                          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-sm text-slate-500">
                            Este provider não possui fluxos configuráveis nesta seção.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-2">
                    <div className="space-y-6">
                      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                          <Code2 className="h-5 w-5 text-violet-600" />
                          <h3 className="font-bold text-slate-900">
                            Variáveis de Instalação (Setup)
                          </h3>
                        </div>
                        <div className="space-y-3">
                          {selectedCard.fields.length > 0 ? (
                            selectedCard.fields.map((field) => (
                              <div
                                key={field.key}
                                className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm"
                              >
                                <span className="font-bold">{field.label}</span>
                                <div className="mt-1 text-xs text-slate-600">
                                  Key:{' '}
                                  <code className="rounded bg-slate-200 px-1">
                                    {field.key}
                                  </code>{' '}
                                  | Tipo: {field.type}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-slate-500">
                              Nenhuma variável configurável neste provider.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-violet-100 bg-violet-50 p-6">
                        <h3 className="mb-2 font-bold text-violet-900">
                          Variáveis Automáticas Injetadas
                        </h3>
                        <p className="mb-4 text-xs text-violet-700">
                          O sistema substitui essas variáveis em tempo de
                          execução.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {automaticVariables.map((v) => (
                            <span
                              key={v}
                              className="rounded border border-violet-100 bg-white px-2 py-1 font-mono text-xs text-violet-800 shadow-sm"
                            >
                              {v}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <VersionHistoryBlock
                        title="Histórico: Template Base"
                        rows={workspace.baseHistory}
                        currentVersion={workspace.baseCurrent?.version ?? null}
                        onRollback={(v) => void handleRollback(v, undefined)}
                      />
                      <VersionHistoryBlock
                        title="Histórico: Pacote de Fluxos"
                        rows={workspace.packageHistory}
                        currentVersion={
                          workspace.packageCurrent?.version ?? null
                        }
                        onRollback={(v) => void handleRollback(undefined, v)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">
              {loadingWorkspace || loadingList ? (
                <RefreshCcw className="h-8 w-8 animate-spin" />
              ) : (
                <div className="text-center">
                  <Bot className="mx-auto mb-3 h-12 w-12 opacity-20" />
                  <p>Selecione um provider no menu lateral para editar.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {fullscreenEditor ? (
        <ModalFrame
          title={`Editor Maximizado: ${fullscreenEditor.title}`}
          onClose={handleCloseFullscreenEditor}
          maxWidthClassName="max-w-[96vw]"
          panelClassName="bg-slate-950"
          bodyClassName="p-0"
          closeButtonClassName="text-slate-800 hover:bg-slate-200"
        >
          <div className="flex h-[88vh] flex-col">
            <div className="border-b border-slate-800 bg-slate-900 px-6 py-3 text-sm text-slate-300">
              <div className="flex items-center justify-between gap-4">
                <span>
                  Edite o JSON com mais espaço. As alterações feitas aqui
                  atualizam o mesmo rascunho da tela.
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCancelFullscreenEditor}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveFullscreenEditor}
                    disabled={!fullscreenEditorDirty}
                    className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Salvar alteração
                  </button>
                </div>
              </div>
            </div>
            <textarea
              value={draft[fullscreenEditor.field]}
              onChange={(event) =>
                updateDraftField(fullscreenEditor.field, event.target.value)
              }
              className="flex-1 w-full resize-none border-0 bg-slate-950 p-6 pb-15 font-mono text-[14px] leading-relaxed text-slate-100 outline-none focus:ring-0"
              spellCheck={false}
              autoFocus
            />
          </div>
        </ModalFrame>
      ) : null}
    </div>
  );
}
