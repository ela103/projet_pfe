"use client"

import { useEffect, useState } from "react"
import { Switch } from "@/components/ui/switch"
import {
  ArrowLeft,
  Plus,
  X,
  Users,
  CheckCircle2,
  Calendar,
} from "lucide-react"
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

export default function AccountsPage() {
  const [admins, setAdmins] = useState<AdminAccount[]>([])
  const [adminsLoading, setAdminsLoading] = useState(true)
  const [adminsError, setAdminsError] = useState("")

  const [showAdminModal, setShowAdminModal] = useState(false)
  const [adminFirstName, setAdminFirstName] = useState("")
  const [adminLastName, setAdminLastName] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPhone, setAdminPhone] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [adminMessage, setAdminMessage] = useState("")
  const [adminLoading, setAdminLoading] = useState(false)
  const [showEditAdminModal, setShowEditAdminModal] = useState(false)
const [selectedAdminId, setSelectedAdminId] = useState<number | null>(null)
const [adminConfirmPassword, setAdminConfirmPassword] = useState("")

const [editFirstName, setEditFirstName] = useState("")
const [editLastName, setEditLastName] = useState("")
const [editEmail, setEditEmail] = useState("")
const [editPhone, setEditPhone] = useState("")
const [editPassword, setEditPassword] = useState("")
const [editIsActive, setEditIsActive] = useState(true)


const [editMessage, setEditMessage] = useState("")
const [editLoading, setEditLoading] = useState(false)

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
    fetchAdmins()
  }, [])

  const handleCreateAdmin = async () => {
  setAdminMessage("")

  if (
    !adminFirstName.trim() ||
    !adminLastName.trim() ||
    !adminEmail.trim() ||
    !adminPassword ||
    !adminConfirmPassword
  ) {
    setAdminMessage("Veuillez remplir les champs obligatoires.")
    return
  }

  if (adminPassword.length < 8) {
    setAdminMessage("Le mot de passe doit contenir au moins 8 caractères.")
    return
  }

  if (adminPassword !== adminConfirmPassword) {
    setAdminMessage("Les deux mots de passe ne correspondent pas.")
    return
  }

  try {
    setAdminLoading(true)

    const response = await fetch(
      "http://127.0.0.1:8000/api/admins/create/",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: adminFirstName.trim(),
          last_name: adminLastName.trim(),
          email: adminEmail.trim().toLowerCase(),
          phone_number: adminPhone.trim(),
          password: adminPassword,
          confirm_password: adminConfirmPassword,
        }),
      }
    )

    const data = await response.json()

    if (!response.ok || !data.success) {
      setAdminMessage(data.message || "Erreur lors de l’ajout du compte.")
      return
    }

    setAdminMessage(
      data.message || "Compte administrateur ajouté avec succès."
    )

    setAdminFirstName("")
    setAdminLastName("")
    setAdminEmail("")
    setAdminPhone("")
    setAdminPassword("")
    setAdminConfirmPassword("")

    await fetchAdmins()

    setTimeout(() => {
      setShowAdminModal(false)
      setAdminMessage("")
    }, 1000)
  } catch {
    setAdminMessage("Erreur de connexion au serveur.")
  } finally {
    setAdminLoading(false)
  }
}
  const openEditAdminModal = (admin: AdminAccount) => {
  setSelectedAdminId(admin.id)
  setEditFirstName(admin.first_name)
  setEditLastName(admin.last_name)
  setEditEmail(admin.email)
  setEditPhone(admin.phone_number || "")
  setEditMessage("")
  setShowEditAdminModal(true)
}
const handleUpdateAdmin = async () => {
  setEditMessage("")

  if (selectedAdminId === null) {
    setEditMessage("Aucun administrateur sélectionné.")
    return
  }

  if (!editFirstName.trim() || !editLastName.trim() || !editEmail.trim()) {
    setEditMessage("Le prénom, le nom et l’email sont obligatoires.")
    return
  }

  if (editPassword && editPassword.length < 8) {
    setEditMessage("Le mot de passe doit contenir au moins 8 caractères.")
    return
  }

  try {
    setEditLoading(true)

    const response = await fetch(
      `http://127.0.0.1:8000/api/admins/${selectedAdminId}/update/`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: editFirstName.trim(),
          last_name: editLastName.trim(),
          email: editEmail.trim(),
          phone_number: editPhone.trim(),
          
        }),
      }
    )

    const data = await response.json()

    if (!response.ok || !data.success) {
      setEditMessage(data.message || "Erreur lors de la modification.")
      return
    }

    setEditMessage("Compte administrateur modifié avec succès.")

    await fetchAdmins()

    setTimeout(() => {
      setShowEditAdminModal(false)
      setSelectedAdminId(null)
      setEditMessage("")
      setEditPassword("")
    }, 1000)
  } catch {
    setEditMessage("Erreur de connexion au serveur.")
  } finally {
    setEditLoading(false)
  }
}
const totalAdmins = admins.length

