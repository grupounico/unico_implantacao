import axios from 'axios';

const isLocalBrowser =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname);

const AI_SERVICES_BASE_URL = (
  import.meta.env.VITE_AI_SERVICES_BASE_URL ||
  (isLocalBrowser ? 'http://localhost:3100' : '/ai-services')
).replace(/\/+$/, '');

const aiServicesApi = axios.create({
  baseURL: AI_SERVICES_BASE_URL,
  timeout: 30000,
});

export type AiServiceInstanceType = 'alpha' | 'trier';
export type AiServiceIntegrity =
  | 'ok'
  | 'sem_pm2'
  | 'sem_diretorio'
  | 'inconsistente'
  | 'inexistente';

export interface AiServiceInstance {
  nome: string;
  tipo: AiServiceInstanceType;
  nome_pm2: string;
  diretorio: string;
  integridade: AiServiceIntegrity;
  status: string;
  porta: string | null;
}

export interface CreateAlphaAiServiceInstancePayload {
  tipo: 'alpha';
  nome: string;
  openai_api_key: string;
  db_host: string;
  db_port: string | number;
  db_name: string;
  db_user: string;
  db_password: string;
  unidade_negocio_id: string | number;
}

export interface CreateTrierAiServiceInstancePayload {
  tipo: 'trier';
  nome: string;
  env: {
    TRIER_TOKEN: string;
    TRIER_BASE_URL?: string;
    OPENAI_API_KEY?: string;
  };
}

export type CreateAiServiceInstancePayload =
  | CreateAlphaAiServiceInstancePayload
  | CreateTrierAiServiceInstancePayload;

export interface AiServiceInstanceStatus {
  nome: string;
  tipo: AiServiceInstanceType | null;
  nome_pm2?: string;
  diretorio?: string;
  integridade: AiServiceIntegrity;
  pm2_id: number | null;
  status: string;
  uptime: number | null;
  reinicializacoes?: number;
  memoria_mb?: number | null;
  cpu_percent?: number | null;
  porta: string | null;
}

export interface AiServiceInstanceLogs {
  nome: string;
  tipo: AiServiceInstanceType;
  linhas: string[];
}

export interface AiServiceInstanceUpdateResult {
  nome: string;
  tipo: AiServiceInstanceType;
  atualizado: boolean;
  reiniciado: boolean;
  dependencias_atualizadas: boolean;
  integridade: AiServiceIntegrity;
  commit_anterior: string;
  commit_atual: string;
  arquivos_alterados: string[];
  mensagem: string;
}

export interface AiServiceBulkUpdateItem
  extends Partial<AiServiceInstanceUpdateResult> {
  nome: string;
  tipo: AiServiceInstanceType;
  sucesso: boolean;
  erro?: string;
}

export interface AiServiceBulkUpdateResult {
  sucesso: boolean;
  tipo: AiServiceInstanceType | null;
  total: number;
  atualizadas: number;
  falhas: number;
  resultados: AiServiceBulkUpdateItem[];
}

export async function createAiServiceInstance(
  payload: CreateAiServiceInstancePayload,
) {
  const response = await aiServicesApi.post('/api/ia/criar', payload);
  return response.data;
}

export async function listAiServiceInstances(
  tipo?: AiServiceInstanceType | 'all',
): Promise<AiServiceInstance[]> {
  const response = await aiServicesApi.get('/api/ia/listar', {
    params: tipo && tipo !== 'all' ? { tipo } : undefined,
  });
  return response.data?.instancias ?? [];
}

export async function fetchAiServiceInstanceStatus(
  nome: string,
  tipo: AiServiceInstanceType,
): Promise<AiServiceInstanceStatus> {
  const response = await aiServicesApi.get(
    `/api/ia/${encodeURIComponent(tipo)}/${encodeURIComponent(nome)}/status`,
  );

  return response.data;
}

export async function fetchAiServiceInstanceLogs(
  nome: string,
  tipo: AiServiceInstanceType,
  linhas = 50,
): Promise<AiServiceInstanceLogs> {
  const response = await aiServicesApi.get(
    `/api/ia/${encodeURIComponent(tipo)}/${encodeURIComponent(nome)}/logs`,
    {
      params: { linhas },
    },
  );

  return response.data;
}

export async function restartAiServiceInstance(
  nome: string,
  tipo: AiServiceInstanceType,
) {
  const response = await aiServicesApi.post(
    `/api/ia/${encodeURIComponent(tipo)}/${encodeURIComponent(nome)}/reiniciar`,
  );

  return response.data;
}

export async function stopAiServiceInstance(
  nome: string,
  tipo: AiServiceInstanceType,
) {
  const response = await aiServicesApi.post(
    `/api/ia/${encodeURIComponent(tipo)}/${encodeURIComponent(nome)}/parar`,
  );

  return response.data;
}

export async function updateAiServiceInstance(
  nome: string,
  tipo: AiServiceInstanceType,
): Promise<AiServiceInstanceUpdateResult> {
  const response = await aiServicesApi.post(
    `/api/ia/${encodeURIComponent(tipo)}/${encodeURIComponent(nome)}/atualizar`,
  );

  return response.data;
}

export async function updateAllAiServiceInstances(
  tipo?: AiServiceInstanceType | 'all',
): Promise<AiServiceBulkUpdateResult> {
  const response = await aiServicesApi.post('/api/ia/atualizar-todas', null, {
    params: tipo && tipo !== 'all' ? { tipo } : undefined,
  });
  return response.data;
}
