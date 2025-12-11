'use client'

import {useEffect, useState} from 'react'
import {useTranslations} from 'next-intl'
import {Link} from '@/navigation'
import {Course} from '@/lib/mockData'
import {loadMockSession} from '@/lib/sessionMock'

const currentTeacher = {id: 'user-teacher-1', name: 'Wahyu'}

export default function TeacherCoursesPage() {
  const t = useTranslations('teacher.courses')
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/courses', {cache: 'no-store'})
        if (!res.ok) throw new Error('Failed to load courses')
        const data = (await res.json()) as Course[]
        setCourses(data)
      } catch (err) {
        console.error(err)
        setError(t('loadError'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [t])

  const session = loadMockSession()
  const isSuperuser = session?.role === 'superuser'
  const teacherName = session?.name ?? currentTeacher.name
  const teacherId = session?.id ?? currentTeacher.id

  const myCourses = isSuperuser
    ? courses
    : courses.filter(c => c.teacherId === teacherId)

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-slate-600">
            {t('loggedIn', {name: teacherName, id: teacherId})}{' '}
            {isSuperuser && <span className="text-green-600">{t('superuserTag')}</span>}
          </p>
        </div>
        <Link
          href="/teacher/courses/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + {t('create')}
        </Link>
      </header>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading && !error && (
        <p className="text-sm text-slate-500">{t('loading')}</p>
      )}

      {!loading && !error && myCourses.length === 0 && (
        <p className="text-sm text-slate-500">{t('empty')}</p>
      )}

      <div className="space-y-3">
        {myCourses.map(course => (
          <Link
            key={course.id}
            href={`/teacher/courses/${course.id}`}
            className="block rounded-lg border bg-white p-4 text-sm shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold">{course.title}</h2>
                <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                  {course.description}
                </p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <div>{t('gradeLabel', {grade: course.grade})}</div>
                <div className="capitalize">{course.stage}</div>
                <div className="capitalize">{course.subject}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
