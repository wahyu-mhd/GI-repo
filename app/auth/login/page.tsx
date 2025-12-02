// app/auth/login/page.tsx
'use client'

import { useSearchParams, useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const params = useSearchParams()
  const router = useRouter()
  const role = params.get("as") // 'student' | 'teacher'

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  return (
    <div className="max-w-md mx-auto mt-16 p-6 rounded-lg border bg-white shadow-sm">
      <h1 className="text-2xl font-bold mb-2">Login</h1>
      <p className="text-sm text-slate-600 mb-4">
        {role === "teacher"
          ? "Login as Teacher"
          : "Login as Student"}
      </p>

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
            if (role === "teacher") router.push("/teacher/courses")
            else router.push("/student/courses")
          }}
          className="w-full mt-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-sm"
        >
          Login
        </button>
      </div>

      <p className="text-xs text-slate-500 mt-4">
        (Auth not connected yet — this is temporary redirect)
      </p>
    </div>
  )
}
