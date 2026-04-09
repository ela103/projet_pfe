"use client"

import { useEffect, useState } from "react"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

type ChartItem = {
  date: string
  users: number
  sessions: number
  pageViews: number
}

type GscPieItem = {
  name: string
  value: number
}

type EventItem = {
  page: string
  event: string
  value: number
}

type EventChartItem = {
  page: string
  page_view: number
  scroll: number
  user_engagement: number
}

type SeoPageItem = {
  url: string
  seo_score: number
  title: string
  issues: string[]
  recommendations: string[]
}

type SeoResponse = {
  site_score: number
  total_pages: number
  pages: SeoPageItem[]
}

const PIE_COLORS = ["#6D4DFF", "#FF7A00", "#FF3D71", "#00C49F", "#0088FE"]

function getSeoScoreBadge(score: number) {
  if (score >= 90) return "bg-green-100 text-green-700"
  if (score >= 70) return "bg-orange-100 text-orange-700"
  return "bg-red-100 text-red-700"
}

function getSeoBarColor(score: number) {
  if (score >= 90) return "bg-green-500"
  if (score >= 70) return "bg-orange-500"
  return "bg-red-500"
}

function getPriorityLabel(score: number, issuesCount: number) {
  if (score < 60 || issuesCount >= 4) {
    return {
      label: "Priorité haute",
      className: "bg-red-100 text-red-700",
    }
  }

  if (score < 80 || issuesCount >= 2) {
    return {
      label: "Priorité moyenne",
      className: "bg-orange-100 text-orange-700",
    }
  }

  return {
    label: "Priorité faible",
    className: "bg-green-100 text-green-700",
  }
}

