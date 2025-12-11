'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

type Props = {
  quizId: string
}

export function DeleteQuizButton({ quizId }: Props) {
  const t = useTranslations('teacher.courseDetail.quizzesPage')
  const router = useRouter()
  const [pendingTransition, startTransition] = useTransition()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete quiz')
      startTransition(() => router.refresh())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className="text-red-600 hover:text-red-700"
      onClick={handleDelete}
      disabled={loading || pendingTransition}
    >
      {loading || pendingTransition ? t('deleting') : t('delete')}
    </Button>
  )
}
