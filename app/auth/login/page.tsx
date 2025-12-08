// app/auth/login/page.tsx
'use client'

import { useSearchParams, useRouter } from "next/navigation"
import { useState } from "react"
import { saveMockSession } from "@/lib/sessionMock"

export default function LoginPage() {
  const params = useSearchParams()
  const router = useRouter()
  const initialRole = params.get("as") === 'student' ? 'student' : 'teacher'
  const [role, setRole] = useState<'student' | 'teacher' | 'superuser'>(
    initialRole === 'teacher' ? 'teacher' : 'student'
  )

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  return (
    <div className="max-w-md mx-auto mt-16 p-6 rounded-lg border bg-white shadow-sm">
      <h1 className="text-2xl font-bold mb-2">Login</h1>
      <p className="text-sm text-slate-600 mb-4">
        {role === "superuser"
          ? "Login as Superuser"
          : role === "teacher"
            ? "Login as Teacher"
            : "Login as Student"}
      </p>

      {initialRole === 'teacher' && (
        <div className="mb-3 flex gap-3 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={role === 'teacher'}
              onChange={() => setRole('teacher')}
            />
            Teacher
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={role === 'superuser'}
              onChange={() => setRole('superuser')}
            />
            Superuser
          </label>
        </div>
      )}

      <div className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          className="w-full rounded border px-3 py-2 text-sm"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full rounded border px-3 py-2 text-sm"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        {/* TEMPORARY: Mock login until Supabase is wired */}
        <button
          onClick={() => {
            const session = {
              id: role === 'superuser' ? 'user-super-1' : role === 'teacher' ? 'user-teacher-1' : 'user-student-1',
              name: role === 'superuser' ? 'Super Admin' : role === 'teacher' ? 'Wahyu' : 'Student User',
              role,
            }
            saveMockSession(session)

            if (role === "teacher") router.push("/teacher/courses")
            else if (role === "superuser") router.push("/superuser")
            else router.push("/student/courses")
          }}
          className="w-full mt-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-sm"
        >
          Login
        </button>
      </div>

      <p className="text-xs text-slate-500 mt-4">
        (Auth not connected yet — this is a temporary mock login)
      </p>
    </div>
  )
}
