"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function VerifyOtpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const email = searchParams.get("email") || ""

  const [code, setCode] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage("")

    const cleanCode = code.trim()

    if (!email) {
      setMessage("L’adresse email est manquante.")
      return
    }

    if (!/^\d{6}$/.test(cleanCode)) {
      setMessage("Le code OTP doit contenir exactement 6 chiffres.")
      return
    }

    try {
      setLoading(true)

      const response = await fetch(
        "http://127.0.0.1:8000/api/verify-otp/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            code: cleanCode,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        setMessage(data.message || "Code OTP invalide.")
        return
      }

      router.push(
        `/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(cleanCode)}`
      )
    } catch {
      setMessage("Erreur de connexion au serveur.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#120f2b]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.35),_transparent_30%),linear-gradient(180deg,#6d28d9_0%,#241a59_36%,#17153b_72%,#1b1464_100%)]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(111,66,255,0.92),rgba(59,35,138,0.92))] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white">
              Vérifier le code
            </h1>

            <p className="mt-2 text-sm text-white/75">
              Saisissez le code à 6 chiffres reçu par e-mail.
            </p>

            {email && (
              <p className="mt-2 text-xs text-cyan-200">
                Code envoyé à {email}
              </p>
            )}
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => {
                const value = e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 6)

                setCode(value)
              }}
              placeholder="000000"
              minLength={6}
              maxLength={6}
              required
              className="h-14 rounded-full border border-white/10 bg-[#1d2048]/90 px-4 text-center text-2xl font-bold tracking-[0.4em] text-white outline-none focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20"
            />

            {message && (
              <p className="rounded-xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-12 rounded-full bg-[linear-gradient(90deg,#7c3aed,#6366f1,#60a5fa)] text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Vérification..." : "Vérifier le code"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-cyan-200 hover:text-white hover:underline"
            >
              Demander un nouveau code
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}