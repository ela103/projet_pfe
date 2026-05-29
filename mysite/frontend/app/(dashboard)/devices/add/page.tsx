"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

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

    if (!name.trim()) {
      setError("Le nom du site est obligatoire.")
      return
    }

    try {
      setLoading(true)
      setError("")
      setSuccess("")

      const response = await fetch("http://127.0.0.1:8000/data/websites/", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          ga4_property_id: ga4PropertyId,
          gsc_site_url: gscSiteUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l’ajout du site.")
      }

      setSuccess("Site ajouté avec succès.")

      setTimeout(() => {
        router.push("/devices")
      }, 800)
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)] p-6 text-[var(--dashboard-text)]">
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={() => router.push("/devices")}
          className="mb-6 flex items-center gap-2 text-sm font-bold text-[var(--dashboard-muted)] transition hover:text-[var(--dashboard-text)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux sites
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-black">Ajouter un site</h1>
          <p className="mt-1 text-sm font-semibold text-[var(--dashboard-muted)]">
            Ajoutez un nouveau site à analyser avec Google Analytics et Search Console.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[26px] border bg-[var(--dashboard-card)] p-6 shadow-[var(--dashboard-shadow)]"
          style={{ borderColor: "var(--dashboard-border)" }}
        >
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-[var(--dashboard-muted)]">
                Nom du site
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Exemple : Travel Agency"
                className="h-11 w-full rounded-xl border bg-[var(--dashboard-card-soft)] px-4 text-sm font-semibold text-[var(--dashboard-text)] outline-none"
                style={{ borderColor: "var(--dashboard-border)" }}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-[var(--dashboard-muted)]">
                GA4 Property ID
              </label>
              <input
                type="text"
                value={ga4PropertyId}
                onChange={(e) => setGa4PropertyId(e.target.value)}
                placeholder="Exemple : 123456789"
                className="h-11 w-full rounded-xl border bg-[var(--dashboard-card-soft)] px-4 text-sm font-semibold text-[var(--dashboard-text)] outline-none"
                style={{ borderColor: "var(--dashboard-border)" }}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-[var(--dashboard-muted)]">
                URL Google Search Console
              </label>
              <input
                type="url"
                value={gscSiteUrl}
                onChange={(e) => setGscSiteUrl(e.target.value)}
                placeholder="Exemple : https://example.com/"
                className="h-11 w-full rounded-xl border bg-[var(--dashboard-card-soft)] px-4 text-sm font-semibold text-[var(--dashboard-text)] outline-none"
                style={{ borderColor: "var(--dashboard-border)" }}
              />
            </div>

            {error ? (
              <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="rounded-xl bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-500">
                {success}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-xl text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: "var(--brand-gradient)" }}
            >
              {loading ? "Ajout en cours..." : "Ajouter le site"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}