import { canReopenOnboarding } from "./onboarding.service";

const allowed = ["WAITING_REVIEW", "COMPLETED", "FAILED", "PARTIALLY_FAILED"];
const blocked = ["ONBOARDING_PENDING", "ONBOARDING_IN_PROGRESS", "APPROVED", "QUEUED", "RUNNING", "CANCELLED"];

const failed = [...allowed.filter((status) => !canReopenOnboarding(status)), ...blocked.filter(canReopenOnboarding)];

if (failed.length > 0) {
  throw new Error(`Status de reabertura incorreto: ${failed.join(", ")}`);
}

console.log("OK  reabertura permite revisões somente quando não há execução em andamento");
