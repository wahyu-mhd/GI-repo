import { NextResponse } from 'next/server'
import { deleteUser, getUserById, updateUser } from '@/lib/userStore'

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const body = (await request.json()) as { name?: string; email?: string }
    if (!body.name || !body.email) {
      return NextResponse.json({ error: 'name and email are required' }, { status: 400 })
    }
    const user = await getUserById(userId)
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (user.role === 'superuser') {
      return NextResponse.json({ error: 'Cannot edit superuser' }, { status: 400 })
    }
    const updated = await updateUser(userId, {
      name: body.name.trim(),
      email: body.email.trim(),
    })
    if (!updated) return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/superuser/users/[userId] error', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
