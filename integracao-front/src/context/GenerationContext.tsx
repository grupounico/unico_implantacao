import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { getAuthSession } from '../utils/authSession';

const API_BASE = (import.meta.env.VITE_URLBASE || 'https://unicocontato.tech').replace(
  /\/+$/,
  '',
);

export interface PkgFormData {
  nome_cliente: string;
  db_host: string;
  db_user: string;
  db_password: string;
  db_database: string;
  access_key: string;
}

export interface TrierExtensionFormData {
  instance_url: string;
  client_token: string;
}

export interface InovaFarmaExtensionFormData {
  instance_url: string;
  storage_spreadsheet_id: string;
  budgets_spreadsheet_id: string;
}

type ProcessStatus = 'idle' | 'generating' | 'success' | 'error';
type GenerationOperation =
  | 'pkg'
  | 'trierExtension'
  | 'inovaFarmaExtension'
  | null;

interface GenerationContextData {
  status: ProcessStatus;
  feedback: string;
  isMinimized: boolean;
  operation: GenerationOperation;
  generateApp: (data: PkgFormData) => Promise<void>;
  generateTrierExtension: (data: TrierExtensionFormData) => Promise<void>;
  generateInovaFarmaExtension: (
    data: InovaFarmaExtensionFormData,
  ) => Promise<void>;
  closePopup: () => void;
  toggleMinimize: () => void;
}

interface DownloadRequestOptions {
  operation: Exclude<GenerationOperation, null>;
  endpoint: string;
  payload: Record<string, unknown>;
  startMessage: string;
  downloadingMessage: string;
  fallbackFileName: string;
}

const GenerationContext = createContext<GenerationContextData>(
  {} as GenerationContextData,
);

function buildEndpointUrl(endpoint: string) {
  return `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}

function readMessage(value: unknown): string | null {
  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized ? normalized : null;
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const data = value as Record<string, unknown>;

  return (
    readMessage(data.message) ??
    readMessage(data.error) ??
    (data.error && typeof data.error === 'object'
      ? JSON.stringify(data.error)
      : null)
  );
}

function parseFileName(contentDisposition: string | null, fallback: string) {
  if (!contentDisposition) {
    return fallback;
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);

  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const plainMatch = contentDisposition.match(/filename="?([^"]+)"?/i);

  if (plainMatch?.[1]) {
    return plainMatch[1];
  }

  return fallback;
}

async function extractResponseErrorMessage(response: Response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      return readMessage(await response.json());
    } catch {
      return null;
    }
  }

  try {
    const text = await response.text();
    return readMessage(text);
  } catch {
    return null;
  }
}

function triggerBrowserDownload(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.style.display = 'none';
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  window.URL.revokeObjectURL(url);
  window.setTimeout(() => anchor.remove(), 100);
}

export function GenerationProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ProcessStatus>('idle');
  const [feedback, setFeedback] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [operation, setOperation] = useState<GenerationOperation>(null);

  function closePopup() {
    setStatus('idle');
    setFeedback('');
    setIsMinimized(false);
    setOperation(null);
  }

  function toggleMinimize() {
    setIsMinimized((prev) => !prev);
  }

  async function requestDownloadGeneration(options: DownloadRequestOptions) {
    setOperation(options.operation);
    setStatus('generating');
    setFeedback(options.startMessage);
    setIsMinimized(false);

    try {
      const response = await fetch(buildEndpointUrl(options.endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options.payload),
      });

      if (!response.ok) {
        const message =
          (await extractResponseErrorMessage(response)) || 'Falha no servidor.';
        throw new Error(message);
      }

      setFeedback(options.downloadingMessage);

      const blob = await response.blob();
      const fileName = parseFileName(
        response.headers.get('content-disposition'),
        options.fallbackFileName,
      );

      triggerBrowserDownload(blob, fileName);

      setStatus('success');
      setFeedback(`Download concluido com sucesso: ${fileName}`);
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : 'Erro desconhecido.';
      setStatus('error');
      setFeedback(message);
    }
  }

  async function generateApp(formData: PkgFormData) {
    const session = getAuthSession();

    await requestDownloadGeneration({
      operation: 'pkg',
      endpoint: '/api/generate',
      payload: {
        ...formData,
        username: session?.username,
      },
      startMessage: 'Compilando e gerando executavel...',
      downloadingMessage: 'Baixando arquivo...',
      fallbackFileName: `app-${formData.nome_cliente || 'cliente'}.zip`,
    });
  }

  async function generateTrierExtension(formData: TrierExtensionFormData) {
    const session = getAuthSession();

    await requestDownloadGeneration({
      operation: 'trierExtension',
      endpoint: '/api/extensions/trier/generate',
      payload: {
        ...formData,
        username: session?.username,
      },
      startMessage: 'Gerando extensao Trier...',
      downloadingMessage: 'Baixando ZIP da extensao...',
      fallbackFileName: 'Trier extensao - cliente.zip',
    });
  }

  async function generateInovaFarmaExtension(
    formData: InovaFarmaExtensionFormData,
  ) {
    const session = getAuthSession();

    await requestDownloadGeneration({
      operation: 'inovaFarmaExtension',
      endpoint: '/api/extensions/inova-farma/generate',
      payload: {
        ...formData,
        username: session?.username,
      },
      startMessage: 'Gerando extensao Inova Farma...',
      downloadingMessage: 'Baixando ZIP da extensao...',
      fallbackFileName: 'Inova Farma extensao - cliente.zip',
    });
  }

  return (
    <GenerationContext.Provider
      value={{
        status,
        feedback,
        isMinimized,
        operation,
        generateApp,
        generateTrierExtension,
        generateInovaFarmaExtension,
        closePopup,
        toggleMinimize,
      }}
    >
      {children}
    </GenerationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useGeneration = () => useContext(GenerationContext);
