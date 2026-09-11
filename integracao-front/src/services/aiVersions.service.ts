import axios from 'axios';

const API_BASE = import.meta.env.VITE_URLBASE || 'https://unicocontato.tech';

export interface AiVersionItem {
  id: number;
  instance: string;
  version: number;
  createdAt: string;
  aiId: number | string | null;
  name: string | null;
  signaturename: string | null;
  description: string | null;
  payload: Record<string, unknown>;
}

interface FetchAiVersionsParams {
  limit?: number;
  latestOnly?: boolean;
  instance?: string;
}

export async function fetchAiVersions({
  limit = 200,
  latestOnly = true,
  instance,
}: FetchAiVersionsParams = {}): Promise<AiVersionItem[]> {
  const response = await axios.get(`${API_BASE}/api/ia/versions`, {
    params: { limit, latestOnly, instance },
  });

  return response.data?.data ?? [];
}
