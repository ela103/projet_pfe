"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  setMessage("")

  const cleanEmail = email.trim().toLowerCase()

  if (!cleanEmail) {
    setMessage("L’adresse email est obligatoire.")
    return
  }

  try {
    setLoading(true)

    const response = await fetch(
      "http://127.0.0.1:8000/api/forgot-password/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cleanEmail,
        }),
      }
    )

    const data = await response.json()

if (!response.ok || !data.success) {
  setMessage(
    data.message ||
      "Une erreur est survenue pendant l’envoi du code."
  )
  return
}

router.push(
  `/verify-otp?email=${encodeURIComponent(cleanEmail)}`
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
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Mot de passe oublié
            </h1>

            <p className="mt-2 text-sm leading-6 text-white/75">
              Saisissez votre adresse email pour recevoir un code OTP.
            </p>
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-white/90">
                Adresse email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre email"
                required
                className="h-12 rounded-full border border-white/10 bg-[#1d2048]/90 px-4 text-white placeholder:text-white/40 outline-none transition-all duration-300 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20"
              />
            </div>

            {message && (
              <p className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white">
                {message}
              </p>
            )}

            <button
  type="submit"
  disabled={loading}
  className="mt-2 h-12 rounded-full bg-[linear-gradient(90deg,#7c3aed,#6366f1,#60a5fa)] text-sm font-semibold text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
>
  {loading ? "Envoi..." : "Envoyer le code"}
</button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/signin"
              className="text-sm font-medium text-cyan-200 transition hover:text-white hover:underline"
            >
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}