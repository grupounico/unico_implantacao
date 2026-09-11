import { templates } from '../../../../data/templates_ia';

interface ParamDoc {
  field: string;
  type: string;
  required: boolean;
  description: string;
}

interface IaDocLink {
  label: string;
  path: string;
}

export interface IaDocDefinition {
  slug: string;
  docsPath: string;
  title: string;
  badge: string;
  version: string;
  description: string;
  summary: string;
  endpoint: string;
  highlights: string[];
  steps: string[];
  requestFields: ParamDoc[];
  installedTemplates: string[];
  payloadExample: string;
  checklist: string[];
  links: IaDocLink[];
}

export const iaDocOrder = [
  'alpha7',
  'trier',
  'vtex',
  'vannon',
  'vetor',
  'atendimento',
] as const;

export type IaDocKey = (typeof iaDocOrder)[number];

const endpointBase = '/api/ia/create-ai';

export const commonIaRequestFields: ParamDoc[] = [
  {
    field: 'instance',
    type: 'string',
    required: true,
    description:
      'URL da instÃ¢ncia alvo. A instalaÃ§Ã£o deve usar a URL completa, com https e sem barra final.',
  },
  {
    field: 'username',
    type: 'string',
    required: true,
    description:
      'Credencial da instÃ¢ncia enviada automaticamente pela sessÃ£o autenticada.',
  },
  {
    field: 'password',
    type: 'string',
    required: true,
    description:
      'Senha da instÃ¢ncia enviada automaticamente pela sessÃ£o autenticada.',
  },
  {
    field: 'code',
    type: 'string',
    required: true,
    description:
      'CÃ³digo 2FA informado na etapa de seguranÃ§a da instalaÃ§Ã£o.',
  },
  {
    field: 'name',
    type: 'string',
    required: true,
    description: 'Nome que serÃ¡ exibido para a IA criada.',
  },
];

