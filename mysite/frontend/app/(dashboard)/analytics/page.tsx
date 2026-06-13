"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Activity,
  BarChart3,
  Clock,
  Eye,
  MousePointerClick,
  RefreshCw,
  Users,
} from "lucide-react"

type GAChartItem = {
  date?: string
  users?: number
  active_users?: number
  sessions?: number
  page_views?: number
  engaged_sessions?: number
  engagement_rate?: number
  average_session_duration?: number
  screen_page_views_per_user?: number
}

type GAEventItem = {
  date?: string
  page_path?: string
  event_name?: string
  event_count?: number
  users?: number
  event_count_per_user?: number
}

type StatsData = {
  ga_chart?: GAChartItem[]
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`min-w-0 overflow-hidden rounded-[24px] border bg-[var(--dashboard-card)] shadow-[var(--dashboard-shadow)] ${className}`}
      style={{ borderColor: "var(--dashboard-border)" }}
    >
      {children}
    </div>
  )
}

function SectionTitle({
  title,
  rightText,
}: {
  title: string
  rightText?: string
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-[14px] font-black text-[var(--dashboard-text)]">
        {title}
      </h3>

      {rightText ? (
        <span className="text-[10px] font-bold text-[var(--dashboard-muted)]">
          {rightText}
        </span>
      ) : null}
    </div>
  )
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value || 0)
}

