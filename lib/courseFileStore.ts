import { promises as fs } from 'fs'
import path from 'path'
import { Course, mockCourses } from './mockData'

const filePath = path.join(process.cwd(), 'data', 'courses.json')
const fallbackTeacherId = (teacherName: string) =>
  `teacher-${teacherName.trim().toLowerCase().replace(/\s+/g, '-') || 'unknown'}`

async function ensureFile(): Promise<void> {
  try {
    await fs.access(filePath)
  } catch {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, '[]', 'utf8')
  }
}

export async function readCourses(): Promise<Course[]> {
  try {
    await ensureFile()
    const raw = await fs.readFile(filePath, 'utf8')
    const parsed = raw.trim() ? (JSON.parse(raw) as Partial<Course>[]) : []
    return parsed.map(course => ({
      ...course,
      teacherId: course.teacherId ?? fallbackTeacherId(course.teacherName ?? 'unknown'),
    })) as Course[]
  } catch (error) {
    console.error('readCourses: falling back to mock data', error)
    return mockCourses.map(course => ({
      ...course,
      teacherId: course.teacherId ?? fallbackTeacherId(course.teacherName),
    }))
  }
}

export async function writeCourses(courses: Course[]): Promise<void> {
  await ensureFile()
  await fs.writeFile(filePath, JSON.stringify(courses, null, 2), 'utf8')
}

export async function updateCourseFile(
  id: string,
  patch: Partial<Omit<Course, 'id'>>
): Promise<Course | undefined> {
  const courses = await readCourses()
  let updated: Course | undefined
  const next = courses.map(c => {
    if (c.id !== id) return c
    updated = { ...c, ...patch }
    return updated
  })
  if (!updated) return undefined
  await writeCourses(next)
  return updated
}

export async function deleteCourse(id: string): Promise<boolean> {
  const courses = await readCourses()
  const exists = courses.some(c => c.id === id)
  if (!exists) return false
  const remaining = courses.filter(c => c.id !== id)
  await writeCourses(remaining)
  return true
}

export async function addCourse(data: Omit<Course, 'id'>): Promise<Course> {
  const courses = await readCourses()
  const newCourse: Course = { id: `course-${Date.now()}`, ...data }
  await writeCourses([...courses, newCourse])
  return newCourse
}

export async function getCourseByIdFile(id: string): Promise<Course | undefined> {
  const courses = await readCourses()
  return courses.find(c => c.id === id)
}
