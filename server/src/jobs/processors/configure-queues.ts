import { z } from "zod";
import { businessHours, queues } from "../../integrations/atender-bem";
import type { BusinessHoursDay } from "../../integrations/atender-bem/business-hours";
import type { Processor } from "./types";

/** Ver "Tipos de fila observados" em docs/atenderbem-endpoints.md. */
const CHANNEL_TYPE_MAP: Record<string, number> = {
  whatsapp: 21,
  instagram: 12,
  facebook: 2,
  telegram: 3,
};

/** Confirmado observando `PUT /queues/:id` no painel real ao trocar a opção. */
const DISTRIBUTION_STRATEGY_MAP: Record<string, number> = {
  least_chats: 0,
  circular: 3,
  agent_pull: 4, // "Desabilitar distribuição automática" — o atendente puxa manualmente.
};

/** "Salvar contatos automaticamente": Sim = 1, Não = 0 (confirmado no painel real). */
const CONTACT_REGISTRATION_MAP: Record<string, number> = {
  automatic: 1,
  manual: 0,
};

/** `clienttimeout` é armazenado em SEGUNDOS (confirmado: "30 minutos" no painel → 1800). */
const INACTIVITY_SECONDS: Record<string, number> = {
  "5m": 300,
  "10m": 600,
  "15m": 900,
  "30m": 1800,
  "1h": 3600,
  "2h": 7200,
  "24h": 86400,
};

const dayHoursSchema = z.object({
  enabled: z.boolean().default(false),
  start: z.string().default("08:00"),
  end: z.string().default("18:00"),
});

const queueSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  channel: z.string(),
  maxConcurrentChatsPerAgent: z.string().default(""),
  distributionStrategy: z.string().default("least_chats"),
  contactRegistration: z.string().default("automatic"),
  transferPolicy: z.string().default("any"),
  transferableQueueIds: z.array(z.string()).default([]),
  requiresClosingReason: z.boolean().default(false),
  closingReasons: z.array(z.object({ id: z.string(), name: z.string() })).default([]),
  closesByInactivity: z.boolean().default(false),
  inactivityTimeout: z.string().default("30m"),
  inactivityMessage: z.string().default(""),
  weekdayHours: dayHoursSchema,
  saturdayHours: dayHoursSchema,
  sundayHolidayHours: dayHoursSchema,
  offHoursMessage: z.string().default(""),
  sendSatisfactionSurvey: z.boolean().default(false),
  satisfactionSurveyText: z.string().default(""),
  satisfactionThanksMessage: z.string().default(""),
});

type QueueInput = z.infer<typeof queueSchema>;

const payloadSchema = z.object({
  service: z
    .object({ queues: z.array(queueSchema).default([]) })
    .default({ queues: [] }),
});

function buildDay(dayOfWeek: number, hours: z.infer<typeof dayHoursSchema>): BusinessHoursDay {
  return {
    day_of_week: dayOfWeek,
    is_open: hours.enabled ? 1 : 0,
    periods: hours.enabled
      ? [{ period_order: 1, open_time: `${hours.start}:00`, close_time: `${hours.end}:00` }]
      : [],
  };
}

/**
 * Cria uma configuração de horário e a vincula à fila. Para filas existentes
 * também cria uma substituta: o POST e o PUT da fila são contratos
 * confirmados, enquanto o endpoint de edição do recurso de horário não é.
 * Assim, um reprocessamento aplica a agenda e a mensagem sem arriscar uma
 * rota REST inferida.
 */
async function ensureBusinessHoursConfig(
  client: Parameters<typeof queues.getQueue>[0],
  queueId: number,
  queue: QueueInput,
): Promise<number> {
  const config = await businessHours.createBusinessHoursConfig(client, {
    name: `${queue.name} — Horário de atendimento`,
    message: queue.offHoursMessage,
    weeklySchedules: [
      buildDay(0, queue.sundayHolidayHours), // domingo
      buildDay(1, queue.weekdayHours),
      buildDay(2, queue.weekdayHours),
      buildDay(3, queue.weekdayHours),
      buildDay(4, queue.weekdayHours),
      buildDay(5, queue.weekdayHours),
      buildDay(6, queue.saturdayHours), // sábado
    ],
    holidayConfig: {
      is_open: queue.sundayHolidayHours.enabled ? 1 : 0,
      message: queue.offHoursMessage,
      periods: queue.sundayHolidayHours.enabled
        ? [
            {
              period_order: 1,
              open_time: `${queue.sundayHolidayHours.start}:00`,
              close_time: `${queue.sundayHolidayHours.end}:00`,
            },
          ]
        : [],
    },
  });

  return config.id;
}

