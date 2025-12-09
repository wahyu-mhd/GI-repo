import { promises as fs } from 'fs'
import path from 'path'

export type Feedback = {
  id: string
  courseId: string
  studentId: string
  teacherName: string
  message: string
  createdAt: string
  read: boolean
  readAt?: string
}

const feedbackPath = path.join(process.cwd(), 'data', 'feedback.json')

async function ensureFile(): Promise<void> {
  try {
    await fs.access(feedbackPath)
  } catch {
    await fs.mkdir(path.dirname(feedbackPath), { recursive: true })
    await fs.writeFile(feedbackPath, JSON.stringify([], null, 2), 'utf8')
  }
}

async function readJson(): Promise<Feedback[]> {
  try {
    await ensureFile()
    const raw = await fs.readFile(feedbackPath, 'utf8')
    return raw.trim() ? (JSON.parse(raw) as Feedback[]) : []
  } catch (error) {
    console.error('readJson feedback failed, returning []', error)
    return []
  }
}

async function writeJson(data: Feedback[]): Promise<void> {
  await ensureFile()
  await fs.writeFile(feedbackPath, JSON.stringify(data, null, 2), 'utf8')
}

export async function readFeedback(): Promise<Feedback[]> {
  return readJson()
}

export async function writeFeedback(feedback: Feedback[]): Promise<void> {
  await writeJson(feedback)
}

export async function addFeedback(data: Omit<Feedback, 'id' | 'createdAt' | 'read'>): Promise<Feedback> {
  const feedback = await readFeedback()
  const entry: Feedback = {
    id: `feedback-${Date.now()}-${feedback.length}`,
    createdAt: new Date().toISOString(),
    read: false,
    ...data,
  }
  await writeFeedback([...feedback, entry])
  return entry
}

export async function getFeedbackByCourse(courseId: string): Promise<Feedback[]> {
  const feedback = await readFeedback()
  return feedback
    .filter(f => f.courseId === courseId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getFeedbackForStudentCourse(studentId: string, courseId: string): Promise<Feedback[]> {
  const feedback = await readFeedback()
  return feedback
    .filter(f => f.courseId === courseId && f.studentId === studentId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function markFeedbackRead(id: string): Promise<Feedback | undefined> {
  const feedback = await readFeedback()
  let updated: Feedback | undefined
  const next = feedback.map(f => {
    if (f.id !== id) return f
    updated = { ...f, read: true, readAt: new Date().toISOString() }
    return updated
  })
  if (!updated) return undefined
  await writeFeedback(next)
  return updated
}
