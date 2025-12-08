import { NextResponse } from 'next/server'
import {
  addAnnouncement,
  getAnnouncementThreadByCourse,
} from '@/lib/announcementFileStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params
  const announcements = await getAnnouncementThreadByCourse(courseId)
  return NextResponse.json(announcements)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params

  try {
    const body = (await req.json()) as { message?: string; authorName?: string }
    const message = body.message?.trim()
    const authorName = body.authorName?.trim()

    if (!message || !authorName) {
      return NextResponse.json({ error: 'authorName and message are required' }, { status: 400 })
    }

    const created = await addAnnouncement({
      courseId,
      authorName,
      message,
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('POST /api/courses/[courseId]/announcements error', error)
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
  }
}
