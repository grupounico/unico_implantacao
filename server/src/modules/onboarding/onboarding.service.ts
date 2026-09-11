import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ConflictError, NotFoundError } from "../../lib/errors";
import {
  duplicateUsernames,
  invalidUsernames,
  tooLongUsernames,
  USERNAME_MAX_LENGTH,
  type SaveOnboardingInput,
} from "./onboarding.schema";

const EDITABLE_STATUSES = ["ONBOARDING_PENDING", "ONBOARDING_IN_PROGRESS"];
export const ONBOARDING_TOKEN_TTL_DAYS = 14;

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

function assertEditable(status: string) {
  if (!EDITABLE_STATUSES.includes(status)) {
    throw new ConflictError("Este onboarding já foi enviado e não pode mais ser editado");
  }
}

function assertUniqueUsernames(responses: unknown) {
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

export const onboardingService = { getByToken, saveProgress, submit, rotateToken };
