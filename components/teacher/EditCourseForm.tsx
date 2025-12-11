'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { Course } from '@/lib/mockData'

type Props = {
  course: Course
}

export function EditCourseForm({ course }: Props) {
  const t = useTranslations('teacher.courseDetail.edit')
  const router = useRouter()
  const [title, setTitle] = useState(course.title)
  const [description, setDescription] = useState(course.description)
  const [grade, setGrade] = useState(course.grade)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch(`/api/courses/${course.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          grade: Number(grade),
        }),
      })
      if (!res.ok) {
        const detail = await res.json().catch(() => null)
        throw new Error(detail?.error || t('updateError'))
      }
      setSuccess(true)
      router.refresh()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        {success && <span className="text-xs text-green-600">{t('saved')}</span>}
      </div>
      <p className="text-xs text-slate-500">
        {t('subtitle')}
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="space-y-3 text-sm">
        <div className="space-y-1">
          <label className="text-xs text-slate-600">{t('titleLabel')}</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-600">{t('descriptionLabel')}</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full rounded border px-3 py-2"
            rows={3}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-600">{t('gradeLabel')}</label>
          <input
            type="number"
            min={1}
            max={12}
            value={grade}
            onChange={e => setGrade(Number(e.target.value))}
            className="w-full rounded border px-3 py-2"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? t('saving') : t('save')}
        </button>
      </div>
    </div>
  )
}
