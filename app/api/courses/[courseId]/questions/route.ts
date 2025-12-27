import { NextResponse } from 'next/server'
import {
  addQuestion,
  getQuestionsByCourse,
  getQuestionsForStudentCourse,
} from '@/lib/courseQuestionFileStore'

export const runtime = 'nodejs'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params
  const url = new URL(req.url)
  const studentId = url.searchParams.get('studentId') ?? undefined

  if (studentId) {
    const data = await getQuestionsForStudentCourse(studentId, courseId)
    return NextResponse.json(data)
  }

  const data = await getQuestionsByCourse(courseId)
  return NextResponse.json(data)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params
  const body = (await req.json()) as {
    studentId?: string
    studentName?: string
    message?: string
  }

  if (!body.studentId || !body.message?.trim()) {
    return NextResponse.json(
      { error: 'studentId and message are required' },
      { status: 400 }
    )
  }

  const entry = await addQuestion({
    courseId,
    studentId: body.studentId,
    studentName: body.studentName?.trim() || 'Student',
    message: body.message.trim(),
  })

  return NextResponse.json(entry, { status: 201 })
}
