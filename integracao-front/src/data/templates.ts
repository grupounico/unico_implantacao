// src/data/templates.ts

export const templates = {
 
  alpha7extensao: {
    name: 'Alpha7 - Extensão',
    file: 'Alpha7_orcamento.txt',
    banner: '/Alpha.png',
    type: 'Extensão',
    description: 'Realiza orçamentos com o estoque da loja via extensão.',
    longDescription:
      'Integração que permite realizar orçamentos para clientes diretamente pelo navegador com o mesmo estoque do ERP da Alpha 7, agilizando o atendimento e permitindo o fechamento de vendas de forma mais ágil e sem sair do sistema de atendimento.',
    active: false,
    videoUrl: 'https://drive.google.com/file/d/1BPQhsMIjoMVVbVfvLOHZIWZWFBy4PSnM/preview',
    benefits: [
      'Criação automática de orçamentos',
      'Integração direta com ERP',
      'Atendimento mais rápido',
    ],
    fields: [
      { label: 'Banco de dados do cliente', key: 'Banco' },
      { label: 'Licensa de ativação', key: 'Licensa' },
    ],
    steps: [
  {
    title: 'Recebimento da Solicitação',
    content:
      'Quando o cliente solicitar a integração, solicite as seguintes informações:\n\n- Quantas lojas serão integradas\n- Quais são as lojas\n\nExemplo: Farmácia X – Loja 1'
  },
  {
    title: 'Criação do Banco de Dados',
    content:
      'Crie um banco de dados para o cliente na Aplicação.\n\nAtenção à nomenclatura:\n- Utilize apenas letras minúsculas, números ou underlines \n- Não utilize espaços ou caracteres especiais\n- Utilize o padrão snake_case\n\nExemplo correto: banco_da_drogaria_x'
  },
  {
    title: 'Solicitação de Integração ao Alpha 7',
    content:
      'Preencha os dados abaixo com o nome do banco criado e solicite que o cliente abra um chamado junto ao suporte do Alpha 7:\n\n- Empresa terceira: Unico Contato\n- CNPJ: 42.926.765/0001-05\n- E-mail: unicoprogramacao@gmail.com\n- Tipo: Postgres\n- Banco de dados: NOME_DO_BANCO\n- Host: 145.223.27.100\n- Schema: public\n- Usuário: postgres\n- Senha: Unico@123'
  },
  {
    title: 'Verificação da Sincronização',
    content:
      'Após a confirmação do Alpha 7, acesse o PostgreSQL e valide se as tabelas foram criadas:\n\n- out_embalagem\n- in_pedido\n- in_itempedido\n\nCaminho: Schemas > public > Tables'
  },
  {
    title: 'Validação dos Dados de Estoque',
    content:
      'Abra a tabela out_embalagem e verifique se os produtos estão sendo carregados corretamente.\n\nResultado esperado: lista completa de produtos do estoque do cliente.'
  },
  {
    title: 'Cadastro do Cliente e Configuração',
    content:
      'Acesse o menu "Gestão de Extensões" na plataforma e siga a ordem das abas:\n\n1. Aba "+ Cliente": Cadastre o Nome do Cliente e a URL da Instância.\n2. Aba "+ Config": Crie uma nova configuração vinculando a Instância criada, o Nome do Banco de Dados e o Client Token (Z-API).'
  },
  {
    title: 'Geração da Licença de Acesso',
    content:
      'Ainda na Gestão de Extensões, vá para a aba "+ Licença":\n\n1. Selecione a Instância e a Configuração criadas anteriormente.\n2. Clique em "Gerar Chave de Licença".\n3. Copie a chave gerada na lista de licenças (botão de cópia ao lado da chave oculta).'
  },
  {
    title: 'Instalação e Ativação',
    content:
      'Acesse a Chrome Web Store na máquina do cliente, instale a extensão Alpha 7 e cole a chave de licença copiada.\n\nNota: A licença será vinculada ao ID dessa máquina específica. Você pode monitorar o status "Ativo/Em uso" pelo painel.\n\n Extensão: https://chromewebstore.google.com/detail/alpha-7-extens%C3%A3o/ckhpdjpljgenhbmcglhefmbgnfpnaklb?utm_source=item-share-cb'
  }
]

  },
  
  alpha7: {
    name: 'Alpha7 - Orçamento',
    file: 'Alpha7_orcamento.txt',
    banner: '/Alpha.png',
    type: 'Integração',
    description: 'Busca de orçamentos criados no ERP Alpha 7',
    longDescription:
      'Esta integração utiliza um aplicativo intermediário instalado na infraestrutura do cliente. Ele conecta-se localmente ao banco de dados do Alpha 7 e expõe uma API segura na porta 12537 para que o Unico Contato consulte orçamentos em tempo real.',
    active: true,
    videoUrl: 'https://drive.google.com/file/d/1AinncMo9Wa7CeKP8b8lQxO7U99EZ4Lrj/preview',
    benefits: [
      'Leitura direta do banco de dados',
      'Independe da API nativa do ERP',
      'Resposta em tempo real',
    ],
    fields: [
      { label: 'IP do Cliente', key: 'ip_do_cliente' },
      { label: 'Authorization', key: 'Authorization' },
      { label: 'Nome da empresa', key: 'nome_da_empresa' },
    ],
    steps: [
      {
        title: '1. Envio dos Requisitos Técnicos',
        content: 'Acione o atalho "/Alpha 7 Orçamentos" no chat ou envie a mensagem padrão solicitando: IP Fixo/DNS, liberação da porta 12537, redirecionamento de porta e as credenciais do banco de dados (solicitadas ao suporte Alpha 7).',
        alert: 'Peça que o cliente envie as credenciais do banco via FOTO, nunca em texto.'
      },
      {
        title: '2. Configuração de Rede (Cliente)',
        content: 'O cliente ou TI responsável deve configurar o modem/firewall para encaminhar conexões externas na porta 12537 para o IP local do servidor onde o sistema Alpha 7 roda.'
      },
      {
        title: '3. Geração do Aplicativo',
        content: 'Com as credenciais do banco em mãos, acesse o "Gerador de Pacotes" no sistema interno. Preencha o Host do Banco, Usuário, Senha e Caminho do Banco. Gere e baixe o arquivo .zip.',
      },
      {
        title: '4. Instalação Remota',
        content: 'Acesse o servidor do cliente via AnyDesk. Descompacte o arquivo gerado e execute o instalador/executável "Como Administrador". Certifique-se de que o serviço iniciou corretamente e o Firewall do Windows não está bloqueando o Node.js/Porta 12537.'
      },
      {
        title: '5. Validação e Ativação',
        content: 'No painel do Unico, insira o IP Externo do cliente seguido da porta (ex: http://200.200.200.1:12537) e a chave de acesso gerada. Teste a conexão.'
      }
    ]
  },

  cashback: {
    name: 'Alpha7 - Cashback ativo',
    file: 'alpha7_cashback_ativo.txt',
    description: 'Consulta automática de cashback no Alpha 7.',
    longDescription:
      'Permite consultar em tempo real o saldo de cashback disponível para o cliente diretamente no ERP Alpha 7. Ideal para fidelização e campanhas de retorno.',
    type: 'Integração',
    active: true,
    banner: '/Alpha.png',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    benefits: [
      'Consulta em tempo real',
      'Redução de chamadas manuais',
      'Melhora a experiência do cliente',
    ],
    fields: [{ label: 'IP do Cliente', key: 'client_ip' }],
    steps: [
      {
        title: 'Verifique a conexão com o Alpha 7',
        content: 'Certifique-se de que o ERP Alpha 7 está acessível externamente ou que a VPN está configurada corretamente.'
      },
      {
        title: 'Obtenha o IP do Servidor',
        content: 'Identifique o IP fixo ou DNS onde o serviço do Alpha 7 está rodando.',
        code: 'Ex: 192.168.1.100 ou api.suaempresa.com'
      },
      {
        title: 'Instalação',
        content: 'Insira o IP no campo de configuração ao lado e clique em Instalar.'
      }
    ]
  },

  ifood_notificacao: {
    name: 'Ifood - Notificação de pedidos',
    file: 'ifood.txt',
    banner: '/ifood.png',
    description: 'Receba notificações automáticas de novos pedidos.',
    longDescription:
      'Automação que monitora o polling do iFood e notifica seu sistema (CRM ou WhatsApp) sempre que um novo pedido é realizado ou muda de status.',
    type: 'Integração',
    active: true,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    benefits: [
      'Pedidos em tempo real',
      'Evita perdas de pedidos',
      'Integração oficial iFood',
    ],
    fields: [
      { label: 'ClientId', key: 'ClientId' },
      { label: 'ClientSecret', key: 'ClientSecret' },
    ],
    steps: [
      {
        title: 'Acesse o Portal do Desenvolvedor iFood',
        content: 'Entre na sua conta no iFood Developer Portal.'
      },
      {
        title: 'Crie ou Selecione uma Aplicação',
        content: 'Vá em "Minhas Aplicações". Se não tiver, crie uma nova para obter as credenciais.'
      },
      {
        title: 'Copie as Credenciais',
        content: 'Copie o "ClientId" e o "ClientSecret" disponíveis na aba de autenticação.'
      },
      {
        title: 'Ative a Integração',
        content: 'Insira as credenciais no formulário ao lado e clique em Instalar.'
      }
    ]
  },

  Napp: {
    name: 'Integração NAPP carrinho de compras',
    file: 'integracao_napp.txt',
    banner: '/napp.png',
    description: 'URA com carrinho de compras integrado à NAPP.',
    longDescription:
      'Permite que clientes realizem compras via URA ou Chatbot com produtos sincronizados em tempo real com a plataforma NAPP.',
    type: 'URA',
    active: true,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    benefits: [
      'Carrinho de compras por telefone',
      'Integração com catálogo',
      'Automação de pedidos',
    ],
    fields: [
      { label: 'CNPJ do Cliente', key: 'cnpjCliente' },
      { label: 'Nome da loja', key: 'nomeDaLoja' },
    ],
    steps: [
      {
        title: 'Valide seu cadastro NAPP',
        content: 'Certifique-se de que sua loja está ativa na plataforma NAPP Solutions.'
      },
      {
        title: 'Obtenha o CNPJ',
        content: 'Tenha em mãos o CNPJ cadastrado na conta principal da loja.'
      },
      {
        title: 'Verifique o Nome da Loja',
        content: 'O nome da loja deve ser exatamente igual ao slug utilizado na URL da sua loja NAPP.',
        code: 'Ex: farmacia-central (se a url for napp.com/farmacia-central)'
      },
      {
        title: 'Finalize',
        content: 'Preencha os campos e instale para sincronizar o catálogo.'
      }
    ]
  },

  Cielo: {
    name: 'Link de pagamento - Cielo',
    file: 'link_cielo.txt',
    banner: '/cielo.png',
    description: 'Geração de links de pagamento Cielo.',
    longDescription:
      'Crie links de pagamento Cielo e envie diretamente para seus clientes de forma rápida e segura através do fluxo de conversa.',
    type: 'Integração',
    active: true,
    videoUrl: 'https://drive.google.com/file/d/1aMgPZcpb2XTANBKxlkNTvjiEbs27gYHp/preview',
    benefits: [
      'Pagamentos rápidos',
      'Integração segura',
      'Aceita cartões e Pix',
      'Retorno de pagamento no chat'
    ],
    fields: [
      { label: 'Nome do cliente', key: 'Cliente' },
      { label: 'Basic (ClientId:ClientSecret)', key: 'autenticacao' },
    ],
    steps: [
      {
        title: 'Acesse o Painel Cielo E-commerce',
        content: 'Entre na área de desenvolvedores ou no painel da sua loja Cielo.'
      },
      {
        title: 'Obtenha o Merchant ID e Key',
        content: 'Copie suas credenciais de produção.'
      },
      {
        title: 'Formate a Autenticação',
        content: 'Para o campo Basic, você deve usar o padrão "MerchantId:MerchantKey". Algumas integrações exigem isso codificado em Base64.',
        code: 'MerchantID:MerchantKey'
      },
      {
        title: 'Instalar',
        content: 'Insira o nome de identificação do cliente e a chave de autenticação.'
      }
    ]
  },

  Cielo_webhook: {
    name: 'Cielo Webhook (Notificação)',
    file: 'CieloWebhook.txt',
    banner: '/cielo.png',
    description: 'Notificação automática de status de pagamento.',
    longDescription:
      'Receba eventos de pagamento da Cielo e seja avisado quando o cliente finalizar uma venda.',
    type: 'Automação',
    active: true,
    benefits: [
      'Notificações em tempo real',
      'Automação de status',
      'Integração robusta',
    ],
    fields: [
      { label: 'APIKEY', key: 'clientApiKey' },
      { label: 'Instância do cliente', key: 'clientUrl'},
    ],
    steps: [
      {
        title: 'Configure a Fila (Queue)',
        content: 'Crie ou utilize uma fila no seu sistema do Unico Contato para receber os eventos.'
      },
      {
        title: 'Gere a API Key',
        content: 'Gere uma API Key na fila desejada.'
      },
      {
        title: 'Crie um Webhook para a Fila',
        content: 'Crie um Webhook para recebimento dos status e vincule a fila desejada.'
      },
      {
        title: 'Crie e vincule a automação',
        content: 'Preencha todos os campos necessários e crie a automação no sistema do cliente. Após isso vincule-o no webhook'
      },
      {
        title: 'Ative o webhook na Cielo',
        content: 'Acesse o painel da cielo e vincule o webhook na URL de Retorno e Mudança de Status.'
      },
    ]
  },

  Getnet: {
    name: 'Link de pagamento - Getnet',
    file: 'Integracao_getnet.txt',
    banner: '/getnet.png',
    description: 'Link de pagamento integrado à Getnet.',
    longDescription:
      'Gere links de pagamento Getnet para cobrança rápida e automatizada diretamente pelo chat.',
    type: 'Integração',
    active: true,
    benefits: [
      'Cobrança simplificada',
      'Alta confiabilidade',
      'Integração direta',
    ],
    fields: [{ label: 'Credencial', key: 'credencial' }],
    steps: [
      {
        title: 'Portal do Desenvolvedor Getnet',
        content: 'Acesse sua conta no portal de desenvolvedores da Getnet.'
      },
      {
        title: 'Crie uma Aplicação',
        content: 'Crie uma nova aplicação para obter o Client ID e Client Secret.'
      },
      {
        title: 'Gere o Token/Credencial',
        content: 'A credencial geralmente é a concatenação de "Client_ID:Client_Secret" codificada em Base64.',
        code: 'Basic Y2xpZW50...=='
      },
      {
        title: 'Instale',
        content: 'Cole a credencial gerada no campo correspondente.'
      }
    ]
  },

  Getnet_webhook: {
    name: 'Webhook - Getnet',
    file: 'getnet_Webhook.txt',
    banner: '/getnet.png',
    description: 'Automação de notificações Getnet.',
    longDescription:
      'Receba eventos de pagamento da Getnet e automatize fluxos internos de confirmação.',
    type: 'Automação',
    active: true,
    benefits: [
      'Eventos em tempo real',
      'Menos polling',
      'Automação completa',
    ],
    fields: [
      { label: 'ID da fila', key: 'queueId' },
      { label: 'API Key', key: 'apikey' },
      { label: 'URL da instância', key: 'url' },
    ],
    steps: [
      {
        title: 'Prepare o Receptor',
        content: 'No seu painel, crie uma fila para processar os pagamentos.'
      },
      {
        title: 'Dados de Acesso',
        content: 'Copie o ID da Fila e gere uma API Key válida.'
      },
      {
        title: 'Instale o Webhook',
        content: 'Preencha os dados e clique em Instalar. O sistema configurará a escuta de eventos.'
      }
    ]
  },

  transcricao_de_receitas: {
    name: 'IA - Transcrição de receita',
    file: 'transcricao_de_receita.txt',
    banner: '/unico.png',
    description: 'Transcrição automática de receitas médicas.',
    longDescription:
      'Utiliza modelos avançados de visão computacional (OCR + IA Generativa) para converter imagens ou áudios de receitas médicas manuscritas em texto estruturado.',
    type: 'Ferramenta de IA',
    active: true,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    benefits: [
      'Alta precisão na leitura',
      'Redução de erros de interpretação',
      'Processamento em segundos',
    ],
    fields: [],
    steps: [
      {
        title: 'Sem configuração necessária',
        content: 'Esta é uma ferramenta nativa de IA. Basta clicar em instalar para habilitá-la no seu fluxo.'
      },
      {
        title: 'Como usar',
        content: 'Após instalado, envie uma imagem de receita no fluxo configurado para receber a transcrição.'
      }
    ]
  },
};