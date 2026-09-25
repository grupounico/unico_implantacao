"use client";

import { useState } from "react";
import { Button } from "@/components/onboarding-ui/Button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/onboarding-ui/Dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/onboarding-ui/Select";
import { ROLE_LABELS, type QueueDraft, type UserDraft, type UserQuotas, type UserRole } from "../types";
import { createId } from "../initial-data";
import { Field, Input } from "./FormField";
import { Reveal } from "./Reveal";
import { RoleIcon } from "./RoleIcon";
import { hasDuplicateUsername, normalizeUsername, USERNAME_MAX_LENGTH } from "../usernames";

const ROLE_ORDER: UserRole[] = ["atendente", "supervisor", "administrador"];

/**
 * Cria (quando `editingUser` é `null`) ou edita um usuário. O clique em
 * "+ Adicionar" na barra rápida de TeamStep só abre este modal com cargo e
 * nome pré-preenchidos — o usuário só é de fato criado ao salvar aqui
 * dentro, como nas filas de atendimento.
 */
export function UserFormDialog({
  open,
  onOpenChange,
  editingUser,
  initialName,
  initialRole,
  users,
  queues,
  userQuotas,
  roleCounts,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: UserDraft | null;
  /** Nome já digitado na barra rápida — só usado para pré-preencher a criação. */
  initialName: string;
  /** Cargo já selecionado na barra rápida — só usado para pré-preencher a criação. */
  initialRole: UserRole;
  /** Usuários já cadastrados nesta implantação, para validar o login único. */
  users: UserDraft[];
  queues: QueueDraft[];
  userQuotas: UserQuotas;
  roleCounts: Record<UserRole, number>;
  onSave: (user: UserDraft) => void;
}) {
  const [draft, setDraft] = useState<UserDraft | null>(null);

  // Reinicializa o formulário toda vez que o modal abre — ajuste de estado
  // durante o render (não em efeito), como recomendado pelo React.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);

    if (open) {
      setDraft(
        editingUser ?? {
          id: createId("user"),
          name: initialName,
          username: "",
          extension: "",
          role: initialRole,
          queueIds: [],
        },
      );
    }
  }

  function update(patch: Partial<UserDraft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  function toggleQueue(queueId: string) {
    if (!draft) return;
    const queueIds = draft.queueIds.includes(queueId)
      ? draft.queueIds.filter((id) => id !== queueId)
      : [...draft.queueIds, queueId];
    update({ queueIds });
  }

  function toggleAllQueues() {
    if (!draft) return;
    update({ queueIds: draft.queueIds.length === queues.length ? [] : queues.map((queue) => queue.id) });
  }

  function handleSave() {
    if (!draft || !canSave(draft)) return;
    onSave(draft);
    onOpenChange(false);
  }

  const hasRoom = (role: UserRole) => !userQuotas || roleCounts[role] < userQuotas[role];

  function canSave(user: UserDraft) {
    return Boolean(user.name.trim() && user.username.trim()) && !hasDuplicateUsername(users, user);
  }

  // Não exibir perfil que o plano não disponibiliza ao cliente. O perfil
  // atual continua visível apenas ao editar um registro legado já salvo.
  const availableRoles = ROLE_ORDER.filter(
    (role) => !userQuotas || userQuotas[role] > 0 || role === draft?.role,
  );
  const usernameAlreadyInUse = draft ? hasDuplicateUsername(users, draft) : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {draft ? (
          <>
            <DialogHeader title={editingUser ? "Editar usuário" : "Novo usuário"} />
            <DialogBody className="flex flex-col gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome">
                  <Input
                    value={draft.name}
                    onChange={(e) => update({ name: e.target.value })}
                    placeholder="Nome completo"
                  />
                </Field>
                <Field label="Usuário" hint="Login usado para acessar o Atender Bem.">
                  <div className="flex flex-col gap-1.5">
                    <Input
                      value={draft.username}
                      onChange={(e) => update({ username: normalizeUsername(e.target.value) })}
                      placeholder="usuario.login"
                      maxLength={USERNAME_MAX_LENGTH}
                      aria-invalid={usernameAlreadyInUse}
                      className={usernameAlreadyInUse ? "border-destructive focus:border-destructive" : undefined}
                    />
                    {usernameAlreadyInUse ? (
                      <span className="text-xs text-destructive">Este login já foi adicionado para outro usuário.</span>
                    ) : (
                      <span className="text-xs text-brand/40">
                        {draft.username.length}/{USERNAME_MAX_LENGTH} caracteres
                      </span>
                    )}
                  </div>
                </Field>
              </div>

              <Field label="Perfil">
                <Select
                  value={draft.role}
                  onValueChange={(value) => {
                    const role = value as UserRole;
                    // Administrador não tem fila vinculada — não faz sentido
                    // carregar uma seleção de fila escondida para o backend.
                    update({ role, ...(role === "administrador" ? { queueIds: [] } : {}) });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => {
                      const disabled = role !== draft.role && !hasRoom(role);
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

              {/* Ramal (sipuser) não é mais pedido aqui — quando o perfil exige um
                  no Atender Bem (administrador/supervisor), o backend gera um
                  número aleatório na hora de criar o usuário. Ver
                  create-users.ts. */}

              {/* Administrador não tem fila vinculada no Atender Bem — só
                  atendente/supervisor participam de filas de atendimento. */}
              <Reveal show={draft.role !== "administrador"}>
                {/* Div (não Field/<label>) de propósito: o label envolveria vários
                    botões de fila e o navegador encaminharia qualquer clique
                    vazio para o primeiro deles. */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm text-brand/40">Filas de acesso</span>
                  {queues.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={toggleAllQueues}
                        className="w-fit text-xs font-medium text-accent hover:text-accent/80"
                      >
                        {draft.queueIds.length === queues.length ? "Limpar seleção" : "Selecionar todas"}
                      </button>
                      <div className="flex flex-wrap gap-1.5">
                        {queues.map((queue) => {
                          const active = draft.queueIds.includes(queue.id);
                          return (
                            <button
                              key={queue.id}
                              type="button"
                              onClick={() => toggleQueue(queue.id)}
                              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                active
                                  ? "border-brand bg-brand-light text-brand"
                                  : "border-border-soft text-brand/50 hover:border-brand/40"
                              }`}
                            >
                              {queue.name || "Fila sem nome"}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-brand/40">
                      Cadastre filas na etapa anterior para vinculá-las a este usuário.
                    </p>
                  )}
                </div>
              </Reveal>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!canSave(draft)} className="flex-1">
                Salvar usuário
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
