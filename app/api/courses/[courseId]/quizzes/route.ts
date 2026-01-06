import { NextResponse } from 'next/server'
import { addQuiz, addQuizQuestion, getQuizzesByCourseFile } from '@/lib/quizFileStore'

export const runtime = 'nodejs'

type IncomingQuestion = {
  text: string
  type: 'single' | 'multiple' | 'short' | 'long'
  choices?: string[]
  correctIndex?: number
  correctIndices?: number[]
  expectedAnswer?: string
  explanation?: string
  correctPoints?: number
  wrongPoints?: number
  skipPoints?: number
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
    const {courseId }= await params
  const quizzes = await getQuizzesByCourseFile(courseId)
  return NextResponse.json(quizzes)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
    const { courseId } = await params
  try {
    const body = (await req.json()) as {
      title?: string
      description?: string
      questions?: IncomingQuestion[]
      maxAttempts?: number
      timeLimitMinutes?: number
      availableFrom?: string
      availableUntil?: string
      showScoreToStudent?: boolean
      showCorrectAnswersToStudent?: boolean
    }
    if (!body.title || !body.questions?.length) {
      return NextResponse.json({ error: 'Missing title or questions' }, { status: 400 })
    }

    if (body.maxAttempts !== undefined) {
      const attempts = Number(body.maxAttempts)
      if (!Number.isFinite(attempts) || attempts < 1) {
        return NextResponse.json({ error: 'maxAttempts must be 1 or greater' }, { status: 400 })
      }
      body.maxAttempts = Math.floor(attempts)
    }

    if (body.timeLimitMinutes !== undefined) {
      const limit = Number(body.timeLimitMinutes)
      if (!Number.isFinite(limit) || limit < 1) {
        return NextResponse.json(
          { error: 'timeLimitMinutes must be 1 minute or greater' },
          { status: 400 }
        )
      }
      body.timeLimitMinutes = Math.floor(limit)
    }

    const normalizeDate = (value: string | undefined) => {
      if (value === undefined || value === null) return undefined
      const trimmed = String(value).trim()
      if (!trimmed) return undefined
      const date = new Date(trimmed)
      if (Number.isNaN(date.getTime())) return null
      return date.toISOString()
    }

    const normalizedAvailableFrom = normalizeDate(body.availableFrom)
    const normalizedAvailableUntil = normalizeDate(body.availableUntil)

    if (normalizedAvailableFrom === null) {
      return NextResponse.json({ error: 'availableFrom must be a valid date' }, { status: 400 })
    }
    if (normalizedAvailableUntil === null) {
      return NextResponse.json({ error: 'availableUntil must be a valid date' }, { status: 400 })
    }
    if (
      normalizedAvailableFrom &&
      normalizedAvailableUntil &&
      new Date(normalizedAvailableUntil).getTime() < new Date(normalizedAvailableFrom).getTime()
    ) {
      return NextResponse.json(
        { error: 'availableUntil must be after availableFrom' },
        { status: 400 }
      )
    }

    const quiz = await addQuiz({
      courseId: courseId,
      title: body.title,
      description: body.description,
      maxAttempts: body.maxAttempts,
      timeLimitMinutes: body.timeLimitMinutes,
      availableFrom: normalizedAvailableFrom,
      availableUntil: normalizedAvailableUntil,
      showScoreToStudent: body.showScoreToStudent ?? true,
      showCorrectAnswersToStudent: body.showCorrectAnswersToStudent ?? true,
    })

    await Promise.all(
      (body.questions ?? []).map(q =>
        addQuizQuestion({
          quizId: quiz.id,
          questionText: q.text,
          type: q.type,
          choices: q.choices,
          correctIndex: q.correctIndex,
          correctIndices: q.correctIndices,
          expectedAnswer: q.expectedAnswer,
          explanation: q.explanation?.trim() || undefined,
          correctPoints: q.correctPoints ?? 1,
          wrongPoints: q.wrongPoints ?? 0,
          skipPoints: q.skipPoints ?? 0,
        })
      )
    )

    return NextResponse.json(quiz, { status: 201 })
  } catch (err) {
    console.error('POST /api/courses/[courseId]/quizzes error', err)
    return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 })
  }
}