function formatSeconds(value: number) {
  if (!value || value <= 0) return "0s"

  if (value < 60) return `${Math.round(value)}s`

  const minutes = Math.floor(value / 60)
  const seconds = Math.round(value % 60)

  return `${minutes}m ${seconds}s`
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  data,
  color,
  gradientId,
}: {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  data: { name: string; value: number }[]
  color: string
  gradientId: string
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--dashboard-muted)]">
            {title}
          </p>

          <h2 className="mt-2 text-[30px] font-black leading-none text-[var(--dashboard-text)]">
            {value}
          </h2>

          <p className="mt-2 text-[10px] font-semibold text-[var(--dashboard-muted)]">
            {subtitle}
          </p>
        </div>

        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl"
          style={{
            backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)`,
            color,
          }}
        >
          {icon}
        </div>
      </div>

      <div className="mt-3 h-[58px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>

            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2.2}
              fill={`url(#${gradientId})`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export default function AnalyticsPage() {
  const [websiteId, setWebsiteId] = useState<string | null>(null)

  const [statsData, setStatsData] = useState<StatsData | null>(null)
  const [eventsData, setEventsData] = useState<GAEventItem[]>([])

  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [appliedStartDate, setAppliedStartDate] = useState("")
  const [appliedEndDate, setAppliedEndDate] = useState("")

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

  useEffect(() => {
    if (!websiteId) return

    const fetchAnalyticsData = async () => {
      try {
        setLoading(true)
        setError("")

        const params = new URLSearchParams()
        params.append("website_id", websiteId)

        if (appliedStartDate) params.append("start_date", appliedStartDate)
        if (appliedEndDate) params.append("end_date", appliedEndDate)

        const statsResponse = await fetch(
          `http://127.0.0.1:8000/data/dashboard/stats-dw/?${params.toString()}`,
          {
            method: "GET",
            credentials: "include",
          }
        )

        const statsJson = await statsResponse.json()

        if (!statsResponse.ok) {
          throw new Error(
            statsJson.error || "Impossible de charger les données Google Analytics."
          )
        }

        setStatsData(statsJson)

        try {
          const eventsResponse = await fetch(
            `http://127.0.0.1:8000/data/dashboard/ga-events-dw/?${params.toString()}`,
            {
              method: "GET",
              credentials: "include",
            }
          )

          if (eventsResponse.ok) {
            const eventsJson = await eventsResponse.json()
            setEventsData(eventsJson.events || eventsJson.results || [])
          } else {
            setEventsData([])
          }
        } catch {
          setEventsData([])
        }
      } catch (err: any) {
        setError(err.message || "Une erreur est survenue.")
        setStatsData(null)
        setEventsData([])
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [websiteId, appliedStartDate, appliedEndDate])

  const gaChart = statsData?.ga_chart || []

const normalizePercent = (value: number) => {
  if (!value) return 0

  if (value <= 1) {
    return Math.round(value * 100)
  }

  return Math.round(value)
}


  const chartData = useMemo(() => {
    return gaChart.map((item) => ({
      name: item.date ? item.date.slice(5) : "",
      users: Number(item.users ?? item.active_users ?? 0),
      sessions: Number(item.sessions || 0),
      pageViews: Number(item.page_views || 0),
      engagementRate: normalizePercent(Number(item.engagement_rate || 0)),
      duration: Number(item.average_session_duration || 0),
      pagesPerUser: Number(item.screen_page_views_per_user || 0),
    }))
  }, [gaChart])

  const totalUsers = useMemo(() => {
    return gaChart.reduce(
      (acc, item) => acc + Number(item.users ?? item.active_users ?? 0),
      0
    )
  }, [gaChart])

  const totalSessions = useMemo(() => {
    return gaChart.reduce((acc, item) => acc + Number(item.sessions || 0), 0)
  }, [gaChart])

  const totalPageViews = useMemo(() => {
    return gaChart.reduce((acc, item) => acc + Number(item.page_views || 0), 0)
  }, [gaChart])

 const averageEngagementRate = useMemo(() => {
  const values = gaChart
    .map((item) => Number(item.engagement_rate || 0))
    .filter((value) => value > 0)

  if (values.length === 0) return 0

  const average =
    values.reduce((acc, value) => acc + normalizePercent(value), 0) /
    values.length

  return Math.round(average)
}, [gaChart])

  const averageDuration = useMemo(() => {
    const values = gaChart
      .map((item) => Number(item.average_session_duration || 0))
      .filter((value) => value > 0)

    if (values.length === 0) return 0

    return values.reduce((acc, value) => acc + value, 0) / values.length
  }, [gaChart])

  const pagesPerUser = useMemo(() => {
    if (totalUsers === 0) return 0
    return totalPageViews / totalUsers
  }, [totalUsers, totalPageViews])

  const miniUsers = chartData.map((item) => ({
    name: item.name,
    value: item.users,
  }))

  const miniSessions = chartData.map((item) => ({
    name: item.name,
    value: item.sessions,
  }))

  const miniPageViews = chartData.map((item) => ({
    name: item.name,
    value: item.pageViews,
  }))

  const miniEngagement = chartData.map((item) => ({
    name: item.name,
    value: item.engagementRate,
  }))

  const eventDistribution = useMemo(() => {
    const grouped: Record<string, number> = {}

    eventsData.forEach((event) => {
      const name = event.event_name || "unknown"
      grouped[name] = (grouped[name] || 0) + Number(event.event_count || 0)
    })

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [eventsData])

  const pagesEvents = useMemo(() => {
    const grouped: Record<
      string,
      {
        page: string
        page_view: number
        scroll: number
        user_engagement: number
        session_start: number
        first_visit: number
        total: number
      }
    > = {}

    eventsData.forEach((event) => {
      const page = event.page_path || "Page inconnue"
      const eventName = event.event_name || "unknown"
      const count = Number(event.event_count || 0)

      if (!grouped[page]) {
        grouped[page] = {
          page,
          page_view: 0,
          scroll: 0,
          user_engagement: 0,
          session_start: 0,
          first_visit: 0,
          total: 0,
        }
      }

     if (eventName === "page_view") {
  grouped[page].page_view += count
}

if (eventName === "scroll") {
  grouped[page].scroll += count
}

if (eventName === "user_engagement") {
  grouped[page].user_engagement += count
}

if (eventName === "session_start") {
  grouped[page].session_start += count
}

if (eventName === "first_visit") {
  grouped[page].first_visit += count
}

      grouped[page].total += count
    })

    return Object.values(grouped)
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
  }, [eventsData])

  const topPages = useMemo(() => {
    return pagesEvents.slice(0, 5)
  }, [pagesEvents])

  const handleApply = () => {
    setAppliedStartDate(startDate)
    setAppliedEndDate(endDate)
  }

  const handleReset = () => {
    setStartDate("")
    setEndDate("")
    setAppliedStartDate("")
    setAppliedEndDate("")
  }

  const hasData = chartData.length > 0

  const pieColors = [
    "var(--brand-primary)",
    "var(--brand-secondary)",
    "var(--brand-tertiary)",
    "#14b8a6",
    "#f97316",
    "#64748b",
  ]

  return (
    <div className="relative min-h-screen overflow-hidden p-6 text-[var(--dashboard-text)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-blob absolute left-[8%] top-[8%] h-56 w-56 rounded-full bg-[var(--brand-primary)]/20 blur-3xl" />
        <div className="animate-blob animation-delay-2000 absolute right-[10%] top-[18%] h-64 w-64 rounded-full bg-[var(--brand-secondary)]/20 blur-3xl" />
        <div className="animate-blob animation-delay-4000 absolute bottom-[10%] left-[35%] h-72 w-72 rounded-full bg-[var(--brand-tertiary)]/15 blur-3xl" />
      </div>

      <div className="relative z-10 space-y-6">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--dashboard-muted)]">
              Analyse GA4
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">
              Google Analytics
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-[var(--dashboard-muted)]">
              Analyse du trafic, des sessions, des pages vues et du comportement
              utilisateur.
            </p>
          </div>

          <Card className="p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[160px_160px_100px_90px] md:items-end">
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase text-[var(--dashboard-muted)]">
                  Start date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 w-full rounded-xl border bg-[var(--dashboard-card-soft)] px-3 text-[12px] font-semibold outline-none"
                  style={{ borderColor: "var(--dashboard-border)" }}
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase text-[var(--dashboard-muted)]">
                  End date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10 w-full rounded-xl border bg-[var(--dashboard-card-soft)] px-3 text-[12px] font-semibold outline-none"
                  style={{ borderColor: "var(--dashboard-border)" }}
                />
              </div>

              <button
                type="button"
                onClick={handleApply}
                className="h-10 rounded-xl text-[12px] font-black text-white transition hover:opacity-90"
                style={{ background: "var(--brand-gradient)" }}
              >
                Apply
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="h-10 rounded-xl border px-3 text-[12px] font-black text-[var(--dashboard-muted)] transition hover:text-[var(--dashboard-text)]"
                style={{ borderColor: "var(--dashboard-border)" }}
              >
                Reset
              </button>
            </div>
          </Card>
        </div>

        {error ? (
          <Card className="p-4">
            <p className="text-sm font-bold text-red-500">{error}</p>
          </Card>
        ) : null}

        {!websiteId ? (
          <Card className="p-6">
            <p className="text-sm font-bold text-[var(--dashboard-muted)]">
              Aucun site sélectionné. Sélectionnez un site depuis le dashboard.
            </p>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Utilisateurs actifs"
            value={loading ? "..." : formatNumber(totalUsers)}
            subtitle="Visiteurs actifs"
            icon={<Users className="h-5 w-5" />}
            data={miniUsers}
            color="var(--brand-primary)"
            gradientId="usersGradient"
          />

          <StatCard
            title="Sessions"
            value={loading ? "..." : formatNumber(totalSessions)}
            subtitle="Sessions enregistrées"
            icon={<Activity className="h-5 w-5" />}
            data={miniSessions}
            color="var(--brand-secondary)"
            gradientId="sessionsGradient"
          />

          <StatCard
            title="Pages vues"
            value={loading ? "..." : formatNumber(totalPageViews)}
            subtitle="Consultations de pages"
            icon={<Eye className="h-5 w-5" />}
            data={miniPageViews}
            color="var(--brand-tertiary)"
            gradientId="pageViewsGradient"
          />

          <StatCard
            title="Engagement"
            value={loading ? "..." : `${averageEngagementRate}%`}
            subtitle="Taux moyen"
            icon={<MousePointerClick className="h-5 w-5" />}
            data={miniEngagement}
            color="var(--brand-primary)"
            gradientId="engagementGradient"
          />
        </div>

        <Card className="p-5">
          <SectionTitle title="Évolution du trafic" rightText="GA4" />

          {!hasData ? (
            <div className="flex h-[300px] items-center justify-center">
              <p className="text-sm font-bold text-[var(--dashboard-muted)]">
                Aucune donnée Google Analytics disponible.
              </p>
            </div>
          ) : (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="sessionsMain" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="var(--brand-primary)"
                        stopOpacity={0.28}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--brand-primary)"
                        stopOpacity={0}
                      />
                    </linearGradient>

                    <linearGradient id="viewsMain" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="var(--brand-secondary)"
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--brand-secondary)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="var(--dashboard-line)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    tick={{ fill: "var(--dashboard-muted)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{ fill: "var(--dashboard-muted)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    contentStyle={{
                      background: "var(--dashboard-card)",
                      border: "1px solid var(--dashboard-border)",
                      borderRadius: "14px",
                      color: "var(--dashboard-text)",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="sessions"
                    name="Sessions"
                    stroke="var(--brand-primary)"
                    strokeWidth={2.5}
                    fill="url(#sessionsMain)"
                    dot={false}
                  />

                  <Area
                    type="monotone"
                    dataKey="users"
                    name="Utilisateurs"
                    stroke="var(--brand-tertiary)"
                    strokeWidth={2.5}
                    fill="transparent"
                    dot={false}
                  />

                  <Area
                    type="monotone"
                    dataKey="pageViews"
                    name="Pages vues"
                    stroke="var(--brand-secondary)"
                    strokeWidth={2.5}
                    fill="url(#viewsMain)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card className="p-5">
            <SectionTitle title="Qualité des sessions" rightText="Engagement" />

            <div className="mb-4 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-[var(--dashboard-card-soft)] p-3">
                <p className="text-[10px] font-bold text-[var(--dashboard-muted)]">
                  Engagement
                </p>
                <p className="mt-1 text-xl font-black">
                  {averageEngagementRate}%
                </p>
              </div>

              <div className="rounded-2xl bg-[var(--dashboard-card-soft)] p-3">
                <p className="text-[10px] font-bold text-[var(--dashboard-muted)]">
                  Durée
                </p>
                <p className="mt-1 text-xl font-black">
                  {formatSeconds(averageDuration)}
                </p>
              </div>

              <div className="rounded-2xl bg-[var(--dashboard-card-soft)] p-3">
                <p className="text-[10px] font-bold text-[var(--dashboard-muted)]">
                  Pages / user
                </p>
                <p className="mt-1 text-xl font-black">
                  {pagesPerUser.toFixed(1)}
                </p>
              </div>
            </div>

            <div className="h-[235px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid
                    stroke="var(--dashboard-line)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    tick={{ fill: "var(--dashboard-muted)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{ fill: "var(--dashboard-muted)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    contentStyle={{
                      background: "var(--dashboard-card)",
                      border: "1px solid var(--dashboard-border)",
                      borderRadius: "14px",
                      color: "var(--dashboard-text)",
                    }}
                  />

                  <Bar
                    dataKey="engagementRate"
                    name="Engagement %"
                    radius={[10, 10, 0, 0]}
                    fill="var(--brand-primary)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle title="Répartition des événements" rightText="GA4 Events" />

            {eventDistribution.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center">
                <p className="text-sm font-bold text-[var(--dashboard-muted)]">
                  Aucun événement disponible.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={eventDistribution}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={88}
                        paddingAngle={4}
                      >
                        {eventDistribution.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={pieColors[index % pieColors.length]}
                          />
                        ))}
                      </Pie>

                      <Tooltip
                        contentStyle={{
                          background: "var(--dashboard-card)",
                          border: "1px solid var(--dashboard-border)",
                          borderRadius: "14px",
                          color: "var(--dashboard-text)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {eventDistribution.map((event, index) => (
                    <div
                      key={event.name}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--dashboard-card-soft)] px-3 py-2"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor: pieColors[index % pieColors.length],
                          }}
                        />
                        <span className="truncate text-[12px] font-bold">
                          {event.name}
                        </span>
                      </div>

                      <span className="text-[12px] font-black">
                        {formatNumber(event.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        <Card className="p-5">
          <SectionTitle title="Pages les plus consultées" rightText="Top pages" />

          {topPages.length === 0 ? (
            <div className="flex h-[160px] items-center justify-center">
              <p className="text-sm font-bold text-[var(--dashboard-muted)]">
                Aucune donnée par page disponible.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {topPages.map((page) => {
                const maxTotal = Math.max(...topPages.map((p) => p.total), 1)
                const width = Math.max(8, Math.round((page.total / maxTotal) * 100))

                return (
                  <div key={page.page} className="min-w-0">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-black">
                          {page.page}
                        </p>
                        <p className="text-[10px] font-semibold text-[var(--dashboard-muted)]">
                          page_view : {page.page_view} · engagement :{" "}
                          {page.user_engagement} · scroll : {page.scroll}
                        </p>
                      </div>

                      <span className="shrink-0 text-[13px] font-black">
                        {formatNumber(page.total)}
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-[var(--dashboard-card-soft)]">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${width}%`,
                          background: "var(--brand-gradient)",
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <SectionTitle title="Comportement par page" rightText="Stacked events" />

          {pagesEvents.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center">
              <p className="text-sm font-bold text-[var(--dashboard-muted)]">
                Aucun comportement par page disponible.
              </p>
            </div>
          ) : (
            <div className="h-[330px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pagesEvents} layout="vertical">
                  <CartesianGrid
                    stroke="var(--dashboard-line)"
                    horizontal={false}
                  />

                  <XAxis
                    type="number"
                    tick={{ fill: "var(--dashboard-muted)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    type="category"
                    dataKey="page"
                    width={150}
                    tick={{ fill: "var(--dashboard-muted)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    contentStyle={{
                      background: "var(--dashboard-card)",
                      border: "1px solid var(--dashboard-border)",
                      borderRadius: "14px",
                      color: "var(--dashboard-text)",
                    }}
                  />

                  <Bar
                    dataKey="page_view"
                    name="page_view"
                    stackId="a"
                    fill="var(--brand-primary)"
                    radius={[8, 0, 0, 8]}
                  />

                  <Bar
                    dataKey="scroll"
                    name="scroll"
                    stackId="a"
                    fill="var(--brand-secondary)"
                  />

                  <Bar
                    dataKey="user_engagement"
                    name="user_engagement"
                    stackId="a"
                    fill="var(--brand-tertiary)"
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}