import { promises as fs } from 'fs'
import path from 'path'
import {
  Quiz,
  QuizQuestion,
  QuizSubmission,
  mockQuizzes,
  mockQuizQuestions,
  mockQuizSubmissions,
} from './mockData'

const quizzesPath = path.join(process.cwd(), 'data', 'quizzes.json')
const questionsPath = path.join(process.cwd(), 'data', 'quizQuestions.json')
const submissionsPath = path.join(process.cwd(), 'data', 'quizSubmissions.json')

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

export async function readQuizzes(): Promise<Quiz[]> {
  return readJson<Quiz>(quizzesPath, mockQuizzes)
}

export async function writeQuizzes(quizzes: Quiz[]): Promise<void> {
  await writeJson(quizzesPath, quizzes)
}

export async function readQuizQuestions(): Promise<QuizQuestion[]> {
  return readJson<QuizQuestion>(questionsPath, mockQuizQuestions)
}

export async function writeQuizQuestions(questions: QuizQuestion[]): Promise<void> {
  await writeJson(questionsPath, questions)
}

export async function readQuizSubmissions(): Promise<QuizSubmission[]> {
  return readJson<QuizSubmission>(submissionsPath, mockQuizSubmissions)
}

export async function writeQuizSubmissions(submissions: QuizSubmission[]): Promise<void> {
  await writeJson(submissionsPath, submissions)
}

export async function addQuiz(data: Omit<Quiz, 'id'>): Promise<Quiz> {
  const quizzes = await readQuizzes()
  const newQuiz: Quiz = { id: `quiz-${Date.now()}`, ...data }
  await writeQuizzes([...quizzes, newQuiz])
  return newQuiz
}

export async function addQuizQuestion(data: Omit<QuizQuestion, 'id'>): Promise<QuizQuestion> {
  const questions = await readQuizQuestions()
  const newQuestion: QuizQuestion = {
    id: `qq-${Date.now()}-${questions.length}`,
    correctPoints: data.correctPoints ?? 1,
    wrongPoints: data.wrongPoints ?? 0,
    skipPoints: data.skipPoints ?? 0,
    explanation: data.explanation?.trim() || undefined,
    ...data,
  }
  await writeQuizQuestions([...questions, newQuestion])
  return newQuestion
}

export async function getQuizzesByCourseFile(courseId: string): Promise<Quiz[]> {
  const quizzes = await readQuizzes()
  return quizzes.filter(q => q.courseId === courseId)
}

export async function getQuizByIdFile(id: string): Promise<Quiz | undefined> {
  const quizzes = await readQuizzes()
  return quizzes.find(q => q.id === id)
}

export type UpsertQuizQuestionInput = Omit<QuizQuestion, 'quizId' | 'id'> & {
  id?: string
  questionText?: string
}

export async function updateQuizFile(id: string, patch: Partial<Omit<Quiz, 'id'>>): Promise<Quiz | undefined> {
  const quizzes = await readQuizzes()
  let updated: Quiz | undefined
  const next = quizzes.map(q => {
    if (q.id !== id) return q
    updated = { ...q, ...patch }
    return updated
  })
  if (!updated) return undefined
  await writeQuizzes(next)
  return updated
}

export async function getQuestionsByQuizFile(quizId: string): Promise<QuizQuestion[]> {
  const questions = await readQuizQuestions()
  return questions.filter(q => q.quizId === quizId)
}

export async function replaceQuizQuestions(
  quizId: string,
  questions: UpsertQuizQuestionInput[]
): Promise<QuizQuestion[]> {
  const existing = await readQuizQuestions()
  const filtered = existing.filter(q => q.quizId !== quizId)
  const now = Date.now()
  const normalized: QuizQuestion[] = questions.map((q, idx) => ({
    id: q.id ?? `qq-${now}-${idx}`,
    quizId,
    questionText: q.questionText ?? (q as any).text ?? '',
    type: q.type,
    choices: q.choices,
    correctIndex: q.correctIndex,
    correctIndices: q.correctIndices,
    expectedAnswer: q.expectedAnswer,
    explanation: q.explanation?.trim() || undefined,
    correctPoints: q.correctPoints ?? 1,
    wrongPoints: q.wrongPoints ?? 0,
    skipPoints: q.skipPoints ?? 0,
  }))
  await writeQuizQuestions([...filtered, ...normalized])
  return normalized
}

export async function deleteQuizFile(id: string): Promise<void> {
  const quizzes = await readQuizzes()
  const questions = await readQuizQuestions()
  const filteredQuizzes = quizzes.filter(q => q.id !== id)
  const filteredQuestions = questions.filter(q => q.quizId !== id)
  await writeQuizzes(filteredQuizzes)
  await writeQuizQuestions(filteredQuestions)
}

export async function getSubmissionByStudentAndQuiz(
  studentId: string,
  quizId: string
): Promise<QuizSubmission | undefined> {
  const submissions = await readQuizSubmissions()
  const filtered = submissions.filter(s => s.studentId === studentId && s.quizId === quizId)
  if (filtered.length === 0) return undefined
  return filtered.sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  )[0]
}

export async function saveQuizSubmission(
  data: Omit<QuizSubmission, 'id' | 'submittedAt'> & { id?: string; submittedAt?: string }
): Promise<QuizSubmission> {
  const submissions = await readQuizSubmissions()
  const submission: QuizSubmission = {
    id: data.id ?? `sub-${Date.now()}`,
    submittedAt: data.submittedAt ?? new Date().toISOString(),
    ...data,
  }
  await writeQuizSubmissions([...submissions, submission])
  return submission
}