const activeAdmins = admins.filter(
  (admin) => admin.is_active
).length

const recentAdmins = admins.filter((admin) => {
  const createdAt = new Date(admin.date_joined)
  const thirtyDaysAgo = new Date()

  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  return createdAt >= thirtyDaysAgo
}).length

  return (
    <section className="px-4 py-6 text-[var(--dashboard-text)] md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/profile"
              }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black transition hover:bg-white/5"
              style={{
                borderColor: "var(--dashboard-border)",
                color: "var(--dashboard-muted)",
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              Retour au profil
            </button>

            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
              Administration
            </p>

            <h1 className="mt-1 text-[32px] font-black text-[var(--dashboard-text)]">
              Gestion des comptes
            </h1>

            <p className="mt-2 text-sm font-semibold text-[var(--dashboard-muted)]">
              Ajouter, modifier ou supprimer les comptes administrateurs.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAdminModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white transition hover:opacity-90"
            style={{
              background: "var(--brand-gradient)",
              boxShadow:
                "0 14px 30px color-mix(in srgb, var(--brand-primary) 24%, transparent)",
            }}
          >
            <Plus className="h-4 w-4" />
            Ajouter un admin
          </button>
        </div>
        
{/* RÉSUMÉ DES COMPTES */}
<div className="grid gap-4 md:grid-cols-3">
  {/* TOTAL ADMINS */}
  <div
    className="flex items-center justify-between rounded-[24px] border p-5 transition hover:-translate-y-0.5"
    style={{
      background:
        "linear-gradient(135deg, color-mix(in srgb, var(--brand-primary) 10%, var(--dashboard-card)), var(--dashboard-card))",
      borderColor:
        "color-mix(in srgb, var(--brand-primary) 25%, var(--dashboard-border))",
      boxShadow: "0 14px 32px rgba(0,0,0,0.08)",
    }}
  >
    <div className="flex items-center gap-4">
      <div
        className="grid h-12 w-12 place-items-center rounded-2xl text-white"
        style={{ background: "var(--brand-gradient)" }}
      >
        <Users className="h-6 w-6" />
      </div>

      <div>
        <p className="text-[12px] font-bold text-[var(--dashboard-muted)]">
          Total des administrateurs
        </p>
        <p className="mt-1 text-[11px] font-semibold text-[var(--dashboard-muted)]">
          Comptes enregistrés
        </p>
      </div>
    </div>

    <p className="text-[30px] font-black text-[var(--dashboard-text)]">
      {totalAdmins}
    </p>
  </div>

  {/* COMPTES ACTIFS */}
  <div
    className="flex items-center justify-between rounded-[24px] border p-5 transition hover:-translate-y-0.5"
    style={{
      background:
        "linear-gradient(135deg, rgba(16,185,129,0.10), var(--dashboard-card))",
      borderColor: "rgba(16,185,129,0.22)",
      boxShadow: "0 14px 32px rgba(0,0,0,0.08)",
    }}
  >
    <div className="flex items-center gap-4">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500 text-white">
        <CheckCircle2 className="h-6 w-6" />
      </div>

      <div>
        <p className="text-[12px] font-bold text-[var(--dashboard-muted)]">
          Comptes actifs
        </p>
        <p className="mt-1 text-[11px] font-semibold text-[var(--dashboard-muted)]">
          Accès autorisé
        </p>
      </div>
    </div>

    <p className="text-[30px] font-black text-emerald-400">
      {activeAdmins}
    </p>
  </div>

  {/* AJOUTS RÉCENTS */}
  <div
    className="flex items-center justify-between rounded-[24px] border p-5 transition hover:-translate-y-0.5"
    style={{
      background:
        "linear-gradient(135deg, color-mix(in srgb, var(--brand-secondary) 10%, var(--dashboard-card)), var(--dashboard-card))",
      borderColor:
        "color-mix(in srgb, var(--brand-secondary) 25%, var(--dashboard-border))",
      boxShadow: "0 14px 32px rgba(0,0,0,0.08)",
    }}
  >
    <div className="flex items-center gap-4">
      <div
        className="grid h-12 w-12 place-items-center rounded-2xl text-white"
        style={{ background: "var(--brand-secondary)" }}
      >
        <Calendar className="h-6 w-6" />
      </div>

      <div>
        <p className="text-[12px] font-bold text-[var(--dashboard-muted)]">
          Ajouts récents
        </p>
        <p className="mt-1 text-[11px] font-semibold text-[var(--dashboard-muted)]">
          Durant les 30 derniers jours
        </p>
      </div>
    </div>

    <p className="text-[30px] font-black text-[var(--dashboard-text)]">
      {recentAdmins}
    </p>
  </div>
</div>
        <section
          className="rounded-[30px] border p-6"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--dashboard-card) 94%, transparent), color-mix(in srgb, var(--dashboard-card-soft) 76%, transparent))",
            borderColor: "var(--dashboard-border)",
            boxShadow:
              "0 18px 45px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          {adminsLoading ? (
            <div
              className="relative flex w-full items-center gap-4 rounded-[22px] p-4"
              style={{
                background:
                  "color-mix(in srgb, var(--dashboard-card-soft) 82%, transparent)",
              }}
            >
              <p className="text-[13px] font-bold text-[var(--dashboard-muted)]">
                Chargement des comptes...
              </p>
            </div>
          ) : adminsError ? (
            <div className="rounded-[22px] border border-red-500/20 bg-red-500/10 p-4">
              <p className="text-[13px] font-bold text-red-400">
                {adminsError}
              </p>
            </div>
          ) : admins.length === 0 ? (
            <div
              className="relative flex w-full items-center gap-4 rounded-[22px] p-4"
              style={{
                background:
                  "color-mix(in srgb, var(--dashboard-card-soft) 82%, transparent)",
              }}
            >
              <p className="text-[13px] font-bold text-[var(--dashboard-muted)]">
                Aucun compte administrateur trouvé.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="relative flex w-full items-center gap-4 rounded-[22px] p-4 transition hover:-translate-y-0.5"
                  style={{
                    background:
                      "color-mix(in srgb, var(--dashboard-card-soft) 82%, transparent)",
                  }}
                >
                  <div
                    className="z-10 grid h-12 w-12 shrink-0 place-items-center rounded-full text-white"
                    style={{ background: "var(--brand-gradient)" }}
                  >
                    <span className="text-sm font-black">
                      {`${admin.first_name?.[0] || ""}${admin.last_name?.[0] || ""}`.toUpperCase() ||
                        "AD"}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-black text-[var(--dashboard-text)]">
                      {admin.first_name} {admin.last_name}
                    </p>

                    <p className="mt-1 text-[12px] font-semibold text-[var(--dashboard-muted)]">
                      {admin.email}
                      {admin.phone_number ? ` • ${admin.phone_number}` : ""}
                    </p>
                  </div>

                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-black"
                    style={{
                      background: admin.is_active
                        ? "rgba(16,185,129,0.12)"
                        : "rgba(239,68,68,0.12)",
                      color: admin.is_active ? "#34d399" : "#f87171",
                    }}
                  >
                    {admin.is_active ? "Actif" : "Désactivé"}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditAdminModal(admin)}
                      className="rounded-full px-4 py-2 text-[11px] font-black transition hover:opacity-90"
                      style={{
                        background:
                          "color-mix(in srgb, var(--brand-primary) 18%, transparent)",
                        color: "var(--brand-primary)",
                      }}
                    >
                      Modifier
                    </button>

                    <button
                      type="button"
                      className="rounded-full bg-red-500/10 px-4 py-2 text-[11px] font-black text-red-400 transition hover:bg-red-500/15"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
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
              {/* Mot de passe */}
