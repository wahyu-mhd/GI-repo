'use client'

import { useEffect, useMemo, useState } from 'react'

type User = { id: string; name: string }
type Enrollment = { id: string; courseId: string; studentId: string }
type Feedback = {
  id: string
  courseId: string
  studentId: string
  teacherName: string
  message: string
  createdAt: string
  read: boolean
}

type Props = {
  courseId: string
  teacherName: string
}

export function TeacherFeedbackPanel({ courseId, teacherName }: Props) {
  const [students, setStudents] = useState<User[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [studentsRes, enrollRes, feedbackRes] = await Promise.all([
          fetch('/api/superuser/students', { cache: 'no-store' }),
          fetch('/api/superuser/enrollments', { cache: 'no-store' }),
          fetch(`/api/feedback?courseId=${courseId}`, { cache: 'no-store' }),
        ])
        if (![studentsRes, enrollRes, feedbackRes].every(r => r.ok)) {
          throw new Error('Failed to load feedback data')
        }
        setStudents(await studentsRes.json())
        setEnrollments(await enrollRes.json())
        const list = (await feedbackRes.json()) as Feedback[]
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setFeedback(list)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Could not load feedback')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [courseId])

  const courseStudents = useMemo(() => {
    const ids = new Set(enrollments.filter(e => e.courseId === courseId).map(e => e.studentId))
    return students.filter(s => ids.has(s.id))
  }, [courseId, enrollments, students])

  const handleSubmit = async () => {
    if (!selectedStudentId || !message.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudentId,
          courseId,
          teacherName,
          message: message.trim(),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to send feedback')
      }
      const created = (await res.json()) as Feedback
      setFeedback(prev => [created, ...prev])
      setMessage('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not send feedback')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Feedback to students</h2>
        {loading && <span className="text-xs text-slate-500">Loading...</span>}
      </div>
      <p className="text-xs text-slate-500">
        Send a quick note to enrolled students. They will see it on their course page.
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          className="w-full rounded border px-3 py-2 text-sm"
          value={selectedStudentId}
          onChange={e => setSelectedStudentId(e.target.value)}
        >
          <option value="">Select student</option>
          {courseStudents.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          onClick={handleSubmit}
          disabled={saving || !selectedStudentId || !message.trim()}
        >
          {saving ? 'Sending...' : 'Send'}
        </button>
      </div>
      <textarea
        className="w-full rounded border px-3 py-2 text-sm"
        rows={3}
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="E.g., Focus on fractions practice; review last quiz mistakes."
      />

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700">Recent feedback</h3>
        {feedback.length === 0 && (
          <p className="text-xs text-slate-500">No feedback yet.</p>
        )}
        <div className="space-y-2">
          {feedback.slice(0, 5).map(item => {
            const student = students.find(s => s.id === item.studentId)
            return (
              <div key={item.id} className="rounded border p-3 text-sm bg-slate-50">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{student?.name ?? item.studentId}</span>
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-slate-800">{item.message}</p>
                <p className="text-xs text-slate-500 mt-1">From: {item.teacherName}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
