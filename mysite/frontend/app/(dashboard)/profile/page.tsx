"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Lock,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  User,
  X,
  Calendar,
  BadgeCheck,
  Settings,
  KeyRound,
  Users,
  Globe,
} from "lucide-react"

type UserProfile = {
  authenticated: boolean
  id: number
  email: string
  first_name: string
  last_name: string
  phone_number: string
}

type AdminAccount = {
  id: number
  email: string
  first_name: string
  last_name: string
  phone_number: string
  is_active: boolean
  is_staff: boolean
  date_joined: string
}
function SmallIcon({
  icon: Icon,
  color,
}: {
  icon: any
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

function PreferenceRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-[22px] px-4 py-4"
      style={{
        background: checked
          ? "color-mix(in srgb, var(--brand-primary) 10%, var(--dashboard-card-soft))"
          : "color-mix(in srgb, var(--dashboard-card-soft) 78%, transparent)",
      }}
    >
      <div>
        <p className="text-[14px] font-black text-[var(--dashboard-text)]">
          {title}
        </p>
        <p className="mt-1 text-[12px] font-semibold text-[var(--dashboard-muted)]">
          {description}
        </p>
      </div>

      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

export default function ProfilePage() {
  const [seoNotifications, setSeoNotifications] = useState(true)
  const [weeklyReports, setWeeklyReports] = useState(false)

  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [admins, setAdmins] = useState<AdminAccount[]>([])
  const [adminsLoading, setAdminsLoading] = useState(true)
  const [adminsError, setAdminsError] = useState("")

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordMessage, setPasswordMessage] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)

  const [showAdminModal, setShowAdminModal] = useState(false)
  const [adminFirstName, setAdminFirstName] = useState("")
  const [adminLastName, setAdminLastName] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPhone, setAdminPhone] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [adminMessage, setAdminMessage] = useState("")
  const [adminLoading, setAdminLoading] = useState(false)

