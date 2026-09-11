// src/data/templates_ia.ts
/* eslint-disable no-useless-escape */

export const templates = {
  vannon2: {
    key: 'vannon2',
    name: 'IA - Vannon 2.0',
    type: 'assistente',
    version: '1.0',
    contextMode: 'hidden' as const,
    description: 'IA Vannon 2.0 com busca de produtos, transferência humana e URA AB integrada.',
    banner: '/vannon1.png',
    endpoint: '/vannon2',
    fields: [
      { key: 'clientName', label: 'Nome da loja', type: 'text', placeholder: 'Farmácia X', width: 'half' as const },
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Sua chave de API', width: 'half' as const },
      { key: 'clientEndpoint', label: 'Endpoint do e-commerce', type: 'text', placeholder: 'Ex: farmaciax', width: 'half' as const },
      { key: 'cepLoja', label: 'CEP da loja', type: 'number', placeholder: 'Ex: 12345678', width: 'half' as const },
    ],
  },
  trier2: {
    key: 'trier2',
    name: 'IA - Trier 2.0',
    type: 'assistente',
    version: '1.0',
    contextMode: 'hidden' as const,
    description: 'IA Trier 2.0 com consulta, envio de produtos e URA integrados.',
    banner: '/trier.jpg',
    endpoint: '/trier2',
    fields: [
      { key: 'nome_cliente', label: 'Nome da loja', type: 'text', placeholder: 'Farmacia X', width: 'half' as const },
      { key: 'apiKey', label: 'API Key Global', type: 'password', placeholder: 'Sua chave de API', width: 'half' as const },
      { key: 'trierToken', label: 'Token Trier', type: 'password', placeholder: 'Token da integracao Trier', width: 'half' as const },
      { key: 'quantidade_de_produtos', label: 'Quantidade de produtos', type: 'number', placeholder: 'Padrao 3, maximo 7', width: 'half' as const },
    ],
  },

  alpha2: {
    key: 'alpha2',
    name: 'IA - Alpha 2.0',
    type: 'assistente',
    version: '1.0',
    contextMode: 'hidden' as const,
    description: 'IA Alpha 2.0 com consulta de produtos, envio de itens e fluxos URA integrados.',
    banner: '/Alpha.png',
    endpoint: '/alpha2',
    fields: [
      { key: 'nome_cliente', label: 'Nome do Cliente (Loja)', type: 'text', placeholder: 'Farmacia X', width: 'half' as const },
      { key: 'apiKey', label: 'API Key Global do Sistema', type: 'password', placeholder: 'Sua chave de API', width: 'half' as const },
      { key: 'alphaToken', label: 'Token Alpha 7', type: 'password', placeholder: 'Token de autenticacao Alpha 7', width: 'half' as const },
      { key: 'unidade_negocio', label: 'Unidade de negocio (ID)', type: 'text', placeholder: 'Ex: 74579', width: 'half' as const },
      { key: 'quantidade_de_produtos', label: 'Quantidade de produtos', type: 'number', placeholder: 'Padrao 3, maximo 7', width: 'half' as const },
    ],
  },

  alpha7: {
    key: 'alpha7',
    name: 'IA - Alpha 7',
    type: 'assistente',
    version: '1.3',
    contextMode: 'hidden' as const,
    description:
      'Agente inteligente capaz de processar linguagem natural e conectar-se ao seu banco de dados Alpha 7.',
    banner: '/Alpha.png',
    endpoint: '/alpha',
    fields: [
      { 
        key: 'nome_cliente', 
        label: 'Nome do Cliente (Loja)', 
        type: 'text', 
        placeholder: 'Farmácia x', 
        width: 'half' as const 
      },
      { 
        key: 'apiKey', 
        label: 'API Key Global do Sistema', 
        type: 'password', 
        placeholder: 'Sua chave de API', 
        width: 'half' as const 
      },
      { 
        key: 'porta_cliente', 
        label: 'Porta da API', 
        type: 'text', 
        placeholder: 'Ex: 5235', 
        width: 'half' as const 
      },
      { 
        key: 'unidade_negocio', 
        label: 'Unidade de negócio (ID)', 
        type: 'text', 
        placeholder: 'Ex: 74579', 
        width: 'half' as const 
      },
      {
        key: 'quantidade_de_produtos',
        label: 'Quantidade de produtos',
        type: 'number',
        placeholder: 'Padrao 3, maximo 7',
        width: 'half' as const
      }
    ]
  },

  trier: {
    key: 'trier',
    name: 'IA - Trier',
    type: 'assistente',
    version: '1.0',
    contextMode: 'hidden' as const,
    description:
      'Agente inteligente capaz de processar linguagem natural e conectar-se com a Trier.',
    banner: '/trier.jpg',
    endpoint: '/trier',
    fields: [
      {
        key: 'nomeCliente',
        label: 'Nome da loja',
        type: 'text',
        placeholder: 'Farmacia X',
        width: 'half' as const
      },
      {
        key: 'porta_cliente',
        label: 'Porta da API',
        type: 'text',
        placeholder: 'Ex: 5235',
        width: 'half' as const
      },
      {
        key: 'apiKey',
        label: 'API Key Global',
        type: 'password',
        placeholder: 'Sua chave de API',
        width: 'full' as const
      },
    ]
  },

  vtex: {
    key: 'vtex',
    name: 'IA - VTEX',
    type: 'assistente',
    version: '1.1',
    contextMode: 'hidden' as const,
    description:
      'Agente inteligente capaz de processar linguagem natural e conectar-se com a VTEX.',
    banner: '/vtex.png',
    endpoint: '/vtex',
    fields: [
      {
        key: 'nomeCliente',
        label: 'Nome da loja',
        type: 'text',
        placeholder: 'Farmacia X',
        width: 'half' as const
      },
      {
        key: 'url_vtex_variable',
        label: 'Endpoint do e-commerce VTEX',
        type: 'text',
        placeholder: 'Ex: natusfarma',
        width: 'half' as const
      },
      {
        key: 'vtex_app_key_variable',
        label: 'VTEX App Key',
        type: 'password',
        placeholder: 'Sua app key VTEX',
        width: 'half' as const
      },
      {
        key: 'vtex_app_token_variable',
        label: 'VTEX App Token',
        type: 'password',
        placeholder: 'Seu app token VTEX',
        width: 'half' as const
      },
      {
        key: 'apiKey',
        label: 'API Key Global',
        type: 'password',
        placeholder: 'Sua chave de API',
        width: 'half' as const
      },
      {
        key: 'quantidade_de_produtos',
        label: 'Quantidade de produtos',
        type: 'number',
        placeholder: 'Padrao 3, maximo 7',
        width: 'half' as const
      },
    ]
  },

  vannon: {
    key: 'vannon',
    name: 'IA - Vannon',
    type: 'assistente',
    version: '1.3',
    contextMode: 'hidden' as const,
    description:
      'Agente inteligente capaz de processar linguagem natural e conectar-se com a Vannon.',
    banner: '/vannon1.png',
    endpoint: '/vannon',
    fields: [
      { 
        key: 'clientName', 
        label: 'Nome da loja', 
        type: 'text', 
        placeholder: 'Farmacia X', 
        width: 'half' as const 
      },
      { 
        key: 'apiKey', 
        label: 'API Key', 
        type: 'password', 
        placeholder: 'Sua chave de API', 
        width: 'half' as const 
      },
      { 
        key: 'clientEndpoint', 
        label: 'Endpoint do E-commerce', 
        type: 'text', 
        placeholder: 'Ex: farmaciax', 
        width: 'half' as const 
      },
      { 
        key: 'cepLoja', 
        label: 'CEP da loja', 
        type: 'number', 
        placeholder: 'Ex: 12345487', 
        width: 'half' as const 
      }
    ]
  },

  vetor: {
    key: 'vetor',
    name: 'IA - Vetor',
    type: 'assistente',
    version: '1.0',
    contextMode: 'hidden' as const,
    description:
      'Agente inteligente capaz de processar linguagem natural e conectar-se com a Vetor.',
    banner: '/vetor.png',
    endpoint: '/vetor',
    fields: [
      { 
        key: 'clientName', 
        label: 'Nome da loja', 
        type: 'text', 
        placeholder: 'Farmacia X', 
        width: 'half' as const 
      },
      { 
        key: 'apiKey', 
        label: 'API Key', 
        type: 'password', 
        placeholder: 'Sua chave de API', 
        width: 'half' as const 
      },
      { 
        key: 'vetorToken', 
        label: 'Token Vetor', 
        type: 'text', 
        placeholder: 'AgAAAGmNu9AtfU9...', 
        width: 'half' as const 
      },
      {
        key: 'unidade_negocio_vetor',
        label: 'Unidade de negocio Vetor',
        type: 'text',
        placeholder: 'Ex: 12345',
        width: 'half' as const
      }
    ]
  },

  atendimento: {
    key: 'ia_atendimento',
    name: 'IA - Atendimento',
    type: 'assistente',
    version: '1.0',
    contextMode: 'editable' as const,
    banner: '/unico.png',
    context: 'Você é o assistente HUMANO da [NOME DA DROGARIA];\n\nNome Fantasia: [NOME FANTASIA];\nCNPJ: [CNPJ]\nTelefone de contato: [TELEFONE DE CONTATO];\nEndereço: Praça Juquinha Moreira, 65 - Centro - Porto Firme - MG;\n\nHorários de funcionamento:\n- [HOARIOS DE FUNCIONAMENTO];\n\nIMPORTANTE: Nunca, em hipótese alguma, dê a entender que você é uma IA. Quando for transferir, apenas transfira para o marcador de saída atendente, sem explicações.\n\nOBJETIVO PRINCIPAL:\nRealizar o atendimento inicial com cordialidade e eficiência, coletando todas as informações necessárias para transferir para um atendente.\n\nINFORMAÇÕES OBRIGATÓRIAS A COLETAR (uma por vez):\n- Produtos desejados (nome e quantidade)\n- Verificar se precisa de mais algum produto\n- Nome do cliente\n- Endereço de entrega (rua, número, bairro e complemento, se houver)\n- Método de entrega (Entrega em domicílio ou Retirada na loja)\n- Método de pagamento (Dinheiro, Cartão de débito, Cartão de crédito, PIX ou Outros)\n\nINFORMAÇÕES IMPORTANTES:\n- Transferir para atendente em todo caso de solicitação de preço ou disponibilidade\n- Não informar obrigatoriedade de receita; caso perguntado, apenas transferir\n- Quando um medicamento for informado sem o miligrama, solicitar essa informação ao cliente\n\nINSTRUÇÕES DE COMPORTAMENTO:\nSeja cordial, profissional e empático, com respostas objetivas e amigáveis, imitando um atendente humano educado e simpático.\nUtilize linguagem clara, acessível e pode usar emojis para tornar a conversa mais agradável.\n\nFLUXO DE ATENDIMENTO:\nCumprimente o cliente de forma calorosa.\nPergunte como pode ajudar.\nColete as informações de forma natural e conversacional, evitando parecer um formulário.\nSempre confirme cada informação antes de avançar.\nVerifique se o horário solicitado está dentro do funcionamento da loja.\nAo final, apresente um resumo completo do pedido.\nPeça um instante e informe que irá retornar em breve.\n\nFORMATO DE RESPOSTA FINAL:\n📋 RESUMO DO PEDIDO\n👤 Cliente: [Nome]\n📦 Produtos: [Lista com quantidades]\n📍 Endereço: [Endereço completo]\n🚚 Entrega: [Delivery ou Retirada]\n💳 Pagamento: [Método]\n\nApós apresentar o resumo, aguarde a confirmação e transfira para o marcador de saída atendente.\n\nRESTRIÇÕES:\n- NÃO invente preços ou disponibilidade\n- NÃO finalize vendas ou aceite pagamentos\n- NÃO forneça orientações médicas ou recomende medicamentos\n- NÃO colete dados sensíveis como cartão ou informações bancárias\n- NÃO trave o atendimento; em qualquer dúvida, transfira para o marcador de saída \"atendente\"\n\nGATILHOS DE TRANSFERÊNCIA PARA ATENDENTE:\nQuero encomendar\nEncomendei\nMinha encomenda chegou\nPreço de produto\nSe a drogaria possui o produto em estoque\n\nLembre-se: Seu papel é apenas facilitar o atendimento inicial. A finalização da compra será sempre realizada por um atendente humano.',
    description: 'Agente inteligente para atendimento ao cliente, capaz de processar imagens e linguagem natural.',
    endpoint: '',
    fields: [],
  },
};
