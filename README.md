# Unico Implantação

Painel para conduzir a implantação de instâncias do **Atender Bem**. O sistema cria a solicitação, disponibiliza um onboarding público ao cliente, permite a revisão pelo implantador e executa as configurações da instância em segundo plano.


## O que o sistema faz

- Cria solicitações de implantação a partir de um plano do Atender Bem.
- Atribui automaticamente o usuário que abriu a solicitação como implantador.
- Gera um link de onboarding público, com token revogável e rotacionável.
- Coleta dados da empresa, filas, equipe, pausas, etiquetas, respostas rápidas e observações operacionais.
- Permite anexar uma planilha CSV ou XLSX de contatos para consulta manual no painel; ela não é importada automaticamente para a instância.
- Mantém uma etapa de revisão antes da aprovação.
- Provisiona filas, usuários, vínculos de usuários às filas, URAs, tipos de pausa, etiquetas e respostas rápidas por meio de jobs em fila.
- Mostra o andamento, as falhas por etapa e permite reprocessar uma etapa.

## Arquitetura

| Componente | Tecnologia | Responsabilidade |
| --- | --- | --- |
| Painel e onboarding | Next.js 16 / React | Interface administrativa e formulário público |
| API | Express / TypeScript | Autenticação, regras de negócio e endpoints |
| Banco | PostgreSQL / Prisma | Solicitações, onboarding, auditoria e histórico de jobs |
| Fila | Redis / BullMQ | Execução assíncrona da implantação |
| Worker | Node.js / BullMQ | Processa as etapas de provisionamento no Atender Bem |
| Infraestrutura | Docker Compose, Nginx, PM2 e Vercel | Dependências locais e publicação |

O frontend se comunica com a API usando `NEXT_PUBLIC_API_BASE_URL`. Em produção, a API é exposta sob o prefixo `/api/imp` e encaminhada pelo Nginx para o processo Express.

## Fluxo operacional

1. Um usuário autenticado cria uma solicitação e seleciona o plano.
2. O criador fica atribuído como implantador automaticamente; o campo pode ser alterado depois no painel.
3. O cliente recebe o link de onboarding, preenche as etapas e envia a revisão.
4. O implantador confere os dados e aprova a solicitação.
5. A API enfileira as etapas e o worker as executa na instância do Atender Bem.
6. O painel apresenta o resultado de cada etapa e permite repetir apenas a etapa que falhou.

As etapas são idempotentes: se um recurso controlado já existir, ele é atualizado ou reutilizado em vez de ser duplicado. O vínculo de usuários às filas só é executado quando a criação de filas e usuários foi concluída.

### Limites de usuários

O Atender Bem cria uma conta de administrador técnica junto com cada instância. Por isso, o número de administradores apresentado no onboarding desconta essa conta padrão. Um plano com `1` administrador, por exemplo, exibe `0` administradores adicionais para o cliente; perfis com quota zero não aparecem como opção nem nos badges do onboarding.

## Pré-requisitos

- Node.js 20.9 ou superior (Node 22 recomendado).
- Docker e Docker Compose.
- PostgreSQL e Redis, executados pelo Compose ou fornecidos externamente.
- Credenciais de parceiro do Atender Bem com TOTP.

## Configuração local

Instale as dependências do frontend e do servidor:

```bash
npm install
npm --prefix server install
```

Crie os arquivos de ambiente a partir dos exemplos:

```bash
cp .env.compose.example .env.compose
cp server/.env.example server/.env
```

Preencha `.env.compose` com as credenciais locais do PostgreSQL e Redis. Em `server/.env`, use as mesmas conexões. Quando o Redis do Compose usa senha, o `REDIS_URL` deve incluí-la:

```dotenv
DATABASE_URL="postgresql://unico:SUA_SENHA@localhost:5433/unico_implantacao"
REDIS_URL="redis://:SUA_SENHA_REDIS@localhost:6379"
```

Suba as dependências e aplique o schema:

```bash
set -a; . ./.env.compose; set +a
docker compose up -d

cd server
npx prisma generate
npx prisma migrate deploy
npm run seed:admin
cd ..
```

Inicie **os três processos** abaixo em terminais separados:

```bash
# frontend
npm run dev

# API
npm --prefix server run dev

# worker de implantação e filas
npm --prefix server run dev:worker
```

