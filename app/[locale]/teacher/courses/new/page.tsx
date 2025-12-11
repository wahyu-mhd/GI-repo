'use client'

import {FormEvent, useEffect, useMemo, useState} from 'react'
import {useTranslations} from 'next-intl'
import {useRouter} from '@/navigation'
import {Grade, Stage, Subject} from '@/lib/mockData'
import {loadMockSession} from '@/lib/sessionMock'

const STAGES: Stage[] = ['elementary', 'junior', 'senior']
const GRADES: Grade[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const SUBJECTS: Subject[] = [
  'math',
  'english',
  'science',
  'indonesian',
  'physics',
  'chemistry',
  'biology',
  'others'
]

export default function TeacherNewCoursePage() {
  const t = useTranslations('teacher.newCourse')
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [stage, setStage] = useState<Stage>('elementary')
  const [grade, setGrade] = useState<Grade>(1)
  const [subject, setSubject] = useState<Subject>('math')
  const [teacherName, setTeacherName] = useState('Wahyu') // mock
  const [teacherId, setTeacherId] = useState('user-teacher-1') // mock
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const session = loadMockSession()
    if (session?.role === 'teacher') {
      setTeacherId(session.id)
      setTeacherName(session.name)
    }
  }, [])

  const stageOptions = useMemo(
    () => ({
      elementary: t('stage.elementary'),
      junior: t('stage.junior'),
      senior: t('stage.senior')
    }),
    [t]
  )

  const subjectLabels = useMemo(
    () => ({
      math: t('subject.math'),
      english: t('subject.english'),
      science: t('subject.science'),
      indonesian: t('subject.indonesian'),
      physics: t('subject.physics'),
      chemistry: t('subject.chemistry'),
      biology: t('subject.biology'),
      others: t('subject.others')
    }),
    [t]
  )

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          title,
          description,
          stage,
          grade,
          subject,
          teacherId,
          teacherName
        })
      })

      if (!res.ok) {
        throw new Error('Failed to create course')
      }

      await res.json()
      router.push('/teacher/courses')
    } catch (err) {
      console.error(err)
      setError(t('createError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="max-w-xl space-y-4">
      <header>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-sm text-slate-600">{t('subtitle')}</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-4 shadow-sm">
        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium">{t('courseTitle')}</label>
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder={t('courseTitlePlaceholder')}
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">{t('description')}</label>
          <textarea
            className="w-full rounded border px-3 py-2 text-sm"
            rows={3}
            placeholder={t('descriptionPlaceholder')}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">{t('stage.label')}</label>
            <select
              className="w-full rounded border px-2 py-2 text-sm"
              value={stage}
              onChange={e => setStage(e.target.value as Stage)}
            >
              {STAGES.map(s => (
                <option key={s} value={s}>
                  {stageOptions[s]} {t('stage.suffix')}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">{t('grade.label')}</label>
            <select
              className="w-full rounded border px-2 py-2 text-sm"
              value={grade}
              onChange={e => setGrade(Number(e.target.value) as Grade)}
            >
              {GRADES.map(g => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">{t('subject.label')}</label>
            <select
              className="w-full rounded border px-2 py-2 text-sm"
              value={subject}
              onChange={e => setSubject(e.target.value as Subject)}
            >
              {SUBJECTS.map(s => (
                <option key={s} value={s}>
                  {subjectLabels[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">{t('teacherName')}</label>
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            value={teacherName}
            onChange={e => setTeacherName(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">{t('teacherId')}</label>
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            value={teacherId}
            onChange={e => setTeacherId(e.target.value)}
          />
          <p className="text-xs text-slate-500">{t('teacherIdHelp')}</p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? t('creating') : t('submit')}
        </button>
      </form>
    </section>
  )
}
