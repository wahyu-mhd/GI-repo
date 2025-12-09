import { NextResponse } from 'next/server'
import { markFeedbackRead, readFeedback } from '@/lib/feedbackFileStore'

export const runtime = 'nodejs'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ feedbackId: string }> }
) {
  const { feedbackId } = await params
  const all = await readFeedback()
  const entry = all.find(f => f.id === feedbackId)
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(entry)
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ feedbackId: string }> }
) {
  const { feedbackId } = await params
  const body = (await req.json()) as { read?: boolean }
  if (body.read !== true) {
    return NextResponse.json({ error: 'Only read:true is supported' }, { status: 400 })
  }

  const updated = await markFeedbackRead(feedbackId)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}
