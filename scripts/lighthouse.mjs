#!/usr/bin/env node
/**
 * Lighthouse audit runner for Reachy.
 *
 * Wraps the Lighthouse Node CLI (https://github.com/GoogleChrome/lighthouse#using-the-node-cli)
 * and manages everything needed to audit the app locally:
 *
 *   1. Chrome for Testing is auto-downloaded into `.lighthouse/chrome` on first
 *      run (skipped on later runs). Set CHROME_PATH to use your own Chrome.
 *   2. A production build is run and served with `next start` on port 3000
 *      (default) — auditing the dev server gives misleading scores because of
 *      HMR and unminified bundles. `--dev` audits a Next.js dev server on 3000.
 *   3. The Lighthouse CLI audits each route, writing an HTML report (and a JSON
 *      one used for the console summary) to `reports/lighthouse/`.
 *
 * Usage:
 *   npm run lh                       # audit production build, public routes
 *   npm run lh -- --open             # ... and open each report in the browser
 *   npm run lh -- --dev              # audit the running dev server instead
 *   npm run lh -- --no-build         # reuse the existing .next/ without rebuilding
 *   npm run lh -- --desktop          # desktop preset instead of mobile emulation
 *   npm run lh -- --categories=performance,seo
 *   npm run lh -- --url=/login --url=https://deploy-preview-42.vercel.app
 *
 * Note: protected routes (e.g. /dashboard) redirect to /login when audited,
 * because the CLI cannot inject the Supabase localStorage session. The default
 * public routes cover the landing page and login critical path.
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Browser, detectBrowserPlatform, install, resolveBuildId } from '@puppeteer/browsers'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// ---------------------------------------------------------------------------
// CLI arguments
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)

/** Routes to audit when no --url is passed. Public routes only — the CLI can't
 *  set up the Supabase localStorage session needed by protected routes. */
const DEFAULT_ROUTES = ['/', '/login']

const PROD_PORT = 3000 // next start default
const DEV_PORT = 3000  // next dev default

const booleanFlags = new Set(['--dev', '--no-build', '--open', '--desktop', '--help'])
const options = { urls: [] }

for (let i = 0; i < args.length; i++) {
  const arg = args[i]
  const [flag, inlineValue] = splitFlag(arg)
  if (!flag.startsWith('--')) throw new Error(`Unexpected argument: ${arg}`)
  if (booleanFlags.has(flag)) {
    options[flag.slice(2)] = true
    continue
  }
  const value = inlineValue ?? args[++i]
  if (value === undefined) throw new Error(`Missing value for ${flag}`)
  switch (flag) {
    case '--url': options.urls.push(value); break
    case '--categories': options.categories = value; break
    default: throw new Error(`Unknown flag: ${flag}`)
  }
}

function splitFlag(arg) {
  const eq = arg.indexOf('=')
  return eq === -1 ? [arg] : [arg.slice(0, eq), arg.slice(eq + 1)]
}

function printHelp() {
  console.log(`Reachy Lighthouse runner

Usage: npm run lh [-- flags]

Flags:
  --dev                     Audit the Next.js dev server (port 3000) instead of the production server (port 3000). Starts one if none is running.
  --no-build                Skip \`npm run build\` and audit the existing .next/ build.
  --open                    Open each HTML report in the browser when done.
  --desktop                 Use the desktop preset instead of mobile emulation.
  --categories=<list>       Comma-separated categories (default: performance,accessibility,best-practices,seo).
  --url=<path-or-url>       Route to audit; repeatable. Default: / and /login.
  --help                    Show this help.
`)
}

if (options.help) { printHelp(); process.exit(0) }

// ---------------------------------------------------------------------------
// Chrome resolution
// ---------------------------------------------------------------------------

/** Returns a Chrome executable path: CHROME_PATH if set, otherwise Chrome for
 *  Testing downloaded (and cached) via @puppeteer/browsers into .lighthouse/chrome. */