const fetchAdmins = async () => {
  try {
    setAdminsLoading(true)
    setAdminsError("")

    const response = await fetch("http://127.0.0.1:8000/api/admins/", {
      method: "GET",
      credentials: "include",
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      setAdminsError(data.message || "Impossible de charger les comptes.")
      return
    }

    setAdmins(data.admins || [])
  } catch {
    setAdminsError("Erreur de connexion au serveur.")
  } finally {
    setAdminsLoading(false)
  }
}
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
    fetchAdmins()
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
        window.location.href = "/login"
      }, 1500)
    } catch {
      setPasswordMessage("Erreur de connexion au serveur.")
    } finally {
      setPasswordLoading(false)
    }
  }
  const handleCreateAdmin = async () => {
  setAdminMessage("")

  if (!adminFirstName || !adminLastName || !adminEmail || !adminPassword) {
    setAdminMessage("Veuillez remplir les champs obligatoires.")
    return
  }

  if (adminPassword.length < 8) {
    setAdminMessage("Le mot de passe doit contenir au moins 8 caractères.")
    return
  }

  try {
    setAdminLoading(true)

    const response = await fetch("http://127.0.0.1:8000/api/admins/create/", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        first_name: adminFirstName,
        last_name: adminLastName,
        email: adminEmail,
        phone_number: adminPhone,
        password: adminPassword,
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      setAdminMessage(data.message || "Erreur lors de l’ajout du compte.")
      return
    }

    setAdminMessage(data.message || "Compte administrateur ajouté avec succès.")

    setAdminFirstName("")
    setAdminLastName("")
    setAdminEmail("")
    setAdminPhone("")
    setAdminPassword("")

    fetchAdmins()

    setTimeout(() => {
      setShowAdminModal(false)
      setAdminMessage("")
    }, 1200)
  } catch {
    setAdminMessage("Erreur de connexion au serveur.")
  } finally {
    setAdminLoading(false)
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
          className="rounded-[26px] border p-6 text-center"
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
        {/* HEADER SIMPLE COMME LA PHOTO */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-[30px] font-black text-[var(--dashboard-text)]">
              Profil
            </h1>
            <p className="mt-1 text-[13px] font-semibold text-[var(--dashboard-muted)]">
              Informations du compte et préférences de l’administrateur.
            </p>
          </div>

          <div
            className="rounded-full border px-4 py-2 text-[12px] font-black"
            style={{
              background:
                "color-mix(in srgb, var(--brand-primary) 10%, transparent)",
              borderColor:
                "color-mix(in srgb, var(--brand-primary) 25%, var(--dashboard-border))",
              color: "var(--brand-primary)",
            }}
          >
            Compte actif
          </div>
        </div>

        {/* TOP GRID */}
        <div className="grid gap-6 lg:grid-cols-[1.6fr_0.8fr]">
          {/* CARTE PROFIL PRINCIPALE */}
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
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <Avatar className="h-36 w-36 shrink-0 border-4 border-[var(--dashboard-card)] shadow-xl">
                <AvatarFallback
                  className="text-4xl font-black text-white"
                  style={{ background: "var(--brand-gradient)" }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="truncate text-[24px] font-black text-[var(--dashboard-text)]">
                    {fullName}
                  </h2>

                  <button
                    type="button"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full border transition hover:bg-white/5"
                    style={{
                      borderColor: "var(--dashboard-border)",
                      color: "var(--brand-primary)",
                    }}
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2 text-[13px] font-semibold text-[var(--dashboard-muted)]">
                  <p>
                    <span className="font-black text-[var(--dashboard-text)]">
                      Rôle :
                    </span>{" "}
                    Administrateur SEO
                  </p>

                  <p>
                    <span className="font-black text-[var(--dashboard-text)]">
                      Plateforme :
                    </span>{" "}
                    Smart SEO Intelligence
                  </p>

                  <p>
                    <span className="font-black text-[var(--dashboard-text)]">
                      Statut :
                    </span>{" "}
                    Compte vérifié et sécurisé
                  </p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div
                    className="flex items-center gap-3 rounded-2xl px-4 py-3"
                    style={{
                      background:
                        "color-mix(in srgb, var(--dashboard-card-soft) 80%, transparent)",
                    }}
                  >
                    <SmallIcon icon={Mail} color="var(--brand-primary)" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-[var(--dashboard-muted)]">
                        Email
                      </p>
                      <p className="truncate text-[13px] font-black text-[var(--dashboard-text)]">
                        {user?.email || "—"}
                      </p>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-3 rounded-2xl px-4 py-3"
                    style={{
                      background:
                        "color-mix(in srgb, var(--dashboard-card-soft) 80%, transparent)",
                    }}
                  >
                    <SmallIcon icon={Phone} color="var(--brand-secondary)" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-[var(--dashboard-muted)]">
                        Téléphone
                      </p>
                      <p className="truncate text-[13px] font-black text-[var(--dashboard-text)]">
                        {user?.phone_number || "—"}
                      </p>
                    </div>
                  </div>
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

          {/* CARTE PREFERENCES A DROITE */}
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
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
                  Préférences
                </p>
                <h2 className="mt-1 text-[22px] font-black text-[var(--dashboard-text)]">
                  Notifications
                </h2>
              </div>

              <div
                className="grid h-11 w-11 place-items-center rounded-2xl text-white"
                style={{
                  background: "var(--brand-gradient)",
                  boxShadow:
                    "0 12px 26px color-mix(in srgb, var(--brand-primary) 24%, transparent)",
                }}
              >
                <Bell className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-3">
              <PreferenceRow
                title="Notifications SEO"
                description="Recevoir les alertes importantes"
                checked={seoNotifications}
                onChange={setSeoNotifications}
              />

              <PreferenceRow
                title="Rapports hebdomadaires"
                description="Recevoir un rappel chaque semaine"
                checked={weeklyReports}
                onChange={setWeeklyReports}
              />

              <div
                className="rounded-[22px] p-5"
                style={{
                  background: "var(--brand-gradient)",
                  color: "white",
                  boxShadow:
                    "0 18px 36px color-mix(in srgb, var(--brand-primary) 25%, transparent)",
                }}
              >
                <p className="text-[17px] font-black">
                  Smart SEO Intelligence
                </p>
                <p className="mt-2 text-[12px] font-semibold text-white/80">
                  Votre espace permet de suivre les données SEO, les
                  recommandations et les rapports générés.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM GRID COMME LA PHOTO */}
        <div className="grid gap-6 lg:grid-cols-[1.6fr_0.8fr]">
          {/* SECURITE / ACTIVITES */}
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
          {/* MODAL AJOUT ADMIN */}
{showAdminModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
    <div
      className="w-full max-w-md rounded-[28px] border p-6"
      style={{
        background: "var(--dashboard-card)",
        borderColor: "var(--dashboard-border)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
      }}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[var(--dashboard-text)]">
            Ajouter un administrateur
          </h2>

          <p className="mt-1 text-sm font-semibold text-[var(--dashboard-muted)]">
            Créer un nouveau compte administrateur.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowAdminModal(false)
            setAdminMessage("")
          }}
          className="grid h-9 w-9 place-items-center rounded-xl border transition hover:bg-white/5"
          style={{
            borderColor: "var(--dashboard-border)",
            color: "var(--dashboard-text)",
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Prénom"
          value={adminFirstName}
          onChange={(e) => setAdminFirstName(e.target.value)}
          className="h-12 w-full rounded-2xl border px-4 text-sm font-semibold outline-none"
          style={{
            background: "var(--dashboard-card-soft)",
            borderColor: "var(--dashboard-border)",
            color: "var(--dashboard-text)",
          }}
        />

        <input
          type="text"
          placeholder="Nom"
          value={adminLastName}
          onChange={(e) => setAdminLastName(e.target.value)}
          className="h-12 w-full rounded-2xl border px-4 text-sm font-semibold outline-none"
          style={{
            background: "var(--dashboard-card-soft)",
            borderColor: "var(--dashboard-border)",
            color: "var(--dashboard-text)",
          }}
        />

        <input
          type="email"
          placeholder="Adresse email"
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
          className="h-12 w-full rounded-2xl border px-4 text-sm font-semibold outline-none"
          style={{
            background: "var(--dashboard-card-soft)",
            borderColor: "var(--dashboard-border)",
            color: "var(--dashboard-text)",
          }}
        />

        <input
          type="text"
          placeholder="Téléphone"
          value={adminPhone}
          onChange={(e) => setAdminPhone(e.target.value)}
          className="h-12 w-full rounded-2xl border px-4 text-sm font-semibold outline-none"
          style={{
            background: "var(--dashboard-card-soft)",
            borderColor: "var(--dashboard-border)",
            color: "var(--dashboard-text)",
          }}
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          className="h-12 w-full rounded-2xl border px-4 text-sm font-semibold outline-none"
          style={{
            background: "var(--dashboard-card-soft)",
            borderColor: "var(--dashboard-border)",
            color: "var(--dashboard-text)",
          }}
        />
      </div>

      {adminMessage && (
        <p
          className="mt-4 text-sm font-bold"
          style={{
            color: adminMessage.toLowerCase().includes("succès")
              ? "#34d399"
              : "#f87171",
          }}
        >
          {adminMessage}
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            setShowAdminModal(false)
            setAdminMessage("")
          }}
          className="h-12 rounded-2xl border text-sm font-black transition hover:bg-white/5"
          style={{
            borderColor: "var(--dashboard-border)",
            color: "var(--dashboard-text)",
          }}
        >
          Annuler
        </button>

        <button
          type="button"
          onClick={handleCreateAdmin}
          disabled={adminLoading}
          className="h-12 rounded-2xl text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ background: "var(--brand-gradient)" }}
        >
          {adminLoading ? "Ajout..." : "Ajouter"}
        </button>
      </div>
    </div>
  </div>
)}

         {/* CARTE A DROITE STYLE PHOTO */}
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
        <Calendar className="h-6 w-6 text-white" />
      </div>

      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/70">
        Espace sécurisé
      </p>

      <h2 className="mt-3 text-[26px] font-black leading-tight">
        Espace administrateur
      </h2>

      <p className="mt-3 text-[13px] font-semibold leading-6 text-white/80">
        Gérez votre compte, vos préférences et l’accès à la plateforme Smart SEO.
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
          <p className="text-[13px] font-black text-white/90">{item}</p>
        </div>
      ))}
    </div>
  </div>
