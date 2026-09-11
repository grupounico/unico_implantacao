import axios from 'axios';

const API_BASE = import.meta.env.VITE_URLBASE || 'https://unicocontato.tech';

export type AiComponentKey =
  | 'assistant'
  | 'downloadImagem'
  | 'buscaProdutos'
  | 'gerarCheckout'
  | 'transferirHumano'
  | 'ura'
  | 'uraAb'
  | 'preProcess';

export interface AiInstallationItem {
  id: number;
  instance: string;
  provider: string;
  assistantId: string | null;
  assistantName: string | null;
  installedVersion: number | null;
  currentVersion: number | null;
  updateAvailable: boolean;
  canUpdate: boolean;
  source: string;
  configSnapshot: Record<string, unknown> | null;
  preProcessId: string | null;
  buscaProdutosId: string | null;
  downloadImagemId: string | null;
  gerarCheckoutId: string | null;
  transferirHumanoId: string | null;
  uraIaId: string | null;
  uraAbId: string | null;
  lastSyncStatus: string;
  lastSyncError: string | null;
  installedComponentVersions: Partial<Record<AiComponentKey, number>> | null;
  currentComponentVersions: Partial<Record<AiComponentKey, number>> | null;
  componentsNeedingUpdate: AiComponentKey[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAiInstallationInput {
  id: number;
  requestedBy?: string;
  code?: string;
  componentKey?: AiComponentKey;
  force?: boolean;
}

export interface UpdateAiInstallationResult {
  updated: boolean;
  message: string;
  installation?: AiInstallationItem;
  updatedComponents?: AiComponentKey[];
}

export interface ReconfigureAiInstallationInput {
  id: number;
  requestedBy?: string;
  code?: string;
  assistantId?: string;
  assistantName?: string;
  preProcessId?: string;
  buscaProdutosId?: string;
  downloadImagemId?: string;
  gerarCheckoutId?: string;
  transferirHumanoId?: string;
  uraIaId?: string;
  uraAbId?: string;
  configSnapshot?: Record<string, unknown>;
  applyToClient?: boolean;
  applyUraPatch?: boolean;
}

export interface ReconfigureAiInstallationResult {
  updated: boolean;
  appliedToClient: boolean;
  message: string;
  installation?: AiInstallationItem;
  updatedComponents?: string[];
}

export interface UpdateAllAiInstallationsInput {
  requestedBy?: string;
  code?: string;
  instance?: string;
  provider?: string;
  componentKey?: AiComponentKey;
  force?: boolean;
}

export interface UpdateAllAiInstallationsResultItem {
  id: number;
  instance: string;
  provider: string;
  assistantName: string | null;
  updated: boolean;
  success: boolean;
  message: string;
  updatedComponents?: AiComponentKey[];
}

export interface UpdateAllAiInstallationsResult {
  total: number;
  updated: number;
  failed: number;
  skipped: number;
  results: UpdateAllAiInstallationsResultItem[];
}

export async function fetchAiInstallations(params?: {
  limit?: number;
  instance?: string;
  provider?: string;
}): Promise<AiInstallationItem[]> {
  const response = await axios.get(`${API_BASE}/api/ia/installations`, {
    params,
  });

  return response.data?.data ?? [];
}

export async function updateAiInstallation(
  input: UpdateAiInstallationInput,
): Promise<UpdateAiInstallationResult> {
  const response = await axios.post(
    `${API_BASE}/api/ia/installations/${input.id}/update`,
    {
      requestedBy: input.requestedBy,
      code: input.code,
      componentKey: input.componentKey,
      force: input.force ?? false,
    },
  );

  return response.data;
}

export async function updateAllAiInstallations(
  input: UpdateAllAiInstallationsInput,
): Promise<UpdateAllAiInstallationsResult> {
  const response = await axios.post(
    `${API_BASE}/api/ia/installations/update-all`,
    {
      requestedBy: input.requestedBy,
      code: input.code,
      instance: input.instance,
      provider: input.provider,
      componentKey: input.componentKey,
      force: input.force ?? false,
    },
  );

  return response.data;
}

export async function reconfigureAiInstallation(
  input: ReconfigureAiInstallationInput,
): Promise<ReconfigureAiInstallationResult> {
  const response = await axios.post(
    `${API_BASE}/api/ia/installations/${input.id}/reconfigure`,
    {
      requestedBy: input.requestedBy,
      code: input.code,
      assistantId: input.assistantId,
      assistantName: input.assistantName,
      preProcessId: input.preProcessId,
      buscaProdutosId: input.buscaProdutosId,
      downloadImagemId: input.downloadImagemId,
      gerarCheckoutId: input.gerarCheckoutId,
      transferirHumanoId: input.transferirHumanoId,
      uraIaId: input.uraIaId,
      uraAbId: input.uraAbId,
      configSnapshot: input.configSnapshot,
      applyToClient: input.applyToClient ?? false,
      applyUraPatch: input.applyUraPatch ?? true,
    },
  );

  return response.data;
}
