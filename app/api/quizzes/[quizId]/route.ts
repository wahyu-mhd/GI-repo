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
    timeLimitMinutes: number | null
    availableFrom: string | null
    availableUntil: string | null
  }>

  const hasTitle = body.title !== undefined
  const hasDescription = body.description !== undefined
  const hasQuestions = Array.isArray(body.questions)
  const hasMaxAttempts = body.maxAttempts !== undefined
  const hasTimeLimit = body.timeLimitMinutes !== undefined
  const hasAvailableFrom = body.availableFrom !== undefined
  const hasAvailableUntil = body.availableUntil !== undefined

  if (
    !hasTitle &&
    !hasDescription &&
    !hasQuestions &&
    !hasMaxAttempts &&
    !hasTimeLimit &&
    !hasAvailableFrom &&
    !hasAvailableUntil
  ) {
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

  let nextTimeLimit: number | undefined | null = undefined
  if (hasTimeLimit) {
    if (body.timeLimitMinutes === null) {
      nextTimeLimit = undefined
    } else {
      const limit = Number(body.timeLimitMinutes)
      if (!Number.isFinite(limit) || limit < 1) {
        return NextResponse.json(
          { error: 'timeLimitMinutes must be 1 minute or greater' },
          { status: 400 }
        )
      }
      nextTimeLimit = Math.floor(limit)
    }
  }

  let nextAvailableFrom: string | undefined = undefined
  if (hasAvailableFrom) {
    if (body.availableFrom === null) {
      nextAvailableFrom = undefined
    } else {
      const trimmed = String(body.availableFrom).trim()
      if (trimmed) {
        const date = new Date(trimmed)
        if (Number.isNaN(date.getTime())) {
          return NextResponse.json(
            { error: 'availableFrom must be a valid date' },
            { status: 400 }
          )
        }
        nextAvailableFrom = date.toISOString()
      } else {
        nextAvailableFrom = undefined
      }
    }
  }

  let nextAvailableUntil: string | undefined = undefined
  if (hasAvailableUntil) {
    if (body.availableUntil === null) {
      nextAvailableUntil = undefined
    } else {
      const trimmed = String(body.availableUntil).trim()
      if (trimmed) {
        const date = new Date(trimmed)
        if (Number.isNaN(date.getTime())) {
          return NextResponse.json(
            { error: 'availableUntil must be a valid date' },
            { status: 400 }
          )
        }
        nextAvailableUntil = date.toISOString()
      } else {
        nextAvailableUntil = undefined
      }
    }
  }

  const effectiveFrom = hasAvailableFrom ? nextAvailableFrom : existing.availableFrom
  const effectiveUntil = hasAvailableUntil ? nextAvailableUntil : existing.availableUntil
  if (
    effectiveFrom &&
    effectiveUntil &&
    new Date(effectiveUntil).getTime() < new Date(effectiveFrom).getTime()
  ) {
    return NextResponse.json(
      { error: 'availableUntil must be after availableFrom' },
      { status: 400 }
    )
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
    timeLimitMinutes: hasTimeLimit ? nextTimeLimit ?? undefined : existing.timeLimitMinutes,
    availableFrom: hasAvailableFrom ? nextAvailableFrom : existing.availableFrom,
    availableUntil: hasAvailableUntil ? nextAvailableUntil : existing.availableUntil,
  })

  if (!updatedQuiz) return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  return NextResponse.json({ quiz: updatedQuiz, questions: savedQuestions })
}
