// import { NextResponse } from 'next/server'
// import { deleteCourse, getCourseByIdFile } from '@/lib/courseFileStore'

// export const runtime = 'nodejs'
// export const dynamic = 'force-dynamic'

// export async function DELETE(
//   _req: Request,
//   { params }: { params: Promise<{ courseId: string }> }
// ) {
//   const { courseId } = await params
//   const course = await getCourseByIdFile(courseId)
//   if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 })

//   const deleted = await deleteCourse(courseId)
//   if (!deleted) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })

//   return NextResponse.json({ ok: true })
// }
import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseAdminClient()

  const { error } = await supabase.from('courses').delete().eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
