'use client'

import { useState } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { mockCourses, mockQuizzes, mockQuizQuestions } from '@/lib/mockData'

type Props = {
  params: { courseId: string; quizId: string }
}

export default function QuizPage({ params }: Props) {
  const course = mockCourses.find(c => c.id === params.courseId)
  const quiz = mockQuizzes.find(q => q.id === params.quizId)

  if (!course || !quiz) return notFound()

  const questions = mockQuizQuestions.filter(q => q.quizId === quiz.id)

  const [answers, setAnswers] = useState<(number | null)[]>(
    questions.map(() => null)
  )
  const [submitted, setSubmitted] = useState(false)

  const handleSelect = (qIndex: number, choiceIndex: number) => {
    if (submitted) return
    setAnswers(prev => prev.map((a, i) => (i === qIndex ? choiceIndex : a)))
  }

  const handleSubmit = () => {
    setSubmitted(true)
  }

  const score =
    submitted
      ? questions.reduce((acc, q, idx) => {
          if (answers[idx] === q.correctIndex) return acc + 1
          return acc
        }, 0)
      : null

  return (
    <section className="space-y-4">
      <div>
        <Link
          href={`/student/courses/${course.id}`}
          className="text-xs text-blue-600 hover:underline"
        >
          ← Back to course
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{quiz.title}</h1>
        {quiz.description && (
          <p className="text-sm text-slate-700 mt-1">{quiz.description}</p>
        )}
      </div>

      <div className="space-y-4">
        {questions.map((q, qIndex) => (
          <div
            key={q.id}
            className="rounded-lg border bg-white p-4 space-y-2"
          >
            <p className="font-medium text-sm">
              {qIndex + 1}. {q.questionText}
            </p>
            <div className="space-y-1">
              {q.choices.map((choice, cIndex) => {
                const isSelected = answers[qIndex] === cIndex
                const isCorrect =
                  submitted && cIndex === q.correctIndex
                const isWrong =
                  submitted &&
                  isSelected &&
                  cIndex !== q.correctIndex

                return (
                  <button
                    key={cIndex}
                    type="button"
                    onClick={() => handleSelect(qIndex, cIndex)}
                    className={[
                      'block w-full text-left rounded border px-3 py-2 text-sm',
                      isSelected ? 'border-blue-500' : 'border-slate-200',
                      isCorrect ? 'bg-green-50 border-green-500' : '',
                      isWrong ? 'bg-red-50 border-red-500' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {choice}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {!submitted ? (
        <button
          type="button"
          onClick={handleSubmit}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white"
        >
          Submit Quiz
        </button>
      ) : (
        <p className="text-sm font-semibold">
          Your score: {score} / {questions.length}
        </p>
      )}
    </section>
  )
}
