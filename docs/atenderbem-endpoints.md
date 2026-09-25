# Mapa de endpoints — AtenderBem

> Escopo: APIs administrativas necessárias para automatizar a implantação no
> AtenderBem. Este documento não contém credenciais, tokens, chaves de fila ou
> dados pessoais. O host é sempre a instância da implantação:
> `https://<subdominio>.atenderbem.com`.

## Como ler este documento

- **Confirmado**: rota, verbo e contrato observados nos registros do projeto,
  no painel ou no corpus de referência fornecido.
- **A confirmar**: a tela e/ou a rota de leitura foi observada, mas não existe
  ainda uma captura segura do request de gravação. Não implementar escrita
  usando somente a convenção REST.
- Todos os endpoints administrativos abaixo usam `Authorization: Bearer
  <token>` e `Content-Type: application/json`, salvo indicação contrária.
- O token vem de `POST /login`; ele deve ser mantido somente em memória pelo
  worker, nunca no banco, log, payload de erro ou frontend.

## Autenticação comum

| Operação | Rota | Corpo | Resultado esperado |
| --- | --- | --- | --- |
| Criar sessão administrativa | `POST /login` | `{ username, password, code, trusted: false }` | `200`, `message: "success"` e `token` JWT |

`code` é o TOTP da conta de serviço e deve ser gerado imediatamente antes da
chamada. A resposta pode trazer muito mais dados do usuário: somente o token
é necessário para as chamadas seguintes. Não depender de cookie de sessão.

## Ordem segura de implantação

```text
login
  -> consultar plano e limites
  -> criar filas
  -> criar usuários com o perfil correto
  -> atualizar usuários incluindo queues[]
  -> criar URAs e guardar os IDs
  -> atualizar filas com ivrid e demais configurações
  -> criar etiquetas e mensagens pré-definidas
  -> reler tudo e registrar o resultado da etapa
```

Uma URA pode transferir para uma fila e uma fila pode apontar para uma URA;
por isso o provisionamento deve guardar IDs e fazer uma atualização posterior
quando houver dependência circular. Cada escrita deve ser precedida de leitura
e acompanhada de uma releitura de validação.

## Contrato mínimo que a aplicação precisa validar antes de executar

| Verificação | Fonte/rota | Situação | Regra para o executor |
| --- | --- | --- | --- |
| Instância informada | URL do tenant | Validável localmente | Exigir HTTPS e host terminado em `.atenderbem.com`; não aceitar URL arbitrária de webhook como tenant. |
| Acesso de serviço | `POST /login` | Confirmado | Falhar a implantação se não houver `200` **e** `token`; não tentar etapas seguintes. |
| Limites do plano | `GET /partner/getAllAvailablePlans` | Confirmado nos registros do projeto | Ler no tenant de testes quando a implantação depender de quantidade de agentes, supervisores ou filas. Comparar a solicitação com `chatagents`, `supervisors`, `waqueues`, `igqueues`, `fbqueues`, `tgqueues` e afins. |
| Estado atual de filas | `GET /queues` | Confirmado | Detectar conflito de nome/canal e preservar configurações existentes. |
| Estado atual de usuários | `GET /users/getUsers` | Confirmado no frontend | Detectar `username` já existente e obter os IDs antes de criar ou atualizar. |
| Estado atual de URAs | `GET /ivrs/getResumedList` | Confirmado | Usar uma chave de correlação/nome controlado pela implantação para evitar duplicidade. |
| Conteúdo de URA existente | `GET /ivrs/{ivrId}` | Confirmado | Obrigatório antes de qualquer atualização. |
| Resultado de cada escrita | releitura do recurso | Confirmado como procedimento | Não considerar a etapa concluída apenas pelo status HTTP; comparar os campos que a etapa alterou. |

O endpoint de planos é administrativo e exige o bearer da sessão. Ele não deve
ser chamado no onboarding público: a aplicação consulta-o somente no worker,
depois da aprovação do operador.

## 1. Filas

