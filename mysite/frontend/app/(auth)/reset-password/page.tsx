"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, ArrowLeft, Eye, EyeOff, KeyRound, LockKeyhole } from "lucide-react"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const email = searchParams.get("email") || ""
  const code = searchParams.get("code") || ""

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
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

      const response = await fetch("http://127.0.0.1:8000/api/reset-password/", {
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
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setMessage(data.message || "Impossible de réinitialiser le mot de passe.")
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
    <main className="neon-login-page">
      <div className="neon-grid" />
      <div className="neon-orb neon-orb--one" />
      <div className="neon-orb neon-orb--two" />

      <div className="neon-auth-shell">
        <div className="neon-form-glow" />
        <div className="neon-form-card neon-auth-card">
          <div className="neon-auth-icon">
            <LockKeyhole />
          </div>

          <div className="neon-form-card__heading">
            <span className="neon-form-card__eyebrow">NOUVEAU MOT DE PASSE</span>
            <h2>Réinitialisation</h2>
            <p>Choisissez un mot de passe sécurisé pour votre compte.</p>
          </div>

          <form onSubmit={handleSubmit} className="neon-form">
            <label htmlFor="new-password">Nouveau mot de passe</label>
            <div className="neon-input">
              <KeyRound />
              <input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Au moins 8 caractères"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((value) => !value)}
                aria-label={showNewPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showNewPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>

            <label htmlFor="confirm-password">Confirmation</label>
            <div className="neon-input">
              <KeyRound />
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Répéter le mot de passe"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                aria-label={showConfirmPassword ? "Masquer la confirmation" : "Afficher la confirmation"}
              >
                {showConfirmPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>

            {message && (
              <div
                className={`neon-form__error neon-form__error--with-icon ${
                  message.includes("succès") ? "neon-form__success" : ""
                }`}
                role="alert"
              >
                <AlertCircle />
                <span>{message}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="neon-submit">
              <span>{loading ? "Modification..." : "Modifier le mot de passe"}</span>
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
