// import { NextResponse } from 'next/server'
// import { Stage, Grade, Subject } from '@/lib/mockData'
// import { addCourse, readCourses } from '@/lib/courseFileStore'

// // Force Node runtime so we can use fs locally.
// export const runtime = 'nodejs'

// export async function GET() {
//   try {
//     const courses = await readCourses()
//     return NextResponse.json(courses)
//   } catch (error) {
//     console.error('GET /api/courses error', error)
//     return NextResponse.json({ error: 'Failed to read courses' }, { status: 500 })
//   }
// }

// type IncomingCourse = {
//   title?: string
//   description?: string
//   teacherId?: string
//   teacherName?: string
//   stage?: Stage
//   grade?: Grade
//   subject?: Subject
// }

// function isValidCourse(body: IncomingCourse): body is Required<IncomingCourse> {
//   return Boolean(
//     body.title &&
//     body.description !== undefined &&
//     body.teacherId &&
//     body.teacherName &&
//     body.stage &&
//     body.grade &&
//     body.subject
//   )
// }

// export async function POST(request: Request) {
//   try {
//     const body = (await request.json()) as IncomingCourse

//     if (!isValidCourse(body)) {
//       return NextResponse.json({ error: 'Invalid course payload' }, { status: 400 })
//     }

//     const created = await addCourse({
//       title: body.title,
//       description: body.description,
//       teacherId: body.teacherId,
//       teacherName: body.teacherName,
//       stage: body.stage,
//       grade: body.grade,
//       subject: body.subject,
//     })

//     return NextResponse.json(created, { status: 201 })
//   } catch (error) {
//     console.error('POST /api/courses error', error)
//     return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
//   }
// }

import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import type { Stage, Grade, Subject } from '@/lib/mockData'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type IncomingCourse = {
  title?: string
  description?: string
  teacherId?: string
  teacherName?: string
  stage?: Stage
  grade?: Grade
  subject?: Subject
}

function isValidCourse(body: IncomingCourse): body is Required<IncomingCourse> {
  return Boolean(
    body.title &&
      body.description !== undefined &&
      body.teacherId &&
      body.teacherName &&
      body.stage &&
      body.grade &&
      body.subject
  )
}

export async function GET() {
  const supabase = createSupabaseAdminClient()

  const { data, error } = await supabase
    .from('courses')
    .select('id, title, description, teacher_id, teacher_name, stage, grade, subject, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // map snake_case -> camelCase to match your UI
  const mapped = (data ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    teacherId: c.teacher_id ?? '',
    teacherName: c.teacher_name ?? '',
    stage: c.stage,
    grade: c.grade,
    subject: c.subject,
    createdAt: c.created_at,
  }))

  return NextResponse.json(mapped)
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as IncomingCourse

    if (!isValidCourse(body)) {
      return NextResponse.json({ error: 'Invalid course payload' }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()

    const { data, error } = await supabase
      .from('courses')
      .insert({
        title: body.title,
        description: body.description,
        teacher_id: body.teacherId,
        teacher_name: body.teacherName,
        stage: body.stage,
        grade: body.grade,
        subject: body.subject,
      })
      .select('id, title, description, teacher_id, teacher_name, stage, grade, subject, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      {
        id: data.id,
        title: data.title,
        description: data.description,
        teacherId: data.teacher_id ?? '',
        teacherName: data.teacher_name ?? '',
        stage: data.stage,
        grade: data.grade,
        subject: data.subject,
        createdAt: data.created_at,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/courses error', error)
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
  }
}

