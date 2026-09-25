"use client";

import { Clock, Flag, IdCard, ListChecks } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/onboarding-ui/Button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/onboarding-ui/Dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/onboarding-ui/Select";
import { formatChannelIdentifier } from "../format";
import { createId } from "../initial-data";
import { copyQueueConfig, createDefaultQueue } from "../queue-defaults";
import { Field, Input, NumberInput, Textarea } from "./FormField";
import { EditableChipList } from "./EditableChipList";
import { Reveal } from "./Reveal";
import { ToggleQuestion } from "./ToggleQuestion";
import {
  CHANNEL_IDENTIFIER_LABELS,
  CHANNEL_IDENTIFIER_PLACEHOLDERS,
  CONTACT_REGISTRATION_LABELS,
  DISTRIBUTION_STRATEGY_INFO,
  INACTIVITY_TIMEOUT_LABELS,
  SECTOR_OTHER_VALUE,
  SECTOR_SUGGESTIONS,
  TRANSFER_POLICY_LABELS,
  type Channel,
  type ContactRegistration,
  type DayHours,
  type DistributionStrategy,
  type InactivityTimeout,
  type QueueDraft,
  type TransferPolicy,
} from "../types";

function SectionTitle({ icon: Icon, children }: { icon: typeof IdCard; children: ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-2.5">
      <span className="flex size-7 items-center justify-center rounded-lg bg-brand-light text-brand">
        <Icon className="size-4" />
      </span>
      <h3 className="text-base font-semibold text-brand">{children}</h3>
    </div>
  );
}

function DayHoursField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: DayHours;
  onChange: (value: DayHours) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <ToggleQuestion
        question={label}
        value={value.enabled}
        onChange={(enabled) => onChange({ ...value, enabled })}
      />
      <Reveal show={value.enabled}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Início">
            <Input
              type="time"
              value={value.start}
              onChange={(e) => onChange({ ...value, start: e.target.value })}
            />
          </Field>
          <Field label="Fim">
            <Input
              type="time"
              value={value.end}
              onChange={(e) => onChange({ ...value, end: e.target.value })}
            />
          </Field>
        </div>
      </Reveal>
    </div>
  );
}

function isKnownSector(value: string): boolean {
  return (SECTOR_SUGGESTIONS as readonly string[]).includes(value);
}