| Serviço | Endereço |
| --- | --- |
| Frontend | `http://localhost:3000` |
| API | `http://localhost:4000` |
| Health check | `http://localhost:4000/health` |
| PostgreSQL | `localhost:5433` |
| Redis | `localhost:6379` |

Sem o worker, uma aprovação fica enfileirada mas as filas e demais recursos não são criados. Para demonstrar uma implantação local, mantenha API, Redis e worker ativos antes de clicar em **Aprovar**.

## Variáveis de ambiente

### Frontend (`.env.local`)

| Variável | Uso |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | URL pública da API; é exposta ao navegador |
| `JWT_SECRET` | Segredo compartilhado da sessão; deve ser igual ao da API |

### API e worker (`server/.env`)

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Conexão PostgreSQL |
| `REDIS_URL` | Conexão Redis usada pela BullMQ |
| `PORT` | Porta da API Express |
| `CREDENTIALS_ENCRYPTION_KEY` | Chave para cifrar dados sensíveis armazenados |
| `JWT_SECRET` | Assinatura da sessão; igual ao valor do frontend |
| `FRONTEND_URL` | Origem permitida no CORS, sem barra final |
| `PARTNER_ATENDERBEM_BASE_URL` | URL base da conta de parceiro/revenda |
| `PARTNER_ATENDERBEM_USERNAME` | Usuário da conta de implantador |
| `PARTNER_ATENDERBEM_PASSWORD` | Senha da conta de implantador |
| `PARTNER_ATENDERBEM_TOTP_SECRET` | Segredo TOTP da conta de implantador |
| `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Primeiro administrador do painel |

Nunca versione `.env`, `.env.local`, `.env.compose`, senhas, tokens ou segredos TOTP. Em produção, os arquivos de ambiente devem ter permissão `600`.

## Rotas principais da API

Todas as rotas, com exceção de login e onboarding, exigem sessão autenticada.

| Grupo | Exemplos |
| --- | --- |
| Saúde | `GET /health` |
| Sessão | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Planos | `GET /plans` |
| Implantações | `POST /implantations`, `GET /implantations`, `PATCH /implantations/:id` |
| Revisão | `GET/PATCH /implantations/:id/review`, `POST /implantations/:id/approve` |
| Execução | `GET /deployments/:implantationId`, `POST /deployments/:implantationId/jobs/:type/retry` |
| Onboarding público | `GET/PUT /onboarding/:token`, `POST /onboarding/:token/submit` |
| Arquivo de contatos | `POST /onboarding/:token/contact-import`, `GET /implantations/:id/contact-import/download` |

## Upload de contatos

O onboarding aceita um arquivo **CSV ou XLSX** de até 10 MB. O arquivo é guardado fora da pasta pública e só pode ser baixado por usuário autenticado no painel da implantação. Ele serve como material de referência para o implantador; a importação para o Atender Bem não é automática.

## Build e validação

```bash
# TypeScript do frontend
npx tsc --noEmit

# TypeScript do backend
npm --prefix server run build

# Build do frontend
npm run build

# Verificar migrations
cd server && npx prisma migrate status
```

## Publicação

### Frontend

O frontend é publicado pela Vercel a partir da branch `main`. Configure na Vercel as duas variáveis de `.env.local` para produção e faça um novo deploy após qualquer mudança de `NEXT_PUBLIC_API_BASE_URL`.

### Backend na VPS

Na pasta do projeto na VPS:

```bash
git pull --ff-only
npm --prefix server install
npm --prefix server run build

cd server
npx prisma generate
npx prisma migrate deploy
cd ..

pm2 restart unico-implantacao-api unico-implantacao-worker --update-env
pm2 save
```

Se o frontend também estiver servido por PM2 na VPS, faça o build com Node 20+ e reinicie **somente** o processo `unico-implantacao-web`. Não execute `pm2 update` como parte do deploy: ele é uma atualização global do gerenciador e pode impactar serviços fora deste projeto.

O Nginx só precisa encaminhar `/api/imp/` para a API. Não é necessário expor PostgreSQL ou Redis publicamente.

## Operação segura

- Não remova recursos de uma instância do Atender Bem por endpoints não documentados ou não validados.
- Para uma nova demonstração, prefira uma instância nova em vez de reutilizar uma que já recebeu filas, usuários ou URAs.
- Antes de repetir uma etapa, leia a mensagem de falha exibida no painel. Uma etapa dependente é pulada propositalmente quando sua dependência falha.
- Faça backup do banco antes de migrations manuais ou alterações de produção.
