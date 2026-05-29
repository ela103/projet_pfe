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
      badge:
        "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
      message: "Les sources GA4 et Search Console sont bien renseignées.",
    }
  }

  if (hasGA4 || hasGSC) {
    return {
      label: hasGA4 ? "Search Console à compléter" : "GA4 à compléter",
      short: "Partiel",
      progress: 55,
      badge:
        "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20",
      message: "Une source est disponible, mais la configuration reste incomplète.",
    }
  }

  return {
    label: "Configuration à compléter",
    short: "Non configuré",
    progress: 12,
    badge:
      "bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20",
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

  useEffect(() => {
    const savedWebsiteId = localStorage.getItem("websiteId")
    if (savedWebsiteId) setSelectedWebsiteId(savedWebsiteId)

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

  const selectWebsite = (websiteId: number) => {
    const id = String(websiteId)
    setSelectedWebsiteId(id)
    localStorage.setItem("websiteId", id)

    setToast({
      type: "success",
      message: "Ce site est maintenant utilisé comme site actif dans le dashboard.",
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
      const isConnected = Boolean(website.ga4_property_id && website.gsc_site_url)

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
    { key: "connected", label: "Prêts", count: connectedCount },
    { key: "incomplete", label: "À compléter", count: incompleteCount },
    { key: "active", label: "Site actif", count: activeWebsite ? 1 : 0 },
  ]

  return (
    <section className="relative px-4 py-6 text-slate-900 dark:text-white md:px-6">
      {/* Background premium */}
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
          background: "var(--brand-accent)",
          opacity: 0.12,
        }}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed right-6 top-6 z-50 w-[360px] rounded-[28px] border border-black/5 bg-white/90 p-4 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#111827]/90">
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl ${
                toast.type === "success"
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : toast.type === "warning"
                  ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
                  : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
            </div>

            <div className="flex-1">
              <p className="text-sm font-black text-slate-900 dark:text-white">
                {toast.type === "success"
                  ? "Action confirmée"
                  : toast.type === "warning"
                  ? "Information à vérifier"
                  : "Erreur détectée"}
              </p>
              <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-white/55">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => setToast(null)}
              className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="relative mx-auto max-w-7xl">
        {/* Header luxe */}
        <div className="relative overflow-hidden rounded-[36px] border border-white/70 bg-white/80 p-7 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_24px_70px_rgba(0,0,0,0.35)] md:p-8">
          <div
            className="absolute -right-20 -top-20 h-56 w-56 rounded-full blur-3xl"
            style={{ background: "var(--brand-primary)", opacity: 0.16 }}
          />
          <div
            className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full blur-3xl"
            style={{ background: "var(--brand-accent)", opacity: 0.12 }}
          />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-4 py-2 text-xs font-bold text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white/55">
                <Globe className="h-4 w-4" style={{ color: "var(--brand-primary)" }} />
                Gestion des sites suivis
              </div>

              <h1 className="text-4xl font-black tracking-tight text-slate-950 dark:text-white">
                Mes sites
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-white/55">
                Retrouvez vos sites connectés, vérifiez leur configuration et choisissez
                celui qui alimentera les analyses du dashboard.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-white/40" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher un site..."
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white/80 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-transparent focus:ring-2 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35 sm:w-72"
                  style={{
                    boxShadow: "0 14px 32px rgba(15,23,42,0.06)",
                  }}
                />
              </div>

              <button
                onClick={fetchWebsites}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10"
              >
                <RefreshCw className="h-4 w-4" />
                Actualiser
              </button>

              <button
                 type="button"
                onClick={() => router.push("/devices/add")}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5"
                style={{
                background: "var(--brand-gradient)",
                boxShadow: "0 18px 34px rgba(15,23,42,0.18)",
          }}
>
  <Plus className="h-4 w-4" />
  Ajouter
</button>
            </div>
          </div>
        </div>

        {/* Résumé */}
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            { label: "Sites ajoutés", value: websites.length },
            { label: "Prêts", value: connectedCount },
            { label: "À compléter", value: incompleteCount },
            { label: "Site actif", value: activeWebsite?.name || "Aucun" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]"
            >
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-white/35">
                {item.label}
              </p>
              <p className="mt-3 truncate text-2xl font-black text-slate-950 dark:text-white">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="mt-6 flex flex-wrap gap-2 rounded-[28px] border border-white/70 bg-white/70 p-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as FilterType)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black transition ${
                filter === tab.key
                  ? "text-white shadow-lg"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white"
              }`}
              style={{
                background:
                  filter === tab.key ? "var(--brand-gradient)" : "transparent",
              }}
            >
              {tab.label}
              <span
                className={`rounded-xl px-2 py-0.5 text-xs ${
                  filter === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/50"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Contenu */}
        {loading && (
          <div className="mt-8 flex h-56 items-center justify-center rounded-[32px] border border-white/70 bg-white/80 text-slate-500 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Chargement des sites...
          </div>
        )}

        {error && (
          <div className="mt-8 flex items-center gap-3 rounded-[32px] border border-rose-100 bg-rose-50 p-5 text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}

        {!loading && !error && filteredWebsites.length === 0 && (
          <div className="mt-8 rounded-[32px] border border-white/70 bg-white/80 p-10 text-center text-slate-500 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55">
            Aucun site ne correspond aux critères sélectionnés.
          </div>
        )}

        {!loading && !error && filteredWebsites.length > 0 && (
          <div className="mt-10 grid gap-x-7 gap-y-12 md:grid-cols-2 xl:grid-cols-4">
            {filteredWebsites.map((website) => {
              const WebsiteIcon = getWebsiteIcon(website.name)
              const isSelected = String(website.id) === selectedWebsiteId
              const canImport = Boolean(
                website.ga4_property_id && website.gsc_site_url
              )
              const status = getWebsiteStatus(website)

              return (
  <article
    key={website.id}
    className={`group relative rounded-[30px] bg-white px-7 pb-6 pt-14 shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_65px_rgba(15,23,42,0.12)] dark:bg-white/[0.06] dark:shadow-[0_20px_60px_rgba(0,0,0,0.35)] ${
      isSelected
        ? "ring-2 ring-[var(--brand-primary)]"
        : "ring-1 ring-slate-100 dark:ring-white/10"
    }`}
  >
    {/* Bulle flottante */}
    <div
      className="absolute -top-7 left-8 flex h-16 w-16 items-center justify-center rounded-full text-white shadow-[0_16px_35px_rgba(15,23,42,0.18)] transition-transform duration-300 group-hover:scale-105"
      style={{
        background: "var(--brand-gradient)",
      }}
    >
      <WebsiteIcon className="h-8 w-8" />
    </div>

    {/* Badge actif */}
    {isSelected && (
      <div
        className="absolute right-5 top-5 rounded-full px-3 py-1 text-xs font-black text-white"
        style={{ background: "var(--brand-gradient)" }}
      >
        Actif
      </div>
    )}

    {/* Titre */}
    <div className="min-h-[88px]">
      <h3 className="line-clamp-1 text-xl font-black text-slate-900 dark:text-white">
        {website.name}
      </h3>

      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-white/50">
        {getFriendlyDescription(website.name)}
      </p>
    </div>

    {/* Infos principales */}
    <div className="mt-5 space-y-3 border-t border-slate-100 pt-5 dark:border-white/10">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 dark:bg-white/10">
          <BarChart3
            className="h-4 w-4"
            style={{ color: "var(--brand-primary)" }}
          />
        </div>

        <div>
          <p className="text-xs font-bold text-slate-400 dark:text-white/35">
            Google Analytics
          </p>
          <p className="text-sm font-black text-slate-800 dark:text-white">
            {website.ga4_property_id ? "Renseigné" : "Non renseigné"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 dark:bg-white/10">
          <TrendingUp
            className="h-4 w-4"
            style={{ color: "var(--brand-accent)" }}
          />
        </div>

        <div>
          <p className="text-xs font-bold text-slate-400 dark:text-white/35">
            Search Console
          </p>
          <p className="text-sm font-black text-slate-800 dark:text-white">
            {website.gsc_site_url ? "Renseigné" : "Non renseigné"}
          </p>
        </div>
      </div>
    </div>

    {/* Progression */}
    <div className="mt-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black text-slate-400 dark:text-white/35">
          Configuration
        </p>
        <p className="text-xs font-black text-slate-500 dark:text-white/50">
          {status.progress}%
        </p>
      </div>

      <div className="mt-2 h-2 rounded-full bg-slate-100 dark:bg-white/10">
        <div
          className="h-2 rounded-full"
          style={{
            width: `${status.progress}%`,
            background: "var(--brand-gradient)",
          }}
        />
      </div>
    </div>

    {/* Actions */}
    <div className="mt-6 grid grid-cols-2 gap-2">
      <button
        onClick={() => selectWebsite(website.id)}
        className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
          isSelected
            ? "text-white"
            : "bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/15"
        }`}
        style={{
          background: isSelected ? "var(--brand-gradient)" : undefined,
        }}
      >
        {isSelected ? "Sélectionné" : "Sélectionner"}
      </button>

      <button
        onClick={() => importWebsiteData(website)}
        disabled={!canImport || importingId === website.id}
        className="rounded-2xl px-4 py-3 text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        style={{
          background: "var(--brand-gradient)",
        }}
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

    {/* Lien externe */}
    {website.gsc_site_url && (
      <a
        href={website.gsc_site_url}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-slate-400 transition hover:text-slate-900 dark:text-white/35 dark:hover:text-white"
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
    </section>
  )
}