export function QueueFormDialog({
  open,
  onOpenChange,
  channel,
  initialIdentifier,
  companyName,
  existingQueues,
  editingQueue,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: Channel;
  /** Número/usuário já digitado na barra de "+ Adicionar", usado para pré-preencher a fila nova. */
  initialIdentifier: string;
  /** Nome da empresa (já digitado no onboarding), usado para preencher a mensagem de espera padrão. */
  companyName: string;
  existingQueues: QueueDraft[];
  editingQueue: QueueDraft | null;
  onSave: (queue: QueueDraft) => void;
}) {
  const [stage, setStage] = useState<"template" | "form">("form");
  const [templateChoice, setTemplateChoice] = useState<string>("none");
  const [draft, setDraft] = useState<QueueDraft | null>(null);
  const [sectorMode, setSectorMode] = useState<"list" | "custom">("list");

  // Reinicializa o formulário toda vez que o modal abre — ajuste de estado
  // durante o render (não em efeito), como recomendado pelo React para
  // "resetar tudo quando uma prop muda".
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);

    if (open) {
      setTemplateChoice("none");

      if (editingQueue) {
        setDraft(editingQueue);
        setSectorMode(isKnownSector(editingQueue.sector) || !editingQueue.sector ? "list" : "custom");
        setStage("form");
      } else if (existingQueues.length > 0) {
        setStage("template");
        setDraft(null);
      } else {
        setDraft(createDefaultQueue(channel, initialIdentifier, companyName));
        setSectorMode("list");
        setStage("form");
      }
    }
  }

  function update(patch: Partial<QueueDraft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  function handleTemplateContinue() {
    const source = existingQueues.find((q) => q.id === templateChoice);
    const next = source
      ? copyQueueConfig(source, channel, initialIdentifier)
      : createDefaultQueue(channel, initialIdentifier, companyName);
    setDraft(next);
    setSectorMode(isKnownSector(next.sector) || !next.sector ? "list" : "custom");
    setStage("form");
  }

  function handleSave() {
    if (!draft || !draft.name.trim()) return;
    onSave(draft);
    onOpenChange(false);
  }

  const otherQueues = draft ? existingQueues.filter((q) => q.id !== draft.id) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {stage === "template" ? (
          <>
            <DialogHeader
              title="Nova fila de atendimento"
              subtitle="Você já tem filas configuradas. Quer aproveitar as configurações de uma delas?"
            />
            <DialogBody>
              <Field label="Copiar configurações de">
                <Select value={templateChoice} onValueChange={setTemplateChoice}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não, configurar do zero</SelectItem>
                    {existingQueues.map((q) => (
                      <SelectItem key={q.id} value={q.id}>
                        {q.name || "Fila sem nome"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <p className="mt-2 text-xs text-brand/40">
                Só a identificação (nome, loja e setor) precisa ser preenchida de novo — o
                resto das regras vem copiado.
              </p>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleTemplateContinue} className="flex-1">
                Continuar
              </Button>
            </DialogFooter>
          </>
        ) : draft ? (
          <>
            <DialogHeader
              title={editingQueue ? "Editar fila de atendimento" : "Nova fila de atendimento"}
            />
            <DialogBody className="flex flex-col divide-y divide-border-soft">
              <p className="rounded-lg bg-brand-light px-3 py-2 text-xs text-brand/60">
                Configure cada etapa abaixo. Continue até “Pesquisa de satisfação” para ver todas as opções da fila.
              </p>
              <div className="pb-7">
                <SectionTitle icon={IdCard}>Identificação do canal</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nome da fila">
                    <Input
                      value={draft.name}
                      onChange={(e) => update({ name: e.target.value })}
                      placeholder="Ex: WhatsApp Loja Centro"
                    />
                  </Field>
                  <Field label={CHANNEL_IDENTIFIER_LABELS[draft.channel]}>
                    <Input
                      value={draft.channelIdentifier}
                      onChange={(e) =>
                        update({ channelIdentifier: formatChannelIdentifier(draft.channel, e.target.value) })
                      }
                      placeholder={CHANNEL_IDENTIFIER_PLACEHOLDERS[draft.channel]}
                    />
                  </Field>
                  <Field label="Loja / unidade responsável">
                    <Input
                      value={draft.storeUnit}
                      onChange={(e) => update({ storeUnit: e.target.value })}
                      placeholder="Ex: Loja Centro"
                    />
                  </Field>
                  <Field label="Setor de atuação">
                    <Select
                      value={sectorMode === "custom" ? SECTOR_OTHER_VALUE : draft.sector}
                      onValueChange={(value) => {
                        if (value === SECTOR_OTHER_VALUE) {
                          setSectorMode("custom");
                          update({ sector: "" });
                        } else {
                          setSectorMode("list");
                          update({ sector: value });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ex: Vendas, Financeiro..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SECTOR_SUGGESTIONS.map((sector) => (
                          <SelectItem key={sector} value={sector}>
                            {sector}
                          </SelectItem>
                        ))}
                        <SelectItem value={SECTOR_OTHER_VALUE}>Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  {sectorMode === "custom" ? (
                    <div className="sm:col-span-2">
                      <Field label="Qual setor?">
                        <Input
                          value={draft.sector}
                          onChange={(e) => update({ sector: e.target.value })}
                          placeholder="Nome do setor"
                        />
                      </Field>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="py-7">
                <SectionTitle icon={ListChecks}>Regras da fila</SectionTitle>
                <div className="flex flex-col gap-4">
                  <Field label="Máximo de atendimentos simultâneos por atendente" htmlFor="max-concurrent-chats">
                    <NumberInput
                      id="max-concurrent-chats"
                      min={1}
                      value={draft.maxConcurrentChatsPerAgent}
                      onChange={(value) => update({ maxConcurrentChatsPerAgent: value })}
                      className="max-w-[160px]"
                    />
                  </Field>

                  <Field label="Forma de distribuição dos atendimentos">
                    <Select
                      value={draft.distributionStrategy}
                      onValueChange={(value) =>
                        update({ distributionStrategy: value as DistributionStrategy })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(DISTRIBUTION_STRATEGY_INFO).map(([value, info]) => (
                          <SelectItem key={value} value={value}>
                            {info.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <p className="-mt-2 text-xs text-brand/40">
                    {DISTRIBUTION_STRATEGY_INFO[draft.distributionStrategy].description}
                  </p>

                  <Field label="Cadastro de contatos">
                    <Select
                      value={draft.contactRegistration}
                      onValueChange={(value) =>
                        update({ contactRegistration: value as ContactRegistration })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CONTACT_REGISTRATION_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="Permitir transferir atendimento para outras filas?">
                    <Select
                      value={draft.transferPolicy}
                      onValueChange={(value) => update({ transferPolicy: value as TransferPolicy })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TRANSFER_POLICY_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Reveal show={draft.transferPolicy === "specific"}>
                    {otherQueues.length === 0 ? (
                      <p className="text-xs text-brand/40">Nenhuma outra fila cadastrada ainda.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {otherQueues.map((q) => {
                          const active = draft.transferableQueueIds.includes(q.id);
                          return (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() =>
                                update({
                                  transferableQueueIds: active
                                    ? draft.transferableQueueIds.filter((id) => id !== q.id)
                                    : [...draft.transferableQueueIds, q.id],
                                })
                              }
                              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                active
                                  ? "border-brand bg-brand-light text-brand"
                                  : "border-border-soft text-brand/50 hover:border-brand/40"
                              }`}
                            >
                              {q.name || "Fila sem nome"}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </Reveal>
                </div>
              </div>

              <div className="py-7">
                <SectionTitle icon={Flag}>Encerramento de atendimento</SectionTitle>
                <div className="flex flex-col gap-4">
                  <ToggleQuestion
                    question="Exigir motivo de encerramento?"
                    value={draft.requiresClosingReason}
                    onChange={(requiresClosingReason) => update({ requiresClosingReason })}
                  />
                  <Reveal show={draft.requiresClosingReason}>
                    <EditableChipList
                      items={draft.closingReasons}
                      addPlaceholder="Novo motivo"
                      onAdd={(name) =>
                        update({
                          closingReasons: [
                            ...draft.closingReasons,
                            { id: createId("closing-reason"), name },
                          ],
                        })
                      }
                      onRemove={(id) =>
                        update({ closingReasons: draft.closingReasons.filter((r) => r.id !== id) })
                      }
                    />
                  </Reveal>

                  <ToggleQuestion
                    question="Encerrar automaticamente por inatividade?"
                    value={draft.closesByInactivity}
                    onChange={(closesByInactivity) => update({ closesByInactivity })}
                  />
                  <Reveal show={draft.closesByInactivity}>
                    <div className="flex flex-col gap-4">
                      <Field label="Tempo sem resposta do cliente">
                        <Select
                          value={draft.inactivityTimeout}
                          onValueChange={(value) =>
                            update({ inactivityTimeout: value as InactivityTimeout })
                          }
                        >
                          <SelectTrigger className="max-w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(INACTIVITY_TIMEOUT_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Mensagem enviada ao encerrar por inatividade">
                        <Textarea
                          value={draft.inactivityMessage}
                          onChange={(e) => update({ inactivityMessage: e.target.value })}
                        />
                      </Field>
                    </div>
                  </Reveal>
                </div>
              </div>

              <div className="pt-7">
                <SectionTitle icon={Clock}>Horários e mensagens automáticas</SectionTitle>
                <div className="flex flex-col gap-5">
                  <DayHoursField
                    label="Segunda a sexta"
                    value={draft.weekdayHours}
                    onChange={(weekdayHours) => update({ weekdayHours })}
                  />
                  <DayHoursField
                    label="Sábado"
                    value={draft.saturdayHours}
                    onChange={(saturdayHours) => update({ saturdayHours })}
                  />
                  <DayHoursField
                    label="Domingo e feriados"
                    value={draft.sundayHolidayHours}
                    onChange={(sundayHolidayHours) => update({ sundayHolidayHours })}
                  />

                  <Field label="Mensagem fora do horário de atendimento">
                    <Textarea
                      value={draft.offHoursMessage}
                      onChange={(e) => update({ offHoursMessage: e.target.value })}
                      rows={4}
                    />
                  </Field>

                  <Field label="Mensagem inicial">
                    <Textarea
                      value={draft.waitingMessage}
                      onChange={(e) => update({ waitingMessage: e.target.value })}
                      rows={4}
                    />
                  </Field>

                  <ToggleQuestion
                    question="Enviar pesquisa de satisfação ao final?"
                    value={draft.sendSatisfactionSurvey}
                    onChange={(sendSatisfactionSurvey) => update({ sendSatisfactionSurvey })}
                  />
                  <Reveal show={draft.sendSatisfactionSurvey}>
                    <div className="flex flex-col gap-4">
                      <Field label="Texto da pesquisa de satisfação">
                        <Textarea
                          value={draft.satisfactionSurveyText}
                          onChange={(e) => update({ satisfactionSurveyText: e.target.value })}
                          rows={6}
                        />
                      </Field>
                      <Field label="Mensagem de agradecimento pela resposta">
                        <Textarea
                          value={draft.satisfactionThanksMessage}
                          onChange={(e) => update({ satisfactionThanksMessage: e.target.value })}
                        />
                      </Field>
                    </div>
                  </Reveal>
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!draft.name.trim()} className="flex-1">
                Salvar fila
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
