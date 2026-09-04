export type CompanySegment = "farma" | "matcon" | "pet" | "generico";

export type Channel =
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "telegram"
  | "outro";

export type SectorOfActivity = string;

export type DistributionStrategy = "circular" | "least_chats" | "agent_pull";

export type ContactRegistration = "automatic" | "manual";

export type TransferPolicy = "any" | "specific" | "none";

export type InactivityTimeout = "5m" | "10m" | "15m" | "30m" | "1h" | "2h" | "24h";

export interface ClosingReasonDraft {
  id: string;
  name: string;
}

export interface DayHours {
  enabled: boolean;
  start: string;
  end: string;
}

export interface QueueDraft {
  id: string;
  // Identificação do canal
  name: string;
  channel: Channel;
  /** Número de telefone (WhatsApp/Telegram), @usuário (Instagram) ou link (Facebook) desse canal. */
  channelIdentifier: string;
  storeUnit: string;
  sector: SectorOfActivity;
  // Regras da fila
  maxConcurrentChatsPerAgent: string;
  distributionStrategy: DistributionStrategy;
  contactRegistration: ContactRegistration;
  transferPolicy: TransferPolicy;
  /** Usado quando transferPolicy === "specific" — ids de outras QueueDraft. */
  transferableQueueIds: string[];
  // Encerramento de atendimento
  requiresClosingReason: boolean;
  closingReasons: ClosingReasonDraft[];
  closesByInactivity: boolean;
  inactivityTimeout: InactivityTimeout;
  inactivityMessage: string;
  // Horários e mensagens automáticas
  weekdayHours: DayHours;
  saturdayHours: DayHours;
  sundayHolidayHours: DayHours;
  offHoursMessage: string;
  waitingMessage: string;
  sendSatisfactionSurvey: boolean;
  satisfactionSurveyText: string;
  satisfactionThanksMessage: string;
}

export type UserRole = "administrador" | "supervisor" | "atendente";

/**
 * Limite de usuários por tipo, definido pelo plano do Atender Bem escolhido
 * na criação da implantação (ver server: Implantation.agentQuota etc.).
 * `null` quando a implantação não tem plano definido — nesse caso a etapa
 * de equipe não aplica nenhum limite.
 */
export type UserQuotas = Record<UserRole, number> | null;

export interface UserDraft {
  id: string;
  name: string;
  /** Nome de usuário (login) — o Atender Bem não usa e-mail para autenticar. */
  username: string;
  role: UserRole;
  /** Ramal numérico (sipuser) — obrigatório para supervisor e administrador. */
  extension: string;
  queueIds: string[];
}

/** Perfis que exigem ramal numérico ao criar o usuário no Atender Bem. */
export const ROLES_REQUIRING_EXTENSION: readonly UserRole[] = ["administrador", "supervisor"];

export interface PauseTypeDraft {
  id: string;
  name: string;
  durationMinutes: string;
}

export interface QuickReplyDraft {
  id: string;
  shortcut: string;
  message: string;
  selected: boolean;
}

export interface TagDraft {
  id: string;
  name: string;
  enabled: boolean;
  /**
   * Estilo real vindo do pacote do segmento (ver segment-defaults/), usado
   * na criação da etiqueta no Atender Bem. Ausente para etiquetas que o
   * cliente digitou do zero — nesse caso o backend aplica uma cor padrão.
   */
  bgcolor?: string;
  fgcolor?: string;
  /** Etiquetas de chat: string "cor-cor-cor" (ver docs/atenderbem-endpoints.md). */
  color?: string;
  marker?: string;
  description?: string;
}

