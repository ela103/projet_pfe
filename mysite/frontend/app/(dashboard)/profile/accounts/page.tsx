"use client"

import { useEffect, useMemo, useState } from "react"
import type { InputHTMLAttributes, ReactNode } from "react"
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Mail,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
  type LucideIcon,
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
  const [query, setQuery] = useState("")

  const [showAdminModal, setShowAdminModal] = useState(false)
  const [adminFirstName, setAdminFirstName] = useState("")
  const [adminLastName, setAdminLastName] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPhone, setAdminPhone] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [adminConfirmPassword, setAdminConfirmPassword] = useState("")
  const [adminMessage, setAdminMessage] = useState("")
  const [adminLoading, setAdminLoading] = useState(false)

  const [showEditAdminModal, setShowEditAdminModal] = useState(false)
  const [selectedAdminId, setSelectedAdminId] = useState<number | null>(null)
  const [editFirstName, setEditFirstName] = useState("")
  const [editLastName, setEditLastName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editPassword, setEditPassword] = useState("")
  const [editMessage, setEditMessage] = useState("")
  const [editLoading, setEditLoading] = useState(false)

  const [adminToDelete, setAdminToDelete] = useState<AdminAccount | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState("")

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

    const cleanFirstName = adminFirstName.trim()
    const cleanLastName = adminLastName.trim()
    const cleanEmail = adminEmail.trim().toLowerCase()
    const cleanPhone = adminPhone.trim()

    if (
      !cleanFirstName ||
      !cleanLastName ||
      !cleanEmail ||
      !cleanPhone ||
      !adminPassword ||
      !adminConfirmPassword
    ) {
      setAdminMessage("Veuillez remplir tous les champs obligatoires.")
      return
    }

    const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/

    if (cleanFirstName.length < 2 || cleanFirstName.length > 25) {
      setAdminMessage("Le prénom doit contenir entre 2 et 25 caractères.")
      return
    }

    if (!nameRegex.test(cleanFirstName)) {
      setAdminMessage(
        "Le prénom doit contenir uniquement des lettres, espaces, apostrophes ou tirets."
      )
      return
    }

    if (cleanLastName.length < 2 || cleanLastName.length > 25) {
      setAdminMessage("Le nom doit contenir entre 2 et 25 caractères.")
      return
    }

    if (!nameRegex.test(cleanLastName)) {
      setAdminMessage(
        "Le nom doit contenir uniquement des lettres, espaces, apostrophes ou tirets."
      )
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(cleanEmail)) {
      setAdminMessage("Veuillez saisir une adresse email valide.")
      return
    }

    const phoneRegex = /^\d{8}$/

    if (!phoneRegex.test(cleanPhone)) {
      setAdminMessage("Le numéro de téléphone doit contenir exactement 8 chiffres.")
      return
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/

    if (!passwordRegex.test(adminPassword)) {
      setAdminMessage(
        "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial."
      )
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
            first_name: cleanFirstName,
            last_name: cleanLastName,
            email: cleanEmail,
            phone_number: cleanPhone,
            password: adminPassword,
            confirm_password: adminConfirmPassword,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        setAdminMessage(data.message || "Erreur lors de l'ajout du compte.")
        return
      }

      setAdminMessage(data.message || "Compte administrateur ajouté avec succès.")

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
    setEditPassword("")
    setAdminConfirmPassword("")
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
      setEditMessage("Le prénom, le nom et l'email sont obligatoires.")
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

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return

    setIsDeleting(true)
    setDeleteMessage("")

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/admins/${adminToDelete.id}/delete/`,
        {
          method: "DELETE",
          credentials: "include",
        }
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setDeleteMessage(data.message || "Impossible de supprimer ce compte.")
        return
      }

      setAdmins((currentAdmins) =>
        currentAdmins.filter((admin) => admin.id !== adminToDelete.id)
      )

      setAdminToDelete(null)
    } catch (error) {
      console.error("Erreur de suppression :", error)
      setDeleteMessage("Impossible de contacter le serveur.")
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredAdmins = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return admins
    }

    return admins.filter((admin) => {
      const fullName = `${admin.first_name} ${admin.last_name}`.toLowerCase()

      return (
        fullName.includes(normalizedQuery) ||
        admin.email.toLowerCase().includes(normalizedQuery) ||
        admin.phone_number?.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [admins, query])

  const totalAdmins = admins.length
  const activeAdmins = admins.filter((admin) => admin.is_active).length
  const recentAdmins = admins.filter((admin) => {
    const createdAt = new Date(admin.date_joined)
    const thirtyDaysAgo = new Date()

    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    return createdAt >= thirtyDaysAgo
  }).length

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <section className="px-4 py-6 text-[var(--dashboard-text)] md:px-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/profile"
              }}
              className="mb-4 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition hover:text-[var(--dashboard-text)]"
              style={{
                background: "var(--dashboard-card)",
                borderColor: "var(--dashboard-border)",
                color: "var(--dashboard-muted)",
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              Retour au profil
            </button>

            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--dashboard-muted)]">
              Administration
            </p>

            <h1 className="mt-2 text-2xl font-black text-[var(--dashboard-text)]">
              Comptes admins
            </h1>

            <p className="mt-2 max-w-xl text-sm font-semibold text-[var(--dashboard-muted)]">
              Gérez les accès administrateurs avec une vue simple et lisible.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAdminModal(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black text-white transition hover:opacity-90"
            style={{
              background: "var(--brand-gradient)",
              boxShadow:
                "0 12px 26px color-mix(in srgb, var(--brand-primary) 22%, transparent)",
            }}
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </header>

        <div className="grid gap-3 md:grid-cols-3">
          <SummaryPill
            icon={Users}
            label="Total"
            value={totalAdmins}
            description="Comptes enregistrés"
          />
          <SummaryPill
            icon={CheckCircle2}
            label="Actifs"
            value={activeAdmins}
            description="Accès autorisés"
            tone="success"
          />
          <SummaryPill
            icon={Calendar}
            label="Récents"
            value={recentAdmins}
            description="30 derniers jours"
            tone="secondary"
          />
        </div>

        <section
          className="rounded-[24px] border p-4 shadow-[var(--dashboard-shadow)]"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--dashboard-card) 96%, transparent), color-mix(in srgb, var(--dashboard-card-soft) 70%, transparent))",
            borderColor: "var(--dashboard-border)",
          }}
        >
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black text-[var(--dashboard-text)]">
                Liste des administrateurs
              </p>
              <p className="mt-1 text-xs font-semibold text-[var(--dashboard-muted)]">
                {filteredAdmins.length} compte(s) affiché(s)
              </p>
            </div>

            <label className="relative block md:w-80">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--brand-primary)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un admin..."
                className="h-11 w-full rounded-xl border bg-[var(--dashboard-card)] pl-10 pr-4 text-sm font-semibold text-[var(--dashboard-text)] outline-none placeholder:text-[var(--dashboard-muted)] focus:border-[var(--brand-primary)]"
                style={{ borderColor: "var(--dashboard-border)" }}
              />
            </label>
          </div>

          {adminsLoading ? (
            <StateCard message="Chargement des comptes..." />
          ) : adminsError ? (
            <div className="rounded-[18px] border border-red-500/20 bg-red-500/10 p-4">
              <p className="text-sm font-bold text-red-400">{adminsError}</p>
            </div>
          ) : admins.length === 0 ? (
            <StateCard message="Aucun compte administrateur trouvé." />
          ) : filteredAdmins.length === 0 ? (
            <StateCard message="Aucun administrateur ne correspond à la recherche." />
          ) : (
            <div className="space-y-4">
              {filteredAdmins.map((admin, index) => (
                <AdminRow
                  key={admin.id}
                  admin={admin}
                  index={index}
                  formatDate={formatDate}
                  onEdit={() => openEditAdminModal(admin)}
                  onDelete={() => {
                    setAdminToDelete(admin)
                    setDeleteMessage("")
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {showAdminModal && (
        <AdminModal
          title="Ajouter un administrateur"
          description="Créer un nouveau compte administrateur."
          message={adminMessage}
          onClose={() => {
            setShowAdminModal(false)
            setAdminMessage("")
          }}
        >
          <div className="space-y-3">
            <ThemedInput
              placeholder="Prénom"
              value={adminFirstName}
              onChange={setAdminFirstName}
            />
            <ThemedInput
              placeholder="Nom"
              value={adminLastName}
              onChange={setAdminLastName}
            />
            <ThemedInput
              type="email"
              placeholder="Adresse email"
              value={adminEmail}
              onChange={setAdminEmail}
            />
            <ThemedInput
              type="tel"
              name="phone"
              placeholder="Téléphone - 8 chiffres"
              value={adminPhone}
              onChange={(value) =>
                setAdminPhone(value.replace(/\D/g, "").slice(0, 8))
              }
              inputMode="numeric"
              maxLength={8}
              autoComplete="tel"
            />
            <ThemedInput
              type="password"
              name="new-password"
              placeholder="Mot de passe"
              value={adminPassword}
              onChange={setAdminPassword}
              autoComplete="new-password"
            />
            <ThemedInput
              type="password"
              name="confirm-password"
              placeholder="Confirmer le mot de passe"
              value={adminConfirmPassword}
              onChange={setAdminConfirmPassword}
              autoComplete="new-password"
            />

            {adminConfirmPassword && adminPassword !== adminConfirmPassword && (
              <p className="-mt-1 text-xs font-bold text-red-400">
                Les deux mots de passe ne correspondent pas.
              </p>
            )}
          </div>

          <ModalActions
            cancelLabel="Annuler"
            confirmLabel={adminLoading ? "Ajout..." : "Ajouter"}
            disabled={adminLoading}
            onCancel={() => {
              setShowAdminModal(false)
              setAdminMessage("")
            }}
            onConfirm={handleCreateAdmin}
          />
        </AdminModal>
      )}

      {showEditAdminModal && (
        <AdminModal
          title="Modifier un administrateur"
          description="Modifiez les informations du compte sélectionné."
          message={editMessage}
          onClose={() => {
            setShowEditAdminModal(false)
            setSelectedAdminId(null)
            setEditMessage("")
            setEditPassword("")
          }}
        >
          <div className="space-y-3">
            <ThemedInput
              placeholder="Prénom"
              value={editFirstName}
              onChange={setEditFirstName}
            />
            <ThemedInput
              placeholder="Nom"
              value={editLastName}
              onChange={setEditLastName}
            />
            <ThemedInput
              type="email"
              placeholder="Adresse email"
              value={editEmail}
              onChange={setEditEmail}
            />
            <ThemedInput
              type="tel"
              name="phone"
              placeholder="Téléphone - 8 chiffres"
              value={editPhone}
              onChange={(value) =>
                setEditPhone(value.replace(/\D/g, "").slice(0, 8))
              }
              inputMode="numeric"
              maxLength={8}
              autoComplete="tel"
            />
          </div>

          <ModalActions
            cancelLabel="Annuler"
            confirmLabel={editLoading ? "Modification..." : "Enregistrer"}
            disabled={editLoading}
            onCancel={() => {
              setShowEditAdminModal(false)
              setSelectedAdminId(null)
              setEditMessage("")
              setEditPassword("")
            }}
            onConfirm={handleUpdateAdmin}
          />
        </AdminModal>
      )}

      {adminToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div
            className="relative w-full max-w-md rounded-[24px] border p-6 shadow-2xl"
            style={{
              background: "var(--dashboard-card)",
              borderColor: "var(--dashboard-border)",
              color: "var(--dashboard-text)",
            }}
          >
            <button
              type="button"
              onClick={() => {
                if (!isDeleting) {
                  setAdminToDelete(null)
                  setDeleteMessage("")
                }
              }}
              disabled={isDeleting}
              aria-label="Fermer"
              className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full border transition hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: "var(--dashboard-card-soft)",
                borderColor: "var(--dashboard-border)",
                color: "var(--dashboard-text)",
              }}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="pr-12">
              <h2 className="text-lg font-black">Supprimer le compte</h2>
              <p className="mt-2 text-sm font-semibold text-[var(--dashboard-muted)]">
                Cette action est définitive.
              </p>
            </div>

            <div
              className="mt-5 rounded-[18px] border p-4"
              style={{
                background: "var(--dashboard-card-soft)",
                borderColor: "var(--dashboard-border)",
              }}
            >
              <p className="text-sm font-bold leading-6">
                Supprimer le compte de{" "}
                <span className="font-black">
                  {adminToDelete.first_name} {adminToDelete.last_name}
                </span>{" "}
                ?
              </p>
              <p className="mt-1 truncate text-xs font-semibold text-[var(--dashboard-muted)]">
                {adminToDelete.email}
              </p>
            </div>

            {deleteMessage && (
              <div
                className="mt-4 rounded-2xl border px-4 py-3 text-sm font-bold"
                style={{
                  background: "var(--dashboard-card-soft)",
                  borderColor: "var(--dashboard-border)",
                  color: "var(--dashboard-text)",
                }}
              >
                {deleteMessage}
              </div>
            )}

            <ModalActions
              cancelLabel="Annuler"
              confirmLabel={isDeleting ? "Suppression..." : "Supprimer"}
              disabled={isDeleting}
              destructive
              onCancel={() => {
                setAdminToDelete(null)
                setDeleteMessage("")
              }}
              onConfirm={handleDeleteAdmin}
            />
          </div>
        </div>
      )}
    </section>
  )
}

function SummaryPill({
  icon: Icon,
  label,
  value,
  description,
  tone = "brand",
}: {
  icon: LucideIcon
  label: string
  value: number
  description: string
  tone?: "brand" | "success" | "secondary"
}) {
  const isSuccess = tone === "success"
  const isSecondary = tone === "secondary"
  const accent = isSuccess
    ? "#10b981"
    : isSecondary
    ? "var(--brand-secondary)"
    : "var(--brand-primary)"
  const cardBackground = isSuccess
    ? "linear-gradient(135deg, color-mix(in srgb, #10b981 18%, var(--dashboard-card)), color-mix(in srgb, #10b981 7%, var(--dashboard-card)) 54%, var(--dashboard-card))"
    : isSecondary
    ? "linear-gradient(135deg, color-mix(in srgb, var(--brand-secondary) 18%, var(--dashboard-card)), color-mix(in srgb, var(--brand-tertiary) 10%, var(--dashboard-card)) 58%, var(--dashboard-card))"
    : "linear-gradient(135deg, color-mix(in srgb, var(--brand-primary) 18%, var(--dashboard-card)), color-mix(in srgb, var(--brand-secondary) 10%, var(--dashboard-card)) 58%, var(--dashboard-card))"

  return (
    <div
      className="relative overflow-hidden rounded-[20px] border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[var(--dashboard-shadow)]"
      style={{
        background: cardBackground,
        borderColor: `color-mix(in srgb, ${accent} 30%, var(--dashboard-border))`,
      }}
    >
      <div
        className="absolute -right-8 -top-10 h-28 w-28 rounded-full opacity-20 blur-2xl"
        style={{ background: accent }}
      />

      <div className="relative flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white shadow-lg"
            style={{
              background: isSuccess ? "#10b981" : "var(--brand-gradient)",
            }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-[var(--dashboard-text)]">
              {label}
            </p>
            <p className="mt-0.5 truncate text-[12px] font-bold text-[var(--dashboard-muted)]">
              {description}
            </p>
          </div>
        </div>

        <p className="text-2xl font-black" style={{ color: accent }}>
          {value}
        </p>
      </div>
    </div>
  )
}

function AdminRow({
  admin,
  index,
  formatDate,
  onEdit,
  onDelete,
}: {
  admin: AdminAccount
  index: number
  formatDate: (date: string) => string
  onEdit: () => void
  onDelete: () => void
}) {
  const initials =
    `${admin.first_name?.[0] || ""}${admin.last_name?.[0] || ""}`.toUpperCase() ||
    "AD"

  const accentColors = [
    "var(--brand-primary)",
    "var(--brand-secondary)",
    "var(--brand-tertiary)",
    "#10b981",
    "#f59e0b",
  ]
  const accent = accentColors[index % accentColors.length]

  return (
    <div>
      <div
        className="group relative overflow-hidden rounded-[18px] border bg-[var(--dashboard-card)] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[var(--dashboard-shadow)]"
        style={{ borderColor: "var(--dashboard-border)" }}
      >
        <span
          className="absolute bottom-0 left-0 top-0 w-1"
          style={{ background: accent }}
        />

        <div className="grid gap-4 pl-2 lg:grid-cols-[58px_minmax(0,1fr)_260px] lg:items-center">
          <div
            className="grid h-12 w-12 place-items-center rounded-2xl text-sm font-black text-white"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--brand-primary) 82%, white 8%), var(--brand-secondary))",
            }}
          >
            {initials}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-black text-[var(--dashboard-text)]">
                {admin.first_name} {admin.last_name}
              </h2>

              <span
                className="rounded-full px-2.5 py-1 text-[10px] font-black"
                style={{
                  background: admin.is_active
                    ? "color-mix(in srgb, #10b981 13%, var(--dashboard-card-soft))"
                    : "color-mix(in srgb, #ef4444 12%, var(--dashboard-card-soft))",
                  color: admin.is_active ? "#10b981" : "#ef4444",
                }}
              >
                {admin.is_active ? "Actif" : "Désactivé"}
              </span>

              {admin.is_staff && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--dashboard-card-soft)] px-2.5 py-1 text-[10px] font-black text-[var(--dashboard-muted)]">
                  <ShieldCheck className="h-3 w-3" />
                  Staff
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] font-semibold text-[var(--dashboard-muted)]">
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{admin.email}</span>
              </span>
              {admin.phone_number && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {admin.phone_number}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(admin.date_joined)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <span
              className="rounded-full px-3 py-1.5 text-[10px] font-black"
              style={{
                background:
                  "color-mix(in srgb, var(--brand-primary) 12%, var(--dashboard-card-soft))",
                color: "var(--brand-primary)",
              }}
            >
              Admin
            </span>

            <button
              type="button"
              onClick={onEdit}
              className="rounded-full border px-4 py-2 text-[11px] font-black transition hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
              style={{
                background: "var(--dashboard-card)",
                borderColor: "var(--dashboard-border)",
                color: "var(--dashboard-muted)",
              }}
            >
              Modifier
            </button>

            <button
              type="button"
              onClick={onDelete}
              className="grid h-9 w-9 place-items-center rounded-full text-red-500 transition hover:bg-red-500/10"
              aria-label="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StateCard({ message }: { message: string }) {
  return (
    <div
      className="rounded-[18px] border p-5 text-sm font-bold text-[var(--dashboard-muted)]"
      style={{
        background: "var(--dashboard-card-soft)",
        borderColor: "var(--dashboard-border)",
      }}
    >
      {message}
    </div>
  )
}

function AdminModal({
  title,
  description,
  message,
  onClose,
  children,
}: {
  title: string
  description: string
  message: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-[24px] border p-6 shadow-2xl"
        style={{
          background: "var(--dashboard-card)",
          borderColor: "var(--dashboard-border)",
        }}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-[var(--dashboard-text)]">
              {title}
            </h2>
            <p className="mt-1 text-sm font-semibold text-[var(--dashboard-muted)]">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl border transition hover:bg-black/5 dark:hover:bg-white/5"
            style={{
              borderColor: "var(--dashboard-border)",
              color: "var(--dashboard-text)",
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {children}

        {message && (
          <p
            className="mt-4 text-sm font-bold"
            style={{
              color: message.toLowerCase().includes("succès")
                ? "#10b981"
                : "#f87171",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

function ThemedInput({
  value,
  onChange,
  type = "text",
  ...props
}: {
  value: string
  onChange: (value: string) => void
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <input
      {...props}
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full rounded-xl border px-4 text-sm font-semibold outline-none transition focus:border-[var(--brand-primary)]"
      style={{
        background: "var(--dashboard-card-soft)",
        borderColor: "var(--dashboard-border)",
        color: "var(--dashboard-text)",
      }}
    />
  )
}

function ModalActions({
  cancelLabel,
  confirmLabel,
  disabled,
  destructive = false,
  onCancel,
  onConfirm,
}: {
  cancelLabel: string
  confirmLabel: string
  disabled?: boolean
  destructive?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={onCancel}
        disabled={disabled}
        className="h-11 rounded-xl border text-sm font-black transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/5"
        style={{
          borderColor: "var(--dashboard-border)",
          color: "var(--dashboard-text)",
        }}
      >
        {cancelLabel}
      </button>

      <button
        type="button"
        onClick={onConfirm}
        disabled={disabled}
        className="h-11 rounded-xl text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          background: destructive ? "#ef4444" : "var(--brand-gradient)",
        }}
      >
        {confirmLabel}
      </button>
    </div>
  )
}
