// 'use client'

import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/navigation'
import { getQuizzesByCourseFile } from '@/lib/quizFileStore'
import { getCourseByIdFile } from '@/lib/courseFileStore'
import { TeacherQuizList } from '@/components/teacher/TeacherQuizList'

export const dynamic = 'force-dynamic'

export default async function TeacherQuizzesPage({
  params
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const t = await getTranslations('teacher.courseDetail.quizzesPage')
  const course = await getCourseByIdFile(courseId)
  if (!course) return notFound()
  const quizzes = await getQuizzesByCourseFile(course.id)
  return (
    <section className="space y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {t('title', { course: course.title })}
          </h1>
          <p className="text-sm text-slate-600">{t('subtitle')}</p>
        </div>
        <Link
          href={`/teacher/courses/${course.id}/quizzes/new`}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {t('create')}
        </Link>
      </header>
      <TeacherQuizList courseId={course.id} quizzes={quizzes} />
    </section>
  )
}
