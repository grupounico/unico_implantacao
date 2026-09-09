import type { UserDraft } from "./types";

/** O Atender Bem trata o login sem considerar capitalização. */
export function normalizeUsername(username: string): string {
  return username.replace(/\s/g, "").toLowerCase();
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
