import { NextResponse } from 'next/server'
import {
  addFeedback,
  getFeedbackByCourse,
  getFeedbackForStudentCourse,
  readFeedback,
} from '@/lib/feedbackFileStore'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const studentId = url.searchParams.get('studentId') ?? undefined
  const courseId = url.searchParams.get('courseId') ?? undefined

  if (studentId && courseId) {
    const data = await getFeedbackForStudentCourse(studentId, courseId)
    return NextResponse.json(data)
  }

  if (courseId) {
    const data = await getFeedbackByCourse(courseId)
    return NextResponse.json(data)
  }

  const all = await readFeedback()
  return NextResponse.json(all)
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    studentId?: string
    courseId?: string
    teacherName?: string
    message?: string
  }

  if (!body.studentId || !body.courseId || !body.message?.trim()) {
    return NextResponse.json({ error: 'studentId, courseId, and message are required' }, { status: 400 })
  }

  const entry = await addFeedback({
    studentId: body.studentId,
    courseId: body.courseId,
    teacherName: body.teacherName?.trim() || 'Teacher',
    message: body.message.trim(),
  })

  return NextResponse.json(entry, { status: 201 })
}
