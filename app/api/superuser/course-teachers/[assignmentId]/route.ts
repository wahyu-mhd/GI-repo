import { NextResponse } from 'next/server'
import { deleteCourseTeacher } from '@/lib/courseTeacherStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await params
    const deleted = await deleteCourseTeacher(assignmentId)
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/superuser/course-teachers/[assignmentId] error', error)
    return NextResponse.json({ error: 'Failed to remove teacher from course' }, { status: 500 })
  }
}
