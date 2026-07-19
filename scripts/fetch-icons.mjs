// Vendors the notable passive icons. Two modes:
//   node scripts/fetch-icons.mjs --raw <path-to-PassiveSkills.json>
//     Regenerates scripts/vendor/notable-icons-source.json (name -> icon
//     basename) from a poe-dat-viewer PassiveSkills export, then continues.
//   node scripts/fetch-icons.mjs
//     Uses the committed mapping: downloads the distinct 128px PNGs from
//     poewiki, downscales to 32x32 via PowerShell System.Drawing (Windows
//     only - this is a vendor-time script, not part of the build), and
//     writes src/data/notable-icons.json with base64 data URIs.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const sourcePath = resolve(root, 'scripts/vendor/notable-icons-source.json')
const dataFullPath = resolve(root, 'scripts/vendor/data-full.json')
const outPath = resolve(root, 'src/data/notable-icons.json')

function fail(msg) {
  console.error(`fetch-icons: ${msg}`)
  process.exit(1)
}

const rawFlag = process.argv.indexOf('--raw')
if (rawFlag !== -1) {
  const rawPath = process.argv[rawFlag + 1]
  if (!rawPath) fail('--raw requires a path to PassiveSkills.json')
  const rows = JSON.parse(readFileSync(rawPath, 'utf8'))
  const full = JSON.parse(readFileSync(dataFullPath, 'utf8'))
  const byName = new Map()
  for (const r of rows) {
    if (typeof r.Id === 'string' && r.Id.startsWith('affliction_notable')) {
      if (!byName.has(r.Name)) byName.set(r.Name, new Set())
      byName.get(r.Name).add(r.Icon_DDSFile)
    }
  }
  const mapping = {}
  for (const name of Object.keys(full.Notables.Large).sort((a, b) => a.localeCompare(b))) {
    const dds = byName.get(name)
    if (!dds || dds.size === 0) fail(`no PassiveSkills row for notable "${name}"`)
    if (dds.size > 1) fail(`conflicting icons for notable "${name}": ${[...dds].join(', ')}`)
    const file = [...dds][0]
    const base = file.split('/').pop()?.replace(/\.dds$/, '')
    if (!base) fail(`unparseable Icon_DDSFile for "${name}": ${file}`)
    mapping[name] = base
  }
  writeFileSync(sourcePath, `${JSON.stringify(mapping, null, 2)}\n`)
  console.log(`fetch-icons: wrote ${sourcePath} (${Object.keys(mapping).length} notables)`)
}

const mapping = JSON.parse(readFileSync(sourcePath, 'utf8'))
const basenames = [...new Set(Object.values(mapping))].sort((a, b) => a.localeCompare(b))
console.log(`fetch-icons: ${Object.keys(mapping).length} notables, ${basenames.length} distinct icons`)

function wikiUrl(base) {
  const file = `${base}_passive_skill_icon.png`
  const h = createHash('md5').update(file).digest('hex')
  return `https://www.poewiki.net/images/${h[0]}/${h.slice(0, 2)}/${file}`
}

const srcDir = mkdtempSync(join(tmpdir(), 'cj-icons-src-'))
const dstDir = mkdtempSync(join(tmpdir(), 'cj-icons-dst-'))

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47])
for (const base of basenames) {
  const url = wikiUrl(base)
  const res = await fetch(url, { headers: { 'User-Agent': 'scalpel-cluster-jewel icon vendor (github.com/scalpelpoe)' } })
  if (res.status !== 200) fail(`${res.status} for ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (!buf.subarray(0, 4).equals(PNG_MAGIC)) fail(`not a PNG: ${url}`)
  writeFileSync(join(srcDir, `${base}.png`), buf)
  console.log(`fetch-icons: downloaded ${base} (${buf.length} bytes)`)
}

if (process.platform !== 'win32') fail('the downscale step uses PowerShell System.Drawing and is Windows-only')
const ps = [
  'Add-Type -AssemblyName System.Drawing;',
  `Get-ChildItem '${srcDir}\\*.png' | ForEach-Object {`,
  '$img=[System.Drawing.Image]::FromFile($_.FullName);',
  '$bmp=New-Object System.Drawing.Bitmap 32,32;',
  '$g=[System.Drawing.Graphics]::FromImage($bmp);',
  '$g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic;',
  '$g.SmoothingMode=[System.Drawing.Drawing2D.SmoothingMode]::HighQuality;',
  '$g.DrawImage($img,0,0,32,32);',
  '$g.Dispose(); $img.Dispose();',
  `$bmp.Save('${dstDir}\\' + $_.Name, [System.Drawing.Imaging.ImageFormat]::Png);`,
  '$bmp.Dispose() }',
].join(' ')
execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps])

const icons = {}
for (const base of basenames) {
  const buf = readFileSync(join(dstDir, `${base}.png`))
  if (!buf.subarray(0, 4).equals(PNG_MAGIC)) fail(`downscale produced a non-PNG for ${base}`)
  icons[base] = `data:image/png;base64,${buf.toString('base64')}`
}
rmSync(srcDir, { recursive: true, force: true })
rmSync(dstDir, { recursive: true, force: true })

const out = { byNotable: mapping, icons }
writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`)
console.log(`fetch-icons: wrote ${outPath} (${basenames.length} icons inlined)`)
