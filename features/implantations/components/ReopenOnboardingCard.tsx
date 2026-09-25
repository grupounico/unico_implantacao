"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RotateCcwIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { reopenOnboarding } from "../api";

export function ReopenOnboardingCard({
  implantationId,
  isExpansion = false,
}: {
  implantationId: string;
  isExpansion?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleReopen() {
    if (!confirm("Criar uma nova revisão para o cliente? O link anterior deixará de funcionar.")) return;
    setBusy(true);
    try {
      await reopenOnboarding(implantationId);
      toast.success("Nova revisão criada com um novo link para o cliente");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar a revisão");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{isExpansion ? "Nova revisão ou expansão" : "Devolver para o cliente"}</CardTitle>
        <CardDescription>
          {isExpansion
            ? "Use os dados atuais como ponto de partida para adicionar ou alterar filas, usuários e personalizações."
            : "Permite revisar e alterar os dados antes da aprovação."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={handleReopen} disabled={busy}>
          <RotateCcwIcon />
          {busy ? "Criando revisão..." : isExpansion ? "Criar revisão" : "Reabrir onboarding"}
        </Button>
      </CardContent>
    </Card>
  );
}
