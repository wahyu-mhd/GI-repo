'use client'
// app/teacher/courses/[courseId]/lessons/new/page.tsx

import { useEffect, useState, FormEvent } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
// import { Course, Module } from '@/lib/mockData' // or define a local type
// import { createLesson } from '@/lib/db' // if you keep lessons in-memory

type Course = { id: string; title: string }
type Module = { id: string; title: string }

export default function NewLessonPage() {
  const router = useRouter()
  const params = useParams<{ courseId: string }>()
  const courseId = params?.courseId
  const [course, setCourse] = useState<Course | null>(null)
  const [title, setTitle] = useState('')
  const [modules, setModules] = useState<Module[]>([])
  const [moduleId, setModuleId] = useState('') 
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [creatingModule, setCreatingModule] = useState(false)

//   useEffect(() => {
//     const load = async () => {
//       try {
//         const res = await fetch('/api/courses', { cache: 'no-store' })
//         const courses = (await res.json()) as Course[]
//         setCourse(courses.find(c => c.id === params.courseId) ?? null)
//       } catch {
//         setError('Failed to load course')
//       } finally {
//         setLoading(false)
//       }
//     }
//     load()
//   }, [params.courseId])
    useEffect(() => {
    if (!courseId) return
    const load = async () => {
        try {
        const [coursesRes, modulesRes] = await Promise.all([
            fetch('/api/courses', { cache: 'no-store' }),
            fetch(`/api/courses/${courseId}/modules`, { cache: 'no-store' }),
        ])
        const courses = await coursesRes.json()
        const modulesData = await modulesRes.json()
        const found = courses.find((c: Course) => c.id === courseId) ?? null
        setCourse(found)
        setModules(modulesData)
        if (modulesData.length) setModuleId(modulesData[0].id)
        } catch {
        setError('Failed to load course/modules')
        } finally {
        setLoading(false)
        }
    }
    load()
    }, [courseId])

  const handleCreateModule = async () => {
    if (!newModuleTitle.trim() || !courseId) return
    setCreatingModule(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newModuleTitle.trim() }),
      })
      if (!res.ok) throw new Error('Failed to create module')
      const created: Module = await res.json()
      setModules(prev => [...prev, created])
      setModuleId(created.id)
      setNewModuleTitle('')
    } catch {
      setError('Could not create module. Please try again.')
    } finally {
      setCreatingModule(false)
    }
  }


  if (loading || !courseId) return <p>Loading...</p>
  if (error) return <p>{error}</p>
  if (!course) return <p>Course not found.</p>

//   const handleSubmit = (e: FormEvent) => {
//     e.preventDefault()
//     // createLesson expects a moduleId, so adapt to your data model;
//     // if you add an API, call it here instead
//     createLesson({ moduleId: 'module-1', title, content })
//     router.push(`/teacher/courses/${course.id}/lessons`)
//   }
    const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await fetch('/api/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moduleId: moduleId || undefined,
        courseId,
        title,
        content,
      }),
    })
    router.push(`/teacher/courses/${course.id}/lessons`)
  }

  return (
    <section className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Add Lesson</h1>
      <p className="text-sm text-slate-600">Course: {course.title}</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input className="w-full rounded border px-3 py-2 text-sm" value={title} onChange={e => setTitle(e.target.value)} placeholder="Lesson title" required />
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
        <div className="space-y-2 rounded border p-3">
          <p className="text-xs font-medium text-slate-700">Create a new module</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              className="w-full rounded border px-3 py-2 text-sm"
              value={newModuleTitle}
              onChange={e => setNewModuleTitle(e.target.value)}
              placeholder="Module title (e.g., Fractions, Grammar Basics)"
            />
            <button
              type="button"
              className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              onClick={handleCreateModule}
              disabled={creatingModule || !newModuleTitle.trim()}
            >
              {creatingModule ? 'Creating...' : 'Add module'}
            </button>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Lesson Content</p>
          <RichTextEditor value={content} onChange={setContent} placeholder="Write lesson content here. Paste a YouTube link to embed." />
        </div>
        <button className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Save</button>
      </form>
    </section>
  )
}
