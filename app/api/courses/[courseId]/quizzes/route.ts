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
    }
    if (!body.title || !body.questions?.length) {
      return NextResponse.json({ error: 'Missing title or questions' }, { status: 400 })
    }

    const quiz = await addQuiz({
      courseId: courseId,
      title: body.title,
      description: body.description,
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
