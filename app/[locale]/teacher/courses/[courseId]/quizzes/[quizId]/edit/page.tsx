// app/teacher/courses/[courseId]/quizzes/[quizId]/edit/page.tsx
'use client'

import { use, useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from '@/navigation'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import type { Quiz, QuizQuestion } from '@/lib/mockData'
import { RichTextEditor } from '@/components/editor/RichTextEditor'

type Props = {
  params: Promise<{ courseId: string; quizId: string }>
}

type EditableQuestion = {
  id?: string
  type: 'single' | 'multiple' | 'short' | 'long'
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

function normalizeSearchText(input?: string | null): string {
  return extractPlainText(input ?? '').toLowerCase()
}

export default function EditQuizPage({ params }: Props) {
  const { courseId, quizId } = use(params)
  const t = useTranslations('quiz')
  const tc = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [maxAttempts, setMaxAttempts] = useState<number | ''>('')
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | ''>('')
  const [availableFrom, setAvailableFrom] = useState<string>('')
  const [availableUntil, setAvailableUntil] = useState<string>('')
  const [showScoreToStudent, setShowScoreToStudent] = useState(true)
  const [showCorrectAnswersToStudent, setShowCorrectAnswersToStudent] = useState(true)
  const [questions, setQuestions] = useState<EditableQuestion[]>([])
  const [questionQuery, setQuestionQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [useUniformPoints, setUseUniformPoints] = useState(false)
  const [uniformPoints, setUniformPoints] = useState({ correct: 1, wrong: 0, skip: 0 })
  const normalizedQuestionQuery = questionQuery.trim().toLowerCase()
  const filteredQuestions = normalizedQuestionQuery
    ? questions
        .map((q, idx) => ({ q, idx }))
        .filter(({ q, idx }) => {
          const haystack = [
            normalizeSearchText(q.text),
            normalizeSearchText(q.explanation),
            normalizeSearchText(q.expectedAnswer),
            q.choices.map(choice => normalizeSearchText(choice)).join(' '),
            t('questionLabel', { index: idx + 1 }).toLowerCase(),
          ].join(' ')
          return haystack.includes(normalizedQuestionQuery)
        })
    : questions.map((q, idx) => ({ q, idx }))

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/quizzes/${quizId}`, { cache: 'no-store' })
        if (!res.ok) throw new Error(t('loadQuizError'))
        const data = await res.json()
        const loadedQuiz: Quiz = data.quiz ?? data
        const loadedQuestions: QuizQuestion[] = data.questions ?? []
        setQuiz(loadedQuiz)
        setTitle(loadedQuiz.title ?? '')
        setDescription(loadedQuiz.description ?? '')
        setMaxAttempts(
          loadedQuiz.maxAttempts !== undefined && loadedQuiz.maxAttempts !== null
            ? loadedQuiz.maxAttempts
            : ''
        )
        const formatDateTimeLocal = (iso?: string) => {
          if (!iso) return ''
          const date = new Date(iso)
          if (Number.isNaN(date.getTime())) return ''
          const pad = (val: number) => val.toString().padStart(2, '0')
          const year = date.getFullYear()
          const month = pad(date.getMonth() + 1)
          const day = pad(date.getDate())
          const hours = pad(date.getHours())
          const minutes = pad(date.getMinutes())
          return `${year}-${month}-${day}T${hours}:${minutes}`
        }
        setAvailableFrom(formatDateTimeLocal(loadedQuiz.availableFrom))
        setAvailableUntil(formatDateTimeLocal(loadedQuiz.availableUntil))
        setTimeLimitMinutes(
          loadedQuiz.timeLimitMinutes !== undefined && loadedQuiz.timeLimitMinutes !== null
            ? loadedQuiz.timeLimitMinutes
            : ''
        )
        setShowScoreToStudent(loadedQuiz.showScoreToStudent !== false)
        setShowCorrectAnswersToStudent(loadedQuiz.showCorrectAnswersToStudent !== false)
        const normalizedQuestions = loadedQuestions.map(q => ({
            id: q.id,
            type: q.type,
            text: extractPlainText(q.questionText),
            explanation: q.explanation,
            choices: q.choices ?? ['', ''],
            correctIndex: q.correctIndex,
            correctIndices: q.correctIndices,
            expectedAnswer: q.expectedAnswer,
            correctPoints: q.correctPoints ?? 1,
            wrongPoints: q.wrongPoints ?? 0,
            skipPoints: q.skipPoints ?? 0,
          }))
        setQuestions(normalizedQuestions)
        if (normalizedQuestions.length > 0) {
          const [first, ...rest] = normalizedQuestions
          const allSame = rest.every(q =>
            q.correctPoints === first.correctPoints &&
            q.wrongPoints === first.wrongPoints &&
            q.skipPoints === first.skipPoints
          )
          if (allSame) {
            setUseUniformPoints(true)
            setUniformPoints({
              correct: first.correctPoints ?? 1,
              wrong: first.wrongPoints ?? 0,
              skip: first.skipPoints ?? 0,
            })
          }
        }
      } catch (err) {
        console.error(err)
        setError(t('loadQuizError'))
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
      const parsedMaxAttempts = maxAttempts === '' ? null : Number(maxAttempts)
      const parsedTimeLimit = timeLimitMinutes === '' ? null : Number(timeLimitMinutes)
        const normalizeDateInput = (value: string) => {
          if (value === '') return null
          const date = new Date(value)
          if (Number.isNaN(date.getTime())) {
            throw new Error(t('invalidDate'))
          }
          return date.toISOString()
        }
        const normalizedAvailableFrom = normalizeDateInput(availableFrom)
        const normalizedAvailableUntil = normalizeDateInput(availableUntil)
        if (
          normalizedAvailableFrom &&
          normalizedAvailableUntil &&
          new Date(normalizedAvailableUntil).getTime() < new Date(normalizedAvailableFrom).getTime()
        ) {
          throw new Error(t('closeBeforeOpen'))
        }
        const payload = {
          title,
        description,
        maxAttempts:
          parsedMaxAttempts === null
            ? null
            : Number.isFinite(parsedMaxAttempts)
            ? parsedMaxAttempts
            : undefined,
        timeLimitMinutes:
          parsedTimeLimit === null
            ? null
            : Number.isFinite(parsedTimeLimit)
            ? parsedTimeLimit
            : undefined,
        availableFrom: normalizedAvailableFrom,
        availableUntil: normalizedAvailableUntil,
        showScoreToStudent,
        showCorrectAnswersToStudent,
        questions: questions.map(q => {
          const base = {
            id: q.id,
            questionText: extractPlainText(q.text),
            type: q.type,
            choices: q.choices,
            correctIndex: q.correctIndex,
            correctIndices: q.correctIndices,
            expectedAnswer: q.expectedAnswer,
            explanation: q.explanation?.trim() || undefined,
            correctPoints: q.correctPoints ?? 1,
            wrongPoints: q.wrongPoints ?? 0,
            skipPoints: q.skipPoints ?? 0,
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
        }),
      }
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const detail = await res.json().catch(() => null)
        throw new Error(detail?.error || t('updateFailed'))
      }
      setSuccess(true)
      router.refresh()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : t('saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">{tc('loading')}</p>
  }

  if (error || !quiz) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-red-600">{error ?? t('quizNotFound')}</p>
        <Button variant="link" onClick={() => router.back()}>{t('goBack')}</Button>
      </div>
    )
  }

  return (
    <section className="max-w-4xl space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">{t('editTitle')}</h1>
        <p className="text-sm text-slate-600">{t('courseId')}: {courseId}</p>
        {success && <p className="text-xs text-green-600">{t('saved')}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </header>

      <div className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
        <div className="space-y-1">
          <label className="text-sm font-medium">{t('titleLabel')}</label>
          <Input value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">{t('descriptionLabel')}</label>
          <Textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">{t('maxAttempts')}</label>
          <Input
            type="number"
            min={1}
            placeholder={t('maxAttemptsPlaceholder')}
            value={maxAttempts}
            onChange={e => setMaxAttempts(e.target.value === '' ? '' : Number(e.target.value))}
          />
          <p className="text-xs text-slate-500">{t('maxAttemptsHelp')}</p>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">{t('timeLimit')}</label>
          <Input
            type="number"
            min={1}
            placeholder={t('timeLimitPlaceholder')}
            value={timeLimitMinutes}
            onChange={e =>
              setTimeLimitMinutes(e.target.value === '' ? '' : Number(e.target.value))
            }
          />
          <p className="text-xs text-slate-500">{t('timeLimitHelp')}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">{t('opens')}</label>
            <Input
              type="datetime-local"
              lang="en-GB"
              value={availableFrom}
              onChange={e => setAvailableFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t('closes')}</label>
            <Input
              type="datetime-local"
              lang="en-GB"
              value={availableUntil}
              onChange={e => setAvailableUntil(e.target.value)}
            />
            <p className="text-xs text-slate-500">{t('closesHelp')}</p>
          </div>
        </div>
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showScoreToStudent}
              onChange={e => setShowScoreToStudent(e.target.checked)}
            />
            {t('showScoreToStudents')}
          </label>
          <p className="text-xs text-slate-500">{t('showScoreToStudentsHelp')}</p>
        </div>
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showCorrectAnswersToStudent}
              onChange={e => setShowCorrectAnswersToStudent(e.target.checked)}
            />
            {t('showCorrectAnswersToStudents')}
          </label>
          <p className="text-xs text-slate-500">{t('showCorrectAnswersToStudentsHelp')}</p>
        </div>
        <div className="rounded border p-3 space-y-2 bg-slate-50">
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="font-semibold">{t('useSamePoints')}</p>
              <p className="text-xs text-slate-600">{t('useSamePointsHelp')}</p>
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={useUniformPoints}
                onChange={e => setUseUniformPoints(e.target.checked)}
              />
              {t('enable')}
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-3 text-sm">
            <label className="space-y-1">
              <span className="text-xs font-medium">{t('pointsCorrect')}</span>
              <Input
                type="number"
                value={uniformPoints.correct}
                onChange={e => setUniformPoints(prev => ({ ...prev, correct: Number(e.target.value) || 0 }))}
                disabled={!useUniformPoints}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium">{t('pointsWrong')}</span>
              <Input
                type="number"
                value={uniformPoints.wrong}
                onChange={e => setUniformPoints(prev => ({ ...prev, wrong: Number(e.target.value) || 0 }))}
                disabled={!useUniformPoints}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium">{t('pointsSkip')}</span>
              <Input
                type="number"
                value={uniformPoints.skip}
                onChange={e => setUniformPoints(prev => ({ ...prev, skip: Number(e.target.value) || 0 }))}
                disabled={!useUniformPoints}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('questions')}</h2>
          <Button type="button" variant="outline" onClick={addQuestion}>+ {t('addQuestion')}</Button>
        </div>

        <div className="flex items-center gap-2">
          <Input
            value={questionQuery}
            onChange={e => setQuestionQuery(e.target.value)}
            placeholder={t('searchQuestionsPlaceholder')}
          />
          {questionQuery && (
            <Button type="button" variant="ghost" onClick={() => setQuestionQuery('')}>
              {t('clearSearch')}
            </Button>
          )}
        </div>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {filteredQuestions.map(({ q, idx }) => (
            <div key={q.id ?? idx} className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="text-sm font-medium">{t('questionLabel', { index: idx + 1 })}</div>
                <select
                  value={q.type}
                  onChange={e => updateQuestion(idx, { type: e.target.value as EditableQuestion['type'] })}
                  className="rounded border px-2 py-1 text-sm"
                >
                  <option value="single">{t('multipleChoice')}</option>
                  <option value="multiple">{t('multipleSelect')}</option>
                  <option value="short">{t('shortAnswer')}</option>
                  <option value="long">{t('longAnswer')}</option>
                </select>
              </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-600">{t('prompt')}</label>
              <RichTextEditor
                value={q.text}
                onChange={val => updateQuestion(idx, { text: val })}
                placeholder={t('promptPlaceholder')}
              />
            </div>

            {(q.type === 'single' || q.type === 'multiple') && (
              <div className="space-y-2">
                <div className="text-xs text-slate-600">{t('choices')}</div>
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
                      placeholder={t('choiceLabel', { index: cIdx + 1 })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChoice(idx, cIdx)}
                    >
                      {t('remove')}
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => addChoice(idx)}>+ {t('addChoice')}</Button>
              </div>
            )}

            {(q.type === 'short' || q.type === 'long') && (
              <div className="space-y-1">
                <label className="text-xs text-slate-600">{t('expectedAnswer')}</label>
                <RichTextEditor
                  value={q.expectedAnswer ?? ''}
                  onChange={val => updateQuestion(idx, { expectedAnswer: val })}
                  placeholder={t('expectedAnswerPlaceholder')}
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs text-slate-600">{t('explanation')}</label>
              <RichTextEditor
                value={q.explanation ?? ''}
                onChange={val => updateQuestion(idx, { explanation: val })}
                placeholder={t('explanationPlaceholder')}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-600">{t('pointsCorrect')}</label>
                <Input
                  type="number"
                  value={q.correctPoints ?? 1}
                  onChange={e => updateQuestion(idx, { correctPoints: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">{t('pointsWrong')}</label>
                <Input
                  type="number"
                  value={q.wrongPoints ?? 0}
                  onChange={e => updateQuestion(idx, { wrongPoints: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">{t('pointsSkip')}</label>
                <Input
                  type="number"
                  value={q.skipPoints ?? 0}
                  onChange={e => updateQuestion(idx, { skipPoints: Number(e.target.value) || 0 })}
                />
              </div>
            </div>

              <div className="flex justify-end">
                <Button type="button" variant="ghost" onClick={() => removeQuestion(idx)}>
                  {t('deleteQuestion')}
                </Button>
              </div>
            </div>
          ))}

          {questions.length === 0 && (
            <p className="text-sm text-slate-500">{t('noQuestions')}</p>
          )}
          {questions.length > 0 && filteredQuestions.length === 0 && (
            <p className="text-sm text-slate-500">{t('noQuestionsMatch')}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? t('saving') : t('saveChanges')}
        </Button>
        <Button variant="ghost" onClick={() => router.push(`/teacher/courses/${courseId}/quizzes`, { locale })}>
          {t('cancel')}
        </Button>
      </div>
    </section>
  )
}
