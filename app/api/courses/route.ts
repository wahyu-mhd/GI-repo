import { NextResponse } from 'next/server'
import { Stage, Grade, Subject } from '@/lib/mockData'
import { addCourse, readCourses } from '@/lib/courseFileStore'

// Force Node runtime so we can use fs locally.
export const runtime = 'nodejs'

export async function GET() {
  try {
    const courses = await readCourses()
    return NextResponse.json(courses)
  } catch (error) {
    console.error('GET /api/courses error', error)
    return NextResponse.json({ error: 'Failed to read courses' }, { status: 500 })
  }
}

type IncomingCourse = {
  title?: string
  description?: string
  teacherName?: string
  stage?: Stage
  grade?: Grade
  subject?: Subject
}

function isValidCourse(body: IncomingCourse): body is Required<IncomingCourse> {
  return Boolean(
    body.title &&
    body.description !== undefined &&
    body.teacherName &&
    body.stage &&
    body.grade &&
    body.subject
  )
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as IncomingCourse

    if (!isValidCourse(body)) {
      return NextResponse.json({ error: 'Invalid course payload' }, { status: 400 })
    }

    const created = await addCourse({
      title: body.title,
      description: body.description,
      teacherName: body.teacherName,
      stage: body.stage,
      grade: body.grade,
      subject: body.subject,
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('POST /api/courses error', error)
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
  }
}
