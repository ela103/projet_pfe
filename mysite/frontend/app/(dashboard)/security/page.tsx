"use client"

import { useEffect, useState } from "react"
import {
  BrainCircuit,
  LineChart,
  Lightbulb,
  Search,
  BarChart3,
  FileWarning,
  Sparkles,
  Loader2,
} from "lucide-react"

type AiTool = {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  question: string
}

export default function AIInsightsPage() {
  const [websiteId, setWebsiteId] = useState<string | null>(null)
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [answer, setAnswer] = useState("")
  const [intent, setIntent] = useState("")
  const [source, setSource] = useState("")
  const [usedRag, setUsedRag] = useState<boolean | null>(null)
  const [documentsCount, setDocumentsCount] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const storedWebsiteId =
      localStorage.getItem("websiteId") ||
      localStorage.getItem("selectedWebsiteId")

    if (storedWebsiteId) {
      setWebsiteId(storedWebsiteId)
    }
  }, [])

  const tools: AiTool[] = [
    {
      id: "global-analysis",
      title: "Analyse globale",
      description:
        "Analyse les KPI, le trafic, la visibilité SEO et les performances générales du site sélectionné.",
      icon: <Search className="h-8 w-8" />,
      color: "#3b82f6",
      question: "Donne-moi une analyse globale du site",
    },
    {
      id: "traffic-diagnosis",
      title: "Diagnostic trafic",
      description:
        "Identifie les causes possibles d’un trafic faible ou instable à partir des données disponibles.",
      icon: <LineChart className="h-8 w-8" />,
      color: "#ef4444",
      question: "Pourquoi mon trafic est faible ?",
    },
    {
      id: "recommendations",
      title: "Recommandations SEO",
      description:
        "Génère des actions prioritaires pour améliorer les clics, les impressions, le CTR et la visibilité.",
      icon: <Lightbulb className="h-8 w-8" />,
      color: "#f59e0b",
      question: "Donne-moi des recommandations SEO",
    },
    {
      id: "weak-pages",
      title: "Pages à améliorer",
      description:
        "Repère les pages qui nécessitent une optimisation prioritaire selon les données du site.",
      icon: <FileWarning className="h-8 w-8" />,
      color: "#22c55e",
      question: "Quelles sont les pages faibles ?",
    },
    {
      id: "ga-analysis",
      title: "Analyse Google Analytics",
      description:
        "Analyse les utilisateurs, sessions, pages vues, engagement et comportement des visiteurs.",
      icon: <BarChart3 className="h-8 w-8" />,
      color: "#8b5cf6",
      question: "Analyse les données Google Analytics",
    },
    {
      id: "gsc-analysis",
      title: "Analyse Search Console",
      description:
        "Explique les clics, impressions, CTR, position moyenne et opportunités SEO du site.",
      icon: <BrainCircuit className="h-8 w-8" />,
      color: "#06b6d4",
      question: "Analyse les données Search Console",
    },
  ]

  const runAiTool = async (tool: AiTool) => {
    try {
      setSelectedTool(tool.id)
      setLoading(true)
      setError("")
      setAnswer("")
      setIntent("")
      setSource("")
      setUsedRag(null)
      setDocumentsCount(0)

      const response = await fetch("http://127.0.0.1:8000/ai/chat/", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: tool.question,
          website_id: websiteId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l’appel IA.")
      }

      const result = data.response

      setAnswer(result.text || "Aucune réponse générée.")
      setIntent(result.intent || "")
      setSource(result.source || "unknown")
      setUsedRag(Boolean(result.used_rag))
      setDocumentsCount(Number(result.retrieved_documents_count || 0))
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="relative min-h-screen overflow-hidden p-6 text-[var(--dashboard-text)]">
      {/* Bulles arrière-plan */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-blob absolute left-[8%] top-[8%] h-56 w-56 rounded-full bg-[var(--brand-primary)]/20 blur-3xl" />
        <div className="animate-blob animation-delay-2000 absolute right-[10%] top-[18%] h-64 w-64 rounded-full bg-[var(--brand-secondary)]/20 blur-3xl" />
        <div className="animate-blob animation-delay-4000 absolute bottom-[10%] left-[35%] h-72 w-72 rounded-full bg-[var(--brand-tertiary)]/15 blur-3xl" />
      </div>

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--dashboard-muted)]">
              Intelligence artificielle
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight">
              AI Insights
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-semibold text-[var(--dashboard-muted)]">
              Analyse intelligente du trafic, du SEO et des performances du site
              sélectionné avec Gemini et RAG.
            </p>
          </div>

          <div
            className="inline-flex w-fit items-center gap-2 rounded-full border bg-[var(--dashboard-card)] px-4 py-2 text-xs font-black"
            style={{ borderColor: "var(--dashboard-border)" }}
          >
            <Sparkles className="h-4 w-4 text-[var(--brand-primary)]" />
            Gemini + RAG
          </div>
        </div>

        {!websiteId ? (
          <div
            className="rounded-[24px] border bg-[var(--dashboard-card)] p-5"
            style={{ borderColor: "var(--dashboard-border)" }}
          >
            <p className="text-sm font-bold text-[var(--dashboard-muted)]">
              Aucun site sélectionné. Sélectionnez d’abord un site depuis le
              dashboard.
            </p>
          </div>
        ) : null}

        {/* AI tools cards */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => runAiTool(tool)}
              className="group relative min-h-[210px] overflow-hidden rounded-[26px] border bg-[var(--dashboard-card)] p-6 text-left shadow-[var(--dashboard-shadow)] transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              style={{
                borderColor: "var(--dashboard-border)",
              }}
            >
              <div
                className="absolute left-0 top-0 h-full w-1.5 transition-all duration-300 group-hover:w-2"
                style={{ backgroundColor: tool.color }}
              />

              <div
                className="mb-8 inline-grid h-14 w-14 place-items-center rounded-2xl"
                style={{
                  backgroundColor: `color-mix(in srgb, ${tool.color} 16%, transparent)`,
                  color: tool.color,
                }}
              >
                {tool.icon}
              </div>

              <h2 className="text-xl font-black text-[var(--dashboard-text)]">
                {tool.title}
              </h2>

              <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-[var(--dashboard-muted)]">
                {tool.description}
              </p>

              {selectedTool === tool.id && loading ? (
                <div className="mt-5 flex items-center gap-2 text-xs font-bold text-[var(--dashboard-muted)]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyse en cours...
                </div>
              ) : null}
            </button>
          ))}
        </div>

        {/* Result */}
        <div
          className="rounded-[28px] border bg-[var(--dashboard-card)] p-6 shadow-[var(--dashboard-shadow)]"
          style={{ borderColor: "var(--dashboard-border)" }}
        >
          <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h3 className="text-lg font-black">Résultat IA</h3>
              <p className="mt-1 text-xs font-semibold text-[var(--dashboard-muted)]">
                La réponse générée s’affiche ici après le choix d’un outil.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {source ? (
                <span className="rounded-full bg-[var(--dashboard-card-soft)] px-3 py-1 text-[11px] font-black text-[var(--dashboard-muted)]">
                  Source : {source}
                </span>
              ) : null}

              {usedRag !== null ? (
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-black text-white"
                  style={{
                    background: usedRag
                      ? "var(--brand-gradient)"
                      : "var(--dashboard-muted)",
                  }}
                >
                  {usedRag ? "RAG activé" : "Sans RAG"}
                </span>
              ) : null}

              {documentsCount > 0 ? (
                <span className="rounded-full bg-[var(--dashboard-card-soft)] px-3 py-1 text-[11px] font-black text-[var(--dashboard-muted)]">
                  {documentsCount} document(s)
                </span>
              ) : null}
            </div>
          </div>

          {error ? (
            <p className="rounded-2xl bg-red-500/10 p-4 text-sm font-bold text-red-500">
              {error}
            </p>
          ) : answer ? (
            <div className="whitespace-pre-line rounded-2xl bg-[var(--dashboard-card-soft)] p-5 text-sm font-semibold leading-7 text-[var(--dashboard-text)]">
              {answer}
            </div>
          ) : (
            <div className="flex min-h-[180px] items-center justify-center rounded-2xl bg-[var(--dashboard-card-soft)] p-5">
              <p className="text-center text-sm font-bold text-[var(--dashboard-muted)]">
                Choisissez un outil IA pour générer une analyse.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}