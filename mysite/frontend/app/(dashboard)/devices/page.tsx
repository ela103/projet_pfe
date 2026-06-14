"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  BarChart3,
  BriefcaseBusiness,
  Car,
  CheckCircle2,
  Code2,
  ExternalLink,
  Globe,
  GraduationCap,
  Hotel,
  House,
  Loader2,
  Megaphone,
  Newspaper,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Stethoscope,
  TrendingUp,
  Utensils,
  X,
  Pencil,
Trash2,
  type LucideIcon,
} from "lucide-react"

type Website = {
  id: number
  name: string
  ga4_property_id?: string | null
  gsc_site_url?: string | null
  created_at?: string | null
}

type FilterType = "all" | "connected" | "incomplete" | "active"

type Toast = {
  type: "success" | "error" | "warning"
  message: string
}

function getWebsiteIcon(name: string): LucideIcon {
  const value = name.toLowerCase()

  if (
    value.includes("cabinet") ||
    value.includes("medical") ||
    value.includes("médical") ||
    value.includes("clinic") ||
    value.includes("doctor") ||
    value.includes("docteur")
  ) {
    return Stethoscope
  }

  if (
    value.includes("car") ||
    value.includes("rental") ||
    value.includes("voiture") ||
    value.includes("location")
  ) {
    return Car
  }

  if (
    value.includes("travel") ||
    value.includes("tourism") ||
    value.includes("tourisme") ||
    value.includes("voyage") ||
    value.includes("trip")
  ) {
    return Hotel
  }

  if (
    value.includes("marketing") ||
    value.includes("seo") ||
    value.includes("agency") ||
    value.includes("communication")
  ) {
    return Megaphone
  }

  if (
    value.includes("restaurant") ||
    value.includes("café") ||
    value.includes("cafe") ||
    value.includes("food")
  ) {
    return Utensils
  }

  if (
    value.includes("shop") ||
    value.includes("store") ||
    value.includes("commerce") ||
    value.includes("boutique")
  ) {
    return ShoppingCart
  }

  if (
    value.includes("school") ||
    value.includes("école") ||
    value.includes("ecole") ||
    value.includes("formation") ||
    value.includes("education")
  ) {
    return GraduationCap
  }

  if (
    value.includes("blog") ||
    value.includes("news") ||
    value.includes("article")
  ) {
    return Newspaper
  }

  if (
    value.includes("real estate") ||
    value.includes("immobilier") ||
    value.includes("villa") ||
    value.includes("maison") ||
    value.includes("house")
  ) {
    return House
  }

  if (
    value.includes("tech") ||
    value.includes("app") ||
    value.includes("software") ||
    value.includes("digital") ||
    value.includes("web")
  ) {
    return Code2
  }

  if (
    value.includes("company") ||
    value.includes("business") ||
    value.includes("entreprise") ||
    value.includes("service")
  ) {
    return BriefcaseBusiness
  }

  return Globe
}

function getWebsiteStatus(website: Website) {
  const hasGA4 = Boolean(website.ga4_property_id)
  const hasGSC = Boolean(website.gsc_site_url)

  if (hasGA4 && hasGSC) {
    return {
      label: "Prêt pour l’analyse",
      short: "Connecté",
      progress: 100,
      message: "Les sources GA4 et Search Console sont bien renseignées.",
    }
  }

  if (hasGA4 || hasGSC) {
    return {
      label: hasGA4 ? "Search Console à compléter" : "GA4 à compléter",
      short: "Partiel",
      progress: 55,
      message:
        "Une source est disponible, mais la configuration reste incomplète.",
    }
  }

  return {
    label: "Configuration à compléter",
    short: "Non configuré",
    progress: 12,
    message: "Ajoutez GA4 et Search Console pour lancer l’analyse.",
  }
}

function getFriendlyDescription(name: string) {
  const value = name.toLowerCase()

  if (value.includes("cabinet") || value.includes("medical")) {
    return "Suivi de visibilité pour un site médical et ses pages stratégiques."
  }

  if (value.includes("car") || value.includes("rental")) {
    return "Suivi d’un site de location de voitures et de ses performances SEO."
  }

  if (value.includes("travel") || value.includes("tourisme")) {
    return "Suivi d’un site touristique pour observer son trafic et sa visibilité."
  }

  if (value.includes("marketing")) {
    return "Suivi d’un site de services marketing et de ses indicateurs SEO."
  }

  return "Site ajouté à Smart SEO pour suivre ses données et ses performances."
}
function getCookie(name: string): string {
  const cookies = document.cookie.split(";")

  for (const cookie of cookies) {
    const [cookieName, ...cookieValue] = cookie.trim().split("=")

    if (cookieName === name) {
      return decodeURIComponent(cookieValue.join("="))
    }
  }

  return ""
}

