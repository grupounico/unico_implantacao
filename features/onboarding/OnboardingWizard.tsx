"use client";

import { useEffect, useRef, useState } from "react";
import { saveOnboardingProgress, submitOnboarding, uploadContactImport } from "./api";
import { StepShell } from "./components/StepShell";
import {
  buildChatTags,
  buildContactTags,
  buildQuickReplies,
  createInitialData,
} from "./initial-data";
import { CompanyContactStep } from "./steps/CompanyContactStep";
import { CompanyDetailsStep } from "./steps/CompanyDetailsStep";
import { CompanySegmentStep } from "./steps/CompanySegmentStep";
import { CompletionStep } from "./steps/CompletionStep";
import { CustomersStep } from "./steps/CustomersStep";
import { hasIncompleteQuickReplies, QuickRepliesStep } from "./steps/QuickRepliesStep";
import { ReviewStep } from "./steps/ReviewStep";
import { ServiceStep } from "./steps/ServiceStep";
import { TagsStep } from "./steps/TagsStep";
import { TeamStep } from "./steps/TeamStep";
import { WelcomeStep } from "./steps/WelcomeStep";
import { STEP_ORDER, type OnboardingData, type StepId, type UserQuotas } from "./types";
import { hasDuplicateUsernames } from "./usernames";

// Sem `token` (rota de demonstração), a implantação simula os limites de
// usuário que viriam do plano escolhido na criação do link — ver server:
// Implantation.agentQuota/supervisorQuota/adminQuota e
// GET /onboarding/:token → userQuotas.
const DEMO_USER_QUOTAS: UserQuotas = { administrador: 1, supervisor: 3, atendente: 10 };

const SAVE_DEBOUNCE_MS = 800;

const STEP_COPY: Partial<Record<StepId, { kicker: string; title: string; subtitle: string }>> = {
  companyContact: {
    kicker: "Conhecendo a empresa",
    title: "Conte sobre sua empresa",
    subtitle: "Pra começar, quem é o responsável por essas informações?",
  },
  companySegment: {
    kicker: "Conhecendo a empresa",
    title: "Qual é o segmento da sua empresa?",
    subtitle: "Selecione a opção que melhor representa o seu negócio.",
  },
  companyDetails: {
    kicker: "Conhecendo a empresa",
    title: "Sobre a empresa",
    subtitle: "Agora nos conte os dados formais da empresa.",
  },
  service: {
    kicker: "Canais e atendimento",
    title: "Como vocês atendem?",
    subtitle: "Configure as filas de atendimento da sua empresa.",
  },
  team: {
    kicker: "Sua equipe",
    title: "Quem vai acessar a instância?",
    subtitle: "Defina os usuários e como o controle de pausas funciona.",
  },
  quickReplies: {
    kicker: "Personalize o atendimento",
    title: "Respostas rápidas",
    subtitle: "Atalhos que os agentes digitam no chat para inserir a mensagem completa.",
  },
  tags: {
    kicker: "Personalize o atendimento",
    title: "Etiquetas",
    subtitle: "Ajuste as etiquetas sugeridas para o seu segmento, ou crie as suas.",
  },
  customers: {
    kicker: "Seus clientes",
    title: "Seus clientes",
    subtitle: "Se você já tem uma base de contatos, podemos importá-la para a nova instância.",
  },
  review: {
    kicker: "Revisão final",
    title: "Revisão",
    subtitle: "Confira as informações antes de enviar. Você pode voltar e ajustar qualquer etapa.",
  },
};

