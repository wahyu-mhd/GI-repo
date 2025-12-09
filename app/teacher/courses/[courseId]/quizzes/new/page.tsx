'use client'

// import katex from 'katex'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
// import { notFound } from 'next/navigation'
// import { mockCourses } from '@/lib/mockData'
// import { createQuiz, createQuizQuestion } from '@/lib/db'
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
  explanation?: string
  choices: string[]
  correctIndex?: number
  correctIndices?: number[]
  expectedAnswer?: string
  correctPoints?: number
  wrongPoints?: number
  skipPoints?: number
}

type NewQuestion = {
  text: string
  explanation?: string
  choices: string[]
  correctIndex: number
}

type FormValues = {
  title: string
  description?: string
  maxAttempts?: number | ''
  questions: Question[]
}

function extractPlainText(input: string): string {
  if (!input) return ''
  try {
    const json = JSON.parse(input)
    const walk = (node: any): string => {
      if (!node) return ''
      if (typeof node.text === 'string') return node.text
      if (Array.isArray(node.children)) {
        return node.children.map(walk).join(' ')
      }
      return ''
    }
    return walk(json.root ?? json).trim()
  } catch {
    return input
  }
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

export default function NewQuizPage(){
    const params = useParams<{ courseId: string }>()
    const courseId = params?.courseId
    // const form = useForm<{ title: string; description: string; questions: Question[] }>({
    const form = useForm<FormValues>({
        defaultValues: {
        title: '',
        description: '',
        maxAttempts: '',
        questions: [
            { type: 'single', text: '', explanation: '', choices: ['', '', ''], correctIndex: 0, correctIndices: [], correctPoints: 1, wrongPoints: 0, skipPoints: 0 },
        ],
        },
    })
    const [course, setCourse] = useState<Course | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    // const course = mockCourses.find(c => c.id === params.courseId)
    
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [questions, setQuestions] = useState<NewQuestion[]>([{ text: '', choices: ['', '', '', ''], correctIndex: 0 },])
    const [submitting, setSubmitting] = useState(false)
    const [useUniformPoints, setUseUniformPoints] = useState(false)
    const [uniformPoints, setUniformPoints] = useState({ correct: 1, wrong: 0, skip: 0 })
    // const onSubmit = (values: FormValues) => {
    //     if (!course) return
    //   // do quiz creation here (createQuiz/createQuizQuestion, then router.push)
    //   const quiz = createQuiz({
    //     courseId: course.id,          // from your resolved course
    //     title: values.title,
    //     description: values.description,
    //   })
    
    //   values.questions.forEach(q => {
    //     createQuizQuestion({
    //         quizId: quiz.id,
    //         questionText: q.text,
    //         type: q.type,
    //         choices: q.choices,
    //         correctIndex: q.correctIndex,
    //         correctIndices: q.correctIndices,
    //         expectedAnswer: q.expectedAnswer,
    //     })

    //   })
    
    //   router.push(`/teacher/courses/${course.id}/quizzes`)
    // }
    const onSubmit = async (values: FormValues) => {
      if (!courseId) return
      setSubmitting(true)
      setError(null)
      try {
        const sanitizedQuestions = (values.questions ?? []).map(q => {
          const base = {
            ...q,
            text: extractPlainText(q.text),
            explanation: q.explanation?.trim() || undefined,
          }
          if (useUniformPoints) {
            return {
              ...base,
              correctPoints: uniformPoints.correct,
              wrongPoints: uniformPoints.wrong,
              skipPoints: uniformPoints.skip,
            }
          }
          return base
        })
        const parsedMaxAttempts =
          values.maxAttempts === undefined || values.maxAttempts === ''
            ? undefined
            : Number(values.maxAttempts)
        const res = await fetch(`/api/courses/${courseId}/quizzes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: values.title,
            description: values.description,
            maxAttempts: Number.isFinite(parsedMaxAttempts) ? parsedMaxAttempts : undefined,
            questions: sanitizedQuestions,
          }),
        })
        if (!res.ok) throw new Error('Failed to save quiz')
        router.push(`/teacher/courses/${courseId}/quizzes`)
      } catch (e) {
        setError('Could not save quiz')
      } finally {
        setSubmitting(false)
      }
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
        { type: 'single', text: '', explanation: '', choices: ['', '', ''], correctIndex: 0, correctIndices: [], expectedAnswer: '', correctPoints: 1, wrongPoints: 0, skipPoints: 0 },
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

    if (loading) return <p> loading....</p>
    if (error) return <p>{error}</p>
    if (!course) return <p>Course not found.</p>


    const handleAddQuestion = () => {
    setQuestions(qs => [
      ...qs,
      { text: '', explanation: '', choices: ['', '', '', ''], correctIndex: 0 },
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
                <FormField name="maxAttempts" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max attempts (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="Leave blank for unlimited"
                        value={field.value ?? ''}
                        onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="rounded border p-3 space-y-2 bg-slate-50">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-semibold">Use same points for all questions</p>
                      <p className="text-xs text-slate-600">If enabled, these values override per-question points.</p>
                    </div>
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={useUniformPoints}
                        onChange={e => setUseUniformPoints(e.target.checked)}
                      />
                      Enable
                    </label>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3 text-sm">
                    <label className="space-y-1">
                      <span className="text-xs font-medium">Points for correct</span>
                      <Input
                        type="number"
                        value={uniformPoints.correct}
                        onChange={e => setUniformPoints(prev => ({ ...prev, correct: Number(e.target.value) || 0 }))}
                        disabled={!useUniformPoints}
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-medium">Points for wrong</span>
                      <Input
                        type="number"
                        value={uniformPoints.wrong}
                        onChange={e => setUniformPoints(prev => ({ ...prev, wrong: Number(e.target.value) || 0 }))}
                        disabled={!useUniformPoints}
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-medium">Points for no answer</span>
                      <Input
                        type="number"
                        value={uniformPoints.skip}
                        onChange={e => setUniformPoints(prev => ({ ...prev, skip: Number(e.target.value) || 0 }))}
                        disabled={!useUniformPoints}
                      />
                    </label>
                  </div>
                </div>

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

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-1">
                    <FormLabel>Points for correct</FormLabel>
                    <Input
                      type="number"
                      value={q.correctPoints ?? 1}
                      onChange={e => updateQuestion(idx, { correctPoints: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1">
                    <FormLabel>Points for wrong</FormLabel>
                    <Input
                      type="number"
                      value={q.wrongPoints ?? 0}
                      onChange={e => updateQuestion(idx, { wrongPoints: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1">
                    <FormLabel>Points for no answer</FormLabel>
                    <Input
                      type="number"
                      value={q.skipPoints ?? 0}
                      onChange={e => updateQuestion(idx, { skipPoints: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                {(q.type === 'short' || q.type === 'long') && (
                    <RichTextEditor
                      value={q.expectedAnswer ?? ''}
                      onChange={val => updateQuestion(idx, { expectedAnswer: val })}
                      placeholder="Expected answer (optional, supports markdown/links)"
                    />
                    )}

                    <div className="space-y-1">
                      <FormLabel>Explanation / solution (optional)</FormLabel>
                      <RichTextEditor
                        value={q.explanation ?? ''}
                        onChange={val => updateQuestion(idx, { explanation: val })}
                        placeholder="Give students a brief explanation or how to solve"
                      />
                    </div>

                    <Button type="button" variant="ghost" onClick={() => removeQuestion(idx)}>Delete question</Button>
                </div>
                ))}

                <Button type="button" variant="outline" onClick={addQuestion}>+ Add question</Button>
                <Button type="submit" disabled={submitting}>Save Quiz</Button>
            </form>
        </Form>
    )
    
}