async function resolveChrome() {
  if (process.env.CHROME_PATH) {
    if (!existsSync(process.env.CHROME_PATH)) throw new Error(`CHROME_PATH is set but the file does not exist: ${process.env.CHROME_PATH}`)
    console.log(`Chrome (from CHROME_PATH): ${process.env.CHROME_PATH}`)
    return process.env.CHROME_PATH
  }
  const platform = detectBrowserPlatform()
  if (!platform) throw new Error(`Unsupported platform for Chrome for Testing. Install Chrome and set CHROME_PATH instead.`)
  const buildId = await resolveBuildId(Browser.CHROME, platform, 'stable')
  console.log(`Resolving Chrome for Testing ${buildId} (${platform})...`)
  const installed = await install({ browser: Browser.CHROME, buildId, platform, cacheDir: path.join(ROOT, '.lighthouse', 'chrome') })
  console.log(`Chrome binary: ${installed.executablePath}`)
  return installed.executablePath
}

// ---------------------------------------------------------------------------
// Server lifecycle
// ---------------------------------------------------------------------------

async function isUp(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) })
    return res.status < 500
  } catch {
    return false
  }
}

/** Polls the URL until it responds (or the server process exits / timeout). */
async function waitForServer(url, serverProcess, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (serverProcess && serverProcess.exitCode !== null) {
      throw new Error(`Local server exited early with code ${serverProcess.exitCode}. Check the output above.`)
    }
    if (await isUp(url)) return
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`Server did not become ready at ${url} within ${timeoutMs / 1000}s`)
}

/** Runs an npm script (e.g. build) in the foreground, inheriting stdio. */
function runNpmScript(scriptName) {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', scriptName], { cwd: ROOT, shell: true, stdio: 'inherit' })
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('npm run ' + scriptName + ' failed with code ' + code))))
    child.on('error', reject)
  })
}

/** Starts `next dev` or `next start` on the fixed port. */
function startServer(mode, port) {
  const nextArgs = mode === 'dev' ? ['dev'] : ['start']
  nextArgs.push('--port', String(port))
  const child = spawn(process.execPath, ['node_modules/.bin/next', ...nextArgs], {
    cwd: ROOT,
    stdio: ['ignore', 'inherit', 'inherit'],
  })
  console.log(`Started local server (pid ${child.pid}) in ${mode} mode on port ${port}`)
  return child
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) return
  child.kill('SIGTERM')
  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      try { child.kill('SIGKILL') } catch { /* already gone */ }
      resolve()
    }, 3000)
    child.once('exit', () => { clearTimeout(timer); resolve() })
  })
}

// ---------------------------------------------------------------------------
// Lighthouse CLI
// ---------------------------------------------------------------------------

const LH_CLI = path.join(ROOT, 'node_modules/lighthouse/cli/index.js')

/** Audits one URL via the Lighthouse CLI, writing .report.html + .report.json
 *  next to reportPath, and returns the parsed JSON report. */
async function runLighthouse({ url, reportPath, chromePath, categories, desktop, open }) {
  const chromeFlags = ['--headless', '--disable-dev-shm-usage']
  if (process.env.LH_NO_SANDBOX) chromeFlags.push('--no-sandbox')

  const cliArgs = [
    url,
    '--output=html,json',
    `--output-path=${reportPath}`,
    `--only-categories=${categories}`,
    `--chrome-flags=${chromeFlags.join(' ')}`,
    '--quiet',
  ]
  if (desktop) cliArgs.push('--preset=desktop')
  if (open) cliArgs.push('--view')

  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [LH_CLI, ...cliArgs], {
      cwd: ROOT,
      env: { ...process.env, CHROME_PATH: chromePath },
      stdio: ['ignore', 'inherit', 'inherit'],
    })
    child.on('exit', (code) => resolve(code ?? 1))
    child.on('error', reject)
  })

  const jsonPath = `${reportPath}.report.json`
  if (exitCode !== 0 || !existsSync(jsonPath)) {
    throw new Error(`Lighthouse failed for ${url} (exit code ${exitCode})`)
  }
  return JSON.parse(await readFile(jsonPath, 'utf8'))
}

