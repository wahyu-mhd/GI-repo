import { NextResponse } from 'next/server'
import { readUsers, updateUser } from '@/lib/userStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const users = await readUsers()
  const teachers = users.filter(u => u.role === 'teacher' || u.role === 'superuser')
  return NextResponse.json(teachers)
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { id?: string; canManageStudents?: boolean }
    if (!body.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }
    const updated = await updateUser(body.id, { canManageStudents: body.canManageStudents })
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/superuser/teachers error', error)
    return NextResponse.json({ error: 'Failed to update teacher' }, { status: 500 })
  }
}
