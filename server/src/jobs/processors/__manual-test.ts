/**
 * Teste manual (fora do build) dos processors que já falam de verdade com o
 * AtenderBemClient. Roda com fetch mockado, sem precisar de banco/Redis/
 * instância real. Rodar com:
 *   npx tsx src/jobs/processors/__manual-test.ts
 */
import { AtenderBemClient } from "../../integrations/atender-bem";
import { configureIvrProcessor } from "./configure-ivr";
import { configureQueuesProcessor } from "./configure-queues";
import { createChatTagsProcessor } from "./create-chat-tags";
import { createContactTagsProcessor } from "./create-contact-tags";
import { createQuickRepliesProcessor } from "./create-quick-replies";
import { createUsersProcessor } from "./create-users";

let failures = 0;
function check(label: string, condition: boolean) {
  console.log(`${condition ? "OK  " : "FAIL"} ${label}`);
  if (!condition) failures++;
}

let queuesDb: Record<string, unknown>[] = [
  { id: 1, name: "WhatsApp Loja Centro", type: 21, ivrid: 0, enabled: 1, status: 1 },
];
let usersDb: Record<string, unknown>[] = [
  { id: 10, username: "existente@empresa.com", fullname: "Já Existe", type: 2, queues: [] },
];
let ivrsDb: Record<string, unknown>[] = [];
let contactTagsDb: Record<string, unknown>[] = [
  { id: 100, name: "Já existe", bgcolor: "#000", fgcolor: "#fff", contacttag: 1 },
];
let chatTagsDb: Record<string, unknown>[] = [];
let predefinedTextsDb: Record<string, unknown>[] = [];
const accessGroupsDb = [{ id: 1, name: "Todos" }];
let nextQueueId = 2;
let nextUserId = 11;
let nextIvrId = 1;
let nextContactTagId = 101;
let nextChatTagId = 1;
let nextTextId = 1;
let nextBusinessHoursId = 1;

const queueDraftDefaults = {
  id: "queue-draft",
  weekdayHours: { enabled: false },
  saturdayHours: { enabled: false },
  sundayHolidayHours: { enabled: false },
};

