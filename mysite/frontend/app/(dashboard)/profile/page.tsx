"use client"

import { useEffect, useRef, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { startRegistration } from "@simplewebauthn/browser"
import {
  AlertTriangle,
  BadgeCheck,
  Camera,
  Globe,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  Trash2,
  Users,
  X,
  Fingerprint,
  type LucideIcon,
} from "lucide-react"

type UserProfile = {
  authenticated: boolean
  id: number
  email: string
  first_name: string
  last_name: string
  phone_number: string
  profile_photo_url: string
  is_staff: boolean
  is_superuser: boolean
}

function SmallIcon({
  icon: Icon,
  color,
}: {
  icon: LucideIcon
  color: string
}) {
  return (
    <div
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
      style={{
        background: `color-mix(in srgb, ${color} 14%, transparent)`,
        color,
      }}
    >
      <Icon className="h-4 w-4" />
    </div>
  )
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordMessage, setPasswordMessage] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passkeyLoading, setPasskeyLoading] = useState(false)
  const [passkeyMessage, setPasskeyMessage] = useState("")
  const [passkeySuccess, setPasskeySuccess] = useState(false)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [photoMessage, setPhotoMessage] = useState("")
  const photoInputRef = useRef<HTMLInputElement>(null)
  

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        setError("")

        const response = await fetch("http://127.0.0.1:8000/api/me/", {
          method: "GET",
          credentials: "include",
        })

        const data = await response.json()

        if (!response.ok || !data.authenticated) {
          setError("Impossible de récupérer les informations du profil.")
          return
        }

        setUser(data)
      } catch {
        setError("Erreur de connexion au serveur.")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleChangePassword = async () => {
    setPasswordMessage("")

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordMessage("Veuillez remplir tous les champs.")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage("Les deux nouveaux mots de passe ne correspondent pas.")
      return
    }

    if (newPassword.length < 8) {
      setPasswordMessage("Le nouveau mot de passe doit contenir au moins 8 caractères.")
      return
    }

    try {
      setPasswordLoading(true)

      const response = await fetch("http://127.0.0.1:8000/api/change-password/", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setPasswordMessage(data.message || "Erreur lors de la modification.")
        return
      }

      setPasswordMessage(data.message || "Mot de passe modifié avec succès.")
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")

      setTimeout(() => {
        window.location.href = "/signin"
      }, 1500)
    } catch {
      setPasswordMessage("Erreur de connexion au serveur.")
    } finally {
      setPasswordLoading(false)
    }
  }

