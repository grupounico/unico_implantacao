# Spec: Correções do implantador

> feature: correcoes-implantador
> status: rascunho

## Contexto

Implantadores precisam configurar instâncias do Atender Bem sem perder dados, sem criar contas indevidas e com uma revisão confiável das configurações aplicadas.

## Histórias

### US-001 — Configurar filas com regras corretas

Como implantador, quero que regras e mensagens de uma fila sejam aplicadas exatamente como configuradas, para que o cliente possa iniciar a operação sem ajustes manuais.

#### AC-001 — Distribuição automática desativada

- **Dado** uma fila configurada para o atendente puxar os atendimentos
- **Quando** a implantação configura ou reprocessa a fila
- **Então** a instância do Atender Bem mantém a distribuição automática desativada.

#### AC-002 — Horário e mensagem fora do horário

- **Dado** uma fila com horários e mensagem fora do horário configurados
- **Quando** a implantação cria ou atualiza a configuração da fila
- **Então** todos os horários e a mensagem informada ficam aplicados na instância.

#### AC-003 — Mensagem de encerramento

- **Dado** uma fila com mensagem de encerramento preenchida
- **Quando** a implantação configura a fila
- **Então** o Atender Bem recebe e exibe a mensagem ao encerrar o atendimento.

#### AC-004 — Motivo de encerramento padrão

- **Dado** que o cliente cria uma nova fila
- **Quando** o formulário abre
- **Então** “Exigir motivo de encerramento” começa habilitado com os motivos padrão.

### US-002 — Reutilizar a conta administrativa elegível

Como implantador, quero reutilizar a conta administrativa principal quando houver somente uma conta elegível, para evitar criar um administrador redundante.

#### AC-005 — Reuso sem duplicação

- **Dado** uma instância que atende à regra de conta única
- **Quando** a implantação cria os usuários
- **Então** a conta principal é atualizada e vinculada às filas sem uma conta administrativa adicional ser criada.

### US-003 — Revisar e corrigir onboarding enviado

Como implantador, quero consultar configurações concluídas e reabrir um onboarding antes da aprovação, para conferir e corrigir dados com segurança.

#### AC-006 — Consulta após execução

- **Dado** uma implantação que já executou
- **Quando** o implantador abre seus detalhes
- **Então** ele vê o snapshot aprovado de filas, usuários, mensagens e personalizações.

#### AC-007 — Reabertura segura

- **Dado** uma implantação aguardando revisão
- **Quando** o implantador reabre o onboarding
- **Então** o cliente recebe um novo link, encontra os dados existentes editáveis e a ação fica registrada na auditoria.

### US-004 — Cadastrar usuários com eficiência

Como cliente, quero atribuir rapidamente usuários às filas e usar nomes curtos, para que a equipe seja criada sem bloqueios desnecessários.

#### AC-008 — Seleção de todas as filas

- **Dado** um formulário de usuário com filas disponíveis
- **Quando** o cliente escolhe selecionar todas as filas
- **Então** todas são vinculadas ao usuário, podendo ser desmarcadas também em uma única ação.

#### AC-009 — Nome curto aceito

- **Dado** um usuário com nome de uma a quatro letras
- **Quando** ele é provisionado
- **Então** a criação não falha por comprimento e o nome exibido no painel permanece inalterado.

### US-005 — Evitar respostas rápidas inválidas

Como cliente, quero ser avisado ao deixar uma resposta rápida incompleta, para não provocar falha posterior na implantação.

#### AC-010 — Validação antes do envio

- **Dado** uma resposta rápida marcada para implantação sem título ou texto
- **Quando** o cliente tenta avançar ou finalizar o onboarding
- **Então** o formulário indica o campo inválido e impede o envio.

### US-006 — Tornar a configuração de fila compreensível

Como cliente, quero perceber claramente todas as opções de uma fila, para configurar o atendimento sem ignorar campos importantes.

#### AC-011 — Hierarquia visual das opções

- **Dado** o diálogo de criação ou edição de fila
- **Quando** o cliente navega pelas regras, encerramento e horários
- **Então** as seções e conteúdos adicionais são claramente identificáveis e acessíveis.

### US-007 — Aplicar a URA aprovada

Como implantador, quero implantar o modelo de URA aprovado, para que a automação siga o fluxo operacional definido.

#### AC-012 — Template de URA de referência

- **Dado** o template de URA de referência fornecido pelo produto
- **Quando** uma fila é implantada
- **Então** a URA criada contém os nós, mensagens, horários e conexões definidos nesse template.

## Fora de escopo

- Reabrir onboarding após a aprovação ou início de jobs.
- Alterar configurações manualmente em uma instância já implantada.
- Migrar dados históricos sem reprocessamento explícito.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-001 | A reabertura é permitida apenas no estado `WAITING_REVIEW`. | aberta | Validar com produto antes da implementação. |
| ASM-002 | Espaços à direita resolvem a limitação de nome do Atender Bem sem alterar o nome apresentado. | aberta | Confirmar em homologação. |
| ASM-003 | O snapshot aprovado é a fonte correta para a consulta pós-execução. | confirmada | Já é persistido como `DeploymentSnapshot`. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-001 | Qual campo ou credencial identifica a conta de administrador principal e a regra objetiva para “cliente com uma conta”? | aberta | — |
| Q-002 | Qual é o template de URA de exemplo que deve substituir o atual? | aberta | — |
| Q-003 | Qual campo da API do Atender Bem persiste a mensagem de encerramento geral da fila? | aberta | Validar no painel/API de homologação. |
