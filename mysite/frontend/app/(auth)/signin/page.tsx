"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  BarChart3,
  Bolt,
  Chrome,
  Eye,
  EyeOff,
  Github,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react"

function TrafficVisual() {
  return (
    <div className="neon-traffic-visual" aria-hidden="true">
      <div className="neon-traffic-visual__halo" />
      <div className="neon-traffic-visual__frame">
        <Image
          src="/images/seo-traffic-neon.png"
          alt=""
          fill
          sizes="(max-width: 880px) 520px, 560px"
          className="neon-traffic-visual__image"
          priority
        />
        <div className="neon-traffic-visual__scan" />
      </div>
      <span className="neon-traffic-visual__signal neon-traffic-visual__signal--one" />
      <span className="neon-traffic-visual__signal neon-traffic-visual__signal--two" />
      <span className="neon-traffic-visual__signal neon-traffic-visual__signal--three" />
    </div>
  )
}

function Feature({ icon: Icon, title, text }: { icon: typeof ShieldCheck; title: string; text: string }) {
  return (
    <div className="neon-feature">
      <span className="neon-feature__icon"><Icon /></span>
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  )
}

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage("")
    setLoading(true)

    try {
      const response = await fetch("http://127.0.0.1:8000/api/login/", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()

      if (response.ok && data.success) {
        localStorage.setItem("access_token", data.access)
        localStorage.setItem("refresh_token", data.refresh)
        router.push("/dashboard")
        router.refresh()
      } else {
        setMessage(data.message || "Email ou mot de passe incorrect")
      }
    } catch {
      setMessage("Impossible de contacter le serveur.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="neon-login-page">
      <div className="neon-grid" />
      <div className="neon-orb neon-orb--one" />
      <div className="neon-orb neon-orb--two" />
      <div className="neon-particles" aria-hidden="true">
        {Array.from({ length: 24 }).map((_, index) => (
          <i key={index} style={{ "--particle": index } as React.CSSProperties} />
        ))}
      </div>

      <section className="neon-login-shell">
        <div className="neon-intro">
          <div className="neon-brand">
            <span className="neon-brand__mark"><BarChart3 /></span>
            <span>Smart<span>SEO</span></span>
          </div>

          <div className="neon-intro__copy">
            <span className="neon-kicker"><Sparkles /> Votre copilote SEO intelligent</span>
            <h1>Heureux de vous <span>revoir !</span></h1>
            <p>
              Reprenez le contrôle de vos performances digitales grâce à des
              analyses claires et des recommandations propulsées par l’IA.
            </p>
          </div>

          <TrafficVisual />

          <div className="neon-features">
            <Feature icon={ShieldCheck} title="Sécurisé" text="Vos données sont protégées" />
            <Feature icon={Bolt} title="Rapide" text="Des analyses instantanées" />
            <Feature icon={UserRound} title="Intuitif" text="Une expérience simple" />
          </div>
        </div>

        <div className="neon-form-wrap">
          <div className="neon-form-glow" />
          <div className="neon-form-card">
            <div className="neon-form-card__heading">
              <span className="neon-form-card__eyebrow">ESPACE PERSONNEL</span>
              <h2>Connexion</h2>
              <p>Entrez vos identifiants pour accéder à votre compte</p>
            </div>

            <form onSubmit={handleSubmit} className="neon-form">
              <label htmlFor="signin-email">Adresse email</label>
              <div className="neon-input">
                <Mail />
                <input
                  id="signin-email"
                  type="email"
                  placeholder="nom@entreprise.com"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <label htmlFor="signin-password">Mot de passe</label>
              <div className="neon-input">
                <LockKeyhole />
                <input
                  id="signin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Votre mot de passe"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              <div className="neon-form__options">
                <label className="neon-checkbox">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  <span /> Se souvenir de moi
                </label>
                <Link href="/forgot-password">Mot de passe oublié ?</Link>
              </div>

              {message && <p className="neon-form__error" role="alert">{message}</p>}

              <button type="submit" className="neon-submit" disabled={loading}>
                <span>{loading ? "Connexion en cours..." : "Se connecter"}</span>
              </button>
            </form>

            <div className="neon-divider"><span>ou continuer avec</span></div>

            <div className="neon-socials">
              <button type="button" onClick={() => { window.location.href = "http://127.0.0.1:8000/api/oauth/google/start/" }} aria-label="Se connecter avec Google">
                <Chrome /> Google
              </button>
              <button type="button" onClick={() => { window.location.href = "http://127.0.0.1:8000/api/oauth/github/start/" }} aria-label="Se connecter avec GitHub">
                <Github /> GitHub
              </button>
            </div>

            <p className="neon-signup">
              Vous n’avez pas encore de compte ? <Link href="/signup">Créer un compte</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
