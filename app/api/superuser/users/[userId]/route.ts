import { NextResponse } from 'next/server'
import { deleteUser, getUserById } from '@/lib/userStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  const user = await getUserById(userId)
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (user.role === 'superuser') {
    return NextResponse.json({ error: 'Cannot delete superuser' }, { status: 400 })
  }
  const deleted = await deleteUser(userId)
  if (!deleted) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