/**
 * Campos do QueueDraft com contrato confirmado na fila real (observando
 * `PUT /queues/:id` no painel de admin com a instância de testes). Fica de
 * fora: bloquear transferência por completo (`transferPolicy: "none"`) —
 * `transferfilters` só restringe para QUAIS filas transferir, não achamos
 * um campo que desabilite a transferência inteira, então "none" hoje se
 * comporta como "any" (sem filtro). Documentado aqui em vez de adivinhar.
 */
function buildQueuePatch(
  queue: QueueInput,
  queueNameById: Map<string, string>,
  businessHoursConfigId: number | undefined,
) {
  const maxChats = Number(queue.maxConcurrentChatsPerAgent);
  const inactivitySeconds = queue.closesByInactivity
    ? (INACTIVITY_SECONDS[queue.inactivityTimeout] ?? null)
    : null;

  const transferNames =
    queue.transferPolicy === "specific"
      ? queue.transferableQueueIds
          .map((id) => queueNameById.get(id))
          .filter((name): name is string => Boolean(name))
      : [];

  return {
    // Defaults operacionais confirmados no formulário de Filas. São
    // enviados tanto em filas recém-criadas quanto nas já existentes para
    // que reprocessar uma implantação corrija configurações antigas.
    addagentname: 1,
    dontopenwithsentmessage: 1,
    autoremovefromwaitinglist: 1,
    aisummary: 1,
    aiimprovedaudiotranscription: 1,
    aiallowmsgsuggestion: 1,
    aiallowmanualsummary: 1,
    ...(Number.isFinite(maxChats) && maxChats > 0 ? { maxchatsperagent: maxChats } : {}),
    requirereasontoclose: queue.requiresClosingReason ? 1 : 0,
    endreasons: JSON.stringify(
      queue.requiresClosingReason ? queue.closingReasons.map((r) => r.name) : [],
    ),
    // `surveytext`/`surveythankstext` só vão preenchidos quando a pesquisa
    // está de fato ligada — o formulário guarda um texto padrão no rascunho
    // mesmo com a opção desligada (pra não perder o que o cliente já
    // escreveu se ligar de novo depois), então mandar esses campos sem
    // checar `sendSatisfactionSurvey` enviava a pesquisa mesmo com "não
    // desejo" marcado. Manda "" quando desligada pra limpar um texto salvo
    // antes, num reprocessamento.
    sendsurvey: queue.sendSatisfactionSurvey ? 1 : 0,
    surveytext: queue.sendSatisfactionSurvey ? queue.satisfactionSurveyText : "",
    surveythankstext: queue.sendSatisfactionSurvey ? queue.satisfactionThanksMessage : "",
    // Envia inclusive vazio para remover uma mensagem anterior numa
    // reexecução — omitir o campo preservaria a configuração antiga.
    offhourmsg: queue.offHoursMessage,
    distributionstrategy: DISTRIBUTION_STRATEGY_MAP[queue.distributionStrategy] ?? 0,
    autoaddcontacts: CONTACT_REGISTRATION_MAP[queue.contactRegistration] ?? 1,
    clienttimeout: inactivitySeconds,
    clienttimeouttext: queue.closesByInactivity ? queue.inactivityMessage : "",
    transferfilters: JSON.stringify(transferNames),
    ...(businessHoursConfigId ? { fk_businesshours_config: businessHoursConfigId } : {}),
  };
}

export const configureQueuesProcessor: Processor = async ({ client, snapshotPayload }) => {
  const { service } = payloadSchema.parse(snapshotPayload);

  if (service.queues.length === 0) {
    return { metadata: { queues: [] } };
  }

  const queueNameById = new Map(service.queues.map((q) => [q.id, q.name]));

  // Idempotente: preserva filas já existentes com o mesmo nome em vez de
  // duplicar (ver queues.listQueues sobre o limite de paginação).
  const existing = await queues.listQueues(client);
  const result: { name: string; id: number }[] = [];

  for (const queue of service.queues) {
    const type = CHANNEL_TYPE_MAP[queue.channel];
    if (!type) {
      throw new Error(
        `Canal "${queue.channel}" ainda não tem tipo de fila mapeado no Atender Bem`,
      );
    }

    const found = existing.find((candidate) => candidate.name === queue.name);
    const queueId = found ? found.id : (await queues.createQueue(client, { name: queue.name, type })).id;

    const businessHoursConfigId = await ensureBusinessHoursConfig(client, queueId, queue);
    const patch = buildQueuePatch(queue, queueNameById, businessHoursConfigId);
    await queues.updateQueue(client, queueId, patch);

    result.push({ name: queue.name, id: queueId });
  }

  return { metadata: { queues: result } };
};
