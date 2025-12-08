'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type Announcement = {
  id: string
  courseId: string
  authorName: string
  message: string
  createdAt: string
}

type AnnouncementComment = {
  id: string
  announcementId: string
  authorName: string
  message: string
  createdAt: string
}

type AnnouncementThread = Announcement & { comments: AnnouncementComment[] }

type Props = {
  courseId: string
  viewerName: string
  canCreate?: boolean
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function formatDate(iso: string) {
  return dateFormatter.format(new Date(iso))
}

export function CourseAnnouncements({ courseId, viewerName, canCreate }: Props) {
  const [threads, setThreads] = useState<AnnouncementThread[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [announcementDraft, setAnnouncementDraft] = useState('')
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [postingAnnouncement, setPostingAnnouncement] = useState(false)
  const [postingComment, setPostingComment] = useState<Record<string, boolean>>({})

  const sortedThreads = useMemo(
    () =>
      [...threads].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [threads]
  )

  const loadAnnouncements = async () => {
    try {
      setError(null)
      setLoading(true)
      const res = await fetch(`/api/courses/${courseId}/announcements`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load announcements')
      const data = (await res.json()) as AnnouncementThread[]
      setThreads(data)
    } catch (err) {
      console.error(err)
      setError('Could not load announcements right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnnouncements()
  }, [courseId])

  const handleCreate = async () => {
    if (!announcementDraft.trim()) return
    setPostingAnnouncement(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorName: viewerName, message: announcementDraft }),
      })
      if (!res.ok) throw new Error('Failed to create announcement')

      setAnnouncementDraft('')
      await loadAnnouncements()
    } catch (err) {
      console.error(err)
      setError('Could not create announcement.')
    } finally {
      setPostingAnnouncement(false)
    }
  }

  const handleComment = async (announcementId: string) => {
    const draft = commentDrafts[announcementId]?.trim()
    if (!draft) return

    setPostingComment(prev => ({ ...prev, [announcementId]: true }))
    try {
      const res = await fetch(
        `/api/courses/${courseId}/announcements/${announcementId}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authorName: viewerName, message: draft }),
        }
      )
      if (!res.ok) throw new Error('Failed to post comment')

      setCommentDrafts(prev => ({ ...prev, [announcementId]: '' }))

      // update only this announcement thread to reduce flicker
      const commentsRes = await fetch(
        `/api/courses/${courseId}/announcements/${announcementId}/comments`,
        { cache: 'no-store' }
      )
      const comments = (await commentsRes.json()) as AnnouncementComment[]
      setThreads(prev =>
        prev.map(thread =>
          thread.id === announcementId ? { ...thread, comments } : thread
        )
      )
    } catch (err) {
      console.error(err)
      setError('Could not post comment.')
    } finally {
      setPostingComment(prev => ({ ...prev, [announcementId]: false }))
    }
  }

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Announcements</h2>
          <p className="text-xs text-slate-500">
            Share updates with the class; everyone can leave comments.
          </p>
        </div>
      </div>

      {canCreate && (
        <div className="space-y-2 rounded-md border bg-slate-50/80 p-3">
          <p className="text-xs font-semibold text-slate-700">New announcement</p>
          <Textarea
            value={announcementDraft}
            onChange={e => setAnnouncementDraft(e.target.value)}
            placeholder="Write something for the class..."
            rows={3}
          />
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Posting as {viewerName}</span>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={postingAnnouncement || !announcementDraft.trim()}
            >
              {postingAnnouncement ? 'Posting...' : 'Post announcement'}
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && !error && (
        <p className="text-sm text-slate-500">Loading announcements...</p>
      )}

      {!loading && !error && sortedThreads.length === 0 && (
        <p className="text-sm text-slate-500">
          No announcements yet. {canCreate ? 'Share the first update.' : 'Check back soon.'}
        </p>
      )}

      <div className="space-y-3">
        {sortedThreads.map(thread => (
          <div
            key={thread.id}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
          >
            <div className="flex gap-3">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-blue-600 text-white">
                <span className="text-sm font-semibold tracking-wide">AN</span>
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{thread.message}</p>
                    <p className="text-xs text-slate-500">
                      {thread.authorName} - {formatDate(thread.createdAt)}
                    </p>
                  </div>
                </div>

                {thread.comments.length > 0 && (
                  <div className="mt-3 space-y-2 rounded-md bg-white/70 p-3 text-sm text-slate-700">
                    {thread.comments.map(comment => (
                      <div key={comment.id} className="flex justify-between gap-2">
                        <div>
                          <p className="font-medium text-slate-800">{comment.authorName}</p>
                          <p className="text-sm">{comment.message}</p>
                        </div>
                        <p className="text-[11px] text-slate-500 min-w-[80px] text-right">
                          {formatDate(comment.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 space-y-2 rounded-md border border-slate-200 bg-white p-3">
                  <Textarea
                    value={commentDrafts[thread.id] ?? ''}
                    onChange={e =>
                      setCommentDrafts(prev => ({ ...prev, [thread.id]: e.target.value }))
                    }
                    placeholder="Leave a comment..."
                    rows={2}
                  />
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Commenting as {viewerName}</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleComment(thread.id)}
                      disabled={postingComment[thread.id] || !(commentDrafts[thread.id] ?? '').trim()}
                    >
                      {postingComment[thread.id] ? 'Posting...' : 'Post comment'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
