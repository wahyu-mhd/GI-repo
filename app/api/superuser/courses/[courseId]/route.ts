import { NextResponse } from 'next/server'
import { deleteCourse, getCourseByIdFile } from '@/lib/courseFileStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params
  const course = await getCourseByIdFile(courseId)
  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const deleted = await deleteCourse(courseId)
  if (!deleted) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
