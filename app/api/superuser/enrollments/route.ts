import { NextResponse } from 'next/server'
import { addEnrollment, readEnrollments } from '@/lib/userStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const enrollments = await readEnrollments()
  return NextResponse.json(enrollments)
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { courseId?: string; studentId?: string }
    if (!body.courseId || !body.studentId) {
      return NextResponse.json({ error: 'courseId and studentId are required' }, { status: 400 })
    }
    const enrollment = await addEnrollment(body.courseId, body.studentId)
    return NextResponse.json(enrollment, { status: 201 })
  } catch (error) {
    console.error('POST /api/superuser/enrollments error', error)
    return NextResponse.json({ error: 'Failed to add enrollment' }, { status: 500 })
  }
}
