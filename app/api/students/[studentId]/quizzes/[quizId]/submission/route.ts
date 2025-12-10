import { NextResponse } from 'next/server'
import {
  getQuizByIdFile,
  getQuestionsByQuizFile,
  getSubmissionByStudentAndQuiz,
  readQuizSubmissions,
  saveQuizSubmission,
} from '@/lib/quizFileStore'
import type { QuizSubmissionResponse } from '@/lib/mockData'

export const runtime = 'nodejs'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ studentId: string; quizId: string }> }
) {
  const { studentId, quizId } = await params
  const submission = await getSubmissionByStudentAndQuiz(studentId, quizId)
  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(submission)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ studentId: string; quizId: string }> }
) {
  const { studentId, quizId } = await params
  const body = (await req.json()) as Partial<{
    answers: Array<number | number[] | string | null>
    courseId: string
  }>

  if (!Array.isArray(body.answers)) {
    return NextResponse.json({ error: 'Answers are required' }, { status: 400 })
  }

  const quiz = await getQuizByIdFile(quizId)
  if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
  const questions = await getQuestionsByQuizFile(quizId)
  if (questions.length === 0) {
    return NextResponse.json({ error: 'Quiz has no questions' }, { status: 400 })
  }

  const now = Date.now()
  const opensAt = quiz.availableFrom ? new Date(quiz.availableFrom).getTime() : undefined
  const closesAt = quiz.availableUntil ? new Date(quiz.availableUntil).getTime() : undefined
  if (opensAt && now < opensAt) {
    return NextResponse.json({ error: 'This quiz is not open yet.' }, { status: 403 })
  }
  if (closesAt && now > closesAt) {
    return NextResponse.json({ error: 'This quiz is closed.' }, { status: 403 })
  }

  if (quiz.maxAttempts !== undefined) {
    const submissions = await readQuizSubmissions()
    const attempts = submissions.filter(
      s => s.quizId === quizId && s.studentId === studentId
    ).length
    if (attempts >= quiz.maxAttempts) {
      return NextResponse.json(
        { error: `Attempt limit reached (${quiz.maxAttempts})` },
        { status: 400 }
      )
    }
  }

  const responses: QuizSubmissionResponse[] = questions.map((q, idx) => {
    const raw = body.answers?.[idx]
    let selectedIndex: number | null | undefined
    let selectedIndices: number[] | undefined
    let answerText: string | undefined

    if (Array.isArray(raw)) {
      selectedIndices = raw.filter(v => typeof v === 'number') as number[]
    } else if (typeof raw === 'number') {
      selectedIndex = raw
    } else if (typeof raw === 'string') {
      answerText = raw.trim() || undefined
    } else {
      selectedIndex = null
    }

    let isCorrect = false
    if (q.type === 'single') {
      isCorrect = selectedIndex !== null && selectedIndex === q.correctIndex
    } else if (q.type === 'multiple') {
      const expected = q.correctIndices ?? []
      const picked = selectedIndices ?? []
      isCorrect =
        expected.length === picked.length && expected.every(id => picked.includes(id))
    } else {
      if (q.expectedAnswer) {
        isCorrect =
          (answerText ?? '').toLowerCase().trim() === q.expectedAnswer.toLowerCase().trim()
      } else {
        isCorrect = !!answerText
      }
    }

    return {
      questionId: q.id,
      questionText: q.questionText,
      type: q.type,
      selectedIndex,
      selectedIndices,
      answerText,
      isCorrect,
      correctIndex: q.correctIndex,
      correctIndices: q.correctIndices,
      choices: q.choices,
    }
  })

  const score = responses.reduce(
    (acc, res, idx) => {
      const q = questions[idx]
      const correctPoints = q.correctPoints ?? 1
      const wrongPoints = q.wrongPoints ?? 0
      const skipPoints = q.skipPoints ?? 0
      const answered =
        res.selectedIndex !== null && res.selectedIndex !== undefined
          ? true
          : res.selectedIndices?.length
          ? true
          : !!res.answerText
      const possible = acc.possible + correctPoints
      const earned = answered
        ? acc.earned + (res.isCorrect ? correctPoints : wrongPoints)
        : acc.earned + skipPoints
      return { earned, possible }
    },
    { earned: 0, possible: 0 }
  )

  const saved = await saveQuizSubmission({
    studentId,
    quizId,
    courseId: body.courseId ?? quiz.courseId,
    earned: score.earned,
    possible: score.possible,
    responses,
  })

  return NextResponse.json(saved, { status: 201 })
}
