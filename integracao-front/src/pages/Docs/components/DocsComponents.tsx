import React, { useState } from 'react'
import './DocsComponents.css'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

interface MethodBadgeProps {
  method: HttpMethod
  path: string
}

export const MethodBadge: React.FC<MethodBadgeProps> = ({ method, path }) => (
  <div className="method-badge-wrap">
    <span className={`method-badge method-${method.toLowerCase()}`}>{method}</span>
    <code className="method-path">{path}</code>
  </div>
)

interface CodeBlockProps {
  language?: string
  children: string
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language = 'json', children }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(children.trim())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="code-block">
      <div className="code-block-header">
        <span className="code-block-lang">{language}</span>
        <button className="code-block-copy" onClick={handleCopy}>
          {copied ? '✓ Copiado' : 'Copiar'}
        </button>
      </div>
      <pre className="code-block-pre">
        <code>{children.trim()}</code>
      </pre>
    </div>
  )
}

interface Param {
  field: string
  type: string
  required: boolean
  description: string
}

interface ParamsTableProps {
  params: Param[]
}

export const ParamsTable: React.FC<ParamsTableProps> = ({ params }) => (
  <table className="params-table">
    <thead>
      <tr>
        <th>Campo</th>
        <th>Tipo</th>
        <th>Obrigatório</th>
        <th>Descrição</th>
      </tr>
    </thead>
    <tbody>
      {params.map((p) => (
        <tr key={p.field}>
          <td><code>{p.field}</code></td>
          <td><span className="param-type">{p.type}</span></td>
          <td className="param-required">{p.required ? '✓' : '—'}</td>
          <td>{p.description}</td>
        </tr>
      ))}
    </tbody>
  </table>
)

type CalloutType = 'info' | 'warning' | 'danger' | 'success'

interface CalloutProps {
  type?: CalloutType
  title?: string
  children: React.ReactNode
}

const calloutIcons: Record<CalloutType, string> = {
  info: 'ℹ',
  warning: '⚠',
  danger: '✕',
  success: '✓',
}

export const Callout: React.FC<CalloutProps> = ({ type = 'info', title, children }) => (
  <div className={`callout callout-${type}`}>
    <span className="callout-icon">{calloutIcons[type]}</span>
    <div className="callout-body">
      {title && <p className="callout-title">{title}</p>}
      <div className="callout-content">{children}</div>
    </div>
  </div>
)

interface PageHeaderProps {
  title: string
  description?: string
  badge?: string
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, badge }) => (
  <div className="page-header">
    {badge && <span className="page-header-badge">{badge}</span>}
    <h1>{title}</h1>
    {description && <p className="page-header-description">{description}</p>}
    <div className="page-header-divider" />
  </div>
)

interface ResponseTab {
  label: string
  code: string
  language?: string
}

interface ResponseTabsProps {
  tabs: ResponseTab[]
}

export const ResponseTabs: React.FC<ResponseTabsProps> = ({ tabs }) => {
  const [active, setActive] = useState(0)

  return (
    <div className="response-tabs">
      <div className="response-tabs-header">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            className={`response-tab-btn ${i === active ? 'active' : ''}`}
            onClick={() => setActive(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <CodeBlock language={tabs[active].language}>{tabs[active].code}</CodeBlock>
    </div>
  )
}
