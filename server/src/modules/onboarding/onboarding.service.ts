import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { auditLogService } from "../audit-logs/audit-log.service";
import { AUDIT_ACTIONS } from "../audit-logs/audit-log.constants";
import type { AuthenticatedUser } from "../../lib/access-control";
import { ConflictError, NotFoundError } from "../../lib/errors";
import {
  duplicateUsernames,
  hasInvalidQuickReplies,
  invalidUsernames,
  tooLongUsernames,
  USERNAME_MAX_LENGTH,
  type SaveOnboardingInput,
} from "./onboarding.schema";

const EDITABLE_STATUSES = ["ONBOARDING_PENDING", "ONBOARDING_IN_PROGRESS"];
const REOPENABLE_STATUSES = ["WAITING_REVIEW", "COMPLETED", "FAILED", "PARTIALLY_FAILED"];
export const ONBOARDING_TOKEN_TTL_DAYS = 14;

export function canReopenOnboarding(status: string) {
  return REOPENABLE_STATUSES.includes(status);
}

export function onboardingTokenExpiresAt() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ONBOARDING_TOKEN_TTL_DAYS);
  return expiresAt;
}

async function findImplantationByToken(token: string) {
  const implantation = await prisma.implantation.findUnique({
    where: { onboardingToken: token },
    include: { onboarding: true },
  });

  if (!implantation) {
    throw new NotFoundError("Link de onboarding inválido");
  }

  if (
    implantation.onboardingTokenRevokedAt ||
    !implantation.onboardingTokenExpiresAt ||
    implantation.onboardingTokenExpiresAt <= new Date()
  ) {
    throw new NotFoundError("Link de onboarding inválido");
  }

  return implantation;
}

/** Rotaciona o bearer token: o valor anterior deixa de autorizar imediatamente. */
async function rotateToken(implantationId: string) {
  const implantation = await prisma.implantation.findUnique({ where: { id: implantationId } });
  if (!implantation) throw new NotFoundError("Implantação não encontrada");

  return prisma.implantation.update({
    where: { id: implantationId },
    data: {
      onboardingToken: crypto.randomUUID(),
      onboardingTokenExpiresAt: onboardingTokenExpiresAt(),
      onboardingTokenRevokedAt: null,
    },
    select: { onboardingToken: true, onboardingTokenExpiresAt: true },
  });
}

/** Cria uma revisão de uma implantação concluída ou em análise, sempre com novo token público. */
async function reopen(implantationId: string, actor: AuthenticatedUser & { name: string }) {
  const implantation = await prisma.implantation.findUnique({
    where: { id: implantationId },
    include: { onboarding: true },
  });
  if (!implantation) throw new NotFoundError("Implantação não encontrada");
  if (!canReopenOnboarding(implantation.status)) {
    throw new ConflictError("A implantação só pode ser revisada após a execução terminar ou enquanto aguarda revisão");
  }

  const latestSnapshot = await prisma.deploymentSnapshot.findFirst({
    where: { implantationId },
    orderBy: { version: "desc" },
  });
  const responses =
    latestSnapshot?.payload ??
    implantation.onboarding?.reviewedResponses ??
    implantation.onboarding?.responses ??
    {};

  const updated = await prisma.$transaction(async (tx) => {
    await tx.onboarding.upsert({
      where: { implantationId },
      create: { implantationId, responses: responses as Prisma.InputJsonValue },
      update: {
        responses: responses as Prisma.InputJsonValue,
        reviewedResponses: Prisma.DbNull,
        submittedAt: null,
        currentStep: "welcome",
      },
    });
    return tx.implantation.update({
      where: { id: implantationId },
      data: {
        status: "ONBOARDING_IN_PROGRESS",
        onboardingToken: crypto.randomUUID(),
        onboardingTokenExpiresAt: onboardingTokenExpiresAt(),
        onboardingTokenRevokedAt: null,
      },
      select: { onboardingToken: true, onboardingTokenExpiresAt: true },
    });
  });

  await auditLogService.record({
    actor,
    action: AUDIT_ACTIONS.IMPLANTATION_ONBOARDING_REOPENED,
    entityType: "Implantation",
    entityId: implantationId,
    metadata: { previousStatus: implantation.status, snapshotVersion: latestSnapshot?.version ?? null },
  });
  return updated;
}

