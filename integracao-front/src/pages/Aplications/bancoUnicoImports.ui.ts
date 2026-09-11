import type { BancoUnicoImportEvent } from '../../services/bancoUnicoImports.service';

export type StatusTone = 'neutral' | 'active' | 'success' | 'warning' | 'danger';

export const STATUS_DOT: Record<StatusTone, string> = {
  neutral: 'bg-foreground/30',
  active: 'bg-primary',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
};

export const STATUS_TEXT: Record<StatusTone, string> = {
  neutral: 'text-foreground/55',
  active: 'text-primary',
  success: 'text-emerald-600',
  warning: 'text-amber-600',
  danger: 'text-rose-600',
};

export function formatDateTime(value: string | null) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString('pt-BR');
}

export function statusInfo(status: string): { label: string; tone: StatusTone } {
  const normalized = status.toLowerCase();
  const table: Record<string, { label: string; tone: StatusTone }> = {
    completed: { label: 'Concluida', tone: 'success' },
    running: { label: 'Rodando', tone: 'active' },
    paused: { label: 'Pausada', tone: 'warning' },
    pending: { label: 'Na fila', tone: 'neutral' },
    claimed: { label: 'Iniciando', tone: 'active' },
    processing: { label: 'Processando', tone: 'active' },
    cancelling: { label: 'Cancelando', tone: 'warning' },
    cancelled: { label: 'Cancelada', tone: 'warning' },
    failed: { label: 'Falhou', tone: 'danger' },
  };

  return table[normalized] || { label: status, tone: 'neutral' };
}

export function itemStatusTone(status: string): StatusTone {
  const table: Record<string, StatusTone> = {
    loaded: 'neutral',
    published: 'success',
    prepared: 'active',
    classified: 'active',
    already_exists: 'neutral',
    invalid_ean: 'warning',
    skipped_taxonomy: 'warning',
    classification_error: 'danger',
    publish_error: 'danger',
  };

  return table[status] || 'neutral';
}

export function itemStatusLabel(status: string) {
  const table: Record<string, string> = {
    loaded: 'Carregado',
    published: 'Subidos',
    prepared: 'Preparados',
    classified: 'Clarificados',
    already_exists: 'Ja existiam',
    invalid_ean: 'EAN invalido',
    skipped_taxonomy: 'Sem arvore',
    classification_error: 'Erro classificacao',
    publish_error: 'Erro publicacao',
  };

  return table[status] || status.replace(/_/g, ' ');
}

export function eventTone(event: BancoUnicoImportEvent) {
  if (event.level === 'error') return 'text-rose-400';
  if (event.level === 'warning') return 'text-amber-300';
  return 'text-zinc-300';
}

export const SOURCE_TYPE_LABEL: Record<string, string> = {
  api: 'API Trier',
  trier: 'API Trier',
  file: 'Arquivo JSON',
  alpha7: 'Banco Alpha 7',
  vetor: 'API Vetor',
  automatiza: 'Automatiza',
  deliverypharmacy: 'Delivery Pharmacy',
};

export const MODE_LABEL: Record<string, string> = {
  publish: 'Publicacao completa',
  'classify-only': 'Apenas classificacao',
};
