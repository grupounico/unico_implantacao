import Link from "next/link"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  fetchActivity,
  fetchDeploymentRun,
  fetchImplantation,
  fetchReview,
  onboardingLink,
} from "@/features/implantations/api"
import { implantationUserQuotas } from "@/features/implantations/types"
import { ActivityTimeline } from "@/features/implantations/components/ActivityTimeline"
import { ApproveCard } from "@/features/implantations/components/ApproveCard"
import { CopyLinkButton } from "@/features/implantations/components/CopyLinkButton"
import { DeploymentRunPanel } from "@/features/implantations/components/DeploymentRunPanel"
import { ImplanterField } from "@/features/implantations/components/ImplanterField"
import { OnboardingReview } from "@/features/implantations/components/OnboardingReview"
import { ReviewEditor } from "@/features/implantations/components/ReviewEditor"
import { ReopenOnboardingCard } from "@/features/implantations/components/ReopenOnboardingCard"
import { RunStatusPoller } from "@/features/implantations/components/RunStatusPoller"
import { StatusBadge } from "@/features/implantations/components/StatusBadge"
import { mergeOnboardingData } from "@/features/implantations/onboarding-merge"
import { formatCNPJ } from "@/features/onboarding/format"
import type { OnboardingData } from "@/features/onboarding/types"
import { fetchMe } from "@/features/auth/api"
import { fetchUsers } from "@/features/users/api"
import { getAuthHeaders } from "@/lib/server-session"
import { ArrowLeftIcon, ExternalLinkIcon, GlobeIcon } from "lucide-react"

export default async function ImplantationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const headers = await getAuthHeaders()
  const [implantation, user] = await Promise.all([fetchImplantation(id, headers), fetchMe(headers)])
  if (!implantation) notFound()

  const [review, run, activity, panelUsers] = await Promise.all([
    fetchReview(id, headers),
    fetchDeploymentRun(id, headers),
    fetchActivity(id, headers),
    fetchUsers(headers),
  ])

  const rawResponses = (review?.reviewedResponses ?? review?.clientResponses ?? null) as Partial<OnboardingData> | null
  const responses = rawResponses ? mergeOnboardingData(rawResponses) : null
  const isEditable = implantation.status === "WAITING_REVIEW"
  const canReopen = ["WAITING_REVIEW", "COMPLETED", "FAILED", "PARTIALLY_FAILED"].includes(
    implantation.status,
  )

  return (
    <>
      <RunStatusPoller active={implantation.status === "QUEUED" || implantation.status === "RUNNING"} />
      <SiteHeader title={implantation.companyName ?? implantation.instanceName} />
      <div className="flex flex-1 flex-col gap-4 py-4 md:py-6">
          <div className="flex flex-col gap-4 px-4 lg:px-6">
            <Button
              variant="ghost"
              size="sm"
              className="w-fit text-muted-foreground"
              nativeButton={false}
              render={<Link href="/admin/implantations" />}
            >
              <ArrowLeftIcon />
              Implantações
            </Button>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">
                    {implantation.companyName ?? implantation.instanceName}
                  </h2>
                  <StatusBadge status={implantation.status} />
                </div>
                <p className="text-sm text-muted-foreground">{implantation.instanceBaseUrl}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={implantation.instanceBaseUrl} target="_blank" rel="noopener noreferrer" />}
                >
                  <GlobeIcon />
                  Abrir instância
                </Button>
                <CopyLinkButton onboardingToken={implantation.onboardingToken} />
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={onboardingLink(implantation.onboardingToken)} target="_blank" rel="noopener noreferrer" />}
                >
                  <ExternalLinkIcon />
                  Ver onboarding
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Dados da solicitação</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Plano contratado</span>
                  <span className="text-sm">{implantation.planName ?? "—"}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">CNPJ</span>
                  <span className="text-sm">
                    {implantation.cnpj ? formatCNPJ(implantation.cnpj) : "—"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Usuários contratados</span>
                  <div className="flex gap-3 text-sm">
                    <span>
                      <span className="text-muted-foreground">Admin </span>
                      {implantation.adminQuota ?? "—"}
                    </span>
                    <span>
                      <span className="text-muted-foreground">Atendente </span>
                      {implantation.agentQuota ?? "—"}
                    </span>
                    <span>
                      <span className="text-muted-foreground">Supervisor </span>
                      {implantation.supervisorQuota ?? "—"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Onboarding enviado em</span>
                  <span className="text-sm">
                    {review?.submittedAt
                      ? new Intl.DateTimeFormat("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }).format(new Date(review.submittedAt))
                      : "Ainda não enviado"}
                  </span>
                </div>
                {review?.reviewedResponses && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Respostas</span>
                    <Badge variant="secondary">Ajustadas pelo implantador</Badge>
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Implantador</span>
                  <ImplanterField
                    implantationId={implantation.id}
                    implanterId={implantation.implanterId}
                    users={panelUsers}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="px-4 lg:px-6">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Visão geral</TabsTrigger>
                <TabsTrigger value="activity">Atividade</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="flex flex-col gap-4">
                {run && <DeploymentRunPanel implantationId={implantation.id} run={run} />}

                {canReopen && (
                  <ReopenOnboardingCard
                    implantationId={implantation.id}
                    isExpansion={implantation.status !== "WAITING_REVIEW"}
                  />
                )}

                {isEditable && (
                  <>
                    <ApproveCard implantationId={implantation.id} approverName={user.name} />
                  </>
                )}

                {responses ? (
                  isEditable ? (
                    <ReviewEditor
                      implantationId={implantation.id}
                      initialData={responses}
                      userQuotas={implantationUserQuotas(implantation)}
                    />
                  ) : (
                    <OnboardingReview data={responses} implantationId={implantation.id} />
                  )
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-sm text-muted-foreground">
                      O cliente ainda não enviou o onboarding — assim que enviar, os dados
                      aparecem aqui para revisão.
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="activity">
                <ActivityTimeline events={activity} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
    </>
  )
}
