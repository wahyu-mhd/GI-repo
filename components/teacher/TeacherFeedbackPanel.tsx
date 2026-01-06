'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'

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
  const t = useTranslations('teacher.courseDetail.feedback')
  const [students, setStudents] = useState<User[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

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
          throw new Error(t('loadError'))
        }
        setStudents(await studentsRes.json())
        setEnrollments(await enrollRes.json())
        const list = (await feedbackRes.json()) as Feedback[]
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setFeedback(list)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : t('loadError'))
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
  const studentById = useMemo(() => {
    return new Map(students.map(student => [student.id, student]))
  }, [students])
  const filteredFeedback = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()
    if (!normalized) return feedback
    return feedback.filter(item => {
      const studentName = studentById.get(item.studentId)?.name ?? ''
      const haystack = [
        studentName,
        item.studentId,
        item.message,
        item.teacherName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(normalized)
    })
  }, [feedback, searchTerm, studentById])

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
        throw new Error(data.error || t('sendError'))
      }
      const created = (await res.json()) as Feedback
      setFeedback(prev => [created, ...prev])
      setMessage('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('sendError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        {loading && <span className="text-xs text-slate-500">{t('loading')}</span>}
      </div>
      <p className="text-xs text-slate-500">{t('subtitle')}</p>
      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          className="w-full rounded border bg-white px-3 py-2 text-sm text-slate-900"
          value={selectedStudentId}
          onChange={e => setSelectedStudentId(e.target.value)}
        >
          <option value="">{t('select')}</option>
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
          {saving ? t('sending') : t('send')}
        </button>
      </div>
      <textarea
        className="w-full rounded border px-3 py-2 text-sm"
        rows={3}
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder={t('placeholder')}
      />

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700">{t('recent')}</h3>
        {feedback.length === 0 && (
          <p className="text-xs text-slate-500">{t('empty')}</p>
        )}
        {feedback.length > 0 && (
          <>
            <div className="max-w-md">
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchPlaceholder')}
              />
            </div>

            {filteredFeedback.length === 0 && (
              <p className="text-xs text-slate-500">{t('noResults')}</p>
            )}

            <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
              {filteredFeedback.map(item => {
                const student = studentById.get(item.studentId)
                return (
                  <div key={item.id} className="rounded border p-3 text-sm bg-slate-50">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>{student?.name ?? item.studentId}</span>
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-slate-800">{item.message}</p>
                    <p className="text-xs text-slate-500 mt-1">{t('from', { name: item.teacherName })}</p>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