// @ts-expect-error - substitui fetch global só para este teste manual
globalThis.fetch = async (input: string | URL, init?: RequestInit) => {
  const url = new URL(String(input));
  const method = init?.method ?? "GET";
  const body = init?.body ? JSON.parse(String(init.body)) : undefined;

  if (url.pathname === "/login") {
    return new Response(JSON.stringify({ token: "token-1" }), { status: 200 });
  }
  if (url.pathname === "/businesshours/configs" && method === "POST") {
    return new Response(JSON.stringify({ id: nextBusinessHoursId++, ...body }), { status: 201 });
  }
  if (url.pathname === "/queues" && method === "GET") {
    return new Response(JSON.stringify(queuesDb), { status: 200 });
  }
  if (url.pathname === "/queues" && method === "POST") {
    const created = { id: nextQueueId++, ...body };
    queuesDb.push(created);
    return new Response(JSON.stringify(created), { status: 201 });
  }
  if (url.pathname.match(/^\/queues\/\d+$/) && method === "GET") {
    const id = Number(url.pathname.split("/")[2]);
    const found = queuesDb.find((queue) => queue.id === id);
    return new Response(JSON.stringify(found), { status: found ? 200 : 404 });
  }
  if (url.pathname.match(/^\/queues\/\d+$/) && method === "PUT") {
    const id = Number(url.pathname.split("/")[2]);
    const current = queuesDb.find((queue) => queue.id === id);
    if (!current) return new Response(JSON.stringify({ message: "not found" }), { status: 404 });
    const updated = { ...current, ...body, id };
    queuesDb = queuesDb.map((queue) => (queue.id === id ? updated : queue));
    return new Response(JSON.stringify(updated), { status: 200 });
  }
  if (url.pathname === "/users/getUsers") {
    return new Response(JSON.stringify(usersDb), { status: 200 });
  }
  if (url.pathname === "/users" && method === "POST") {
    const created = { id: nextUserId++, ...body };
    usersDb.push(created);
    return new Response(JSON.stringify(created), { status: 201 });
  }
  if (url.pathname.match(/^\/users\/\d+$/) && method === "GET") {
    const id = Number(url.pathname.split("/")[2]);
    const found = usersDb.find((user) => user.id === id);
    return new Response(JSON.stringify(found), { status: found ? 200 : 404 });
  }
  if (url.pathname.match(/^\/users\/\d+$/) && method === "PUT") {
    const id = Number(url.pathname.split("/")[2]);
    const current = usersDb.find((user) => user.id === id);
    if (!current) return new Response(JSON.stringify({ message: "not found" }), { status: 404 });
    const updated = { ...current, ...body, id };
    usersDb = usersDb.map((user) => (user.id === id ? updated : user));
    return new Response(JSON.stringify(updated), { status: 200 });
  }
  if (url.pathname === "/ivrs/getResumedList") {
    return new Response(JSON.stringify(ivrsDb), { status: 200 });
  }
  if (url.pathname === "/ivrs/" && method === "POST") {
    const created = { id: nextIvrId++, ...body };
    ivrsDb.push(created);
    return new Response(JSON.stringify(created), { status: 201 });
  }
  if (url.pathname.match(/^\/ivrs\/\d+$/) && method === "GET") {
    const id = Number(url.pathname.split("/")[2]);
    const found = ivrsDb.find((i) => i.id === id);
    return new Response(JSON.stringify(found), { status: found ? 200 : 404 });
  }
  if (url.pathname.match(/^\/ivrs\/\d+$/) && method === "PUT") {
    const id = Number(url.pathname.split("/")[2]);
    ivrsDb = ivrsDb.map((i) => (i.id === id ? { ...i, ...body, id } : i));
    return new Response(JSON.stringify({ ...body, id }), { status: 200 });
  }

  if (url.pathname === "/tags/" && method === "GET") {
    return new Response(JSON.stringify(contactTagsDb), { status: 200 });
  }
  if (url.pathname === "/tags/" && method === "POST") {
    const created = { id: nextContactTagId++, ...body };
    contactTagsDb.push(created);
    return new Response(JSON.stringify(created), { status: 201 });
  }
  if (url.pathname.match(/^\/tags\/\d+$/) && method === "GET") {
    const id = Number(url.pathname.split("/")[2]);
    const found = contactTagsDb.find((tag) => tag.id === id);
    return new Response(JSON.stringify(found), { status: found ? 200 : 404 });
  }
  if (url.pathname.match(/^\/tags\/\d+$/) && method === "PUT") {
    const id = Number(url.pathname.split("/")[2]);
    const current = contactTagsDb.find((tag) => tag.id === id);
    if (!current) return new Response(JSON.stringify({ message: "not found" }), { status: 404 });
    const updated = { ...current, ...body, id };
    contactTagsDb = contactTagsDb.map((tag) => (tag.id === id ? updated : tag));
    return new Response(JSON.stringify(updated), { status: 200 });
  }
  if (url.pathname === "/chattags/getChatTags") {
    return new Response(JSON.stringify(chatTagsDb), { status: 200 });
  }
  if (url.pathname === "/chattags/" && method === "POST") {
    const created = { id: nextChatTagId++, ...body };
    chatTagsDb.push(created);
    return new Response(JSON.stringify(created), { status: 201 });
  }
  if (url.pathname.match(/^\/chattags\/\d+$/) && method === "GET") {
    const id = Number(url.pathname.split("/")[2]);
    const found = chatTagsDb.find((tag) => tag.id === id);
    return new Response(JSON.stringify(found), { status: found ? 200 : 404 });
  }
  if (url.pathname.match(/^\/chattags\/\d+$/) && method === "PUT") {
    const id = Number(url.pathname.split("/")[2]);
    const current = chatTagsDb.find((tag) => tag.id === id);
    if (!current) return new Response(JSON.stringify({ message: "not found" }), { status: 404 });
    const updated = { ...current, ...body, id };
    chatTagsDb = chatTagsDb.map((tag) => (tag.id === id ? updated : tag));
    return new Response(JSON.stringify(updated), { status: 200 });
  }
  if (url.pathname === "/predefinedtexts/textItens") {
    return new Response(JSON.stringify(predefinedTextsDb), { status: 200 });
  }
  if (url.pathname === "/contactsgroups/getGroups") {
    return new Response(JSON.stringify(accessGroupsDb), { status: 200 });
  }
  if (url.pathname === "/predefinedtexts" && method === "POST") {
    const created = { id: nextTextId++, ...body };
    predefinedTextsDb.push(created);
    return new Response(JSON.stringify(created), { status: 201 });
  }

  return new Response(JSON.stringify({ message: "not found in mock" }), { status: 404 });
};