Tela: `/base/config/queueslist`.

| Ação | Rota | Estado | Contrato e observações |
| --- | --- | --- | --- |
| Listar filas | `GET /queues` | Confirmado | Retorna o objeto completo das filas, incluindo `id`, `name`, `type`, `ivrid`, `apikey`, `enabled`, `status`, `webconfig` e flags. Usar para localizar por nome e preservar campos antes de editar. |
| Criar fila | `POST /queues` | Confirmado | Mínimo observado: `{ name, type, status: 1, enabled: 0, maxchatsperagent: 5, ivrid: 0 }`. A fila começa desligada; habilitação/conexão do canal é uma etapa diferente. |
| Atualizar fila | `PUT /queues/{queueId}` | Confirmado | O painel envia um objeto muito amplo. Ler a fila, aplicar somente o patch desejado sobre a cópia integral e reenviar; um payload mínimo pode zerar configurações e hooks. |
| Agentes de uma fila | `POST /queues/getQueueAgents` | Confirmado | Corpo: `{ id: queueId }`. Útil para auditoria operacional; não é o vínculo persistente de usuários. |
| Motivos de encerramento | `/queues/getEndReasons` | Rota observada; verbo a confirmar | Fonte para `endreasons` ao configurar a fila. |
| Finalizar conexão TP | `/queues/finishTPConnection` | Rota observada; verbo a confirmar | Operação de integração de canal; fora do fluxo básico e requer contrato específico. |
| Remover dados Cloud API TP | `/queues/unsetCloudApiTPData` | Rota observada; verbo a confirmar | Mutação destrutiva; não chamar automaticamente. |

### Tipos de fila observados

| `type` | Canal |
| ---: | --- |
| `21` | WhatsApp Cloud API |
| `12` | Instagram Messenger |
| `2` | Facebook Messenger |
| `3` | Telegram |

Outros tipos exibidos no painel, como `WE`, `EM` e `IN`, não receberam código
numérico confirmado nos artefatos deste projeto. Não inferir o valor.

### Campos que merecem tratamento explícito

- `ivrid`: ID da URA de entrada; `0` significa sem URA.
- `enabled` e `status`: não são sinônimos; preservar ambos.
- `maxchatsperagent`, `distributionstrategy`, `preferlastagent` e
  `transferfilters`: distribuição de atendimento.
- `fk_businesshours_config`, `offhourmsg`: horário de atendimento.

Para reaplicar uma agenda numa fila que já tem `fk_businesshours_config`, o
provisionador cria uma nova configuração em `POST /businesshours/configs` e a
associa pela atualização confirmada da fila. Isso evita inferir uma rota de
edição para `/businesshours/configs/{id}` que ainda não foi capturada.
- `webconfig`: configuração do widget web; contém também `queueId` e domínio.
- `apikey`: segredo por fila. Nunca devolver nem persistir em logs.
- `*hook`: strings JSON de webhooks. Não sobrescrever sem preservar o valor
  atual.

### Defaults operacionais de fila

Aplicar estes valores como patch sobre a representação completa da fila e
enviar com `PUT /queues/{queueId}`. Eles foram validados no formulário da
fila de testes; a interface confirma que `1` equivale às opções solicitadas.

| Opção no painel | Campo | Valor padrão |
| --- | --- | ---: |
| Nome no cabeçalho | `addagentname` | `1` |
| Mensagem enviada por outro dispositivo: **Não abrir atendimento** | `dontopenwithsentmessage` | `1` |
| Remover da sala de espera ao receber mensagem | `autoremovefromwaitinglist` | `1` |
| Analisar atendimentos no encerramento | `aisummary` | `1` |
| Processamento de áudio de entrada | `aiimprovedaudiotranscription` | `1` |
| Permitir ao agente solicitar sugestão e melhorias de resposta | `aiallowmsgsuggestion` | `1` |
| Permitir ao agente solicitar manualmente um resumo do atendimento | `aiallowmanualsummary` | `1` |

