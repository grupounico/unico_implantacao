import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import MessageInput from '../../components/LinkAi/MessageInput';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  sendChatMessageStream,
  type ChatAction,
  type ChatHistoryItem,
  type ChatResponse,
  type ChatTraceStep,
} from '../../services/linkAi.service';
import { getAuthSession } from '../../utils/authSession';
import { extractErrorMessage } from '../../utils/error';
import MessageComponent from './MessageComponent';

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  action?: ChatAction | null;
  actions?: ChatAction[];
  trace?: ChatTraceStep[];
  animate?: boolean;
};

type ChatConversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  draft: string;
};

type StoredConversationState = {
  conversations: ChatConversation[];
  activeConversationId: string;
};

const INITIAL_MESSAGE: ChatMessage = {
  id: 'assistant-welcome',
  role: 'assistant',
  content: 'Ola, sou o Link AI. Como posso ajudar hoje?',
  action: null,
  actions: [],
  trace: [],
  animate: false,
};

const LEGACY_CHAT_STORAGE_PREFIX = 'link-ai-chat-v1';
const LEGACY_DRAFT_STORAGE_PREFIX = 'link-ai-chat-draft-v1';
const CONVERSATIONS_STORAGE_PREFIX = 'link-ai-conversations-v1';
const ACTIVE_CONVERSATION_STORAGE_PREFIX = 'link-ai-active-conversation-v1';
const MAX_PERSISTED_MESSAGES = 50;
const MAX_CONVERSATIONS = 30;
const DEFAULT_CONVERSATION_TITLE = 'Nova conversa';

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getStorageSuffix() {
  const session = getAuthSession();
  return session?.authUsername || session?.username || 'guest';
}

function normalizeTimestamp(value: unknown, fallbackValue: string) {
  if (typeof value !== 'string') {
    return fallbackValue;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? fallbackValue : new Date(timestamp).toISOString();
}

function buildConversationTitleFromMessage(content = '') {
  const normalizedContent = String(content).replace(/\s+/g, ' ').trim();

  if (!normalizedContent) {
    return DEFAULT_CONVERSATION_TITLE;
  }

  if (normalizedContent.length <= 48) {
    return normalizedContent;
  }

  return `${normalizedContent.slice(0, 45).trimEnd()}...`;
}

function sanitizeStoredMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) {
    return [INITIAL_MESSAGE];
  }

  const messages = value
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const message = item as Partial<ChatMessage>;

      return {
        id: typeof message.id === 'string' ? message.id : createId('restored'),
        role: message.role === 'user' ? 'user' : 'assistant',
        content: typeof message.content === 'string' ? message.content : '',
        action:
          message.action && typeof message.action === 'object'
            ? message.action
            : null,
        actions: Array.isArray(message.actions)
          ? message.actions.filter(
              (action) => action && typeof action === 'object' && typeof action.url === 'string',
            )
          : [],
        trace: Array.isArray(message.trace) ? message.trace : [],
        animate: false,
      } satisfies ChatMessage;
    })
    .filter((message) => message.content.trim())
    .slice(-MAX_PERSISTED_MESSAGES);

  return messages.length ? messages : [INITIAL_MESSAGE];
}

function createConversation(overrides: Partial<ChatConversation> = {}): ChatConversation {
  const now = new Date().toISOString();
  const messages = overrides.messages
    ? sanitizeStoredMessages(overrides.messages)
    : [INITIAL_MESSAGE];
  const firstUserMessage = messages.find((message) => message.role === 'user')?.content || '';
  const createdAt = normalizeTimestamp(overrides.createdAt, now);
  const updatedAt = normalizeTimestamp(overrides.updatedAt, createdAt);

  return {
    id:
      typeof overrides.id === 'string' && overrides.id.trim()
        ? overrides.id
        : createId('conversation'),
    title:
      typeof overrides.title === 'string' && overrides.title.trim()
        ? overrides.title.trim()
        : buildConversationTitleFromMessage(firstUserMessage),
    createdAt,
    updatedAt,
    messages,
    draft: typeof overrides.draft === 'string' ? overrides.draft : '',
  };
}

function sortConversations(conversations: ChatConversation[]) {
  return [...conversations].sort(
    (left, right) =>
      Date.parse(right.updatedAt || right.createdAt) -
      Date.parse(left.updatedAt || left.createdAt),
  );
}

