import { NextResponse } from 'next/server'
import { getLessonsByCourseFile } from '@/lib/moduleLessonFileStore'

export const runtime = 'nodejs'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params
  const lessons = await getLessonsByCourseFile(courseId)
  return NextResponse.json(lessons)
}
