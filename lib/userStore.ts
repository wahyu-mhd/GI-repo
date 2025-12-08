import { promises as fs } from 'fs'
import path from 'path'

export type UserRole = 'student' | 'teacher' | 'superuser'

export type User = {
  id: string
  name: string
  role: UserRole
  email?: string
  canManageStudents?: boolean // superuser can toggle this for teachers
  tempPassword?: string // simple mock password issued via email
}

export type Enrollment = {
  id: string
  courseId: string
  studentId: string
}

const usersPath = path.join(process.cwd(), 'data', 'users.json')
const enrollmentsPath = path.join(process.cwd(), 'data', 'enrollments.json')

const seedUsers: User[] = [
  { id: 'user-super-1', name: 'Super Admin', role: 'superuser', email: 'super@example.com' },
  { id: 'user-teacher-1', name: 'Wahyu', role: 'teacher', email: 'wahyu@example.com', canManageStudents: false },
  { id: 'user-teacher-2', name: 'Mahendra', role: 'teacher', email: 'mahendra@example.com', canManageStudents: true },
  { id: 'user-student-1', name: 'Student User', role: 'student', email: 'student@example.com' },
]

const seedEnrollments: Enrollment[] = []

let volatileUsers: User[] = []
let volatileEnrollments: Enrollment[] = []

async function ensureFile(filePath: string, seed: object[]): Promise<void> {
  try {
    await fs.access(filePath)
  } catch {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, JSON.stringify(seed, null, 2), 'utf8')
  }
}

async function readJson<T>(filePath: string, seed: T[]): Promise<T[]> {
  try {
    await ensureFile(filePath, seed as object[])
    const raw = await fs.readFile(filePath, 'utf8')
    return raw.trim() ? (JSON.parse(raw) as T[]) : []
  } catch (error) {
    console.error(`readJson(${filePath}) failed, falling back to seed`, error)
    return [...seed]
  }
}

async function writeJson<T>(filePath: string, data: T[]): Promise<void> {
  await ensureFile(filePath, [])
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8')
}

function mergeById<T extends { id: string }>(persisted: T[], memory: T[]) {
  const map = new Map<string, T>()
  persisted.forEach(item => map.set(item.id, item))
  memory.forEach(item => map.set(item.id, item))
  return Array.from(map.values())
}

// Users
export async function readUsers(): Promise<User[]> {
  const persisted = await readJson<User>(usersPath, seedUsers)
  return mergeById(persisted, volatileUsers)
}

export async function writeUsers(users: User[]): Promise<void> {
  await writeJson(usersPath, users)
  volatileUsers = []
}

export async function addUser(data: Omit<User, 'id'>): Promise<User> {
  const users = await readUsers()
  const user: User = { id: `user-${Date.now()}-${users.length}`, ...data }
  try {
    await writeUsers([...users, user])
  } catch (error) {
    console.error('addUser write failed; storing in memory', error)
    volatileUsers = mergeById(volatileUsers, [user])
  }
  return user
}

export async function updateUser(id: string, patch: Partial<User>): Promise<User | undefined> {
  const users = await readUsers()
  let updated: User | undefined
  const next = users.map(u => {
    if (u.id !== id) return u
    updated = { ...u, ...patch }
    return updated
  })
  if (!updated) return undefined
  try {
    await writeUsers(next)
  } catch (error) {
    console.error('updateUser write failed; storing in memory', error)
    volatileUsers = mergeById(volatileUsers, [updated])
  }
  return updated
}

export async function deleteUser(id: string): Promise<boolean> {
  const users = await readUsers()
  const exists = users.some(u => u.id === id)
  if (!exists) return false
  const remaining = users.filter(u => u.id !== id)
  try {
    await writeUsers(remaining)
  } catch (error) {
    console.error('deleteUser write failed; storing in memory', error)
    volatileUsers = remaining
  }
  // Also remove enrollments for this user if they are a student
  const enrollments = await readEnrollments()
  const filteredEnrollments = enrollments.filter(e => e.studentId !== id)
  try {
    await writeEnrollments(filteredEnrollments)
  } catch (error) {
    console.error('deleteUser enrollment cleanup failed; storing in memory', error)
    volatileEnrollments = filteredEnrollments
  }
  return true
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const users = await readUsers()
  return users.find(u => u.email?.toLowerCase() === email.toLowerCase())
}

export async function getUserById(id: string): Promise<User | undefined> {
  const users = await readUsers()
  return users.find(u => u.id === id)
}

// Enrollments
export async function readEnrollments(): Promise<Enrollment[]> {
  const persisted = await readJson<Enrollment>(enrollmentsPath, seedEnrollments)
  return mergeById(persisted, volatileEnrollments)
}

export async function writeEnrollments(enrollments: Enrollment[]): Promise<void> {
  await writeJson(enrollmentsPath, enrollments)
  volatileEnrollments = []
}

export async function addEnrollment(courseId: string, studentId: string): Promise<Enrollment> {
  const enrollments = await readEnrollments()
  const enrollment: Enrollment = {
    id: `enroll-${Date.now()}-${enrollments.length}`,
    courseId,
    studentId,
  }
  try {
    await writeEnrollments([...enrollments, enrollment])
  } catch (error) {
    console.error('addEnrollment write failed; storing in memory', error)
    volatileEnrollments = mergeById(volatileEnrollments, [enrollment])
  }
  return enrollment
}

export async function deleteEnrollment(id: string): Promise<boolean> {
  const enrollments = await readEnrollments()
  const exists = enrollments.some(e => e.id === id)
  if (!exists) return false
  const remaining = enrollments.filter(e => e.id !== id)
  try {
    await writeEnrollments(remaining)
  } catch (error) {
    console.error('deleteEnrollment write failed; storing in memory', error)
    volatileEnrollments = remaining
  }
  return true
}
