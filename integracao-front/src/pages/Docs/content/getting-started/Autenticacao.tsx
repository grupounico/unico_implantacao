import React from 'react'
import { PageHeader, CodeBlock, Callout } from '../../components/DocsComponents'

const Autenticacao: React.FC = () => {
  return (
    <div>
      <PageHeader
        badge="Getting Started"
        title="Autenticação"
        description="A API Unico Contato usa Bearer Token para autenticar todas as requisições."
      />

      <h2>Obtendo seu token</h2>
      <p>
        Acesse o painel da Unico Contato em <strong>Configurações → Integrações → API Keys</strong> e
        gere um novo token. Guarde-o com segurança, ele não será exibido novamente.
      </p>

      <Callout type="warning" title="Segurança">
        Nunca exponha seu token no frontend ou em repositórios públicos. Use variáveis de ambiente.
      </Callout>

      <h2>Usando o token</h2>
      <p>Inclua o token em todas as requisições no header <code>Authorization</code>:</p>

      <CodeBlock language="http">{`GET /v1/contatos HTTP/1.1
Host: api.unicocontato.com.br
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json`}</CodeBlock>

      <h2>Exemplo com cURL</h2>
      <CodeBlock language="bash">{`curl -X GET "https://api.unicocontato.com.br/v1/contatos" \\
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \\
  -H "Content-Type: application/json"`}</CodeBlock>

      <h2>Exemplo com Node.js</h2>
      <CodeBlock language="javascript">{`const response = await fetch('https://api.unicocontato.com.br/v1/contatos', {
  headers: {
    'Authorization': \`Bearer \${process.env.UNICO_API_TOKEN}\`,
    'Content-Type': 'application/json',
  },
})

const data = await response.json()`}</CodeBlock>

      <h2>Erros de autenticação</h2>
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Código</th>
            <th>Descrição</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>401</code></td>
            <td><code>UNAUTHORIZED</code></td>
            <td>Token ausente ou inválido</td>
          </tr>
          <tr>
            <td><code>403</code></td>
            <td><code>FORBIDDEN</code></td>
            <td>Token válido mas sem permissão para o recurso</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default Autenticacao
