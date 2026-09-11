import React from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, Callout } from '../../components/DocsComponents'
import { extensionDocOrder, extensionDocs } from './extensionDocs'

const ExtensionsOverview: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div>
      <PageHeader
        badge="Extensões"
        title="Extensões"
        description="Fluxos operacionais de geração, instalação e validação das extensões disponibilizadas no painel interno."
      />

      <Callout type="info" title="Como esta seção foi organizada">
        Cada página de extensão descreve o processo completo: dados necessários, geração do pacote,
        instalação no navegador e roteiro de teste após a implantação.
      </Callout>

      <h2>Fluxo operacional comum</h2>
      <ol>
        <li>Receba do cliente a URL correta da instância e os dados exigidos pela extensão.</li>
        <li>Gere o pacote final no módulo correspondente dentro de Serviços.</li>
        <li>Baixe o arquivo final e faça o repasse para a máquina do cliente.</li>
        <li>Instale no navegador conforme o passo a passo documentado.</li>
        <li>Homologue o login, a operação principal e o envio final antes de encerrar.</li>
      </ol>

      <Callout type="warning" title="Ponto de atenção">
        Extensão e IA não são o mesmo fluxo. Se a solicitação for de navegador, instalação no Chrome,
        ZIP ou extensão descompactada, use esta seção e não a documentação de IAs.
      </Callout>

      <h2>Extensões disponíveis</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '14px',
          margin: '0 0 24px',
        }}
      >
        {extensionDocOrder.map((key) => {
          const doc = extensionDocs[key]
          return (
            <button
              key={doc.slug}
              onClick={() => navigate(doc.docsPath)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '18px',
                background: 'var(--docs-surface-soft)',
                border: '1px solid var(--docs-border)',
                borderRadius: '10px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.15s, background 0.15s, transform 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--docs-surface-muted)'
                e.currentTarget.style.borderColor = 'var(--docs-accent-border)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--docs-surface-soft)'
                e.currentTarget.style.borderColor = 'var(--docs-border)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--docs-accent)',
                }}
              >
                {doc.badge}
              </span>
              <span style={{ fontSize: '22px', fontWeight: 700, color: 'var(--docs-text)', lineHeight: 1.1 }}>
                {doc.title}
              </span>
              <span style={{ fontSize: '14px', color: 'var(--docs-text-secondary)', lineHeight: 1.65 }}>
                {doc.summary}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ExtensionsOverview
