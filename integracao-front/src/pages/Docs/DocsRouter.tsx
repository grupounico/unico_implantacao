import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import DocsLayout from './components/DocsLayout'
import DocsIntro from './index'
import Autenticacao from './content/getting-started/Autenticacao'
import CriarContato from './content/referencia/contatos/CriarContato'
import IAsOverview from './content/ias/IAsOverview'
import Alpha7Docs from './content/ias/alpha7.mdx'
import TrierDocs from './content/ias/trier.mdx'
import VtexDocs from './content/ias/vtex.mdx'
import VannonDocs from './content/ias/vannon.mdx'
import VetorDocs from './content/ias/vetor.mdx'
import AtendimentoDocs from './content/ias/atendimento.mdx'
import ExtensionsOverview from './content/extensions/ExtensionsOverview'
import TrierExtensionDocs from './content/extensions/trier.mdx'
import Erros from './Erros'
import Changelog from './Changelog'

const DocsRouter: React.FC = () => {
  return (
    <Routes>
      <Route element={<DocsLayout />}>
        <Route index element={<DocsIntro />} />

        <Route path="getting-started/autenticacao" element={<Autenticacao />} />
        <Route
          path="getting-started/ambientes"
          element={<ComingSoon title="Ambientes" />}
        />
        <Route
          path="getting-started/primeiros-passos"
          element={<ComingSoon title="Primeiros Passos" />}
        />

        <Route
          path="conceitos/contatos"
          element={<ComingSoon title="Conceito: Contatos" />}
        />
        <Route
          path="conceitos/conversas"
          element={<ComingSoon title="Conceito: Conversas" />}
        />
        <Route
          path="conceitos/webhooks"
          element={<ComingSoon title="Conceito: Webhooks" />}
        />

        <Route
          path="guias/criar-contato"
          element={<ComingSoon title="Guia: Criar um Contato" />}
        />
        <Route
          path="guias/enviar-mensagem"
          element={<ComingSoon title="Guia: Enviar Mensagem" />}
        />
        <Route
          path="guias/configurar-webhook"
          element={<ComingSoon title="Guia: Configurar Webhook" />}
        />

        <Route path="referencia/contatos/criar" element={<CriarContato />} />
        <Route
          path="referencia/contatos/listar"
          element={<ComingSoon title="Listar Contatos" />}
        />
        <Route
          path="referencia/contatos/atualizar"
          element={<ComingSoon title="Atualizar Contato" />}
        />
        <Route
          path="referencia/contatos/deletar"
          element={<ComingSoon title="Deletar Contato" />}
        />

        <Route
          path="referencia/mensagens/enviar"
          element={<ComingSoon title="Enviar Mensagem" />}
        />
        <Route
          path="referencia/mensagens/listar"
          element={<ComingSoon title="Listar Mensagens" />}
        />

        <Route
          path="referencia/webhooks/criar"
          element={<ComingSoon title="Criar Webhook" />}
        />
        <Route
          path="referencia/webhooks/listar"
          element={<ComingSoon title="Listar Webhooks" />}
        />

        <Route path="ias" element={<IAsOverview />} />
        <Route path="ias/alpha7" element={<Alpha7Docs />} />
        <Route path="ias/trier" element={<TrierDocs />} />
        <Route path="ias/vtex" element={<VtexDocs />} />
        <Route path="ias/vannon" element={<VannonDocs />} />
        <Route path="ias/vetor" element={<VetorDocs />} />
        <Route path="ias/atendimento" element={<AtendimentoDocs />} />

        <Route path="extensoes" element={<ExtensionsOverview />} />
        <Route path="extensoes/trier" element={<TrierExtensionDocs />} />

        <Route path="erros" element={<Erros />} />
        <Route path="changelog" element={<Changelog />} />

        <Route path="*" element={<Navigate to="/main/docs" replace />} />
      </Route>
    </Routes>
  )
}

const ComingSoon: React.FC<{ title: string }> = ({ title }) => (
  <div>
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 0',
        gap: '12px',
        textAlign: 'center',
      }}
    >
      <span style={{ fontSize: '32px' }}>📝</span>
      <h1 style={{ margin: 0, fontSize: '20px', color: '#f1f5f9' }}>{title}</h1>
      <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
        Esta página ainda está sendo documentada.
      </p>
    </div>
  </div>
)

export default DocsRouter
