import { NextResponse } from 'next/server'
import { getModulesByCourseFile } from '@/lib/moduleLessonFileStore'

export const runtime = 'nodejs'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params
  const modules = await getModulesByCourseFile(courseId)
  return NextResponse.json(modules)
}
