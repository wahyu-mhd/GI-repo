import { NextResponse } from 'next/server'
import { deleteNews, getNewsById, updateNews } from '@/lib/newsFileStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ newsId: string }> }
) {
  const { newsId } = await params
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

    const existing = await getNewsById(newsId)
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const patch = {
      title: body.title?.trim(),
      excerpt: body.excerpt?.trim(),
      image: body.image?.trim(),
      href: body.href?.trim(),
      tag: body.tag?.trim(),
      date: body.date?.trim(),
      content: body.content ?? existing.content ?? '',
    }

    const updated = await updateNews(newsId, patch)
    if (!updated) return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/superuser/news/[newsId] error', error)
    return NextResponse.json({ error: 'Failed to update news item' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ newsId: string }> }
) {
  const { newsId } = await params
  const existing = await getNewsById(newsId)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const deleted = await deleteNews(newsId)
  if (!deleted) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
