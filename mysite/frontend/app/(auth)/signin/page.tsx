"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage("")
    setLoading(true)

    try {
      const response = await fetch("http://localhost:8000/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage("Connexion réussie")
        router.push("/dashboard")
      } else {
        setMessage(data.message || "Email ou mot de passe incorrect")
      }
    } catch (error) {
      setMessage("Erreur serveur")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[80dvh] flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl bg-card p-6 ring-1 ring-border">
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Sign in
        </h1>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            className="h-10 px-3 rounded-md border"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="h-10 px-3 rounded-md border"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {message && <p className="text-red-500">{message}</p>}

          <button
            type="submit"
            className="h-10 bg-blue-500 text-white rounded-md"
            disabled={loading}
          >
            {loading ? "Connexion..." : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-sm">
          <Link href="/signup">Créer un compte</Link>
        </p>
      </div>
    </main>
  )
}