"use client"

import { useEffect, useState,useRef} from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Bot,
  Gauge,
  Loader2,
  RotateCcw,
  Sparkles,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

type Period = "all" | "month" | "week" | "day"

type AIScorePage = {
  page: string
  score: number
  level: string
  priority: string
  diagnosis: string
}

type AIScoreData = {
  website: {
    id: number
    name: string
  }
  site_score: {
    global_score: number
    level: string
    priority: string
    global_diagnosis: string
  }
  pages: AIScorePage[]
}

const toolConfig: Record<
  string,
  {
    title: string
    subtitle: string
    question: string
  }
> = {
  "global-analysis": {
    title: "Analyse globale",
    subtitle: "Analyse complète des performances du site sélectionné.",
    question: "Donne-moi une analyse globale du site",
  },
  "traffic-diagnosis": {
    title: "Diagnostic trafic",
    subtitle: "Identification des causes possibles d’un trafic faible.",
    question: "Pourquoi mon trafic est faible ?",
  },
  "ai-score": {
    title: "Score IA",
    subtitle:
      "Évaluation intelligente du site et des pages à partir des données GA4 et Search Console.",
    question: "Génère le score IA du site",
  },
  recommendations: {
    title: "Recommandations SEO",
    subtitle: "Actions prioritaires pour améliorer la performance SEO.",
    question: "Donne-moi des recommandations SEO",
  },
  "weak-pages": {
    title: "Pages à améliorer",
    subtitle: "Détection des pages faibles ou prioritaires.",
    question: "Quelles sont les pages faibles ?",
  },
  "ga-analysis": {
    title: "Analyse Google Analytics",
    subtitle: "Analyse des utilisateurs, sessions et engagement.",
    question: "Analyse Google Analytics",
  },
  "gsc-analysis": {
    title: "Analyse Search Console",
    subtitle: "Analyse des clics, impressions, CTR et positions.",
    question: "Analyse Search Console",
  },
}

const periods = [
  { label: "Mois", value: "month" as const },
  { label: "Semaine", value: "week" as const },
  { label: "Jour", value: "day" as const },
]

function formatLabel(value?: string) {
  if (!value) return "Non défini"
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function getScoreColor(score: number) {
  if (score >= 75) return "#22c55e"
  if (score >= 55) return "#14b8a6"
  if (score >= 35) return "#f59e0b"
  return "#ef4444"
}

function AIInsightTimeFilter({
  value,
  onChange,
  onAnalyze,
  loading,
}: {
  value: Period
  onChange: (value: Period) => void
  onAnalyze: () => void
  loading: boolean
}) {
  return (
    <div
      className="flex flex-col gap-3 rounded-[24px] border bg-[var(--dashboard-card)] p-4 shadow-[var(--dashboard-shadow)] md:flex-row md:items-center md:justify-between"
      style={{ borderColor: "var(--dashboard-border)" }}
    >
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--dashboard-muted)]">
          Période d’analyse
        </p>
        <p className="mt-1 text-xs font-semibold text-[var(--dashboard-muted)]">
          Choisissez la période utilisée pour générer l’analyse IA.
        </p>
      </div>

      <div
        className="flex w-fit items-center gap-2 rounded-2xl border bg-[var(--dashboard-card-soft)] p-1"
        style={{ borderColor: "var(--dashboard-border)" }}
      >
        <button
          type="button"
          title="Réinitialiser le filtre"
          onClick={() => onChange("all")}
          className={`grid h-10 w-10 place-items-center rounded-xl text-sm font-black transition ${
            value === "all"
              ? "bg-[var(--brand-primary)] text-white shadow-lg"
              : "text-[var(--dashboard-muted)] hover:bg-white/10"
          }`}
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        {periods.map((period) => (
          <button
            key={period.value}
            type="button"
            onClick={() => onChange(period.value)}
            className={`rounded-xl px-4 py-2 text-sm font-black transition ${
              value === period.value
                ? "bg-[var(--brand-primary)] text-white shadow-lg"
                : "text-[var(--dashboard-muted)] hover:bg-white/10"
            }`}
          >
            {period.label}
          </button>
        ))}
        <button
  type="button"
  onClick={onAnalyze}
  disabled={loading}
  className="rounded-xl bg-[var(--brand-primary)] px-5 py-2 text-sm font-black text-white shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
>
  {loading ? "Analyse..." : "Analyser"}
</button>
      </div>
    </div>
  )
}

