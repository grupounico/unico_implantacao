"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxIcon,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { formatCNPJ } from "@/features/onboarding/format";
import { cn } from "@/lib/utils";
import { createImplantation, fullOnboardingLink } from "../api";
import type { Plan } from "../types";

/** Marca visual de campo obrigatório — ao lado do label. */
function RequiredMark() {
  return (
    <span className="text-destructive" aria-hidden="true">
      {" "}
      *
    </span>
  );
}

// Toda instância vive sob esse domínio (ver instance-url.ts) — fixar o
// sufixo poupa o implantador de digitar/colar sempre a mesma coisa.
const INSTANCE_DOMAIN = "atenderbem.com";

/**
 * Remove acentos (ex: "ç" -> "c") enquanto a pessoa digita — sem isso, um
 * subdomínio digitado com o nome da empresa (ex: "folhagemmanipulação")
 * vira Punycode ilegível ("xn--...") quando o backend monta a URL. Mesma
 * normalização em instance-url.ts.
 */
function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Se já vier com domínio/protocolo (colado de outro lugar), manda como está — o backend sabe lidar com isso. */
function buildInstanceUrl(subdomainOrUrl: string): string {
  const trimmed = subdomainOrUrl.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed) || trimmed.toLowerCase().includes(INSTANCE_DOMAIN)) {
    return trimmed;
  }
  return `${trimmed}.${INSTANCE_DOMAIN}`;
}

export function CreateImplantationSheet({ plans }: { plans: Plan[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [instanceSubdomain, setInstanceSubdomain] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  // Pré-preenchidos com os limites do plano ao selecioná-lo, mas o
  // implantador pode ajustar antes de criar o link — o valor final é o que
  // vale para esta implantação, o plano é só o ponto de partida.
  const [agentQuota, setAgentQuota] = useState("");
  const [supervisorQuota, setSupervisorQuota] = useState("");
  const [adminQuota, setAdminQuota] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setInstanceSubdomain("");
    setPlan(null);
    setAgentQuota("");
    setSupervisorQuota("");
    setAdminQuota("");
    setCompanyName("");
    setCnpj("");
    setError(null);
  }

  function handlePlanChange(next: Plan | null) {
    setPlan(next);
    setAgentQuota(next ? String(next.agentQuota) : "");
    setSupervisorQuota(next ? String(next.supervisorQuota) : "");
    setAdminQuota(next ? String(next.adminQuota) : "");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!plan) {
      setError("Selecione o plano contratado");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const implantation = await createImplantation({
        instanceUrl: buildInstanceUrl(instanceSubdomain),
        planId: plan.id,
        agentQuota: Number(agentQuota),
        supervisorQuota: Number(supervisorQuota),
        adminQuota: Number(adminQuota),
        companyName: companyName.trim() || undefined,
        cnpj: cnpj.trim() || undefined,
      });
      setOpen(false);
      reset();
      router.refresh();
      try {
        await navigator.clipboard.writeText(fullOnboardingLink(implantation.onboardingToken));
        toast.success("Implantação criada e link de onboarding copiado");
      } catch {
        toast.success("Implantação criada");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a implantação");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <SheetTrigger
        render={
          <Button>
            <PlusIcon />
            Nova implantação
          </Button>
        }
      />
      <SheetContent>
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader>
            <SheetTitle>Nova solicitação de implantação</SheetTitle>
            <SheetDescription>
              A instância já deve existir no Atender Bem. Informe o link dela e o plano
              contratado para gerar o link de onboarding do cliente.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="instanceUrl">
                Link da instância
                <RequiredMark />
              </Label>
              <div
                className={cn(
                  "flex h-8 w-full items-stretch overflow-hidden rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30"
                )}
              >
                <Input
                  id="instanceUrl"
                  placeholder="cliente"
                  value={instanceSubdomain}
                  onChange={(e) => setInstanceSubdomain(stripAccents(e.target.value))}
                  className="h-auto flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
                  // O navegador não pode sugerir valores salvos de outras
                  // implantações aqui — cada uma é um subdomínio diferente.
                  autoComplete="off"
                  required
                />
                <span className="flex shrink-0 items-center border-l border-input bg-muted/50 px-2.5 text-sm text-muted-foreground select-none">
                  .{INSTANCE_DOMAIN}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Também aceita colar o link completo, se preferir.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="planId">
                Plano contratado
                <RequiredMark />
              </Label>
              <Combobox
                items={plans}
                value={plan}
                onValueChange={handlePlanChange}
                itemToStringLabel={(p) => p.name}
                isItemEqualToValue={(a, b) => a.id === b.id}
                filter={(item: Plan, query) => {
                  const q = query.trim().toLowerCase();
                  if (!q) return true;
                  return item.name.toLowerCase().includes(q) || String(item.id).includes(q);
                }}
              >
                <ComboboxInputGroup
                  className={cn(!plan && error && "border-destructive ring-3 ring-destructive/20")}
                >
                  <ComboboxInput
                    id="planId"
                    placeholder="Busque pelo nome do plano..."
                    // Sem isso o Chrome oferece valores digitados em sessões
                    // anteriores (incluindo números soltos) como sugestão,
                    // que ficam parecendo um plano selecionado por engano.
                    autoComplete="off"
                    required
                  />
                  <ComboboxIcon />
                </ComboboxInputGroup>
                <ComboboxContent>
                  <ComboboxEmpty>Nenhum plano encontrado.</ComboboxEmpty>
                  <ComboboxList>
                    {(item: Plan) => (
                      <ComboboxItem key={item.id} value={item}>
                        {item.name}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Limites de usuário nesta implantação</Label>
              <p className="text-xs text-muted-foreground">
                Vêm do plano selecionado, mas podem ser ajustados só para este cliente.
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="adminQuota" className="text-xs font-normal text-muted-foreground">
                    Admin
                  </Label>
                  <Input
                    id="adminQuota"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={adminQuota}
                    onChange={(e) => setAdminQuota(e.target.value)}
                    disabled={!plan}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="agentQuota" className="text-xs font-normal text-muted-foreground">
                    Atendente
                  </Label>
                  <Input
                    id="agentQuota"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={agentQuota}
                    onChange={(e) => setAgentQuota(e.target.value)}
                    disabled={!plan}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="supervisorQuota" className="text-xs font-normal text-muted-foreground">
                    Supervisor
                  </Label>
                  <Input
                    id="supervisorQuota"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={supervisorQuota}
                    onChange={(e) => setSupervisorQuota(e.target.value)}
                    disabled={!plan}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="companyName">Empresa (opcional)</Label>
              <Input
                id="companyName"
                placeholder="Preenchido pelo cliente se deixado em branco"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cnpj">CNPJ (opcional)</Label>
              <Input
                id="cnpj"
                inputMode="numeric"
                placeholder="00.000.000/0000-00"
                value={cnpj}
                onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                maxLength={18}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <SheetFooter className="flex-row justify-end">
            <SheetClose render={<Button type="button" variant="outline" />}>
              Cancelar
            </SheetClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Criando..." : "Criar implantação"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
