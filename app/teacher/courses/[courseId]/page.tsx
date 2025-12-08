// app/teacher/courses/[courseId]/page.tsx
// 'use client'

import { notFound } from 'next/navigation'
import Link from 'next/link'
// import { mockCourses } from '@/lib/mockData'
import { getCourseByIdFile } from '@/lib/courseFileStore'
import { CourseAnnouncements } from '@/components/announcements/CourseAnnouncements'
import { EditCourseForm } from '@/components/teacher/EditCourseForm'

export const dynamic = 'force-dynamic'

const currentTeacherName = 'Wahyu'
type Props = {
  params: Promise<{ courseId: string }>
}

export default async function TeacherCourseDetailPage({ params }: Props) {
//   const course = mockCourses.find((c) => c.id === params.courseId)
    const { courseId } = await params
    const course = await getCourseByIdFile(courseId)

    if (!course) return notFound()

    return (
        <section className="space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-bold">{course.title}</h1>

                <p className="text-sm text-slate-600">
                    Grade {course.grade} | {course.stage.charAt(0).toUpperCase() + course.stage.slice(1)} School |{' '}
                    {course.subject.charAt(0).toUpperCase() + course.subject.slice(1)}
                </p>

                <p className="mt-2 text-sm text-slate-700">{course.description}</p>
            </div>

            {/* Manage sections */}
            <div className="grid gap-4 md:grid-cols-2">
            {/* LESSON MANAGEMENT */}
            <div className="rounded-lg border bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold mb-3">Lessons</h2>
                <p className="text-sm text-slate-600 mb-4">
                Add, remove, or edit lessons for this course.
                </p>

                <Link
                href={`/teacher/courses/${course.id}/lessons`}
                className="inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                Manage Lessons
                </Link>
            </div>

            {/* QUIZ MANAGEMENT */}
            <div className="rounded-lg border bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold mb-3">Quizzes</h2>
                <p className="text-sm text-slate-600 mb-4">
                    Create quizzes and questions for this course.
                </p>

                <Link
                    href={`/teacher/courses/${course.id}/quizzes`}
                    className="inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                    Manage Quizzes
                </Link>
            </div>
            </div>

            <CourseAnnouncements
              courseId={course.id}
              viewerName={currentTeacherName}
              canCreate
            />

            <EditCourseForm course={course} />
        </section>
    )
}
