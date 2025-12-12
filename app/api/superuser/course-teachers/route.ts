import { NextResponse } from 'next/server'
import { addCourseTeacher, readCourseTeachers } from '@/lib/courseTeacherStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const data = await readCourseTeachers()
    const filtered = courseId ? data.filter(item => item.courseId === courseId) : data
    return NextResponse.json(filtered)
  } catch (error) {
    console.error('GET /api/superuser/course-teachers error', error)
    return NextResponse.json({ error: 'Failed to read course teachers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { courseId?: string; teacherId?: string }
    if (!body.courseId || !body.teacherId) {
      return NextResponse.json({ error: 'courseId and teacherId are required' }, { status: 400 })
    }

    const assignment = await addCourseTeacher(body.courseId, body.teacherId)
    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    console.error('POST /api/superuser/course-teachers error', error)
    return NextResponse.json({ error: 'Failed to add teacher to course' }, { status: 500 })
  }
}
