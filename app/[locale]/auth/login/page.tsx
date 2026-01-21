'use client'

import {createClient} from '@/lib/supabase/client'

import {useState} from 'react'
import {useTranslations} from 'next-intl'
import {useRouter, useSearchParams} from 'next/navigation'
// import {saveMockSession} from '@/lib/sessionMock'

export default function LoginPage() {
  const t = useTranslations('auth.login')
  const params = useSearchParams()
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const initialRole = params.get('as') === 'student' ? 'student' : 'teacher'
  const [role, setRole] = useState<'student' | 'teacher' | 'superuser'>(
    initialRole === 'teacher' ? 'teacher' : 'student'
  )

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [resetStatus, setResetStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [resetMessage, setResetMessage] = useState('')


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
          onClick={async() => {
            // const session = {
            //   id:
            //     role === 'superuser'
            //       ? 'user-super-1'
            //       : role === 'teacher'
            //         ? 'user-teacher-1'
            //         : 'user-student-1',
            //   name:
            //     role === 'superuser'
            //       ? 'Super Admin'
            //       : role === 'teacher'
            //         ? 'Wahyu'
            //         : 'Student User',
            //   role
            // }
            // saveMockSession(session)

            // if (role === 'teacher') router.push('/teacher/courses')
            // else if (role === 'superuser') router.push('/superuser')
            // else router.push('/student/courses')
            setLoading(true)
            setLoginError(null)

            const { data: authData, error } = await supabase.auth.signInWithPassword({
              email: email.trim(),
              password,
            })

            setLoading(false)

            if (error) {
              setLoginError(error.message)
              return
            }

            const userId = authData.user?.id
            if (!userId) {
              setLoginError('Missing user id')
              return
            }
            
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', userId)
              .single()

            if (profileError) {
              setLoginError(profileError.message)
              return
            }

            if (role === 'teacher' && profile?.role !== 'teacher') {
              setLoginError('You must be logged in as a teacher to view this page.')
              return
            }
            if (role === 'superuser' && profile?.role !== 'superuser') {
              setLoginError('You must be logged in as a superuser to view this page.')
              return
            }
            const redirectTo = params.get('redirectTo')
            // if (redirectTo) {
            //   router.push(redirectTo)
            //   return
            // }
            const isSafeRedirect =
              redirectTo &&
              redirectTo.startsWith('/') &&
              !redirectTo.startsWith('//')

            if (isSafeRedirect) {
              router.push(redirectTo)
              return
            }
            
            if (profile?.role === 'superuser') {
              router.push('/superuser')
            } else if (profile?.role === 'teacher') {
              router.push('/teacher/courses')
            } else {
              router.push('/student/courses')
            }
            // // fallback after login; keep your current default
            // router.push('/teacher/courses')
          }}
          disabled={loading}
          className="w-full mt-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-sm"
        >
          {loading ? t('loading') : t('cta')}
        </button>
        {loginError && (
          <p className="text-xs text-rose-600">{loginError}</p>
        )}

      </div>

      <div className="mt-6 border-t pt-4">
        <h2 className="text-sm font-semibold text-slate-700">{t('forgotTitle')}</h2>
        <p className="text-xs text-slate-500 mt-1">{t('forgotHelp')}</p>
        <div className="mt-3 space-y-2">
          <input
            type="email"
            placeholder={t('forgotEmailPlaceholder')}
            className="w-full rounded border px-3 py-2 text-sm"
            value={resetEmail}
            onChange={e => setResetEmail(e.target.value)}
          />
          <button
            type="button"
            onClick={async () => {
              if (!resetEmail.trim()) {
                setResetStatus('error')
                setResetMessage(t('forgotError'))
                return
              }
              setResetStatus('sending')
              setResetMessage('')
              try {
                const res = await fetch('/api/auth/request-reset', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: resetEmail.trim() }),
                })
                if (!res.ok) {
                  throw new Error('reset failed')
                }
                setResetStatus('sent')
                setResetMessage(t('forgotSuccess'))
              } catch {
                setResetStatus('error')
                setResetMessage(t('forgotError'))
              }
            }}
            className="w-full bg-slate-900 text-white py-2 rounded hover:bg-slate-800 text-sm disabled:opacity-60"
            disabled={resetStatus === 'sending'}
          >
            {resetStatus === 'sending' ? t('forgotSending') : t('forgotCta')}
          </button>
          {resetMessage && (
            <p
              className={[
                'text-xs',
                resetStatus === 'sent' ? 'text-emerald-600' : 'text-rose-600',
              ].join(' ')}
            >
              {resetMessage}
            </p>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-4">{t('disclaimer')}</p>
    </div>
  )
}
