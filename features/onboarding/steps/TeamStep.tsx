"use client";

import { AnimatePresence, motion } from "motion/react";
import { Coffee, CircleUser, Pencil, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/onboarding-ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/onboarding-ui/Select";
import { createId } from "../initial-data";
import { Field, Input, NumberInput } from "../components/FormField";
import { Reveal } from "../components/Reveal";
import { RoleIcon } from "../components/RoleIcon";
import { ToggleQuestion } from "../components/ToggleQuestion";
import { UserFormDialog } from "../components/UserFormDialog";
import {
  ROLE_LABELS,
  type OnboardingData,
  type QueueDraft,
  type UserDraft,
  type UserQuotas,
  type UserRole,
} from "../types";

const ROLE_ORDER: UserRole[] = ["atendente", "supervisor", "administrador"];

function countUsersByRole(users: { role: UserRole }[]): Record<UserRole, number> {
  const counts: Record<UserRole, number> = { administrador: 0, supervisor: 0, atendente: 0 };
  for (const user of users) counts[user.role] += 1;
  return counts;
}

export function TeamStep({
  data,
  queues,
  onChange,
  userQuotas,
}: {
  data: OnboardingData["team"];
  queues: QueueDraft[];
  onChange: (data: OnboardingData["team"]) => void;
  /** Limites de usuário por tipo, vindos do plano da implantação. `null` = sem limite. */
  userQuotas: UserQuotas;
}) {
  const [draftRole, setDraftRole] = useState<UserRole>("atendente");
  const [draftName, setDraftName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDraft | null>(null);

  const [draftPauseName, setDraftPauseName] = useState("");
  const [draftPauseDuration, setDraftPauseDuration] = useState("60");
  const [editingPauseId, setEditingPauseId] = useState<string | null>(null);

  const counts = countUsersByRole(data.users);
  // Perfis sem nenhuma vaga no plano não são uma alternativa válida para o
  // cliente — por exemplo, Administrador quando a única vaga é a conta
  // técnica padrão que já vem na instância.
  const availableRoles = ROLE_ORDER.filter((role) => !userQuotas || userQuotas[role] > 0);
  const selectedDraftRole = availableRoles.includes(draftRole)
    ? draftRole
    : (availableRoles[0] ?? "atendente");
  const hasRoom = (role: UserRole) => !userQuotas || counts[role] < userQuotas[role];
  const canAddAnyUser = availableRoles.some(hasRoom);

  function openCreateDialog() {
    if (!hasRoom(selectedDraftRole)) return;
    setEditingUser(null);
    setDialogOpen(true);
  }

  function openEditDialog(user: UserDraft) {
    setEditingUser(user);
    setDialogOpen(true);
  }

  function handleSaveUser(user: UserDraft) {
    const exists = data.users.some((u) => u.id === user.id);
    onChange({
      ...data,
      users: exists ? data.users.map((u) => (u.id === user.id ? user : u)) : [...data.users, user],
    });
    setDraftName("");
  }

  function removeUser(id: string) {
    onChange({ ...data, users: data.users.filter((u) => u.id !== id) });
  }

  function resetPauseDraft() {
    setEditingPauseId(null);
    setDraftPauseName("");
    setDraftPauseDuration("60");
  }

  function startEditPause(pause: OnboardingData["team"]["pauseTypes"][number]) {
    setEditingPauseId(pause.id);
    setDraftPauseName(pause.name);
    setDraftPauseDuration(pause.durationMinutes);
  }

  function submitPauseDraft() {
    if (!draftPauseName.trim()) return;

    const pause = { id: editingPauseId ?? createId("pause"), name: draftPauseName.trim(), durationMinutes: draftPauseDuration };
    const exists = data.pauseTypes.some((p) => p.id === pause.id);
    onChange({
      ...data,
      pauseTypes: exists
        ? data.pauseTypes.map((p) => (p.id === pause.id ? pause : p))
        : [...data.pauseTypes, pause],
    });
    resetPauseDraft();
  }

  function removePauseType(id: string) {
    onChange({ ...data, pauseTypes: data.pauseTypes.filter((p) => p.id !== id) });
    if (editingPauseId === id) resetPauseDraft();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        

        <header className="mx-auto w-full">{userQuotas ? (
          <div className="mb-4 flex flex-wrap justify-center gap-2">
            {availableRoles.map((role) => {
              const atLimit = counts[role] >= userQuotas[role];
              return (
                <span
                  key={role}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
                    atLimit
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : "border-border-soft bg-brand-light text-brand/70"
                  }`}
                >
                  <RoleIcon role={role} className="size-3.5" />
                  {ROLE_LABELS[role]}
                  <span className={atLimit ? "text-destructive" : "text-brand/40"}>
                    {counts[role]}/{userQuotas[role]}
                  </span>
                </span>
              );
            })}
          </div>
        ) : null}</header>

        <div className="grid gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-end">
          <Field label="Cargo">
            <Select value={selectedDraftRole} onValueChange={(value) => setDraftRole(value as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => {
                  const disabled = !hasRoom(role);
                  return (
                    <SelectItem key={role} value={role} disabled={disabled}>
                      <span className="flex items-center gap-2">
                        <RoleIcon role={role} className="size-3.5" />
                        {ROLE_LABELS[role]}
                        {disabled ? " (limite atingido)" : ""}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Nome do usuário">
            <Input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Nome do usuário"
              className="h-[50px] py-0"
            />
          </Field>
          <Button
            type="button"
            variant="accent"
            onClick={openCreateDialog}
            disabled={!hasRoom(selectedDraftRole)}
            className="h-[50px] justify-self-start px-6 py-0 text-sm"
          >
            + Adicionar
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <h2 className=" text-sm text-brand/40">Usuários</h2>
          {data.users.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border-soft px-4 py-8 text-center text-sm text-brand/40">
              Nenhum usuário adicionado ainda.
            </p>
          ) : (
            <AnimatePresence initial={false}>
              {data.users.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, height: 0, y: -8 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-border-soft bg-card px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <CircleUser className="size-7 shrink-0 text-brand/30" />
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="truncate text-sm text-brand">
                          {user.name || "Usuário sem nome"}
                        </span>
                        <span className="flex w-fit items-center gap-1 rounded-full bg-brand-light px-2.5 py-1 text-[10px] font-medium text-brand/70">
                          <RoleIcon role={user.role} className="size-2.5" />
                          {ROLE_LABELS[user.role]}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openEditDialog(user)}
                        className="text-brand/40 hover:text-brand"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeUser(user.id)}
                        className="text-brand/40 hover:text-red-500"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {userQuotas && !canAddAnyUser ? (
          <p className="mt-2 text-xs text-red-600">
            Você já atingiu o máximo de usuários que o seu plano permite em todos os perfis.
          </p>
        ) : null}

        <UserFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          editingUser={editingUser}
          initialName={draftName.trim()}
          initialRole={selectedDraftRole}
          users={data.users}
          queues={queues}
          userQuotas={userQuotas}
          roleCounts={counts}
          onSave={handleSaveUser}
        />
      </div>

      <div className="flex flex-col gap-4">
        <ToggleQuestion
          question="Deseja definir uma senha padrão para os novos usuários?"
          value={data.usesCustomDefaultPassword}
          onChange={(usesCustomDefaultPassword) =>
            onChange({ ...data, usesCustomDefaultPassword })
          }
        />
        <Reveal show={!data.usesCustomDefaultPassword}>
          <p className="text-xs text-brand/40">
            Sem uma senha personalizada, os novos usuários começam com a senha padrão da Unico.
          </p>
        </Reveal>
        <Reveal show={data.usesCustomDefaultPassword}>
          <Field
            label="Senha padrão"
            hint="Todos os novos usuários criados nesta implantação começam com essa senha."
          >
            <Input
              value={data.defaultPassword}
              onChange={(e) => onChange({ ...data, defaultPassword: e.target.value })}
              placeholder="Ex: Farmacia@2026"
            />
          </Field>
        </Reveal>
      </div>

      <div className="flex flex-col gap-4">
        <ToggleQuestion
          question="A empresa utiliza controle de pausas?"
          value={data.usesPauseControl}
          onChange={(usesPauseControl) => onChange({ ...data, usesPauseControl })}
        />
        <Reveal show={data.usesPauseControl}>
          <div className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_140px_auto] sm:items-end">
              <Field label="Nome da pausa">
                <Input
                  value={draftPauseName}
                  onChange={(e) => setDraftPauseName(e.target.value)}
                  placeholder="Ex: Almoço"
                  className="h-[50px] py-0"
                />
              </Field>
              <Field label="Duração (minutos)" htmlFor="pause-duration">
                <NumberInput
                  id="pause-duration"
                  min={1}
                  value={draftPauseDuration}
                  onChange={setDraftPauseDuration}
                  className="h-[50px]"
                />
              </Field>
              <div className="flex items-end gap-2">
                <Button
                  type="button"
                  variant="accent"
                  onClick={submitPauseDraft}
                  disabled={!draftPauseName.trim()}
                  className="h-[50px] justify-self-start px-6 py-0 text-sm"
                >
                  {editingPauseId ? "Salvar" : "+ Adicionar"}
                </Button>
                {editingPauseId ? (
                  <button
                    type="button"
                    onClick={resetPauseDraft}
                    className="h-[50px] px-2 text-sm font-medium text-brand/40 hover:text-brand"
                  >
                    Cancelar
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {data.pauseTypes.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border-soft px-4 py-8 text-center text-sm text-brand/40">
                  Nenhum tipo de pausa adicionado ainda.
                </p>
              ) : (
                <AnimatePresence initial={false}>
                  {data.pauseTypes.map((pause) => (
                    <motion.div
                      key={pause.id}
                      initial={{ opacity: 0, height: 0, y: -8 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -8 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-border-soft bg-card px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <Coffee className="size-7 shrink-0 text-brand/30" />
                          <div className="flex min-w-0 flex-col gap-1">
                            <span className="truncate text-sm text-brand">
                              {pause.name || "Pausa sem nome"}
                            </span>
                            <span className="flex w-fit items-center gap-1 rounded-full bg-brand-light px-2.5 py-1 text-[10px] font-medium text-brand/70">
                              {pause.durationMinutes || "0"} minutos
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <button
                            type="button"
                            onClick={() => startEditPause(pause)}
                            className="text-brand/40 hover:text-brand"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removePauseType(pause.id)}
                            className="text-brand/40 hover:text-red-500"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
