import type { UserDraft } from "./types";

/** Mesmo limite de USERNAME_MAX_LENGTH em server/src/modules/onboarding/onboarding.schema.ts. */
export const USERNAME_MAX_LENGTH = 32;

/** O Atender Bem trata o login sem considerar capitalização. */
export function normalizeUsername(username: string): string {
  return username.replace(/\s/g, "").toLowerCase().slice(0, USERNAME_MAX_LENGTH);
}

export function hasDuplicateUsername(
  users: Pick<UserDraft, "id" | "username">[],
  user: Pick<UserDraft, "id" | "username">,
): boolean {
  const username = normalizeUsername(user.username);
  return Boolean(username) && users.some(
    (candidate) => candidate.id !== user.id && normalizeUsername(candidate.username) === username,
  );
}

export function hasDuplicateUsernames(users: Pick<UserDraft, "id" | "username">[]): boolean {
  return users.some((user) => hasDuplicateUsername(users, user));
}