function sanitizeStoredConversations(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const knownConversationIds = new Set<string>();
  const conversations: ChatConversation[] = [];

  for (const item of value) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const conversation = createConversation(item as Partial<ChatConversation>);

    if (knownConversationIds.has(conversation.id)) {
      continue;
    }

    knownConversationIds.add(conversation.id);
    conversations.push(conversation);

    if (conversations.length >= MAX_CONVERSATIONS) {
      break;
    }
  }

  return sortConversations(conversations);
}

function safeParseStoredValue<T>(rawValue: string | null, fallbackValue: T): T {
  if (!rawValue) {
    return fallbackValue;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallbackValue;
  }
}

function loadStoredMessages(storageKey: string) {
  if (typeof window === 'undefined') {
    return [INITIAL_MESSAGE];
  }

  return sanitizeStoredMessages(
    safeParseStoredValue(window.localStorage.getItem(storageKey), [INITIAL_MESSAGE]),
  );
}

function loadStoredDraft(storageKey: string) {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(storageKey) || '';
}

function loadConversationState({
  conversationsStorageKey,
  activeConversationStorageKey,
  legacyChatStorageKey,
  legacyDraftStorageKey,
}: {
  conversationsStorageKey: string;
  activeConversationStorageKey: string;
  legacyChatStorageKey: string;
  legacyDraftStorageKey: string;
}): StoredConversationState {
  const fallbackConversation = createConversation();

  if (typeof window === 'undefined') {
    return {
      conversations: [fallbackConversation],
      activeConversationId: fallbackConversation.id,
    };
  }

  const storedConversations = sanitizeStoredConversations(
    safeParseStoredValue(window.localStorage.getItem(conversationsStorageKey), []),
  );

  if (storedConversations.length) {
    const storedActiveConversationId =
      window.localStorage.getItem(activeConversationStorageKey) || storedConversations[0].id;

    return {
      conversations: storedConversations,
      activeConversationId: storedConversations.some(
        (conversation) => conversation.id === storedActiveConversationId,
      )
        ? storedActiveConversationId
        : storedConversations[0].id,
    };
  }

  const legacyMessages = loadStoredMessages(legacyChatStorageKey);
  const legacyDraft = loadStoredDraft(legacyDraftStorageKey);
  const hasLegacyConversation =
    legacyDraft.trim().length > 0 ||
    legacyMessages.some(
      (message) =>
        message.role === 'user' ||
        (message.role === 'assistant' && message.content !== INITIAL_MESSAGE.content),
    );

  if (hasLegacyConversation) {
    const migratedConversation = createConversation({
      messages: legacyMessages,
      draft: legacyDraft,
    });

    return {
      conversations: [migratedConversation],
      activeConversationId: migratedConversation.id,
    };
  }

  return {
    conversations: [fallbackConversation],
    activeConversationId: fallbackConversation.id,
  };
}

function buildPreviewSteps(message: string) {
  const normalizedMessage = message.toLowerCase();
  const isBuildRequest =
    normalizedMessage.includes('build') ||
    normalizedMessage.includes('download') ||
    normalizedMessage.includes('zip') ||
    (normalizedMessage.includes('gerar') &&
      (normalizedMessage.includes('app') ||
        normalizedMessage.includes('aplicacao') ||
        normalizedMessage.includes('projeto')));

  if (isBuildRequest) {
    return ['Criando o build da aplicacao.'];
  }

  if (
    normalizedMessage.includes('integracao') ||
    normalizedMessage.includes('instalar')
  ) {
    return ['Preparando a integracao solicitada.'];
  }

  if (
    normalizedMessage.includes(' ia ') ||
    normalizedMessage.startsWith('ia ') ||
    normalizedMessage.includes('assistente') ||
    normalizedMessage.includes('criar ia')
  ) {
    return ['Configurando a IA solicitada.'];
  }

  return [];
}

function mapMessagesToHistory(messages: ChatMessage[]): ChatHistoryItem[] {
  return messages
    .filter((message) => message.content.trim())
    .map((message) => ({
      role: message.role,
      content: message.content,
    }))
    .slice(-10);
}

function ConversationsToggleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3.5" y="4" width="17" height="16" rx="3.5" />
      <path d="M9 4v16" />
    </svg>
  );
}

