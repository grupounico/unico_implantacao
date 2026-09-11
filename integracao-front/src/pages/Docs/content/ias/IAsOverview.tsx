import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PageHeader,
  ParamsTable,
  Callout,
  CodeBlock,
} from '../../components/DocsComponents'
import { commonIaRequestFields, iaDocOrder, iaDocs } from './iaDocs'

const IAsOverview: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div>
      <PageHeader
        badge="IAs"
        title="Agentes de IA"
        description="Fluxos de implantação, campos de instalação e checkpoints operacionais dos modelos de IA do painel interno."
      />

      <Callout type="info" title="Como esta seção foi organizada">
        Cada página de IA descreve o processo operacional do zero, com foco em implantação,
        validação da fila e homologação. O objetivo aqui não é detalhar o back-end, e sim o fluxo de operação.
      </Callout>

      <h2>Fluxo operacional comum</h2>
      <ol>
        <li>Solicite ou valide com o cliente as credenciais, tokens e liberações necessárias.</li>
        <li>Confirme internamente se o processo está liberado para seguir.</li>
        <li>Gere e armazene a <code>OPENAI_API_KEY</code> antes de criar o serviço ou instalar a IA.</li>
        <li>Acesse o card da IA correspondente e preencha os campos da instalação.</li>
        <li>Valide a API key global e confira se a fila possui a chave correta.</li>
        <li>Faça a homologação antes de liberar o fluxo em produção.</li>
      </ol>

      <h2>Pré-requisito comum: OpenAI API Key</h2>
      <p>
        Todas as implantações de IA devem orientar a geração da chave da OpenAI antes da criação do serviço
        ou da configuração final do assistente.
      </p>
      <ol>
        <li>Acesse <code>https://platform.openai.com/</code>.</li>
        <li>Faça login ou crie uma conta usando Google, Microsoft ou e-mail e senha.</li>
        <li>Entre em <code>https://platform.openai.com/api-keys</code> ou clique no perfil e depois em <code>View API keys</code>.</li>
        <li>Clique em <code>Create new secret key</code> e dê um nome para a chave.</li>
        <li>Copie o token gerado, no formato <code>sk-...</code>, e salve em local seguro.</li>
      </ol>

      <Callout type="warning" title="Uso obrigatório com segurança">
        <ul style={{ margin: 0, paddingLeft: '18px' }}>
          <li>A chave aparece apenas uma vez.</li>
          <li>Armazene a <code>OPENAI_API_KEY</code> em local seguro, como no arquivo <code>.env</code>.</li>
          <li>Se houver campo <code>OpenAI API Key</code> na criação do serviço, use a chave gerada antes de prosseguir.</li>
        </ul>
      </Callout>

      <CodeBlock language="dotenv">{`OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx`}</CodeBlock>

      <CodeBlock language="javascript">{`import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});`}</CodeBlock>

      <h2>Campos comuns da tela de instalação</h2>
      <ParamsTable params={commonIaRequestFields} />

      <Callout type="warning" title="Checkpoint obrigatório">
        <ul style={{ margin: 0, paddingLeft: '18px' }}>
          <li>A URL da instância deve ser enviada com <code>https://</code> e sem barra final.</li>
          <li>O código 2FA é obrigatório em todos os modelos documentados aqui.</li>
          <li>Se a fila não tiver API key, ou se a chave estiver diferente da API key global, a IA não funciona corretamente.</li>
        </ul>
      </Callout>

      <h2>Modelos disponíveis</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '14px',
          margin: '0 0 24px',
        }}
      >
        {iaDocOrder.map((key) => {
          const doc = iaDocs[key]
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

export default IAsOverview
