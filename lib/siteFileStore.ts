import { promises as fs } from 'fs'
import path from 'path'

type SiteSettings = {
  heroBadge: string
}

const sitePath = path.join(process.cwd(), 'data', 'site.json')
const defaultSettings: SiteSettings = {
  heroBadge: '🚀 New Academic Year Ready',
}

async function ensureFile(): Promise<void> {
  try {
    await fs.access(sitePath)
  } catch {
    await fs.mkdir(path.dirname(sitePath), { recursive: true })
    await fs.writeFile(sitePath, JSON.stringify(defaultSettings, null, 2), 'utf8')
  }
}

export async function readSiteSettings(): Promise<SiteSettings> {
  try {
    await ensureFile()
    const raw = await fs.readFile(sitePath, 'utf8')
    const parsed = raw.trim() ? (JSON.parse(raw) as SiteSettings) : defaultSettings
    return {
      ...defaultSettings,
      ...parsed,
    }
  } catch (err) {
    console.error('Failed to read site settings, returning defaults', err)
    return defaultSettings
  }
}

export async function writeSiteSettings(settings: SiteSettings): Promise<void> {
  await ensureFile()
  await fs.writeFile(sitePath, JSON.stringify(settings, null, 2), 'utf8')
}
