// app/auth/register/page.tsx
'use client'

import { useSearchParams } from "next/navigation"
import { useState } from "react"

export default function RegisterPage() {
  const params = useSearchParams()
  const role = params.get("as") // student | teacher

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  return (
    <div className="max-w-md mx-auto mt-16 p-6 rounded-lg border bg-white shadow-sm">
      <h1 className="text-2xl font-bold mb-2">Register</h1>
      <p className="text-sm text-slate-600 mb-4">
        {role === "teacher"
          ? "Create Teacher Account"
          : "Create Student Account"}
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

        <button
          onClick={() => alert("Registration handled later with Supabase")}
          className="w-full mt-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-sm"
        >
          Register
        </button>
      </div>

      <p className="text-xs text-slate-500 mt-4">
        (This form will connect to Supabase later.)
      </p>
    </div>
  )
}
