import type {
  ActivityEvent,
  DeploymentJobType,
  DeploymentRun,
  Implantation,
  ImplantationReview,
  ImplantationsPage,
  ImplantationStats,
  Plan,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export interface CreateImplantationInput {
  instanceUrl: string;
  planId: number;
  /** Sobrescreve o limite do plano nesta implantação, se enviado. */
  agentQuota?: number;
  supervisorQuota?: number;
  adminQuota?: number;
  companyName?: string;
  cnpj?: string;
}

export interface FetchImplantationsParams {
  page?: number;
  pageSize?: number;
  /** Nome da empresa, da instância ou CNPJ — com ou sem máscara. */
  search?: string;
}

/**
 * `headers` só é usado quando a chamada vem de um Server Component — nesse
 * caso é `await getAuthHeaders()` (ver lib/server-session.ts), porque o
 * cookie de sessão desta API é de outra origem e o servidor do Next.js não
 * tem acesso a ele. Chamadas do navegador (componentes client) não passam
 * nada aqui: `credentials: "include"` já basta, o cookie vai sozinho.
 */
export async function fetchImplantations(
  params: FetchImplantationsParams = {},
  headers?: HeadersInit,
): Promise<ImplantationsPage> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  if (params.search) query.set("search", params.search);

  const response = await fetch(`${API_BASE_URL}/implantations?${query}`, {
    credentials: "include",
    headers,
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Não foi possível carregar as implantações");
  return response.json();
}

export async function fetchImplantationStats(headers?: HeadersInit): Promise<ImplantationStats> {
  const response = await fetch(`${API_BASE_URL}/implantations/stats`, {
    credentials: "include",
    headers,
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Não foi possível carregar os indicadores");
  return response.json();
}

export async function fetchImplantation(
  id: string,
  headers?: HeadersInit,
): Promise<Implantation | null> {
  const response = await fetch(`${API_BASE_URL}/implantations/${id}`, {
    credentials: "include",
    headers,
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Não foi possível carregar a implantação");
  return response.json();
}

export async function fetchPlans(headers?: HeadersInit): Promise<Plan[]> {
  const response = await fetch(`${API_BASE_URL}/plans`, {
    credentials: "include",
    headers,
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Não foi possível carregar os planos");
  return response.json();
}

export async function createImplantation(
  data: CreateImplantationInput,
): Promise<Implantation> {
  const response = await fetch(`${API_BASE_URL}/implantations`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? "Não foi possível criar a implantação");
  }
  return response.json();
}

export interface UpdateImplantationInput {
  companyName?: string;
  cnpj?: string;
  /** `null` limpa a atribuição. */
  implanterId?: string | null;
}

export async function updateImplantation(
  id: string,
  data: UpdateImplantationInput,
): Promise<Implantation> {
  const response = await fetch(`${API_BASE_URL}/implantations/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? "Não foi possível salvar a implantação");
  }
  return response.json();
}

export async function fetchActivity(
  id: string,
  headers?: HeadersInit,
): Promise<ActivityEvent[]> {
  const response = await fetch(`${API_BASE_URL}/implantations/${id}/activity`, {
    credentials: "include",
    headers,
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Não foi possível carregar o histórico de atividade");
  return response.json();
}

export async function cancelImplantation(id: string): Promise<Implantation> {
  const response = await fetch(`${API_BASE_URL}/implantations/${id}/cancel`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) throw new Error("Não foi possível cancelar a implantação");
  return response.json();
}

export async function updateReviewResponses(
  id: string,
  responses: Record<string, unknown>,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/implantations/${id}/review`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ responses }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? "Não foi possível salvar as alterações");
  }
}

export async function fetchReview(
  id: string,
  headers?: HeadersInit,
): Promise<ImplantationReview | null> {
  const response = await fetch(`${API_BASE_URL}/implantations/${id}/review`, {
    credentials: "include",
    headers,
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Não foi possível carregar a revisão");
  return response.json();
}

export async function approveImplantation(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/implantations/${id}/approve`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? "Não foi possível aprovar a implantação");
  }
}

export async function reopenOnboarding(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/implantations/${id}/onboarding/reopen`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? "Não foi possível reabrir o onboarding");
  }
}

export async function fetchDeploymentRun(
  implantationId: string,
  headers?: HeadersInit,
): Promise<DeploymentRun | null> {
  const response = await fetch(`${API_BASE_URL}/deployments/${implantationId}`, {
    credentials: "include",
    headers,
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Não foi possível carregar a execução");
  return response.json();
}

export async function retryDeploymentJob(
  implantationId: string,
  type: DeploymentJobType,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/deployments/${implantationId}/jobs/${type}/retry`,
    { method: "POST", credentials: "include" },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? "Não foi possível reprocessar a etapa");
  }
}

export function onboardingLink(onboardingToken: string): string {
  return `/onboarding/${onboardingToken}`;
}

/** URL absoluta do onboarding, pronta para compartilhar com o cliente. */
export function fullOnboardingLink(onboardingToken: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${onboardingLink(onboardingToken)}`;
}