<input
  type="password"
  name="new-password"
  placeholder="Mot de passe"
  value={adminPassword}
  onChange={(e) => setAdminPassword(e.target.value)}
  autoComplete="new-password"
  minLength={8}
  required
  className="h-12 w-full rounded-2xl border px-4 text-sm font-semibold outline-none transition focus:ring-2"
  style={{
    background: "var(--dashboard-card-soft)",
    borderColor: "var(--dashboard-border)",
    color: "var(--dashboard-text)",
  }}
/>
              <input
  type="password"
  name="confirm-password"
  placeholder="Confirmer le mot de passe"
  value={adminConfirmPassword}
  onChange={(e) => setAdminConfirmPassword(e.target.value)}
  autoComplete="new-password"
  minLength={8}
  required
  className="h-14 w-full rounded-[20px] border px-5 text-[14px] font-bold outline-none"
  style={{
    background: "var(--dashboard-card-soft)",
    borderColor: "var(--dashboard-border)",
    color: "var(--dashboard-text)",
  }}
/>
{adminConfirmPassword &&
  adminPassword !== adminConfirmPassword && (
    <p className="-mt-1 text-xs font-bold text-red-400">
      Les deux mots de passe ne correspondent pas.
    </p>
  )}
              
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
      {/* MODAL MODIFICATION ADMIN */}
      {showEditAdminModal && (
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
                  Modifier un administrateur
                </h2>

                <p className="mt-1 text-sm font-semibold text-[var(--dashboard-muted)]">
                  Modifiez les informations du compte sélectionné.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowEditAdminModal(false)
                  setSelectedAdminId(null)
                  setEditMessage("")
                  setEditPassword("")
                }}
                className="grid h-9 w-9 place-items-center rounded-xl border transition hover:bg-black/5 dark:hover:bg-white/5"
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
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
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
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
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
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
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
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="h-12 w-full rounded-2xl border px-4 text-sm font-semibold outline-none"
                style={{
                  background: "var(--dashboard-card-soft)",
                  borderColor: "var(--dashboard-border)",
                  color: "var(--dashboard-text)",
                }}
              />

            

              
            </div>

            {editMessage && (
              <p
                className="mt-4 text-sm font-bold"
                style={{
                  color: editMessage.toLowerCase().includes("succès")
                    ? "#34d399"
                    : "#f87171",
                }}
              >
                {editMessage}
              </p>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowEditAdminModal(false)
                  setSelectedAdminId(null)
                  setEditMessage("")
                  setEditPassword("")
                }}
                className="h-12 rounded-2xl border text-sm font-black transition hover:bg-black/5 dark:hover:bg-white/5"
                style={{
                  borderColor: "var(--dashboard-border)",
                  color: "var(--dashboard-text)",
                }}
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleUpdateAdmin}
                disabled={editLoading}
                className="h-12 rounded-2xl text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: "var(--brand-gradient)" }}
              >
                {editLoading ? "Modification..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}