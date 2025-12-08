'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { LessonContent } from '@/components/lesson/LessonContent'

type Course = { id: string; title: string }
type Module = { id: string; title: string }
type Lesson = { id: string; moduleId: string; title: string; content: string }

export default function EditLessonPage() {
  const router = useRouter()
  const params = useParams<{ courseId: string; lessonId: string }>()
  const courseId = params?.courseId
  const lessonId = params?.lessonId

  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [moduleId, setModuleId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!courseId || !lessonId) return
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [coursesRes, modulesRes, lessonRes] = await Promise.all([
          fetch('/api/courses', { cache: 'no-store' }),
          fetch(`/api/courses/${courseId}/modules`, { cache: 'no-store' }),
          fetch(`/api/lessons/${lessonId}`, { cache: 'no-store' }),
        ])

        if (!coursesRes.ok) throw new Error('Failed to load courses')
        if (!lessonRes.ok) throw new Error(lessonRes.status === 404 ? 'Lesson not found' : 'Failed to load lesson')

        const courses = await coursesRes.json()
        const lessonData = (await lessonRes.json()) as Lesson
        setLesson(lessonData)
        setTitle(lessonData.title)
        setContent(lessonData.content)
        setModuleId(lessonData.moduleId)

        const foundCourse = courses.find((c: Course) => c.id === courseId) ?? null
        setCourse(foundCourse)

        if (modulesRes.ok) {
          const modulesData = (await modulesRes.json()) as Module[]
          setModules(modulesData)
          if (!lessonData.moduleId && modulesData.length) {
            setModuleId(modulesData[0].id)
          }
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load lesson')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [courseId, lessonId])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!lessonId) return
    try {
      setSaving(true)
      const res = await fetch(`/api/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: moduleId || undefined,
          courseId,
          title,
          content,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update lesson')
      }
      router.push(`/teacher/courses/${courseId}/lessons`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save lesson')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p>{error}</p>
  if (!course) return <p>Course not found.</p>
  if (!lesson) return <p>Lesson not found.</p>

  return (
    <section className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Edit Lesson</h1>
      <p className="text-sm text-slate-600">Course: {course.title}</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Lesson title"
          required
        />
        <div className="space-y-1">
          <p className="text-sm font-medium">Module</p>
          {modules.length > 0 ? (
            <select
              className="w-full rounded border px-3 py-2 text-sm"
              value={moduleId}
              onChange={e => setModuleId(e.target.value)}
              required
            >
              {modules.map(m => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-slate-500">
              No modules yet. Saving will create a default "General" module for this course.
            </p>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Lesson Content</p>
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Write lesson content here. Paste a YouTube link to embed."
          />
        </div>
        <button
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
      <div className="rounded-lg border bg-white p-3 shadow-sm">
        <p className="text-xs font-semibold text-slate-500 mb-1">Preview</p>
        <LessonContent content={content} />
      </div>
    </section>
  )
}
