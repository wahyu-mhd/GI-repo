import { NextResponse } from 'next/server'
import { getCourseByIdFile, updateCourseFile } from '@/lib/courseFileStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params
  const course = await getCourseByIdFile(courseId)
  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(course)
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params
  const existing = await getCourseByIdFile(courseId)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = (await req.json()) as Partial<{
    title: string
    description: string
    grade: number
  }>

  const hasEditableField =
    body.title !== undefined ||
    body.description !== undefined ||
    body.grade !== undefined

  if (!hasEditableField) {
    return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 })
  }

  if (body.title !== undefined && !body.title.trim()) {
    return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 })
  }

  if (body.grade !== undefined) {
    const gradeNum = Number(body.grade)
    if (!Number.isFinite(gradeNum) || gradeNum < 1 || gradeNum > 12) {
      return NextResponse.json({ error: 'Grade must be a number between 1-12' }, { status: 400 })
    }
  }

  const nextGrade =
    body.grade !== undefined
      ? Number(body.grade)
      : existing.grade

  const updated = await updateCourseFile(courseId, {
    title: body.title?.trim() ?? existing.title,
    description: body.description?.trim() ?? existing.description,
    grade: nextGrade,
  })

  if (!updated) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json(updated)
}
