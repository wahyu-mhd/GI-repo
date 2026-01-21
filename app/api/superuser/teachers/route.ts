// import { NextResponse } from 'next/server'
// import { readUsers, updateUser } from '@/lib/userStore'

// export const runtime = 'nodejs'
// export const dynamic = 'force-dynamic'

// export async function GET() {
//   const users = await readUsers()
//   const teachers = users.filter(u => u.role === 'teacher' || u.role === 'superuser')
//   return NextResponse.json(teachers)
// }

// export async function PUT(request: Request) {
//   try {
//     const body = (await request.json()) as { id?: string; canManageStudents?: boolean }
//     if (!body.id) {
//       return NextResponse.json({ error: 'id is required' }, { status: 400 })
//     }
//     const updated = await updateUser(body.id, { canManageStudents: body.canManageStudents })
//     if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
//     return NextResponse.json(updated)
//   } catch (error) {
//     console.error('PUT /api/superuser/teachers error', error)
//     return NextResponse.json({ error: 'Failed to update teacher' }, { status: 500 })
//   }
// }
import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = createSupabaseAdminClient()

  // 1. Fetch profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, display_name, role, can_manage_students')
    .eq('role', 'teacher')

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 })
  }

  // 2. Fetch auth users (email)
  const { data: usersRes, error: usersError } =
    await supabase.auth.admin.listUsers({ perPage: 1000 })

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 })
  }

  const emailById = new Map(
    usersRes.users.map(u => [u.id, u.email ?? ''])
  )

  // 3. Merge + normalize shape
  const result = profiles.map(p => ({
    id: p.id,
    name: p.display_name,
    email: emailById.get(p.id) ?? '',
    role: p.role,
    canManageStudents: p.can_manage_students ?? false,
  }))

  return NextResponse.json(result)
}
