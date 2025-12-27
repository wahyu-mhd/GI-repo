'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

type Status = 'idle' | 'saving' | 'success' | 'error'

export default function TeacherSettingsPage() {
  const t = useTranslations('teacher.settings')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  return (
    <div className="max-w-lg rounded-lg border bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900">{t('title')}</h1>
      <p className="text-sm text-slate-600 mt-1">{t('subtitle')}</p>

      <div className="mt-5 space-y-3">
        <label className="text-xs font-semibold text-slate-600">
          {t('emailLabel')}
          <input
            type="email"
            className="mt-2 w-full rounded border px-3 py-2 text-sm"
            placeholder={t('emailPlaceholder')}
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </label>

        <label className="text-xs font-semibold text-slate-600">
          {t('currentPassword')}
          <input
            type="password"
            className="mt-2 w-full rounded border px-3 py-2 text-sm"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
          />
        </label>

        <label className="text-xs font-semibold text-slate-600">
          {t('newPassword')}
          <input
            type="password"
            className="mt-2 w-full rounded border px-3 py-2 text-sm"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
          />
        </label>

        <label className="text-xs font-semibold text-slate-600">
          {t('confirmPassword')}
          <input
            type="password"
            className="mt-2 w-full rounded border px-3 py-2 text-sm"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={async () => {
          if (!email.trim() || !currentPassword || !newPassword || !confirmPassword) {
            setStatus('error')
            setMessage(t('required'))
            return
          }
          if (newPassword !== confirmPassword) {
            setStatus('error')
            setMessage(t('mismatch'))
            return
          }
          setStatus('saving')
          setMessage('')
          try {
            const res = await fetch('/api/auth/change-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: email.trim(),
                currentPassword,
                newPassword,
              }),
            })
            if (!res.ok) {
              throw new Error('change failed')
            }
            setStatus('success')
            setMessage(t('success'))
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
          } catch {
            setStatus('error')
            setMessage(t('error'))
          }
        }}
        className="mt-5 w-full rounded bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        disabled={status === 'saving'}
      >
        {status === 'saving' ? t('saving') : t('submit')}
      </button>

      {message && (
        <p
          className={[
            'mt-3 text-xs',
            status === 'success' ? 'text-emerald-600' : 'text-rose-600',
          ].join(' ')}
        >
          {message}
        </p>
      )}
    </div>
  )
}
