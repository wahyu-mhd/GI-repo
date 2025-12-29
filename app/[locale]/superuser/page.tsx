'use client'

import {useEffect, useMemo, useState} from 'react'
import {useTranslations} from 'next-intl'
import {Link} from '@/navigation'
import {loadMockSession, clearMockSession, type SessionUser} from '@/lib/sessionMock'
import type {User, Enrollment} from '@/lib/userStore'
import type {Course} from '@/lib/mockData'
import type {CourseTeacher} from '@/lib/courseTeacherStore'
import type {NewsItem} from '@/lib/newsFileStore'
import {RichTextEditor} from '@/components/editor/RichTextEditor'

export default function SuperuserDashboardPage() {
  const t = useTranslations('superuser')
  const [session, setSession] = useState<SessionUser | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [teachers, setTeachers] = useState<User[]>([])
  const [students, setStudents] = useState<User[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [courseQuery, setCourseQuery] = useState<string>('')
  const [courseTeachers, setCourseTeachers] = useState<CourseTeacher[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [selectedCourseForTeacher, setSelectedCourseForTeacher] = useState<string>('')
  const [selectedTeacherForCourse, setSelectedTeacherForCourse] = useState<string>('')
  const [studentQuery, setStudentQuery] = useState<string>('')
  const [userQuery, setUserQuery] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingToggle, setSavingToggle] = useState<string | null>(null)
  const [addingEnrollment, setAddingEnrollment] = useState(false)
  const [removingUser, setRemovingUser] = useState<string | null>(null)
  const [removingEnrollment, setRemovingEnrollment] = useState<string | null>(null)
  const [removingCourse, setRemovingCourse] = useState<string | null>(null)
  const [addingCourseTeacher, setAddingCourseTeacher] = useState(false)
  const [removingCourseTeacher, setRemovingCourseTeacher] = useState<string | null>(null)
  const [creatingUser, setCreatingUser] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [savingUser, setSavingUser] = useState(false)
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [newsForm, setNewsForm] = useState<{
    title: string
    excerpt: string
    image: string
    href: string
    tag: string
    date: string
    content: string
  }>({
    title: '',
    excerpt: '',
    image: '/globe.svg',
    href: '',
    tag: '',
    date: '',
    content: '',
  })
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null)
  const [savingNews, setSavingNews] = useState(false)
  const [removingNews, setRemovingNews] = useState<string | null>(null)
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
      const [teachersRes, studentsRes, enrollRes, courseTeachersRes, newsRes] = await Promise.all([
        fetch('/api/superuser/teachers', {cache: 'no-store'}),
        fetch('/api/superuser/students', {cache: 'no-store'}),
        fetch('/api/superuser/enrollments', {cache: 'no-store'}),
        fetch('/api/superuser/course-teachers', {cache: 'no-store'}),
        fetch('/api/superuser/news', {cache: 'no-store'}),
      ])
      const coursesRes = await fetch('/api/courses', {cache: 'no-store'})
      if (![teachersRes, studentsRes, enrollRes, coursesRes, courseTeachersRes, newsRes].every(r => r.ok)) {
        throw new Error('Failed to load data')
      }
      setTeachers(await teachersRes.json())
      setStudents(await studentsRes.json())
      setEnrollments(await enrollRes.json())
      setCourses(await coursesRes.json())
      setCourseTeachers(await courseTeachersRes.json())
      setNewsItems(await newsRes.json())
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

  const filteredStudentsForEnroll = useMemo(
    () =>
      students.filter(
        s =>
          (s.name || '').toLowerCase().includes(studentQuery.toLowerCase()) ||
          (s.email || '').toLowerCase().includes(studentQuery.toLowerCase())
      ),
    [students, studentQuery]
  )

  const filteredTeachers = useMemo(() => {
    const query = userQuery.toLowerCase()
    if (!query) return teachers
    return teachers.filter(
      tchr =>
        (tchr.name || '').toLowerCase().includes(query) ||
        (tchr.email || '').toLowerCase().includes(query)
    )
  }, [teachers, userQuery])

  const filteredStudents = useMemo(() => {
    const query = userQuery.toLowerCase()
    if (!query) return students
    return students.filter(
      s =>
        (s.name || '').toLowerCase().includes(query) ||
        (s.email || '').toLowerCase().includes(query)
    )
  }, [students, userQuery])

  const filteredCourses = useMemo(() => {
    const query = courseQuery.trim().toLowerCase()
    if (!query) return courses
    return courses.filter(c =>
      (c.title || '').toLowerCase().includes(query) ||
      (c.description || '').toLowerCase().includes(query) ||
      (c.teacherName || '').toLowerCase().includes(query)
    )
  }, [courses, courseQuery])


  const courseTeacherLookup = useMemo(
    () =>
      courseTeachers.reduce<Record<string, CourseTeacher[]>>((acc, entry) => {
        acc[entry.courseId] = acc[entry.courseId] ? [...acc[entry.courseId], entry] : [entry]
        return acc
      }, {}),
    [courseTeachers]
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

  const startEditUser = (user: User) => {
    setEditingUserId(user.id)
    setEditName(user.name ?? '')
    setEditEmail(user.email ?? '')
    setError(null)
  }

  const cancelEditUser = () => {
    setEditingUserId(null)
    setEditName('')
    setEditEmail('')
  }

  const handleSaveUser = async (id: string) => {
    if (!editName.trim()) {
      setError(t('nameRequired'))
      return
    }
    if (!editEmail.trim()) {
      setError(t('emailRequired'))
      return
    }
    setSavingUser(true)
    try {
      const res = await fetch(`/api/superuser/users/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: editName.trim(), email: editEmail.trim()}),
      })
      if (!res.ok) throw new Error('failed')
      await loadData()
      cancelEditUser()
    } catch (err) {
      console.error(err)
      setError(t('updateUserError'))
    } finally {
      setSavingUser(false)
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

  const handleAddTeacherToCourse = async () => {
    if (!selectedCourseForTeacher || !selectedTeacherForCourse) return
    setAddingCourseTeacher(true)
    try {
      const res = await fetch('/api/superuser/course-teachers', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          courseId: selectedCourseForTeacher,
          teacherId: selectedTeacherForCourse,
        }),
      })
      if (!res.ok) throw new Error('failed')
      setSelectedCourseForTeacher('')
      setSelectedTeacherForCourse('')
      await loadData()
    } catch (err) {
      console.error(err)
      setError(t('addCourseTeacherError'))
    } finally {
      setAddingCourseTeacher(false)
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

  const handleRemoveCourseTeacher = async (id: string) => {
    setRemovingCourseTeacher(id)
    try {
      const res = await fetch(`/api/superuser/course-teachers/${id}`, {method: 'DELETE'})
      if (!res.ok) throw new Error('failed')
      await loadData()
    } catch (err) {
      console.error(err)
      setError(t('removeCourseTeacherError'))
    } finally {
      setRemovingCourseTeacher(null)
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

  const resetNewsForm = () =>
    setNewsForm({
      title: '',
      excerpt: '',
      image: '/globe.svg',
      href: '',
      tag: '',
      date: '',
      content: '',
    })

  const handleSaveNews = async () => {
    if (!newsForm.title.trim() || !newsForm.excerpt.trim() || !newsForm.image.trim() || !newsForm.date.trim()) {
      setError(t('news.requiredError'))
      return
    }
    setSavingNews(true)
    setError(null)
    try {
      const url = editingNewsId ? `/api/superuser/news/${editingNewsId}` : '/api/superuser/news'
      const method = editingNewsId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          title: newsForm.title.trim(),
          excerpt: newsForm.excerpt.trim(),
          image: newsForm.image.trim(),
          href: newsForm.href.trim() || undefined,
          tag: newsForm.tag.trim() || undefined,
          date: newsForm.date.trim(),
          content: newsForm.content,
        }),
      })
      if (!res.ok) throw new Error('failed')
      await loadData()
      resetNewsForm()
      setEditingNewsId(null)
    } catch (err) {
      console.error(err)
      setError(t('news.saveError'))
    } finally {
      setSavingNews(false)
    }
  }

  const handleEditNews = (item: NewsItem) => {
    setEditingNewsId(item.id)
    setNewsForm({
      title: item.title,
      excerpt: item.excerpt,
      image: item.image,
      href: item.href ?? '',
      tag: item.tag ?? '',
      date: item.date ?? '',
      content: item.content ?? '',
    })
  }

  const handleDeleteNews = async (id: string) => {
    setRemovingNews(id)
    setError(null)
    try {
      const res = await fetch(`/api/superuser/news/${id}`, {method: 'DELETE'})
      if (!res.ok) throw new Error('failed')
      if (editingNewsId === id) {
        setEditingNewsId(null)
        resetNewsForm()
      }
      await loadData()
    } catch (err) {
      console.error(err)
      setError(t('news.deleteError'))
    } finally {
      setRemovingNews(null)
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

        <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3 md:col-span-2">
          <h2 className="text-lg font-semibold">{t('userSearchTitle')}</h2>
          <input
            type="text"
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder={t('userSearchPlaceholder')}
            value={userQuery}
            onChange={e => setUserQuery(e.target.value)}
          />
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold">{t('teachersTitle')}</h2>
          <p className="text-xs text-slate-500">{t('teachersHelp')}</p>
          <div className="space-y-2 text-sm max-h-96 overflow-y-auto pr-1">
            {filteredTeachers.map(tchr => (
              <div
                key={tchr.id}
                className="flex items-center justify-between rounded border px-3 py-2"
              >
                <div>
                  {editingUserId === tchr.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        className="w-full rounded border px-2 py-1 text-xs"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                      />
                      <input
                        type="email"
                        className="w-full rounded border px-2 py-1 text-xs"
                        value={editEmail}
                        onChange={e => setEditEmail(e.target.value)}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="font-medium">{tchr.name}</div>
                      <div className="text-xs text-slate-500">{tchr.email}</div>
                      <div className="text-xs text-slate-500 capitalize">{tchr.role}</div>
                    </>
                  )}
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
                    <>
                      {editingUserId === tchr.id ? (
                        <>
                          <button
                            className="text-blue-600 hover:underline"
                            onClick={() => handleSaveUser(tchr.id)}
                            disabled={savingUser}
                          >
                            {savingUser ? t('saving') : t('save')}
                          </button>
                          <button
                            className="text-slate-600 hover:underline"
                            onClick={cancelEditUser}
                            disabled={savingUser}
                          >
                            {t('cancel')}
                          </button>
                        </>
                      ) : (
                        <button
                          className="text-blue-600 hover:underline"
                          onClick={() => startEditUser(tchr)}
                        >
                          {t('edit')}
                        </button>
                      )}
                      <button
                        className="text-red-600 hover:underline"
                        onClick={() => handleDeleteUser(tchr.id)}
                        disabled={removingUser === tchr.id}
                      >
                        {removingUser === tchr.id ? t('deleting') : t('delete')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {filteredTeachers.length === 0 && (
              <p className="text-xs text-slate-500">{t('noTeachers')}</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold">{t('studentsTitle')}</h2>
          <div className="space-y-2 text-sm max-h-96 overflow-y-auto pr-1">
            {filteredStudents.map(s => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded border px-3 py-2"
              >
                <div>
                  {editingUserId === s.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        className="w-full rounded border px-2 py-1 text-xs"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                      />
                      <input
                        type="email"
                        className="w-full rounded border px-2 py-1 text-xs"
                        value={editEmail}
                        onChange={e => setEditEmail(e.target.value)}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-slate-500">{s.email}</div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  {editingUserId === s.id ? (
                    <>
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={() => handleSaveUser(s.id)}
                        disabled={savingUser}
                      >
                        {savingUser ? t('saving') : t('save')}
                      </button>
                      <button
                        className="text-slate-600 hover:underline"
                        onClick={cancelEditUser}
                        disabled={savingUser}
                      >
                        {t('cancel')}
                      </button>
                    </>
                  ) : (
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => startEditUser(s)}
                    >
                      {t('edit')}
                    </button>
                  )}
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => handleDeleteUser(s.id)}
                    disabled={removingUser === s.id}
                  >
                    {removingUser === s.id ? t('deleting') : t('delete')}
                  </button>
                </div>
              </div>
            ))}
            {filteredStudents.length === 0 && (
              <p className="text-xs text-slate-500">{t('noStudents')}</p>
            )}
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
              {filteredStudentsForEnroll.map(s => (
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
        <h2 className="text-lg font-semibold">{t('assignTeacherTitle')}</h2>
        <p className="text-xs text-slate-500">{t('assignTeacherHelp')}</p>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <select
            className="rounded border px-3 py-2 text-sm"
            value={selectedTeacherForCourse}
            onChange={e => setSelectedTeacherForCourse(e.target.value)}
          >
            <option value="">{t('selectTeacher')}</option>
            {teachers
              .filter(tchr => tchr.role === 'teacher')
              .map(tchr => (
                <option key={tchr.id} value={tchr.id}>
                  {tchr.name}
                </option>
              ))}
          </select>
          <select
            className="rounded border px-3 py-2 text-sm"
            value={selectedCourseForTeacher}
            onChange={e => setSelectedCourseForTeacher(e.target.value)}
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
            onClick={handleAddTeacherToCourse}
            disabled={!selectedCourseForTeacher || !selectedTeacherForCourse || addingCourseTeacher}
          >
            {addingCourseTeacher ? t('addingTeacher') : t('addTeacher')}
          </button>
        </div>
        <div className="text-xs text-slate-500">
          {t('currentCourseTeachers', {count: courseTeachers.length})}
        </div>
        <div className="space-y-2 text-sm">
          {courseTeachers.map(entry => {
            const teacher = teachers.find(tchr => tchr.id === entry.teacherId)
            const course = courses.find(c => c.id === entry.courseId)
            return (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded border px-3 py-2"
              >
                <div>
                  <div className="font-medium">{teacher?.name ?? entry.teacherId}</div>
                  <div className="text-xs text-slate-500">{course?.title ?? entry.courseId}</div>
                </div>
                <button
                  className="text-red-600 text-xs hover:underline"
                  onClick={() => handleRemoveCourseTeacher(entry.id)}
                  disabled={removingCourseTeacher === entry.id}
                >
                  {removingCourseTeacher === entry.id ? t('removing') : t('remove')}
                </button>
              </div>
            )
          })}
          {courseTeachers.length === 0 && (
            <p className="text-xs text-slate-500">{t('noCourseTeachers')}</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">{t('news.title')}</h2>
            <p className="text-xs text-slate-500">{t('news.subtitle')}</p>
          </div>
          {editingNewsId && (
            <button
              className="text-xs text-blue-600 hover:underline"
              onClick={() => {
                setEditingNewsId(null)
                resetNewsForm()
              }}
            >
              {t('news.cancelEdit')}
            </button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="text"
                className="rounded border px-3 py-2 text-sm"
                placeholder={t('news.titlePlaceholder')}
                value={newsForm.title}
                onChange={e => setNewsForm(prev => ({...prev, title: e.target.value}))}
              />
              <input
                type="text"
                className="rounded border px-3 py-2 text-sm"
                placeholder={t('news.tagPlaceholder')}
                value={newsForm.tag}
                onChange={e => setNewsForm(prev => ({...prev, tag: e.target.value}))}
              />
              <input
                type="date"
                className="rounded border px-3 py-2 text-sm"
                placeholder={t('news.datePlaceholder')}
                value={newsForm.date}
                onChange={e => setNewsForm(prev => ({...prev, date: e.target.value}))}
                required
              />
              <input
                type="text"
                className="rounded border px-3 py-2 text-sm"
                placeholder={t('news.imagePlaceholder')}
                value={newsForm.image}
                onChange={e => setNewsForm(prev => ({...prev, image: e.target.value}))}
              />
            </div>
            <input
              type="text"
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder={t('news.hrefPlaceholder')}
              value={newsForm.href}
              onChange={e => setNewsForm(prev => ({...prev, href: e.target.value}))}
            />
            <textarea
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder={t('news.excerptPlaceholder')}
              rows={2}
              value={newsForm.excerpt}
              onChange={e => setNewsForm(prev => ({...prev, excerpt: e.target.value}))}
            />
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-600">{t('news.richLabel')}</p>
              <RichTextEditor
                value={newsForm.content}
                onChange={val => setNewsForm(prev => ({...prev, content: val}))}
                placeholder={t('news.richPlaceholder')}
              />
            </div>
            <div className="flex items-center gap-3 justify-end">
              <button
                className="rounded border px-4 py-2 text-xs font-medium hover:bg-slate-50"
                onClick={() => {
                  resetNewsForm()
                  setEditingNewsId(null)
                }}
                disabled={savingNews}
              >
                {t('news.reset')}
              </button>
              <button
                className="rounded bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                onClick={handleSaveNews}
                disabled={savingNews}
              >
                {savingNews ? t('news.saving') : editingNewsId ? t('news.update') : t('news.add')}
              </button>
            </div>
          </div>

          <div className="space-y-2 text-sm max-h-96 overflow-y-auto pr-1">
            {newsItems.map(item => (
              <div key={item.id} className="rounded border px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-slate-500 line-clamp-2">{item.excerpt}</div>
                    <div className="mt-1 text-[11px] text-slate-400">
                      {item.tag ? `${item.tag} • ` : ''}{item.date ?? 'No date'}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-xs">
                    <button className="text-blue-600 hover:underline" onClick={() => handleEditNews(item)}>
                      {t('news.edit')}
                    </button>
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => handleDeleteNews(item.id)}
                      disabled={removingNews === item.id}
                    >
                      {removingNews === item.id ? t('news.deleting') : t('news.delete')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {newsItems.length === 0 && <p className="text-xs text-slate-500">{t('news.empty')}</p>}
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold">{t('coursesTitle')}</h2>
        <p className="text-xs text-slate-500">{t('coursesHelp')}</p>
        <input
          type="text"
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder={t('coursesSearchPlaceholder')}
          value={courseQuery}
          onChange={e => setCourseQuery(e.target.value)}
        />
        <div className="space-y-2 text-sm max-h-96 overflow-y-auto pr-1">
          {filteredCourses.map(c => {
            const assigned = courseTeacherLookup[c.id] ?? []
            return (
              <div key={c.id} className="flex items-center justify-between rounded border px-3 py-2">
                <div>
                  <div className="font-medium">{c.title}</div>
                  <div className="text-xs text-slate-500">{c.description}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {t('primaryTeacher', {name: c.teacherName})}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-600">
                    {assigned.length > 0 ? (
                      assigned.map(entry => {
                        const teacher = teachers.find(tchr => tchr.id === entry.teacherId)
                        return (
                          <span
                            key={entry.id}
                            className="rounded-full bg-slate-100 px-2 py-1"
                          >
                            {teacher?.name ?? entry.teacherId}
                          </span>
                        )
                      })
                    ) : (
                      <span className="text-slate-400">{t('noAdditionalTeachers')}</span>
                    )}
                  </div>
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
            )
          })}
          {filteredCourses.length === 0 && <p className="text-xs text-slate-500">{t('noCourses')}</p>}
        </div>
      </div>
    </section>
  )
}
