import React from 'react'
import { PageHeader } from './components/DocsComponents'

const errors = [
  { status: '400', code: 'VALIDATION_ERROR', description: 'Um ou mais campos enviados são inválidos ou obrigatórios estão ausentes.' },
  { status: '401', code: 'UNAUTHORIZED', description: 'Token de autenticação ausente ou inválido.' },
  { status: '403', code: 'FORBIDDEN', description: 'O token não tem permissão para acessar este recurso.' },
  { status: '404', code: 'NOT_FOUND', description: 'O recurso solicitado não foi encontrado.' },
  { status: '409', code: 'CONTACT_ALREADY_EXISTS', description: 'Já existe um contato com o telefone informado.' },
  { status: '422', code: 'UNPROCESSABLE_ENTITY', description: 'A requisição está bem formada mas não pode ser processada.' },
  { status: '429', code: 'RATE_LIMIT_EXCEEDED', description: 'Limite de requisições atingido. Aguarde antes de tentar novamente.' },
  { status: '500', code: 'INTERNAL_SERVER_ERROR', description: 'Erro interno do servidor. Entre em contato com o suporte.' },
]

const statusColor: Record<string, string> = {
  '2': '#10b981',
  '4': '#f59e0b',
  '5': '#ef4444',
}

const Erros: React.FC = () => {
  return (
    <div>
      <PageHeader
        badge="Referência"
        title="Códigos de Erro"
        description="Todos os erros retornam um objeto JSON com code e message. Use o code para tratamento programático."
      />

      <table>
        <thead>
          <tr>
            <th>Status HTTP</th>
            <th>Código</th>
            <th>Descrição</th>
          </tr>
        </thead>
        <tbody>
          {errors.map((err) => (
            <tr key={err.code}>
              <td>
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: statusColor[err.status[0]] || '#94a3b8',
                  }}
                >
                  {err.status}
                </span>
              </td>
              <td><code>{err.code}</code></td>
              <td>{err.description}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Estrutura do erro</h2>
      <p>Todo erro segue esse formato:</p>
      <pre><code>{`{
  "code": "VALIDATION_ERROR",
  "message": "Descrição legível do erro",
  "field": "campo_com_problema"  // opcional
}`}</code></pre>
    </div>
  )
}

export default Erros
