import { notFound } from 'next/navigation'
import { getCourseByIdFile } from '@/lib/courseFileStore'
import { getQuizById } from '@/lib/db'

export default async function QuizPrintPage({
  params,
}: { params: Promise<{ courseId: string; quizId: string }> }) {
  const { courseId, quizId } = await params
  const course = await getCourseByIdFile(courseId)
  const quiz = getQuizById(quizId)
  if (!course || !quiz || quiz.courseId !== courseId) return notFound()

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold">{quiz.title}</h1>
      <p className="text-sm text-slate-600">Course: {course.title}</p>
      {/* render questions here */}
    </section>
  )
}
