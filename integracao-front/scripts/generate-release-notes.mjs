import fs from 'node:fs/promises'
import path from 'node:path'
import { execFile as execFileCallback } from 'node:child_process'
import { promisify } from 'node:util'

const execFile = promisify(execFileCallback)
const rootDir = process.cwd()
const changelogDataPath = path.join(rootDir, 'src/pages/Docs/changelog.data.ts')
const packageJsonPath = path.join(rootDir, 'package.json')

function getArgValue(flag) {
  const index = process.argv.indexOf(flag)
  if (index === -1) return ''
  return process.argv[index + 1] || ''
}

function hasFlag(flag) {
  return process.argv.includes(flag)
}

function formatDate(date = new Date()) {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

async function getChangedFiles(refRange) {
  try {
    const { stdout } = await execFile(
      'git',
      ['diff', '--name-only', refRange],
      { cwd: rootDir },
    )

    return stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

function inferItemsFromFiles(files) {
  const items = []

  if (files.some((file) => file.includes('src/pages/Docs'))) {
    items.push('Documentação atualizada com as mudanças mais recentes da release.')
  }

  if (
    files.some(
      (file) =>
        file.includes('src/data/templates_ia') ||
        file.includes('src/pages/AiPage') ||
        file.includes('src/services/ai'),
    )
  ) {
    items.push('Fluxos e configurações das IAs foram atualizados no painel administrativo.')
  }

  if (
    files.some(
      (file) =>
        file.includes('src/templates') ||
        file.includes('src/services/aiProviderCatalog') ||
        file.includes('src/controllers/ia.controller'),
    )
  ) {
    items.push('Integrações e templates gerenciados receberam ajustes de estabilidade e compatibilidade.')
  }

  if (
    files.some(
      (file) =>
        file.includes('package.json') ||
        file.includes('package-lock.json') ||
        file.includes('scripts/'),
    )
  ) {
    items.push('Fluxo de release automatizado aprimorado com versionamento e validações antes da publicação.')
  }

  if (items.length === 0) {
    items.push('Melhorias internas e ajustes operacionais nesta versão.')
  }

  return Array.from(new Set(items))
}

function detectReleaseType(items) {
  if (items.some((item) => /corrig|fix|erro|bug/i.test(item))) {
    return 'fix'
  }

  if (items.some((item) => /quebr|breaking/i.test(item))) {
    return 'breaking'
  }

  if (items.some((item) => /automatiz|melhoria|ajuste|estabil/i.test(item))) {
    return 'improvement'
  }

  return 'feature'
}

function buildEntryText({ version, date, type, items }) {
  const itemLines = items.map((item) => `      '${item.replace(/'/g, "\\'")}',`)

  return `  {
    version: 'v${version}',
    date: '${date}',
    type: '${type}',
    items: [
${itemLines.join('\n')}
    ],
  },`
}

async function publishNews({ version, items }) {
  const baseUrl =
    process.env.RELEASE_NEWS_BASE_URL ||
    process.env.VITE_URLBASE ||
    process.env.NEWS_API_BASE_URL ||
    ''

  if (!baseUrl) {
    return { skipped: true, reason: 'NEWS base URL não configurada.' }
  }

  const endpoint = `${baseUrl.replace(/\/+$/, '')}/api/news/create`
  const payload = {
    title: `Release ${version}: atualização do sistema`,
    description: items.join(' '),
    type: 'update',
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Falha ao publicar notícia: ${response.status} ${message}`)
  }

  return response.json()
}

async function main() {
  const version =
    getArgValue('--version') ||
    JSON.parse(await fs.readFile(packageJsonPath, 'utf-8')).version
  const previousVersion = getArgValue('--previous')
  const manualItemsRaw = getArgValue('--items')
  const skipNews = hasFlag('--skip-news')

  const refRange = previousVersion ? `v${previousVersion}..HEAD` : 'HEAD~10..HEAD'
  const changedFiles = await getChangedFiles(refRange)
  const manualItems = manualItemsRaw
    ? manualItemsRaw
        .split('|')
        .map((item) => item.trim())
        .filter(Boolean)
    : []

  const items = manualItems.length > 0 ? manualItems : inferItemsFromFiles(changedFiles)
  const type = detectReleaseType(items)
  const date = formatDate()

  const currentFile = await fs.readFile(changelogDataPath, 'utf-8')
  const anchor = 'export const changelog: ChangelogEntry[] = [\n'
  if (!currentFile.includes(anchor)) {
    throw new Error('Estrutura do changelog não reconhecida.')
  }

  const nextFile = currentFile.replace(
    anchor,
    `${anchor}${buildEntryText({ version, date, type, items })}\n`,
  )

  await fs.writeFile(changelogDataPath, nextFile)

  let newsResult = { skipped: true }
  if (!skipNews) {
    try {
      newsResult = await publishNews({ version, items })
    } catch (error) {
      newsResult = {
        skipped: true,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  process.stdout.write(
    JSON.stringify(
      {
        version,
        previousVersion,
        type,
        items,
        changedFiles,
        newsResult,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
