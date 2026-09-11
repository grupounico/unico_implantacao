import React from 'react'
import { PageHeader } from './components/DocsComponents'
import { changelog, type ChangelogEntry } from './changelog.data'

const typeConfig: Record<
  ChangelogEntry['type'],
  { label: string; color: string; bg: string }
> = {
  feature: { label: 'Feature', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  fix: { label: 'Bug Fix', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  breaking: { label: 'Breaking', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  improvement: { label: 'Melhoria', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
}

const Changelog: React.FC = () => {
  return (
    <div>
      <PageHeader
        badge="Changelog"
        title="Novidades"
        description="Histórico de versões e mudanças da API Unico Contato."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {changelog.map((entry) => {
          const config = typeConfig[entry.type]
          return (
            <div key={entry.version} style={{ display: 'flex', gap: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: config.color,
                    flexShrink: 0,
                    marginTop: '4px',
                  }}
                />
                <div
                  style={{
                    width: '1px',
                    flex: 1,
                    background: 'rgba(255,255,255,0.07)',
                  }}
                />
              </div>
              <div style={{ flex: 1, paddingBottom: '8px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '10px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#f1f5f9',
                    }}
                  >
                    {entry.version}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      color: config.color,
                      background: config.bg,
                    }}
                  >
                    {config.label}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#64748b',
                      marginLeft: 'auto',
                    }}
                  >
                    {entry.date}
                  </span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  {entry.items.map((item, index) => (
                    <li
                      key={index}
                      style={{
                        fontSize: '13px',
                        color: '#94a3b8',
                        lineHeight: 1.7,
                      }}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Changelog
