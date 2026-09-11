import { api } from './api';
import { requireAuthSession } from '../utils/authSession';

export type ClientProvider = 'api' | 'file' | 'alpha7' | 'vetor' | 'automatiza' | 'deliverypharmacy';

export interface Client {
  id: number;
  name: string;
  businessUnit: string | null;
  cnpj: string | null;
  clientInstance: string | null;
  provider: ClientProvider;
  instance: string;
  providerConfig: string;
  hasCredential: boolean;
  credentialHint: string | null;
  multiProviderTenantId: number | null;
  hasMultiProviderCredential: boolean;
  alpha7Port: number | null;
  alpha7Database: string | null;
  alpha7User: string | null;
  alpha7Schema: string | null;
  automatizaShopId: number | null;
  deliveryCompanyId: string | null;
  deliveryErpId: string | null;
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

export interface CreateClientPayload {
  name: string;
  businessUnit?: string;
  cnpj?: string;
  clientInstance: string;
  provider: ClientProvider;
  instance: string;
  credential?: string;
  alpha7Port?: number;
  alpha7Database?: string;
  alpha7User?: string;
  alpha7Schema?: string;
  automatizaShopId?: number;
  deliveryCompanyId?: string;
  deliveryErpId?: string;
  username?: string;
}

export async function listClients(params: { page?: number; limit?: number; search?: string } = {}) {
  const response = await api.get<PaginatedResponse<Client>>('api/clients', { params });
  return response.data;
}

export async function getClient(id: number) {
  const response = await api.get<Client>(`api/clients/${id}`);
  return response.data;
}

export async function getClientMultiProviderApiKey(id: number) {
  const username = requireAuthSession().authUsername;
  const response = await api.get<{ apiKey: string }>(`api/clients/${id}/multiprovider-api-key`, {
    params: { username },
  });
  return response.data.apiKey;
}

export async function setupClientMultiProvider(id: number) {
  const username = requireAuthSession().authUsername;
  const response = await api.post<Client>(`api/clients/${id}/multiprovider-setup`, { username });
  return response.data;
}

export async function regenerateClientMultiProviderApiKey(id: number) {
  const username = requireAuthSession().authUsername;
  const response = await api.post<Client>(`api/clients/${id}/multiprovider-regenerate-key`, { username });
  return response.data;
}

export async function createClient(payload: CreateClientPayload) {
  const username = requireAuthSession().authUsername;
  const response = await api.post<Client>('api/clients', {
    ...payload,
    username,
  });
  return response.data;
}

export interface UpdateClientPayload {
  name?: string;
  businessUnit?: string;
  cnpj?: string;
  clientInstance?: string;
  provider?: ClientProvider;
  instance?: string;
  credential?: string;
  alpha7Port?: number;
  alpha7Database?: string;
  alpha7User?: string;
  alpha7Schema?: string;
  automatizaShopId?: number;
  deliveryCompanyId?: string;
  deliveryErpId?: string;
  username?: string;
}

export async function updateClient(id: number, payload: UpdateClientPayload) {
  const username = requireAuthSession().authUsername;
  const response = await api.put<Client>(`api/clients/${id}`, {
    ...payload,
    username,
  });
  return response.data;
}

export class ClientHasImportsError extends Error {
  jobCount: number;

  constructor(message: string, jobCount: number) {
    super(message);
    this.name = 'ClientHasImportsError';
    this.jobCount = jobCount;
  }
}

export async function deleteClient(id: number, options: { force?: boolean } = {}) {
  const username = requireAuthSession().authUsername;
  try {
    await api.delete(`api/clients/${id}`, {
      params: options.force ? { force: 'true' } : undefined,
      data: { username },
    });
  } catch (error) {
    const response = (error as { response?: { status?: number; data?: { error?: string; jobCount?: number } } }).response;
    if (response?.status === 409 && typeof response.data?.jobCount === 'number') {
      throw new ClientHasImportsError(
        response.data.error || 'Cliente possui importacoes associadas.',
        response.data.jobCount,
      );
    }
    throw error;
  }
}
