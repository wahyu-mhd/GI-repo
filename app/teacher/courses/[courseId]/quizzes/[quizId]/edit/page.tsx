// app/teacher/courses/[courseId]/quizzes/[quizId]/edit/page.tsx
'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import type { Quiz, QuizQuestion } from '@/lib/mockData'

type Props = {
  params: Promise<{ courseId: string; quizId: string }>
}

type EditableQuestion = {
  id?: string
  type: 'single' | 'multiple' | 'short' | 'long'
  text: string
  choices: string[]
  correctIndex?: number
  correctIndices?: number[]
  expectedAnswer?: string
  correctPoints?: number
  wrongPoints?: number
  skipPoints?: number
}

function extractPlainText(input: string): string {
  if (!input) return ''
  try {
    const json = JSON.parse(input)
    const walk = (node: any): string => {
      if (!node) return ''
      if (typeof node.text === 'string') return node.text
      if (Array.isArray(node.children)) return node.children.map(walk).join(' ')
      return ''
    }
    return walk(json.root ?? json).trim()
  } catch {
    return input
  }
}

export default function EditQuizPage({ params }: Props) {
  const { courseId, quizId } = use(params)
  const router = useRouter()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<EditableQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/quizzes/${quizId}`, { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load quiz')
        const data = await res.json()
        const loadedQuiz: Quiz = data.quiz ?? data
        const loadedQuestions: QuizQuestion[] = data.questions ?? []
        setQuiz(loadedQuiz)
        setTitle(loadedQuiz.title ?? '')
        setDescription(loadedQuiz.description ?? '')
        setQuestions(
          loadedQuestions.map(q => ({
            id: q.id,
            type: q.type,
            text: extractPlainText(q.questionText),
            choices: q.choices ?? ['', ''],
            correctIndex: q.correctIndex,
            correctIndices: q.correctIndices,
            expectedAnswer: q.expectedAnswer,
            correctPoints: q.correctPoints ?? 1,
            wrongPoints: q.wrongPoints ?? 0,
            skipPoints: q.skipPoints ?? 0,
          }))
        )
      } catch (err) {
        console.error(err)
        setError('Could not load quiz.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [quizId])

  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      { type: 'single', text: '', choices: ['', '', ''], correctIndex: 0, correctIndices: [], correctPoints: 1, wrongPoints: 0, skipPoints: 0 },
    ])
  }

  const removeQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx))
  }

  const updateQuestion = (idx: number, patch: Partial<EditableQuestion>) => {
    setQuestions(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], ...patch }
      return next
    })
  }

  const addChoice = (qIdx: number) => {
    setQuestions(prev => {
      const next = [...prev]
      const q = next[qIdx]
      next[qIdx] = { ...q, choices: [...q.choices, ''] }
      return next
    })
  }

  const removeChoice = (qIdx: number, cIdx: number) => {
    setQuestions(prev => {
      const next = [...prev]
      const q = next[qIdx]
      const choices = q.choices.filter((_, i) => i !== cIdx)
      next[qIdx] = { ...q, choices }
      return next
    })
  }

  const updateChoice = (qIdx: number, cIdx: number, value: string) => {
    setQuestions(prev => {
      const next = [...prev]
      const q = next[qIdx]
      const choices = [...q.choices]
      choices[cIdx] = value
      next[qIdx] = { ...q, choices }
      return next
    })
  }

  const toggleCorrect = (qIdx: number, cIdx: number, checked: boolean) => {
    setQuestions(prev => {
      const next = [...prev]
      const q = next[qIdx]
      if (q.type === 'single') {
        next[qIdx] = { ...q, correctIndex: cIdx }
      } else {
        const set = new Set(q.correctIndices ?? [])
        checked ? set.add(cIdx) : set.delete(cIdx)
        next[qIdx] = { ...q, correctIndices: Array.from(set) }
      }
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const payload = {
        title,
        description,
        questions: questions.map(q => ({
          id: q.id,
          questionText: extractPlainText(q.text),
          type: q.type,
          choices: q.choices,
          correctIndex: q.correctIndex,
          correctIndices: q.correctIndices,
          expectedAnswer: q.expectedAnswer,
          correctPoints: q.correctPoints ?? 1,
          wrongPoints: q.wrongPoints ?? 0,
          skipPoints: q.skipPoints ?? 0,
        })),
      }
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const detail = await res.json().catch(() => null)
        throw new Error(detail?.error || 'Failed to update quiz')
      }
      setSuccess(true)
      router.refresh()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Could not save changes.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading quiz...</p>
  }

  if (error || !quiz) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-red-600">{error ?? 'Quiz not found.'}</p>
        <Button variant="link" onClick={() => router.back()}>Go back</Button>
      </div>
    )
  }

  return (
    <section className="max-w-4xl space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Edit Quiz</h1>
        <p className="text-sm text-slate-600">Course ID: {courseId}</p>
        {success && <p className="text-xs text-green-600">Saved</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </header>

      <div className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
        <div className="space-y-1">
          <label className="text-sm font-medium">Quiz title</label>
          <Input value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Description</label>
          <Textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Questions</h2>
          <Button type="button" variant="outline" onClick={addQuestion}>+ Add question</Button>
        </div>

        {questions.map((q, idx) => (
          <div key={q.id ?? idx} className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="text-sm font-medium">Question {idx + 1}</div>
              <select
                value={q.type}
                onChange={e => updateQuestion(idx, { type: e.target.value as EditableQuestion['type'] })}
                className="rounded border px-2 py-1 text-sm"
              >
                <option value="single">Multiple Choice</option>
                <option value="multiple">Multiple Select</option>
                <option value="short">Short Answer</option>
                <option value="long">Long Answer</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-600">Prompt</label>
              <Textarea
                rows={3}
                value={q.text}
                onChange={e => updateQuestion(idx, { text: e.target.value })}
              />
            </div>

            {(q.type === 'single' || q.type === 'multiple') && (
              <div className="space-y-2">
                <div className="text-xs text-slate-600">Choices</div>
                {q.choices.map((choice, cIdx) => (
                  <div key={cIdx} className="flex items-center gap-2">
                    {q.type === 'single' ? (
                      <input
                        type="radio"
                        name={`correct-${idx}`}
                        checked={q.correctIndex === cIdx}
                        onChange={() => updateQuestion(idx, { correctIndex: cIdx })}
                      />
                    ) : (
                      <input
                        type="checkbox"
                        checked={q.correctIndices?.includes(cIdx) ?? false}
                        onChange={e => toggleCorrect(idx, cIdx, e.target.checked)}
                      />
                    )}
                    <Input
                      className="flex-1"
                      value={choice}
                      onChange={e => updateChoice(idx, cIdx, e.target.value)}
                      placeholder={`Choice ${cIdx + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChoice(idx, cIdx)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => addChoice(idx)}>+ Add choice</Button>
              </div>
            )}

            {(q.type === 'short' || q.type === 'long') && (
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Expected answer (optional)</label>
                <Textarea
                  rows={q.type === 'short' ? 2 : 4}
                  value={q.expectedAnswer ?? ''}
                  onChange={e => updateQuestion(idx, { expectedAnswer: e.target.value })}
                />
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Points for correct</label>
                <Input
                  type="number"
                  value={q.correctPoints ?? 1}
                  onChange={e => updateQuestion(idx, { correctPoints: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Points for wrong</label>
                <Input
                  type="number"
                  value={q.wrongPoints ?? 0}
                  onChange={e => updateQuestion(idx, { wrongPoints: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Points for no answer</label>
                <Input
                  type="number"
                  value={q.skipPoints ?? 0}
                  onChange={e => updateQuestion(idx, { skipPoints: Number(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="button" variant="ghost" onClick={() => removeQuestion(idx)}>
                Delete question
              </Button>
            </div>
          </div>
        ))}

        {questions.length === 0 && (
          <p className="text-sm text-slate-500">No questions yet. Add one to get started.</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
        <Button variant="ghost" onClick={() => router.push(`/teacher/courses/${courseId}/quizzes`)}>
          Cancel
        </Button>
      </div>
    </section>
  )
}
