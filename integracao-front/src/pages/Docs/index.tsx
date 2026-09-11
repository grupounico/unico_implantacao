import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader, Callout } from './components/DocsComponents'

const DocsIntro: React.FC = () => {
  const navigate = useNavigate()

  const cards = [
    {
      icon: 'AI',
      title: 'Agentes de IA',
      description: 'Consulte os fluxos operacionais e os campos usados na implantação das IAs.',
      path: '/main/docs/ias',
    },
    {
      icon: 'EXT',
      title: 'Extensões',
      description: 'Veja os processos de geração, instalação no navegador e homologação das extensões.',
      path: '/main/docs/extensoes',
    },
    {
      icon: 'LOG',
      title: 'Changelog',
      description: 'Acompanhe mudanças recentes e versões publicadas.',
      path: '/main/docs/changelog',
    },
  ]

  return (
    <div>
      <PageHeader
        badge="Documentação"
        title="API Unico Contato"
        description="Bem-vindo à documentação oficial da Unico Contato. Aqui você encontra changelog e fluxos operacionais de IAs e extensões."
      />

      <Callout type="info" title="Versão atual: v1">
        Esta documentação cobre a versão estável v1 da API. Para mudanças recentes, consulte o{' '}
        <Link to="/main/docs/changelog">Changelog</Link>.
      </Callout>

      <h2>Por onde começar?</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          margin: '0 0 32px',
        }}
      >
        {cards.map((card) => (
          <button
            key={card.title}
            onClick={() => navigate(card.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '8px',
              padding: '16px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
              e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', color: '#3b82f6' }}>
              {card.icon}
            </span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>{card.title}</span>
            <span style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>{card.description}</span>
          </button>
        ))}
      </div>

      <h2>Visão geral</h2>
      <p>
        A documentação concentra os fluxos internos de provisionamento, operação e implantação dos módulos
        internos. As páginas estão separadas por categoria para evitar confusão entre IAs e extensões.
      </p>

      <h3>URLs Base</h3>
      <table>
        <thead>
          <tr>
            <th>Ambiente</th>
            <th>URL</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Produção</td>
            <td><code>https://api.unicocontato.com.br/v1</code></td>
          </tr>
          <tr>
            <td>Sandbox</td>
            <td><code>https://sandbox-api.unicocontato.com.br/v1</code></td>
          </tr>
        </tbody>
      </table>

      <h3>Formato das respostas</h3>
      <p>
        Todas as respostas são retornadas em JSON. Datas seguem o formato <code>ISO 8601</code>.
      </p>
    </div>
  )
}

export default DocsIntro
