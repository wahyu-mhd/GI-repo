import { promises as fs } from 'fs'
import path from 'path'
import { Course, mockCourses } from './mockData'

const filePath = path.join(process.cwd(), 'data', 'courses.json')

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
    return raw.trim() ? (JSON.parse(raw) as Course[]) : []
  } catch (error) {
    console.error('readCourses: falling back to mock data', error)
    return [...mockCourses]
  }
}

export async function writeCourses(courses: Course[]): Promise<void> {
  await ensureFile()
  await fs.writeFile(filePath, JSON.stringify(courses, null, 2), 'utf8')
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
