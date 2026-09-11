import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { sidebarConfig, type SidebarItem } from '../config/sidebar.config'
import './DocsSidebar.css'

interface SidebarNodeProps {
  item: SidebarItem
  depth?: number
}

const SidebarNode: React.FC<SidebarNodeProps> = ({ item, depth = 0 }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const isActive = item.path === location.pathname
  const hasChildren = item.items && item.items.length > 0

  if (hasChildren) {
    return (
      <div className={`sidebar-group depth-${depth}`}>
        <button
          className={`sidebar-group-label ${open ? 'open' : ''}`}
          onClick={() => setOpen(!open)}
        >
          <span className="sidebar-chevron">{open ? '▾' : '▸'}</span>
          {item.label}
        </button>
        {open && (
          <div className="sidebar-group-children">
            {item.items!.map((child) => (
              <SidebarNode key={child.label} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      className={`sidebar-link depth-${depth} ${isActive ? 'active' : ''}`}
      onClick={() => item.path && navigate(item.path)}
    >
      {item.label}
    </button>
  )
}

const DocsSidebar: React.FC = () => {
  return (
    <aside className="docs-sidebar">
      <div className="docs-sidebar-header">
        <span className="docs-sidebar-badge">DOCS</span>
        <h2 className="docs-sidebar-title">Unico Contato</h2>
        <p className="docs-sidebar-subtitle">API + IAs + Extensões</p>
      </div>

      <div className="docs-sidebar-search">
        <input
          type="text"
          placeholder="Buscar na documentação..."
          className="docs-search-input"
        />
      </div>

      <nav className="docs-sidebar-nav">
        {sidebarConfig.map((item) => (
          <SidebarNode key={item.label} item={item} />
        ))}
      </nav>
    </aside>
  )
}

export default DocsSidebar
