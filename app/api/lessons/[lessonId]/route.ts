import { NextResponse } from 'next/server'
import {
  addModule,
  getLessonByIdFile,
  getModuleByIdFile,
  updateLessonFile,
} from '@/lib/moduleLessonFileStore'

export const runtime = 'nodejs'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params
  const lesson = await getLessonByIdFile(lessonId)
  if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(lesson)
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params
  const existing = await getLessonByIdFile(lessonId)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json() as {
    moduleId?: string
    title?: string
    content?: string
    videoUrl?: string
    pdfUrl?: string
    courseId?: string
  }

  let moduleId = body.moduleId ?? existing.moduleId
  if (body.moduleId) {
    const module = await getModuleByIdFile(body.moduleId)
    if (!module) {
      return NextResponse.json({ error: 'Invalid moduleId' }, { status: 400 })
    }
  } else if (!moduleId && body.courseId) {
    // Create default module if both moduleId and existing module are absent
    const created = await addModule({
      courseId: body.courseId,
      title: 'General',
      order: 1,
    })
    moduleId = created.id
  }

  const updated = await updateLessonFile(lessonId, {
    moduleId,
    title: body.title ?? existing.title,
    content: body.content ?? existing.content,
    videoUrl: body.videoUrl ?? existing.videoUrl,
    pdfUrl: body.pdfUrl ?? existing.pdfUrl,
  })

  if (!updated) return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  return NextResponse.json(updated)
}
