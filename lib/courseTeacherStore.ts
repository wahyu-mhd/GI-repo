import { promises as fs } from 'fs'
import path from 'path'

export type CourseTeacher = {
  id: string
  courseId: string
  teacherId: string
}

const courseTeachersPath = path.join(process.cwd(), 'data', 'courseTeachers.json')

const seedCourseTeachers: CourseTeacher[] = []
let volatileCourseTeachers: CourseTeacher[] = []

async function ensureFile(): Promise<void> {
  try {
    await fs.access(courseTeachersPath)
  } catch {
    await fs.mkdir(path.dirname(courseTeachersPath), { recursive: true })
    await fs.writeFile(courseTeachersPath, JSON.stringify(seedCourseTeachers, null, 2), 'utf8')
  }
}

async function readJson(): Promise<CourseTeacher[]> {
  try {
    await ensureFile()
    const raw = await fs.readFile(courseTeachersPath, 'utf8')
    return raw.trim() ? (JSON.parse(raw) as CourseTeacher[]) : []
  } catch (error) {
    console.error('readJson(courseTeachers) failed, falling back to seed', error)
    return [...seedCourseTeachers]
  }
}

async function writeJson(data: CourseTeacher[]): Promise<void> {
  await ensureFile()
  await fs.writeFile(courseTeachersPath, JSON.stringify(data, null, 2), 'utf8')
}

function mergeById(persisted: CourseTeacher[], memory: CourseTeacher[]) {
  const map = new Map<string, CourseTeacher>()
  persisted.forEach(item => map.set(item.id, item))
  memory.forEach(item => map.set(item.id, item))
  return Array.from(map.values())
}

export async function readCourseTeachers(): Promise<CourseTeacher[]> {
  const persisted = await readJson()
  return mergeById(persisted, volatileCourseTeachers)
}

export async function addCourseTeacher(courseId: string, teacherId: string): Promise<CourseTeacher> {
  const current = await readCourseTeachers()
  const exists = current.find(
    entry => entry.courseId === courseId && entry.teacherId === teacherId
  )
  if (exists) return exists

  const newAssignment: CourseTeacher = {
    id: `course-teacher-${Date.now()}-${current.length}`,
    courseId,
    teacherId,
  }

  try {
    await writeJson([...current, newAssignment])
  } catch (error) {
    console.error('addCourseTeacher write failed; storing in memory', error)
    volatileCourseTeachers = mergeById(volatileCourseTeachers, [newAssignment])
  }

  return newAssignment
}

export async function deleteCourseTeacher(id: string): Promise<boolean> {
  const current = await readCourseTeachers()
  const exists = current.some(entry => entry.id === id)
  if (!exists) return false

  const remaining = current.filter(entry => entry.id !== id)
  try {
    await writeJson(remaining)
  } catch (error) {
    console.error('deleteCourseTeacher write failed; storing in memory', error)
    volatileCourseTeachers = remaining
  }
  return true
}

export async function getTeachersForCourse(courseId: string): Promise<CourseTeacher[]> {
  const current = await readCourseTeachers()
  return current.filter(entry => entry.courseId === courseId)
}
