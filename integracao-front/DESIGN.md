---
name: UnicoIntegra — Painel de Integração Banco Único
description: Console interno de operação para rodar, acompanhar e auditar importações de catálogo (Trier API, arquivo JSON, banco Alpha7).
colors:
  primary: "#145efc"
  primary-foreground: "oklch(0.95 0 0)"
  background: "#ffffff"
  foreground: "oklch(0.17 0.02 265)"
  border: "oklch(0.85 0 0)"
  success: "#059669"
  warning: "#d97706"
  danger: "#e11d48"
  info: "#0369a1"
  console-bg: "#050816"
  console-surface: "#111827"
  console-chrome: "#030712"
  console-border: "#1f2937"
typography:
  body:
    fontFamily: "Poppins, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  title:
    fontFamily: "Poppins, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  label:
    fontFamily: "Poppins, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  input-text:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  status-badge:
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
---

# Design System: UnicoIntegra — Painel de Integração Banco Único

## 1. Overview

**Creative North Star: "A Sala de Controle"**

Um operador olha pra essa tela enquanto uma importação de catálogo roda ao vivo: precisa saber, num relance, se está tudo indo bem, onde travou e por quê. O sistema é desenhado pra esse momento — não pra impressionar num screenshot de landing page. Um único sinal de cor (azul `#145efc`) marca ação e estado ativo; o resto é chrome neutro que não disputa atenção com o dado. O console de log em terminal escuro é a peça central da sala de controle — é onde o operador realmente diagnostica um erro — e é o único lugar que se comporta como um objeto físico com profundidade própria.

Rejeita explicitamente o "template de SaaS genérico" citado no PRODUCT.md: nada de grade de cards idênticos, nada de sombra decorativa em toda superfície, nada de badge colorido sem função. Também rejeita o extremo oposto (tabela crua, sem hierarquia, densidade tipo phpMyAdmin). Hierarquia vem de tipografia, divisores e espaçamento — não de empilhar cards.

**Key Characteristics:**
- Flat por padrão: borda de 1px substitui sombra na quase totalidade da interface.
- Um acento só (`primary`), reservado pra ação e estado ativo.
- Densidade tabular assumida — não escondida atrás de cards.
- O console de log é o único elemento com peso visual "de objeto": fundo quase-preto, tipografia mono, leve profundidade.

## 2. Colors

Paleta contida: neutros fazem 90%+ da tela, azul primário aparece só onde há ação ou estado ativo, e as cores de status (verde/âmbar/vermelho) existem só pra codificar estado de item — nunca decoração.

### Primary
- **Sinal Azul** (`#145efc`): ação primária, link, progress bar, ícone/estado ativo. Usado com moderação — se mais de ~10% da tela está azul, é sinal de uso errado.

### Neutral
- **Fundo** (`#ffffff` / `.dark` → `oklch(0.14 0.02 265)`): superfície base.
- **Texto** (`oklch(0.17 0.02 265)`, quase-preto com leve viés azul): usado majoritariamente com opacidade — `/90` título, `/70`–`/60` texto secundário, `/50`–`/45` metadado, `/40`–`/30` auxiliar apagado. Nunca cinza genérico solto: sempre uma fração do próprio `foreground`.
- **Borda** (`oklch(0.85 0 0)`): único separador visual entre blocos. Faz o trabalho que sombra faria em outro sistema.

### Status (semântico, não decorativo)
- **Sucesso** (`#059669` texto / `#10b981` dot): item publicado, job concluído.
- **Atenção** (`#d97706` texto / `#f59e0b` dot): cancelando, EAN inválido, item pulado.
- **Erro** (`#e11d48` texto / `#f43f5e` dot): falha de classificação ou publicação.
- **Info** (`#0369a1` sobre `#f0f9ff`): aviso operacional não-crítico (ex: origem ainda carregando).

### Console (paleta isolada, só dentro do log)
- **Console BG** (`#050816`): fundo do terminal de log — o único ponto realmente escuro do sistema.
- **Console Chrome** (`#030712` header / `#111827` toolbar / `#1f2937` bordas): moldura do console, imita um terminal real.

### Named Rules
**A Regra do Sinal Único.** Azul primário só em botão de ação, link, item ativo, barra de progresso. Nunca em fundo decorativo, nunca em ícone estático sem função.
**A Regra do Texto Fracionado.** Hierarquia de texto secundário vem de opacidade sobre `foreground` (`/70`, `/50`, `/40`), não de trocar pra um cinza genérico do Tailwind.

## 3. Typography

**Body Font:** Poppins (com fallback `sans-serif`)
**Label/Mono Font:** stack mono do sistema (`ui-monospace, SFMono-Regular, Menlo, monospace`) — só dentro do console de log e valores tabulares (`tabular-nums`).

**Character:** uma família só, carregada em várias variações de peso — profissional e neutra, sem tentar ter personalidade própria. A voz vem do conteúdo (status, número, log), não da fonte.

### Hierarchy
- **Title** (600, 14–16px, 1.4): título de card/seção, cabeçalho de página.
- **Body** (400, 14px, 1.5): texto padrão, valor de tabela, descrição.
- **Label** (500, 12px, 1.4): rótulo de campo, texto de badge, cabeçalho de coluna de tabela.
- **Mono** (400, 13px, 1.6): linha de log, EAN, contadores tabulares (`tabular-nums`) — qualquer número que precise alinhar verticalmente.

