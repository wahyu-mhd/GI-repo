// lib/mockData.ts

// --- Types ---

export type Stage = 'elementary' | 'junior' | 'senior'

// you can also just use `number` if you prefer, but this keeps it strict
export type Grade =
  | 1 | 2 | 3 | 4 | 5 | 6
  | 7 | 8 | 9
  | 10 | 11 | 12

export type Subject =
  | 'math'
  | 'english'
  | 'science'
  | 'indonesian'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'others'

export type Lesson = {
  id: string
  moduleId: string
  title: string
  content: string
  videoUrl?: string
  pdfUrl?: string
}

export type Module = {
  id: string
  courseId: string
  title: string
  order: number
}

export type Course = {
  id: string
  title: string
  description: string
  teacherName: string

  stage: Stage
  grade: Grade
  subject: Subject
}

export type QuizQuestion = {
  id: string
  quizId: string
  questionText: string
  choices: string[]
  correctIndex: number
}

export type Quiz = {
  id: string
  courseId: string
  title: string
  description?: string
}

// --- Mock data ---

export const mockCourses: Course[] = [
  {
    id: 'course-1',
    title: 'Math - Grade 3',
    description: 'Basic addition and subtraction for Grade 3.',
    teacherName: 'Wahyu',
    stage: 'elementary',
    grade: 3,
    subject: 'math',
  },
  {
    id: 'course-2',
    title: 'English - Grade 8',
    description: 'Daily English conversation and reading practice.',
    teacherName: 'Bapak Mahendra',
    stage: 'junior',
    grade: 8,
    subject: 'english',
  },
  {
    id: 'course-3',
    title: 'Science - Grade 5',
    description: 'Introduction to plants, animals, and basic experiments.',
    teacherName: 'Ibu Wahyu',
    stage: 'elementary',
    grade: 5,
    subject: 'science',
  },
  {
    id: 'course-4',
    title: 'Physics - Grade 11',
    description: 'Mechanics, motion, and basic kinematics.',
    teacherName: 'Ibu Wahyu',
    stage: 'senior',
    grade: 11,
    subject: 'physics',
  },
]

export const mockModules: Module[] = [
  { id: 'module-1', courseId: 'course-1', title: 'Addition & Subtraction', order: 1 },
  { id: 'module-2', courseId: 'course-1', title: 'Word Problems', order: 2 },
  { id: 'module-3', courseId: 'course-2', title: 'Greetings & Introductions', order: 1 },
  { id: 'module-4', courseId: 'course-4', title: 'Kinematics Basics', order: 1 },
]

export const mockLessons: Lesson[] = [
  {
    id: 'lesson-1',
    moduleId: 'module-1',
    title: 'Adding 1-2 Digit Numbers',
    content: 'In this lesson, we practice adding 1-2 digit numbers with examples.',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    pdfUrl: '/sample/addition-practice.pdf', // just a placeholder
  },
  {
    id: 'lesson-2',
    moduleId: 'module-1',
    title: 'Subtracting 1-2 Digit Numbers',
    content: 'Now we practice subtraction using number lines and examples.',
  },
  {
    id: 'lesson-3',
    moduleId: 'module-3',
    title: 'Basic Greetings',
    content: 'Hello, Hi, Good morning, Good afternoon, Good evening.',
  },
  {
    id: 'lesson-4',
    moduleId: 'module-4',
    title: 'What is Velocity?',
    content: 'We define displacement, time, and velocity with simple examples.',
  },
]

export const mockQuizzes: Quiz[] = [
  {
    id: 'quiz-1',
    courseId: 'course-1',
    title: 'Addition Quiz 1',
    description: 'Check your understanding of basic addition.',
  },
]

export const mockQuizQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    quizId: 'quiz-1',
    questionText: 'What is 5 + 7?',
    choices: ['10', '11', '12', '13'],
    correctIndex: 2,
  },
  {
    id: 'q2',
    quizId: 'quiz-1',
    questionText: 'What is 9 + 3?',
    choices: ['11', '12', '13', '14'],
    correctIndex: 1,
  },
]
