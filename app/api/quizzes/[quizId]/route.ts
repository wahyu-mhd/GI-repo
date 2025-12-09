import { NextResponse } from 'next/server'
import {
  getQuizByIdFile,
  deleteQuizFile,
  getQuestionsByQuizFile,
  updateQuizFile,
  replaceQuizQuestions,
  UpsertQuizQuestionInput,
} from '@/lib/quizFileStore'

export const runtime = 'nodejs'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const { quizId } = await params
  const quiz = await getQuizByIdFile(quizId)
  if (!quiz) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const questions = await getQuestionsByQuizFile(quizId)
  return NextResponse.json({ quiz, questions })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const { quizId } = await params
  const quiz = await getQuizByIdFile(quizId)
  if (!quiz) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await deleteQuizFile(quizId)
  return NextResponse.json({ success: true })
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const { quizId } = await params
  const existing = await getQuizByIdFile(quizId)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = (await req.json()) as Partial<{
    title: string
    description: string
    questions: Array<Partial<UpsertQuizQuestionInput & { text?: string }>>
    maxAttempts: number | null
  }>

  const hasTitle = body.title !== undefined
  const hasDescription = body.description !== undefined
  const hasQuestions = Array.isArray(body.questions)
  const hasMaxAttempts = body.maxAttempts !== undefined

  if (!hasTitle && !hasDescription && !hasQuestions && !hasMaxAttempts) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  if (hasTitle && !body.title?.trim()) {
    return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 })
  }

  let nextMaxAttempts: number | undefined | null = undefined
  if (hasMaxAttempts) {
    if (body.maxAttempts === null) {
      nextMaxAttempts = undefined
    } else {
      const attempts = Number(body.maxAttempts)
      if (!Number.isFinite(attempts) || attempts < 1) {
        return NextResponse.json({ error: 'maxAttempts must be 1 or greater' }, { status: 400 })
      }
      nextMaxAttempts = Math.floor(attempts)
    }
  }

  let savedQuestions = await getQuestionsByQuizFile(quizId)

  if (hasQuestions) {
    const incoming = body.questions ?? []
    if (incoming.length === 0) {
      return NextResponse.json({ error: 'At least one question is required' }, { status: 400 })
    }

    const sanitized: UpsertQuizQuestionInput[] = incoming.map((q, idx) => {
      const text = (q.questionText ?? (q as any).text ?? '').trim()
      if (!text) {
        throw new Error(`Question ${idx + 1} text is required`)
      }
      const type = q.type
      if (!type || !['single', 'multiple', 'short', 'long'].includes(type)) {
        throw new Error(`Question ${idx + 1} type is invalid`)
      }
      return {
        id: q.id,
        questionText: text,
        type,
        choices: q.choices,
        correctIndex: q.correctIndex,
        correctIndices: q.correctIndices,
        expectedAnswer: q.expectedAnswer,
        explanation: q.explanation?.trim() || undefined,
        correctPoints: q.correctPoints ?? 1,
        wrongPoints: q.wrongPoints ?? 0,
        skipPoints: q.skipPoints ?? 0,
      }
    })

    try {
      savedQuestions = await replaceQuizQuestions(quizId, sanitized)
    } catch (err) {
      console.error('Failed to update quiz questions', err)
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to update questions' }, { status: 400 })
    }
  }

  const updatedQuiz = await updateQuizFile(quizId, {
    title: hasTitle ? body.title?.trim() : existing.title,
    description: hasDescription ? body.description?.trim() : existing.description,
    maxAttempts: hasMaxAttempts ? nextMaxAttempts ?? undefined : existing.maxAttempts,
  })

  if (!updatedQuiz) return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  return NextResponse.json({ quiz: updatedQuiz, questions: savedQuestions })
}
