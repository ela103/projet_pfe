"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Globe,
  Loader2,
  Plus,
  SearchCheck,
} from "lucide-react"

export default function AddWebsitePage() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [ga4PropertyId, setGa4PropertyId] = useState("")
  const [gscSiteUrl, setGscSiteUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanName = name.trim()

if (!cleanName) {
  setError("Le nom du site est obligatoire.")
  return
}

if (cleanName.length < 5) {
  setError("Le nom du site doit contenir au moins 2 caractères.")
  return
}

if (cleanName.length > 20) {
  setError("Le nom du site ne doit pas dépasser 20 caractères.")
  return
}

    const cleanPropertyId = ga4PropertyId.trim()

if (!cleanPropertyId) {
  setError("Le Property ID GA4 est obligatoire.")
  return
}

if (!/^\d{8}$/.test(cleanPropertyId)) {
  setError("Le Property ID GA4 doit contenir exactement 8 chiffres.")
  return
}
    const cleanGscUrl = gscSiteUrl.trim()

if (!cleanGscUrl) {
  setError("L’URL Google Search Console est obligatoire.")
  return
}

try {
  const parsedUrl = new URL(cleanGscUrl)

  if (parsedUrl.protocol !== "https:") {
    setError("L’URL Google Search Console doit commencer par https://")
    return
  }
} catch {
  setError("Veuillez saisir une URL Google Search Console valide.")
  return
}

    try {
      setLoading(true)
      setError("")
      setSuccess("")

      const response = await fetch("http://127.0.0.1:8000/data/websites/add/", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: cleanName,
          ga4_property_id: cleanPropertyId,
          gsc_site_url: cleanGscUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l’ajout du site.")
      }

      setSuccess("Site ajouté avec succès.")

      setTimeout(() => {
        router.push("/devices")
      }, 900)
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-6 text-[var(--dashboard-text)] md:px-6">
    <div className="mx-auto max-w-2xl">
        {/* bouton retour */}
        <button
          type="button"
          onClick={() => router.push("/devices")}
          className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-black transition hover:opacity-90"
          style={{
            background:
              "color-mix(in srgb, var(--dashboard-card) 86%, transparent)",
            borderColor: "var(--dashboard-border)",
            color: "var(--dashboard-muted)",
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux sites
        </button>

        {/* en-tête simple */}
        <div className="mb-6">
          <div
            className="mb-3 grid h-14 w-14 place-items-center rounded-2xl text-white"
            style={{
              background: "var(--brand-gradient)",
              boxShadow:
                "0 12px 28px color-mix(in srgb, var(--brand-primary) 24%, transparent)",
            }}
          >
            <Globe className="h-6 w-6" />
          </div>

          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--dashboard-muted)]">
            Nouveau site
          </p>

          <h1 className="mt-2 text-[34px] font-black leading-tight text-[var(--dashboard-text)]">
            Ajouter un site
          </h1>

          <p className="mt-2 max-w-2xl text-[13px] font-semibold leading-6 text-[var(--dashboard-muted)]">
            Renseignez uniquement les informations essentielles pour connecter
            un nouveau site à Google Analytics 4 et Google Search Console.
          </p>
        </div>

        {/* formulaire seul */}
        <form
          onSubmit={handleSubmit}
          className="rounded-[28px] border p-6 md:p-7"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--dashboard-card) 92%, transparent), color-mix(in srgb, var(--dashboard-card-soft) 76%, transparent))",
            borderColor: "var(--dashboard-border)",
            boxShadow:
              "0 18px 42px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <div className="mb-6">
            <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[var(--dashboard-muted)]">
              Informations du site
            </p>
            <h2 className="mt-2 text-[24px] font-black text-[var(--dashboard-text)]">
              Configuration Google
            </h2>
            <p className="mt-1 text-[12px] font-semibold text-[var(--dashboard-muted)]">
              Remplissez les champs ci-dessous pour enregistrer le site.
            </p>
          </div>

          <div className="space-y-5">
            {/* nom */}
            <div>
              <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
                Nom du site
              </label>

              <div className="relative">
                <Globe
                  className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: "var(--dashboard-muted)" }}
                />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Exemple : Travel Agency"
                  minLength={5}
                  maxLength={20}
                  required
                  className="h-13 w-full rounded-2xl border pl-11 pr-4 text-[14px] font-bold outline-none transition"
                  style={{
                    height: "52px",
                    background:
                      "color-mix(in srgb, var(--dashboard-card-soft) 82%, transparent)",
                    borderColor: name
                      ? "var(--brand-primary)"
                      : "var(--dashboard-border)",
                    color: "var(--dashboard-text)",
                  }}
                />
              </div>
            </div>

            {/* ga4 */}
            <div>
              <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
                GA4 Property ID
              </label>

              <div className="relative">
                <BarChart3
                  className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: "var(--dashboard-muted)" }}
                />
                <input
  type="text"
  inputMode="numeric"
  value={ga4PropertyId}
  onChange={(e) => {
    const value = e.target.value
      .replace(/\D/g, "")
      .slice(0, 8)

    setGa4PropertyId(value)
  }}
  placeholder="Exemple : 12345678"
  minLength={8}
  maxLength={8}
  required
                  className="w-full rounded-2xl border pl-11 pr-4 text-[14px] font-bold outline-none transition"
                  style={{
                    height: "52px",
                    background:
                      "color-mix(in srgb, var(--dashboard-card-soft) 82%, transparent)",
                    borderColor: ga4PropertyId
                      ? "var(--brand-secondary)"
                      : "var(--dashboard-border)",
                    color: "var(--dashboard-text)",
                  }}
                />
              </div>
            </div>

            {/* gsc */}
            <div>
              <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
                URL Google Search Console
              </label>

              <div className="relative">
                <SearchCheck
                  className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: "var(--dashboard-muted)" }}
                />
                <input
  type="url"
  value={gscSiteUrl}
  onChange={(e) => setGscSiteUrl(e.target.value)}
  placeholder="Exemple : https://example.com/"
  required
  className="w-full rounded-2xl border pl-11 pr-4 text-[14px] font-bold outline-none transition"
  style={{
    height: "52px",
    background:
      "color-mix(in srgb, var(--dashboard-card-soft) 82%, transparent)",
    borderColor: gscSiteUrl
      ? "var(--brand-tertiary)"
      : "var(--dashboard-border)",
    color: "var(--dashboard-text)",
  }}
/>
              </div>
            </div>

            {/* messages */}
            {error ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] font-bold text-red-400">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-[13px] font-bold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                {success}
              </div>
            ) : null}

            {/* boutons */}
            <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => router.push("/devices")}
                className="h-12 rounded-2xl border text-[14px] font-black transition hover:opacity-90"
                style={{
                  borderColor: "var(--dashboard-border)",
                  color: "var(--dashboard-text)",
                  background:
                    "color-mix(in srgb, var(--dashboard-card-soft) 76%, transparent)",
                }}
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl text-[14px] font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: "var(--brand-gradient)",
                  boxShadow:
                    "0 14px 30px color-mix(in srgb, var(--brand-primary) 24%, transparent)",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Ajout en cours...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Ajouter le site
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}