`aisentaudiotranscription` é outra opção: controla **Processamento de áudio
de saída** e permanece inalterada por este perfil. Não confundir com a opção
de áudio de entrada acima.

## 2. Usuários e vínculo com filas

Tela: `/base/config/userslist`.

| Ação | Rota | Estado | Contrato e observações |
| --- | --- | --- | --- |
| Listar usuários | `/users` | Rota observada; verbo a confirmar | Para o cache do painel também aparece `GET /users/getUsers?t=<timestamp>`. Preferir este último para leitura enquanto o contrato de `/users` não for capturado. |
| Criar usuário | `POST /users` | Confirmado | Usar o perfil operacional padrão detalhado abaixo. A senha é segredo: não registrar nem retornar. |
| Atualizar usuário | `PUT /users/{userId}` | Confirmado | Enviar a representação completa atualizada. O exemplo validado contém permissões, flags, `queues`, grupos e campos de produtividade. |
| Listar agentes para UI | `/users/getAgentsList` | Rota observada; verbo a confirmar | Uso auxiliar para seleção; contrato ainda não capturado. |
| Alterar senha | `/users/changePassword` | Rota observada; verbo a confirmar | Operação sensível; mantê-la fora do fluxo padrão. |
| Trocar fila preferida | `/users/changePreferredQueue` | Rota observada; verbo a confirmar | Não é o mesmo que atribuir o usuário às filas. |
| Atualizar própria descrição | `/users/updateOwnDescription` | Rota observada; verbo a confirmar | Escopo do usuário logado, não do provisionamento. |
| Gerar/habilitar/desabilitar 2FA | `/users/generateTwoFaSecret`, `/users/enableTowFa`, `/users/disableTwoFa` | Rotas observadas; verbos a confirmar | Não automatizar sem política específica de credenciais e recuperação. |

### Perfis confirmados

| `type` | Perfil | Regra operacional |
| ---: | --- | --- |
| `0` | Administrador | O registro manual indica ramal (`sipuser`) como necessário. |
| `1` | Supervisor | O registro manual indica ramal (`sipuser`) como necessário. |
| `2` | Agente | Perfil padrão para atendimento. |

### Atribuição de usuário a filas

O vínculo persistente foi confirmado no campo `queues` do `PUT /users/{id}`:

```json
{ "queues": [200, 201] }
```

Procedimento idempotente:

1. `GET /queues` e resolver os IDs das filas pelo identificador controlado pela implantação, não pela posição na lista.
2. Ler o usuário atual.
3. Calcular o conjunto final de `queues` conforme a solicitação; não adicionar
   cegamente a cada reexecução.
4. Fazer `PUT /users/{id}` com o objeto atual preservado e o novo `queues`.
5. Reler o usuário e comparar o conjunto de IDs.

`POST /queues/getQueueAgents` serve para consultar agentes associados/logados
na fila em contexto operacional; ele não substitui a atualização de `queues`.

### Perfil operacional padrão de usuário

Os campos abaixo foram confirmados no formulário de permissões e no contrato
de atualização. O executor aplica-os tanto no `POST /users` quanto no
`PUT /users/{id}` de usuários já existentes:

| Opção no painel | Campo | Valor padrão |
| --- | --- | ---: |
| Usuário ativo | `status` | `1` |
| Funções de chat | `chatenabled` | `1` |
| Gestão de tarefas | `tasksenabled` | `1` |
| Logar automaticamente às filas | `autologin` | `1` |
| Solicitar assistência de IA durante o atendimento | `canrequestaisummary` | `1` |
| Ignorar limites para atendimentos travados | `ignorelimitsforblockedchats` | `1` |
| Ver histórico e reabrir atendimentos próprios | `canreopenchat` | `1` |
| Ver histórico e reabrir atendimentos de terceiros | `canreopenotherschat` | `1` |
| Abrir novos chats | `canopennewchat` | `1` |
| Acessar chat interno | `canuseinternalchat` | `1` |

Outras permissões continuam preservadas quando a conta já existe; não são
zeradas pela atualização.

