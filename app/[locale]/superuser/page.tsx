'use client'

import {useEffect, useMemo, useState} from 'react'
import {useTranslations} from 'next-intl'
import {Link} from '@/navigation'
import {loadMockSession, clearMockSession, type SessionUser} from '@/lib/sessionMock'
import type {User, Enrollment} from '@/lib/userStore'
import type {Course} from '@/lib/mockData'

export default function SuperuserDashboardPage() {
  const t = useTranslations('superuser')
  const [session, setSession] = useState<SessionUser | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [teachers, setTeachers] = useState<User[]>([])
  const [students, setStudents] = useState<User[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [siteSettings, setSiteSettings] = useState<{heroBadge: string} | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [studentQuery, setStudentQuery] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingToggle, setSavingToggle] = useState<string | null>(null)
  const [addingEnrollment, setAddingEnrollment] = useState(false)
  const [removingUser, setRemovingUser] = useState<string | null>(null)
  const [removingEnrollment, setRemovingEnrollment] = useState<string | null>(null)
  const [removingCourse, setRemovingCourse] = useState<string | null>(null)
  const [creatingUser, setCreatingUser] = useState(false)
  const [savingSite, setSavingSite] = useState(false)
  const [newUser, setNewUser] = useState<{
    role: 'student' | 'teacher'
    name: string
    email: string
    canManageStudents: boolean
  }>({
    role: 'student',
    name: '',
    email: '',
    canManageStudents: false
  })

  useEffect(() => {
    setSession(loadMockSession())
    setHydrated(true)
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [teachersRes, studentsRes, enrollRes, siteRes] = await Promise.all([
        fetch('/api/superuser/teachers', {cache: 'no-store'}),
        fetch('/api/superuser/students', {cache: 'no-store'}),
        fetch('/api/superuser/enrollments', {cache: 'no-store'}),
        fetch('/api/site', {cache: 'no-store'})
      ])
      const coursesRes = await fetch('/api/courses', {cache: 'no-store'})
      if (![teachersRes, studentsRes, enrollRes, coursesRes, siteRes].every(r => r.ok)) {
        throw new Error('Failed to load data')
      }
      setTeachers(await teachersRes.json())
      setStudents(await studentsRes.json())
      setEnrollments(await enrollRes.json())
      setCourses(await coursesRes.json())
      setSiteSettings(await siteRes.json())
    } catch (err) {
      console.error(err)
      setError(t('loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hydrated && session?.role === 'superuser') {
      loadData()
    }
  }, [hydrated, session, t])

  const filteredStudents = useMemo(
    () =>
      students.filter(
        s =>
          (s.name || '').toLowerCase().includes(studentQuery.toLowerCase()) ||
          (s.email || '').toLowerCase().includes(studentQuery.toLowerCase())
      ),
    [students, studentQuery]
  )

  const handleToggle = async (id: string, value: boolean) => {
    setSavingToggle(id)
    try {
      const res = await fetch('/api/superuser/teachers', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id, canManageStudents: value})
      })
      if (!res.ok) throw new Error('failed')
      await loadData()
    } catch (err) {
      console.error(err)
      setError(t('updateTeacherError'))
    } finally {
      setSavingToggle(null)
    }
  }

  const handleDeleteUser = async (id: string) => {
    setRemovingUser(id)
    try {
      const res = await fetch(`/api/superuser/users/${id}`, {method: 'DELETE'})
      if (!res.ok) throw new Error('failed')
      await loadData()
    } catch (err) {
      console.error(err)
      setError(t('deleteUserError'))
    } finally {
      setRemovingUser(null)
    }
  }

  const handleEnroll = async () => {
    if (!selectedCourse || !selectedStudent) return
    setAddingEnrollment(true)
    try {
      const res = await fetch('/api/superuser/enrollments', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({courseId: selectedCourse, studentId: selectedStudent})
      })
      if (!res.ok) throw new Error('failed')
      setSelectedCourse('')
      setSelectedStudent('')
      await loadData()
    } catch (err) {
      console.error(err)
      setError(t('addEnrollmentError'))
    } finally {
      setAddingEnrollment(false)
    }
  }

  const handleRemoveEnrollment = async (id: string) => {
    setRemovingEnrollment(id)
    try {
      const res = await fetch(`/api/superuser/enrollments/${id}`, {method: 'DELETE'})
      if (!res.ok) throw new Error('failed')
      await loadData()
    } catch (err) {
      console.error(err)
      setError(t('removeEnrollmentError'))
    } finally {
      setRemovingEnrollment(null)
    }
  }

  const handleDeleteCourse = async (id: string) => {
    setRemovingCourse(id)
    try {
      const res = await fetch(`/api/superuser/courses/${id}`, {method: 'DELETE'})
      if (!res.ok) throw new Error('failed')
      await loadData()
    } catch (err) {
      console.error(err)
      setError(t('deleteCourseError'))
    } finally {
      setRemovingCourse(null)
    }
  }

  const handleCreateUser = async () => {
    if (!newUser.name.trim()) {
      setError(t('nameRequired'))
      return
    }
    if (!newUser.email.trim()) {
      setError(t('emailRequired'))
      return
    }
    setCreatingUser(true)
    try {
      const res = await fetch('/api/superuser/users', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          role: newUser.role,
          name: newUser.name.trim(),
          email: newUser.email.trim() || undefined,
          canManageStudents: newUser.role === 'teacher' ? newUser.canManageStudents : undefined
        })
      })
      if (!res.ok) throw new Error('failed')
      setNewUser({role: 'student', name: '', email: '', canManageStudents: false})
      await loadData()
    } catch (err) {
      console.error(err)
      setError(t('createUserError'))
    } finally {
      setCreatingUser(false)
    }
  }

  const handleSaveSite = async () => {
    if (!siteSettings?.heroBadge.trim()) {
      setError(t('announcementRequired'))
      return
    }
    setSavingSite(true)
    setError(null)
    try {
      const res = await fetch('/api/site', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({heroBadge: siteSettings.heroBadge.trim()})
      })
      if (!res.ok) throw new Error('failed')
      setSiteSettings(await res.json())
    } catch (err) {
      console.error(err)
      setError(t('saveAnnouncementError'))
    } finally {
      setSavingSite(false)
    }
  }

  if (!hydrated) {
    return (
      <div className="max-w-xl mx-auto mt-10 rounded border bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-600">{t('loading')}</p>
      </div>
    )
  }

  if (!session || session.role !== 'superuser') {
    return (
      <div className="max-w-xl mx-auto mt-10 rounded border bg-white p-4 shadow-sm">
        <p className="text-sm text-red-600">{t('unauthorized')}</p>
        <Link href="/auth/login?as=teacher" className="text-blue-600 text-sm hover:underline">
          {t('loginLink')}
        </Link>
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-slate-600">{t('subtitle')}</p>
        </div>
        <button
          className="text-sm text-red-600 hover:underline"
          onClick={() => {
            clearMockSession()
            window.location.href = '/auth/login?as=teacher'
          }}
        >
          {t('logout')}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-slate-500">{t('loading')}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold">{t('addUserTitle')}</h2>
          <p className="text-xs text-slate-500">{t('addUserHelp')}</p>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={newUser.role === 'student'}
                  onChange={() =>
                    setNewUser(prev => ({...prev, role: 'student', canManageStudents: false}))
                  }
                />
                {t('roleStudent')}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={newUser.role === 'teacher'}
                  onChange={() => setNewUser(prev => ({...prev, role: 'teacher'}))}
                />
                {t('roleTeacher')}
              </label>
            </div>
            <input
              type="text"
              className="rounded border px-3 py-2"
              placeholder={t('namePlaceholder')}
              value={newUser.name}
              onChange={e => setNewUser(prev => ({...prev, name: e.target.value}))}
            />
            <input
              type="email"
              className="rounded border px-3 py-2"
              placeholder={t('emailPlaceholder')}
              value={newUser.email}
              onChange={e => setNewUser(prev => ({...prev, email: e.target.value}))}
              required
            />
            {newUser.role === 'teacher' && (
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={newUser.canManageStudents}
                  onChange={e =>
                    setNewUser(prev => ({...prev, canManageStudents: e.target.checked}))
                  }
                />
                {t('canManageStudents')}
              </label>
            )}
            <div className="flex justify-end">
              <button
                className="rounded bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                onClick={handleCreateUser}
                disabled={creatingUser || !newUser.name.trim() || !newUser.email.trim()}
              >
                {creatingUser ? t('creatingUser') : t('createUser')}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold">{t('teachersTitle')}</h2>
          <p className="text-xs text-slate-500">{t('teachersHelp')}</p>
          <div className="space-y-2 text-sm">
            {teachers.map(tchr => (
              <div
                key={tchr.id}
                className="flex items-center justify-between rounded border px-3 py-2"
              >
                <div>
                  <div className="font-medium">{tchr.name}</div>
                  <div className="text-xs text-slate-500 capitalize">{tchr.role}</div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(tchr.canManageStudents)}
                      onChange={e => handleToggle(tchr.id, e.target.checked)}
                      disabled={savingToggle === tchr.id}
                    />
                    {t('canManageStudents')}
                  </label>
                  {tchr.role !== 'superuser' && (
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => handleDeleteUser(tchr.id)}
                      disabled={removingUser === tchr.id}
                    >
                      {removingUser === tchr.id ? t('deleting') : t('delete')}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {teachers.length === 0 && <p className="text-xs text-slate-500">{t('noTeachers')}</p>}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold">{t('studentsTitle')}</h2>
          <div className="space-y-2 text-sm">
            {students.map(s => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded border px-3 py-2"
              >
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-slate-500">{s.email}</div>
                </div>
                <button
                  className="text-red-600 text-xs hover:underline"
                  onClick={() => handleDeleteUser(s.id)}
                  disabled={removingUser === s.id}
                >
                  {removingUser === s.id ? t('deleting') : t('delete')}
                </button>
              </div>
            ))}
            {students.length === 0 && <p className="text-xs text-slate-500">{t('noStudents')}</p>}
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold">{t('enrollTitle')}</h2>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            className="rounded border px-3 py-2 text-sm"
            placeholder={t('searchPlaceholder')}
            value={studentQuery}
            onChange={e => setStudentQuery(e.target.value)}
          />
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <select
              className="rounded border px-3 py-2 text-sm"
              value={selectedStudent}
              onChange={e => setSelectedStudent(e.target.value)}
            >
              <option value="">{t('selectStudent')}</option>
              {filteredStudents.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              className="rounded border px-3 py-2 text-sm"
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
            >
              <option value="">{t('selectCourse')}</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <button
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              onClick={handleEnroll}
              disabled={!selectedCourse || !selectedStudent || addingEnrollment}
            >
              {addingEnrollment ? t('adding') : t('add')}
            </button>
          </div>
        </div>
        <div className="text-xs text-slate-500">
          {t('currentEnrollments', {count: enrollments.length})}
        </div>
        <div className="space-y-2 text-sm">
          {enrollments.map(enroll => {
            const student = students.find(s => s.id === enroll.studentId)
            const course = courses.find(c => c.id === enroll.courseId)
            return (
              <div
                key={enroll.id}
                className="flex items-center justify-between rounded border px-3 py-2"
              >
                <div>
                  <div className="font-medium">{student?.name ?? enroll.studentId}</div>
                  <div className="text-xs text-slate-500">{course?.title ?? enroll.courseId}</div>
                </div>
                <button
                  className="text-red-600 text-xs hover:underline"
                  onClick={() => handleRemoveEnrollment(enroll.id)}
                  disabled={removingEnrollment === enroll.id}
                >
                  {removingEnrollment === enroll.id ? t('removing') : t('remove')}
                </button>
              </div>
            )
          })}
          {enrollments.length === 0 && (
            <p className="text-xs text-slate-500">{t('noEnrollments')}</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold">{t('announcementTitle')}</h2>
        <p className="text-xs text-slate-500">{t('announcementHelp')}</p>
        <input
          type="text"
          className="w-full rounded border px-3 py-2 text-sm"
          value={siteSettings?.heroBadge ?? ''}
          onChange={e => setSiteSettings(prev => ({heroBadge: e.target.value}))}
          placeholder={t('announcementPlaceholder')}
        />
        <div className="flex justify-end">
          <button
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            onClick={handleSaveSite}
            disabled={savingSite || !siteSettings?.heroBadge.trim()}
          >
            {savingSite ? t('saving') : t('saveAnnouncement')}
          </button>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold">{t('coursesTitle')}</h2>
        <p className="text-xs text-slate-500">{t('coursesHelp')}</p>
        <div className="space-y-2 text-sm">
          {courses.map(c => (
            <div key={c.id} className="flex items-center justify-between rounded border px-3 py-2">
              <div>
                <div className="font-medium">{c.title}</div>
                <div className="text-xs text-slate-500">{c.description}</div>
              </div>
              <div className="flex items-center gap-3">
                <Link href={`/teacher/courses/${c.id}/lessons`} className="text-blue-600 text-xs hover:underline">
                  {t('manageLessons')}
                </Link>
                <button
                  className="text-red-600 text-xs hover:underline"
                  onClick={() => handleDeleteCourse(c.id)}
                  disabled={removingCourse === c.id}
                >
                  {removingCourse === c.id ? t('deletingCourse') : t('deleteCourse')}
                </button>
              </div>
            </div>
          ))}
          {courses.length === 0 && <p className="text-xs text-slate-500">{t('noCourses')}</p>}
        </div>
      </div>
    </section>
  )
}
