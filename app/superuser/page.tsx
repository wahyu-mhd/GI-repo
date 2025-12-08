'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { loadMockSession, clearMockSession, type SessionUser } from '@/lib/sessionMock'
import type { User, Enrollment } from '@/lib/userStore'
import type { Course } from '@/lib/mockData'

export default function SuperuserDashboardPage() {
  const [session, setSession] = useState<SessionUser | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [teachers, setTeachers] = useState<User[]>([])
  const [students, setStudents] = useState<User[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
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
  const [newUser, setNewUser] = useState<{ role: 'student' | 'teacher'; name: string; email: string; canManageStudents: boolean }>({
    role: 'student',
    name: '',
    email: '',
    canManageStudents: false,
  })

  useEffect(() => {
    setSession(loadMockSession())
    setHydrated(true)
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [teachersRes, studentsRes, enrollRes] = await Promise.all([
        fetch('/api/superuser/teachers', { cache: 'no-store' }),
        fetch('/api/superuser/students', { cache: 'no-store' }),
        fetch('/api/superuser/enrollments', { cache: 'no-store' }),
      ])
      const coursesRes = await fetch('/api/courses', { cache: 'no-store' })
      if (![teachersRes, studentsRes, enrollRes, coursesRes].every(r => r.ok)) {
        throw new Error('Failed to load data')
      }
      setTeachers(await teachersRes.json())
      setStudents(await studentsRes.json())
      setEnrollments(await enrollRes.json())
      setCourses(await coursesRes.json())
    } catch (err) {
      console.error(err)
      setError('Could not load superuser data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hydrated && session?.role === 'superuser') {
      loadData()
    }
  }, [hydrated, session])

  if (!hydrated) {
    return (
      <div className="max-w-xl mx-auto mt-10 rounded border bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-600">Loading...</p>
      </div>
    )
  }

  if (!session || session.role !== 'superuser') {
    return (
      <div className="max-w-xl mx-auto mt-10 rounded border bg-white p-4 shadow-sm">
        <p className="text-sm text-red-600">You must be logged in as a superuser to view this page.</p>
        <Link href="/auth/login?as=teacher" className="text-blue-600 text-sm hover:underline">
          Go to login
        </Link>
      </div>
    )
  }

  const handleToggle = async (id: string, value: boolean) => {
    setSavingToggle(id)
    try {
      const res = await fetch('/api/superuser/teachers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, canManageStudents: value }),
      })
      if (!res.ok) throw new Error('failed')
      await loadData()
    } catch (err) {
      console.error(err)
      setError('Could not update teacher permission.')
    } finally {
      setSavingToggle(null)
    }
  }

  const handleDeleteUser = async (id: string) => {
    setRemovingUser(id)
    try {
      const res = await fetch(`/api/superuser/users/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('failed')
      await loadData()
    } catch (err) {
      console.error(err)
      setError('Could not delete user.')
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: selectedCourse, studentId: selectedStudent }),
      })
      if (!res.ok) throw new Error('failed')
      setSelectedCourse('')
      setSelectedStudent('')
      await loadData()
    } catch (err) {
      console.error(err)
      setError('Could not add student to course.')
    } finally {
      setAddingEnrollment(false)
    }
  }

  const handleRemoveEnrollment = async (id: string) => {
    setRemovingEnrollment(id)
    try {
      const res = await fetch(`/api/superuser/enrollments/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('failed')
      await loadData()
    } catch (err) {
      console.error(err)
      setError('Could not remove enrollment.')
    } finally {
      setRemovingEnrollment(null)
    }
  }

  const handleDeleteCourse = async (id: string) => {
    setRemovingCourse(id)
    try {
      const res = await fetch(`/api/superuser/courses/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('failed')
      await loadData()
    } catch (err) {
      console.error(err)
      setError('Could not delete course.')
    } finally {
      setRemovingCourse(null)
    }
  }

  const filteredStudents = students.filter(s =>
    (s.name || '').toLowerCase().includes(studentQuery.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(studentQuery.toLowerCase())
  )

  const handleCreateUser = async () => {
    if (!newUser.name.trim()) {
      setError('Name is required')
      return
    }
    if (!newUser.email.trim()) {
      setError('Email is required')
      return
    }
    setCreatingUser(true)
    try {
      const res = await fetch('/api/superuser/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: newUser.role,
          name: newUser.name.trim(),
          email: newUser.email.trim() || undefined,
          canManageStudents: newUser.role === 'teacher' ? newUser.canManageStudents : undefined,
        }),
      })
      if (!res.ok) throw new Error('failed')
      setNewUser({ role: 'student', name: '', email: '', canManageStudents: false })
      await loadData()
    } catch (err) {
      console.error(err)
      setError('Could not create user.')
    } finally {
      setCreatingUser(false)
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Superuser Dashboard</h1>
          <p className="text-sm text-slate-600">Manage teachers, students, and enrollments.</p>
        </div>
        <button
          className="text-sm text-red-600 hover:underline"
          onClick={() => {
            clearMockSession()
            window.location.href = '/auth/login?as=teacher'
          }}
        >
          Logout
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Loading...</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold">Add user</h2>
          <p className="text-xs text-slate-500">
            Email is required so we can send a default password (students: student_randomnumber, teachers: teacher_randomnumber). Users should log in and change it immediately.
          </p>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={newUser.role === 'student'}
                  onChange={() => setNewUser(prev => ({ ...prev, role: 'student', canManageStudents: false }))}
                />
                Student
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={newUser.role === 'teacher'}
                  onChange={() => setNewUser(prev => ({ ...prev, role: 'teacher' }))}
                />
                Teacher
              </label>
            </div>
            <input
              type="text"
              className="rounded border px-3 py-2"
              placeholder="Full name"
              value={newUser.name}
              onChange={e => setNewUser(prev => ({ ...prev, name: e.target.value }))}
            />
          <input
            type="email"
            className="rounded border px-3 py-2"
            placeholder="Email (required)"
            value={newUser.email}
            onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
            required
          />
            {newUser.role === 'teacher' && (
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={newUser.canManageStudents}
                  onChange={e => setNewUser(prev => ({ ...prev, canManageStudents: e.target.checked }))}
                />
                Can manage students
              </label>
            )}
            <div className="flex justify-end">
                <button
                  className="rounded bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  onClick={handleCreateUser}
                  disabled={creatingUser || !newUser.name.trim() || !newUser.email.trim()}
                >
                  {creatingUser ? 'Creating...' : 'Create user'}
                </button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold">Teachers</h2>
          <p className="text-xs text-slate-500">
            Superusers can let teachers manage students; only superusers can grant/revoke that.
          </p>
          <div className="space-y-2 text-sm">
            {teachers.map(t => (
              <div key={t.id} className="flex items-center justify-between rounded border px-3 py-2">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-slate-500 capitalize">{t.role}</div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(t.canManageStudents)}
                      onChange={e => handleToggle(t.id, e.target.checked)}
                      disabled={savingToggle === t.id}
                    />
                    Can manage students
                  </label>
                  {t.role !== 'superuser' && (
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => handleDeleteUser(t.id)}
                      disabled={removingUser === t.id}
                    >
                      {removingUser === t.id ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {teachers.length === 0 && <p className="text-xs text-slate-500">No teachers found.</p>}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold">Students</h2>
          <div className="space-y-2 text-sm">
            {students.map(s => (
              <div key={s.id} className="flex items-center justify-between rounded border px-3 py-2">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-slate-500">{s.email}</div>
                </div>
                <button
                  className="text-red-600 text-xs hover:underline"
                  onClick={() => handleDeleteUser(s.id)}
                  disabled={removingUser === s.id}
                >
                  {removingUser === s.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            ))}
            {students.length === 0 && <p className="text-xs text-slate-500">No students found.</p>}
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold">Add student to course</h2>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            className="rounded border px-3 py-2 text-sm"
            placeholder="Search student by name or email"
            value={studentQuery}
            onChange={e => setStudentQuery(e.target.value)}
          />
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <select
            className="rounded border px-3 py-2 text-sm"
            value={selectedStudent}
            onChange={e => setSelectedStudent(e.target.value)}
          >
            <option value="">Select student</option>
            {filteredStudents.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select
            className="rounded border px-3 py-2 text-sm"
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
          >
            <option value="">Select course</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <button
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            onClick={handleEnroll}
            disabled={!selectedCourse || !selectedStudent || addingEnrollment}
          >
            {addingEnrollment ? 'Adding...' : 'Add'}
          </button>
        </div>
        </div>
        <div className="text-xs text-slate-500">
          Current enrollments: {enrollments.length}
        </div>
        <div className="space-y-2 text-sm">
          {enrollments.map(enroll => {
            const student = students.find(s => s.id === enroll.studentId)
            const course = courses.find(c => c.id === enroll.courseId)
            return (
              <div key={enroll.id} className="flex items-center justify-between rounded border px-3 py-2">
                <div>
                  <div className="font-medium">{student?.name ?? enroll.studentId}</div>
                  <div className="text-xs text-slate-500">{course?.title ?? enroll.courseId}</div>
                </div>
                <button
                  className="text-red-600 text-xs hover:underline"
                  onClick={() => handleRemoveEnrollment(enroll.id)}
                  disabled={removingEnrollment === enroll.id}
                >
                  {removingEnrollment === enroll.id ? 'Removing...' : 'Remove'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold">Courses & lessons</h2>
        <p className="text-xs text-slate-500">Superuser can view/manage lessons like teachers.</p>
        <div className="space-y-2 text-sm">
          {courses.map(c => (
            <div key={c.id} className="flex items-center justify-between rounded border px-3 py-2">
              <div>
                <div className="font-medium">{c.title}</div>
                <div className="text-xs text-slate-500">{c.description}</div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/teacher/courses/${c.id}/lessons`}
                  className="text-blue-600 text-xs hover:underline"
                >
                  Manage lessons
                </Link>
                <button
                  className="text-red-600 text-xs hover:underline"
                  onClick={() => handleDeleteCourse(c.id)}
                  disabled={removingCourse === c.id}
                >
                  {removingCourse === c.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
          {courses.length === 0 && <p className="text-xs text-slate-500">No courses.</p>}
        </div>
      </div>
    </section>
  )
}
