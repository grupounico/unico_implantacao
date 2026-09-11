import { execFile as execFileCallback } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs/promises'
import path from 'node:path'

const execFile = promisify(execFileCallback)
const rootDir = process.cwd()
const packageJsonPath = path.join(rootDir, 'package.json')
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

function getArgValue(flag) {
  const index = process.argv.indexOf(flag)
  if (index === -1) return ''
  return process.argv[index + 1] || ''
}

function hasFlag(flag) {
  return process.argv.includes(flag)
}

async function run(command, args, options = {}) {
  const shouldUseShell =
    process.platform === 'win32' && /\.cmd$/i.test(command)

  const result = await execFile(command, args, {
    cwd: rootDir,
    windowsHide: true,
    shell: shouldUseShell,
    ...options,
  })

  return result
}

async function readVersion() {
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
  return packageJson.version
}

async function ensureGitReady() {
  await run('git', ['rev-parse', '--is-inside-work-tree'])

  if (!hasFlag('--allow-dirty')) {
    const { stdout } = await run('git', ['status', '--porcelain'])
    if (stdout.trim()) {
      throw new Error(
        'Existem alterações não commitadas no front. Use --allow-dirty se quiser ignorar essa checagem.',
      )
    }
  }
}

async function commitAndTag(version) {
  await run('git', ['add', 'package.json', 'package-lock.json', 'src/pages/Docs/changelog.data.ts'])
  await run('git', ['commit', '-m', `chore(release): v${version}`])
  await run('git', ['tag', `v${version}`])
}

async function pushRelease(version) {
  await run('git', ['push'])
  await run('git', ['push', 'origin', `v${version}`])
}

async function main() {
  const level = getArgValue('--level') || 'patch'
  const shouldPush = hasFlag('--push')
  const skipNews = hasFlag('--skip-news')
  const skipLint = hasFlag('--skip-lint')
  const skipBuild = hasFlag('--skip-build')
  const manualItems = getArgValue('--items')

  if (!['patch', 'minor', 'major'].includes(level)) {
    throw new Error('Use --level patch, minor ou major.')
  }

  await ensureGitReady()

  const previousVersion = await readVersion()

  if (!skipLint) {
    await run(npmCommand, ['run', 'lint'])
  }

  if (!skipBuild) {
    await run(npmCommand, ['run', 'build'])
  }

  await run(npmCommand, ['version', level, '--no-git-tag-version'])
  await run(npmCommand, ['install', '--package-lock-only'])

  const nextVersion = await readVersion()

  const releaseNotesArgs = [
    'scripts/generate-release-notes.mjs',
    '--version',
    nextVersion,
    '--previous',
    previousVersion,
  ]

  if (skipNews) {
    releaseNotesArgs.push('--skip-news')
  }

  if (manualItems) {
    releaseNotesArgs.push('--items', manualItems)
  }

  const notesResult = await run('node', releaseNotesArgs)
  if (notesResult.stdout.trim()) {
    console.log(notesResult.stdout.trim())
  }

  if (!skipBuild) {
    await run(npmCommand, ['run', 'build'])
  }

  await commitAndTag(nextVersion)

  if (shouldPush) {
    await pushRelease(nextVersion)
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        previousVersion,
        nextVersion,
        pushed: shouldPush,
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
