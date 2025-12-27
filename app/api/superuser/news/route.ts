import { NextResponse } from 'next/server'
import { addNews, readNews } from '@/lib/newsFileStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const news = await readNews()
  return NextResponse.json(news)
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      title?: string
      excerpt?: string
      image?: string
      href?: string
      tag?: string
      date?: string
      content?: string
    }

    if (!body.title?.trim() || !body.excerpt?.trim() || !body.image?.trim() || !body.date?.trim()) {
      return NextResponse.json({ error: 'title, excerpt, image, and date are required' }, { status: 400 })
    }

    const created = await addNews({
      title: body.title.trim(),
      excerpt: body.excerpt.trim(),
      image: body.image.trim(),
      href: body.href?.trim() || undefined,
      tag: body.tag?.trim() || undefined,
      date: body.date.trim(),
      content: body.content ?? '',
      // createdAt handled by addNews
      // id handled by addNews
    })

    return NextResponse.json(created)
  } catch (error) {
    console.error('POST /api/superuser/news error', error)
    return NextResponse.json({ error: 'Failed to create news item' }, { status: 500 })
  }
}