export default function WebsitesPage() {
  const router = useRouter()

  const [websites, setWebsites] = useState<Website[]>([])
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [importingId, setImportingId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<FilterType>("all")
  const [toast, setToast] = useState<Toast | null>(null)
  const [showAddSiteModal, setShowAddSiteModal] = useState(false)
  const [siteName, setSiteName] = useState("")
  const [ga4PropertyId, setGa4PropertyId] = useState("")
  const [gscSiteUrl, setGscSiteUrl] = useState("")

  const [addSiteLoading, setAddSiteLoading] = useState(false)
  const [addSiteMessage, setAddSiteMessage] = useState("")
  /* Modification d’un site */
const [showEditSiteModal, setShowEditSiteModal] = useState(false)
const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null)

const [editSiteName, setEditSiteName] = useState("")
const [editGa4PropertyId, setEditGa4PropertyId] = useState("")
const [editGscSiteUrl, setEditGscSiteUrl] = useState("")

const [editSiteLoading, setEditSiteLoading] = useState(false)
const [editSiteMessage, setEditSiteMessage] = useState("")

/* Suppression d’un site */
const [showDeleteSiteModal, setShowDeleteSiteModal] = useState(false)
const [siteToDelete, setSiteToDelete] = useState<Website | null>(null)

const [deleteSiteLoading, setDeleteSiteLoading] = useState(false)
const [deleteSiteMessage, setDeleteSiteMessage] = useState("")

  useEffect(() => {
    const savedWebsiteId = localStorage.getItem("websiteId")

    if (savedWebsiteId) {
      setSelectedWebsiteId(savedWebsiteId)
    }

    fetchWebsites()
  }, [])

  useEffect(() => {
    if (!toast) return

    const timer = setTimeout(() => setToast(null), 3500)

    return () => clearTimeout(timer)
  }, [toast])

  const fetchWebsites = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await fetch("http://127.0.0.1:8000/data/websites/", {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Impossible de récupérer la liste des sites.")
      }

      const data = await response.json()

      setWebsites(data.websites || [])
    } catch {
      setError("Une erreur est survenue lors du chargement des sites.")
    } finally {
      setLoading(false)
    }
  }
  const handleCreateWebsite = async () => {
  setAddSiteMessage("")

  const cleanSiteName = siteName.trim()

  if (!cleanSiteName) {
    setAddSiteMessage("Le nom du site est obligatoire.")
    return
  }

  if (cleanSiteName.length < 2) {
    setAddSiteMessage(
      "Le nom du site doit contenir au moins 2 caractères."
    )
    return
  }

  if (cleanSiteName.length > 20) {
    setAddSiteMessage(
      "Le nom du site ne doit pas dépasser 20 caractères."
    )
    return
  }

  const cleanPropertyId = ga4PropertyId.trim()

  if (!cleanPropertyId) {
    setAddSiteMessage("Le Property ID GA4 est obligatoire.")
    return
  }

  if (!/^\d{8}$/.test(cleanPropertyId)) {
    setAddSiteMessage(
      "Le Property ID GA4 doit contenir exactement 8 chiffres."
    )
    return
  }

  const cleanGscUrl = gscSiteUrl.trim()

  if (!cleanGscUrl) {
    setAddSiteMessage(
      "L’URL Google Search Console est obligatoire."
    )
    return
  }

  try {
    const parsedUrl = new URL(cleanGscUrl)

    if (parsedUrl.protocol !== "https:") {
      setAddSiteMessage(
        "L’URL Google Search Console doit commencer par https://"
      )
      return
    }
  } catch {
    setAddSiteMessage(
      "Veuillez saisir une URL Google Search Console valide."
    )
    return
  }

  try {
    setAddSiteLoading(true)

    const response = await fetch(
      "http://127.0.0.1:8000/data/websites/add/",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({
          name: cleanSiteName,
          ga4_property_id: cleanPropertyId,
          gsc_site_url: cleanGscUrl,
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      setAddSiteMessage(
        data.error || data.message || "Impossible d’ajouter le site."
      )
      return
    }

    setAddSiteMessage("Site ajouté avec succès.")

    await fetchWebsites()

    setSiteName("")
    setGa4PropertyId("")
    setGscSiteUrl("")

    setTimeout(() => {
      setShowAddSiteModal(false)
      setAddSiteMessage("")
    }, 1000)
  } catch {
    setAddSiteMessage("Erreur de connexion au serveur.")
  } finally {
    setAddSiteLoading(false)
  }
}

  const selectWebsite = (websiteId: number) => {
    const id = String(websiteId)

    setSelectedWebsiteId(id)
    localStorage.setItem("websiteId", id)

    setToast({
      type: "success",
      message:
        "Ce site est maintenant utilisé comme site actif dans le dashboard.",
    })
  }

  const importWebsiteData = async (website: Website) => {
    const canImport = website.ga4_property_id && website.gsc_site_url

    if (!canImport) {
      setToast({
        type: "warning",
        message:
          "Impossible de lancer l’import : les informations GA4 ou Search Console sont manquantes.",
      })
      return
    }

    try {
      setImportingId(website.id)

      const response = await fetch(
        `http://127.0.0.1:8000/data/import/?website_id=${website.id}`,
        {
          method: "GET",
          credentials: "include",
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur pendant l’importation.")
      }

      const result = data.results?.[0]

      if (result?.status === "success") {
        setToast({
          type: "success",
          message: "Les données du site ont été importées avec succès.",
        })
      } else if (result?.status === "skipped") {
        setToast({
          type: "warning",
          message: result.reason || "Importation ignorée.",
        })
      } else if (result?.status === "error") {
        setToast({
          type: "error",
          message: result.error || "Erreur pendant l’importation.",
        })
      } else {
        setToast({
          type: "success",
          message: "Traitement terminé.",
        })
      }
    } catch {
      setToast({
        type: "error",
        message: "Une erreur est survenue pendant l’importation des données.",
      })
    } finally {
      setImportingId(null)
    }
  }

  const connectedCount = websites.filter(
    (website) => website.ga4_property_id && website.gsc_site_url
  ).length

  const incompleteCount = websites.length - connectedCount

  const activeWebsite = websites.find(
    (website) => String(website.id) === selectedWebsiteId
  )

  const filteredWebsites = useMemo(() => {
    return websites.filter((website) => {
      const term = searchTerm.toLowerCase().trim()
      const isSelected = String(website.id) === selectedWebsiteId
      const isConnected = Boolean(
        website.ga4_property_id && website.gsc_site_url
      )

      const matchesSearch =
        !term ||
        website.name.toLowerCase().includes(term) ||
        website.gsc_site_url?.toLowerCase().includes(term) ||
        website.ga4_property_id?.toLowerCase().includes(term)

      const matchesFilter =
        filter === "all" ||
        (filter === "connected" && isConnected) ||
        (filter === "incomplete" && !isConnected) ||
        (filter === "active" && isSelected)

      return matchesSearch && matchesFilter
    })
  }, [websites, searchTerm, filter, selectedWebsiteId])

  const tabs = [
    { key: "all", label: "Tous", count: websites.length },
    { key: "connected", label: "Connectés", count: connectedCount },
    { key: "active", label: "Site actif", count: activeWebsite ? 1 : 0 },
  ]

  const openEditWebsiteModal = (website: Website) => {
  setSelectedSiteId(website.id)

  setEditSiteName(website.name || "")
  setEditGa4PropertyId(website.ga4_property_id || "")
  setEditGscSiteUrl(website.gsc_site_url || "")

  setEditSiteMessage("")
  setShowEditSiteModal(true)
}
const openDeleteWebsiteModal = (website: Website) => {
  setSiteToDelete(website)
  setDeleteSiteMessage("")
  setShowDeleteSiteModal(true)
}
const handleUpdateWebsite = async () => {
  setEditSiteMessage("")

  if (selectedSiteId === null) {
    setEditSiteMessage("Aucun site sélectionné.")
    return
  }

  if (!editSiteName.trim()) {
    setEditSiteMessage("Le nom du site est obligatoire.")
    return
  }

  try {
    setEditSiteLoading(true)

    const response = await fetch(
      `http://127.0.0.1:8000/data/websites/${selectedSiteId}/`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
     },
        body: JSON.stringify({
          name: editSiteName.trim(),
          ga4_property_id: editGa4PropertyId.trim(),
          gsc_site_url: editGscSiteUrl.trim(),
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      setEditSiteMessage(
        data.error ||
          data.message ||
          "Impossible de modifier le site."
      )
      return
    }

    setEditSiteMessage("Site modifié avec succès.")

    await fetchWebsites()

    setTimeout(() => {
      setShowEditSiteModal(false)
      setSelectedSiteId(null)
      setEditSiteMessage("")
    }, 900)
  } catch {
    setEditSiteMessage("Erreur de connexion au serveur.")
  } finally {
    setEditSiteLoading(false)
  }
}

const handleDeleteWebsite = async () => {
  setDeleteSiteMessage("")

  if (!siteToDelete) {
    setDeleteSiteMessage("Aucun site sélectionné.")
    return
  }

  try {
    setDeleteSiteLoading(true)

    const response = await fetch(
      `http://127.0.0.1:8000/data/websites/${siteToDelete.id}/`,
      {
        method: "DELETE",
        credentials: "include",
      }
    )

    let data: any = {}

    try {
      data = await response.json()
    } catch {
      data = {}
    }

    if (!response.ok) {
      setDeleteSiteMessage(
        data.error ||
          data.message ||
          "Impossible de supprimer le site."
      )
      return
    }

    await fetchWebsites()

    setShowDeleteSiteModal(false)
    setSiteToDelete(null)
    setDeleteSiteMessage("")
  } catch {
    setDeleteSiteMessage("Erreur de connexion au serveur.")
  } finally {
    setDeleteSiteLoading(false)
  }
}

  return (
    <section className="relative px-4 py-6 text-[var(--dashboard-text)] md:px-6">
      {/* Background */}
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full blur-3xl"
        style={{
          background: "var(--brand-primary)",
          opacity: 0.16,
        }}
      />

      <div
        className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full blur-3xl"
        style={{
          background: "var(--brand-tertiary)",
          opacity: 0.12,
        }}
      />

      {/* Toast */}
      {toast && (
        <div
          className="fixed right-6 top-6 z-50 w-[360px] rounded-[26px] border p-4 shadow-2xl backdrop-blur-xl"
          style={{
            background:
              "color-mix(in srgb, var(--dashboard-card) 88%, transparent)",
            borderColor: "var(--dashboard-border)",
            boxShadow: "var(--dashboard-shadow)",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl"
              style={{
                background:
                  toast.type === "success"
                    ? "rgba(16,185,129,0.12)"
                    : toast.type === "warning"
                    ? "rgba(245,158,11,0.12)"
                    : "rgba(244,63,94,0.12)",
                color:
                  toast.type === "success"
                    ? "#34d399"
                    : toast.type === "warning"
                    ? "#fbbf24"
                    : "#fb7185",
              }}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
            </div>

            <div className="flex-1">
              <p className="text-sm font-black text-[var(--dashboard-text)]">
                {toast.type === "success"
                  ? "Action confirmée"
                  : toast.type === "warning"
                  ? "Information à vérifier"
                  : "Erreur détectée"}
              </p>

              <p className="mt-1 text-sm leading-5 text-[var(--dashboard-muted)]">
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setToast(null)}
              className="rounded-full p-1 transition hover:bg-white/10"
              style={{ color: "var(--dashboard-muted)" }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
<div
  className="mb-6 rounded-none border-0 p-0"
  style={{
    background: "transparent",
    borderColor: "transparent",
    boxShadow: "none",
  }}
>
  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
    <div>
      <p
        className="mb-4 text-[11px] font-black uppercase tracking-[0.22em]"
        style={{
          background: "transparent",
          borderColor: "transparent",
          color: "var(--dashboard-muted)",
        }}
      >
        Gestion des sites
      </p>

      <h1 className="text-[32px] font-black leading-none tracking-tight text-[var(--dashboard-text)]">
        Mes sites
      </h1>

      <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-[var(--dashboard-muted)]">
        Gérez les sites connectés, vérifiez leur configuration et choisissez le
        site actif pour l’analyse.
      </p>
    </div>

    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
          style={{ color: "var(--dashboard-muted)" }}
        />

        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher un site..."
          className="h-10 w-full rounded-xl border pl-10 pr-4 text-[13px] font-semibold outline-none sm:w-72"
          style={{
            background:
              "color-mix(in srgb, var(--dashboard-card-soft) 82%, transparent)",
            borderColor: "var(--dashboard-border)",
            color: "var(--dashboard-text)",
          }}
        />
      </div>

      <button
        type="button"
        onClick={fetchWebsites}
        className="flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-[13px] font-black transition hover:bg-white/5"
        style={{
          background:
            "color-mix(in srgb, var(--dashboard-card-soft) 78%, transparent)",
          borderColor: "var(--dashboard-border)",
          color: "var(--dashboard-text)",
        }}
      >
        <RefreshCw className="h-4 w-4" />
        Actualiser
      </button>

      <button
        type="button"
        onClick={() => {
          setAddSiteMessage("")
          setShowAddSiteModal(true)
        }}
        className="flex h-12 items-center justify-center gap-2 rounded-[18px] px-6 text-sm font-black text-white transition hover:opacity-90"
        style={{
          background: "var(--brand-gradient)",
          boxShadow:
            "0 18px 40px color-mix(in srgb, var(--brand-primary) 28%, transparent)",
        }}
      >
        <Plus className="h-4 w-4" />
        Ajouter
      </button>
    </div>
  </div>
</div>

{/* Résumé */}
<div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
  {[
    {
      label: "Sites ajoutés",
      value: websites.length,
      description: "Nombre total de sites enregistrés",
      color: "var(--brand-primary)",
      background:
        "var(--dashboard-card)",
    },
    {
      label: "Sites prêts",
      value: connectedCount,
      description: "Sites correctement configurés",
      color: "var(--brand-secondary)",
      background:
        "var(--dashboard-card)",
    },
    {
      label: "Site actif",
      value: activeWebsite?.name || "Aucun",
      description: "Site actuellement utilisé dans le dashboard",
      color: "var(--brand-tertiary)",
      background:
        "var(--dashboard-card)",
    },
  ].map((item) => {
    const isActiveCard = item.label === "Site actif"

    return (
      <div
        key={item.label}
        className={`relative overflow-hidden rounded-[18px] border px-4 py-3 transition hover:-translate-y-0.5 ${
          isActiveCard ? "sm:col-span-2 md:col-span-2" : ""
        }`}
        style={{
          background: item.background,
          borderColor: "var(--dashboard-border)",
          boxShadow:
            "0 10px 24px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -18px 34px rgba(15,23,42,0.035)",
        }}
      >
        <span
          className="absolute bottom-3 left-0 top-3 w-1 rounded-r-full"
          style={{ background: item.color }}
        />

        <div className="flex h-full items-center justify-between gap-4">
          <div className="min-w-0 pl-2">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
              {item.label}
            </p>

            <p className="mt-1 truncate text-xl font-black leading-none text-[var(--dashboard-text)]">
              {item.value}
            </p>
          </div>

          <div
            className={`grid shrink-0 place-items-center rounded-xl text-white ${
              isActiveCard ? "h-11 w-11" : "h-10 w-10"
            }`}
            style={{
              background:
                `linear-gradient(135deg, ${item.color}, color-mix(in srgb, ${item.color} 68%, var(--brand-tertiary)))`,
              color: "white",
              boxShadow:
                `0 12px 24px color-mix(in srgb, ${item.color} 28%, transparent)`,
            }}
          >
            {isActiveCard ? (
              <BarChart3 className="h-5 w-5" />
            ) : item.color === "var(--brand-secondary)" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Globe className="h-4 w-4" />
            )}
          </div>
        </div>
      </div>
    )
  })}
</div>

{/* Filtres */}
<div className="mb-7 flex flex-wrap items-center gap-2">
  {tabs.map((tab) => {
    const active = filter === tab.key

    return (
      <button
        key={tab.key}
        type="button"
        onClick={() => setFilter(tab.key as FilterType)}
        className="flex h-10 items-center gap-2 rounded-xl border px-4 text-[12px] font-black transition"
        style={{
          background: active ? "var(--brand-gradient)" : "var(--dashboard-card)",
          borderColor: active ? "transparent" : "var(--dashboard-border)",
          color: active ? "white" : "var(--dashboard-muted)",
          boxShadow: active
            ? "0 10px 22px color-mix(in srgb, var(--brand-primary) 20%, transparent)"
            : "none",
        }}
      >
        {tab.label}

        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-black"
          style={{
            background: active
              ? "rgba(255,255,255,0.22)"
              : "color-mix(in srgb, var(--dashboard-card-soft) 84%, transparent)",
            color: active ? "white" : "var(--dashboard-muted)",
          }}
        >
          {tab.count}
        </span>
      </button>
    )
  })}
</div>

        {/* Loading */}
        {loading && (
          <div
            className="mt-8 flex h-56 items-center justify-center rounded-[28px] border text-[var(--dashboard-muted)] backdrop-blur-xl"
            style={{
              background:
                "color-mix(in srgb, var(--dashboard-card) 82%, transparent)",
              borderColor: "var(--dashboard-border)",
              boxShadow: "var(--dashboard-shadow)",
            }}
          >
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Chargement des sites...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-8 flex items-center gap-3 rounded-[28px] border border-rose-500/20 bg-rose-500/10 p-5 text-rose-300">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filteredWebsites.length === 0 && (
          <div
            className="mt-8 rounded-[28px] border p-10 text-center text-[var(--dashboard-muted)] backdrop-blur-xl"
            style={{
              background:
                "color-mix(in srgb, var(--dashboard-card) 82%, transparent)",
              borderColor: "var(--dashboard-border)",
              boxShadow: "var(--dashboard-shadow)",
            }}
          >
            Aucun site ne correspond aux critères sélectionnés.
          </div>
        )}

        {/* Sites */}
        {!loading && !error && filteredWebsites.length > 0 && (
          <div className="mt-8 grid gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {filteredWebsites
  .filter((website) => {
    const status = getWebsiteStatus(website)
    return status.progress === 100
  })
  .map((website, index) => {
              const WebsiteIcon = getWebsiteIcon(website.name)
              const isSelected = String(website.id) === selectedWebsiteId
              const canImport = Boolean(
                website.ga4_property_id && website.gsc_site_url
              )
              const status = getWebsiteStatus(website)

              return (
                <article
                  key={website.id}
                  className="group relative overflow-visible rounded-[24px] border px-5 pb-5 pt-10 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background:
                      "linear-gradient(135deg, color-mix(in srgb, var(--dashboard-card) 92%, transparent), color-mix(in srgb, var(--dashboard-card-soft) 75%, transparent))",
                    borderColor: isSelected
                      ? "var(--brand-primary)"
                      : "var(--dashboard-border)",
                    boxShadow: isSelected
                      ? "0 24px 65px color-mix(in srgb, var(--brand-primary) 22%, transparent)"
                      : "var(--dashboard-shadow)",
                  }}
                >
                  {/* Floating icon */}
                  <div
                    className="absolute -top-6 left-6 flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg transition-transform duration-300 group-hover:scale-105"
                    style={{
                      background:
                        index % 3 === 0
                          ? "var(--brand-gradient)"
                          : index % 3 === 1
                          ? "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))"
                          : "linear-gradient(135deg, var(--brand-secondary), var(--brand-tertiary))",
                    }}
                  >
                    <WebsiteIcon className="h-6 w-6" />
                  </div>

                  {/* Active badge */}
                  {isSelected && (
                    <div
                      className="absolute right-5 top-3 rounded-full px-3 py-1 text-[10px] font-black text-white"
                      style={{ background: "var(--brand-gradient)" }}
                    >
                      Actif
                    </div>
                  )}

                  {/* Title + actions */}
<div className="min-h-[84px]">
  <div className="flex items-start justify-between gap-3">
    <div className="min-w-0 flex-1">
      <h3 className="line-clamp-1 text-[18px] font-black text-[var(--dashboard-text)]">
        {website.name}
      </h3>

      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--dashboard-muted)]">
        {getFriendlyDescription(website.name)}
      </p>
    </div>

    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={() => openEditWebsiteModal(website)}
        className="grid h-9 w-9 place-items-center rounded-xl border transition hover:-translate-y-0.5 hover:opacity-90"
        style={{
          background:
            "color-mix(in srgb, var(--brand-primary) 10%, var(--dashboard-card-soft))",
          borderColor:
            "color-mix(in srgb, var(--brand-primary) 20%, var(--dashboard-border))",
          color: "var(--brand-primary)",
        }}
        title="Modifier"
        aria-label={`Modifier ${website.name}`}
      >
        <Pencil className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => openDeleteWebsiteModal(website)}
        className="grid h-9 w-9 place-items-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 transition hover:-translate-y-0.5 hover:bg-red-500/15"
        title="Supprimer"
        aria-label={`Supprimer ${website.name}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  </div>
</div>

                  {/* Status */}
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span
                      className="rounded-full px-3 py-1 text-[10px] font-black"
                      style={{
                        background:
                          status.progress === 100
                            ? "rgba(16,185,129,0.12)"
                            : status.progress > 20
                            ? "rgba(245,158,11,0.12)"
                            : "rgba(244,63,94,0.12)",
                        color:
                          status.progress === 100
                            ? "#34d399"
                            : status.progress > 20
                            ? "#fbbf24"
                            : "#fb7185",
                        border:
                          status.progress === 100
                            ? "1px solid rgba(52,211,153,0.22)"
                            : status.progress > 20
                            ? "1px solid rgba(251,191,36,0.22)"
                            : "1px solid rgba(251,113,133,0.22)",
                      }}
                    >
                      {status.short}
                    </span>

                    <p className="truncate text-[10px] font-semibold text-[var(--dashboard-muted)]">
                      {status.label}
                    </p>
                  </div>

                  {/* Infos */}
                  <div
                    className="mt-5 space-y-3 border-t pt-5"
                    style={{ borderColor: "var(--dashboard-border)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-xl"
                        style={{
                          background:
                            "color-mix(in srgb, var(--brand-primary) 12%, transparent)",
                        }}
                      >
                        <BarChart3
                          className="h-4 w-4"
                          style={{ color: "var(--brand-primary)" }}
                        />
                      </div>

                      <div>
                        <p className="text-xs font-bold text-[var(--dashboard-muted)]">
                          Google Analytics
                        </p>

                        <p className="text-sm font-black text-[var(--dashboard-text)]">
                          {website.ga4_property_id
                            ? "Renseigné"
                            : "Non renseigné"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-xl"
                        style={{
                          background:
                            "color-mix(in srgb, var(--brand-tertiary) 12%, transparent)",
                        }}
                      >
                        <TrendingUp
                          className="h-4 w-4"
                          style={{ color: "var(--brand-tertiary)" }}
                        />
                      </div>

                      <div>
                        <p className="text-xs font-bold text-[var(--dashboard-muted)]">
                          Search Console
                        </p>

                        <p className="text-sm font-black text-[var(--dashboard-text)]">
                          {website.gsc_site_url ? "Renseigné" : "Non renseigné"}
                        </p>
                      </div>
                    </div>
                  </div>

                  

                  {/* Actions */}
                  <div className="mt-6 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => selectWebsite(website.id)}
                      className="rounded-2xl px-4 py-3 text-sm font-black transition hover:opacity-95"
                      style={{
                        background: isSelected
                          ? "var(--brand-gradient)"
                          : "color-mix(in srgb, var(--dashboard-card-soft) 86%, transparent)",
                        color: isSelected
                          ? "white"
                          : "var(--dashboard-text)",
                        border: isSelected
                          ? "none"
                          : "1px solid var(--dashboard-border)",
                      }}
                    >
                      {isSelected ? "Sélectionné" : "Sélectionner"}
                    </button>

                    <button
                      type="button"
                      onClick={() => importWebsiteData(website)}
                      disabled={!canImport || importingId === website.id}
                      className="rounded-2xl px-4 py-3 text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ background: "var(--brand-gradient)" }}
                    >
                      {importingId === website.id ? (
                        <span className="flex items-center justify-center gap-1">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Import
                        </span>
                      ) : !canImport ? (
                        "À compléter"
                      ) : (
                        "Importer"
                      )}
                    </button>
                  </div>

                  {/* External link */}
                  {website.gsc_site_url && (
                    <a
                      href={website.gsc_site_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-2 text-xs font-bold transition hover:opacity-100"
                      style={{
                        color: "var(--dashboard-muted)",
                      }}
                    >
                      Ouvrir le site
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </article>
              )
            })}
          </div>
        )}
            </div>

      {/* MODAL AJOUT SITE */}
{showAddSiteModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
    <div
      className="w-full max-w-[480px] rounded-[28px] border p-6"
      style={{
        background: "var(--dashboard-card)",
        borderColor: "var(--dashboard-border)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
      }}
    >
      {/* EN-TÊTE */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[23px] font-black text-[var(--dashboard-text)]">
            Ajouter un site
          </h2>

          <p className="mt-1 text-[13px] font-semibold text-[var(--dashboard-muted)]">
            Connecter un nouveau site à la plateforme.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowAddSiteModal(false)
            setAddSiteMessage("")
          }}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border transition hover:bg-white/5"
          style={{
            borderColor: "var(--dashboard-border)",
            color: "var(--dashboard-text)",
          }}
          aria-label="Fermer le formulaire"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* CHAMPS */}
      <div className="space-y-3">
        <input
  type="text"
  placeholder="Nom du site"
  value={siteName}
  onChange={(e) => setSiteName(e.target.value)}
  minLength={2}
  maxLength={20}
  required
  className="h-12 w-full rounded-[18px] border px-4 text-[14px] font-semibold outline-none transition focus:ring-2"
  style={{
    background: "var(--dashboard-card-soft)",
    borderColor: "var(--dashboard-border)",
    color: "var(--dashboard-text)",
  }}
/>

        <input
  type="text"
  inputMode="numeric"
  placeholder="identifiant GA4"
  value={ga4PropertyId}
  onChange={(e) => {
    const value = e.target.value
      .replace(/\D/g, "")
      .slice(0, 8)

    setGa4PropertyId(value)
  }}
  minLength={8}
  maxLength={8}
  required
  className="h-12 w-full rounded-[18px] border px-4 text-[14px] font-semibold outline-none transition focus:ring-2"
  style={{
    background: "var(--dashboard-card-soft)",
    borderColor: "var(--dashboard-border)",
    color: "var(--dashboard-text)",
  }}
/>

       <input
  type="url"
  placeholder="Exemple : https://example.com/"
  value={gscSiteUrl}
  onChange={(e) => setGscSiteUrl(e.target.value)}
  required
  className="h-12 w-full rounded-[18px] border px-4 text-[14px] font-semibold outline-none transition focus:ring-2"
  style={{
    background: "var(--dashboard-card-soft)",
    borderColor: "var(--dashboard-border)",
    color: "var(--dashboard-text)",
  }}
/>
      </div>

      {/* MESSAGE */}
      {addSiteMessage && (
        <p
          className="mt-4 text-[13px] font-bold"
          style={{
            color: addSiteMessage.toLowerCase().includes("succès")
              ? "#34d399"
              : "#f87171",
          }}
        >
          {addSiteMessage}
        </p>
      )}

      {/* BOUTONS */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            setShowAddSiteModal(false)
            setAddSiteMessage("")
          }}
          disabled={addSiteLoading}
          className="h-12 rounded-[18px] border text-[14px] font-black transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            borderColor: "var(--dashboard-border)",
            color: "var(--dashboard-text)",
          }}
        >
          Annuler
        </button>

        <button
          type="button"
          onClick={handleCreateWebsite}
          disabled={addSiteLoading}
          className="h-12 rounded-[18px] text-[14px] font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            background: "var(--brand-gradient)",
            boxShadow:
              "0 10px 24px color-mix(in srgb, var(--brand-primary) 24%, transparent)",
          }}
        >
          {addSiteLoading ? "Ajout..." : "Ajouter"}
        </button>
      </div>
    </div>
  </div>
)}
{/* MODAL MODIFICATION SITE */}
{showEditSiteModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
    <div
      className="w-full max-w-[480px] rounded-[28px] border p-6"
      style={{
        background: "var(--dashboard-card)",
        borderColor: "var(--dashboard-border)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
      }}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[23px] font-black text-[var(--dashboard-text)]">
            Modifier le site
          </h2>

          <p className="mt-1 text-[13px] font-semibold text-[var(--dashboard-muted)]">
            Modifiez les informations du site sélectionné.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowEditSiteModal(false)
            setSelectedSiteId(null)
            setEditSiteMessage("")
          }}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border transition hover:bg-white/5"
          style={{
            borderColor: "var(--dashboard-border)",
            color: "var(--dashboard-text)",
          }}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Nom du site"
          value={editSiteName}
          onChange={(e) => setEditSiteName(e.target.value)}
          className="h-12 w-full rounded-[18px] border px-4 text-[14px] font-semibold outline-none"
          style={{
            background: "var(--dashboard-card-soft)",
            borderColor: "var(--dashboard-border)",
            color: "var(--dashboard-text)",
          }}
        />

        <input
          type="text"
          placeholder="Identifiant GA4"
          value={editGa4PropertyId}
          onChange={(e) => setEditGa4PropertyId(e.target.value)}
          className="h-12 w-full rounded-[18px] border px-4 text-[14px] font-semibold outline-none"
          style={{
            background: "var(--dashboard-card-soft)",
            borderColor: "var(--dashboard-border)",
            color: "var(--dashboard-text)",
          }}
        />

        <input
          type="url"
          placeholder="URL Google Search Console"
          value={editGscSiteUrl}
          onChange={(e) => setEditGscSiteUrl(e.target.value)}
          className="h-12 w-full rounded-[18px] border px-4 text-[14px] font-semibold outline-none"
          style={{
            background: "var(--dashboard-card-soft)",
            borderColor: "var(--dashboard-border)",
            color: "var(--dashboard-text)",
          }}
        />
      </div>

      {editSiteMessage && (
        <p
          className="mt-4 text-[13px] font-bold"
          style={{
            color: editSiteMessage.toLowerCase().includes("succès")
              ? "#34d399"
              : "#f87171",
          }}
        >
          {editSiteMessage}
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            setShowEditSiteModal(false)
            setSelectedSiteId(null)
            setEditSiteMessage("")
          }}
          disabled={editSiteLoading}
          className="h-12 rounded-[18px] border text-[14px] font-black transition hover:bg-white/5 disabled:opacity-60"
          style={{
            borderColor: "var(--dashboard-border)",
            color: "var(--dashboard-text)",
          }}
        >
          Annuler
        </button>

        <button
          type="button"
          onClick={handleUpdateWebsite}
          disabled={editSiteLoading}
          className="h-12 rounded-[18px] text-[14px] font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            background: "var(--brand-gradient)",
          }}
        >
          {editSiteLoading ? "Modification..." : "Enregistrer"}
        </button>
      </div>
    </div>
  </div>
)}
{/* MODAL SUPPRESSION SITE */}
{showDeleteSiteModal && siteToDelete && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
    <div
      className="w-full max-w-[430px] rounded-[28px] border p-6"
      style={{
        background: "var(--dashboard-card)",
        borderColor: "rgba(239,68,68,0.22)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
      }}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-black text-[var(--dashboard-text)]">
            Supprimer le site
          </h2>

          <p className="mt-2 text-[13px] font-semibold leading-5 text-[var(--dashboard-muted)]">
            Voulez-vous vraiment supprimer{" "}
            <span className="font-black text-[var(--dashboard-text)]">
              {siteToDelete.name}
            </span>
            ?
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowDeleteSiteModal(false)
            setSiteToDelete(null)
            setDeleteSiteMessage("")
          }}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border transition hover:bg-white/5"
          style={{
            borderColor: "var(--dashboard-border)",
            color: "var(--dashboard-text)",
          }}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="rounded-[18px] border border-red-500/15 bg-red-500/10 p-4">
        <p className="text-[12px] font-bold leading-5 text-red-400">
          Cette action est définitive et supprimera le site de la plateforme.
        </p>
      </div>

      {deleteSiteMessage && (
        <p className="mt-4 text-[13px] font-bold text-red-400">
          {deleteSiteMessage}
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            setShowDeleteSiteModal(false)
            setSiteToDelete(null)
            setDeleteSiteMessage("")
          }}
          disabled={deleteSiteLoading}
          className="h-12 rounded-[18px] border text-[14px] font-black transition hover:bg-white/5 disabled:opacity-60"
          style={{
            borderColor: "var(--dashboard-border)",
            color: "var(--dashboard-text)",
          }}
        >
          Annuler
        </button>

        <button
          type="button"
          onClick={handleDeleteWebsite}
          disabled={deleteSiteLoading}
          className="h-12 rounded-[18px] bg-red-500 text-[14px] font-black text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {deleteSiteLoading ? "Suppression..." : "Supprimer"}
        </button>
      </div>
    </div>
  </div>
)}
</section>
)
}
