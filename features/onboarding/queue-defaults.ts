import { createId } from "./initial-data";
import {
  DEFAULT_CLOSING_REASON_NAMES,
  DEFAULT_INACTIVITY_MESSAGE,
  DEFAULT_OFF_HOURS_MESSAGE,
  DEFAULT_SATISFACTION_SURVEY_TEXT,
  DEFAULT_SATISFACTION_THANKS_MESSAGE,
  DEFAULT_WAITING_MESSAGE,
  type Channel,
  type QueueDraft,
} from "./types";

export function createDefaultClosingReasons() {
  return DEFAULT_CLOSING_REASON_NAMES.map((name) => ({ id: createId("closing-reason"), name }));
}

/** Troca o placeholder pelo nome da empresa já digitado no onboarding, quando existir. */
function buildDefaultWaitingMessage(companyName: string) {
  if (!companyName.trim()) return DEFAULT_WAITING_MESSAGE;
  return DEFAULT_WAITING_MESSAGE.replace("*NOME DA EMPRESA*", `*${companyName.trim()}*`);
}

/** Campos de "Identificação do canal" — os únicos que a cópia de outra fila não traz. */
export function createEmptyIdentification(channel: Channel, identifier: string = "") {
  return {
    name: "",
    channel,
    channelIdentifier: identifier,
    storeUnit: "",
    sector: "",
  };
}

export function createDefaultQueue(
  channel: Channel,
  identifier: string = "",
  companyName: string = "",
): QueueDraft {
  return {
    id: createId("queue"),
    ...createEmptyIdentification(channel, identifier),
    maxConcurrentChatsPerAgent: "15",
    distributionStrategy: "circular",
    contactRegistration: "automatic",
    transferPolicy: "any",
    transferableQueueIds: [],
    requiresClosingReason: false,
    closingReasons: createDefaultClosingReasons(),
    closesByInactivity: false,
    inactivityTimeout: "30m",
    inactivityMessage: DEFAULT_INACTIVITY_MESSAGE,
    weekdayHours: { enabled: true, start: "08:00", end: "18:00" },
    saturdayHours: { enabled: false, start: "08:00", end: "13:00" },
    sundayHolidayHours: { enabled: false, start: "08:00", end: "12:00" },
    offHoursMessage: DEFAULT_OFF_HOURS_MESSAGE,
    waitingMessage: buildDefaultWaitingMessage(companyName),
    sendSatisfactionSurvey: false,
    satisfactionSurveyText: DEFAULT_SATISFACTION_SURVEY_TEXT,
    satisfactionThanksMessage: DEFAULT_SATISFACTION_THANKS_MESSAGE,
  };
}

/** Copia tudo de uma fila existente, exceto a identificação (a única parte que precisa ser preenchida de novo). */
export function copyQueueConfig(source: QueueDraft, channel: Channel, identifier: string = ""): QueueDraft {
  return {
    ...source,
    id: createId("queue"),
    ...createEmptyIdentification(channel, identifier),
    closingReasons: source.closingReasons.map((reason) => ({ ...reason, id: createId("closing-reason") })),
  };
}
