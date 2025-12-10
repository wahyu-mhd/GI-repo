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
  teacherId: string
  teacherName: string

  stage: Stage
  grade: Grade
  subject: Subject
}

export type QuizQuestion = {
  id: string
  quizId: string
  questionText: string
  type: 'single' | 'multiple' | 'short' | 'long'
  choices?: string[]
  correctIndex?: number       // single
  correctIndices?: number[]   // multiple
  expectedAnswer?: string     // short/long
  explanation?: string        // optional solution / rationale
  correctPoints?: number      // points for a correct answer
  wrongPoints?: number        // points for an incorrect answer
  skipPoints?: number         // points (likely 0) for unanswered
}

export type Quiz = {
  id: string
  courseId: string
  title: string
  description?: string
  maxAttempts?: number
  timeLimitMinutes?: number
  availableFrom?: string   // ISO string when quiz opens
  availableUntil?: string  // ISO string when quiz closes
}

export type QuizSubmissionResponse = {
  questionId: string
  questionText: string
  type: QuizQuestion['type']
  selectedIndex?: number | null
  selectedIndices?: number[]
  answerText?: string
  isCorrect: boolean
  correctIndex?: number
  correctIndices?: number[]
  choices?: string[]
}

export type QuizSubmission = {
  id: string
  studentId: string
  courseId: string
  quizId: string
  submittedAt: string
  earned: number
  possible: number
  responses: QuizSubmissionResponse[]
}

export type StudentProgress = {
  id: string
  studentId: string
  courseId: string
  startedAt: string
  updatedAt: string
  completedLessons: number
  totalLessons: number
  lastLessonId?: string
  lastQuizId?: string
  percentComplete?: number // optional override; otherwise compute from lessons
}

export type Announcement = {
  id: string
  courseId: string
  authorName: string
  message: string
  createdAt: string
}

export type AnnouncementComment = {
  id: string
  announcementId: string
  authorName: string
  message: string
  createdAt: string
}



// --- Mock data ---

export const mockCourses: Course[] = [
  {
    id: 'course-1',
    title: 'Math - Grade 3',
    description: 'Basic addition and subtraction for Grade 3.',
    teacherId: 'user-teacher-1',
    teacherName: 'Wahyu',
    stage: 'elementary',
    grade: 3,
    subject: 'math',
  },
  {
    id: 'course-2',
    title: 'English - Grade 8',
    description: 'Daily English conversation and reading practice.',
    teacherId: 'user-teacher-2',
    teacherName: 'Bapak Mahendra',
    stage: 'junior',
    grade: 8,
    subject: 'english',
  },
  {
    id: 'course-3',
    title: 'Science - Grade 5',
    description: 'Introduction to plants, animals, and basic experiments.',
    teacherId: 'user-teacher-3',
    teacherName: 'Ibu Wahyu',
    stage: 'elementary',
    grade: 5,
    subject: 'science',
  },
  {
    id: 'course-4',
    title: 'Physics - Grade 11',
    description: 'Mechanics, motion, and basic kinematics.',
    teacherId: 'user-teacher-3',
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
    type: 'single',
    choices: ['10', '11', '12', '13'],
    correctIndex: 2,
    explanation: 'Adding 5 and 7 gives 12. You can also think 7 + 3 = 10, plus 2 more.',
    correctPoints: 1,
    wrongPoints: 0,
    skipPoints: 0,
  },
  {
    id: 'q2',
    quizId: 'quiz-1',
    questionText: 'What is 9 + 3?',
    type: 'single',
    choices: ['11', '12', '13', '14'],
    correctIndex: 1,
    explanation: '9 + 3 = 12 because 9 needs 1 to reach 10, leaving 2 more.',
    correctPoints: 1,
    wrongPoints: 0,
    skipPoints: 0,
  },
]

export const mockQuizSubmissions: QuizSubmission[] = []

export const mockAnnouncements: Announcement[] = [
  {
    id: 'announcement-1',
    courseId: 'course-1',
    authorName: 'Wahyu',
    message: 'gustira pahlavi memposting materi baru: Progress Test 1 - 17 April',
    createdAt: '2024-04-17T02:00:00.000Z',
  },
  {
    id: 'announcement-2',
    courseId: 'course-1',
    authorName: 'Wahyu',
    message: 'gustira pahlavi memposting materi baru: Speaking practice',
    createdAt: '2023-08-21T02:00:00.000Z',
  },
  {
    id: 'announcement-3',
    courseId: 'course-1',
    authorName: 'Wahyu',
    message: 'gustira pahlavi memposting materi baru: Cambridge IELTS 16',
    createdAt: '2023-08-07T02:00:00.000Z',
  },
]

export const mockAnnouncementComments: AnnouncementComment[] = [
  {
    id: 'announcement-comment-1',
    announcementId: 'announcement-1',
    authorName: 'Student A',
    message: 'Thank you for the update!',
    createdAt: '2024-04-17T03:00:00.000Z',
  },
  {
    id: 'announcement-comment-2',
    announcementId: 'announcement-1',
    authorName: 'Student B',
    message: 'Noted, I will check it out.',
    createdAt: '2024-04-17T05:12:00.000Z',
  },
]

export const mockStudentProgress: StudentProgress[] = [
  {
    id: 'progress-1',
    studentId: 'user-student-1',
    courseId: 'course-1',
    startedAt: '2024-09-01T08:00:00.000Z',
    updatedAt: '2024-12-01T10:30:00.000Z',
    completedLessons: 3,
    totalLessons: 5,
    lastLessonId: 'lesson-2',
    lastQuizId: 'quiz-1',
  },
  {
    id: 'progress-2',
    studentId: 'user-student-1',
    courseId: 'course-2',
    startedAt: '2024-09-15T09:00:00.000Z',
    updatedAt: '2024-11-20T12:00:00.000Z',
    completedLessons: 1,
    totalLessons: 3,
  },
]
