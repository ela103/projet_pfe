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

const PIE_COLORS = ["#6D4DFF", "#FF7A00", "#FF3D71", "#00C49F", "#0088FE"]

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

  const aiBusy = analysisLoading || recommendationsLoading

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
      console.log("Réponse brute AI =", text)

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
    </section>
  )
}