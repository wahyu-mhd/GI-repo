import { notFound } from 'next/navigation'
import Link from 'next/link'
import { mockCourses, mockLessons, mockModules } from '@/lib/mockData'

type Props = {
  params: { courseId: string; lessonId: string }
}

export default function LessonPage({ params }: Props) {
  const course = mockCourses.find(c => c.id === params.courseId)
  const lesson = mockLessons.find(l => l.id === params.lessonId)

  if (!course || !lesson) return notFound()

  const module = mockModules.find(m => m.id === lesson.moduleId)

  return (
    <article className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/student/courses/${course.id}`}
            className="text-xs text-blue-600 hover:underline"
          >
            ← Back to course
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{lesson.title}</h1>
          {module && (
            <p className="text-xs text-slate-500">
              Course: {course.title} · Module: {module.title}
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
        <p className="whitespace-pre-line text-sm text-slate-800">
          {lesson.content}
        </p>
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