function assertEditable(status: string) {
  if (!EDITABLE_STATUSES.includes(status)) {
    throw new ConflictError("Este onboarding já foi enviado e não pode mais ser editado");
  }
}

function assertUniqueUsernames(responses: unknown) {
  if (hasInvalidQuickReplies(responses)) {
    throw new ConflictError("Toda resposta rápida ativa precisa ter título e texto.");
  }
  const invalid = invalidUsernames(responses);
  if (invalid.length > 0) {
    throw new ConflictError(`O login \"${invalid[0]}\" deve estar em letras minúsculas e não pode ter espaços.`);
  }
  const tooLong = tooLongUsernames(responses);
  if (tooLong.length > 0) {
    throw new ConflictError(`O login \"${tooLong[0]}\" excede o limite de ${USERNAME_MAX_LENGTH} caracteres.`);
  }
  const duplicates = duplicateUsernames(responses);
  if (duplicates.length > 0) {
    throw new ConflictError(`O login \"${duplicates[0]}\" foi informado mais de uma vez. Cada usuário deve ter um login único.`);
  }
}

async function getByToken(token: string) {
  const implantation = await findImplantationByToken(token);

  return {
    companyName: implantation.companyName,
    status: implantation.status,
    currentStep: implantation.onboarding?.currentStep ?? null,
    responses: implantation.onboarding?.responses ?? {},
    submittedAt: implantation.onboarding?.submittedAt ?? null,
    // Limites de usuário por tipo, definidos pelo plano escolhido na criação
    // da implantação — a etapa de equipe do onboarding usa isso para não
    // deixar o cliente cadastrar mais usuários do que o plano permite.
    userQuotas:
      implantation.agentQuota != null &&
      implantation.supervisorQuota != null &&
      implantation.adminQuota != null
        ? {
            atendente: implantation.agentQuota,
            supervisor: implantation.supervisorQuota,
            administrador: implantation.adminQuota,
          }
        : null,
  };
}

async function saveProgress(token: string, data: SaveOnboardingInput) {
  const implantation = await findImplantationByToken(token);
  assertEditable(implantation.status);
  assertUniqueUsernames(data.responses);

  const now = new Date();

  const onboarding = await prisma.onboarding.upsert({
    where: { implantationId: implantation.id },
    create: {
      implantationId: implantation.id,
      currentStep: data.currentStep,
      responses: data.responses as Prisma.InputJsonValue,
      startedAt: now,
      lastSavedAt: now,
    },
    update: {
      currentStep: data.currentStep,
      responses: data.responses as Prisma.InputJsonValue,
      lastSavedAt: now,
    },
  });

  if (implantation.status === "ONBOARDING_PENDING") {
    await prisma.implantation.update({
      where: { id: implantation.id },
      data: { status: "ONBOARDING_IN_PROGRESS" },
    });
  }

  return onboarding;
}

async function submit(token: string) {
  const implantation = await findImplantationByToken(token);
  assertEditable(implantation.status);
  assertUniqueUsernames(implantation.onboarding?.responses ?? {});

  const now = new Date();

  const onboarding = await prisma.onboarding.upsert({
    where: { implantationId: implantation.id },
    create: {
      implantationId: implantation.id,
      responses: {},
      startedAt: now,
      lastSavedAt: now,
      submittedAt: now,
    },
    update: {
      submittedAt: now,
    },
  });

  await prisma.implantation.update({
    where: { id: implantation.id },
    data: { status: "WAITING_REVIEW" },
  });

  return onboarding;
}

export const onboardingService = { getByToken, saveProgress, submit, rotateToken, reopen };