const handleRegisterPasskey = async () => {
  if (passkeyLoading) return

  try {
    setPasskeyLoading(true)
    setPasskeyMessage("")
    setPasskeySuccess(false)

    const optionsResponse = await fetch(
      "http://localhost:8000/api/passkeys/register/options/",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    const optionsData = await optionsResponse.json()

    if (!optionsResponse.ok) {
      throw new Error(
        optionsData.message ||
          "Impossible de préparer l’enregistrement de la passkey.",
      )
    }

    const credential = await startRegistration({
      optionsJSON: optionsData,
    })

    const verifyResponse = await fetch(
      "http://localhost:8000/api/passkeys/register/verify/",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential,
          device_name: "Mon appareil",
        }),
      },
    )

    const verifyData = await verifyResponse.json()

    if (!verifyResponse.ok) {
      throw new Error(
        verifyData.message ||
          "La vérification de la passkey a échoué.",
      )
    }

    setPasskeySuccess(true)
    setPasskeyMessage(
      verifyData.message ||
        "La connexion avec cet appareil est activée.",
    )
  } catch (error) {
    console.error("Erreur passkey :", error)

    setPasskeySuccess(false)

    if (error instanceof Error && error.name === "NotAllowedError") {
      setPasskeyMessage(
        "L’opération a été annulée ou aucun moyen d’authentification n’est disponible.",
      )
    } else {
      setPasskeyMessage(
        error instanceof Error
          ? error.message
          : "Impossible d’activer la connexion avec cet appareil.",
      )
    }
  } finally {
    setPasskeyLoading(false)
  }
}

  const handlePhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const photo = event.target.files?.[0]
    event.target.value = ""

    if (!photo) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(photo.type)) {
      setPhotoMessage("Choisissez une image JPG, PNG ou WebP.")
      return
    }

    if (photo.size > 5 * 1024 * 1024) {
      setPhotoMessage("La photo ne doit pas dépasser 5 Mo.")
      return
    }

    const formData = new FormData()
    formData.append("photo", photo)

    try {
      setPhotoLoading(true)
      setPhotoMessage("")

      const response = await fetch(
        "http://127.0.0.1:8000/api/profile/photo/",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        },
      )
      const data = await response.json()

      if (!response.ok || !data.success) {
        setPhotoMessage(data.message || "Impossible d’enregistrer la photo.")
        return
      }

      setUser((current) =>
        current
          ? { ...current, profile_photo_url: data.profile_photo_url }
          : current,
      )
      setPhotoMessage("Photo mise à jour.")
    } catch {
      setPhotoMessage("Erreur de connexion au serveur.")
    } finally {
      setPhotoLoading(false)
    }
  }

  const handlePhotoDelete = async () => {
    if (!user?.profile_photo_url || photoLoading) return

    if (!window.confirm("Supprimer votre photo de profil ?")) return

    try {
      setPhotoLoading(true)
      setPhotoMessage("")

      const response = await fetch(
        "http://127.0.0.1:8000/api/profile/photo/",
        {
          method: "DELETE",
          credentials: "include",
        },
      )
      const data = await response.json()

      if (!response.ok || !data.success) {
        setPhotoMessage(data.message || "Impossible de supprimer la photo.")
        return
      }

      setUser((current) =>
        current ? { ...current, profile_photo_url: "" } : current,
      )
      setPhotoMessage("Photo supprimée.")
    } catch {
      setPhotoMessage("Erreur de connexion au serveur.")
    } finally {
      setPhotoLoading(false)
    }
  }

  const fullName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    "Administrateur"

  const initials =
    `${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`.toUpperCase() ||
    "AD"

  if (loading) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center">
        <p className="font-bold text-[var(--dashboard-muted)]">
          Chargement du profil...
        </p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center px-4">
        <div
          className="rounded-[24px] border p-6 text-center"
          style={{
            background: "var(--dashboard-card)",
            borderColor: "rgba(239,68,68,0.28)",
          }}
        >
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-400" />
          <p className="font-bold text-red-400">{error}</p>
        </div>
      </section>
    )
  }

  return (
    <section className="px-4 py-6 text-[var(--dashboard-text)] md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
              Espace personnel
            </p>
            <h1 className="mt-2 text-2xl font-black text-[var(--dashboard-text)]">
              Profil
            </h1>
            <p className="mt-2 text-sm font-semibold text-[var(--dashboard-muted)]">
              Informations du compte et préférences de l'administrateur.
            </p>
          </div>

          <div
            className="inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-xs font-black"
            style={{
              background:
                "color-mix(in srgb, var(--brand-primary) 10%, transparent)",
              borderColor:
                "color-mix(in srgb, var(--brand-primary) 25%, var(--dashboard-border))",
              color: "var(--brand-primary)",
            }}
          >
            <BadgeCheck className="h-4 w-4" />
            Compte actif
          </div>
        </div>

        <div>
          <div
            className="rounded-[26px] border p-5 shadow-[var(--dashboard-shadow)]"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--dashboard-card) 92%, transparent), color-mix(in srgb, var(--brand-primary) 8%, var(--dashboard-card)))",
              borderColor: "var(--dashboard-border)",
            }}
          >
            <div className="grid gap-6 md:grid-cols-[140px_1fr] md:items-center">
              <div className="relative w-fit">
                <Avatar className="h-32 w-32 shrink-0 border-4 border-[var(--dashboard-card)] shadow-xl">
                  {user?.profile_photo_url && (
                    <AvatarImage
                      src={user.profile_photo_url}
                      alt={`Photo de profil de ${fullName}`}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback
                    className="text-4xl font-black text-white"
                    style={{ background: "var(--brand-gradient)" }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={handlePhotoChange}
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoLoading}
                  className="absolute bottom-1 right-1 grid h-10 w-10 place-items-center rounded-full border-4 border-[var(--dashboard-card)] text-white shadow-lg transition hover:scale-105 disabled:cursor-wait disabled:opacity-70"
                  style={{ background: "var(--brand-gradient)" }}
                  aria-label="Choisir une photo de profil"
                  title="Changer la photo"
                >
                  {photoLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                {user?.profile_photo_url && (
                  <button
                    type="button"
                    onClick={() => void handlePhotoDelete()}
                    disabled={photoLoading}
                    className="absolute bottom-1 left-1 grid h-10 w-10 place-items-center rounded-full border-4 border-[var(--dashboard-card)] bg-red-500 text-white shadow-lg transition hover:scale-105 hover:bg-red-600 disabled:cursor-wait disabled:opacity-70"
                    aria-label="Supprimer la photo de profil"
                    title="Supprimer la photo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                {photoMessage && (
                  <p
                    className="mt-2 max-w-32 text-center text-[10px] font-bold leading-4"
                    style={{
                      color: photoMessage.includes("mise à jour") ||
                        photoMessage.includes("supprimée")
                        ? "#10b981"
                        : "#ef4444",
                    }}
                  >
                    {photoMessage}
                  </p>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black text-[var(--dashboard-text)]">
                        {fullName}
                      </h2>
                      <span
                        className="rounded-full px-3 py-1 text-[10px] font-black"
                        style={{
                          background:
                            "color-mix(in srgb, #10b981 14%, var(--dashboard-card-soft))",
                          color: "#10b981",
                        }}
                      >
                        Active
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-[var(--dashboard-muted)]">
                      Administrateur SEO
                    </p>
                  </div>

                  <span className="rounded-full bg-[var(--dashboard-card-soft)] px-3 py-1 text-[11px] font-black text-[var(--dashboard-muted)]">
                    Smart SEO
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <ProfileInfo label="Rôle" value="Admin" />
                  <ProfileInfo
                    label="Accès"
                    value={user?.is_superuser ? "Superuser" : "Staff"}
                  />
                  <ProfileInfo label="Statut" value="Vérifié" />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <ContactCard
                    icon={Mail}
                    color="var(--brand-primary)"
                    label="Email"
                    value={user?.email || "-"}
                  />
                  <ContactCard
                    icon={Phone}
                    color="var(--brand-secondary)"
                    label="Téléphone"
                    value={user?.phone_number || "-"}
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {["SEO", "Dashboard", "Analytics", "IA"].map((item) => (
                    <span
                      key={item}
                      className="rounded-full px-3 py-1 text-[11px] font-black"
                      style={{
                        background:
                          "color-mix(in srgb, var(--brand-primary) 12%, transparent)",
                        color: "var(--brand-primary)",
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_0.8fr]">
          <div
            className="rounded-[30px] border p-6"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--dashboard-card) 94%, transparent), color-mix(in srgb, var(--dashboard-card-soft) 76%, transparent))",
              borderColor: "var(--dashboard-border)",
              boxShadow:
                "0 18px 45px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            <div className="mb-5">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
                Compte
              </p>
              <h2 className="mt-1 text-[22px] font-black text-[var(--dashboard-text)]">
                Sécurité du compte
              </h2>
            </div>

            <div className="relative space-y-4">
              <div className="pointer-events-none absolute left-[18px] top-6 h-[calc(100%-48px)] w-[2px] bg-[var(--dashboard-border)]" />

              <button
  type="button"
  onClick={() => setShowPasswordModal(true)}
  className="relative flex w-full items-center gap-4 rounded-[22px] p-4 text-left transition hover:-translate-y-0.5"
  style={{
    background:
      "color-mix(in srgb, var(--brand-primary) 9%, var(--dashboard-card-soft))",
  }}
>
  <div
    className="z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full text-white"
    style={{ background: "var(--brand-primary)" }}
  >
    <KeyRound className="h-5 w-5" />
  </div>

  <div className="min-w-0 flex-1">
    <p className="text-[14px] font-black text-[var(--dashboard-text)]">
      Changer le mot de passe
    </p>

    <p className="mt-1 text-[12px] font-semibold text-[var(--dashboard-muted)]">
      Modifier les identifiants de connexion.
    </p>
  </div>

  <span
    className="rounded-full px-3 py-1 text-[11px] font-black"
    style={{
      background:
        "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
      color: "var(--brand-primary)",
    }}
  >
    Sécurité
  </span>
</button>

<button
  type="button"
  onClick={() => void handleRegisterPasskey()}
  disabled={passkeyLoading || passkeySuccess}
  className="relative flex w-full items-center gap-4 rounded-[22px] p-4 text-left transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
  style={{
    background:
      "color-mix(in srgb, var(--brand-secondary) 9%, var(--dashboard-card-soft))",
  }}
>
  <div
    className="z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full text-white"
    style={{ background: "var(--brand-secondary)" }}
  >
    <Fingerprint className="h-5 w-5" />
  </div>

  <div className="min-w-0 flex-1">
    <p className="text-[14px] font-black text-[var(--dashboard-text)]">
      Connexion avec cet appareil
    </p>

    <p className="mt-1 text-[12px] font-semibold text-[var(--dashboard-muted)]">
      Utiliser Windows Hello, une empreinte, le visage ou un code PIN.
    </p>
  </div>

  <span
    className="rounded-full px-3 py-1 text-[11px] font-black"
    style={{
      background:
        "color-mix(in srgb, var(--brand-secondary) 14%, transparent)",
      color: "var(--brand-secondary)",
    }}
  >
    {passkeyLoading
      ? "Activation..."
      : passkeySuccess
        ? "Activée"
        : "Activer"}
  </span>
</button>

{passkeyMessage && (
  <div
    className="rounded-xl px-4 py-3 text-sm font-bold"
    style={{
      background: passkeySuccess
        ? "rgba(16, 185, 129, 0.10)"
        : "rgba(239, 68, 68, 0.10)",
      color: passkeySuccess ? "#10b981" : "#ef4444",
    }}
  >
    {passkeyMessage}
  </div>
)}
              {user?.is_superuser === true && (
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = "/profile/accounts"
                  }}
                  className="relative flex w-full cursor-pointer items-center gap-4 rounded-[22px] p-4 text-left transition hover:-translate-y-0.5 hover:opacity-90"
                  style={{
                    background:
                      "color-mix(in srgb, var(--brand-secondary) 9%, var(--dashboard-card-soft))",
                  }}
                >
                  <div
                    className="z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full text-white"
                    style={{ background: "var(--brand-tertiary)" }}
                  >
                    <Users className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-black text-[var(--dashboard-text)]">
                      Gestion des comptes
                    </p>
                    <p className="mt-1 text-[12px] font-semibold text-[var(--dashboard-muted)]">
                      Ajouter, modifier ou supprimer les administrateurs.
                    </p>
                  </div>

                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-black"
                    style={{
                      background:
                        "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
                      color: "var(--brand-primary)",
                    }}
                  >
                    Gérer
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  window.location.href = "/devices"
                }}
                className="relative flex w-full cursor-pointer items-center gap-4 rounded-[22px] p-4 text-left transition hover:-translate-y-0.5 hover:opacity-90"
                style={{
                  background:
                    "color-mix(in srgb, var(--brand-secondary) 9%, var(--dashboard-card-soft))",
                }}
              >
                <div
                  className="z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full text-white"
                  style={{ background: "var(--brand-secondary)" }}
                >
                  <Globe className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-black text-[var(--dashboard-text)]">
                    Gestion des sites
                  </p>
                  <p className="mt-1 text-[12px] font-semibold text-[var(--dashboard-muted)]">
                    Consulter, ajouter ou gérer les sites web suivis.
                  </p>
                </div>

                <span
                  className="rounded-full px-3 py-1 text-[11px] font-black"
                  style={{
                    background:
                      "color-mix(in srgb, var(--brand-secondary) 14%, transparent)",
                    color: "var(--brand-secondary)",
                  }}
                >
                  Ouvrir
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.location.href = "/login"
                }}
                className="relative flex w-full items-center gap-4 rounded-[22px] p-4 text-left transition hover:-translate-y-0.5"
                style={{
                  background: "rgba(239,68,68,0.08)",
                }}
              >
                <div
                  className="z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full text-white"
                  style={{ background: "#ef4444" }}
                >
                  <LogOut className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-black text-red-400">
                    Déconnexion sécurisée
                  </p>
                  <p className="mt-1 text-[12px] font-semibold text-[var(--dashboard-muted)]">
                    Terminer la session en cours.
                  </p>
                </div>

                <span className="rounded-full bg-red-500/10 px-3 py-1 text-[11px] font-black text-red-400">
                  Quitter
                </span>
              </button>
            </div>
          </div>

          <div
            className="relative overflow-hidden rounded-[30px] p-6 text-white"
            style={{
              background: "var(--brand-gradient)",
              boxShadow:
                "0 18px 44px color-mix(in srgb, var(--brand-primary) 24%, transparent)",
            }}
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-black/10 blur-3xl" />

            <div className="relative z-10 flex h-full flex-col justify-between gap-7">
              <div>
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </div>

                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/70">
                  Espace sécurisé
                </p>

                <h2 className="mt-3 text-[26px] font-black leading-tight">
                  Espace administrateur
                </h2>

                <p className="mt-3 text-[13px] font-semibold leading-6 text-white/80">
                  Gérez votre compte, vos préférences et l'accès à la plateforme
                  Smart SEO.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  "Accès sécurisé au dashboard",
                  "Notifications et rapports SEO",
                  "Suivi des performances web",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl bg-white/12 px-4 py-3 ring-1 ring-white/15"
                  >
                    <span className="h-2 w-2 rounded-full bg-white" />
                    <p className="text-[13px] font-black text-white/90">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060713]/75 px-4 py-8 backdrop-blur-md">
          <div
            className="max-h-[calc(100vh-4rem)] w-full max-w-lg overflow-y-auto rounded-[30px] border p-7"
            style={{
              background:
                "linear-gradient(145deg, var(--dashboard-card), color-mix(in srgb, var(--brand-primary) 5%, var(--dashboard-card)))",
              borderColor:
                "color-mix(in srgb, var(--brand-primary) 40%, var(--dashboard-border))",
              boxShadow:
                "0 35px 100px rgba(0,0,0,0.52), 0 0 55px color-mix(in srgb, var(--brand-primary) 16%, transparent)",
            }}
          >
            <div
              className="-mx-7 -mt-7 mb-7 flex items-center justify-between gap-4 rounded-t-[29px] px-6 py-4"
              style={{ background: "var(--brand-gradient)" }}
            >
              <div>
                <div className="flex items-center gap-3">
                  <p className="hidden">
                    Sécurité du compte
                  </p>
                  <KeyRound className="h-5 w-5 shrink-0 text-white" />
                  <h2 className="text-lg font-black text-white">
                    Modifier le mot de passe
                  </h2>
                  <p className="hidden">
                    Créez un accès robuste et unique pour protéger votre compte.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false)
                  setPasswordMessage("")
                }}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/25 bg-white/15 text-white transition hover:bg-white/25"
                style={{
                  color: "white",
                }}
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-black text-[var(--dashboard-text)]">
                  Mot de passe actuel
                </span>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dashboard-muted)]" />
                  <input
                    type="password"
                    placeholder="Mot de passe actuel"
                    value={oldPassword}
                    onChange={(event) => setOldPassword(event.target.value)}
                    autoComplete="current-password"
                    className="h-13 w-full rounded-2xl border bg-[var(--dashboard-card-soft)] pl-11 pr-4 text-sm font-semibold text-[var(--dashboard-text)] outline-none transition focus:-translate-y-0.5 focus:shadow-lg"
                    style={{ borderColor: "var(--dashboard-border)" }}
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black text-[var(--dashboard-text)]">
                  Nouveau mot de passe
                </span>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dashboard-muted)]" />
                  <input
                    type="password"
                    placeholder="Nouveau mot de passe"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                    className="h-13 w-full rounded-2xl border bg-[var(--dashboard-card-soft)] pl-11 pr-4 text-sm font-semibold text-[var(--dashboard-text)] outline-none transition focus:-translate-y-0.5 focus:shadow-lg"
                    style={{ borderColor: "var(--dashboard-border)" }}
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black text-[var(--dashboard-text)]">
                  Confirmer le nouveau mot de passe
                </span>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dashboard-muted)]" />
                  <input
                    type="password"
                    placeholder="Confirmation du mot de passe"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    className="h-13 w-full rounded-2xl border bg-[var(--dashboard-card-soft)] pl-11 pr-4 text-sm font-semibold text-[var(--dashboard-text)] outline-none transition focus:-translate-y-0.5 focus:shadow-lg"
                    style={{
                      borderColor:
                        confirmPassword && confirmPassword === newPassword
                          ? "rgba(16,185,129,.55)"
                          : "var(--dashboard-border)",
                    }}
                  />
                </div>
              </label>
            </div>

            {passwordMessage && (
              <p
                className="mt-4 rounded-2xl px-4 py-3 text-xs font-bold"
                style={{
                  color: passwordMessage.toLowerCase().includes("succès")
                    ? "#10b981"
                    : "#ef4444",
                  background: passwordMessage.toLowerCase().includes("succès")
                    ? "rgba(16,185,129,.10)"
                    : "rgba(239,68,68,.10)",
                }}
              >
                {passwordMessage}
              </p>
            )}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false)
                  setPasswordMessage("")
                }}
                className="h-12 rounded-2xl border px-7 text-sm font-black transition hover:bg-[var(--dashboard-card-soft)]"
                style={{
                  borderColor: "var(--dashboard-border)",
                  color: "var(--dashboard-text)",
                }}
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleChangePassword}
                disabled={passwordLoading}
                className="h-12 rounded-2xl px-8 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: "var(--brand-gradient)" }}
              >
                {passwordLoading ? "Modification..." : "Mettre à jour"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function ProfileInfo({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-2xl px-4 py-3"
      style={{ background: "var(--dashboard-card-soft)" }}
    >
      <p className="text-[11px] font-bold text-[var(--dashboard-muted)]">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black text-[var(--dashboard-text)]">
        {value}
      </p>
    </div>
  )
}

function ContactCard({
  icon,
  color,
  label,
  value,
}: {
  icon: LucideIcon
  color: string
  label: string
  value: string
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3"
      style={{ background: "var(--dashboard-card-soft)" }}
    >
      <SmallIcon icon={icon} color={color} />
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-[var(--dashboard-muted)]">
          {label}
        </p>
        <p className="truncate text-[13px] font-black text-[var(--dashboard-text)]">
          {value}
        </p>
      </div>
    </div>
  )
}
