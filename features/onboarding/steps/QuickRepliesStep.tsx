"use client";

import { AnimatePresence, motion } from "motion/react";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmPopover } from "../components/ConfirmPopover";
import { createId } from "../initial-data";
import type { OnboardingData, QuickReplyDraft } from "../types";

export function hasIncompleteQuickReplies(replies: QuickReplyDraft[]) {
  return replies.some((reply) => reply.selected && (!reply.shortcut.trim() || !reply.message.trim()));
}

export function QuickRepliesStep({
  data,
  onChange,
}: {
  data: OnboardingData["customization"];
  onChange: (data: OnboardingData["customization"]) => void;
}) {
  const [newShortcut, setNewShortcut] = useState("");
  const [replyPendingRemoval, setReplyPendingRemoval] = useState<QuickReplyDraft | null>(null);

  function toggleReply(id: string) {
    onChange({
      ...data,
      quickReplies: data.quickReplies.map((reply) =>
        reply.id === id ? { ...reply, selected: !reply.selected } : reply,
      ),
    });
  }

  function updateReplyMessage(id: string, message: string) {
    onChange({
      ...data,
      quickReplies: data.quickReplies.map((reply) =>
        reply.id === id ? { ...reply, message } : reply,
      ),
    });
  }

  function updateReplyShortcut(id: string, shortcut: string) {
    onChange({
      ...data,
      quickReplies: data.quickReplies.map((reply) =>
        reply.id === id ? { ...reply, shortcut } : reply,
      ),
    });
  }

  function removeReply(id: string) {
    onChange({ ...data, quickReplies: data.quickReplies.filter((reply) => reply.id !== id) });
  }

  function handleAddReply() {
    if (!newShortcut.trim()) return;
    const reply: QuickReplyDraft = {
      id: createId("reply"),
      shortcut: newShortcut.trim(),
      message: "",
      selected: true,
    };
    // Entra no topo — junto do campo que a criou, não escondida no fim da lista.
    onChange({ ...data, quickReplies: [reply, ...data.quickReplies] });
    setNewShortcut("");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <input
          value={newShortcut}
          onChange={(e) => setNewShortcut(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddReply();
            }
          }}
          placeholder="Nome do novo atalho"
          className="w-full max-w-[280px] rounded-xl border border-border-soft bg-card px-3 py-2 text-sm text-brand outline-none placeholder:text-brand/40 focus:border-accent"
        />
        <button
          type="button"
          onClick={handleAddReply}
          className="inline-flex items-center gap-1 rounded-xl border border-brand/40 px-3 py-2 text-sm font-medium text-brand/80 hover:bg-brand-light"
        >
          <Plus className="size-3.5" />
          Adicionar resposta
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {data.quickReplies.map((reply) => (
            <motion.div
              key={reply.id}
              layout
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className={`rounded-2xl border bg-card p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${
                reply.selected && (!reply.shortcut.trim() || !reply.message.trim())
                  ? "border-destructive"
                  : "border-border-soft"
              }`}>
                <div className={`transition-opacity ${reply.selected ? "" : "opacity-45"}`}>
                  <div className="flex items-baseline gap-1">
                    <span className="shrink-0 text-sm font-semibold text-brand/30">!</span>
                    <input
                      value={reply.shortcut}
                      onChange={(e) => updateReplyShortcut(reply.id, e.target.value)}
                      placeholder="atalho"
                      className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-semibold text-brand outline-none placeholder:font-normal placeholder:text-brand/30"
                    />
                  </div>
                  <textarea
                    value={reply.message}
                    onChange={(e) => updateReplyMessage(reply.id, e.target.value)}
                    placeholder="Mensagem enviada quando o atalho for usado"
                    rows={reply.message.length > 200 ? 6 : 2}
                    className="mt-2 w-full resize-none rounded-lg border-0 bg-brand-light/60 px-3 py-2.5 text-sm leading-relaxed text-brand outline-none transition-colors placeholder:text-brand/35 focus:bg-brand-light"
                  />
                  {reply.selected && (!reply.shortcut.trim() || !reply.message.trim()) ? (
                    <p className="mt-2 text-xs text-destructive">Preencha o título e o texto, ou desative esta resposta.</p>
                  ) : null}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border-soft/70 pt-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={reply.selected}
                      onClick={() => toggleReply(reply.id)}
                      className={`inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ${
                        reply.selected ? "justify-end bg-accent" : "justify-start bg-brand/15"
                      }`}
                    >
                      <motion.span
                        layout
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="size-4 rounded-full bg-white shadow-[0_1px_2px_rgba(15,23,42,0.25)]"
                      />
                    </button>
                    <span className="text-xs font-medium text-brand/50">
                      {reply.selected ? "Ativa" : "Inativa"}
                    </span>
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setReplyPendingRemoval(reply)}
                      className="flex items-center gap-1.5 text-xs font-medium text-brand/35 transition-colors hover:text-red-500"
                    >
                      <Trash2 className="size-3.5" />
                      Remover
                    </button>
                    <ConfirmPopover
                      open={replyPendingRemoval?.id === reply.id}
                      onCancel={() => setReplyPendingRemoval(null)}
                      onConfirm={() => {
                        removeReply(reply.id);
                        setReplyPendingRemoval(null);
                      }}
                      message={`Remover "${reply.shortcut || "Sem atalho"}"?`}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
