"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, ArrowLeft, BadgeCheck, KeyRound } from "lucide-react"

export default function VerifyOtpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const email = searchParams.get("email") || ""

  const [code, setCode] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
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

      const response = await fetch("http://127.0.0.1:8000/api/verify-otp/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code: cleanCode,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setMessage(data.message || "Code OTP invalide.")
        return
      }

      router.push(`/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(cleanCode)}`)
    } catch {
      setMessage("Erreur de connexion au serveur.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="neon-login-page">
      <div className="neon-grid" />
      <div className="neon-orb neon-orb--one" />
      <div className="neon-orb neon-orb--two" />

      <div className="neon-auth-shell">
        <div className="neon-form-glow" />
        <div className="neon-form-card neon-auth-card">
          <div className="neon-auth-icon">
            <BadgeCheck />
          </div>

          <div className="neon-form-card__heading">
            <span className="neon-form-card__eyebrow">VÉRIFICATION</span>
            <h2>Code de sécurité</h2>
            <p>Saisissez le code à 6 chiffres reçu par email.</p>
            {email && <p className="neon-auth-email">Envoyé à {email}</p>}
          </div>

          <form onSubmit={handleSubmit} className="neon-form neon-otp-form">
            <label htmlFor="otp-code">Code OTP</label>
            <div className="neon-input neon-input--otp">
              <KeyRound />
              <input
                id="otp-code"
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(event) => {
                  const value = event.target.value.replace(/\D/g, "").slice(0, 6)
                  setCode(value)
                }}
                placeholder="Code à 6 chiffres"
                minLength={6}
                maxLength={6}
                required
              />
            </div>

            {message && (
              <div className="neon-form__error neon-form__error--with-icon" role="alert">
                <AlertCircle />
                <span>{message}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="neon-submit">
              <span>{loading ? "Vérification..." : "Vérifier le code"}</span>
            </button>
          </form>

          <Link href="/forgot-password" className="neon-auth-back">
            <ArrowLeft />
            Demander un nouveau code
          </Link>
        </div>
      </div>
    </main>
  )
}
