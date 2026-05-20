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
      const response = await fetch("http://127.0.0.1:8000/api/token/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (response.ok) {

  // stockage JWT
  localStorage.setItem("access_token", data.access)
  localStorage.setItem("refresh_token", data.refresh)

  setMessage("")
  router.push("/dashboard")

} else {
  setMessage("Email ou mot de passe incorrect")
}
    } catch (error) {
      setMessage("Erreur serveur")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#120f2b]">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.35),_transparent_30%),linear-gradient(180deg,#6d28d9_0%,#241a59_36%,#17153b_72%,#1b1464_100%)]" />

      {/* Inner frame glow */}
      <div className="absolute inset-6 rounded-[2rem] border border-white/10 bg-black/10 shadow-[inset_0_0_80px_rgba(255,255,255,0.03)]" />

      {/* Stars */}
      <div className="absolute inset-0">
        <span className="star left-[4%] top-[5%]" />
        <span className="star left-[12%] top-[18%]" />
        <span className="star left-[18%] top-[72%]" />
        <span className="star left-[28%] top-[10%]" />
        <span className="star left-[36%] top-[22%]" />
        <span className="star left-[44%] top-[80%]" />
        <span className="star left-[52%] top-[14%]" />
        <span className="star left-[63%] top-[30%]" />
        <span className="star left-[76%] top-[8%]" />
        <span className="star left-[82%] top-[58%]" />
        <span className="star left-[88%] top-[22%]" />
        <span className="star left-[92%] top-[74%]" />
      </div>

      {/* Floating balls */}
      <div className="bubble bubble-xl left-[8%] top-[34%]" />
      <div className="bubble bubble-lg left-[28%] top-[6%]" />
      <div className="bubble bubble-md right-[10%] bottom-[10%]" />
      <div className="bubble bubble-sm right-[18%] top-[24%]" />
      <div className="bubble bubble-sm left-[22%] bottom-[18%]" />
      <div className="bubble bubble-xs left-[70%] top-[18%]" />
      <div className="bubble bubble-xs right-[6%] top-[12%]" />
      <div className="bubble bubble-xs right-[24%] bottom-[30%]" />
      <div className="bubble bubble-xs left-[78%] bottom-[18%]" />
      <div className="bubble bubble-xs left-[16%] top-[28%]" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(111,66,255,0.92),rgba(59,35,138,0.92))] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white">
              Sign In
            </h1>
            <p className="mt-2 text-sm text-white/75">
              Connectez-vous à votre dashboard intelligent
            </p>
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-white/90">Email</label>
              <input
                type="email"
                placeholder="Votre email"
                className="h-12 rounded-full border border-white/10 bg-[#1d2048]/90 px-4 text-white placeholder:text-white/40 outline-none transition-all duration-300 hover:border-white/20 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20 focus:shadow-[0_0_25px_rgba(34,211,238,0.15)]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-white/90">Password</label>
              <input
                type="password"
                placeholder="Votre mot de passe"
                className="h-12 rounded-full border border-white/10 bg-[#1d2048]/90 px-4 text-white placeholder:text-white/40 outline-none transition-all duration-300 hover:border-white/20 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20 focus:shadow-[0_0_25px_rgba(34,211,238,0.15)]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {message && (
              <p className="rounded-xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {message}
              </p>
            )}

            <button
              type="submit"
              className="mt-2 h-12 rounded-full bg-[linear-gradient(90deg,#7c3aed,#6366f1,#60a5fa)] text-sm font-semibold text-white shadow-[0_10px_30px_rgba(96,165,250,0.25)] transition hover:scale-[1.02] hover:shadow-[0_14px_36px_rgba(124,58,237,0.35)] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading}
            >
              {loading ? "Connexion..." : "Sign in"}
            </button>
          </form>

          
        </div>
      </div>
    </main>
  )
}