import { NextResponse } from 'next/server'
import { readSiteSettings, writeSiteSettings } from '@/lib/siteFileStore'

export const runtime = 'nodejs'

export async function GET() {
  const settings = await readSiteSettings()
  return NextResponse.json(settings)
}

export async function PUT(req: Request) {
  const body = (await req.json()) as { heroBadge?: string }
  const heroBadge = (body.heroBadge ?? '').trim()

  if (!heroBadge) {
    return NextResponse.json({ error: 'heroBadge is required' }, { status: 400 })
  }

  const next = { heroBadge }
  await writeSiteSettings(next)
  return NextResponse.json(next)
}
