// import { NextResponse } from 'next/server'
// import { addEnrollment, readEnrollments } from '@/lib/userStore'

// export const runtime = 'nodejs'
// export const dynamic = 'force-dynamic'

// export async function GET() {
//   const enrollments = await readEnrollments()
//   return NextResponse.json(enrollments)
// }

// export async function POST(request: Request) {
//   try {
//     const body = (await request.json()) as { courseId?: string; studentId?: string }
//     if (!body.courseId || !body.studentId) {
//       return NextResponse.json({ error: 'courseId and studentId are required' }, { status: 400 })
//     }
//     const enrollment = await addEnrollment(body.courseId, body.studentId)
//     return NextResponse.json(enrollment, { status: 201 })
//   } catch (error) {
//     console.error('POST /api/superuser/enrollments error', error)
//     return NextResponse.json({ error: 'Failed to add enrollment' }, { status: 500 })
//   }
// }
import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createSupabaseAdminClient()

  const { data, error } = await supabase
    .from('enrollments')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
export async function POST(req: Request) {
  const body = await req.json()
  const { courseId, studentId } = body

  if (!courseId || !studentId) {
    return NextResponse.json(
      { error: 'courseId and studentId are required' },
      { status: 400 }
    )
  }

  const supabase = createSupabaseAdminClient()

  const { data, error } = await supabase
    .from('enrollments')
    .insert({
      course_id: courseId,
      student_id: studentId,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}