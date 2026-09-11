import React from 'react'
import { Outlet } from 'react-router-dom'
import DocsSidebar from './DocsSidebar'
import './DocsLayout.css'

const DocsLayout: React.FC = () => {
  return (
    <div className="docs-layout">
      <DocsSidebar />
      <main className="docs-main">
        <div className="docs-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default DocsLayout
