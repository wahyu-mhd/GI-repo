'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type Params = Promise<{ courseId: string; quizId: string }>

type SubmissionRow = {
  id: string
  studentId: string
  studentName: string
  earned: number
  possible: number
  submittedAt: string
}

type QuizSummary = {
  id: string
  title: string
  description?: string
}

export default function QuizSubmissionsPage({ params }: { params: Params }) {
  const { courseId, quizId } = use(params)
  const [quiz, setQuiz] = useState<QuizSummary | null>(null)
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/quizzes/${quizId}/submissions`, { cache: 'no-store' })
        if (res.status === 404) {
          setError('Not found')
          return
        }
        if (!res.ok) throw new Error('Failed to load submissions')
        const data = (await res.json()) as { quiz: QuizSummary; submissions: SubmissionRow[] }
        setQuiz(data.quiz)
        setSubmissions(data.submissions ?? [])
      } catch (err) {
        console.error(err)
        setError('Could not load submissions.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [quizId])

  if (error === 'Not found') return notFound()

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-slate-500">Quiz submissions</p>
          <h1 className="text-2xl font-bold">{quiz?.title || 'Quiz'}</h1>
          {quiz?.description && <p className="text-sm text-slate-600">{quiz.description}</p>}
        </div>
        <Link
          href={`/teacher/courses/${courseId}/quizzes`}
          className="text-blue-600 text-sm hover:underline"
        >
          Back to quizzes
        </Link>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading submissions...</p>}
      {error && error !== 'Not found' && <p className="text-sm text-red-600">{error}</p>}
      {!loading && submissions.length === 0 && (
        <p className="text-sm text-slate-500">No submissions yet.</p>
      )}

      <div className="space-y-2">
        {submissions.map(sub => (
          <div
            key={sub.id}
            className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm"
          >
            <div>
              <p className="font-semibold text-sm">{sub.studentName}</p>
              <p className="text-xs text-slate-500">{sub.studentId}</p>
              <p className="text-xs text-slate-500">Submitted: {sub.submittedAt}</p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="font-semibold">
                {sub.earned} / {sub.possible}
              </span>
              <Link
                href={`/teacher/students/${sub.studentId}/quizzes/${quizId}`}
                className="text-blue-600 text-xs hover:underline"
              >
                View details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
