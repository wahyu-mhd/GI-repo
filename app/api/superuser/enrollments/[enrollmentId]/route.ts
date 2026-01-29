// import { NextResponse } from 'next/server'
// import { deleteEnrollment } from '@/lib/userStore'

// export const runtime = 'nodejs'
// export const dynamic = 'force-dynamic'

// export async function DELETE(
//   _req: Request,
//   { params }: { params: Promise<{ enrollmentId: string }> }
// ) {
//   const { enrollmentId } = await params
//   const deleted = await deleteEnrollment(enrollmentId)
//   if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
//   return NextResponse.json({ ok: true })
// }
import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseAdminClient()

  const { error } = await supabase
    .from('enrollments')
    .delete()
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
