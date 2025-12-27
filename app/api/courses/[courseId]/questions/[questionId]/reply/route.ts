import { NextResponse } from 'next/server'
import { replyToQuestion } from '@/lib/courseQuestionFileStore'

export const runtime = 'nodejs'

const allowedVisibility = new Set(['public', 'private'])

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string; questionId: string }> }
) {
  const { questionId } = await params
  const body = (await req.json()) as {
    teacherName?: string
    message?: string
    visibility?: 'public' | 'private'
  }

  if (!body.message?.trim() || !body.visibility) {
    return NextResponse.json(
      { error: 'message and visibility are required' },
      { status: 400 }
    )
  }

  if (!allowedVisibility.has(body.visibility)) {
    return NextResponse.json({ error: 'Invalid visibility' }, { status: 400 })
  }

  const updated = await replyToQuestion(questionId, {
    message: body.message.trim(),
    visibility: body.visibility,
    teacherName: body.teacherName?.trim() || 'Teacher',
  })

  if (!updated) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  }

  return NextResponse.json(updated)
}
