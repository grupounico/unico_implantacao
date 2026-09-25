/**
 * Rótulo em pt-BR de cada ação de auditoria — espelha
 * server/src/modules/audit-logs/audit-log.constants.ts. Ações futuras que
 * ainda não tenham entrada aqui caem no fallback (ver auditActionLabel) em
 * vez de quebrar a tela.
 */
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  IMPLANTATION_CREATED: "Implantação criada",
  IMPLANTATION_UPDATED: "Dados da implantação atualizados",
  IMPLANTATION_REVIEW_UPDATED: "Revisão do onboarding editada",
  IMPLANTATION_ONBOARDING_REOPENED: "Nova revisão de onboarding criada",
  IMPLANTATION_APPROVED: "Revisão aprovada — implantação iniciada",
  IMPLANTATION_CANCELLED: "Implantação cancelada",
  IMPLANTATION_IMPLANTER_ASSIGNED: "Implantador atribuído",
  DEPLOYMENT_JOB_RETRIED: "Etapa reprocessada manualmente",
  USER_CREATED: "Usuário do painel criado",
  USER_UPDATED: "Usuário do painel atualizado",
  USER_PASSWORD_RESET: "Senha redefinida",
  USER_DELETED: "Usuário do painel removido",
  USER_LOGGED_IN: "Login no painel",
};

export function auditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action;
}

/** Rótulo em pt-BR do tipo de entidade — usado na coluna "Onde" da auditoria global. */
export const ENTITY_TYPE_LABELS: Record<string, string> = {
  Implantation: "Implantação",
  AdminUser: "Usuário do painel",
};

export function entityTypeLabel(entityType: string): string {
  return ENTITY_TYPE_LABELS[entityType] ?? entityType;
}
