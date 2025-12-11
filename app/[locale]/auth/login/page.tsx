'use client'

import {useState} from 'react'
import {useTranslations} from 'next-intl'
import {useRouter, useSearchParams} from 'next/navigation'
import {saveMockSession} from '@/lib/sessionMock'

export default function LoginPage() {
  const t = useTranslations('auth.login')
  const params = useSearchParams()
  const router = useRouter()
  const initialRole = params.get('as') === 'student' ? 'student' : 'teacher'
  const [role, setRole] = useState<'student' | 'teacher' | 'superuser'>(
    initialRole === 'teacher' ? 'teacher' : 'student'
  )

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className="max-w-md mx-auto mt-16 p-6 rounded-lg border bg-white shadow-sm">
      <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
      <p className="text-sm text-slate-600 mb-4">
        {role === 'superuser'
          ? t('asSuperuser')
          : role === 'teacher'
            ? t('asTeacher')
            : t('asStudent')}
      </p>

      {initialRole === 'teacher' && (
        <div className="mb-3 flex gap-3 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={role === 'teacher'}
              onChange={() => setRole('teacher')}
            />
            {t('teacher')}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={role === 'superuser'}
              onChange={() => setRole('superuser')}
            />
            {t('superuser')}
          </label>
        </div>
      )}

      <div className="space-y-3">
        <input
          type="email"
          placeholder={t('email')}
          className="w-full rounded border px-3 py-2 text-sm"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder={t('password')}
          className="w-full rounded border px-3 py-2 text-sm"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        {/* TEMPORARY: Mock login until Supabase is wired */}
        <button
          onClick={() => {
            const session = {
              id:
                role === 'superuser'
                  ? 'user-super-1'
                  : role === 'teacher'
                    ? 'user-teacher-1'
                    : 'user-student-1',
              name:
                role === 'superuser'
                  ? 'Super Admin'
                  : role === 'teacher'
                    ? 'Wahyu'
                    : 'Student User',
              role
            }
            saveMockSession(session)

            if (role === 'teacher') router.push('/teacher/courses')
            else if (role === 'superuser') router.push('/superuser')
            else router.push('/student/courses')
          }}
          className="w-full mt-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-sm"
        >
          {t('cta')}
        </button>
      </div>

      <p className="text-xs text-slate-500 mt-4">{t('disclaimer')}</p>
    </div>
  )
}