</div>
        </div>
      </div>

      {/* MODAL PASSWORD */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-[28px] border p-6"
            style={{
              background: "var(--dashboard-card)",
              borderColor: "var(--dashboard-border)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
            }}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[var(--dashboard-text)]">
                  Modifier le mot de passe
                </h2>

                <p className="mt-1 text-sm font-semibold text-[var(--dashboard-muted)]">
                  Saisissez l’ancien mot de passe puis le nouveau.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false)
                  setPasswordMessage("")
                }}
                className="grid h-9 w-9 place-items-center rounded-xl border transition hover:bg-white/5"
                style={{
                  borderColor: "var(--dashboard-border)",
                  color: "var(--dashboard-text)",
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="password"
                placeholder="Ancien mot de passe"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="h-12 w-full rounded-2xl border px-4 text-sm font-semibold outline-none"
                style={{
                  background: "var(--dashboard-card-soft)",
                  borderColor: "var(--dashboard-border)",
                  color: "var(--dashboard-text)",
                }}
              />

              <input
                type="password"
                placeholder="Nouveau mot de passe"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-12 w-full rounded-2xl border px-4 text-sm font-semibold outline-none"
                style={{
                  background: "var(--dashboard-card-soft)",
                  borderColor: "var(--dashboard-border)",
                  color: "var(--dashboard-text)",
                }}
              />

              <input
                type="password"
                placeholder="Confirmer le nouveau mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12 w-full rounded-2xl border px-4 text-sm font-semibold outline-none"
                style={{
                  background: "var(--dashboard-card-soft)",
                  borderColor: "var(--dashboard-border)",
                  color: "var(--dashboard-text)",
                }}
              />
            </div>

            {passwordMessage && (
              <p
                className="mt-4 text-sm font-bold"
                style={{
                  color: passwordMessage.toLowerCase().includes("succès")
                    ? "#34d399"
                    : "#f87171",
                }}
              >
                {passwordMessage}
              </p>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false)
                  setPasswordMessage("")
                }}
                className="h-12 rounded-2xl border text-sm font-black transition hover:bg-white/5"
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
                className="h-12 rounded-2xl text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: "var(--brand-gradient)" }}
              >
                {passwordLoading ? "Modification..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}