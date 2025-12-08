import { NextResponse } from 'next/server'
import { addUser, readUsers } from '@/lib/userStore'
import { sendMockEmail } from '@/lib/emailMock'

function generateDefaultPassword(role: 'student' | 'teacher') {
  const rand = Math.floor(100000 + Math.random() * 900000)
  const prefix = role === 'teacher' ? 'teacher' : 'student'
  return `${prefix}_${rand}`
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const users = await readUsers()
  return NextResponse.json(users)
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string
      email?: string
      role?: 'student' | 'teacher'
      canManageStudents?: boolean
    }
    if (!body.name || !body.role || !body.email) {
      return NextResponse.json({ error: 'name, role, and email are required' }, { status: 400 })
    }
    if (!['student', 'teacher'].includes(body.role)) {
      return NextResponse.json({ error: 'role must be student or teacher' }, { status: 400 })
    }
    const email = body.email.trim()
    if (!email) {
      return NextResponse.json({ error: 'email cannot be empty' }, { status: 400 })
    }
    const defaultPassword = generateDefaultPassword(body.role)
    const created = await addUser({
      name: body.name,
      email,
      role: body.role,
      canManageStudents: body.role === 'teacher' ? Boolean(body.canManageStudents) : undefined,
      tempPassword: defaultPassword,
    })

    if (created.email) {
      await sendMockEmail({
        to: created.email,
        subject: 'Welcome to Parents LMS',
        text: [
          `Hi ${created.name},`,
          '',
          `An account has been created for you as a ${created.role}.`,
          `Default password: ${defaultPassword}`,
          '',
          'Log in with your email and this password, then change it right away from your profile/settings page.',
        ].join('\n'),
      })
    }

    // Return password in response so superuser can surface it in UI if needed.
    return NextResponse.json({ ...created, defaultPassword }, { status: 201 })
  } catch (error) {
    console.error('POST /api/superuser/users error', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