async function main() {
  const client = new AtenderBemClient({
    baseUrl: "https://cliente.atenderbem.com",
    username: "service-account",
    password: "secret",
    totpSecret: "JBSWY3DPEHPK3PXP",
  });

  // --- CONFIGURE_QUEUES -----------------------------------------------
  const queuesResult = await configureQueuesProcessor({
    implantationId: "impl-1",
    deploymentRunId: "run-1",
    client,
    snapshotPayload: {
      service: {
        queues: [
          { ...queueDraftDefaults, id: "whatsapp-centro", name: "WhatsApp Loja Centro", channel: "whatsapp" }, // já existe
          { ...queueDraftDefaults, id: "instagram-rede", name: "Instagram da rede", channel: "instagram" }, // nova
        ],
      },
    },
  });

  const createdQueues = queuesResult.metadata?.queues as { name: string; id: number }[];
  check("CONFIGURE_QUEUES não duplica fila existente", createdQueues[0].id === 1);
  check("CONFIGURE_QUEUES cria a fila nova", createdQueues[1].name === "Instagram da rede");
  check(
    "CONFIGURE_QUEUES mapeia o canal para o type correto",
    (queuesDb.find((q) => q.name === "Instagram da rede") as { type: number }).type === 12,
  );
  check("CONFIGURE_QUEUES não duplicou no banco mock", queuesDb.length === 2);
  check(
    "CONFIGURE_QUEUES aplica os defaults operacionais da fila",
    [
      "addagentname",
      "dontopenwithsentmessage",
      "autoremovefromwaitinglist",
      "aisummary",
      "aiimprovedaudiotranscription",
      "aiallowmsgsuggestion",
      "aiallowmanualsummary",
    ].every(
      (field) =>
        (queuesDb.find((queue) => queue.name === "Instagram da rede") as Record<string, unknown>)[
          field
        ] === 1,
    ),
  );

  try {
    await configureQueuesProcessor({
      implantationId: "impl-1",
      deploymentRunId: "run-1",
      client,
      snapshotPayload: {
        service: { queues: [{ ...queueDraftDefaults, id: "facebook", name: "Facebook", channel: "outro" }] },
      },
    });
    check("CONFIGURE_QUEUES rejeita canal sem type mapeado", false);
  } catch (err) {
    check(
      "CONFIGURE_QUEUES rejeita canal sem type mapeado",
      err instanceof Error && err.message.includes("outro"),
    );
  }

  // reprocessar (idempotência real, não só dentro do mesmo payload)
  const secondRun = await configureQueuesProcessor({
    implantationId: "impl-1",
    deploymentRunId: "run-1",
    client,
    snapshotPayload: {
      service: {
        queues: [
          { ...queueDraftDefaults, id: "instagram-rede", name: "Instagram da rede", channel: "instagram" },
        ],
      },
    },
  });
  check("reprocessar CONFIGURE_QUEUES não cria fila duplicada", queuesDb.length === 2);
  check(
    "reprocessar CONFIGURE_QUEUES retorna o id já existente",
    (secondRun.metadata?.queues as { id: number }[])[0].id === 2,
  );

  // --- CREATE_USERS ------------------------------------------------------
  const usersResult = await createUsersProcessor({
    implantationId: "impl-1",
    deploymentRunId: "run-1",
    client,
    snapshotPayload: {
      team: {
        users: [
          { name: "Já Existe", username: "existente@empresa.com", role: "atendente" },
          { name: "Novo Atendente", username: "novo@empresa.com", role: "atendente" },
        ],
      },
    },
  });

  const usersMeta = usersResult.metadata?.users as {
    username: string;
    id: number;
    created: boolean;
  }[];
  check("CREATE_USERS não recria usuário existente", usersMeta[0].created === false);
  check("CREATE_USERS cria o usuário novo", usersMeta[1].created === true);
  check("CREATE_USERS não duplicou no banco mock", usersDb.length === 2);
  try {
    await createUsersProcessor({
      implantationId: "impl-1",
      deploymentRunId: "run-duplicate-usernames",
      client,
      snapshotPayload: {
        team: {
          users: [
            { name: "Login Um", username: "mesmo.login", role: "atendente" },
            { name: "Login Dois", username: "mesmo.login", role: "supervisor" },
          ],
        },
      },
    });
    check("CREATE_USERS rejeita logins duplicados", false);
  } catch (err) {
    check(
      "CREATE_USERS rejeita logins duplicados",
      err instanceof Error && err.message.includes("login") && err.message.includes("duplicado"),
    );
  }
  check(
    "senha não aparece no resultado retornado",
    JSON.stringify(usersResult).includes("password") === false,
  );
  const generatedPassword = usersResult.metadata?.generatedDefaultPassword as string | undefined;
  check(
    "usuário novo recebeu senha gerada aleatoriamente (nenhuma foi definida no onboarding)",
    typeof generatedPassword === "string" &&
      /[A-Z]/.test(generatedPassword) &&
      /[a-z]/.test(generatedPassword) &&
      /\d/.test(generatedPassword) &&
      /[^A-Za-z0-9]/.test(generatedPassword),
  );
  check(
    "senha gerada foi de fato a aplicada ao usuário novo",
    (usersDb.find((u) => u.username === "novo@empresa.com") as { password: string }).password ===
      generatedPassword,
  );
  check(
    "CREATE_USERS aplica permissões operacionais ao criar e atualizar",
    [
      "status",
      "chatenabled",
      "tasksenabled",
      "autologin",
      "canrequestaisummary",
      "ignorelimitsforblockedchats",
      "canreopenchat",
      "canreopenotherschat",
      "canopennewchat",
      "canuseinternalchat",
    ].every(
      (field) =>
        (usersDb.find((user) => user.username === "novo@empresa.com") as Record<string, unknown>)[field] === 1 &&
        (usersDb.find((user) => user.username === "existente@empresa.com") as Record<string, unknown>)[field] === 1,
    ),
  );

  const customPasswordResult = await createUsersProcessor({
    implantationId: "impl-1",
    deploymentRunId: "run-1",
    client,
    snapshotPayload: {
      team: {
        users: [{ name: "Com Senha Própria", username: "propria@empresa.com", role: "atendente" }],
        usesCustomDefaultPassword: true,
        defaultPassword: "Farmacia@2026",
      },
    },
  });
  check(
    "usuário criado com senha personalizada do onboarding",
    (usersDb.find((u) => u.username === "propria@empresa.com") as { password: string })
      .password === "Farmacia@2026",
  );
  check(
    "usuário com senha personalizada também retorna sem a senha no resultado",
    JSON.stringify(customPasswordResult).includes("Farmacia@2026") === false,
  );

  try {
    await createUsersProcessor({
      implantationId: "impl-1",
      deploymentRunId: "run-1",
      client,
      snapshotPayload: {
        team: { users: [{ name: "X", username: "x@x.com", role: "papel-invalido" }] },
      },
    });
    check("CREATE_USERS rejeita perfil desconhecido", false);
  } catch (err) {
    check(
      "CREATE_USERS rejeita perfil desconhecido",
      err instanceof Error && err.message.includes("papel-invalido"),
    );
  }

  // --- CONFIGURE_IVR -------------------------------------------------------
  const ivrDisabled = await configureIvrProcessor({
    implantationId: "impl-1",
    deploymentRunId: "run-1",
    client,
    snapshotPayload: { service: { queues: [] } },
  });
  check(
    "CONFIGURE_IVR não chama a API quando não há filas",
    Array.isArray(ivrDisabled.metadata?.ivrs) && ivrDisabled.metadata.ivrs.length === 0,
  );
  check("CONFIGURE_IVR não criou URA sem filas", ivrsDb.length === 0);

  // --- CREATE_CONTACT_TAGS --------------------------------------------------
  const contactTagsResult = await createContactTagsProcessor({
    implantationId: "impl-1",
    deploymentRunId: "run-1",
    client,
    snapshotPayload: {
      customization: {
        contactTags: [
          { name: "Já existe", enabled: true, bgcolor: "#111", fgcolor: "#fff" },
          { name: "Cliente VIP", enabled: true, bgcolor: "#C6265C", fgcolor: "#fff" },
          { name: "Desabilitada", enabled: false },
        ],
      },
    },
  });
  const contactTagsMeta = contactTagsResult.metadata?.contactTags as {
    name: string;
    id: number;
    created: boolean;
  }[];
  check("CREATE_CONTACT_TAGS não recria etiqueta existente", contactTagsMeta[0].created === false);
  check("CREATE_CONTACT_TAGS cria a etiqueta nova", contactTagsMeta[1].created === true);
  check("CREATE_CONTACT_TAGS ignora etiquetas desabilitadas", contactTagsMeta.length === 2);
  check(
    "etiqueta criada usa a cor do pacote do segmento",
    (contactTagsDb.find((t) => t.name === "Cliente VIP") as { bgcolor: string }).bgcolor ===
      "#C6265C",
  );

  // --- CREATE_CHAT_TAGS ------------------------------------------------------
  const chatTagsResult = await createChatTagsProcessor({
    implantationId: "impl-1",
    deploymentRunId: "run-1",
    client,
    snapshotPayload: {
      customization: {
        chatTags: [{ name: "Aguardando retorno", enabled: true, marker: "💵" }],
      },
    },
  });
  const chatTagsMeta = chatTagsResult.metadata?.chatTags as { name: string; created: boolean }[];
  check("CREATE_CHAT_TAGS cria a etiqueta de chat", chatTagsMeta[0].created === true);
  check(
    "etiqueta de chat usa o marcador do pacote do segmento",
    (chatTagsDb[0] as { marker: string }).marker === "💵",
  );

  // reprocessar não deve duplicar
  await createChatTagsProcessor({
    implantationId: "impl-1",
    deploymentRunId: "run-1",
    client,
    snapshotPayload: {
      customization: { chatTags: [{ name: "Aguardando retorno", enabled: true }] },
    },
  });
  check("reprocessar CREATE_CHAT_TAGS não duplica", chatTagsDb.length === 1);

  // --- CREATE_QUICK_REPLIES ---------------------------------------------------
  const quickRepliesResult = await createQuickRepliesProcessor({
    implantationId: "impl-1",
    deploymentRunId: "run-1",
    client,
    snapshotPayload: {
      customization: {
        quickReplies: [
          { shortcut: "Saudação", message: "Olá! Como posso ajudar?", selected: true },
          { shortcut: "Não selecionada", message: "x", selected: false },
        ],
      },
    },
  });
  const quickRepliesMeta = quickRepliesResult.metadata?.quickReplies as {
    title: string;
    created: boolean;
  }[];
  check("CREATE_QUICK_REPLIES cria só as selecionadas", quickRepliesMeta.length === 1);
  check(
    "CREATE_QUICK_REPLIES resolve os grupos de acesso disponíveis",
    JSON.stringify(quickRepliesResult.metadata?.accessgroups) === JSON.stringify([1]),
  );
  check(
    "texto gravado é o mesmo do onboarding",
    (predefinedTextsDb[0] as { text: string }).text === "Olá! Como posso ajudar?",
  );

  console.log(`\n${failures === 0 ? "TODOS OS TESTES PASSARAM" : `${failures} TESTE(S) FALHARAM`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
