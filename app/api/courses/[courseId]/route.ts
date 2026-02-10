import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import type { Stage } from '@/lib/mockData'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('courses')
    .select('id, title, description, teacher_id, teacher_name, stage, grade, subject, created_at')
    .eq('id', courseId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const gradeValue = Number(data.grade)
  const normalizedGrade = Number.isFinite(gradeValue) ? gradeValue : 1

  return NextResponse.json({
    id: data.id,
    title: data.title,
    description: data.description,
    teacherId: data.teacher_id ?? '',
    teacherName: data.teacher_name ?? '',
    stage: data.stage,
    grade: normalizedGrade,
    subject: data.subject,
    createdAt: data.created_at,
  })
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params

  const body = (await req.json()) as Partial<{
    title: string
    description: string
    grade: number
    stage: Stage
  }>

  const hasEditableField =
    body.title !== undefined ||
    body.description !== undefined ||
    body.grade !== undefined ||
    body.stage !== undefined

  if (!hasEditableField) {
    return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 })
  }

  if (body.title !== undefined && !body.title.trim()) {
    return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 })
  }

  if (body.grade !== undefined) {
    const gradeNum = Number(body.grade)
    if (!Number.isFinite(gradeNum) || gradeNum < 1 || gradeNum > 12) {
      return NextResponse.json({ error: 'Grade must be a number between 1-12' }, { status: 400 })
    }
  }

  const validStages: Stage[] = ['elementary', 'junior', 'senior']
  if (body.stage !== undefined && !validStages.includes(body.stage)) {
    return NextResponse.json(
      { error: 'Stage must be one of elementary, junior, or senior' },
      { status: 400 }
    )
  }

  const updates: {
    title?: string
    description?: string
    grade?: string
    stage?: Stage
  } = {}

  if (body.title !== undefined) {
    updates.title = body.title.trim()
  }
  if (body.description !== undefined) {
    updates.description = body.description.trim()
  }
  if (body.grade !== undefined) {
    updates.grade = String(Number(body.grade))
  }
  if (body.stage !== undefined) {
    updates.stage = body.stage
  }

  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', courseId)
    .select('id, title, description, teacher_id, teacher_name, stage, grade, subject, created_at')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Update failed' }, { status: 500 })
  }

  const gradeValue = Number(data.grade)
  const normalizedGrade = Number.isFinite(gradeValue) ? gradeValue : 1

  return NextResponse.json({
    id: data.id,
    title: data.title,
    description: data.description,
    teacherId: data.teacher_id ?? '',
    teacherName: data.teacher_name ?? '',
    stage: data.stage,
    grade: normalizedGrade,
    subject: data.subject,
    createdAt: data.created_at,
  })
}
