// 'use client'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { mockCourses } from '@/lib/mockData'
import { getQuizzesByCourse } from '@/lib/db'
import { getCourseByIdFile } from '@/lib/courseFileStore'

export default async function TeacherQuizzesPage({params}: {params: Promise<{ courseId: string }>}){
    const { courseId } = await params
    const course = await getCourseByIdFile(courseId)
    if (!course) return notFound()
    const quizzes = getQuizzesByCourse(course.id)
    return(
        <section className='space y-4'>
            <header className='flex items-center justify-between'>
                <div>
                    <h1 className='text-2xl font-bold'> Quizzes for {course.title}</h1>
                    <p className='text-sm text-slate-600'>
                        Create and Manage quizzes for this course
                    </p>
                </div>
                <Link
                    href={`/teacher/courses/${course.id}/quizzes/new`}
                    className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                    + New Quiz
                </Link>
            </header>

            {quizzes.length === 0 && (
                <p className="text-sm text-slate-500">
                No quizzes yet. Click &quot;New Quiz&quot; to create one.
                </p>
            )}
            <div className='space-y-3'>
                {quizzes.map(q => (
                    <div key= {q.id} className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm">
                        <div>
                            <h2 className='font-semibold text-sm'>{q.title}</h2>
                            {q.description && (
                                <p className='text-xs text-slate-600 mt-1'>
                                    {q.description}
                                </p>
                            )}
                        </div>
                        <div className='flex gap-3 text-xs'>
                            {/*print view, edit*/}
                            <Link href={`/teacher/courses/${course.id}/quizzes/${q.id}/print`} className='text-blue-600 hover:underline'>
                                View / Print
                            </Link>
                        </div>

                    </div>
                ))}
            </div>
        </section>
    )

}