export default function StatisticsPage() {
  const [data, setData] = useState<ChartItem[]>([])
  const [gscData, setGscData] = useState<GscPieItem[]>([])
  const [eventsData, setEventsData] = useState<EventItem[]>([])
  const [eventsChartData, setEventsChartData] = useState<EventChartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [analysisResult, setAnalysisResult] = useState("")
  const [recommendationsResult, setRecommendationsResult] = useState("")
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [recommendationsLoading, setRecommendationsLoading] = useState(false)

  const [seoData, setSeoData] = useState<SeoResponse | null>(null)
  const [seoUrl, setSeoUrl] = useState("")
  const [seoLoading, setSeoLoading] = useState(false)
  const [seoMessage, setSeoMessage] = useState("")
  const [seoError, setSeoError] = useState("")
  const [seoInsight, setSeoInsight] = useState<any>(null)

  const aiBusy = analysisLoading || recommendationsLoading
  const WEBSITE_ID = 1

  const fetchSeoData = async () => {
    try {
      setSeoError("")
      const response = await fetch(
        `http://127.0.0.1:8000/data/scraped-pages/?website_id=${WEBSITE_ID}`,
        {
          method: "GET",
          credentials: "include",
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Impossible de charger les données SEO.")
      }

      setSeoData(result)
    } catch (err: any) {
      setSeoError(err.message || "Erreur lors du chargement SEO.")
    }
  }

  const fetchSeoInsight = async () => {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/gemini/seo-global-insight/?website_id=${WEBSITE_ID}`,
        {
          method: "GET",
          credentials: "include",
        }
      )

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || "Erreur SEO Insight")
      }

      setSeoInsight(json)
    } catch (err) {
      console.error("Erreur SEO Insight :", err)
    }
  }

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        const [gaResponse, gscResponse, eventsResponse] = await Promise.all([
          fetch("http://127.0.0.1:8000/data/dashboard/stats/", {
            method: "GET",
            credentials: "include",
          }),
          fetch("http://127.0.0.1:8000/data/dashboard/gsc-pages/", {
            method: "GET",
            credentials: "include",
          }),
          fetch("http://127.0.0.1:8000/data/dashboard/ga-events/", {
            method: "GET",
            credentials: "include",
          }),
        ])

        const gaJson = await gaResponse.json()
        const gscJson = await gscResponse.json()
        const eventsJson = await eventsResponse.json()

        if (!gaResponse.ok) {
          throw new Error("Impossible de charger les statistiques GA.")
        }

        if (!gscResponse.ok) {
          throw new Error("Impossible de charger les statistiques GSC.")
        }

        if (!eventsResponse.ok) {
          throw new Error("Impossible de charger les statistiques GA Events.")
        }

        const formattedGa = (gaJson.ga_chart || []).map((item: any) => ({
          date: item.date,
          users: item.users,
          sessions: item.sessions,
          pageViews: item.page_views,
        }))

        const formattedGsc = (gscJson.pages || []).map((item: any) => ({
          name: item.page,
          value: item.total_clicks,
        }))

        const rawEvents: EventItem[] = (eventsJson.events || []).map((item: any) => ({
          page: item.page_path,
          event: item.event_name,
          value: item.event_count,
        }))

        const groupedEvents: Record<string, EventChartItem> = {}

        rawEvents.forEach((item) => {
          if (!groupedEvents[item.page]) {
            groupedEvents[item.page] = {
              page: item.page,
              page_view: 0,
              scroll: 0,
              user_engagement: 0,
            }
          }

          if (item.event === "page_view") {
            groupedEvents[item.page].page_view += item.value
          } else if (item.event === "scroll") {
            groupedEvents[item.page].scroll += item.value
          } else if (item.event === "user_engagement") {
            groupedEvents[item.page].user_engagement += item.value
          }
        })

        setData(formattedGa)
        setGscData(formattedGsc)
        setEventsData(rawEvents)
        setEventsChartData(Object.values(groupedEvents))
      } catch (err: any) {
        setError(err.message || "Erreur lors du chargement.")
      } finally {
        setLoading(false)
      }
    }

    fetchAllStats()
    fetchSeoData()
    fetchSeoInsight()
  }, [])

  const callGemini = async (mode: "analysis" | "recommendations") => {
    if (aiBusy) return

    try {
      setError("")

      if (mode === "analysis") {
        setAnalysisLoading(true)
        setAnalysisResult("")
      } else {
        setRecommendationsLoading(true)
        setRecommendationsResult("")
      }

      const response = await fetch("http://127.0.0.1:8000/api/gemini/analyze/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          chartData: data,
          gscData: gscData,
          eventsData: eventsData,
          mode: mode,
        }),
      })

      const text = await response.text()

      let result: any = {}
      try {
        result = JSON.parse(text)
      } catch {
        throw new Error("La réponse du serveur n’est pas un JSON valide.")
      }

      if (!response.ok) {
        throw new Error(result.message || `Erreur HTTP ${response.status}`)
      }

      if (mode === "analysis") {
        setAnalysisResult(result.analysis || "Analyse terminée.")
      } else {
        setRecommendationsResult(
          result.recommendations || "Recommandations générées."
        )
      }
    } catch (err: any) {
      const message = err.message || "Erreur AI."
      if (mode === "analysis") {
        setAnalysisResult(message)
      } else {
        setRecommendationsResult(message)
      }
    } finally {
      if (mode === "analysis") {
        setAnalysisLoading(false)
      } else {
        setRecommendationsLoading(false)
      }
    }
  }

  const handleSeoCrawl = async () => {
    if (!seoUrl.trim()) {
      setSeoMessage("")
      setSeoError("Veuillez saisir une URL.")
      return
    }

    try {
      setSeoLoading(true)
      setSeoMessage("")
      setSeoError("")

      const response = await fetch("http://127.0.0.1:8000/data/crawl-website/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          website_id: WEBSITE_ID,
          start_url: seoUrl,
          max_pages: 10,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors du crawl SEO.")
      }

      setSeoMessage("Analyse SEO terminée avec succès.")
      await fetchSeoData()
      await fetchSeoInsight()
    } catch (err: any) {
      setSeoError(err.message || "Erreur lors du crawl SEO.")
    } finally {
      setSeoLoading(false)
    }
  }

  const criticalSeoPages = seoData?.pages
    ? [...seoData.pages]
        .sort((a, b) => {
          if (a.seo_score !== b.seo_score) {
            return a.seo_score - b.seo_score
          }
          return b.issues.length - a.issues.length
        })
        .slice(0, 3)
    : []

  const remainingSeoPages = seoData?.pages
    ? seoData.pages.filter(
        (page) =>
          !criticalSeoPages.some(
            (criticalPage) => criticalPage.url === page.url
          )
      )
    : []

  return (
    <section className="rounded-2xl bg-card p-6 md:p-8 shadow-sm ring-1 ring-border">
      <div>
        <h1 className="text-balance text-2xl font-semibold text-foreground">
          Statistics
        </h1>

        <p className="mt-2 text-muted-foreground">
          Daily website statistics from Google Analytics, Google Search Console and GA events.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => callGemini("analysis")}
            disabled={aiBusy}
            className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {analysisLoading ? "Analyse..." : "Analyse AI"}
          </button>

          <button
            onClick={() => callGemini("recommendations")}
            disabled={aiBusy}
            className="rounded-xl bg-green-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {recommendationsLoading ? "Chargement..." : "Recommandations"}
          </button>

          <button
            onClick={() => {
              setAnalysisResult("TEST AI OK 🔥")
              setRecommendationsResult("")
            }}
            className="rounded-xl bg-red-500 px-4 py-2 text-sm text-white"
          >
            Test AI
          </button>
        </div>

        {(analysisLoading || analysisResult) && (
          <div className="mt-6 rounded-xl bg-background p-4 ring-1 ring-border">
            <h2 className="text-lg font-semibold text-foreground">AI Analysis</h2>

            {analysisLoading ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Analyse en cours...
              </p>
            ) : (
              <p className="mt-2 whitespace-pre-line text-muted-foreground">
                {analysisResult}
              </p>
            )}
          </div>
        )}

        {(recommendationsLoading || recommendationsResult) && (
          <div className="mt-6 rounded-xl bg-background p-4 ring-1 ring-border">
            <h2 className="text-lg font-semibold text-foreground">AI Recommendations</h2>

            {recommendationsLoading ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Chargement des recommandations...
              </p>
            ) : (
              <p className="mt-2 whitespace-pre-line text-muted-foreground">
                {recommendationsResult}
              </p>
            )}
          </div>
        )}
      </div>

      {loading && (
        <p className="mt-6 text-muted-foreground">Chargement des statistiques...</p>
      )}

      {error && <p className="mt-6 text-red-500">{error}</p>}

      {!loading && !error && (
        <>
          <div className="mt-6 h-80 w-full rounded-xl bg-background p-4 ring-1 ring-border">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Google Analytics
            </h2>

            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barCategoryGap={18}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Legend />
                <Bar dataKey="users" fill="#6D4DFF" radius={[6, 6, 0, 0]} />
                <Bar dataKey="sessions" fill="#FF7A00" radius={[6, 6, 0, 0]} />
                <Bar dataKey="pageViews" fill="#FF3D71" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 h-80 w-full rounded-xl bg-background p-4 ring-1 ring-border">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              GSC Click Distribution by Page
            </h2>

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gscData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  label
                >
                  {gscData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 h-80 w-full rounded-xl bg-background p-4 ring-1 ring-border">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              GA Events by Page
            </h2>

            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventsChartData} barCategoryGap={18}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="page" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Legend />
                <Bar dataKey="page_view" fill="#6D4DFF" radius={[6, 6, 0, 0]} />
                <Bar dataKey="scroll" fill="#FF7A00" radius={[6, 6, 0, 0]} />
                <Bar dataKey="user_engagement" fill="#FF3D71" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <div className="mt-10 rounded-2xl bg-background p-6 ring-1 ring-border">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              SEO Crawling & Audit
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Lance une analyse SEO automatique du site et affiche les pages auditées.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            placeholder="https://example.com"
            value={seoUrl}
            onChange={(e) => setSeoUrl(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none ring-0"
          />

          <button
            onClick={handleSeoCrawl}
            disabled={seoLoading}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {seoLoading ? "Analyse..." : "Analyser"}
          </button>
        </div>

        {seoMessage && (
          <p className="mt-4 text-sm text-green-600">{seoMessage}</p>
        )}

        {seoError && (
          <p className="mt-4 text-sm text-red-500">{seoError}</p>
        )}

        {seoData && (
          <>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-card p-4 ring-1 ring-border">
                <p className="text-sm text-muted-foreground">Score global SEO</p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {seoData.site_score}
                </p>
              </div>

              <div className="rounded-xl bg-card p-4 ring-1 ring-border">
                <p className="text-sm text-muted-foreground">Pages auditées</p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {seoData.total_pages}
                </p>
              </div>
            </div>

          {seoInsight && (
  <div className="mt-8 rounded-xl bg-card p-5 ring-1 ring-border">
    <h3 className="text-lg font-semibold text-foreground">
      SEO Global Insight (AI)
    </h3>

    <div className="mt-4 space-y-2 text-sm text-muted-foreground">
      <p>
        <strong>Total problèmes :</strong> {seoInsight.total_issues}
      </p>

      <p>
        <strong>Problème dominant :</strong>{" "}
        {seoInsight.most_common_issue || "N/A"}
      </p>

      <p>
        <strong>Source :</strong> {seoInsight.source}
      </p>
    </div>

    {seoInsight.top_recommendations?.length > 0 && (
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-foreground">
          Actions prioritaires globales
        </h4>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {seoInsight.top_recommendations.map((rec: string, idx: number) => (
            <li key={idx}>{rec}</li>
          ))}
        </ul>
      </div>
    )}

    <div className="mt-4 whitespace-pre-line text-sm text-foreground">
      {seoInsight.ai_summary}
    </div>
  </div>
)}

            {criticalSeoPages.length > 0 && (
              <div className="mt-8 rounded-xl bg-card p-5 ring-1 ring-border">
                <h3 className="text-lg font-semibold text-foreground">
                  Top pages critiques
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pages à corriger en priorité pour améliorer le score global du site.
                </p>

                <div className="mt-5 grid gap-4">
                  {criticalSeoPages.map((page, index) => {
                    const priority = getPriorityLabel(page.seo_score, page.issues.length)

                    return (
                      <div
                        key={index}
                        className="rounded-xl border border-border bg-background p-4"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <h4 className="text-base font-semibold text-foreground">
                              {page.title || "Sans titre"}
                            </h4>
                            <p className="mt-1 break-all text-sm text-muted-foreground">
                              {page.url}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getSeoScoreBadge(page.seo_score)}`}
                            >
                              Score : {page.seo_score}
                            </span>

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${priority.className}`}
                            >
                              {priority.label}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 h-2 w-full rounded-full bg-gray-200">
                          <div
                            className={`h-2 rounded-full ${getSeoBarColor(page.seo_score)}`}
                            style={{ width: `${page.seo_score}%` }}
                          />
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              Problèmes détectés ({page.issues.length})
                            </p>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                              {page.issues.slice(0, 3).map((issue, idx) => (
                                <li key={idx}>{issue}</li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              Action prioritaire
                            </p>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                              {page.recommendations.slice(0, 2).map((rec, idx) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {remainingSeoPages.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-foreground">
                  Autres pages auditées
                </h3>

                <div className="mt-4 grid gap-4">
                  {remainingSeoPages.map((page, index) => {
                    const priority = getPriorityLabel(page.seo_score, page.issues.length)

                    return (
                      <div
                        key={index}
                        className="rounded-xl bg-card p-5 ring-1 ring-border"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <h3 className="text-lg font-semibold text-foreground">
                              {page.title || "Sans titre"}
                            </h3>
                            <p className="mt-1 break-all text-sm text-muted-foreground">
                              {page.url}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getSeoScoreBadge(page.seo_score)}`}
                            >
                              Score SEO : {page.seo_score}
                            </span>

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${priority.className}`}
                            >
                              {priority.label}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 h-2 w-full rounded-full bg-gray-200">
                          <div
                            className={`h-2 rounded-full ${getSeoBarColor(page.seo_score)}`}
                            style={{ width: `${page.seo_score}%` }}
                          />
                        </div>

                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                          <div>
                            <h4 className="text-sm font-semibold text-foreground">
                              Problèmes détectés
                            </h4>
                            {page.issues?.length > 0 ? (
                              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                                {page.issues.map((issue, idx) => (
                                  <li key={idx}>{issue}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="mt-2 text-sm text-muted-foreground">
                                Aucun problème détecté.
                              </p>
                            )}
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-foreground">
                              Recommandations
                            </h4>
                            {page.recommendations?.length > 0 ? (
                              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                                {page.recommendations.map((rec, idx) => (
                                  <li key={idx}>{rec}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="mt-2 text-sm text-muted-foreground">
                                Aucune recommandation.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}