## 3. URAs e automações

Telas: `/base/config/uralist` e `/base/config/ivreditor`.

| Ação | Rota | Estado | Contrato e observações |
| --- | --- | --- | --- |
| Listagem resumida | `GET /ivrs/getResumedList` | Confirmado | Usar para encontrar `id`, nome, tipo e flags sem carregar cada grafo. O painel acrescenta `?t=<timestamp>` apenas para cache. |
| Ler uma URA | `GET /ivrs/{ivrId}` | Confirmado | Fonte de verdade para edição. `options` pode vir como string JSON ou array. |
| Criar URA | `POST /ivrs/` | Confirmado | Mínimo: `{ name, type: 1, initialtext: "node_1", options: "[]", timeout: 300, buttons: "[]" }`. A interface permite escolher o tipo, com “URA avançada (Chat)” como padrão visual observado. |
| Atualizar URA | `PUT /ivrs/{ivrId}` | Confirmado | Reenviar o fluxo completo já lido, alterando somente os nós pretendidos. Usar `application/json; charset=utf-8`. |
| Automações disponíveis para agente | `GET /ivrs/getAgentAvailableAutomation` | Observado no frontend | Auxiliar de seleção; não usar para criar/editar. |

### Modelo de grafo

- `initialtext` aponta para o `id` do nó inicial.
- Todo nó tem `id`, `type`, `config`, coordenadas `x`/`y` e estado de
  configuração.
- `config.nextElementId` encadeia os nós. **Correção**: ao decodificar os
  4 arquivos `.ivr` reais em `config/defaults/Configs Instancia/` (ver
  `docs/default-profiles.md`), o campo que de fato encadeia é `out` no
  nível do nó (`{ id, type, out, config: {...} }`), não
  `config.nextElementId`. Nós do tipo `8` (Horário) encadeiam por dentro de
  `config.times[].out`, um `out` por faixa de horário. Os 4 templates
  decodificados foram normalizados para JSON em
  `server/src/integrations/atender-bem/defaults/` e usados como base real
  pelo `CONFIGURE_IVR` em vez de um grafo montado do zero.
- `options` é o grafo inteiro; normalizar com `JSON.parse` quando vier em
  string e serializar uma única vez no envio.
- Para mensagens com acento, enviar e aceitar UTF-8. Após salvar, reler e
  validar texto e coordenadas.

### Blocos principais para URA com mensagem personalizada

| `type` | Função | Campos relevantes de `config` |
| ---: | --- | --- |
| `0` | Mensagem | `text`, `fileId`, `nextElementId` |
| `1` | Pergunta | `text`, `varName`, `validate`, `validateError`, `nextElementId` |
| `2` | Opções/botões | `text`, `options`, `btnText`, `nextElementId` |
| `4` | Encerramento | `reason`, `obs`, `dontSendEndMsg`, `nextElementId` |
| `5` | Transferência | `destinationType`, `destinationId`, `filter`, `nextElementId` |
| `8` | Horário | `options`, `nextElementId` |
| `11` | Condição | `value`, `options`, `nextElementId` |
| `12` | HTTP | `method`, `url`, `headers`, `dataRaw`, `varPrefix`, `nextElementId` |
| `17` | Espera | `time`, `nextElementId` |
| `21` | JavaScript | `code`, `nextElementId` |
| `26` | Aguardar mensagem | `nextElementId` |
| `77` | Assistente IA | `assistantId`, `transferNextElementId`, `nextElementId` |
| `78` | Contexto para IA | `context`, `nextElementId` |

O corpus fornecido também mapeia muitos outros tipos. Antes de inserir um
bloco menos comum, consultar o exemplo real correspondente e não deduzir o
formato de `config` apenas pelo código numérico.

## 4. Etiquetas de contato

Tela: `/base/config/tagslist`.

