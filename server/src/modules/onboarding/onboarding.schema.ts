import { z } from "zod";

export const USERNAME_MAX_LENGTH = 32;

export const saveOnboardingSchema = z.object({
  currentStep: z.string().optional(),
  responses: z.record(z.string(), z.unknown()),
});

export type SaveOnboardingInput = z.infer<typeof saveOnboardingSchema>;

/** Retorna logins repetidos, ignorando maiúsculas/minúsculas e espaços nas pontas. */
function onboardingUsernames(responses: unknown): string[] {
  const parsed = z
    .object({
      team: z.object({ users: z.array(z.object({ username: z.string() })).default([]) }).optional(),
    })
    .passthrough()
    .safeParse(responses);

  if (!parsed.success) return [];

  return (parsed.data.team?.users ?? []).map((user) => user.username);
}

/** Respostas rápidas ativas precisam ter título e texto antes de chegar ao worker. */
export function hasInvalidQuickReplies(responses: unknown): boolean {
  const parsed = z
    .object({
      customization: z
        .object({
          quickReplies: z
            .array(z.object({ shortcut: z.string(), message: z.string(), selected: z.boolean() }))
            .default([]),
        })
        .optional(),
    })
    .passthrough()
    .safeParse(responses);

  return parsed.success && parsed.data.customization?.quickReplies.some(
    (reply) => reply.selected && (!reply.shortcut.trim() || !reply.message.trim()),
  ) === true;
}

/** Um login do Atender Bem deve estar em minúsculas e não pode conter espaços. */
export function invalidUsernames(responses: unknown): string[] {
  return onboardingUsernames(responses).filter(
    (username) => username !== username.replace(/\s/g, "").toLowerCase(),
  );
}

/** Um login do Atender Bem não pode ter mais de USERNAME_MAX_LENGTH caracteres. */
export function tooLongUsernames(responses: unknown): string[] {
  return onboardingUsernames(responses).filter((username) => username.length > USERNAME_MAX_LENGTH);
}

/** Retorna logins repetidos, ignorando maiúsculas/minúsculas e espaços. */
export function duplicateUsernames(responses: unknown): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const username of onboardingUsernames(responses)) {
    const normalized = username.replace(/\s/g, "").toLowerCase();
    if (!normalized) continue;
    if (seen.has(normalized)) duplicates.add(normalized);
    seen.add(normalized);
  }
  return [...duplicates];
}
