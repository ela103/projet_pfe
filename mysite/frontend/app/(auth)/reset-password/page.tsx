"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const email = searchParams.get("email") || ""
  const code = searchParams.get("code") || ""

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage("")

    if (!email || !code) {
      setMessage("Les informations de réinitialisation sont manquantes.")
      return
    }

    if (!newPassword || !confirmPassword) {
      setMessage("Tous les champs sont obligatoires.")
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage("Les deux mots de passe ne correspondent pas.")
      return
    }

    if (newPassword.length < 8) {
      setMessage("Le mot de passe doit contenir au moins 8 caractères.")
      return
    }

    try {
  setLoading(true)

  const response = await fetch(
    "http://127.0.0.1:8000/api/reset-password/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        code,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    }
  )

  const data = await response.json()

  if (!response.ok || !data.success) {
    setMessage(
      data.message ||
        "Impossible de réinitialiser le mot de passe."
    )
    return
  }

  setMessage("Mot de passe réinitialisé avec succès.")

  setTimeout(() => {
    router.push("/signin")
  }, 1500)
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
              Nouveau mot de passe
            </h1>

            <p className="mt-2 text-sm text-white/75">
              Choisissez un nouveau mot de passe sécurisé.
            </p>
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-white/90">
                Nouveau mot de passe
              </label>

              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nouveau mot de passe"
                required
                className="h-12 rounded-full border border-white/10 bg-[#1d2048]/90 px-4 text-white placeholder:text-white/40 outline-none focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-white/90">
                Confirmer le mot de passe
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmer le mot de passe"
                required
                className="h-12 rounded-full border border-white/10 bg-[#1d2048]/90 px-4 text-white placeholder:text-white/40 outline-none focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20"
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
              className="h-12 rounded-full bg-[linear-gradient(90deg,#7c3aed,#6366f1,#60a5fa)] text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Modification..." : "Modifier le mot de passe"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/signin"
              className="text-sm font-medium text-cyan-200 hover:text-white hover:underline"
            >
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
} 