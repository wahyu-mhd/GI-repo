import { NextResponse } from 'next/server'
import { readUsers } from '@/lib/userStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const users = await readUsers()
  const students = users.filter(u => u.role === 'student')
  return NextResponse.json(students)
}
