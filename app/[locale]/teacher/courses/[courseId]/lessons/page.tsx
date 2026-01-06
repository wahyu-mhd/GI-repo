'use client'
// app/teacher/courses/[courseId]/lessons/page.tsx

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/navigation'

type Course = { id: string; title: string }
type Module = { id: string; title: string }
type Lesson = { id: string; moduleId: string; title: string }

export default function TeacherLessonsPage() {
  const t = useTranslations('teacher.courseDetail.lessonsPage')
  const params = useParams<{ courseId: string }>()
  const courseId = params?.courseId

  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!courseId) return
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [coursesRes, modulesRes, lessonsRes] = await Promise.all([
          fetch('/api/courses', { cache: 'no-store' }),
          fetch(`/api/courses/${courseId}/modules?pruneEmpty=1`, { cache: 'no-store' }),
          fetch(`/api/courses/${courseId}/lessons`, { cache: 'no-store' }),
        ])

        if (!coursesRes.ok) throw new Error('Failed to load courses')
        if (!modulesRes.ok) throw new Error('Failed to load modules')
        if (!lessonsRes.ok) throw new Error('Failed to load lessons')

        const courses = (await coursesRes.json()) as Course[]
        const foundCourse = courses.find(c => c.id === courseId) ?? null
        if (!foundCourse) throw new Error('Course not found')
        setCourse(foundCourse)

        setModules((await modulesRes.json()) as Module[])
        setLessons((await lessonsRes.json()) as Lesson[])
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [courseId])

  const moduleById = useMemo(() => {
    return new Map(modules.map(module => [module.id, module]))
  }, [modules])

  const normalizedQuery = searchTerm.trim().toLowerCase()
  const filteredLessons = useMemo(() => {
    if (!normalizedQuery) return lessons
    return lessons.filter(lesson => {
      const moduleTitle = moduleById.get(lesson.moduleId)?.title ?? ''
      const searchableText = [lesson.title, moduleTitle]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return searchableText.includes(normalizedQuery)
    })
  }, [lessons, moduleById, normalizedQuery])

  const lessonsByModule = useMemo(() => {
    const grouped: { module: Module; lessons: Lesson[] }[] = []
    const modulesToShow = normalizedQuery
      ? modules.filter(m => filteredLessons.some(l => l.moduleId === m.id))
      : modules
    modulesToShow.forEach(m => {
      grouped.push({ module: m, lessons: filteredLessons.filter(l => l.moduleId === m.id) })
    })
    return grouped
  }, [filteredLessons, modules, normalizedQuery])

  const showSearch = modules.length > 0

  const handleDelete = async (id: string, moduleId: string) => {
    setDeletingId(id)
    setError(null)
    try {
      const res = await fetch(`/api/lessons/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete lesson')
      }
      setLessons(prev => {
        const next = prev.filter(l => l.id !== id)
        const stillHasLessons = next.some(l => l.moduleId === moduleId)
        if (!stillHasLessons) {
          setModules(curr => curr.filter(m => m.id !== moduleId))
        }
        return next
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not delete lesson')
    } finally {
      setDeletingId(null)
    }
  }

  if (!courseId) return <p>Missing course.</p>
  if (loading) return <p>Loading...</p>
  if (error) return <p>{error}</p>
  if (!course) return <p>Course not found.</p>

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-slate-600">{t('course', { title: course.title })}</p>
        </div>

        <Link
          href={`/teacher/courses/${courseId}/lessons/new`}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {t('add')}
        </Link>
      </div>

      {modules.length === 0 && (
        <p className="text-sm text-slate-500">{t('noModules')}</p>
      )}

      {showSearch && (
        <div className="rounded-lg border bg-white p-3">
          <label htmlFor="lesson-search" className="sr-only">
            {t('searchPlaceholder')}
          </label>
          <input
            id="lesson-search"
            type="search"
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      {showSearch && normalizedQuery && filteredLessons.length === 0 && (
        <p className="text-sm text-slate-500">{t('noResults')}</p>
      )}

      <div className="max-h-[60vh] space-y-6 overflow-y-auto pr-1">
        {lessonsByModule.map(({ module, lessons }) => (
          <div key={module.id} className="space-y-3">
            <h2 className="text-lg font-semibold">{t('moduleTitle', { title: module.title })}</h2>

            {lessons.length === 0 ? (
              <p className="text-sm text-slate-500">{t('noLessons')}</p>
            ) : (
              <div className="space-y-3">
                {lessons.map(lesson => (
                  <div
                    key={lesson.id}
                    className="flex flex-col gap-3 rounded-lg border bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium">{lesson.title}</h3>
                        <p className="text-xs text-slate-500">{t('moduleTitle', { title: module.title })}</p>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Link
                          href={`/teacher/courses/${courseId}/lessons/${lesson.id}/edit`}
                          className="text-blue-600 hover:underline"
                        >
                          {t('edit')}
                        </Link>

                        <button
                          className="text-red-600 hover:underline disabled:opacity-60"
                          onClick={() => handleDelete(lesson.id, module.id)}
                          disabled={deletingId === lesson.id}
                        >
                          {deletingId === lesson.id ? t('deleting') : t('delete')}
                        </button>
                      </div>
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