export const iaDocs: Record<IaDocKey, IaDocDefinition> = {
  alpha7: {
    slug: 'alpha7',
    docsPath: '/main/docs/ias/alpha7',
    title: 'IA Alpha 7',
    badge: 'IAs - Alpha 7',
    version: templates.alpha7.version || '1.0',
    description:
      'Fluxo com coleta inicial, liberaÃ§Ã£o de acesso ao banco, criaÃ§Ã£o do serviÃ§o Alpha 7 API e instalaÃ§Ã£o da IA.',
    summary:
      'Coleta dados do cliente, libera acesso ao banco, valida a unidade de negÃ³cio, cria o serviÃ§o e conclui a instalaÃ§Ã£o da IA.',
    endpoint: `${endpointBase}${templates.alpha7.endpoint || ''}`,
    highlights: [
      'Exige liberaÃ§Ã£o de leitura no banco e abertura de acesso externo.',
      'Depende da unidade de negÃ³cio validada no teste de conexÃ£o.',
      'Requer conferÃªncia da API key da fila antes da homologaÃ§Ã£o.',
    ],
    steps: [],
    requestFields: [],
    installedTemplates: [],
    payloadExample: '',
    checklist: [
      'Confirmar unidade de negÃ³cio.',
      'Gerar e armazenar a OPENAI_API_KEY antes de criar o serviÃ§o.',
      'Criar o serviÃ§o Alpha 7 API.',
      'Validar API key da fila.',
    ],
    links: [
      { label: 'Visão geral das IAs', path: '/main/docs/ias' },
      { label: 'IA Trier', path: '/main/docs/ias/trier' },
      { label: 'IA Vannon', path: '/main/docs/ias/vannon' },
    ],
  },
  trier: {
    slug: 'trier',
    docsPath: '/main/docs/ias/trier',
    title: 'IA Trier',
    badge: 'IAs - Trier',
    version: templates.trier.version || '1.0',
    description:
      'Fluxo com solicitaÃ§Ã£o de Integração Ã  Trier, recebimento do token, criaÃ§Ã£o do serviÃ§o e instalaÃ§Ã£o da IA.',
    summary:
      'Solicita a Integração junto Ã  Trier, recebe o token, cria o serviÃ§o IA Trier API e valida a fila antes da homologaÃ§Ã£o.',
    endpoint: `${endpointBase}${templates.trier.endpoint || ''}`,
    highlights: [
      'ComeÃ§a pela solicitaÃ§Ã£o da Integração diretamente Ã  Trier.',
      'Depende do token enviado pela Trier.',
      'Exige conferÃªncia da API key da fila antes da liberaÃ§Ã£o.',
    ],
    steps: [],
    requestFields: [],
    installedTemplates: [],
    payloadExample: '',
    checklist: [
      'Receber o token da Trier.',
      'Gerar e armazenar a OPENAI_API_KEY antes de criar o serviÃ§o.',
      'Criar o serviÃ§o IA Trier API.',
      'Conferir API key global e API key da fila.',
    ],
    links: [
      { label: 'Visão geral das IAs', path: '/main/docs/ias' },
      { label: 'IA Alpha 7', path: '/main/docs/ias/alpha7' },
      { label: 'IA Vetor', path: '/main/docs/ias/vetor' },
    ],
  },
  vtex: {
    slug: 'vtex',
    docsPath: '/main/docs/ias/vtex',
    title: 'IA VTEX',
    badge: 'IAs - VTEX',
    version: templates.vtex.version || '1.0',
    description:
      'Fluxo inicial de implantacao da IA VTEX com criacao de servico/API, instalacao da IA e homologacao.',
    summary:
      'Usa a mesma base operacional do fluxo e-commerce: cria o servico, instala a IA VTEX e valida a fila antes da homologacao.',
    endpoint: `${endpointBase}${templates.vtex.endpoint || ''}`,
    highlights: [
      'Estrutura inicial baseada no fluxo e-commerce ja usado pela Trier.',
      'Depende da API key global e dos dados do servico VTEX.',
      'Requer conferencia da API key da fila antes da liberacao.',
    ],
    steps: [],
    requestFields: [],
    installedTemplates: [],
    payloadExample: '',
    checklist: [
      'Definir os dados do servico/API da VTEX.',
      'Gerar e armazenar a OPENAI_API_KEY antes de criar o servico.',
      'Criar o servico da IA VTEX.',
      'Preencher url_vtex_variable, vtex_app_key_variable e vtex_app_token_variable.',
      'Conferir API key global e API key da fila.',
    ],
    links: [
      { label: 'Visão geral das IAs', path: '/main/docs/ias' },
      { label: 'IA Trier', path: '/main/docs/ias/trier' },
      { label: 'IA Vannon', path: '/main/docs/ias/vannon' },
    ],
  },
  vannon: {
    slug: 'vannon',
    docsPath: '/main/docs/ias/vannon',
    title: 'IA Vannon',
    badge: 'IAs - Vannon',
    version: templates.vannon.version || '1.0',
    description:
      'Fluxo com solicitaÃ§Ã£o de credenciais no grupo, validaÃ§Ã£o interna, instalaÃ§Ã£o da IA e homologaÃ§Ã£o.',
    summary:
      'Solicita credenciais no grupo, valida internamente, instala a IA Vannon com endpoint pÃºblico e CEP da loja, e confere a fila.',
    endpoint: `${endpointBase}${templates.vannon.endpoint || ''}`,
    highlights: [
      'Exige validaÃ§Ã£o interna antes da instalaÃ§Ã£o.',
      'Usa endpoint pÃºblico e CEP real da unidade.',
      'Depende da API key global e da API key da fila.',
    ],
    steps: [],
    requestFields: [],
    installedTemplates: [],
    payloadExample: '',
    checklist: [
      'Receber as credenciais da Vannon.',
      'Gerar e armazenar a OPENAI_API_KEY antes de instalar a IA.',
      'Informar endpoint pÃºblico e CEP real da loja.',
      'Conferir API key global e API key da fila.',
    ],
    links: [
      { label: 'Visão geral das IAs', path: '/main/docs/ias' },
      { label: 'IA Alpha 7', path: '/main/docs/ias/alpha7' },
      { label: 'IA Vetor', path: '/main/docs/ias/vetor' },
    ],
  },
  vetor: {
    slug: 'vetor',
    docsPath: '/main/docs/ias/vetor',
    title: 'IA Vetor',
    badge: 'IAs - Vetor',
    version: templates.vetor.version || '1.0',
    description:
      'Fluxo com solicitaÃ§Ã£o de credenciais no grupo, validaÃ§Ã£o interna, instalaÃ§Ã£o da IA e homologaÃ§Ã£o.',
    summary:
      'Solicita credenciais no grupo, valida internamente, instala a IA Vetor com token dedicado e confere a API key da fila.',
    endpoint: `${endpointBase}${templates.vetor.endpoint || ''}`,
    highlights: [
      'Exige token enviado pela Vetor.',
      'Depende de validaÃ§Ã£o interna antes da instalaÃ§Ã£o.',
      'Requer conferÃªncia da API key da fila antes da homologaÃ§Ã£o.',
    ],
    steps: [],
    requestFields: [],
    installedTemplates: [],
    payloadExample: '',
    checklist: [
      'Receber o token da Vetor.',
      'Gerar e armazenar a OPENAI_API_KEY antes de instalar a IA.',
      'Validar internamente com Maicon ou Moara.',
      'Conferir API key global e API key da fila.',
    ],
    links: [
      { label: 'Visão geral das IAs', path: '/main/docs/ias' },
      { label: 'IA Trier', path: '/main/docs/ias/trier' },
      { label: 'IA Vannon', path: '/main/docs/ias/vannon' },
    ],
  },
  atendimento: {
    slug: 'atendimento',
    docsPath: '/main/docs/ias/atendimento',
    title: 'IA Atendimento',
    badge: 'IAs - Atendimento',
    version: templates.atendimento.version || '1.0',
    description:
      'Fluxo de instalaÃ§Ã£o direta da IA de atendimento com contexto customizado e homologaÃ§Ã£o.',
    summary:
      'Instala uma IA de atendimento com contexto customizado, valida a fila e exige homologaÃ§Ã£o antes da produÃ§Ã£o.',
    endpoint: `${endpointBase}${templates.atendimento.endpoint || ''}`,
    highlights: [
      'Depende da revisÃ£o do contexto antes da instalaÃ§Ã£o.',
      'Pode ser usada em fluxos sem ERP especÃ­fico.',
      'TambÃ©m exige validaÃ§Ã£o da API key da fila.',
    ],
    steps: [],
    requestFields: [],
    installedTemplates: [],
    payloadExample: '',
    checklist: [
      'Gerar e armazenar a OPENAI_API_KEY antes de provisionar o ambiente.',
      'Revisar o contexto da IA.',
      'Validar API key da fila.',
      'Homologar antes da produÃ§Ã£o.',
    ],
    links: [
      { label: 'Visão geral das IAs', path: '/main/docs/ias' },
      { label: 'IA Alpha 7', path: '/main/docs/ias/alpha7' },
      { label: 'IA Vannon', path: '/main/docs/ias/vannon' },
    ],
  },
};