export interface OnboardingData {
  company: {
    legalName: string;
    tradeName: string;
    /** null até o cliente escolher um card — nenhuma opção vem pré-selecionada. */
    segment: CompanySegment | null;
    /** Preenchido quando segment === "generico" (ver ChoiceCard "Outro"). */
    otherSegmentLabel: string;
    cnpj: string;
    storeCount: string;
    contactName: string;
    contactRole: string;
    contactEmail: string;
    contactPhone: string;
    erp: string;
  };
  service: {
    queues: QueueDraft[];
    businessHours: string;
    usesIvr: boolean;
    ivr: {
      greeting: string;
      menu: string;
      offHoursMessage: string;
    };
  };
  team: {
    users: UserDraft[];
    usesPauseControl: boolean;
    pauseTypes: PauseTypeDraft[];
    /** Se falso, os novos usuários são criados com a senha padrão da Unico. */
    usesCustomDefaultPassword: boolean;
    defaultPassword: string;
  };
  customization: {
    quickReplies: QuickReplyDraft[];
    contactTags: TagDraft[];
    chatTags: TagDraft[];
  };
  customers: {
    wantsImport: boolean;
    /** Uma das CONTACT_SOURCE_OPTIONS, ou CONTACT_SOURCE_OTHER_VALUE. */
    source: string;
    /** Preenchido quando source === CONTACT_SOURCE_OTHER_VALUE. */
    sourceOther: string;
    notes: string;
    contactImport?: ContactImportSummary;
  };
  observations: string;
}

export interface ContactImportSummary {
  id: string;
  originalName: string;
  sizeBytes: number;
  uploadedAt: string;
}

export type StepId =
  | "welcome"
  | "companyContact"
  | "companySegment"
  | "companyDetails"
  | "service"
  | "team"
  | "quickReplies"
  | "tags"
  | "customers"
  | "review"
  | "done";

export const STEP_ORDER: StepId[] = [
  "welcome",
  "companyContact",
  "companySegment",
  "companyDetails",
  "service",
  "team",
  "quickReplies",
  "tags",
  "customers",
  "review",
  "done",
];

export const PROGRESS_STEPS: { id: StepId; label: string }[] = [
  { id: "companyContact", label: "Conhecendo a empresa" },
  { id: "companySegment", label: "Conhecendo a empresa" },
  { id: "companyDetails", label: "Conhecendo a empresa" },
  { id: "service", label: "Canais e atendimento" },
  { id: "team", label: "Sua equipe" },
  { id: "quickReplies", label: "Personalize o atendimento" },
  { id: "tags", label: "Personalize o atendimento" },
  { id: "customers", label: "Seus clientes" },
  { id: "review", label: "Revisão final" },
];

export const CHANNEL_LABELS: Record<Channel, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  telegram: "Telegram",
  outro: "Outro",
};

/** Rótulo do campo que identifica o canal (número, usuário, link...), por canal. */
export const CHANNEL_IDENTIFIER_LABELS: Record<Channel, string> = {
  whatsapp: "Número de telefone",
  instagram: "Usuário do Instagram",
  facebook: "Link ou nome da página",
  telegram: "Usuário ou número do Telegram",
  outro: "Identificador do canal",
};

export const CHANNEL_IDENTIFIER_PLACEHOLDERS: Record<Channel, string> = {
  whatsapp: "+55 (11) 99999-9999",
  instagram: "@usuario",
  facebook: "facebook.com/suapagina",
  telegram: "@usuario ou +55 (11) 99999-9999",
  outro: "Ex: usuário, número ou link",
};

export const SECTOR_SUGGESTIONS = [
  "Vendas",
  "Televendas",
  "Financeiro",
  "Suporte",
  "SAC",
  "Cobrança",
  "Agendamento",
] as const;

/** Sentinela do select de setor: abre um campo de texto livre. */
export const SECTOR_OTHER_VALUE = "outro-setor";

export const DISTRIBUTION_STRATEGY_INFO: Record<
  DistributionStrategy,
  { label: string; description: string }
> = {
  circular: {
    label: "Circular",
    description: "Distribui em rodízio entre os atendentes disponíveis.",
  },
  least_chats: {
    label: "Menor quantidade de chats",
    description: "Prioriza o atendente com menos atendimentos em aberto no momento.",
  },
  agent_pull: {
    label: "Atendente puxa da fila",
    description: "O atendente escolhe manualmente o próximo atendimento da fila.",
  },
};

