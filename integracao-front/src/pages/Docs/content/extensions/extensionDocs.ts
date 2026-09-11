export interface ExtensionDocDefinition {
  slug: string
  docsPath: string
  title: string
  badge: string
  summary: string
}

export const extensionDocOrder = ['trier'] as const

export type ExtensionDocKey = (typeof extensionDocOrder)[number]

export const extensionDocs: Record<ExtensionDocKey, ExtensionDocDefinition> = {
  trier: {
    slug: 'trier',
    docsPath: '/main/docs/extensoes/trier',
    title: 'Extensão Trier',
    badge: 'Extensões - Trier',
    summary:
      'Geração do ZIP, repasse para a máquina do cliente via AnyDesk, instalação no Google Chrome e homologação básica.',
  },
}
