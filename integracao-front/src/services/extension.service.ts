import axios from 'axios';

// Instância específica para a API de Extensões
const apiExtensions = axios.create({
  baseURL: 'https://unicocontato.tech/api-extensoes',
  timeout: 10000,
});

// Tipagens baseadas no seu Prisma Schema
export interface InstanceData {
  id: number;
  client_name: string;
  instance_url: string;
  is_active: boolean;
}

export interface ConfigData {
  id: number;
  config_name: string;
  config_data: {
    dbName: string;
    clientToken: string;
  };
  instancias?: InstanceData;
}

export interface LicenseData {
  license_key: string;
  config_id: number;
  is_active: boolean;
  created_at: string;
  activated_machine_id: string | null;
  configs?: ConfigData;
}

export interface LicenseListResponse {
  licenses: LicenseData[];
}

// --- SERVIÇOS ---

// 1. Instâncias
export async function createInstance(client_name: string, instance_url: string) {
  const response = await apiExtensions.post('/v1/instance/create', {
    client_name,
    instance_url,
  });
  return response.data;
}

export async function listInstances() {
  const response = await apiExtensions.get<{ instances: InstanceData[] }>('/v1/instance/list');
  return response.data.instances;
}

export async function listConfigs() {
  const response = await apiExtensions.get<{ configs: ConfigData[] }>('/v1/config/list');
  return response.data.configs;
}

// 2. Configurações
export async function createConfig(
  config_name: string,
  instance_url: string,
  dbName: string,
) {
  const response = await apiExtensions.post('/v1/config/create', {
    config_name,
    instance_url,
    config_data: {
      dbName,
      clientToken: 'unicoxalpha7',
    },
  });
  return response.data;
}

// 3. Licenças
export async function createLicense(instance_url: string, config_id: number) {
  const response = await apiExtensions.post('/v1/license/create', {
    instance_url,
    config_id: Number(config_id),
  });
  return response.data;
}

export async function listLicenses() {
  const response = await apiExtensions.get<LicenseListResponse>('/v1/license/list');
  return response.data.licenses;
}

export async function toggleLicense(license_key: string, isActive: boolean) {
  const endpoint = isActive ? '/v1/license/deactivate' : '/v1/license/reactivate';
  const response = await apiExtensions.post(endpoint, { license_key });
  return response.data;
}

export async function deleteLicense(license_key: string) {
  const response = await apiExtensions.delete(`/v1/license/delete/${license_key}`);
  return response.data;
}

export async function unbindLicense(license_key: string) {
  const response = await apiExtensions.post('/v1/license/unbind', { license_key });
  return response.data;
}
