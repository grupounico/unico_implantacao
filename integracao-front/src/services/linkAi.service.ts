import axios from 'axios';

export type ChatHistoryRole = 'user' | 'assistant';

export interface ChatHistoryItem {
  role: ChatHistoryRole;
  content: string;
}

export interface ChatAction {
  type: 'download' | string;
  url: string;
  label?: string;
}

export interface ChatSessionContext {
  authUsername?: string;
  authPassword?: string;
  operatorName?: string;
}

export interface ChatTraceStep {
  id: string;
  message: string;
  status: 'info' | 'success' | 'error';
}

export interface ChatResponse {
  reply: string;
  action: ChatAction | null;
  actions?: ChatAction[];
  trace: ChatTraceStep[];
}

export interface ChatStreamEventTrace {
  type: 'trace';
  step: ChatTraceStep;
}

export interface ChatStreamEventFinal {
  type: 'final';
  payload: ChatResponse;
}

export interface ChatStreamEventError {
  type: 'error';
  message: string;
  error?: string;
  trace?: ChatTraceStep[];
}

export type ChatStreamEvent =
  | ChatStreamEventTrace
  | ChatStreamEventFinal
  | ChatStreamEventError;

const LINK_AI_API_BASE = (
  import.meta.env.VITE_URLBASE || 'http://localhost:4000'
).replace(/\/+$/, '');
const LINK_AI_REQUEST_TIMEOUT_MS = 10 * 60 * 1000;

const linkAiApi = axios.create({
  baseURL: LINK_AI_API_BASE,
  timeout: LINK_AI_REQUEST_TIMEOUT_MS,
});

function resolveApiUrl(url: string) {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return new URL(url.startsWith('/') ? url : `/${url}`, `${LINK_AI_API_BASE}/`).toString();
}

export async function sendChatMessage(payload: {
  message: string;
  history: ChatHistoryItem[];
  sessionContext?: ChatSessionContext;
}) {
  const response = await linkAiApi.post<ChatResponse>('/chat', payload);

  if (response.data.action?.url) {
    response.data.action.url = resolveApiUrl(response.data.action.url);
  }

  if (Array.isArray(response.data.actions)) {
    response.data.actions = response.data.actions
      .filter((action) => action && typeof action.url === 'string')
      .map((action) => ({
        ...action,
        url: resolveApiUrl(action.url),
      }));
  }

  return response.data;
}

function normalizeChatResponsePayload(payload: ChatResponse) {
  const normalizedPayload = {
    ...payload,
    action: payload.action,
    actions: Array.isArray(payload.actions) ? payload.actions : [],
    trace: Array.isArray(payload.trace) ? payload.trace : [],
  };

  if (normalizedPayload.action?.url) {
    normalizedPayload.action.url = resolveApiUrl(normalizedPayload.action.url);
  }

  normalizedPayload.actions = normalizedPayload.actions
    .filter((action) => action && typeof action.url === 'string')
    .map((action) => ({
      ...action,
      url: resolveApiUrl(action.url),
    }));

  return normalizedPayload;
}

export async function sendChatMessageStream(
  payload: {
    message: string;
    history: ChatHistoryItem[];
    sessionContext?: ChatSessionContext;
  },
  handlers: {
    onEvent: (event: ChatStreamEvent) => void;
  },
) {
  const response = await fetch(`${LINK_AI_API_BASE}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok || !response.body) {
    const fallbackText = await response.text();
    throw new Error(fallbackText || 'Falha ao iniciar streaming do Link AI.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    let separatorIndex = buffer.indexOf('\n\n');
    while (separatorIndex !== -1) {
      const rawEvent = buffer.slice(0, separatorIndex).trim();
      buffer = buffer.slice(separatorIndex + 2);

      if (rawEvent) {
        const eventNameMatch = rawEvent.match(/^event:\s*(.+)$/m);
        const dataMatch = rawEvent.match(/^data:\s*(.+)$/m);

        if (eventNameMatch && dataMatch) {
          const eventName = eventNameMatch[1].trim();
          const data = JSON.parse(dataMatch[1]);

          if (eventName === 'trace') {
            handlers.onEvent({
              type: 'trace',
              step: data as ChatTraceStep,
            });
          } else if (eventName === 'final') {
            handlers.onEvent({
              type: 'final',
              payload: normalizeChatResponsePayload(data as ChatResponse),
            });
          } else if (eventName === 'error') {
            handlers.onEvent({
              type: 'error',
              message:
                typeof data?.message === 'string'
                  ? data.message
                  : 'Falha no streaming do Link AI.',
              error: typeof data?.error === 'string' ? data.error : undefined,
              trace: Array.isArray(data?.trace) ? data.trace : undefined,
            });
          }
        }
      }

      separatorIndex = buffer.indexOf('\n\n');
    }
  }
}
