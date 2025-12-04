// lib/db.ts
// Fake in-memory "database" that starts from mockData
// and lets you create courses, lessons, quizzes, etc.

import {
  Course,
  Lesson,
  Module,
  Quiz,
  QuizQuestion,
  Stage,
  Grade,
  Subject,
  mockCourses,
  mockModules,
  mockLessons,
  mockQuizzes,
  mockQuizQuestions,
} from './mockData' // or '@/lib/mockData' if you prefer alias

// ---------------------------------------
// INTERNAL MUTABLE ARRAYS (this is our "DB")
// ---------------------------------------

let courses: Course[] = [...mockCourses]
let modules: Module[] = [...mockModules]
let lessons: Lesson[] = [...mockLessons]
let quizzes: Quiz[] = [...mockQuizzes]
let quizQuestions: QuizQuestion[] = [...mockQuizQuestions]

// Simple ID generator
const genId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 10)}`

// ---------------------------------------
// COURSES
// ---------------------------------------

export function getAllCourses(): Course[] {
  return courses
}

export function getCoursesByStageAndGrade(stage: Stage, grade: Grade): Course[] {
  return courses.filter(c => c.stage === stage && c.grade === grade)
}

export function getCoursesByTeacher(teacherName: string): Course[] {
  return courses.filter(c => c.teacherName === teacherName)
}

export function getCourseById(id: string): Course | undefined {
  return courses.find(c => c.id === id)
}

export function createCourse(data: Omit<Course, 'id'>): Course {
  const newCourse: Course = { id: genId('course'), ...data }
  courses = [...courses, newCourse]
  return newCourse
}

// (optional) update + delete
export function updateCourse(id: string, patch: Partial<Omit<Course, 'id'>>) {
  courses = courses.map(c => (c.id === id ? { ...c, ...patch } : c))
  return getCourseById(id)
}

export function deleteCourse(id: string) {
  courses = courses.filter(c => c.id !== id)
}

// ---------------------------------------
// MODULES
// ---------------------------------------

export function getModulesByCourse(courseId: string): Module[] {
  return modules
    .filter(m => m.courseId === courseId)
    .sort((a, b) => a.order - b.order)
}

export function createModule(data: Omit<Module, 'id'>): Module {
  const newModule: Module = { id: genId('module'), ...data }
  modules = [...modules, newModule]
  return newModule
}

// ---------------------------------------
// LESSONS
// ---------------------------------------

export function getLessonsByModule(moduleId: string): Lesson[] {
  return lessons.filter(l => l.moduleId === moduleId)
}

export function getLessonsByCourse(courseId: string): Lesson[] {
  const moduleIds = getModulesByCourse(courseId).map(m => m.id)
  return lessons.filter(l => moduleIds.includes(l.moduleId))
}

export function getLessonById(id: string): Lesson | undefined {
  return lessons.find(l => l.id === id)
}

export function createLesson(data: Omit<Lesson, 'id'>): Lesson {
  const newLesson: Lesson = { id: genId('lesson'), ...data }
  lessons = [...lessons, newLesson]
  return newLesson
}

export function updateLesson(id: string, patch: Partial<Omit<Lesson, 'id'>>) {
  lessons = lessons.map(l => (l.id === id ? { ...l, ...patch } : l))
  return getLessonById(id)
}

export function deleteLesson(id: string) {
  lessons = lessons.filter(l => l.id !== id)
}

// ---------------------------------------
// QUIZZES
// ---------------------------------------



export function getQuizzesByCourse(courseId: string): Quiz[] {
  return quizzes.filter(q => q.courseId === courseId)
}

export function getQuizById(id: string): Quiz | undefined {
  return quizzes.find(q => q.id === id)
}

export function createQuiz(data: Omit<Quiz, 'id'>): Quiz {
  const newQuiz: Quiz = { id: genId('quiz'), ...data }
  quizzes = [...quizzes, newQuiz]
  return newQuiz
}

export function updateQuiz(id: string, patch: Partial<Omit<Quiz, 'id'>>) {
  quizzes = quizzes.map(q => (q.id === id ? { ...q, ...patch } : q))
  return getQuizById(id)
}

export function deleteQuiz(id: string) {
  quizzes = quizzes.filter(q => q.id !== id)
  // also remove its questions
  quizQuestions = quizQuestions.filter(q => q.quizId !== id)
}

// ---------------------------------------
// QUIZ QUESTIONS
// ---------------------------------------

export function getQuestionsByQuiz(quizId: string): QuizQuestion[] {
  return quizQuestions.filter(q => q.quizId === quizId)
}

export function createQuizQuestion(data: Omit<QuizQuestion, 'id'>): QuizQuestion {
  const newQ: QuizQuestion = { id: genId('qq'), ...data }
  quizQuestions = [...quizQuestions, newQ]
  return newQ
}

export function deleteQuizQuestion(id: string) {
  quizQuestions = quizQuestions.filter(q => q.id !== id)
}

// ---------------------------------------
// RESET (optional, for dev/debug)
// ---------------------------------------

export function resetDb() {
  courses = [...mockCourses]
  modules = [...mockModules]
  lessons = [...mockLessons]
  quizzes = [...mockQuizzes]
  quizQuestions = [...mockQuizQuestions]
}
