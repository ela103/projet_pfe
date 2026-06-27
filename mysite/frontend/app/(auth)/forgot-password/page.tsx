"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowLeft, Mail, ShieldQuestion } from "lucide-react"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage("")

    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail) {
      setMessage("L’adresse email est obligatoire.")
      return
    }

    try {
      setLoading(true)

      const response = await fetch("http://127.0.0.1:8000/api/forgot-password/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: cleanEmail }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setMessage(data.message || "Une erreur est survenue pendant l’envoi du code.")
        return
      }

      router.push(`/verify-otp?email=${encodeURIComponent(cleanEmail)}`)
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
            <ShieldQuestion />
          </div>

          <div className="neon-form-card__heading">
            <span className="neon-form-card__eyebrow">RÉCUPÉRATION</span>
            <h2>Mot de passe oublié</h2>
            <p>Entrez votre email pour recevoir un code de vérification.</p>
          </div>

          <form onSubmit={handleSubmit} className="neon-form">
            <label htmlFor="forgot-email">Adresse email</label>
            <div className="neon-input">
              <Mail />
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nom@entreprise.com"
                autoComplete="email"
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
              <span>{loading ? "Envoi..." : "Envoyer le code"}</span>
            </button>
          </form>

          <Link href="/signin" className="neon-auth-back">
            <ArrowLeft />
            Retour à la connexion
          </Link>
        </div>
      </div>
    </main>
  )
}
