// import { NextResponse } from 'next/server'
// import { addUser, readUsers } from '@/lib/userStore'
// import { sendMockEmail } from '@/lib/emailMock'

// function generateDefaultPassword(role: 'student' | 'teacher') {
//   const rand = Math.floor(100000 + Math.random() * 900000)
//   const prefix = role === 'teacher' ? 'teacher' : 'student'
//   return `${prefix}_${rand}`
// }

// export const runtime = 'nodejs'
// export const dynamic = 'force-dynamic'

// export async function GET() {
//   const users = await readUsers()
//   return NextResponse.json(users)
// }

// export async function POST(request: Request) {
//   try {
//     const body = (await request.json()) as {
//       name?: string
//       email?: string
//       role?: 'student' | 'teacher'
//       canManageStudents?: boolean
//     }
//     if (!body.name || !body.role || !body.email) {
//       return NextResponse.json({ error: 'name, role, and email are required' }, { status: 400 })
//     }
//     if (!['student', 'teacher'].includes(body.role)) {
//       return NextResponse.json({ error: 'role must be student or teacher' }, { status: 400 })
//     }
//     const email = body.email.trim()
//     if (!email) {
//       return NextResponse.json({ error: 'email cannot be empty' }, { status: 400 })
//     }
//     const defaultPassword = generateDefaultPassword(body.role)
//     const created = await addUser({
//       name: body.name,
//       email,
//       role: body.role,
//       canManageStudents: body.role === 'teacher' ? Boolean(body.canManageStudents) : undefined,
//       tempPassword: defaultPassword,
//     })

//     if (created.email) {
//       await sendMockEmail({
//         to: created.email,
//         subject: 'Welcome to Parents LMS',
//         text: [
//           `Hi ${created.name},`,
//           '',
//           `An account has been created for you as a ${created.role}.`,
//           `Default password: ${defaultPassword}`,
//           '',
//           'Log in with your email and this password, then change it right away from your profile/settings page.',
//         ].join('\n'),
//       })
//     }

//     // Return password in response so superuser can surface it in UI if needed.
//     return NextResponse.json({ ...created, defaultPassword }, { status: 201 })
//   } catch (error) {
//     console.error('POST /api/superuser/users error', error)
//     return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
//   }
// }

import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { sendMockEmail } from '@/lib/emailMock'

function generateDefaultPassword(role: 'student' | 'teacher') {
  const rand = Math.floor(100000 + Math.random() * 900000)
  const prefix = role === 'teacher' ? 'teacher' : 'student'
  return `${prefix}_${rand}`
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  // const supabaseAdmin = createSupabaseAdminClient()
  // const { data, error } = await supabaseAdmin
  //   .from('profiles')
  //   .select('id, display_name,email , role, can_manage_students')

  // if (error) {
  //   return NextResponse.json({ error: error.message }, { status: 500 })
  // }

  // return NextResponse.json(
  //   data.map(u => ({
  //     ...u,
  //     canManageStudents: u.can_manage_students ?? false,
  //   }))
  // )
  const supabaseAdmin = createSupabaseAdminClient()

  // 1) Get profiles (no email here)
  const { data: profiles, error: profileErr } = await supabaseAdmin
    .from('profiles')
    .select('id, display_name, role, can_manage_students')

  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 })
  }

  // 2) Get auth users (emails live here)
  // NOTE: listUsers is paginated; adjust perPage if you expect more than 500 later.
  const { data: usersRes, error: usersErr } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  if (usersErr) {
    return NextResponse.json({ error: usersErr.message }, { status: 500 })
  }

  const emailById = new Map(usersRes.users.map((u) => [u.id, u.email ?? null]))

  // 3) Merge
  const result = (profiles ?? []).map((p) => ({
    id: p.id,
    display_name: p.display_name,
    role: p.role,
    email: emailById.get(p.id) ?? null,
    canManageStudents: p.can_manage_students ?? false,
  }))

  return NextResponse.json(result)
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

    const supabaseAdmin = createSupabaseAdminClient()
    const defaultPassword = generateDefaultPassword(body.role)

    const { data: createdUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: { name: body.name, role: body.role },
      })

    if (createError || !createdUser.user) {
      return NextResponse.json({ error: createError?.message ?? 'Failed to create user' }, { status: 500 })
    }

    // const { error: profileError } = await supabaseAdmin
    //   .from('profiles')
    //   .insert({
    //     id: createdUser.user.id,
    //     display_name: body.name,
    //     email,
    //     role: body.role,
    //     can_manage_students: body.role === 'teacher' ? Boolean(body.canManageStudents) : null,
    //   })
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: createdUser.user.id,
          display_name: body.name,
          role: body.role,
          can_manage_students: body.role === 'teacher' ? Boolean(body.canManageStudents) : false,
        },
        { onConflict: 'id' }
      )

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(createdUser.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    if (email) {
      await sendMockEmail({
        to: email,
        subject: 'Welcome to Parents LMS',
        text: [
          `Hi ${body.name},`,
          '',
          `An account has been created for you as a ${body.role}.`,
          `Default password: ${defaultPassword}`,
          '',
          'Log in with your email and this password, then change it right away from your profile/settings page.',
        ].join('\n'),
      })
    }

    return NextResponse.json(
      {
        id: createdUser.user.id,
        name: body.name,
        email,
        role: body.role,
        canManageStudents: body.role === 'teacher' ? Boolean(body.canManageStudents) : undefined,
        defaultPassword,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/superuser/users error', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

