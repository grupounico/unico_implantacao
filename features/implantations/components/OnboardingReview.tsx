import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChannelIcon } from "@/features/onboarding/components/ChannelIcon";
import { RoleIcon } from "@/features/onboarding/components/RoleIcon";
import { formatCNPJ, formatChannelIdentifier, formatPhone } from "@/features/onboarding/format";
import {
  CHANNEL_LABELS,
  ROLE_LABELS,
  SEGMENT_LABELS,
  TRANSFER_POLICY_LABELS,
  type OnboardingData,
} from "@/features/onboarding/types";

/** Rótulo + valor lado a lado — bloco básico de exibição somente leitura. */
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

export function OnboardingReview({ data, implantationId }: { data: Partial<OnboardingData>; implantationId?: string }) {
  const company = data.company;
  const service = data.service;
  const team = data.team;
  const customization = data.customization;
  const customers = data.customers;

  const queueNameById = new Map((service?.queues ?? []).map((q) => [q.id, q.name]));

  return (
    <Tabs defaultValue="company">
      <TabsList>
        <TabsTrigger value="company">Empresa</TabsTrigger>
        <TabsTrigger value="service">Filas e URA</TabsTrigger>
        <TabsTrigger value="team">Usuários</TabsTrigger>
        <TabsTrigger value="customization">Etiquetas e mensagens</TabsTrigger>
        <TabsTrigger value="customers">Agenda</TabsTrigger>
      </TabsList>

      <TabsContent value="company" className="flex flex-col gap-4">
        {company ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Dados da empresa</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Razão social" value={company.legalName} />
              <Field label="Nome fantasia" value={company.tradeName} />
              <Field
                label="Segmento"
                value={
                  company.segment
                    ? company.segment === "generico"
                      ? company.otherSegmentLabel || SEGMENT_LABELS.generico
                      : SEGMENT_LABELS[company.segment]
                    : null
                }
              />
              <Field label="CNPJ" value={company.cnpj ? formatCNPJ(company.cnpj) : null} />
              <Field label="Quantidade de lojas" value={company.storeCount} />
              <Field label="ERP/sistema de gestão" value={company.erp} />
              <Field label="Responsável" value={company.contactName} />
              <Field label="Cargo" value={company.contactRole} />
              <Field label="E-mail" value={company.contactEmail} />
              <Field
                label="Telefone/WhatsApp"
                value={company.contactPhone ? formatPhone(company.contactPhone) : null}
              />
            </CardContent>
          </Card>
        ) : (
          <Empty>Nenhum dado de empresa informado ainda.</Empty>
        )}
        {data.observations && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{data.observations}</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="service" className="flex flex-col gap-4">
        {service?.queues?.length ? (
          service.queues.map((queue) => (
            <Card key={queue.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ChannelIcon channel={queue.channel} />
                  {queue.name}
                  <Badge variant="outline">{CHANNEL_LABELS[queue.channel]}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Field
                  label="Identificador"
                  value={formatChannelIdentifier(queue.channel, queue.channelIdentifier)}
                />
                <Field label="Unidade/loja" value={queue.storeUnit} />
                <Field label="Setor" value={queue.sector} />
                <Field
                  label="Transferir para outra fila"
                  value={TRANSFER_POLICY_LABELS[queue.transferPolicy]}
                />
                {queue.transferPolicy === "specific" && (
                  <Field
                    label="Filas de destino"
                    value={queue.transferableQueueIds
                      .map((id) => queueNameById.get(id))
                      .filter(Boolean)
                      .join(", ")}
                  />
                )}
                <Field
                  label="Mensagem de espera"
                  value={queue.waitingMessage && <span className="line-clamp-3">{queue.waitingMessage}</span>}
                />
                <Field
                  label="Mensagem fora do horário"
                  value={queue.offHoursMessage && <span className="line-clamp-3">{queue.offHoursMessage}</span>}
                />
              </CardContent>
            </Card>
          ))
        ) : (
          <Empty>Nenhuma fila cadastrada ainda.</Empty>
        )}
        {service?.usesIvr && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">URA</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field label="Mensagem de saudação" value={service.ivr.greeting} />
              <Field label="Menu" value={<span className="whitespace-pre-wrap">{service.ivr.menu}</span>} />
              <Field label="Mensagem fora do horário" value={service.ivr.offHoursMessage} />
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="team" className="flex flex-col gap-4">
        {team?.users?.length ? (
          <Card>
            <CardContent className="flex flex-col divide-y p-0">
              {team.users.map((user) => (
                <div key={user.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <RoleIcon role={user.role} className="size-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {user.username}
                        {user.extension ? ` · ramal ${user.extension}` : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {user.queueIds.map((id) => queueNameById.get(id)).filter(Boolean).join(", ") || "—"}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Empty>Nenhum usuário cadastrado ainda.</Empty>
        )}
        {team?.usesPauseControl && team.pauseTypes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tipos de pausa</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {team.pauseTypes.map((pause) => (
                <Badge key={pause.id} variant="secondary">
                  {pause.name} ({pause.durationMinutes} min)
                </Badge>
              ))}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="customization" className="flex flex-col gap-4">
        {customization?.quickReplies?.some((q) => q.selected) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Respostas rápidas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {customization.quickReplies
                .filter((q) => q.selected)
                .map((reply) => (
                  <div key={reply.id} className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">!{reply.shortcut}!</span>
                    <span className="text-sm text-muted-foreground">{reply.message}</span>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}
        {customization?.contactTags?.some((t) => t.enabled) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Etiquetas de contato</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {customization.contactTags
                .filter((t) => t.enabled)
                .map((tag) => (
                  <Badge key={tag.id} variant="secondary">
                    {tag.name}
                  </Badge>
                ))}
            </CardContent>
          </Card>
        )}
        {customization?.chatTags?.some((t) => t.enabled) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Etiquetas de chat</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {customization.chatTags
                .filter((t) => t.enabled)
                .map((tag) => (
                  <Badge key={tag.id} variant="secondary">
                    {tag.name}
                  </Badge>
                ))}
            </CardContent>
          </Card>
        )}
        {!customization?.quickReplies?.some((q) => q.selected) &&
          !customization?.contactTags?.some((t) => t.enabled) &&
          !customization?.chatTags?.some((t) => t.enabled) && (
            <Empty>Nenhuma personalização informada ainda.</Empty>
          )}
      </TabsContent>

      <TabsContent value="customers" className="flex flex-col gap-4">
        {customers?.wantsImport ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Importação de contatos</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Origem da base" value={customers.source || customers.sourceOther} />
              <Field label="Observações" value={customers.notes} />
              {customers.contactImport && (
                <>
                  <Field label="Arquivo" value={customers.contactImport.originalName} />
                  {implantationId && (
                    <a
                      className="text-sm font-medium text-accent underline"
                      href={`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"}/implantations/${implantationId}/contact-import/download`}
                    >
                      Baixar arquivo enviado
                    </a>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Empty>Cliente não solicitou importação de contatos.</Empty>
        )}
      </TabsContent>
    </Tabs>
  );
}
