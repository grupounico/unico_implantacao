export interface SidebarItem {
  label: string
  path?: string
  items?: SidebarItem[]
}

const DOCS_BASE = '/main/docs'

export const sidebarConfig: SidebarItem[] = [
  {
    label: 'Introdução',
    path: DOCS_BASE,
  },
  {
    label: 'IAs',
    items: [
      { label: 'Visão Geral', path: `${DOCS_BASE}/ias` },
      { label: 'IA Alpha 7', path: `${DOCS_BASE}/ias/alpha7` },
      { label: 'IA Trier', path: `${DOCS_BASE}/ias/trier` },
      { label: 'IA VTEX', path: `${DOCS_BASE}/ias/vtex` },
      { label: 'IA Vannon', path: `${DOCS_BASE}/ias/vannon` },
      { label: 'IA Vetor', path: `${DOCS_BASE}/ias/vetor` },
      { label: 'IA Atendimento', path: `${DOCS_BASE}/ias/atendimento` },
    ],
  },
  {
    label: 'Extensões',
    items: [
      { label: 'Visão Geral', path: `${DOCS_BASE}/extensoes` },
      { label: 'Extensão Trier', path: `${DOCS_BASE}/extensoes/trier` },
    ],
  },
  {
    label: 'Changelog',
    path: `${DOCS_BASE}/changelog`,
  },
]