| Ação | Rota | Estado | Contrato e observações |
| --- | --- | --- | --- |
| Listar etiquetas | `GET /tags/` | Confirmado no frontend | A resposta possui etiquetas de contato, FAQ, tarefa e CRM; o painel filtra por flags como `contacttag`, `faqtag`, `tasktag` e `dealtag`. |
| Criar etiqueta | `POST /tags/` | Confirmado por captura sanitizada | Corpo: `{ name, bgcolor, fgcolor, contacttag, faqtag, dealtag, tasktag, tickettag }`. A resposta retorna o recurso com `id`, `createdAt` e `updatedAt`. |
| Editar etiqueta | `PUT /tags/{tagId}` | Confirmado por captura sanitizada | Reenviar os campos editáveis completos: `name`, `bgcolor`, `fgcolor`, `contacttag`, `faqtag`, `dealtag`, `tasktag` e `tickettag`. Preservar o restante da resposta lida. |
| Excluir etiqueta | `DELETE /tags/{tagId}` | Confirmado por captura sanitizada; destrutivo | Sem corpo. A resposta devolve a representação do registro removido. Exigir confirmação humana imediatamente antes da chamada. |

Há duas famílias diferentes: esta página usa `/tags/` e controla etiquetas de
entidades; ela não é a API de etiquetas aplicadas ao chat.

### Esquema de exportação validado

Os arquivos `.tag` fornecidos para os perfis padrão são Base64 de um JSON. Após
decodificação, cada registro possui: `name`, `bgcolor`, `fgcolor`,
`contacttag`, `faqtag`, `dealtag`, `tasktag` e `tickettag`. Esse é o modelo de
dados a ser preservado pelo executor.

## 5. Etiquetas de chat

Tela: `/base/config/chattagslist`.

| Ação | Rota | Estado | Contrato e observações |
| --- | --- | --- | --- |
| Listar etiquetas de chat | `GET /chattags/getChatTags` | Confirmado no frontend | O painel usa `?t=<timestamp>` como cache buster. |
| Versão/cache | `GET /chattags/getVersion` | Confirmado no frontend | Endpoint de invalidação/cache, não fonte funcional principal. |
| Criar etiqueta | `POST /chattags/` | Confirmado por captura sanitizada | Mínimo observado: `{ name, color, priority: 0, fk_automation: 0, description, marker }`. A resposta cria `id`, `createdAt` e `updatedAt`. |
| Editar etiqueta | `PUT /chattags/{chatTagId}` | Confirmado por captura sanitizada | Corpo observado: `{ name, color, description, marker, priority, hidefromagents, fk_automation, locktag, queuesfilter, accessgroups, alertonpanel }`. Reler antes de editar e preservar campos retornados, como `reexecuteoninit`. |
| Excluir etiqueta | `DELETE /chattags/{chatTagId}` | Confirmado por captura sanitizada; destrutivo | Sem corpo. A resposta devolve a representação do registro removido. Exigir confirmação humana imediatamente antes da chamada. |

### Esquema de exportação validado

Os arquivos `.chattag` fornecidos para os perfis padrão são Base64 de JSON com
`name`, `color`, `description`, `marker`, `priority`, `hidefromagents`,
`locktag`, `queuesfilter` e `alertoncpanel`. A captura do `PUT` usa o campo
`alertonpanel`; tratar a diferença como compatibilidade de versões e preservar
o nome que vier na leitura antes de gravar. `color` é uma string composta de
três cores separadas por `-`; não normalizar nem separar esse campo.

## 6. Mensagens pré-definidas

Tela: `/base/config/predefinedtextslist`.

