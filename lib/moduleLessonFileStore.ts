import { promises as fs } from 'fs'
import path from 'path'
import { Lesson, Module, mockLessons, mockModules } from './mockData'

const modulesPath = path.join(process.cwd(), 'data', 'modules.json')
const lessonsPath = path.join(process.cwd(), 'data', 'lessons.json')

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

// ---------------------------------------
// Modules
// ---------------------------------------

export async function readModules(): Promise<Module[]> {
  return readJson<Module>(modulesPath, mockModules)
}

export async function writeModules(modules: Module[]): Promise<void> {
  await writeJson(modulesPath, modules)
}

export async function getModulesByCourseFile(courseId: string): Promise<Module[]> {
  const modules = await readModules()
  return modules
    .filter(m => m.courseId === courseId)
    .sort((a, b) => a.order - b.order)
}

export async function addModule(data: Omit<Module, 'id'>): Promise<Module> {
  const modules = await readModules()
  const newModule: Module = { id: `module-${Date.now()}-${modules.length}`, ...data }
  await writeModules([...modules, newModule])
  return newModule
}

// ---------------------------------------
// Lessons
// ---------------------------------------

export async function readLessons(): Promise<Lesson[]> {
  return readJson<Lesson>(lessonsPath, mockLessons)
}

export async function writeLessons(lessons: Lesson[]): Promise<void> {
  await writeJson(lessonsPath, lessons)
}

export async function getLessonsByModuleFile(moduleId: string): Promise<Lesson[]> {
  const lessons = await readLessons()
  return lessons.filter(l => l.moduleId === moduleId)
}

export async function getModuleByIdFile(id: string): Promise<Module | undefined> {
  const modules = await readModules()
  return modules.find(m => m.id === id)
}

export async function getLessonsByCourseFile(courseId: string): Promise<Lesson[]> {
  const modules = await getModulesByCourseFile(courseId)
  const moduleIds = modules.map(m => m.id)
  const lessons = await readLessons()
  return lessons.filter(l => moduleIds.includes(l.moduleId))
}

export async function getLessonByIdFile(id: string): Promise<Lesson | undefined> {
  const lessons = await readLessons()
  return lessons.find(l => l.id === id)
}

export async function addLesson(data: Omit<Lesson, 'id'>): Promise<Lesson> {
  const lessons = await readLessons()
  const newLesson: Lesson = { id: `lesson-${Date.now()}-${lessons.length}`, ...data }
  await writeLessons([...lessons, newLesson])
  return newLesson
}

export async function updateLessonFile(
  id: string,
  patch: Partial<Omit<Lesson, 'id'>>
): Promise<Lesson | undefined> {
  const lessons = await readLessons()
  let updated: Lesson | undefined
  const next = lessons.map(l => {
    if (l.id !== id) return l
    updated = { ...l, ...patch }
    return updated
  })
  if (!updated) return undefined
  await writeLessons(next)
  return updated
}
