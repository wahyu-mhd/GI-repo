'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Grade, Stage, Subject } from '@/lib/mockData'

const STAGES: Stage[] = ['elementary', 'junior', 'senior']
const GRADES: Grade[] = [1,2,3,4,5,6,7,8,9,10,11,12]
const SUBJECTS: Subject[] = [
  'math',
  'english',
  'science',
  'indonesian',
  'physics',
  'chemistry',
  'biology',
  'others',
]

export default function TeacherNewCoursePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [stage, setStage] = useState<Stage>('elementary')
  const [grade, setGrade] = useState<Grade>(1)
  const [subject, setSubject] = useState<Subject>('math')
  const [teacherName, setTeacherName] = useState('Wahyu') // mock
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          stage,
          grade,
          subject,
          teacherName,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to create course')
      }

      await res.json()
      router.push('/teacher/courses')
    } catch (err) {
      console.error(err)
      setError('Could not create course. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="max-w-xl space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Create New Course</h1>
        <p className="text-sm text-slate-600">
          Saves to a temporary JSON file for now. We&apos;ll connect it to Supabase later.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-4 shadow-sm">
        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium">Course Title</label>
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="e.g. Math - Grade 3"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Description</label>
          <textarea
            className="w-full rounded border px-3 py-2 text-sm"
            rows={3}
            placeholder="Short summary of this course..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Stage</label>
            <select
              className="w-full rounded border px-2 py-2 text-sm"
              value={stage}
              onChange={(e) => setStage(e.target.value as Stage)}
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)} school
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Grade</label>
            <select
              className="w-full rounded border px-2 py-2 text-sm"
              value={grade}
              onChange={(e) => setGrade(Number(e.target.value) as Grade)}
            >
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Subject</label>
            <select
              className="w-full rounded border px-2 py-2 text-sm"
              value={subject}
              onChange={(e) => setSubject(e.target.value as Subject)}
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Teacher Name (mock)</label>
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            value={teacherName}
            onChange={(e) => setTeacherName(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? 'Creating...' : 'Create Course'}
        </button>
      </form>
    </section>
  )
}
