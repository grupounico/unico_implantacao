import { api } from './api';
import { requireAuthSession } from '../utils/authSession';

export type BancoUnicoImportStatus =
  | 'pending'
  | 'claimed'
  | 'processing'
  | 'running'
  | 'paused'
  | 'cancelling'
  | 'completed'
  | 'cancelled'
  | 'failed';

export interface BancoUnicoImportJob {
  id: number;
  clientId: number | null;
  clientName: string;
  sourceType: 'trier' | 'api' | 'file' | 'alpha7' | 'vetor' | 'automatiza';
  sourceLabel: string | null;
  status: BancoUnicoImportStatus;
  mode: 'publish' | 'classify-only';
  requestedBy: string;
  currentStage: string | null;
  currentMessage: string | null;
  progressCurrent: number;
  progressTotal: number;
  progressPercent: number;
  totalCatalogValid: number;
  totalInvalidEans: number;
  totalSampled: number;
  totalSelected: number;
  totalExisting: number;
  totalPrepared: number;
  totalSkipped: number;
  totalErrors: number;
  totalPublished: number;
  itemCount: number;
  eventCount: number;
  options: Record<string, unknown> | null;
  summary: Record<string, unknown> | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BancoUnicoImportEvent {
  id: number;
  jobId: number;
  level: 'info' | 'warning' | 'error';
  message: string;
  data: Record<string, unknown> | null;
  createdAt: string;
}

export interface BancoUnicoImportJobDetail extends BancoUnicoImportJob {
  recentEvents: BancoUnicoImportEvent[];
  isActive: boolean;
}

export interface BancoUnicoImportItem {
  id: number;
  jobId: number;
  externalKey: string;
  sourceProductId: number | null;
  ean: string | null;
  nameOriginal: string | null;
  nameNormalized: string | null;
  manufacturer: string | null;
  activeIngredient: string | null;
  status: string;
  skippedReason: string | null;
  errorStage: string | null;
  errorMessage: string | null;
  confidence: string | null;
  needsReview: boolean;
  taxonomy: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  sourcePayload: Record<string, unknown> | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface EventsResponse {
  data: BancoUnicoImportEvent[];
  meta: {
    afterId: number;
    lastId: number;
  };
}

export interface CreateBancoUnicoImportPayload {
  clientId: number;
  sourcePageSize?: number;
  sourceAtivo?: boolean;
  sourceIntegracaoEcommerce?: boolean;
  sourceProcessaCustoMedio?: boolean;
  bancoUnicoBaseUrl?: string;
  bancoUnicoAuthorization?: string;
  batchSize?: number;
  classifyConcurrency?: number;
  publishConcurrency?: number;
  existingCheckBatchSize?: number;
  existingCheckConcurrency?: number;
  mode?: 'publish' | 'classify-only';
  disableNormalizeAi?: boolean;
  disableAi?: boolean;
  forceTaxonomyAi?: boolean;
  ignoreExistingCheck?: boolean;
  useAiNormalization?: boolean;
  limit?: number;
  limitNew?: number;
  offset?: number;
}

export async function createBancoUnicoImport(
  payload: CreateBancoUnicoImportPayload,
) {
  const username = requireAuthSession().authUsername;
  const response = await api.post<BancoUnicoImportJob>('api/banco-unico-imports', {
    ...payload,
    username,
  });
  return response.data;
}

export async function listBancoUnicoImports(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  clientId?: number;
}) {
  const response = await api.get<PaginatedResponse<BancoUnicoImportJob>>(
    'api/banco-unico-imports',
    { params },
  );
  return response.data;
}

export async function getBancoUnicoImport(id: number) {
  const response = await api.get<BancoUnicoImportJobDetail>(
    `api/banco-unico-imports/${id}`,
  );
  return response.data;
}

export async function listBancoUnicoImportItems(
  id: number,
  params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string | string[];
    ean?: string | string[];
    name?: string | string[];
    manufacturer?: string | string[];
    activeIngredient?: string | string[];
    hasError?: ('yes' | 'no')[];
  },
) {
  const response = await api.get<PaginatedResponse<BancoUnicoImportItem>>(
    `api/banco-unico-imports/${id}/items`,
    { params },
  );
  return response.data;
}

export type ItemFacetField = 'ean' | 'name' | 'manufacturer' | 'activeIngredient';

export async function listBancoUnicoImportItemFacets(
  id: number,
  field: ItemFacetField,
  params: { search?: string; limit?: number } = {},
) {
  const response = await api.get<{ values: string[] }>(
    `api/banco-unico-imports/${id}/items/facets`,
    { params: { ...params, field } },
  );
  return response.data.values;
}

export async function listBancoUnicoImportEvents(
  id: number,
  params: {
    afterId?: number;
    limit?: number;
  },
) {
  const response = await api.get<EventsResponse>(
    `api/banco-unico-imports/${id}/events`,
    { params },
  );
  return response.data;
}

export async function cancelBancoUnicoImport(id: number) {
  const username = requireAuthSession().authUsername;
  await api.post(`api/banco-unico-imports/${id}/cancel`, { username });
}

export async function pauseBancoUnicoImport(id: number) {
  const username = requireAuthSession().authUsername;
  await api.post(`api/banco-unico-imports/${id}/pause`, { username });
}

export async function resumeBancoUnicoImport(id: number) {
  const username = requireAuthSession().authUsername;
  await api.post(`api/banco-unico-imports/${id}/resume`, { username });
}

export async function retryBancoUnicoImport(id: number) {
  const username = requireAuthSession().authUsername;
  const response = await api.post<BancoUnicoImportJobDetail>(
    `api/banco-unico-imports/${id}/retry`,
    { username },
  );
  return response.data;
}

export async function deleteBancoUnicoImport(id: number) {
  const username = requireAuthSession().authUsername;
  await api.delete(`api/banco-unico-imports/${id}`, {
    data: { username },
  });
}
