import { promises as fs } from 'fs'
import path from 'path'
import { StudentProgress, mockStudentProgress } from './mockData'

const progressPath = path.join(process.cwd(), 'data', 'progress.json')

async function ensureFile(): Promise<void> {
  try {
    await fs.access(progressPath)
  } catch {
    await fs.mkdir(path.dirname(progressPath), { recursive: true })
    await fs.writeFile(progressPath, JSON.stringify(mockStudentProgress, null, 2), 'utf8')
  }
}

async function readAll(): Promise<StudentProgress[]> {
  try {
    await ensureFile()
    const raw = await fs.readFile(progressPath, 'utf8')
    return raw.trim() ? (JSON.parse(raw) as StudentProgress[]) : []
  } catch (err) {
    console.error('readAll progress failed, fallback to mock', err)
    return [...mockStudentProgress]
  }
}

async function writeAll(data: StudentProgress[]): Promise<void> {
  await ensureFile()
  await fs.writeFile(progressPath, JSON.stringify(data, null, 2), 'utf8')
}

export async function getProgressByStudent(studentId: string): Promise<StudentProgress[]> {
  const all = await readAll()
  return all.filter(p => p.studentId === studentId)
}

export async function getProgressByStudentAndCourse(
  studentId: string,
  courseId: string
): Promise<StudentProgress | undefined> {
  const all = await readAll()
  return all.find(p => p.studentId === studentId && p.courseId === courseId)
}

export async function upsertProgress(entry: Omit<StudentProgress, 'id'> & { id?: string }) {
  const all = await readAll()
  const nowIso = new Date().toISOString()
  let existingIndex = -1
  if (entry.id) {
    existingIndex = all.findIndex(p => p.id === entry.id)
  } else {
    existingIndex = all.findIndex(p => p.studentId === entry.studentId && p.courseId === entry.courseId)
  }
  const base: StudentProgress = {
    id: entry.id ?? `progress-${Date.now()}`,
    startedAt: entry.startedAt || nowIso,
    updatedAt: entry.updatedAt || nowIso,
    completedLessons: entry.completedLessons ?? 0,
    totalLessons: entry.totalLessons ?? 0,
    studentId: entry.studentId,
    courseId: entry.courseId,
    lastLessonId: entry.lastLessonId,
    lastQuizId: entry.lastQuizId,
    percentComplete: entry.percentComplete,
  }
  if (existingIndex >= 0) {
    const merged = { ...all[existingIndex], ...base, updatedAt: nowIso }
    all[existingIndex] = merged
  } else {
    all.push(base)
  }
  await writeAll(all)
  return existingIndex >= 0 ? all[existingIndex] : base
}

export async function listProgress(): Promise<StudentProgress[]> {
  return readAll()
}
