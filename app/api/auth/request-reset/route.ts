import { NextResponse } from 'next/server'
import { getUserByEmail, updateUser } from '@/lib/userStore'
import { sendMockEmail } from '@/lib/emailMock'

function generateResetPassword() {
  const rand = Math.floor(100000 + Math.random() * 900000)
  return `student_${rand}`
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string }
    const email = body.email?.trim()
    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 })
    }

    const user = await getUserByEmail(email)
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'student not found' }, { status: 404 })
    }

    const newPassword = generateResetPassword()
    const updated = await updateUser(user.id, { tempPassword: newPassword })
    if (!updated) {
      return NextResponse.json({ error: 'failed to reset password' }, { status: 500 })
    }

    if (updated.email) {
      await sendMockEmail({
        to: updated.email,
        subject: 'Parents LMS password reset',
        text: [
          `Hi ${updated.name},`,
          '',
          'You requested a password reset.',
          `Temporary password: ${newPassword}`,
          '',
          'Log in and change it from your student settings page.',
        ].join('\n'),
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('POST /api/auth/request-reset error', error)
    return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 })
  }
}
