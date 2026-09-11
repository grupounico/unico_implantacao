export interface ChangelogEntry {
  version: string
  date: string
  type: 'feature' | 'fix' | 'breaking' | 'improvement'
  items: string[]
}

export const changelog: ChangelogEntry[] = [
  {
    version: 'v1.4.1',
    date: '26 May 2026',
    type: 'improvement',
    items: [
      'Melhorias internas e ajustes operacionais nesta versão.',
    ],
  },
  {
    version: 'v1.4.0',
    date: '26 May 2026',
    type: 'improvement',
    items: [
      'A instalação da IA VTEX agora aceita o endpoint puro da loja, o domínio VTEX ou a URL pública do e-commerce e normaliza automaticamente para o formato vtexcommercestable.',
      'A documentação da VTEX foi atualizada com o fluxo correto para gerar App Key e App Token no Admin VTEX.',
      'A tela Workspace de Templates da IA teve correções de textos com acentuação e estabilidade de renderização.',
      'Novos scripts de release foram adicionados no front para automatizar versionamento e build.',
    ],
  },
  {
    version: 'v1.2.0',
    date: '27 Mar 2026',
    type: 'feature',
    items: [
      'Adicionado suporte a metadata nos contatos',
      'Novo endpoint GET /v1/contatos/:id/historico',
      'Filtro por tags na listagem de contatos',
    ],
  },
  {
    version: 'v1.1.1',
    date: '10 Mar 2026',
    type: 'fix',
    items: [
      'Corrigido bug no campo telefone para números internacionais',
      'Melhorada mensagem de erro no 409 Conflict',
    ],
  },
  {
    version: 'v1.1.0',
    date: '01 Mar 2026',
    type: 'improvement',
    items: [
      'Rate limit aumentado para 1000 req/min no plano Pro',
      'Respostas de listagem agora incluem paginação via cursor',
      'Header X-Request-Id adicionado em todas as respostas',
    ],
  },
  {
    version: 'v1.0.0',
    date: '01 Jan 2026',
    type: 'feature',
    items: [
      'Lançamento da API v1',
      'Endpoints de Contatos, Mensagens e Webhooks',
      'Autenticação via Bearer Token',
    ],
  },
]
