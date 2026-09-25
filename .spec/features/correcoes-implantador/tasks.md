# Tasks: Correções do implantador

> feature: correcoes-implantador

## T-001 — Criar testes de regressão para processadores [pendente]

- Refs: AC-001, AC-002, AC-003, AC-005, AC-009, AC-012
- Arquivos: server/src/jobs/processors/__manual-test.ts, server/package.json
- Notas: Converter cenários relevantes em testes automatizados antes das correções de integração.

## T-002 — Corrigir defaults e contrato de filas [pendente]

- Refs: AC-001, AC-002, AC-003, AC-004
- Arquivos: features/onboarding/queue-defaults.ts, features/onboarding/types.ts, features/onboarding/components/QueueFormDialog.tsx, server/src/jobs/processors/configure-queues.ts, server/src/integrations/atender-bem/business-hours.ts
- Notas: Depende da confirmação do contrato da mensagem de encerramento.

## T-003 — Reabrir onboarding com auditoria [em-andamento]
- Refs: AC-006, AC-007
- Arquivos: server/src/modules/onboarding/onboarding.service.ts, server/src/modules/implantations/implantation.controller.ts, server/src/modules/implantations/implantation.routes.ts, server/src/modules/audit-logs/audit-log.constants.ts, features/implantations/api.ts, features/implantations/components
- Notas: Restringir estados permitidos e rotacionar token.

## T-004 — Reutilizar administrador principal [pendente]

- Refs: AC-005
- Arquivos: server/src/jobs/processors/create-users.ts, server/src/integrations/atender-bem/users.ts
- Notas: Bloqueada por Q-001.

## T-005 — Melhorar seleção e nomes de usuários [em-andamento]
- Refs: AC-008, AC-009
- Arquivos: features/onboarding/components/UserFormDialog.tsx, server/src/jobs/processors/create-users.ts
- Notas: O preenchimento de nome curto deve ocorrer somente no payload externo.

## T-006 — Validar respostas rápidas no onboarding [em-andamento]
- Refs: AC-010
- Arquivos: features/onboarding/steps/QuickRepliesStep.tsx, features/onboarding/OnboardingWizard.tsx, server/src/modules/onboarding/onboarding.schema.ts
- Notas: Manter validação do worker como defesa em profundidade.

## T-007 — Refinar descoberta das opções de fila [em-andamento]
- Refs: AC-011
- Arquivos: features/onboarding/components/QueueFormDialog.tsx
- Notas: Usar estrutura visual existente, sem dependência nova.

## T-008 — Substituir template de URA [pendente]

- Refs: AC-012
- Arquivos: server/src/integrations/atender-bem/defaults/ivr-boas-vindas-basico.json, server/src/integrations/atender-bem/defaults/index.ts, server/src/jobs/processors/configure-ivr.ts
- Notas: Bloqueada por Q-002.
