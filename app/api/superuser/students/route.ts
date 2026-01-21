// import { NextResponse } from 'next/server'
// import { readUsers } from '@/lib/userStore'

// export const runtime = 'nodejs'
// export const dynamic = 'force-dynamic'

// export async function GET() {
//   const users = await readUsers()
//   const students = users.filter(u => u.role === 'student')
//   return NextResponse.json(students)
// }
import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = createSupabaseAdminClient()

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, display_name, role')
    .eq('role', 'student')

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 })
  }

  const { data: usersRes, error: usersError } =
    await supabase.auth.admin.listUsers({ perPage: 1000 })

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 })
  }

  const emailById = new Map(
    usersRes.users.map(u => [u.id, u.email ?? ''])
  )

  const result = profiles.map(p => ({
    id: p.id,
    name: p.display_name,
    email: emailById.get(p.id) ?? '',
    role: p.role,
  }))

  return NextResponse.json(result)
}
