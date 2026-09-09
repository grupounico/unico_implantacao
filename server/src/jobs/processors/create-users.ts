import { randomInt } from "node:crypto";
import { z } from "zod";
import { users } from "../../integrations/atender-bem";
import { OPERATIONAL_USER_DEFAULTS } from "../../integrations/atender-bem/users";
import type { Processor } from "./types";

const ROLE_TYPE_MAP: Record<string, 0 | 1 | 2> = {
  administrador: 0,
  supervisor: 1,
  atendente: 2,
};

// Perfis que exigem ramal (sipuser) — ver docs/atenderbem-endpoints.md.
const ROLES_REQUIRING_EXTENSION = new Set(["administrador", "supervisor"]);

/**
 * O onboarding não pergunta mais o ramal ao cliente (decisão de produto —
 * ninguém fora da equipe técnica saberia que número usar). Quando o Atender
 * Bem exige um `sipuser` para o perfil mesmo assim, geramos um número
 * aleatório de 3 dígitos (100–999) na hora de criar. `used` evita colisão
 * entre usuários desta mesma leva.
 */
function generateExtension(used: Set<string>): string {
  let candidate: string;
  do {
    candidate = String(Math.floor(Math.random() * 900) + 100);
  } while (used.has(candidate));
  used.add(candidate);
  return candidate;
}

// Decisão de produto: se o cliente não definir uma senha padrão própria no
// onboarding, geramos uma senha aleatória por implantação (não mais uma
// constante fixa no código — ver docs/security-audit) e devolvemos no
// metadata da etapa, visível na aba "Atividade" só para quem já tem acesso
// a esta implantação. O implantador repassa ao cliente por fora do código;
// cada usuário deve trocá-la no primeiro login.
const PASSWORD_CHARS = {
  upper: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  lower: "abcdefghijkmnopqrstuvwxyz",
  digit: "23456789",
  symbol: "!@#$%*?",
};

function generateDefaultPassword(): string {
  const pick = (chars: string) => chars[randomInt(chars.length)];
  const all = Object.values(PASSWORD_CHARS).join("");
  const required = [
    pick(PASSWORD_CHARS.upper),
    pick(PASSWORD_CHARS.lower),
    pick(PASSWORD_CHARS.digit),
    pick(PASSWORD_CHARS.symbol),
  ];
  const rest = Array.from({ length: 8 }, () => pick(all));
  const chars = [...required, ...rest];
  // Embaralha (Fisher-Yates) pra não deixar os 4 caracteres obrigatórios
  // sempre nas primeiras posições.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

const payloadSchema = z.object({
  team: z
    .object({
      users: z
        .array(
          z.object({
            name: z.string().min(1),
            // Login do Atender Bem — não é e-mail.
            username: z.string().min(1),
            role: z.string(),
            extension: z.string().default(""),
          }),
        )
        .default([]),
      usesCustomDefaultPassword: z.boolean().default(false),
      defaultPassword: z.string().default(""),
    })
    .default({ users: [], usesCustomDefaultPassword: false, defaultPassword: "" }),
});

export const createUsersProcessor: Processor = async ({ client, snapshotPayload }) => {
  const { team } = payloadSchema.parse(snapshotPayload);

  if (team.users.length === 0) {
    return { metadata: { users: [] } };
  }

  const usernames = new Set<string>();
  for (const user of team.users) {
    const normalizedUsername = user.username.replace(/\s/g, "").toLowerCase();
    if (user.username !== normalizedUsername) {
      throw new Error(`O login \"${user.username}\" deve estar em letras minúsculas e não pode ter espaços.`);
    }
    if (usernames.has(normalizedUsername)) {
      throw new Error(`O login \"${user.username}\" está duplicado no onboarding. Cada usuário deve ter um login único.`);
    }
    usernames.add(normalizedUsername);
  }

  const usesGeneratedPassword = !(team.usesCustomDefaultPassword && team.defaultPassword);
  const password = usesGeneratedPassword ? generateDefaultPassword() : team.defaultPassword;

  // Idempotente: se o username já existir, não recria (e não mexe na senha).
  const existing = await users.listUsers(client);
  const result: { username: string; id: number; created: boolean }[] = [];
  // Evita colisão entre ramais gerados nesta mesma leva (ver generateExtension).
  const usedExtensions = new Set<string>();

  for (const user of team.users) {
    const type = ROLE_TYPE_MAP[user.role];
    if (type === undefined) {
      throw new Error(`Perfil "${user.role}" desconhecido para criação de usuário`);
    }

    const found = existing.find((candidate) => candidate.username === user.username);
    if (found) {
      // Sincroniza nome/perfil num usuário já existente em vez de só
      // confirmar o id (mesmo motivo das etiquetas e respostas rápidas:
      // mudanças depois do primeiro deploy precisam chegar no usuário real).
      // Não mexe na senha nem no ramal — reprocessar não deve trocar um
      // ramal que já foi gerado/atribuído.
      await users.updateUser(client, found.id, {
        fullname: user.name,
        type,
        ...OPERATIONAL_USER_DEFAULTS,
      });
      result.push({ username: user.username, id: found.id, created: false });
      continue;
    }

    // O onboarding não pede mais ramal pro cliente — gera um aleatório só
    // quando o Atender Bem realmente exige (administrador/supervisor).
    const extension = ROLES_REQUIRING_EXTENSION.has(user.role)
      ? generateExtension(usedExtensions)
      : "";

    const created = await users.createUser(client, {
      username: user.username,
      fullname: user.name,
      password,
      type,
      ...(extension ? { sipuser: extension } : {}),
    });
    result.push({ username: user.username, id: created.id, created: true });
  }

  const anyCreated = result.some((user) => user.created);

  return {
    metadata: {
      users: result,
      // Só exposta quando de fato foi usada pra criar alguém nesta
      // execução — vai para a aba "Atividade", visível a quem já tem
      // acesso a esta implantação, pro implantador repassar ao cliente.
      ...(usesGeneratedPassword && anyCreated ? { generatedDefaultPassword: password } : {}),
    },
  };
};
