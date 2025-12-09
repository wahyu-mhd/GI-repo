import { notFound } from 'next/navigation'
import { getCourseByIdFile } from '@/lib/courseFileStore'
import { getQuizByIdFile, getQuestionsByQuizFile } from '@/lib/quizFileStore'
import { PrintButton } from '@/components/teacher/PrintButton'
import { LessonContent } from '@/components/lesson/LessonContent'

function lexicalJsonToPlainText(raw: string | undefined): string {
  if (!raw) return ''
  try {
    const parsed = JSON.parse(raw) as { root?: { children?: any[] } }
    const visit = (node: any): string => {
      if (!node) return ''
      if (typeof node.text === 'string') return node.text
      if (Array.isArray(node.children)) return node.children.map(visit).join('')
      return ''
    }
    const rootChildren = parsed.root?.children ?? []
    return rootChildren.map(visit).join('\n').trim()
  } catch {
    return raw
  }
}

export default async function QuizPrintPage({
  params,
}: { params: Promise<{ courseId: string; quizId: string }> }) {
  const { courseId, quizId } = await params
  const course = await getCourseByIdFile(courseId)
  const quiz = await getQuizByIdFile(quizId)
  if (!course || !quiz || quiz.courseId !== courseId) return notFound()
  const questions = await getQuestionsByQuizFile(quizId)

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">{quiz.title}</h1>
          <p className="text-sm text-slate-600">Course: {course.title}</p>
          {quiz.description && (
            <p className="text-sm text-slate-700 mt-1">{quiz.description}</p>
          )}
        </div>
        <PrintButton />
      </div>

      {questions.length === 0 ? (
        <p className="text-sm text-slate-500">No questions for this quiz yet.</p>
      ) : (
        <ol className="space-y-4 list-decimal pl-4">
          {questions.map(q => (
            <li key={q.id} className="space-y-2">
              <div className="font-medium whitespace-pre-wrap">
                {lexicalJsonToPlainText(q.questionText)}
              </div>
              {q.type === 'single' || q.type === 'multiple' ? (
                <ul className="space-y-1 list-disc pl-5 text-sm">
                  {(q.choices ?? []).map((choice, cIdx) => {
                    const isCorrect =
                      q.type === 'single'
                        ? q.correctIndex === cIdx
                        : q.correctIndices?.includes(cIdx)
                    return (
                      <li key={cIdx} className={isCorrect ? 'font-semibold' : ''}>
                        {choice}
                        {isCorrect ? ' (correct)' : ''}
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <div className="text-sm text-slate-600 space-y-1">
                  <p className="font-semibold">Expected answer:</p>
                  {q.expectedAnswer ? (
                    <LessonContent content={q.expectedAnswer} />
                  ) : (
                    <p className="text-slate-500">N/A</p>
                  )}
                </div>
              )}
              {q.explanation && (
                <div className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded p-2 space-y-1">
                  <p className="font-semibold">Explanation:</p>
                  <LessonContent content={q.explanation} />
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
