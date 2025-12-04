import { NextResponse } from 'next/server'
import { getModulesByCourse } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(_: Request, { params }: { params: { courseId: string } }) {
  return NextResponse.json(getModulesByCourse(params.courseId))
}
