// import { NextResponse } from 'next/server'
// import { addCourseTeacher, readCourseTeachers } from '@/lib/courseTeacherStore'

// export const runtime = 'nodejs'
// export const dynamic = 'force-dynamic'

// export async function GET(request: Request) {
//   try {
//     const { searchParams } = new URL(request.url)
//     const courseId = searchParams.get('courseId')
//     const data = await readCourseTeachers()
//     const filtered = courseId ? data.filter(item => item.courseId === courseId) : data
//     return NextResponse.json(filtered)
//   } catch (error) {
//     console.error('GET /api/superuser/course-teachers error', error)
//     return NextResponse.json({ error: 'Failed to read course teachers' }, { status: 500 })
//   }
// }

// export async function POST(request: Request) {
//   try {
//     const body = (await request.json()) as { courseId?: string; teacherId?: string }
//     if (!body.courseId || !body.teacherId) {
//       return NextResponse.json({ error: 'courseId and teacherId are required' }, { status: 400 })
//     }

//     const assignment = await addCourseTeacher(body.courseId, body.teacherId)
//     return NextResponse.json(assignment, { status: 201 })
//   } catch (error) {
//     console.error('POST /api/superuser/course-teachers error', error)
//     return NextResponse.json({ error: 'Failed to add teacher to course' }, { status: 500 })
//   }
// }
import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createSupabaseAdminClient()

  const { data, error } = await supabase
    .from('course_teachers')
    .select('id, course_id, teacher_id, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // IMPORTANT: map snake_case -> camelCase to match your UI types
  const mapped = (data ?? []).map((row) => ({
    id: row.id,
    courseId: row.course_id,
    teacherId: row.teacher_id,
    createdAt: row.created_at,
  }))

  return NextResponse.json(mapped)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { courseId, teacherId } = body as { courseId?: string; teacherId?: string }

  if (!courseId || !teacherId) {
    return NextResponse.json(
      { error: 'courseId and teacherId are required' },
      { status: 400 }
    )
  }

  const supabase = createSupabaseAdminClient()

  const { data, error } = await supabase
    .from('course_teachers')
    .insert({
      course_id: courseId,
      teacher_id: teacherId,
    })
    .select('id, course_id, teacher_id, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    {
      id: data.id,
      courseId: data.course_id,
      teacherId: data.teacher_id,
      createdAt: data.created_at,
    },
    { status: 201 }
  )
}
