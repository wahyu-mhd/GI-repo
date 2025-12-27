import { NextResponse } from 'next/server'
import { getUserByEmail, updateUser } from '@/lib/userStore'
import { sendMockEmail } from '@/lib/emailMock'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string
      currentPassword?: string
      newPassword?: string
    }

    const email = body.email?.trim()
    const currentPassword = body.currentPassword?.trim()
    const newPassword = body.newPassword?.trim()

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'email, currentPassword, and newPassword are required' },
        { status: 400 }
      )
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'newPassword must be at least 6 characters' }, { status: 400 })
    }

    const user = await getUserByEmail(email)
    if (!user || !['student', 'teacher'].includes(user.role)) {
      return NextResponse.json({ error: 'user not found' }, { status: 404 })
    }
    if ((user.tempPassword || '').trim() !== currentPassword) {
      return NextResponse.json({ error: 'current password is incorrect' }, { status: 400 })
    }

    const updated = await updateUser(user.id, { tempPassword: newPassword })
    if (!updated) {
      return NextResponse.json({ error: 'failed to update password' }, { status: 500 })
    }

    if (updated.email) {
      await sendMockEmail({
        to: updated.email,
        subject: 'Your Parents LMS password was updated',
        text: [
          `Hi ${updated.name},`,
          '',
          `Your ${updated.role} password was updated successfully.`,
          'If you did not request this change, contact your administrator.',
        ].join('\n'),
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('POST /api/auth/change-password error', error)
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
  }
}
