// Turns the `vite build --mode artifact` output into one self-contained page fragment for a
// claude.ai Artifact. The platform wraps the file in its own <!doctype>/<head>/<body> shell,
// so the fragment carries only a <title>, the inline CSS, the root element and the inline JS.
// Usage: node scripts/artifact-page.mjs  (after `vite build --mode artifact`)
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const OUT = 'dist-artifact'
const TITLE = 'sbaby Play Planner'

const html = await readFile(join(OUT, 'index.html'), 'utf8')
const scripts = [...html.matchAll(/<script[^>]*src="\.\/([^"]+)"[^>]*><\/script>/g)].map((m) => m[1])
const styles = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="\.\/([^"]+)"[^>]*>/g)].map((m) => m[1])
if (scripts.length !== 1) throw new Error(`Expected exactly one script, found ${scripts.length}`)

const css = (await Promise.all(styles.map((f) => readFile(join(OUT, f), 'utf8')))).join('\n')
// A literal "</script" inside the bundle would end the inline script early.
const js = (await readFile(join(OUT, scripts[0]), 'utf8')).replace(/<\/script/gi, '<\\/script')
// Same for "</style" inside the CSS.
const safeCss = css.replace(/<\/style/gi, '<\\/style')

const page = `<title>${TITLE}</title>
<meta name="description" content="Daily play games for babies 0–24 months, and a simple way to watch them grow.">
<style>${safeCss}</style>
<div id="root"></div>
<script type="module">${js}</script>
`

const problems = []
if (/<!doctype|<html|<head|<body/i.test(page.slice(0, 2000))) problems.push('document tags')
if (/(src|href)="\/(?!\/)/.test(page)) problems.push('absolute paths')
if (/serviceWorker\.register/.test(page)) problems.push('service worker registration')
if (/url\((?!["']?data:)["']?[^)"']+\.(woff2?|png|svg)/.test(css)) problems.push('non-inlined asset URL in CSS')
if (problems.length) {
  console.error(`artifact page check failed: ${problems.join(', ')}`)
  process.exit(1)
}

await writeFile(join(OUT, 'sbaby.html'), page)
console.log(`wrote ${OUT}/sbaby.html (${(page.length / 1024).toFixed(0)} KiB)`)
