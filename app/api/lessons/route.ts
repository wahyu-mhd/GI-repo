import { NextResponse } from 'next/server'
import { createLesson } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const body = await req.json() as { moduleId?: string; title?: string; content?: string; videoUrl?: string; pdfUrl?: string }
  if (!body.moduleId || !body.title) {
    return NextResponse.json({ error: 'moduleId and title are required' }, { status: 400 })
  }
  const lesson = createLesson({
    moduleId: body.moduleId,
    title: body.title,
    content: body.content ?? '',
    videoUrl: body.videoUrl,
    pdfUrl: body.pdfUrl,
  })
  return NextResponse.json(lesson, { status: 201 })
}
