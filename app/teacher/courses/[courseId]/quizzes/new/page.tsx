'use client'

// import katex from 'katex'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
// import { notFound } from 'next/navigation'
// import { mockCourses } from '@/lib/mockData'
import { createQuiz, createQuizQuestion } from '@/lib/db'
import { Course } from '@/lib/mockData'
// import { promises } from 'dns'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { useForm } from 'react-hook-form'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

import { Input } from '@/components/ui/input'

type QuestionType = 'single' | 'multiple' | 'short' | 'long'
type Question = {
  type: QuestionType
  text: string
  choices: string[]
  correctIndex?: number
  correctIndices?: number[]
  expectedAnswer?: string
}

type NewQuestion = {
  text: string
  choices: string[]
  correctIndex: number
}

type FormValues = {
  title: string
  description?: string
  questions: Question[]
}

// function LatexPreview({ value }: { value: string }) {
//   const [html, setHtml] = useState(value)
//   useEffect(() => {
//     const src = value.trim()
//     try {
//       setHtml(katex.renderToString(src, { throwOnError: false }))
//     } catch {
//       setHtml(src)
//     }
//   }, [value])
//   return <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
// }


// const form = useForm<{ title: string; description: string; questions: Question[] }>()

export default function NewQuizPage({params,}: {params: Promise<{ courseId: string }>}){
    const form = useForm<{ title: string; description: string; questions: Question[] }>({
        defaultValues: {
        title: '',
        description: '',
        questions: [
            { type: 'single', text: '', choices: ['', '', ''], correctIndex: 0, correctIndices: [] },
        ],
        },
    })
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
    const onSubmit = (values: FormValues) => {
        if (!course) return
      // do your quiz creation here (createQuiz/createQuizQuestion, then router.push)
      const quiz = createQuiz({
        courseId: course.id,          // from your resolved course
        title: values.title,
        description: values.description,
      })
    
      values.questions.forEach(q => {
        createQuizQuestion({
            quizId: quiz.id,
            questionText: q.text,
            type: q.type,
            choices: q.choices,
            correctIndex: q.correctIndex,
            correctIndices: q.correctIndices,
            expectedAnswer: q.expectedAnswer,
        })

      })
    
      router.push(`/teacher/courses/${course.id}/quizzes`)
    }
    
    const updateQuestion = (idx: number, patch: Partial<Question>) => {
      const qs = form.getValues('questions').slice()
      qs[idx] = { ...qs[idx], ...patch }
      form.setValue('questions', qs, { shouldDirty: true })
    }
    
    const addQuestion = () => {
      const qs = form.getValues('questions')
      form.setValue('questions', [
        ...qs,
        { type: 'single', text: '', choices: ['', '', ''], correctIndex: 0, correctIndices: [], expectedAnswer: '' },
      ], { shouldDirty: true })
    }
    
    const removeQuestion = (idx: number) => {
      const qs = form.getValues('questions').slice()
      qs.splice(idx, 1)
      form.setValue('questions', qs, { shouldDirty: true })
    }
    
    const addChoice = (qIdx: number) => {
      const qs = form.getValues('questions').slice()
      qs[qIdx] = { ...qs[qIdx], choices: [...qs[qIdx].choices, ''] }
      form.setValue('questions', qs, { shouldDirty: true })
    }
    
    const removeChoice = (qIdx: number, cIdx: number) => {
      const qs = form.getValues('questions').slice()
      const choices = qs[qIdx].choices.slice()
      choices.splice(cIdx, 1)
      qs[qIdx] = { ...qs[qIdx], choices }
      form.setValue('questions', qs, { shouldDirty: true })
    }
    
    const updateChoice = (qIdx: number, cIdx: number, value: string) => {
      const qs = form.getValues('questions').slice()
      const choices = qs[qIdx].choices.slice()
      choices[cIdx] = value
      qs[qIdx] = { ...qs[qIdx], choices }
      form.setValue('questions', qs, { shouldDirty: true })
    }
    
    const toggleCorrect = (qIdx: number, cIdx: number, checked: boolean) => {
      const qs = form.getValues('questions').slice()
      const q = qs[qIdx]
      if (q.type === 'single') {
        qs[qIdx] = { ...q, correctIndex: cIdx }
      } else {
        const set = new Set(q.correctIndices ?? [])
        checked ? set.add(cIdx) : set.delete(cIdx)
        qs[qIdx] = { ...q, correctIndices: Array.from(set) }
      }
      form.setValue('questions', qs, { shouldDirty: true })
    }
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

    // const handleSubmit = (e: FormEvent) => {
    //     e.preventDefault()
    //     setSubmitting(true)

    //     const quiz = createQuiz({
    //         courseId: course.id,
    //         title,
    //         description,
    //     })

    //     questions.forEach(q => {
    //         createQuizQuestion({
    //         quizId: quiz.id,
    //         questionText: q.text,
    //         choices: q.choices,
    //         correctIndex: q.correctIndex,
    //         })
    //     })

    //     setSubmitting(false)
    //     router.push(`/teacher/courses/${course.id}/quizzes`)
    // }

    // return(
    //     <section className='max-w-3xl space-y-4'>
    //         <header>
    //             <h1 className='text-2xl font-bold'>Create Quiz</h1>
    //             <p className='text-sm text-slate-600'>
    //                 Course: <strong>{course.title}</strong>
    //             </p>
    //         </header>
    //         <form onSubmit={handleSubmit}className='space-y-6 rounded-lg border bg-white p-4 shadow-sm'>
    //             <div className='space-y-1'>
    //                 <label className="text-sm font-medium">Quiz Title</label>
    //                 <input
    //                 className="w-full rounded border px-3 py-2 text-sm"
    //                 value={title}
    //                 onChange={e => setTitle(e.target.value)}
    //                 required
    //                 />
    //             </div>

    //             <div>
    //                 <label className="text-sm font-medium">Description (optional)</label>
    //                 <textarea
    //                     className="w-full rounded border px-3 py-2 text-sm"
    //                     rows={2}
    //                     value={description}
    //                     onChange={e => setDescription(e.target.value)}
    //                 />
    //             </div>
    //             <div>
    //                 <h2 className="text-lg font-semibold">Questions</h2>
    //                     {questions.map((q, idx) => (
    //                         <div
    //                             key={idx}
    //                             className="space-y-3 rounded border bg-slate-50 p-3"
    //                         >
    //                             <div className='space-y-1'>
    //                                 <label className="text-sm font-medium">
    //                                     Question {idx + 1}
    //                                 </label>
    //                                 <textarea
    //                                     className="w-full rounded border px-3 py-2 text-sm"
    //                                     rows={3}
    //                                     placeholder="Write your question here (markdown allowed)"
    //                                     value={q.text}
    //                                     onChange={e => {
    //                                         const text = e.target.value
    //                                         setQuestions(prev => {
    //                                         const copy = [...prev]
    //                                         copy[idx] = { ...copy[idx], text }
    //                                         return copy
    //                                         })
    //                                     }}
    //                                 />
    //                             </div>

    //                             <div className="space-y-2">
    //                                 <p className="text-xs font-medium text-slate-700">
    //                                     Choices (select the correct one)
    //                                 </p>
    //                                 {q.choices.map((choice, cIdx) => (
    //                                     <div key={cIdx} className="flex items-center gap-2">
    //                                         <input
    //                                             type="radio"
    //                                             name={`correct-${idx}`}
    //                                             checked={q.correctIndex === cIdx}
    //                                             onChange={() => {
    //                                                 setQuestions(prev => {
    //                                                 const copy = [...prev]
    //                                                 copy[idx] = { ...copy[idx], correctIndex: cIdx }
    //                                                 return copy
    //                                                 })
    //                                             }}
    //                                         />
    //                                         <input
    //                                             className="flex-1 rounded border px-3 py-1 text-sm"
    //                                             placeholder={`Choice ${cIdx + 1}`}
    //                                             value={choice}
    //                                             onChange={e => {
    //                                                 const value = e.target.value
    //                                                 setQuestions(prev => {
    //                                                 const copy = [...prev]
    //                                                 const choicesCopy = [...copy[idx].choices]
    //                                                 choicesCopy[cIdx] = value
    //                                                 copy[idx] = { ...copy[idx], choices: choicesCopy }
    //                                                 return copy
    //                                                 })
    //                                             }}
    //                                         />
    //                                     </div>
    //                                 ))}
    //                             </div>
    //                         </div>
    //                     ))}
    //             </div>

    //             <button type="button" onClick={handleAddQuestion} className="rounded border px-3 py-1 text-sm hover:bg-slate-50">
    //                 + Add Question
    //             </button>

    //             <div>
    //                 <button
    //                     type="submit"
    //                     disabled={submitting}
    //                     className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
    //                 >
    //                     {submitting ? 'Saving…' : 'Save Quiz'}
    //                 </button>
    //             </div>

    //         </form>
    //     </section>
    // )

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField name="title" control={form.control} render={({ field }) => (
                <FormItem>
                    <FormLabel>Quiz Title</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )} />
                <FormField name="description" control={form.control} render={({ field }) => (
                <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl><Textarea rows={2} {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )} />

                {form.watch('questions').map((q, idx) => (
                <div key={idx} className="space-y-3 rounded border p-3">
                    <div className="flex gap-2">
                    <FormLabel className="flex-1">Question {idx + 1}</FormLabel>
                    <Select
                        value={q.type}
                        onValueChange={val => updateQuestion(idx, { type: val as QuestionType })}
                    >
                        <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="single">Multiple Choice</SelectItem>
                        <SelectItem value="multiple">Multiple Select</SelectItem>
                        <SelectItem value="short">Short Answer</SelectItem>
                        <SelectItem value="long">Long Answer</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>

                    <RichTextEditor
                        value={q.text}
                        onChange={val => updateQuestion(idx, { text: val })}
                        placeholder="Question prompt"
                        />
                    {/* <RichTextEditor value={q.text} onChange={val => updateQuestion(idx, { text: val })} /> */}

                    

                    {(q.type === 'single' || q.type === 'multiple') && (
                    <div className="space-y-2">
                        {q.choices.map((choice, cIdx) => (
                        <div key={cIdx} className="flex item-center gap-2">
                            {q.type === 'single' ? (
                            <RadioGroup
                                value={String(q.correctIndex ?? '')}
                                onValueChange={val => updateQuestion(idx, { correctIndex: Number(val) })}
                            >
                                <RadioGroupItem value={String(cIdx)} />
                            </RadioGroup>
                            ) : (
                            <Checkbox
                                checked={q.correctIndices?.includes(cIdx) ?? false}
                                onCheckedChange={checked => toggleCorrect(idx, cIdx, checked== true)}
                            />
                            )}
                            <Input
                            className="flex-1"
                            value={choice}
                            onChange={e => updateChoice(idx, cIdx, e.target.value)}
                            placeholder={`Choice ${cIdx + 1}`}
                            />
                            {/* <RichTextEditor value={q.text} onChange={val => updateQuestion(idx, { text: val })} /> */}
                            {/* <RichTextEditor value={choice} onChange={val => updateChoice(idx, cIdx, val)} /> */}


                            <Button type="button" variant="ghost" onClick={() => removeChoice(idx, cIdx)}>Remove</Button>
                        </div>
                        ))}
                        <Button type="button" variant="outline" onClick={() => addChoice(idx)}>+ Add option</Button>
                    </div>
                    )}

                    {(q.type === 'short' || q.type === 'long') && (
                    <Textarea
                        rows={q.type === 'short' ? 2 : 4}
                        value={q.expectedAnswer ?? ''}
                        onChange={e => updateQuestion(idx, { expectedAnswer: e.target.value })}
                        placeholder="Expected answer (optional)"
                    />
                    )}

                    <Button type="button" variant="ghost" onClick={() => removeQuestion(idx)}>Delete question</Button>
                </div>
                ))}

                <Button type="button" variant="outline" onClick={addQuestion}>+ Add question</Button>
                <Button type="submit" disabled={submitting}>Save Quiz</Button>
            </form>
        </Form>
    )
    
}