| Ação | Rota | Estado | Contrato e observações |
| --- | --- | --- | --- |
| Listar mensagens | `GET /predefinedtexts/textItens` | Confirmado no frontend | A tabela mostra `title` e `text`; `?t=<timestamp>` é somente cache buster. |
| Versão/cache | `GET /predefinedtexts/getTextsVersion` | Confirmado no frontend | Não usar para montar a lista. |
| Galeria associada | `GET /predefinedtexts/galleryItens` e `GET /predefinedtexts/getGalleryVersion` | Confirmado no frontend | Separada das mensagens de texto. |
| Listar grupos de acesso | `GET /contactsgroups/getGroups` | Confirmado por captura sanitizada | Retorna itens `{ id, name }`. Resolver os nomes escolhidos pelo operador para IDs imediatamente antes da gravação. |
| Criar | `POST /predefinedtexts` | Confirmado por captura sanitizada | Mínimo observado: `{ title, accessgroups: [groupId], text, buttons: [] }`. A resposta retorna `id`, `createdAt` e `updatedAt`. |
| Editar | `PUT /predefinedtexts/{textId}` | Confirmado por captura sanitizada | Reenviar `title`, `accessgroups`, `text` e `buttons`. Preservar também campos retornados, como `description`, `priority`, `sendtopbx` e `pbxname`, antes de editar um item existente. |
| Excluir | `DELETE /predefinedtexts/{textId}` | Confirmado por captura sanitizada; destrutivo | Sem corpo. A resposta devolve a representação removida. Exigir confirmação humana imediatamente antes da chamada. |

Máscaras exibidas no formulário: `!Saudacao!`, `!saudacao!` e `!nome!`.
Elas são processadas pelo produto e devem ser preservadas literalmente no
payload; não interpolar no backend de implantação.

## Fora de escopo: API pública

As rotas `/int/*` e qualquer autenticação por `apiKey` não fazem parte deste
projeto. O worker utilizará exclusivamente os endpoints administrativos da
instância com `Authorization: Bearer <token>` obtido em `POST /login`.

## Lacunas e critério para fechar o mapeamento

Não há lacunas de endpoint nas ações solicitadas (filas, usuários, URAs,
etiquetas e mensagens pré-definidas). A inspeção do bundle do painel confirmou
as leituras; as capturas sanitizadas completaram os contratos de escrita que
não estavam explícitos no bundle.

Para fechar essas lacunas sem poluir o tenant:

1. usar uma instância sandbox e nomes de teste com prefixo exclusivo;
2. capturar o request de criar, editar e excluir de cada recurso;
3. mascarar `Authorization`, `apiKey`, senhas e qualquer dado pessoal;
4. anexar request/response sanitizados a `docs/requests/`;
5. apagar os recursos de teste somente após registrar os IDs e o resultado;
6. trocar o estado desta tabela de “A confirmar” para “Confirmado”.

O serviço pode implementar com segurança filas, usuários, vínculo usuário–fila,
URAs, etiquetas e mensagens pré-definidas. As exclusões de etiquetas e
mensagens continuam exigindo confirmação humana imediatamente antes da chamada,
mesmo com a rota confirmada.

## Registro de validação no tenant de testes — 2026-09-02

Validação executada visualmente no tenant informado, com registros descartáveis
e releitura após cada operação que persistiu:

| Recurso | Criar | Editar | Excluir | Resultado |
| --- | --- | --- | --- | --- |
| Mensagem pré-definida | Validado | Validado | Validado | A mensagem criada, atualizada e removida não apareceu após a releitura final. O formulário confirmou `title` e `text` como obrigatórios. |
| Etiqueta de chat | Validado | Não validado | Validado | A ação de criar gera uma etiqueta padrão; o registro de teste criado foi removido e não apareceu após a releitura final. A edição continua pendente de um teste específico. |
| Etiqueta de contato | Falha de UI/retorno | Não aplicável | Não aplicável | Após salvar, o painel exibiu o item localmente e também uma mensagem de erro; ao recarregar, o item não persistiu. Tratar como falha do fluxo da tela até capturar o retorno HTTP do backend. |

Esses testes validam comportamento funcional e limpeza, mas **não revelam a
rota/verbo HTTP internos de escrita** no navegador disponível. Portanto, os
contratos de escrita continuam corretamente marcados como “A confirmar”; a
aplicação não deve adivinhar essas rotas. A próxima captura deve ser feita por
um proxy/DevTools que exponha a requisição de rede, em sandbox, e anexada de
forma sanitizada.