export default function LinkAi() {
  const storageSuffix = useMemo(() => getStorageSuffix(), []);
  const legacyChatStorageKey = `${LEGACY_CHAT_STORAGE_PREFIX}:${storageSuffix}`;
  const legacyDraftStorageKey = `${LEGACY_DRAFT_STORAGE_PREFIX}:${storageSuffix}`;
  const conversationsStorageKey = `${CONVERSATIONS_STORAGE_PREFIX}:${storageSuffix}`;
  const activeConversationStorageKey = `${ACTIVE_CONVERSATION_STORAGE_PREFIX}:${storageSuffix}`;
  const initialConversationState = useMemo(
    () =>
      loadConversationState({
        conversationsStorageKey,
        activeConversationStorageKey,
        legacyChatStorageKey,
        legacyDraftStorageKey,
      }),
    [
      activeConversationStorageKey,
      conversationsStorageKey,
      legacyChatStorageKey,
      legacyDraftStorageKey,
    ],
  );
  const [conversationState, setConversationState] = useState<StoredConversationState>(
    initialConversationState,
  );
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [composerHeight, setComposerHeight] = useState(108);
  const [isSending, setIsSending] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
  const [visibleThinkingSteps, setVisibleThinkingSteps] = useState<string[]>([]);
  const [isConversationPanelOpen, setIsConversationPanelOpen] = useState(true);
  const [conversationPendingDelete, setConversationPendingDelete] =
    useState<ChatConversation | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  useBodyScrollLock(Boolean(conversationPendingDelete));

  const conversations = conversationState.conversations;
  const activeConversation =
    conversations.find(
      (conversation) => conversation.id === conversationState.activeConversationId,
    ) || conversations[0];

  function focusComposer() {
    window.requestAnimationFrame(() => {
      messageInputRef.current?.focus();
    });
  }

  function scrollToBottom() {
    const container = scrollContainerRef.current;

    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });
  }

  useEffect(() => {
    setConversationState(initialConversationState);
  }, [initialConversationState]);

  useEffect(() => {
    if (!activeConversation) {
      return;
    }

    if (conversationState.activeConversationId === activeConversation.id) {
      return;
    }

    setConversationState((currentValue) => ({
      ...currentValue,
      activeConversationId: activeConversation.id,
    }));
  }, [activeConversation, conversationState.activeConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [
    activeConversation?.id,
    activeConversation?.messages,
    composerHeight,
    isSending,
    visibleThinkingSteps.length,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const persistedConversations = sortConversations(conversations)
      .slice(0, MAX_CONVERSATIONS)
      .map((conversation) => ({
        ...conversation,
        draft: conversation.draft,
        messages: conversation.messages
          .map((message) => ({
            ...message,
            animate: false,
          }))
          .slice(-MAX_PERSISTED_MESSAGES),
      }));

    window.localStorage.setItem(
      conversationsStorageKey,
      JSON.stringify(persistedConversations),
    );

    if (activeConversation?.id) {
      window.localStorage.setItem(activeConversationStorageKey, activeConversation.id);
    } else {
      window.localStorage.removeItem(activeConversationStorageKey);
    }

    window.localStorage.removeItem(legacyChatStorageKey);
    window.localStorage.removeItem(legacyDraftStorageKey);
  }, [
    activeConversation?.id,
    activeConversationStorageKey,
    conversations,
    conversationsStorageKey,
    legacyChatStorageKey,
    legacyDraftStorageKey,
  ]);

  useEffect(() => {
    if (!isSending) {
      setVisibleThinkingSteps([]);
      return;
    }

    const latestStep = thinkingSteps.length
      ? thinkingSteps[thinkingSteps.length - 1]
      : '';

    setVisibleThinkingSteps(latestStep ? [latestStep] : []);
  }, [isSending, thinkingSteps]);

  useEffect(() => {
    function handleTabFocus(event: KeyboardEvent) {
      if (event.key !== 'Tab' || event.defaultPrevented) {
        return;
      }

      const activeElement = document.activeElement;
      const target = event.target as HTMLElement | null;
      const isInsideInteractiveElement = Boolean(
        target?.closest('input, textarea, button, a, [tabindex]:not([tabindex="-1"])'),
      );
      const inputElement = messageInputRef.current;

      if (
        !inputElement ||
        inputElement.disabled ||
        isInsideInteractiveElement ||
        activeElement === inputElement
      ) {
        return;
      }

      event.preventDefault();
      inputElement.focus();
    }

    window.addEventListener('keydown', handleTabFocus);

    return () => {
      window.removeEventListener('keydown', handleTabFocus);
    };
  }, []);

  function updateActiveConversationDraft(nextDraft: string) {
    if (!activeConversation) {
      return;
    }

    setConversationState((currentValue) => ({
      ...currentValue,
      conversations: currentValue.conversations.map((conversation) =>
        conversation.id === activeConversation.id
          ? {
              ...conversation,
              draft: nextDraft,
            }
          : conversation,
      ),
    }));
  }

  function handleCreateConversation() {
    if (isSending) {
      return;
    }

    const nextConversation = createConversation();

    setConversationState((currentValue) => ({
      conversations: [nextConversation, ...currentValue.conversations].slice(
        0,
        MAX_CONVERSATIONS,
      ),
      activeConversationId: nextConversation.id,
    }));

    focusComposer();
  }

  function handleSelectConversation(conversationId: string) {
    if (isSending || conversationId === activeConversation?.id) {
      return;
    }

    setConversationState((currentValue) => ({
      ...currentValue,
      activeConversationId: conversationId,
    }));

    focusComposer();
  }

  function handleDeleteConversation(conversationId: string) {
    if (isSending) {
      return;
    }

    const conversationToDelete = conversations.find(
      (conversation) => conversation.id === conversationId,
    );

    if (!conversationToDelete) {
      return;
    }

    setConversationPendingDelete(conversationToDelete);
  }

  function confirmDeleteConversation() {
    if (!conversationPendingDelete) {
      return;
    }

    const conversationId = conversationPendingDelete.id;
    setConversationPendingDelete(null);

    setConversationState((currentValue) => {
      const remainingConversations = currentValue.conversations.filter(
        (conversation) => conversation.id !== conversationId,
      );

      if (!remainingConversations.length) {
        const replacementConversation = createConversation();

        return {
          conversations: [replacementConversation],
          activeConversationId: replacementConversation.id,
        };
      }

      return {
        conversations: remainingConversations,
        activeConversationId:
          currentValue.activeConversationId === conversationId
            ? remainingConversations[0].id
            : currentValue.activeConversationId,
      };
    });
  }

  async function handleSubmit() {
    const targetConversation = activeConversation;
    const trimmedMessage = targetConversation?.draft.trim() || '';

    if (!targetConversation || !trimmedMessage || isSending) {
      return;
    }

    const nextUserMessage: ChatMessage = {
      id: createId('user'),
      role: 'user',
      content: trimmedMessage,
      action: null,
      actions: [],
      trace: [],
      animate: false,
    };
    const optimisticMessages = [...targetConversation.messages, nextUserMessage].slice(
      -MAX_PERSISTED_MESSAGES,
    );
    const nextUpdatedAt = new Date().toISOString();
    const nextConversationTitle =
      targetConversation.title === DEFAULT_CONVERSATION_TITLE
        ? buildConversationTitleFromMessage(trimmedMessage)
        : targetConversation.title;

    setConversationState((currentValue) => ({
      ...currentValue,
      conversations: sortConversations(
        currentValue.conversations.map((conversation) =>
          conversation.id === targetConversation.id
            ? {
                ...conversation,
                title: nextConversationTitle,
                draft: '',
                updatedAt: nextUpdatedAt,
                messages: optimisticMessages,
              }
            : conversation,
        ),
      ),
    }));
    setThinkingSteps(buildPreviewSteps(trimmedMessage));
    setIsSending(true);

    try {
      const session = getAuthSession();
      let response: ChatResponse | null = null;

      await sendChatMessageStream(
        {
          message: trimmedMessage,
          history: mapMessagesToHistory(optimisticMessages),
          sessionContext: {
            authUsername: session?.authUsername,
            authPassword: session?.authPassword,
            operatorName: session?.username,
          },
        },
        {
          onEvent(event) {
            if (event.type === 'trace') {
              setThinkingSteps((currentValue) => {
                const nextSteps = [...currentValue];

                if (!nextSteps.includes(event.step.message)) {
                  nextSteps.push(event.step.message);
                }

                return nextSteps;
              });
              return;
            }

            if (event.type === 'final') {
              response = event.payload;
              return;
            }

            throw new Error(event.message || 'Falha no streaming do Link AI.');
          },
        },
      );

      if (!response) {
        throw new Error('O Link AI nao retornou resposta final.');
      }

      const finalResponse = response as ChatResponse;

      const assistantMessage: ChatMessage = {
        id: createId('assistant'),
        role: 'assistant',
        content: finalResponse.reply,
        action: finalResponse.action,
        actions: Array.isArray(finalResponse.actions) ? finalResponse.actions : [],
        trace: finalResponse.trace,
        animate: true,
      };

      setConversationState((currentValue) => ({
        ...currentValue,
        conversations: sortConversations(
          currentValue.conversations.map((conversation) =>
            conversation.id === targetConversation.id
              ? {
                  ...conversation,
                  updatedAt: new Date().toISOString(),
                  messages: [...conversation.messages, assistantMessage].slice(
                    -MAX_PERSISTED_MESSAGES,
                  ),
                }
              : conversation,
          ),
        ),
      }));
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: createId('assistant-error'),
        role: 'assistant',
        content: extractErrorMessage(
          error,
          'Nao consegui concluir a solicitacao agora.',
        ),
        action: null,
        actions: [],
        trace: [
          {
            id: createId('trace-error'),
            message: 'Falha ao processar a solicitacao no backend.',
            status: 'error',
          },
        ],
        animate: false,
      };

      setConversationState((currentValue) => ({
        ...currentValue,
        conversations: sortConversations(
          currentValue.conversations.map((conversation) =>
            conversation.id === targetConversation.id
              ? {
                  ...conversation,
                  updatedAt: new Date().toISOString(),
                  messages: [...conversation.messages, errorMessage].slice(
                    -MAX_PERSISTED_MESSAGES,
                  ),
                }
              : conversation,
          ),
        ),
      }));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      <aside
        className={`flex h-full shrink-0 flex-col overflow-hidden border-r border-border bg-foreground/[0.015] transition-[width] duration-200 ease-out ${
          isConversationPanelOpen ? 'w-[260px]' : 'w-0'
        }`}
        aria-hidden={!isConversationPanelOpen}
      >
        <div className="flex h-full w-[260px] flex-col p-3">
          <button
            type="button"
            disabled={isSending}
            onClick={handleCreateConversation}
            className="inline-flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={16} className="text-foreground/50" />
            Nova conversa
          </button>

          <p className="mt-4 px-2.5 text-[11px] font-medium text-foreground/40">
            Conversas
          </p>

          <div className="scrollbar-minimal mt-1 flex flex-1 flex-col gap-0.5 overflow-y-auto">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversation?.id;

              return (
                <div
                  key={conversation.id}
                  className={`group flex items-center rounded-lg transition-colors ${
                    isActive ? 'bg-primary/10' : 'hover:bg-foreground/[0.04]'
                  }`}
                >
                  <button
                    type="button"
                    disabled={isSending}
                    onClick={() => handleSelectConversation(conversation.id)}
                    className="min-w-0 flex-1 py-2 pl-2.5 text-left disabled:cursor-not-allowed"
                  >
                    <span
                      className={`block truncate text-sm ${
                        isActive ? 'font-medium text-primary' : 'text-foreground/75'
                      }`}
                    >
                      {conversation.title}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={isSending}
                    onClick={() => handleDeleteConversation(conversation.id)}
                    className="mr-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-foreground/30 opacity-0 transition-colors hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Excluir conversa ${conversation.title}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      <main className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3.5">
          <button
            type="button"
            onClick={() =>
              setIsConversationPanelOpen((currentValue) => !currentValue)
            }
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-foreground/50 transition-colors hover:bg-foreground/5 hover:text-foreground"
            aria-label={isConversationPanelOpen ? 'Recolher conversas' : 'Mostrar conversas'}
            aria-expanded={isConversationPanelOpen}
          >
            <ConversationsToggleIcon />
          </button>
          <h1 className="text-sm font-semibold text-foreground">Link AI</h1>
        </header>

        <section
          ref={scrollContainerRef}
          className="scrollbar-minimal mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 overflow-y-auto px-6 py-6"
          style={{
            paddingBottom: `${composerHeight + 40}px`,
          }}
        >
          {activeConversation?.messages.map((message) => (
            <MessageComponent
              key={message.id}
              role={message.role}
              content={message.content}
              action={message.action}
              actions={message.actions}
              trace={message.trace}
              animate={message.animate}
              onContentProgress={scrollToBottom}
            />
          ))}

          {isSending ? (
            <MessageComponent
              role="assistant"
              isThinking={true}
              thinkingSteps={visibleThinkingSteps}
            />
          ) : null}
        </section>

        <MessageInput
          value={activeConversation?.draft || ''}
          disabled={isSending}
          onChange={updateActiveConversationDraft}
          onSubmit={handleSubmit}
          inputRef={messageInputRef}
          onHeightChange={setComposerHeight}
        />
      </main>

      {conversationPendingDelete ? (
        <ConfirmDialog
          title="Excluir conversa?"
          description={`A conversa "${conversationPendingDelete.title}" sera removida do seu historico local.`}
          confirmText="Excluir"
          cancelText="Cancelar"
          tone="danger"
          onClose={() => setConversationPendingDelete(null)}
          onConfirm={confirmDeleteConversation}
        />
      ) : null}
    </div>
  );
}