export function OnboardingWizard({
  token,
  initialStep,
  initialData,
  userQuotas = DEMO_USER_QUOTAS,
}: {
  /** Só vem preenchido nas rotas reais (/onboarding/[token]) — liga autosave e envio final. Ausente na demo. */
  token?: string;
  initialStep?: StepId | null;
  initialData?: OnboardingData;
  userQuotas?: UserQuotas;
} = {}) {
  const [step, setStep] = useState<StepId>(
    initialStep && STEP_ORDER.includes(initialStep) ? initialStep : "welcome",
  );
  const [data, setData] = useState<OnboardingData>(initialData ?? createInitialData());
  // As sugestões de etiquetas e respostas rápidas só são preenchidas com o
  // padrão do segmento na primeira vez que o cliente chega na
  // Personalização — depois disso é a lista dele, não mexemos mais nela
  // sozinhos.
  const [hasSeededSegmentDefaults, setHasSeededSegmentDefaults] = useState(false);

  const stepIndex = STEP_ORDER.indexOf(step);

  // Autosave: espera o cliente parar de digitar/navegar por um instante
  // antes de persistir, para não disparar um PUT a cada tecla.
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!token || step === "done") return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveOnboardingProgress(token, step, data).catch(() => {
        // Falha de rede não deve travar o preenchimento — a próxima mudança
        // já dispara uma nova tentativa de autosave.
      });
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [token, step, data]);

  async function finishOnboarding() {
    if (token) {
      try {
        await saveOnboardingProgress(token, "review", data);
        await submitOnboarding(token);
      } catch {
        // Não trava a navegação por uma falha de rede aqui — o cliente já
        // vê a tela de conclusão, e o autosave anterior deve ter
        // persistido o essencial. Se o envio de fato falhou, o registro
        // continua editável e o próximo autosave tenta de novo.
      }
    }
    goTo("done");
  }

  function goTo(target: StepId) {
    if (target === "quickReplies" && !hasSeededSegmentDefaults) {
      setData((current) => ({
        ...current,
        customization: {
          ...current.customization,
          contactTags: buildContactTags(current.company.segment ?? "generico"),
          chatTags: buildChatTags(current.company.segment ?? "generico"),
          quickReplies: buildQuickReplies(current.company.segment ?? "generico"),
        },
      }));
      setHasSeededSegmentDefaults(true);
    }

    setStep(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goNext() {
    if (step === "review") {
      void finishOnboarding();
      return;
    }

    const next = STEP_ORDER[stepIndex + 1];
    if (next) goTo(next);
  }

  function goBack() {
    const previous = STEP_ORDER[stepIndex - 1];
    if (previous) goTo(previous);
  }

  const isCompanyContactValid = data.company.contactName.trim() !== "";
  const isCompanySegmentValid =
    data.company.segment !== null &&
    (data.company.segment !== "generico" || data.company.otherSegmentLabel.trim() !== "");
  const isCompanyDetailsValid =
    data.company.legalName.trim() !== "" && data.company.contactEmail.trim() !== "";
  const isServiceValid = data.service.queues.length > 0;
  const isTeamValid =
    data.team.users.length > 0 &&
    data.team.users.every((user) => user.name.trim() && user.username.trim()) &&
    !hasDuplicateUsernames(data.team.users);

  const NEXT_DISABLED: Partial<Record<StepId, boolean>> = {
    companyContact: !isCompanyContactValid,
    companySegment: !isCompanySegmentValid,
    companyDetails: !isCompanyDetailsValid,
    service: !isServiceValid,
    team: !isTeamValid,
    quickReplies: hasIncompleteQuickReplies(data.customization.quickReplies),
  };

  const copy = STEP_COPY[step];

  return (
    <StepShell
      step={step}
      kicker={copy?.kicker}
      title={copy?.title}
      subtitle={copy?.subtitle}
      onBack={step !== "welcome" && step !== "done" ? goBack : undefined}
      onNext={step !== "welcome" && step !== "done" ? goNext : undefined}
      nextLabel={step === "review" ? "Finalizar onboarding" : undefined}
      nextDisabled={NEXT_DISABLED[step]}
    >
      {step === "welcome" && <WelcomeStep onStart={goNext} />}

      {step === "companyContact" && (
        <CompanyContactStep
          data={data.company}
          onChange={(company) => setData({ ...data, company })}
        />
      )}

      {step === "companySegment" && (
        <CompanySegmentStep
          data={data.company}
          onChange={(company) => setData({ ...data, company })}
        />
      )}

      {step === "companyDetails" && (
        <CompanyDetailsStep
          data={data.company}
          onChange={(company) => setData({ ...data, company })}
        />
      )}

      {step === "service" && (
        <ServiceStep
          data={data.service}
          onChange={(service) => setData({ ...data, service })}
          companyName={data.company.tradeName || data.company.legalName}
        />
      )}

      {step === "team" && (
        <TeamStep
          data={data.team}
          queues={data.service.queues}
          onChange={(team) => setData({ ...data, team })}
          userQuotas={userQuotas}
        />
      )}

      {step === "quickReplies" && (
        <QuickRepliesStep
          data={data.customization}
          onChange={(customization) => setData({ ...data, customization })}
        />
      )}

      {step === "tags" && (
        <TagsStep
          data={data.customization}
          onChange={(customization) => setData({ ...data, customization })}
        />
      )}

      {step === "customers" && (
        <CustomersStep
          data={data.customers}
          onChange={(customers) => setData({ ...data, customers })}
          onUpload={token ? async (file) => {
            const contactImport = await uploadContactImport(token, file);
            setData((current) => ({ ...current, customers: { ...current.customers, contactImport } }));
          } : undefined}
        />
      )}

      {step === "review" && (
        <ReviewStep
          data={data}
          observations={data.observations}
          onObservationsChange={(observations) => setData({ ...data, observations })}
          onEdit={goTo}
        />
      )}

      {step === "done" && <CompletionStep />}
    </StepShell>
  );
}