export const CONTACT_REGISTRATION_LABELS: Record<ContactRegistration, string> = {
  automatic: "Salvamento automático",
  manual: "Cadastro manual pelo atendente",
};

export const TRANSFER_POLICY_LABELS: Record<TransferPolicy, string> = {
  any: "Sim, para qualquer fila",
  specific: "Sim, apenas para filas específicas",
  none: "Não permitir",
};

export const INACTIVITY_TIMEOUT_LABELS: Record<InactivityTimeout, string> = {
  "5m": "5 minutos",
  "10m": "10 minutos",
  "15m": "15 minutos",
  "30m": "30 minutos",
  "1h": "1 hora",
  "2h": "2 horas",
  "24h": "24 horas",
};

export const DEFAULT_CLOSING_REASON_NAMES = [
  "Venda concluída",
  "Orçamento",
  "Produto fora de estoque",
  "Produto não trabalhado",
  "Informações",
  "Engano",
  "Resposta ao atendimento anterior",
  "Outros",
];

export const DEFAULT_INACTIVITY_MESSAGE =
  'Devido à falta de interatividade 🤐, seu atendimento foi encerrado. Mas não se preocupe: basta enviar um "Oi" para iniciar um novo atendimento.';

export const DEFAULT_OFF_HOURS_MESSAGE =
  "⏱️ Nosso horário de atendimento é de __ às __ de segunda a sexta.\nE aos sábados de __ às __.\nResponderemos no próximo horário disponível.";

export const DEFAULT_WAITING_MESSAGE =
  "Olá, seja bem-vindo(a) à *NOME DA EMPRESA*!\n\nEstou finalizando um atendimento e já darei toda a atenção que você merece. Enquanto isso me diga: como posso te ajudar?";

export const DEFAULT_SATISFACTION_SURVEY_TEXT =
  "Para aperfeiçoar nosso atendimento, nos diga como foi a sua experiência:\n5️⃣ Muito satisfeito 😍\n4️⃣ Satisfeito 😀\n3️⃣ Indiferente 😐\n2️⃣ Insatisfeito ☹️\n1️⃣ Muito insatisfeito 😞";

export const DEFAULT_SATISFACTION_THANKS_MESSAGE = "Agradecemos a colaboração. 👍";

export const ROLE_LABELS: Record<UserRole, string> = {
  administrador: "Administrador",
  supervisor: "Supervisor",
  atendente: "Atendente",
};

export const SEGMENT_LABELS: Record<CompanySegment, string> = {
  farma: "Farmácia / drogaria",
  pet: "Pet shop / clínica veterinária",
  matcon: "Materiais de construção",
  generico: "Outro segmento",
};

export const ERP_OPTIONS = [
  "Não utilizo nenhum",
  "Trier",
  "Alpha7",
  "Vetor",
  "Automatiza",
  "Delivery Pharmacy",
  "Linx",
  "Vannon",
] as const;

/** Sentinela do select de ERP: abre um campo de texto livre. */
export const ERP_OTHER_VALUE = "outro";

export const CONTACT_SOURCE_OPTIONS = [
  "Planilha do ERP",
  "Agenda atual",
  "WhatsApp",
] as const;

/** Sentinela do select de origem da base de contatos: abre um campo de texto livre. */
export const CONTACT_SOURCE_OTHER_VALUE = "outro-origem";

export const SEGMENT_OPTIONS: {
  value: CompanySegment;
  title: string;
  subtitle: string;
  icon: string;
}[] = [
  { value: "farma", title: "Farmácia", subtitle: "Drogaria e saúde", icon: "/segments/farma.png" },
  { value: "matcon", title: "MatCon", subtitle: "Materiais de construção", icon: "/segments/matcon.png" },
  { value: "pet", title: "Pet Shop", subtitle: "Produtos e serviços para pets", icon: "/segments/pet.png" },
  { value: "generico", title: "Outro", subtitle: "Outro segmento", icon: "/segments/generico.png" },
];
