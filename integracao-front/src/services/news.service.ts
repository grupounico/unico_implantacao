import { api } from "./api"; // Sua instância do axios configurada com VITE_URLBASE

export interface NewsItem {
  id: number;
  title: string;
  description: string;
  type: 'feature' | 'update' | 'maintenance' | 'alert';
  created_at: string;
}

function normalizeNewsResponse(payload: unknown): NewsItem[] {
  if (Array.isArray(payload)) {
    return payload as NewsItem[];
  }

  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: NewsItem[] }).data;
  }

  console.warn('Resposta inesperada ao buscar novidades:', payload);
  return [];
}

export async function getLatestNews(): Promise<NewsItem[]> {
  const response = await api.get<unknown>('/api/news/latest');
  return normalizeNewsResponse(response.data);
}
