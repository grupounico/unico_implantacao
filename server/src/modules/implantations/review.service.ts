import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ConflictError, NotFoundError } from "../../lib/errors";
import { deploymentService } from "../deployments/deployment.service";
import { implantationAccessWhere, type AuthenticatedUser } from "../../lib/access-control";
import { AUDIT_ACTIONS } from "../audit-logs/audit-log.constants";
import { auditLogService } from "../audit-logs/audit-log.service";
import {
  duplicateUsernames,
  invalidUsernames,
  tooLongUsernames,
  USERNAME_MAX_LENGTH,
} from "../onboarding/onboarding.schema";

type Actor = AuthenticatedUser & { name: string };

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

async function findImplantationWithOnboarding(implantationId: string, user: AuthenticatedUser) {
  const implantation = await prisma.implantation.findFirst({
    where: { AND: [{ id: implantationId }, implantationAccessWhere(user)] },
    include: { onboarding: true },
  });

  if (!implantation) {
    throw new NotFoundError("Implantação não encontrada");
  }

  if (!implantation.onboarding) {
    throw new NotFoundError("O cliente ainda não enviou o onboarding");
  }

  return implantation;
}

async function getReview(implantationId: string, user: AuthenticatedUser) {
  const implantation = await findImplantationWithOnboarding(implantationId, user);
  const onboarding = implantation.onboarding!;

  return {
    implantation: {
      id: implantation.id,
      companyName: implantation.companyName,
      instanceName: implantation.instanceName,
      status: implantation.status,
    },
    submittedAt: onboarding.submittedAt,
    clientResponses: onboarding.responses,
    reviewedResponses: onboarding.reviewedResponses,
  };
}

async function updateReviewResponses(
  implantationId: string,
  responses: Record<string, unknown>, actor: Actor,
) {
  assertUniqueUsernames(responses);
  const implantation = await findImplantationWithOnboarding(implantationId, actor);

  if (implantation.status !== "WAITING_REVIEW") {
    throw new ConflictError(
      "Só é possível editar as respostas enquanto a implantação aguarda revisão",
    );
  }

  const onboarding = await prisma.onboarding.update({
    where: { implantationId },
    data: { reviewedResponses: responses as Prisma.InputJsonValue },
  });

  await auditLogService.record({
    actor,
    action: AUDIT_ACTIONS.IMPLANTATION_REVIEW_UPDATED,
    entityType: "Implantation",
    entityId: implantationId,
  });

  return onboarding;
}

async function approve(implantationId: string, approvedBy: string, actor: Actor) {
  const implantation = await findImplantationWithOnboarding(implantationId, actor);

  if (implantation.status !== "WAITING_REVIEW") {
    throw new ConflictError(
      "Só é possível aprovar implantações que estejam aguardando revisão",
    );
  }

  const onboarding = implantation.onboarding!;
  const approvedPayload = onboarding.reviewedResponses ?? onboarding.responses;
  assertUniqueUsernames(approvedPayload);

  const lastSnapshot = await prisma.deploymentSnapshot.findFirst({
    where: { implantationId },
    orderBy: { version: "desc" },
  });
  const nextVersion = (lastSnapshot?.version ?? 0) + 1;

  const [snapshot] = await prisma.$transaction([
    prisma.deploymentSnapshot.create({
      data: {
        implantationId,
        version: nextVersion,
        payload: approvedPayload as Prisma.InputJsonValue,
        approvedBy,
      },
    }),
    prisma.implantation.update({
      where: { id: implantationId },
      data: { status: "APPROVED" },
    }),
  ]);

  // "Aprovar e iniciar implantação" é uma ação única: aprovar já dispara a automação.
  await deploymentService.startRun(implantationId, snapshot.id);

  await auditLogService.record({
    actor,
    action: AUDIT_ACTIONS.IMPLANTATION_APPROVED,
    entityType: "Implantation",
    entityId: implantationId,
    metadata: { snapshotVersion: nextVersion },
  });

  return snapshot;
}

export const reviewService = { getReview, updateReviewResponses, approve };
