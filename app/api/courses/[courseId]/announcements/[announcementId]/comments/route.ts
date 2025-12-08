import { NextResponse } from 'next/server'
import {
  addAnnouncementComment,
  getCommentsForAnnouncementFile,
} from '@/lib/announcementFileStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ announcementId: string }> }
) {
  const { announcementId } = await params
  const comments = await getCommentsForAnnouncementFile(announcementId)
  return NextResponse.json(comments)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ announcementId: string }> }
) {
  const { announcementId } = await params

  try {
    const body = (await req.json()) as { message?: string; authorName?: string }
    const message = body.message?.trim()
    const authorName = body.authorName?.trim()

    if (!message || !authorName) {
      return NextResponse.json({ error: 'authorName and message are required' }, { status: 400 })
    }

    const created = await addAnnouncementComment({
      announcementId,
      authorName,
      message,
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('POST /api/courses/[courseId]/announcements/[announcementId]/comments error', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
