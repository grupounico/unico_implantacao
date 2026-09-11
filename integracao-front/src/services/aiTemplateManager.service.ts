import { api } from './api';
import type { AiComponentKey } from './aiInstallations.service';

export interface AiTemplateBaseItem {
  id: number | null;
  templateKey: string;
  templateName: string;
  version: number;
  contentType: string;
  sourcePath: string | null;
  isCurrent: boolean;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  templateContent: string;
}

export interface AiProviderTemplatePackageItem {
  id: number | null;
  provider: string;
  templateName: string;
  version: number;
  assistantTemplate: string | null;
  preProcessTemplate: string | null;
  buscaProdutosTemplate: string | null;
  downloadImagemTemplate: string | null;
  gerarCheckoutTemplate: string | null;
  transferirHumanoTemplate: string | null;
  uraTemplate: string | null;
  uraAbTemplate: string | null;
  componentVersions: Partial<Record<AiComponentKey, number>>;
  isCurrent: boolean;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AiTemplateWorkspaceDraft {
  provider: string;
  templateName: string;
  baseTemplateName: string;
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
  basedOnBaseVersion: number | null;
  basedOnPackageVersion: number | null;
  updatedAt: string;
}

export interface AiTemplateWorkspace {
  provider: string;
  draft: AiTemplateWorkspaceDraft | null;
  baseCurrent: AiTemplateBaseItem | null;
  packageCurrent: AiProviderTemplatePackageItem | null;
  baseHistory: AiTemplateBaseItem[];
  packageHistory: AiProviderTemplatePackageItem[];
  supportedComponents: AiComponentKey[];
  hasDraftChanges: boolean;
}

export interface AiTemplateWorkspaceSummary {
  provider: string;
  displayName: string;
  supportedComponents: AiComponentKey[];
  draftExists: boolean;
  hasDraftChanges: boolean;
  draftUpdatedAt: string | null;
  publishedBaseVersion: number | null;
  publishedPackageVersion: number | null;
}

export interface SaveAiTemplateWorkspaceDraftInput {
  templateName?: string;
  baseTemplateName?: string;
  contentType?: string;
  sourcePath?: string | null;
  baseTemplateContent?: string;
  assistantTemplate?: string;
  preProcessTemplate?: string;
  buscaProdutosTemplate?: string;
  downloadImagemTemplate?: string;
  gerarCheckoutTemplate?: string;
  transferirHumanoTemplate?: string;
  uraTemplate?: string;
  uraAbTemplate?: string;
}

interface WorkspaceResponse {
  message: string;
  data: AiTemplateWorkspace;
}

export type AiTemplateReleaseScope = 'all' | 'base' | AiComponentKey;

export async function fetchAiTemplateWorkspaces() {
  const response = await api.get('/api/ia/templates/workspaces');
  return (response.data?.data ?? []) as AiTemplateWorkspaceSummary[];
}

export async function fetchAiTemplateWorkspace(provider: string) {
  const response = await api.get(`/api/ia/templates/workspaces/${provider}`);
  return response.data?.data as AiTemplateWorkspace;
}

export async function saveAiTemplateWorkspaceDraft(
  provider: string,
  input: SaveAiTemplateWorkspaceDraftInput,
) {
  const response = await api.put(`/api/ia/templates/workspaces/${provider}`, input);
  return response.data as WorkspaceResponse;
}

export async function discardAiTemplateWorkspaceDraft(provider: string) {
  const response = await api.delete(`/api/ia/templates/workspaces/${provider}`);
  return response.data as WorkspaceResponse;
}

export async function releaseAiTemplateWorkspaceDraft(
  provider: string,
  scope: AiTemplateReleaseScope = 'all',
) {
  const response = await api.post(`/api/ia/templates/workspaces/${provider}/release`, {
    confirmRelease: true,
    scope,
  });
  return response.data as WorkspaceResponse;
}

export async function rollbackAiTemplateWorkspace(
  provider: string,
  input: { baseVersion?: number; packageVersion?: number },
) {
  const response = await api.post(`/api/ia/templates/workspaces/${provider}/rollback`, {
    ...input,
    confirmRelease: true,
  });
  return response.data as WorkspaceResponse;
}

export async function syncCurrentAiTemplates() {
  const response = await api.post('/api/ia/templates/sync-current');
  return response.data as {
    message: string;
  };
}
