import { NextResponse } from 'next/server'
import { getQuizByIdFile, readQuizSubmissions } from '@/lib/quizFileStore'
import { readUsers } from '@/lib/userStore'

export const runtime = 'nodejs'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const { quizId } = await params
  const quiz = await getQuizByIdFile(quizId)
  if (!quiz) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [submissions, users] = await Promise.all([readQuizSubmissions(), readUsers()])
  const userMap = new Map(users.map(u => [u.id, u]))

  const filtered = submissions
    .filter(s => s.quizId === quizId)
    .map(s => ({
      id: s.id,
      studentId: s.studentId,
      studentName: userMap.get(s.studentId)?.name ?? s.studentId,
      earned: s.earned,
      possible: s.possible,
      submittedAt: s.submittedAt,
    }))

  return NextResponse.json({ quiz, submissions: filtered })
}
