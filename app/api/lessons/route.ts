import { NextResponse } from 'next/server'
import { addLesson, addModule, getModulesByCourseFile } from '@/lib/moduleLessonFileStore'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const body = await req.json() as { moduleId?: string; courseId?: string; title?: string; content?: string; videoUrl?: string; pdfUrl?: string }
  if (!body.title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }
  let moduleId = body.moduleId

  if (!moduleId) {
    if (!body.courseId) {
      return NextResponse.json({ error: 'courseId is required when moduleId is missing' }, { status: 400 })
    }
    const existing = await getModulesByCourseFile(body.courseId)
    const order = existing.length + 1
    const module = await addModule({ courseId: body.courseId, title: 'General', order })
    moduleId = module.id
  }

  const lesson = await addLesson({
    moduleId,
    title: body.title,
    content: body.content ?? '',
    videoUrl: body.videoUrl,
    pdfUrl: body.pdfUrl,
  })
  return NextResponse.json(lesson, { status: 201 })
}
