import { promises as fs } from 'fs'
import path from 'path'

export type QuestionReplyVisibility = 'public' | 'private'

export type CourseQuestionReply = {
  message: string
  visibility: QuestionReplyVisibility
  teacherName: string
  createdAt: string
}

export type CourseQuestion = {
  id: string
  courseId: string
  studentId: string
  studentName: string
  message: string
  createdAt: string
  reply?: CourseQuestionReply
}

const questionsPath = path.join(process.cwd(), 'data', 'courseQuestions.json')

// Volatile in-memory cache so the API still works if disk writes fail (e.g. read-only FS)
let volatileQuestions: CourseQuestion[] = []

function mergeById<T extends { id: string }>(persisted: T[], volatile: T[]) {
  const map = new Map<string, T>()
  persisted.forEach(item => map.set(item.id, item))
  volatile.forEach(item => map.set(item.id, item))
  return Array.from(map.values())
}

async function ensureFile(filePath: string): Promise<void> {
  try {
    await fs.access(filePath)
  } catch {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, JSON.stringify([], null, 2), 'utf8')
  }
}

async function readJson(): Promise<CourseQuestion[]> {
  try {
    await ensureFile(questionsPath)
    const raw = await fs.readFile(questionsPath, 'utf8')
    return raw.trim() ? (JSON.parse(raw) as CourseQuestion[]) : []
  } catch (error) {
    console.error('readJson course questions failed, returning []', error)
    return []
  }
}

async function writeJson(data: CourseQuestion[]): Promise<void> {
  await ensureFile(questionsPath)
  await fs.writeFile(questionsPath, JSON.stringify(data, null, 2), 'utf8')
}

export async function readQuestions(): Promise<CourseQuestion[]> {
  const persisted = await readJson()
  return mergeById(persisted, volatileQuestions)
}

export async function writeQuestions(questions: CourseQuestion[]): Promise<void> {
  await writeJson(questions)
  volatileQuestions = []
}

export async function addQuestion(
  data: Omit<CourseQuestion, 'id' | 'createdAt' | 'reply'> & { createdAt?: string }
): Promise<CourseQuestion> {
  const questions = await readQuestions()
  const entry: CourseQuestion = {
    id: `question-${Date.now()}-${questions.length}`,
    createdAt: data.createdAt ?? new Date().toISOString(),
    ...data,
  }
  try {
    await writeQuestions([...questions, entry])
  } catch (error) {
    console.error('addQuestion failed to write to disk, keeping in memory', error)
    volatileQuestions = mergeById(volatileQuestions, [entry])
  }
  return entry
}

export async function replyToQuestion(
  id: string,
  reply: Omit<CourseQuestionReply, 'createdAt'> & { createdAt?: string }
): Promise<CourseQuestion | undefined> {
  const questions = await readQuestions()
  let updated: CourseQuestion | undefined
  const next = questions.map(question => {
    if (question.id !== id) return question
    updated = {
      ...question,
      reply: {
        ...reply,
        createdAt: reply.createdAt ?? new Date().toISOString(),
      },
    }
    return updated
  })
  if (!updated) return undefined
  try {
    await writeQuestions(next)
  } catch (error) {
    console.error('replyToQuestion failed to write to disk, keeping in memory', error)
    volatileQuestions = mergeById(volatileQuestions, [updated])
  }
  return updated
}

export async function getQuestionsByCourse(courseId: string): Promise<CourseQuestion[]> {
  const questions = await readQuestions()
  return questions
    .filter(q => q.courseId === courseId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getQuestionsForStudentCourse(
  studentId: string,
  courseId: string
): Promise<CourseQuestion[]> {
  const questions = await readQuestions()
  return questions
    .filter(q => q.courseId === courseId)
    .filter(q => q.studentId === studentId || q.reply?.visibility === 'public')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}