export default function AIInsightToolContent({ tool }: { tool: string }) {
  const lastRequestKeyRef = useRef("")
  const router = useRouter()
  const config = toolConfig[tool]

  const [period, setPeriod] = useState<Period>("all")
const [appliedPeriod, setAppliedPeriod] = useState<Period>("all")
const [refreshKey, setRefreshKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [responseText, setResponseText] = useState("")
  const [aiScoreData, setAiScoreData] = useState<AIScoreData | null>(null)
  const [error, setError] = useState("")
  const [source, setSource] = useState("")
  const [usedRag, setUsedRag] = useState(false)
  const [documentsCount, setDocumentsCount] = useState(0)

  useEffect(() => {
    if (!config) {
      setLoading(false)
      setError("Outil IA introuvable.")
      return
    }

    const fetchAIResponse = async () => {
      try {
        setLoading(true)
        setError("")
        setResponseText("")
        setAiScoreData(null)

        const websiteId =
          localStorage.getItem("websiteId") ||
          localStorage.getItem("selectedWebsiteId")

        if (!websiteId) {
          throw new Error("Aucun site sélectionné.")
        }
        const requestKey = `${tool}-${websiteId}-${appliedPeriod}-${refreshKey}`

if (lastRequestKeyRef.current === requestKey) {
  return
}

lastRequestKeyRef.current = requestKey

        if (tool === "ai-score") {
          const response = await fetch(
            `http://127.0.0.1:8000/api/gemini/score/?website_id=${websiteId}&period=${period}`,
            {
              method: "GET",
              credentials: "include",
            }
          )

          const data = await response.json()

          if (!response.ok || data.success === false) {
            throw new Error(data.error || "Erreur lors du calcul du Score IA.")
          }

          setAiScoreData(data.data)
          setSource("gemini")
          setUsedRag(true)
          setDocumentsCount(data.data?.pages?.length || 0)
          return
        }

        const response = await fetch("http://127.0.0.1:8000/ai/chat/", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
         body: JSON.stringify({
         question: config.question,
         website_id: websiteId,
         period: appliedPeriod,
       }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Erreur lors de l’analyse IA.")
        }

        const result = data.response

        setResponseText(result.text || "Aucune réponse générée.")
        setSource(result.source || "unknown")
        setUsedRag(Boolean(result.used_rag))
        setDocumentsCount(Number(result.retrieved_documents_count || 0))
      } catch (err: any) {
        setError(err.message || "Une erreur est survenue.")
      } finally {
        setLoading(false)
      }
    }

    fetchAIResponse()
  }, [tool, appliedPeriod, refreshKey])

  if (!config) {
    return (
      <div className="p-6 text-[var(--dashboard-text)]">
        <h1 className="text-2xl font-black">Outil IA introuvable</h1>
      </div>
    )
  }

  return (
    <section className="relative min-h-screen overflow-hidden p-6 text-[var(--dashboard-text)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-blob absolute left-[8%] top-[8%] h-56 w-56 rounded-full bg-[var(--brand-primary)]/20 blur-3xl" />
        <div className="animate-blob animation-delay-2000 absolute right-[10%] top-[18%] h-64 w-64 rounded-full bg-[var(--brand-secondary)]/20 blur-3xl" />
        <div className="animate-blob animation-delay-4000 absolute bottom-[10%] left-[35%] h-72 w-72 rounded-full bg-[var(--brand-tertiary)]/15 blur-3xl" />
      </div>

      <div className="relative z-10 space-y-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--dashboard-muted)] transition hover:text-[var(--dashboard-text)]"
        >
          <ArrowLeft className="h-4 w-4" />
          {tool === "recommendations"
          ? "Retour"
          : "Retour aux outils IA"}
        </button>

        <div
          className="rounded-[28px] border bg-[var(--dashboard-card)] p-6 shadow-[var(--dashboard-shadow)]"
          style={{ borderColor: "var(--dashboard-border)" }}
        >
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--dashboard-muted)]">
                AI Insights
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight">
                {config.title}
              </h1>

              <p className="mt-2 max-w-2xl text-sm font-semibold text-[var(--dashboard-muted)]">
                {config.subtitle}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black text-white"
                style={{ background: "var(--brand-gradient)" }}
              >
                <Sparkles className="h-4 w-4" />
                Gemini
              </span>

              <span className="rounded-full bg-[var(--dashboard-card-soft)] px-4 py-2 text-xs font-black text-[var(--dashboard-muted)]">
                {usedRag ? "RAG activé" : "Sans RAG"}
              </span>

              <span className="rounded-full bg-[var(--dashboard-card-soft)] px-4 py-2 text-xs font-black text-[var(--dashboard-muted)]">
                Documents : {documentsCount}
              </span>

              {source ? (
                <span className="rounded-full bg-[var(--dashboard-card-soft)] px-4 py-2 text-xs font-black text-[var(--dashboard-muted)]">
                  Source : {source}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <AIInsightTimeFilter
  value={period}
  onChange={setPeriod}
  loading={loading}
  onAnalyze={() => {
    setAppliedPeriod(period)
    setRefreshKey((prev) => prev + 1)
  }}
/>

        <div
          className="rounded-[28px] border bg-[var(--dashboard-card)] p-6 shadow-[var(--dashboard-shadow)]"
          style={{ borderColor: "var(--dashboard-border)" }}
        >
          <div className="mb-5 flex items-center gap-3">
            <div
              className="grid h-11 w-11 place-items-center rounded-2xl text-white"
              style={{ background: "var(--brand-gradient)" }}
            >
              {tool === "ai-score" ? (
                <Gauge className="h-5 w-5" />
              ) : (
                <Bot className="h-5 w-5" />
              )}
            </div>

            <div>
              <h2 className="text-lg font-black">
                {tool === "ai-score" ? "Résultat du Score IA" : "Réponse générée"}
              </h2>
              <p className="text-xs font-semibold text-[var(--dashboard-muted)]">
                Question envoyée : {config.question}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[260px] items-center justify-center">
              <div className="flex items-center gap-3 rounded-2xl bg-[var(--dashboard-card-soft)] px-5 py-4">
                <Loader2 className="h-5 w-5 animate-spin text-[var(--brand-primary)]" />
                <span className="text-sm font-bold text-[var(--dashboard-muted)]">
                  Génération de l’analyse IA...
                </span>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-2xl bg-red-500/10 p-4 text-sm font-bold text-red-500">
              {error}
            </div>
          ) : tool === "ai-score" && aiScoreData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[320px_1fr]">
                <div className="rounded-[26px] bg-[var(--dashboard-card-soft)] p-6">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--dashboard-muted)]">
                    Score global
                  </p>

                  <div className="mt-5 flex items-end gap-2">
                    <span
                      className="text-6xl font-black"
                      style={{
                        color: getScoreColor(
                          Number(aiScoreData.site_score.global_score || 0)
                        ),
                      }}
                    >
                      {Math.round(aiScoreData.site_score.global_score)}
                    </span>
                    <span className="pb-2 text-lg font-black text-[var(--dashboard-muted)]">
                      /100
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-black">
                      Niveau : {formatLabel(aiScoreData.site_score.level)}
                    </span>
                    <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-black">
                      Priorité : {formatLabel(aiScoreData.site_score.priority)}
                    </span>
                  </div>
                </div>

                <div className="rounded-[26px] bg-[var(--dashboard-card-soft)] p-6">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--dashboard-muted)]">
                    Diagnostic global
                  </p>

                  <p className="mt-4 text-sm font-semibold leading-7 text-[var(--dashboard-text)]">
                    {aiScoreData.site_score.global_diagnosis}
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black">Scores par page</h3>
                    <p className="text-xs font-semibold text-[var(--dashboard-muted)]">
                      Pages analysées : {aiScoreData.pages.length}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {aiScoreData.pages.map((page) => (
                    <div
                      key={page.page}
                      className="rounded-[24px] border bg-[var(--dashboard-card-soft)] p-5"
                      style={{ borderColor: "var(--dashboard-border)" }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">
                            {page.page}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-[var(--dashboard-muted)]">
                            Niveau : {formatLabel(page.level)} · Priorité :{" "}
                            {formatLabel(page.priority)}
                          </p>
                        </div>

                        <div
                          className="shrink-0 rounded-2xl px-4 py-2 text-lg font-black text-white"
                          style={{
                            backgroundColor: getScoreColor(Number(page.score || 0)),
                          }}
                        >
                          {Math.round(page.score)}
                        </div>
                      </div>

                      <p className="mt-4 text-sm font-semibold leading-6 text-[var(--dashboard-muted)]">
                        {page.diagnosis}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-[var(--dashboard-card-soft)] p-5 text-[var(--dashboard-text)]">
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      h1: ({ children }) => (
        <h1 className="mb-4 mt-6 text-2xl font-black first:mt-0">
          {children}
        </h1>
      ),

      h2: ({ children }) => (
        <h2 className="mb-3 mt-6 text-xl font-black first:mt-0">
          {children}
        </h2>
      ),

      h3: ({ children }) => (
        <h3 className="mb-3 mt-5 text-base font-black first:mt-0">
          {children}
        </h3>
      ),

      p: ({ children }) => (
        <p className="mb-4 text-sm font-semibold leading-7 last:mb-0">
          {children}
        </p>
      ),

      strong: ({ children }) => (
        <strong className="font-black text-[var(--brand-primary)]">
          {children}
        </strong>
      ),

      ul: ({ children }) => (
        <ul className="mb-4 ml-6 list-disc space-y-2">
          {children}
        </ul>
      ),

      ol: ({ children }) => (
        <ol className="mb-4 ml-6 list-decimal space-y-2">
          {children}
        </ol>
      ),

      li: ({ children }) => (
        <li className="text-sm font-semibold leading-7">
          {children}
        </li>
      ),

      blockquote: ({ children }) => (
        <blockquote className="my-4 border-l-4 border-[var(--brand-primary)] pl-4 text-[var(--dashboard-muted)]">
          {children}
        </blockquote>
      ),

      hr: () => (
        <hr className="my-6 border-[var(--dashboard-border)]" />
      ),
    }}
  >
    {responseText.replace(/\\n/g, "\n").trim()}
  </ReactMarkdown>
</div>
          )}
        </div>
      </div>
    </section>
  )
}