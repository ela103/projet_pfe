"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  CheckCircle2,
  Database,
  ExternalLink,
  Globe2,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react"

type Website = {
  id: number
  name: string
  ga4_property_id?: string | null
  gsc_site_url?: string | null
  created_at?: string
}

type ToastState = {
  type: "success" | "warning" | "error"
  message: string
} | null

function maskValue(value?: string | null) {
  if (!value) return "Non configure"
  const cleanValue = String(value).trim()
  if (cleanValue.length <= 4) return "••••"
  return `••••••${cleanValue.slice(-4)}`
}

function formatSiteUrl(value?: string | null) {
  if (!value) return "Non configure"

  try {
    const url = new URL(value)
    return url.hostname
  } catch {
    return value.replace(/^https?:\/\//, "").replace(/\/$/, "")
  }
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${
        active
          ? "bg-emerald-500/12 text-emerald-400"
          : "bg-rose-500/12 text-rose-400"
      }`}
    >
      {active ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <XCircle className="h-3.5 w-3.5" />
      )}
      {active ? "Connecte" : "Non configure"}
    </span>
  )
}

function ConnectionCard({
  title,
  description,
  active,
  detailLabel,
  detailValue,
  icon: Icon,
}: {
  title: string
  description: string
  active: boolean
  detailLabel: string
  detailValue: string
  icon: typeof Database
}) {
  return (
    <article
      className="rounded-[22px] border bg-[var(--dashboard-card)] p-4 shadow-[var(--dashboard-shadow)]"
      style={{ borderColor: "var(--dashboard-border)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white"
          style={{
            background: "var(--brand-primary)",
            boxShadow:
              "0 9px 20px color-mix(in srgb, var(--brand-primary) 18%, transparent)",
          }}
        >
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <StatusBadge active={active} />
      </div>

      <h2 className="mt-4 text-base font-black text-[var(--dashboard-text)]">
        {title}
      </h2>
      <p className="mt-2 text-[13px] font-semibold leading-6 text-[var(--dashboard-muted)]">
        {description}
      </p>

      <div
        className="mt-4 rounded-2xl border bg-[var(--dashboard-card-soft)] p-3"
        style={{
          borderColor: "var(--dashboard-border)",
        }}
      >
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
          {detailLabel}
        </p>
        <p className="mt-1 break-words text-[13px] font-black text-[var(--dashboard-text)]">
          {detailValue}
        </p>
      </div>
    </article>
  )
}

export default function ApiConnectionsPage() {
  const router = useRouter()
  const [websites, setWebsites] = useState<Website[]>([])
  const [selectedWebsiteId, setSelectedWebsiteId] = useState("")
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState("")
  const [toast, setToast] = useState<ToastState>(null)

  const fetchWebsites = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await fetch("http://127.0.0.1:8000/data/websites/", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || "Impossible de charger les sites.")
      }

      const list: Website[] = data.websites || []
      const storedId = localStorage.getItem("websiteId") || ""
      const nextSelectedId =
        storedId && list.some((site) => String(site.id) === storedId)
          ? storedId
          : String(list[0]?.id || "")

      setWebsites(list)
      setSelectedWebsiteId(nextSelectedId)

      if (nextSelectedId) {
        localStorage.setItem("websiteId", nextSelectedId)
      }
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Erreur de connexion au serveur.",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchWebsites()
  }, [])

  const selectedWebsite = useMemo(
    () => websites.find((site) => String(site.id) === selectedWebsiteId),
    [websites, selectedWebsiteId],
  )

  const gaConnected = Boolean(selectedWebsite?.ga4_property_id)
  const gscConnected = Boolean(selectedWebsite?.gsc_site_url)
  const canSync = Boolean(selectedWebsite && gaConnected && gscConnected)

  const handleSelectWebsite = (value: string) => {
    setSelectedWebsiteId(value)
    localStorage.setItem("websiteId", value)
    setToast(null)
  }

  const handleSync = async () => {
    if (!selectedWebsite) return

    if (!canSync) {
      setToast({
        type: "warning",
        message:
          "Ajoutez la configuration GA4 et Search Console avant de synchroniser.",
      })
      return
    }

    try {
      setSyncing(true)
      setToast(null)

      const response = await fetch(
        `http://127.0.0.1:8000/data/import/?website_id=${selectedWebsite.id}`,
        {
          method: "GET",
          credentials: "include",
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur pendant la synchronisation.")
      }

      const result = data.results?.[0]

      if (result?.status === "success") {
        setToast({
          type: "success",
          message: "Les donnees GA4 et Search Console ont ete synchronisees.",
        })
      } else if (result?.status === "skipped") {
        setToast({
          type: "warning",
          message: result.reason || "Synchronisation ignoree.",
        })
      } else if (result?.status === "error") {
        setToast({
          type: "error",
          message: result.error || "Erreur pendant la synchronisation.",
        })
      } else {
        setToast({
          type: "success",
          message: "Synchronisation terminee.",
        })
      }
    } catch (syncError) {
      setToast({
        type: "error",
        message:
          syncError instanceof Error
            ? syncError.message
            : "Impossible de contacter le serveur.",
      })
    } finally {
      setSyncing(false)
    }
  }

  const configuredSites = websites.filter(
    (site) => site.ga4_property_id && site.gsc_site_url,
  ).length

  return (
    <section className="relative min-h-screen overflow-hidden p-6 text-[var(--dashboard-text)]">
      <div className="relative z-10 space-y-6">
        <header className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--dashboard-muted)]">
              Parametres
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">
              Connexions API
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[var(--dashboard-muted)]">
              Verifiez les connexions Google Analytics 4, Search Console et la
              synchronisation des donnees sans exposer les identifiants
              sensibles.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => void fetchWebsites()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border bg-[var(--dashboard-card)] px-4 text-sm font-black text-[var(--dashboard-text)] transition hover:bg-[var(--dashboard-card-soft)]"
              style={{ borderColor: "var(--dashboard-border)" }}
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </button>

            <button
              type="button"
              onClick={() => router.push("/devices")}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black text-white transition hover:opacity-90"
              style={{ background: "var(--brand-gradient)" }}
            >
              Gerer les sites
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </header>

        {toast ? (
          <div
            className={`rounded-2xl border p-4 text-sm font-bold ${
              toast.type === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : toast.type === "warning"
                  ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
                  : "border-rose-500/20 bg-rose-500/10 text-rose-300"
            }`}
          >
            {toast.message}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <div
            className="rounded-[22px] border bg-[var(--dashboard-card)] p-5 shadow-[var(--dashboard-shadow)]"
            style={{ borderColor: "var(--dashboard-border)" }}
          >
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
              Sites
            </p>
            <p className="mt-2 text-3xl font-black">{websites.length}</p>
            <p className="mt-1 text-xs font-semibold text-[var(--dashboard-muted)]">
              Sites enregistres
            </p>
          </div>

          <div
            className="rounded-[22px] border bg-[var(--dashboard-card)] p-5 shadow-[var(--dashboard-shadow)]"
            style={{ borderColor: "var(--dashboard-border)" }}
          >
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
              Complets
            </p>
            <p className="mt-2 text-3xl font-black">{configuredSites}</p>
            <p className="mt-1 text-xs font-semibold text-[var(--dashboard-muted)]">
              GA4 et Search Console configures
            </p>
          </div>

          <div
            className="rounded-[22px] border bg-[var(--dashboard-card)] p-5 shadow-[var(--dashboard-shadow)]"
            style={{ borderColor: "var(--dashboard-border)" }}
          >
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
              Site actif
            </p>
            <p className="mt-2 truncate text-xl font-black">
              {selectedWebsite?.name || "Aucun"}
            </p>
            <p className="mt-1 text-xs font-semibold text-[var(--dashboard-muted)]">
              Utilise par le dashboard
            </p>
          </div>
        </div>

        <section
          className="rounded-[26px] border bg-[var(--dashboard-card)] p-5 shadow-[var(--dashboard-shadow)]"
          style={{ borderColor: "var(--dashboard-border)" }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-black">Site a verifier</h2>
              <p className="mt-1 text-sm font-semibold text-[var(--dashboard-muted)]">
                Selectionnez le site dont vous voulez verifier les connexions.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={selectedWebsiteId}
                onChange={(event) => handleSelectWebsite(event.target.value)}
                className="h-11 min-w-[260px] rounded-xl border bg-[var(--dashboard-card-soft)] px-4 text-sm font-bold text-[var(--dashboard-text)] outline-none"
                style={{ borderColor: "var(--dashboard-border)" }}
              >
                {loading ? (
                  <option>Chargement...</option>
                ) : websites.length === 0 ? (
                  <option>Aucun site</option>
                ) : (
                  websites.map((site) => (
                    <option key={site.id} value={String(site.id)}>
                      {site.name}
                    </option>
                  ))
                )}
              </select>

              <button
                type="button"
                onClick={() => void handleSync()}
                disabled={!canSync || syncing}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                style={{ background: "var(--brand-gradient)" }}
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Synchronisation..." : "Synchroniser"}
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-bold text-rose-300">
              {error}
            </div>
          ) : null}
        </section>

        <div className="grid gap-5 xl:grid-cols-3">
          <ConnectionCard
            title="Google Analytics 4"
            description="Connexion utilisee pour importer les sessions, utilisateurs, pages vues et donnees d'engagement."
            active={gaConnected}
            detailLabel="Identifiant masque"
            detailValue={maskValue(selectedWebsite?.ga4_property_id)}
            icon={Database}
          />

          <ConnectionCard
            title="Google Search Console"
            description="Connexion utilisee pour importer les clics, impressions, CTR, positions et requetes SEO."
            active={gscConnected}
            detailLabel="Propriete configuree"
            detailValue={formatSiteUrl(selectedWebsite?.gsc_site_url)}
            icon={Globe2}
          />

          <ConnectionCard
            title="Service Account Google"
            description="Authentification serveur utilisee pour lire les API Google sans exposer la cle JSON dans l'interface."
            active={canSync}
            detailLabel="Cle secrete"
            detailValue="Stockee cote backend"
            icon={KeyRound}
          />
        </div>

        <section
          className="rounded-[26px] border bg-[var(--dashboard-card)] p-5 shadow-[var(--dashboard-shadow)]"
          style={{ borderColor: "var(--dashboard-border)" }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white"
                style={{
                  background: "var(--brand-primary)",
                  boxShadow:
                    "0 8px 18px color-mix(in srgb, var(--brand-primary) 16%, transparent)",
                }}
              >
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-black">Securite des identifiants</h2>
                <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-[var(--dashboard-muted)]">
                  Les identifiants sensibles sont masques dans l'interface. La
                  configuration complete reste cote serveur et peut etre
                  modifiee depuis la gestion des sites.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push("/devices")}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black text-[var(--dashboard-text)] transition hover:bg-[var(--dashboard-card-soft)]"
              style={{ borderColor: "var(--dashboard-border)" }}
            >
              Ouvrir Mes sites
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
    </section>
  )
}
