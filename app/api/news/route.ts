import { NextResponse } from 'next/server'
import { readNews } from '@/lib/newsFileStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const news = await readNews()
  return NextResponse.json(news)
}
