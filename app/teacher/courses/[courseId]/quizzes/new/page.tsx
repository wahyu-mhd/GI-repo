'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
// import { notFound } from 'next/navigation'
// import { mockCourses } from '@/lib/mockData'
import { createQuiz, createQuizQuestion } from '@/lib/db'
import { Course } from '@/lib/mockData'
// import { promises } from 'dns'

type NewQuestion = {
  text: string
  choices: string[]
  correctIndex: number
}

export default function NewQuizPage({params,}: {params: Promise<{ courseId: string }>}){
    const [course, setCourse] = useState<Course | null>(null)
    const [courseId, setCourseId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    // const course = mockCourses.find(c => c.id === params.courseId)

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [questions, setQuestions] = useState<NewQuestion[]>([{ text: '', choices: ['', '', '', ''], correctIndex: 0 },])
    const [submitting, setSubmitting] = useState(false)
    useEffect(() => {
        params.then(({ courseId }) => setCourseId(courseId))
    }, [params])


    // useEffect(() => {
    //     const load = async () => {
    //         try{
    //             const res = await fetch('/api/courses', { cache: 'no-store'})
    //             const courses = await res.json()
    //             const found = courses.find((c: Course) => c.id ==params.courseId)
    //             setCourse(found ?? null)
    //         }
    //         catch(e){
    //             setError('Failed to load course')
    //         } finally{
    //              setLoading(false)
    //         }
    //     }
    //     load()
    // }, [params.courseId])

    useEffect(() => {
        if (!courseId) return
        const load = async () => {
        try {
            const res = await fetch('/api/courses', { cache: 'no-store' })
            const courses = (await res.json()) as Course[]
            const found = courses.find(c => c.id === courseId) ?? null
            setCourse(found)
        } catch {
            setError('Failed to load course')
        } finally {
            setLoading(false)
        }
        }
        load()
    }, [courseId])

    if (loading || !courseId) return <p> loading....</p>
    if (error) return <p>{error}</p>
    if (!course) return <p>Course not found.</p>

    const handleAddQuestion = () => {
    setQuestions(qs => [
      ...qs,
      { text: '', choices: ['', '', '', ''], correctIndex: 0 },
    ])
  }

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        const quiz = createQuiz({
            courseId: course.id,
            title,
            description,
        })

        questions.forEach(q => {
            createQuizQuestion({
            quizId: quiz.id,
            questionText: q.text,
            choices: q.choices,
            correctIndex: q.correctIndex,
            })
        })

        setSubmitting(false)
        router.push(`/teacher/courses/${course.id}/quizzes`)
    }

    return(
        <section className='max-w-3xl space-y-4'>
            <header>
                <h1 className='text-2xl font-bold'>Create Quiz</h1>
                <p className='text-sm text-slate-600'>
                    Course: <strong>{course.title}</strong>
                </p>
            </header>
            <form onSubmit={handleSubmit}className='space-y-6 rounded-lg border bg-white p-4 shadow-sm'>
                <div className='space-y-1'>
                    <label className="text-sm font-medium">Quiz Title</label>
                    <input
                    className="w-full rounded border px-3 py-2 text-sm"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                    />
                </div>

                <div>
                    <label className="text-sm font-medium">Description (optional)</label>
                    <textarea
                        className="w-full rounded border px-3 py-2 text-sm"
                        rows={2}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />
                </div>
                <div>
                    <h2 className="text-lg font-semibold">Questions</h2>
                        {questions.map((q, idx) => (
                            <div
                                key={idx}
                                className="space-y-3 rounded border bg-slate-50 p-3"
                            >
                                <div className='space-y-1'>
                                    <label className="text-sm font-medium">
                                        Question {idx + 1}
                                    </label>
                                    <textarea
                                        className="w-full rounded border px-3 py-2 text-sm"
                                        rows={3}
                                        placeholder="Write your question here (markdown allowed)"
                                        value={q.text}
                                        onChange={e => {
                                            const text = e.target.value
                                            setQuestions(prev => {
                                            const copy = [...prev]
                                            copy[idx] = { ...copy[idx], text }
                                            return copy
                                            })
                                        }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-slate-700">
                                        Choices (select the correct one)
                                    </p>
                                    {q.choices.map((choice, cIdx) => (
                                        <div key={cIdx} className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name={`correct-${idx}`}
                                                checked={q.correctIndex === cIdx}
                                                onChange={() => {
                                                    setQuestions(prev => {
                                                    const copy = [...prev]
                                                    copy[idx] = { ...copy[idx], correctIndex: cIdx }
                                                    return copy
                                                    })
                                                }}
                                            />
                                            <input
                                                className="flex-1 rounded border px-3 py-1 text-sm"
                                                placeholder={`Choice ${cIdx + 1}`}
                                                value={choice}
                                                onChange={e => {
                                                    const value = e.target.value
                                                    setQuestions(prev => {
                                                    const copy = [...prev]
                                                    const choicesCopy = [...copy[idx].choices]
                                                    choicesCopy[cIdx] = value
                                                    copy[idx] = { ...copy[idx], choices: choicesCopy }
                                                    return copy
                                                    })
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                </div>

                <button type="button" onClick={handleAddQuestion} className="rounded border px-3 py-1 text-sm hover:bg-slate-50">
                    + Add Question
                </button>

                <div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                        {submitting ? 'Saving…' : 'Save Quiz'}
                    </button>
                </div>

            </form>
        </section>
    )
}