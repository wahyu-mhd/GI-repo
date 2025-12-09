import { NextResponse } from 'next/server'
import {
  addModule,
  getModulesByCourseFile,
  readLessons,
  readModules,
  writeModules,
} from '@/lib/moduleLessonFileStore'

export const runtime = 'nodejs'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params
  const url = new URL(req.url)
  const pruneEmpty = url.searchParams.get('pruneEmpty') === '1'

  let modules = await getModulesByCourseFile(courseId)

  if (pruneEmpty) {
    const lessons = await readLessons()
    const lessonModuleIds = new Set(lessons.map(l => l.moduleId))
    const remaining = modules.filter(m => lessonModuleIds.has(m.id))

    if (remaining.length !== modules.length) {
      // Persist removal of empty modules for this course
      const allModules = await readModules()
      const filteredAll = allModules.filter(
        m => m.courseId !== courseId || lessonModuleIds.has(m.id)
      )
      await writeModules(filteredAll)
      modules = remaining
    }
  }

  return NextResponse.json(modules)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params
  const body = (await req.json()) as { title?: string; order?: number }
  const title = (body.title ?? '').trim()

  if (!title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  const existing = await getModulesByCourseFile(courseId)
  const order = body.order ?? existing.length + 1

  const created = await addModule({ courseId, title, order })
  return NextResponse.json(created, { status: 201 })
}
