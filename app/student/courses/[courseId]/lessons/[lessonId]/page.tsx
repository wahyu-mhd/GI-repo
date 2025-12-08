import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCourseByIdFile } from '@/lib/courseFileStore'
import {
  getLessonByIdFile,
  getModuleByIdFile,
  getModulesByCourseFile,
} from '@/lib/moduleLessonFileStore'
import { LessonContent } from '@/components/lesson/LessonContent'

type Props = {
  params: { courseId: string; lessonId: string } | Promise<{ courseId: string; lessonId: string }>
}

export default async function LessonPage({ params }: Props) {
  // Support both plain params and promise-wrapped params (Turbopack can pass a thenable)
  const { courseId, lessonId } = await Promise.resolve(params)
  const course = await getCourseByIdFile(courseId)
  const lesson = await getLessonByIdFile(lessonId)

  if (!course || !lesson) return notFound()

  const modules = await getModulesByCourseFile(courseId)
  const module = lesson.moduleId ? await getModuleByIdFile(lesson.moduleId) : undefined
  const belongsToCourse = modules.some(m => m.id === lesson.moduleId)
  if (!belongsToCourse) return notFound()

  return (
    <article className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/student/courses/${course.id}`}
            className="text-xs text-blue-600 hover:underline"
          >
            Back to course
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{lesson.title}</h1>
          {module && (
            <p className="text-xs text-slate-500">
              Course: {course.title} | Module: {module.title}
            </p>
          )}
        </div>
      </div>

      {lesson.videoUrl && (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
          <iframe
            src={lesson.videoUrl.replace('watch?v=', 'embed/')}
            className="h-full w-full"
            allowFullScreen
          />
        </div>
      )}

      <div className="rounded-lg border bg-white p-4">
        <LessonContent content={lesson.content} />
      </div>

      {lesson.pdfUrl && (
        <a
          href={lesson.pdfUrl}
          target="_blank"
          className="inline-flex text-sm text-blue-600 hover:underline"
        >
          Download material (PDF)
        </a>
      )}
    </article>
  )
}
