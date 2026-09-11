import { api } from './api';

export interface InstallIntegrationPayload {
  instance: string;
  integration: string;
  requestedBy?: string | null;
  code?: string;
  integrationData: unknown;
}

export async function installIntegration(payload: InstallIntegrationPayload) {
  const response = await api.post('install/integration', payload);
  return response.data;
}
