import { NextResponse } from 'next/server'
import {
  getProgressByStudent,
  listProgress,
  upsertProgress,
} from '@/lib/progressFileStore'
import type { StudentProgress } from '@/lib/mockData'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('studentId')
  const courseId = searchParams.get('courseId')

  const all = studentId ? await getProgressByStudent(studentId) : await listProgress()
  const filtered = courseId
    ? all.filter(p => p.courseId === courseId)
    : all

  return NextResponse.json(filtered)
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as Partial<StudentProgress> & { studentId?: string; courseId?: string }
    if (!body.studentId || !body.courseId) {
      return NextResponse.json({ error: 'studentId and courseId are required' }, { status: 400 })
    }
    if (typeof body.completedLessons === 'number' && typeof body.totalLessons === 'number') {
      if (body.completedLessons < 0 || body.totalLessons < 0) {
        return NextResponse.json({ error: 'Lesson counts cannot be negative' }, { status: 400 })
      }
      if (body.completedLessons > body.totalLessons) {
        return NextResponse.json({ error: 'completedLessons cannot exceed totalLessons' }, { status: 400 })
      }
    }
    const saved = await upsertProgress({
      id: body.id,
      studentId: body.studentId,
      courseId: body.courseId,
      startedAt: body.startedAt,
      updatedAt: body.updatedAt,
      completedLessons: body.completedLessons ?? 0,
      totalLessons: body.totalLessons ?? 0,
      lastLessonId: body.lastLessonId,
      lastQuizId: body.lastQuizId,
      percentComplete: body.percentComplete,
    })
    return NextResponse.json(saved)
  } catch (err) {
    console.error('PUT /api/progress failed', err)
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
  }
}
