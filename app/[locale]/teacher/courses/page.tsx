'use client'

import {useEffect, useMemo, useState} from 'react'
import {useTranslations} from 'next-intl'
import {Link, useRouter} from '@/navigation'
import {Course} from '@/lib/mockData'
import {createClient} from '@/lib/supabase/client'

export default function TeacherCoursesPage() {
  const t = useTranslations('teacher.courses')
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [teacherName, setTeacherName] = useState<string>('')
  const [teacherId, setTeacherId] = useState<string>('')
  const [isSuperuser, setIsSuperuser] = useState(false)

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

  useEffect(() => {
    const loadAuth = async () => {
      const {data: {user}, error: userError} = await supabase.auth.getUser()

      if (userError || !user) {
        setAuthError('Please log in as a teacher.')
        router.push('/auth/login?as=teacher&redirectTo=/teacher/courses')
        setAuthLoading(false)
        return
      }

      const {data: profile, error: profileError} = await supabase
        .from('profiles')
        .select('id, display_name, role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        setAuthError(profileError.message)
        setAuthLoading(false)
        return
      }

      if (!profile || (profile.role !== 'teacher' && profile.role !== 'superuser')) {
        setAuthError('You must be logged in as a teacher to view this page.')
        setAuthLoading(false)
        return
      }

      setTeacherId(profile.id)
      setTeacherName(profile.display_name ?? '')
      setIsSuperuser(profile.role === 'superuser')
      setAuthLoading(false)
    }

    loadAuth()
  }, [router, supabase])

  const myCourses = isSuperuser
    ? courses
    : courses.filter(c => c.teacherId === teacherId)
  const normalizedQuery = searchTerm.trim().toLowerCase()
  const filteredCourses = normalizedQuery
    ? myCourses.filter(course => {
        const searchableText = [
          course.title,
          course.description,
          course.subject,
          course.stage,
          `grade ${course.grade}`
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return searchableText.includes(normalizedQuery)
      })
    : myCourses
  const showSearch = !loading && !error && !authLoading && !authError && myCourses.length > 0

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-slate-600">
            {authLoading
              ? t('loading')
              : t('loggedIn', {name: teacherName, id: teacherId})}{' '}
            {!authLoading && isSuperuser && (
              <span className="text-green-600">{t('superuserTag')}</span>
            )}
          </p>
        </div>
        <Link
          href="/teacher/courses/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + {t('create')}
        </Link>
      </header>

      {authError && <p className="text-sm text-red-600">{authError}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading && !error && (
        <p className="text-sm text-slate-500">{t('loading')}</p>
      )}

      {!loading && !error && myCourses.length === 0 && (
        <p className="text-sm text-slate-500">{t('empty')}</p>
      )}

      {showSearch && (
        <div className="rounded-lg border bg-white p-3">
          <label htmlFor="course-search" className="sr-only">
            {t('searchPlaceholder')}
          </label>
          <input
            id="course-search"
            type="search"
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      {!loading && !error && showSearch && filteredCourses.length === 0 && (
        <p className="text-sm text-slate-500">{t('noResults')}</p>
      )}

      <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
        {filteredCourses.map(course => (
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
