# Plano de execução — correcoes-implantador

> gerado por `onp-spec plano` em 2026-09-21 16:56 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano correcoes-implantador`

## Resumo — o que vai acontecer

- **8 tarefa(s) pendente(s)**: 8 em 6 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano correcoes-implantador --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/correcoes-implantador`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2 ∥ faixa-3

#### faixa-1 — branch `spec/correcoes-implantador-faixa-1` — worktree `../onp-worktrees/unicoImplantacao-correcoes-implantador-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-001 | Criar testes de regressão para processadores | `gpt-5.6-terra` | medium | `server/src/jobs/processors/__manual-test.ts`, `server/package.json` |

#### faixa-2 — branch `spec/correcoes-implantador-faixa-2` — worktree `../onp-worktrees/unicoImplantacao-correcoes-implantador-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-002 | Corrigir defaults e contrato de filas | `gpt-5.6-terra` | medium | `features/onboarding/queue-defaults.ts`, `features/onboarding/types.ts`, `features/onboarding/components/QueueFormDialog.tsx`, `server/src/jobs/processors/configure-queues.ts`, `server/src/integrations/atender-bem/business-hours.ts` |
| T-007 | Refinar descoberta das opções de fila | `gpt-5.6-terra` | medium | `features/onboarding/components/QueueFormDialog.tsx` |

#### faixa-3 — branch `spec/correcoes-implantador-faixa-3` — worktree `../onp-worktrees/unicoImplantacao-correcoes-implantador-faixa-3`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-003 | Reabrir onboarding com auditoria | `gpt-5.6-terra` | medium | `server/src/modules/onboarding/onboarding.service.ts`, `server/src/modules/implantations/implantation.controller.ts`, `server/src/modules/implantations/implantation.routes.ts`, `server/src/modules/audit-logs/audit-log.constants.ts`, `features/implantations/api.ts`, `features/implantations/components` |

### Onda 2 — faixa-4 ∥ faixa-5 ∥ faixa-6

#### faixa-4 — branch `spec/correcoes-implantador-faixa-4` — worktree `../onp-worktrees/unicoImplantacao-correcoes-implantador-faixa-4`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-004 | Reutilizar administrador principal | `gpt-5.6-terra` | medium | `server/src/jobs/processors/create-users.ts`, `server/src/integrations/atender-bem/users.ts` |
| T-005 | Melhorar seleção e nomes de usuários | `gpt-5.6-terra` | medium | `features/onboarding/components/UserFormDialog.tsx`, `server/src/jobs/processors/create-users.ts` |

#### faixa-5 — branch `spec/correcoes-implantador-faixa-5` — worktree `../onp-worktrees/unicoImplantacao-correcoes-implantador-faixa-5`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-006 | Validar respostas rápidas no onboarding | `gpt-5.6-terra` | medium | `features/onboarding/steps/QuickRepliesStep.tsx`, `features/onboarding/OnboardingWizard.tsx`, `server/src/modules/onboarding/onboarding.schema.ts` |

#### faixa-6 — branch `spec/correcoes-implantador-faixa-6` — worktree `../onp-worktrees/unicoImplantacao-correcoes-implantador-faixa-6`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-008 | Substituir template de URA | `gpt-5.6-terra` | medium | `server/src/integrations/atender-bem/defaults/ivr-boas-vindas-basico.json`, `server/src/integrations/atender-bem/defaults/index.ts`, `server/src/jobs/processors/configure-ivr.ts` |

## Gestão de branches e commits

1. branch de trabalho `spec/correcoes-implantador` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify correcoes-implantador` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Execução — Codex headless (codex exec)

```bash
bash .spec/features/correcoes-implantador/executar-tarefas.sh
```
Cada faixa roda `codex exec` com **janela de contexto limpa**, no seu worktree, com
`--model` e `model_reasoning_effort` já definidos por tarefa e sandbox `workspace-write`. Os prompts exatos estão
embutidos no script — quer rodar uma faixa na mão, é só copiá-los de lá.
Logs: `../onp-worktrees/unicoImplantacao-correcoes-implantador-logs/`.

**Confirmação de custos — antes de executar**: os modelos e esforços por
tarefa estão nas tabelas acima; o agente CONFIRMA com o usuário se estão
dentro da licença/cota dele (modelo forte + esforço alto torra tokens).
Para gastar menos: `onp-spec plano correcoes-implantador --modelo gpt-5.6-luna --esforco baixo`
(tudo) ou por tarefa `onp-spec tarefa correcoes-implantador T-xxx --modelo <m> --esforco <nível>` — e regenere o plano.

### 📣 Acompanhamento — tabela + resumo no chat (a cada 1 min)

O script roda em **background**: o agente AVISA o usuário antes de iniciar e,
enquanto roda, posta no chat a cada ~1 minuto a **tabela de andamento** (qual
tarefa está rodando, qual não está, o que concluiu/falhou) junto com o
**resumo geral de andamento** (escrito por IA; sem IA, o motor resume). Ao
final, o usuário recebe o resumo completo da execução. A qualquer momento:

```bash
onp-spec resumo correcoes-implantador --tabela   # a tabela de andamento
onp-spec resumo correcoes-implantador            # o resumo em texto
```