// ---------------------------------------------------------------------------
// Console summary
// ---------------------------------------------------------------------------

const METRICS = [
  ['first-contentful-paint', 'FCP'],
  ['largest-contentful-paint', 'LCP'],
  ['total-blocking-time', 'TBT'],
  ['cumulative-layout-shift', 'CLS'],
  ['speed-index', 'SI'],
]

function scoreOrDash(category, report) {
  const score = report.categories?.[category]?.score
  return score == null ? '–' : String(Math.round(score * 100))
}

function metricOrDash(auditId, report) {
  return report.audits?.[auditId]?.displayValue ?? '–'
}

function printSummaryHeader() {
  const columns = ['Route', 'Perf', 'A11y', 'BP', 'SEO', ...METRICS.map(([, label]) => label)]
  console.log(`\n${columns.map((c) => c.padEnd(9)).join('')}`)
  console.log('─'.repeat(columns.length * 9 + 2))
}

function printSummaryRow(route, report) {
  const cells = [
    route,
    scoreOrDash('performance', report),
    scoreOrDash('accessibility', report),
    scoreOrDash('best-practices', report),
    scoreOrDash('seo', report),
    ...METRICS.map(([id]) => metricOrDash(id, report)),
  ]
  console.log(cells.map((c) => c.padEnd(9)).join(''))
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function slugify(url) {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const parsed = new URL(url)
    return `${parsed.hostname}${parsed.pathname === '/' ? '' : parsed.pathname}`.replace(/[^a-z0-9-]+/gi, '-')
  }
  return url === '/' ? 'index' : url.replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '')
}

async function main() {
  if (!existsSync(LH_CLI)) throw new Error('lighthouse is not installed — run `npm install` first.')

  const mode = options.dev ? 'dev' : 'prod'
  const port = mode === 'dev' ? DEV_PORT : PROD_PORT
  const baseUrl = `http://localhost:${port}`
  const categories = options.categories ?? 'performance,accessibility,best-practices,seo'
  const routes = options.urls.length > 0 ? options.urls : DEFAULT_ROUTES

  console.log(`\nLighthouse audit — ${mode} mode (${baseUrl}), categories: ${categories}`)

  const chromePath = await resolveChrome()

  if (mode === 'prod' && !options['no-build']) {
    console.log('\nBuilding production bundle (`npm run build`)...')
    await runNpmScript('build')
  }

  // Reuse a server that is already running; otherwise start one and clean it up.
  let serverProcess = null
  if (await isUp(baseUrl)) {
    console.log(`\nReusing local server already running at ${baseUrl}`)
  } else {
    serverProcess = startServer(mode, port)
    await waitForServer(baseUrl, serverProcess)
  }

  // Kill a spawned server on Ctrl+C / termination as well.
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      serverProcess?.kill('SIGTERM')
      process.exit(1)
    })
  }

  try {
    const reportDir = path.join(ROOT, 'reports', 'lighthouse')
    await mkdir(reportDir, { recursive: true })

    printSummaryHeader()
    const failures = []

    for (const route of routes) {
      const url = route.startsWith('http://') || route.startsWith('https://') ? route : `${baseUrl}${route.startsWith('/') ? '' : '/'}${route}`
      const reportPath = path.join(reportDir, slugify(url))
      try {
        const report = await runLighthouse({ url, reportPath, chromePath, categories, desktop: options.desktop, open: options.open })
        printSummaryRow(url === `${baseUrl}/` ? '/' : url.replace(baseUrl, '') || '/', report)
      } catch (error) {
        failures.push({ route, error })
        console.log(`✗ ${route}: ${error.message}`)
      }
    }

    console.log(`\nHTML reports: ${reportDir}${path.sep}*.report.html`)
    if (failures.length > 0) {
      throw new Error(`${failures.length} of ${routes.length} audits failed: ${failures.map((f) => f.route).join(', ')}`)
    }
  } finally {
    await stopServer(serverProcess)
  }
}

main().catch((error) => {
  console.error(`\n${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
})
