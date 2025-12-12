// app/teacher/courses/[courseId]/page.tsx
// 'use client'

import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/navigation'
// import { mockCourses } from '@/lib/mockData'
import { getCourseByIdFile } from '@/lib/courseFileStore'
import { CourseAnnouncements } from '@/components/announcements/CourseAnnouncements'
import { EditCourseForm } from '@/components/teacher/EditCourseForm'
import { TeacherFeedbackPanel } from '@/components/teacher/TeacherFeedbackPanel'

export const dynamic = 'force-dynamic'

const currentTeacherName = 'Wahyu'
type Props = {
  params: Promise<{ courseId: string }>
}

export default async function TeacherCourseDetailPage({ params }: Props) {
//   const course = mockCourses.find((c) => c.id === params.courseId)
    const { courseId } = await params
    const t = await getTranslations('teacher.courseDetail')
    const course = await getCourseByIdFile(courseId)

    if (!course) return notFound()

    const stageLabels = {
        elementary: t('stage.elementary'),
        junior: t('stage.junior'),
        senior: t('stage.senior'),
    } as const

    const subjectLabels = {
        math: t('subject.math'),
        english: t('subject.english'),
        science: t('subject.science'),
        indonesian: t('subject.indonesian'),
        physics: t('subject.physics'),
        chemistry: t('subject.chemistry'),
        biology: t('subject.biology'),
        others: t('subject.others'),
    } as const

    return (
        <section className="space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-bold">{course.title}</h1>

                <p className="text-sm text-slate-600">
                    {t('meta', {
                        grade: course.grade,
                        stage: stageLabels[course.stage],
                        subject: subjectLabels[course.subject],
                    })}
                </p>

                <p className="mt-2 text-sm text-slate-700">{course.description}</p>
            </div>

            {/* Manage sections */}
            <div className="grid gap-4 md:grid-cols-2">
            {/* LESSON MANAGEMENT */}
            <div className="rounded-lg border bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold mb-3">{t('lessonsTitle')}</h2>
                <p className="text-sm text-slate-600 mb-4">{t('lessonsDesc')}</p>

                <Link
                href={`/teacher/courses/${course.id}/lessons`}
                className="inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                {t('manageLessons')}
                </Link>
            </div>

            {/* QUIZ MANAGEMENT */}
            <div className="rounded-lg border bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold mb-3">{t('quizzesTitle')}</h2>
                <p className="text-sm text-slate-600 mb-4">{t('quizzesDesc')}</p>

                <Link
                    href={`/teacher/courses/${course.id}/quizzes`}
                    className="inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                    {t('manageQuizzes')}
                </Link>
            </div>
            <div className="md:col-span-2">
              <EditCourseForm course={course} />
            </div>
            </div>

            <CourseAnnouncements
              courseId={course.id}
              viewerName={currentTeacherName}
              canCreate
            />

            <TeacherFeedbackPanel courseId={course.id} teacherName={currentTeacherName} />
        </section>
    )
}
