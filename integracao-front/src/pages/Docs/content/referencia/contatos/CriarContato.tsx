import React from 'react'
import { Link } from 'react-router-dom'
import {
  PageHeader,
  MethodBadge,
  CodeBlock,
  ParamsTable,
  ResponseTabs,
  Callout,
} from '../../../components/DocsComponents'

const CriarContato: React.FC = () => {
  const bodyParams = [
    { field: 'nome', type: 'string', required: true, description: 'Nome completo do contato.' },
    { field: 'telefone', type: 'string', required: true, description: 'Telefone no formato E.164 (ex: 5511999999999).' },
    { field: 'email', type: 'string', required: false, description: 'Endereço de e-mail do contato.' },
    { field: 'tags', type: 'string[]', required: false, description: 'Lista de tags para categorização.' },
    { field: 'metadata', type: 'object', required: false, description: 'Dados extras em formato chave-valor.' },
  ]

  return (
    <div>
      <PageHeader
        badge="Referência · Contatos"
        title="Criar Contato"
        description="Cria um novo contato na plataforma. O telefone é o identificador único."
      />

      <MethodBadge method="POST" path="/v1/contatos" />

      <Callout type="info">
        Se já existir um contato com o mesmo <code>telefone</code>, a API retorna <code>409 Conflict</code>.
        Use o endpoint de atualização para editar contatos existentes.
      </Callout>

      <h2>Autenticação</h2>
      <p>Bearer Token no header <code>Authorization</code>. Ver <Link to="/main/docs/getting-started/autenticacao">Autenticação</Link>.</p>

      <h2>Headers</h2>
      <table>
        <thead>
          <tr><th>Header</th><th>Valor</th></tr>
        </thead>
        <tbody>
          <tr><td><code>Content-Type</code></td><td><code>application/json</code></td></tr>
          <tr><td><code>Authorization</code></td><td><code>Bearer &#123;token&#125;</code></td></tr>
        </tbody>
      </table>

      <h2>Body</h2>
      <ParamsTable params={bodyParams} />

      <h2>Exemplo de requisição</h2>
      <CodeBlock language="json">{`{
  "nome": "João Silva",
  "telefone": "5511999999999",
  "email": "joao@email.com",
  "tags": ["cliente", "vip"],
  "metadata": {
    "origem": "site",
    "campanha": "black-friday-2026"
  }
}`}</CodeBlock>

      <h2>Respostas</h2>
      <ResponseTabs
        tabs={[
          {
            label: '201 Created',
            language: 'json',
            code: `{
  "id": "ct_abc123xyz",
  "nome": "João Silva",
  "telefone": "5511999999999",
  "email": "joao@email.com",
  "tags": ["cliente", "vip"],
  "metadata": {
    "origem": "site",
    "campanha": "black-friday-2026"
  },
  "criadoEm": "2026-03-27T10:00:00Z",
  "atualizadoEm": "2026-03-27T10:00:00Z"
}`,
          },
          {
            label: '400 Bad Request',
            language: 'json',
            code: `{
  "code": "VALIDATION_ERROR",
  "message": "Campo obrigatório ausente: telefone",
  "field": "telefone"
}`,
          },
          {
            label: '409 Conflict',
            language: 'json',
            code: `{
  "code": "CONTACT_ALREADY_EXISTS",
  "message": "Já existe um contato com o telefone informado.",
  "existingId": "ct_xyz789abc"
}`,
          },
        ]}
      />

      <h2>Ver também</h2>
      <ul>
        <li><Link to="/main/docs/referencia/contatos/listar">Listar Contatos</Link></li>
        <li><Link to="/main/docs/referencia/contatos/atualizar">Atualizar Contato</Link></li>
        <li><Link to="/main/docs/erros">Tabela de erros</Link></li>
      </ul>
    </div>
  )
}

export default CriarContato
