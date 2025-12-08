import { NextResponse } from 'next/server'
import { deleteEnrollment } from '@/lib/userStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ enrollmentId: string }> }
) {
  const { enrollmentId } = await params
  const deleted = await deleteEnrollment(enrollmentId)
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
