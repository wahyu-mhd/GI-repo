'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type QuestionReply = {
  message: string
  visibility: 'public' | 'private'
  teacherName: string
  createdAt: string
}

type CourseQuestion = {
  id: string
  courseId: string
  studentId: string
  studentName: string
  message: string
  createdAt: string
  reply?: QuestionReply
}

type Props = {
  courseId: string
  viewerRole: 'student' | 'teacher'
  viewerName: string
  viewerId?: string
}

export function CourseQuestions({ courseId, viewerRole, viewerName, viewerId }: Props) {
  const t = useTranslations('questions')
  const locale = useLocale()

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale || 'en', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [locale]
  )

  const formatDate = (iso: string) => dateFormatter.format(new Date(iso))

  const [questions, setQuestions] = useState<CourseQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [questionDraft, setQuestionDraft] = useState('')
  const [postingQuestion, setPostingQuestion] = useState(false)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [replyVisibility, setReplyVisibility] = useState<Record<string, 'public' | 'private'>>({})
  const [postingReply, setPostingReply] = useState<Record<string, boolean>>({})
  const [searchTerm, setSearchTerm] = useState('')

  const sortedQuestions = useMemo(
    () =>
      [...questions].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [questions]
  )
  const filteredQuestions = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()
    if (!normalized) return sortedQuestions
    return sortedQuestions.filter(question => {
      const replyText = question.reply
        ? `${question.reply.teacherName} ${question.reply.message}`
        : ''
      const haystack = [
        question.studentName,
        question.message,
        replyText,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(normalized)
    })
  }, [searchTerm, sortedQuestions])

  const loadQuestions = async () => {
    try {
      setError(null)
      setLoading(true)
      const url =
        viewerRole === 'student' && viewerId
          ? `/api/courses/${courseId}/questions?studentId=${encodeURIComponent(viewerId)}`
          : `/api/courses/${courseId}/questions`
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load questions')
      const data = (await res.json()) as CourseQuestion[]
      setQuestions(data)
    } catch (err) {
      console.error(err)
      setError(t('loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuestions()
  }, [courseId, viewerRole, viewerId, t])

  useEffect(() => {
    setReplyDrafts(prev => {
      const next = { ...prev }
      questions.forEach(question => {
        if (next[question.id] === undefined) {
          next[question.id] = question.reply?.message ?? ''
        }
      })
      return next
    })
    setReplyVisibility(prev => {
      const next = { ...prev }
      questions.forEach(question => {
        if (!next[question.id]) {
          next[question.id] = question.reply?.visibility ?? 'private'
        }
      })
      return next
    })
  }, [questions])

  const handleAsk = async () => {
    if (!questionDraft.trim() || !viewerId) return
    setPostingQuestion(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: viewerId,
          studentName: viewerName,
          message: questionDraft,
        }),
      })
      if (!res.ok) throw new Error('Failed to create question')
      setQuestionDraft('')
      await loadQuestions()
    } catch (err) {
      console.error(err)
      setError(t('createError'))
    } finally {
      setPostingQuestion(false)
    }
  }

  const handleReply = async (questionId: string) => {
    const draft = replyDrafts[questionId]?.trim()
    if (!draft) return
    const visibility = replyVisibility[questionId] ?? 'private'

    setPostingReply(prev => ({ ...prev, [questionId]: true }))
    try {
      const res = await fetch(
        `/api/courses/${courseId}/questions/${questionId}/reply`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teacherName: viewerName,
            message: draft,
            visibility,
          }),
        }
      )
      if (!res.ok) throw new Error('Failed to reply')
      await loadQuestions()
    } catch (err) {
      console.error(err)
      setError(t('replyError'))
    } finally {
      setPostingReply(prev => ({ ...prev, [questionId]: false }))
    }
  }

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <p className="text-xs text-slate-500">
          {viewerRole === 'teacher' ? t('descriptionTeacher') : t('descriptionStudent')}
        </p>
      </div>

      {viewerRole === 'student' && (
        <div className="space-y-2 rounded-md border bg-slate-50/80 p-3">
          <p className="text-xs font-semibold text-slate-700">{t('askTitle')}</p>
          <Textarea
            value={questionDraft}
            onChange={e => setQuestionDraft(e.target.value)}
            placeholder={t('askPlaceholder')}
            rows={3}
          />
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{t('postingAs', { name: viewerName })}</span>
            <Button
              size="sm"
              onClick={handleAsk}
              disabled={postingQuestion || !questionDraft.trim()}
            >
              {postingQuestion ? t('posting') : t('postQuestion')}
            </Button>
          </div>
        </div>
      )}

      <div className="max-w-md">
        <Input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && !error && <p className="text-sm text-slate-500">{t('loading')}</p>}

      {!loading && !error && sortedQuestions.length === 0 && (
        <p className="text-sm text-slate-500">
          {viewerRole === 'teacher' ? t('emptyTeacher') : t('emptyStudent')}
        </p>
      )}

      {!loading && !error && sortedQuestions.length > 0 && filteredQuestions.length === 0 && (
        <p className="text-sm text-slate-500">{t('noResults')}</p>
      )}

      <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
        {filteredQuestions.map(question => {
          const askedBySelf = viewerId && question.studentId === viewerId
          const replyTag =
            question.reply?.visibility === 'public' ? t('replyPublicTag') : t('replyPrivateTag')

          return (
            <div key={question.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{question.message}</p>
                    <p className="text-xs text-slate-500">
                      {askedBySelf ? t('askedByYou') : t('askedBy', { name: question.studentName })}
                      {' · '}
                      {formatDate(question.createdAt)}
                    </p>
                  </div>
                  {question.reply && (
                    <Badge variant="secondary" className="uppercase tracking-wide">
                      {replyTag}
                    </Badge>
                  )}
                </div>

                {question.reply ? (
                  <div className="rounded-md border bg-white p-3 text-sm text-slate-700 space-y-1">
                    <p className="font-medium text-slate-800">{question.reply.teacherName}</p>
                    <p>{question.reply.message}</p>
                    <p className="text-[11px] text-slate-500">
                      {formatDate(question.reply.createdAt)}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">{t('noReply')}</p>
                )}

                {viewerRole === 'teacher' && (
                  <div className="space-y-2 rounded-md border border-slate-200 bg-white p-3">
                    <Textarea
                      value={replyDrafts[question.id] ?? ''}
                      onChange={e =>
                        setReplyDrafts(prev => ({ ...prev, [question.id]: e.target.value }))
                      }
                      placeholder={t('replyPlaceholder')}
                      rows={2}
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span>{t('replyingAs', { name: viewerName })}</span>
                      <div className="flex items-center gap-2">
                        <span>{t('visibilityLabel')}</span>
                        <Select
                          value={replyVisibility[question.id] ?? 'private'}
                          onValueChange={value =>
                            setReplyVisibility(prev => ({
                              ...prev,
                              [question.id]: value as 'public' | 'private',
                            }))
                          }
                        >
                          <SelectTrigger size="sm" className="w-[140px]">
                            <SelectValue placeholder={t('visibilityLabel')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="private">{t('visibilityPrivate')}</SelectItem>
                            <SelectItem value="public">{t('visibilityPublic')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleReply(question.id)}
                          disabled={
                            postingReply[question.id] ||
                            !(replyDrafts[question.id] ?? '').trim()
                          }
                        >
                          {postingReply[question.id] ? t('replying') : t('postReply')}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