### Named Rules
**A Regra do Número Alinhado.** Todo número que aparece em sequência vertical (contador, progresso, paginação) usa `tabular-nums`. Números que "dançam" de largura quebram a leitura rápida de operador.

## 4. Elevation

Flat por padrão. Cor de fundo + borda de 1px resolvem 95% dos casos de separação visual — não sombra. Isso é uma correção deliberada em relação ao que existe hoje: o console de log e alguns modais carregam sombra decorativa (`shadow-xl`, `shadow-[0_20px_60px_rgba(0,0,0,0.28)]`) que deve ser podada. Sombra sobra só onde existe uma razão real de empilhamento (um modal por cima do conteúdo, o popover de um dropdown) — nunca como enfeite de card.

### Shadow Vocabulary
- **Overlay** (`0 8px 24px rgba(0,0,0,0.12)`): único uso legítimo de sombra — modal/dialog flutuando sobre a página. Substitui o `shadow-xl` genérico atual.

### Named Rules
**A Regra Flat-Por-Padrão.** Se dá pra resolver com borda de 1px + fundo, sombra não entra. Sombra existe só pra comunicar "isso está literalmente por cima de outra coisa" — nunca pra dar profundidade decorativa a um card em repouso.
**A Regra Anti-Empilhamento de Cards.** Não aninhar card dentro de card. Uma seção de página é: título + divisor + conteúdo — não um card contendo outro card contendo outro. Onde hoje existe card só pra separar bloco de conteúdo (funil, metadados, tabela), o divisor (`border-t`) e o espaçamento fazem o mesmo trabalho sem a caixa.

## 5. Components

### Buttons
- **Shape:** raio pequeno e consistente (8px / `rounded-lg`), nunca pill em botão de ação.
- **Primary:** fundo `#145efc`, texto branco, padding `8px 16px`, peso semibold.
- **Secondary / Ghost:** sem fundo, borda `border`, texto `foreground/70`; hover troca pra `foreground/5` de fundo — nunca sombra no hover.
- **Danger:** mesma forma do primary, fundo `#e11d48`. Reservado pra ação destrutiva (cancelar, excluir).
- **Disabled:** opacidade `0.4`–`0.5`, sem trocar cor base.

### Status Badge
- Ponto de 6px (`h-1.5 w-1.5 rounded-full`) + label em `Label` type, cor emparelhada (dot e texto do mesmo tom semântico). Sem fundo, sem borda — o ponto colorido já é o suficiente pra escanear uma coluna inteira de status.

### Tables
- **Estilo:** sem sombra, sem zebra colorida. Cabeçalho em `Label` type sobre `foreground/45`, linhas separadas por `divide-y` de `border`, hover de linha em `foreground/[0.02]` — quase imperceptível, só uma pista de que a linha é clicável/hoverable.
- **Densidade:** assumida. Uma tabela de operação não precisa de padding generoso pra parecer "premium"; padding de `12px`–`14px` por célula é suficiente.

### Inputs / Fields
- **Style:** borda `border`, fundo `foreground/[0.02]` em repouso, raio 8px.
- **Focus:** borda vira `primary` + anel de foco de 1px na mesma cor — sem glow, sem sombra.

### Progress Bar
- Trilha em `foreground/[0.06]`, preenchimento sólido `primary`, altura ~10px, canto totalmente arredondado (`rounded-full`). Transição só em `width`.

### Console de Log (componente de assinatura)
O único elemento "físico" do sistema — fundo quase-preto (`#050816`), moldura em `#030712`/`#111827`/`#1f2937`, tipografia mono. Simula um terminal real: prompt `$`, timestamp alinhado (`tabular-nums`), ícone de nível (info/atenção/erro) colorido por status. É onde a sombra sutil de overlay se justifica — é a única superfície do sistema que deveria parecer "por cima" e com peso próprio; todo o resto do sistema fica flat ao redor dele de propósito, pra ele se destacar sem competir com cards.

## 6. Do's and Don'ts

### Do:
- **Do** usar borda de 1px (`border` token) + fundo pra separar blocos de conteúdo.
- **Do** reservar sombra pra overlay real (modal, popover) — nunca pra card em repouso.
- **Do** manter o azul primário (`#145efc`) só em ação/estado ativo — se ele está decorando algo estático, é uso errado.
- **Do** usar `tabular-nums` em todo número que aparece em sequência (progresso, paginação, contador).
- **Do** deixar o console de log ser o único elemento "escuro e pesado" da tela — ele é a exceção deliberada, não o padrão.

### Don't:
- **Don't** empilhar card dentro de card. Nunca.
- **Don't** aplicar `shadow-xl` ou qualquer sombra decorativa em card, painel de métricas ou bloco de metadados — essa é exatamente a "cara de IA" que o produto quer evitar (PRODUCT.md: "template de SaaS genérico... sombra suave em toda superfície").
- **Don't** usar badge de status com fundo colorido saturado; o ponto + texto colorido já resolve.
- **Don't** trocar texto secundário por um cinza genérico do Tailwind (`text-gray-400` solto) — sempre uma fração de opacidade do `foreground`.
- **Don't** usar mais de uma cor de acento decorativa na mesma tela; status (verde/âmbar/vermelho) é semântico, não decoração — e o azul primário nunca compete com eles pelo mesmo espaço.
- **Don't** replicar a densidade "tabela crua" citada como anti-referência no PRODUCT.md — hierarquia via tipografia e espaçamento, não ausência de estilo.
