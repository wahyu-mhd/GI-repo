// app/teacher/courses/[courseId]/lessons/page.tsx

import { notFound } from "next/navigation"
import Link from "next/link"
import { mockCourses, mockModules, mockLessons } from "@/lib/mockData"

type Props = {
  params: { courseId: string }
}

export default function TeacherLessonsPage({ params }: Props) {
  const { courseId } = params

  const course = mockCourses.find(c => c.id === courseId)
  if (!course) return notFound()

  // Get modules under this course
  const modules = mockModules
    .filter(m => m.courseId === courseId)
    .sort((a, b) => a.order - b.order)

  // Get lessons for the course
  const lessonsByModule = modules.map(module => {
    const lessons = mockLessons.filter(l => l.moduleId === module.id)
    return { module, lessons }
  })

  return (
    <section className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Lessons</h1>
          <p className="text-sm text-slate-600">
            Course: <strong>{course.title}</strong>
          </p>
        </div>

        <Link
          href={`/teacher/courses/${courseId}/lessons/new`}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add Lesson
        </Link>
      </div>

      {/* No modules case */}
      {modules.length === 0 && (
        <p className="text-sm text-slate-500">
          No modules found. Add modules first before adding lessons.
        </p>
      )}

      {/* Lessons grouped by module */}
      <div className="space-y-6">
        {lessonsByModule.map(({ module, lessons }) => (
          <div key={module.id} className="space-y-3">
            <h2 className="text-lg font-semibold">
              Module: {module.title}
            </h2>

            {lessons.length === 0 ? (
              <p className="text-sm text-slate-500">No lessons yet.</p>
            ) : (
              <div className="space-y-3">
                {lessons.map(lesson => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm"
                  >
                    <div>
                      <h3 className="font-medium">{lesson.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 max-w-md">
                        {lesson.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <Link
                        href={`/teacher/courses/${courseId}/lessons/${lesson.id}/edit`}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>

                      <button
                        className="text-red-600 hover:underline"
                        onClick={() => alert("Delete (mock)")}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
