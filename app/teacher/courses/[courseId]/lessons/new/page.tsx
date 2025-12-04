'use client'
// app/teacher/courses/[courseId]/lessons/new/page.tsx

import { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
// import { Course, Module } from '@/lib/mockData' // or define a local type
// import { createLesson } from '@/lib/db' // if you keep lessons in-memory

type Course = { id: string; title: string }
type Module = { id: string; title: string }

export default function NewLessonPage({ params }: { params: { courseId: string } }) {
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [title, setTitle] = useState('')
  const [modules, setModules] = useState<Module[]>([])
  const [moduleId, setModuleId] = useState('') 
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    const load = async () => {
        try {
        const [coursesRes, modulesRes] = await Promise.all([
            fetch('/api/courses', { cache: 'no-store' }),
            fetch(`/api/courses/${params.courseId}/modules`, { cache: 'no-store' }),
        ])
        const courses = await coursesRes.json()
        const modulesData = await modulesRes.json()
        const found = courses.find((c: Course) => c.id === params.courseId) ?? null
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
    }, [params.courseId])


  if (loading) return <p>Loading...</p>
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
      body: JSON.stringify({ moduleId, title, content }),
    })
    router.push(`/teacher/courses/${course.id}/lessons`)
  }

  return (
    <section className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Add Lesson</h1>
      <p className="text-sm text-slate-600">Course: {course.title}</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input className="w-full rounded border px-3 py-2 text-sm" value={title} onChange={e => setTitle(e.target.value)} placeholder="Lesson title" required />
        <textarea className="w-full rounded border px-3 py-2 text-sm" rows={4} value={content} onChange={e => setContent(e.target.value)} placeholder="Lesson content" />
        <button className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Save</button>
      </form>
    </section>
  )
}
