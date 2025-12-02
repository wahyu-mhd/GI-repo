import { notFound } from 'next/navigation'
import Link from 'next/link'
import { readCourses } from '@/lib/courseFileStore'
import { mockModules, mockLessons, mockQuizzes } from '@/lib/mockData'

type Props = {
  params: { courseId: string }
}

export default async function StudentCourseDetailPage({ params }: Props) {
  const courses = await readCourses()
  const course = courses.find(c => c.id === params.courseId)
  if (!course) return notFound()

  const courseModules = mockModules
    .filter(m => m.courseId === course.id)
    .sort((a, b) => a.order - b.order)

  const quizzes = mockQuizzes.filter(q => q.courseId === course.id)

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <p className="mt-1 text-sm text-slate-700">{course.description}</p>
        <p className="mt-1 text-xs text-slate-500">Teacher: {course.teacherName}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
        <div className="space-y-3">
          <h2 className="font-semibold">Modules & Lessons</h2>
          {courseModules.map(module => {
            const lessons = mockLessons.filter(l => l.moduleId === module.id)
            return (
              <div key={module.id} className="rounded-lg border bg-white p-3">
                <h3 className="font-medium">{module.title}</h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {lessons.map(lesson => (
                    <li key={lesson.id}>
                      <Link
                        href={`/student/courses/${course.id}/lessons/${lesson.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {lesson.title}
                      </Link>
                    </li>
                  ))}
                  {lessons.length === 0 && (
                    <li className="text-xs text-slate-400">No lessons yet.</li>
                  )}
                </ul>
              </div>
            )
          })}
          {courseModules.length === 0 && (
            <p className="text-sm text-slate-500">No modules yet.</p>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold">Quizzes</h2>
          <div className="space-y-2">
            {quizzes.map(quiz => (
              <Link
                key={quiz.id}
                href={`/student/courses/${course.id}/quizzes/${quiz.id}`}
                className="block rounded-lg border bg-white p-3 text-sm hover:shadow-sm"
              >
                <div className="font-medium">{quiz.title}</div>
                {quiz.description && (
                  <p className="text-xs text-slate-600 mt-1">
                    {quiz.description}
                  </p>
                )}
              </Link>
            ))}
            {quizzes.length === 0 && (
              <p className="text-xs text-slate-400">No quizzes yet.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
