"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Eye, MousePointerClick, Percent, Search, TrendingUp } from "lucide-react"

type GSCChartItem = {
  date?: string
  clicks?: number
  impressions?: number
  ctr?: number
  position?: number
}

type TopPage = {
  page: string
  total_clicks: number
  total_impressions: number
  avg_position?: number
}

type TopKeyword = {
  query: string
  total_clicks: number
  total_impressions: number
  avg_position?: number
}

type StatsData = {
  gsc_chart?: GSCChartItem[]
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

function normalizePercent(value: number) {
  if (!value) return 0
  if (value <= 1) return value * 100
  return value
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

export default function SearchConsolePage() {
  const [websiteId, setWebsiteId] = useState<string | null>(null)

  const [statsData, setStatsData] = useState<StatsData | null>(null)
  const [topPages, setTopPages] = useState<TopPage[]>([])
  const [topKeywords, setTopKeywords] = useState<TopKeyword[]>([])

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

    const fetchGscData = async () => {
      try {
        setLoading(true)
        setError("")

        const params = new URLSearchParams()
        params.append("website_id", websiteId)

        if (appliedStartDate) params.append("start_date", appliedStartDate)
        if (appliedEndDate) params.append("end_date", appliedEndDate)

        const statsResponse = await fetch(
          `http://127.0.0.1:8000/data/dashboard/stats/?${params.toString()}`,
          {
            method: "GET",
            credentials: "include",
          }
        )

        const statsJson = await statsResponse.json()

        if (!statsResponse.ok) {
          throw new Error(
            statsJson.error || "Impossible de charger les données Search Console."
          )
        }

        setStatsData(statsJson)

        const pagesResponse = await fetch(
          `http://127.0.0.1:8000/data/top-pages/?${params.toString()}`,
          {
            method: "GET",
            credentials: "include",
          }
        )

        if (pagesResponse.ok) {
          const pagesJson = await pagesResponse.json()
          setTopPages(pagesJson.pages || pagesJson.results || [])
        } else {
          setTopPages([])
        }

        const keywordsResponse = await fetch(
          `http://127.0.0.1:8000/data/top-keywords/?${params.toString()}`,
          {
            method: "GET",
            credentials: "include",
          }
        )

        if (keywordsResponse.ok) {
          const keywordsJson = await keywordsResponse.json()
          setTopKeywords(keywordsJson.keywords || keywordsJson.results || [])
        } else {
          setTopKeywords([])
        }
      } catch (err: any) {
        setError(err.message || "Une erreur est survenue.")
        setStatsData(null)
        setTopPages([])
        setTopKeywords([])
      } finally {
        setLoading(false)
      }
    }

    fetchGscData()
  }, [websiteId, appliedStartDate, appliedEndDate])

  const gscChart = statsData?.gsc_chart || []

  const chartData = useMemo(() => {
    return gscChart.map((item) => ({
      name: item.date ? item.date.slice(5) : "",
      clicks: Number(item.clicks || 0),
      impressions: Number(item.impressions || 0),
      ctr: normalizePercent(Number(item.ctr || 0)),
      position: Number(item.position || 0),
    }))
  }, [gscChart])

  const totalClicks = useMemo(() => {
    return gscChart.reduce((acc, item) => acc + Number(item.clicks || 0), 0)
  }, [gscChart])

  const totalImpressions = useMemo(() => {
    return gscChart.reduce((acc, item) => acc + Number(item.impressions || 0), 0)
  }, [gscChart])

  const averageCtr = useMemo(() => {
    if (totalImpressions === 0) return 0
    return (totalClicks / totalImpressions) * 100
  }, [totalClicks, totalImpressions])

  const averagePosition = useMemo(() => {
    const values = gscChart
      .map((item) => Number(item.position || 0))
      .filter((value) => value > 0)

    if (values.length === 0) return 0

    return values.reduce((acc, value) => acc + value, 0) / values.length
  }, [gscChart])

  const miniClicks = chartData.map((item) => ({
    name: item.name,
    value: item.clicks,
  }))

  const miniImpressions = chartData.map((item) => ({
    name: item.name,
    value: item.impressions,
  }))

  const miniCtr = chartData.map((item) => ({
    name: item.name,
    value: item.ctr,
  }))

  const miniPosition = chartData.map((item) => ({
    name: item.name,
    value: item.position,
  }))

  const ctrPositionData = chartData.map((item) => ({
    name: item.name,
    ctr: Number(item.ctr.toFixed(2)),
    position: Number(item.position.toFixed(2)),
  }))

  const opportunities = useMemo(() => {
    return topKeywords
      .filter((item) => {
        const clicks = Number(item.total_clicks || 0)
        const impressions = Number(item.total_impressions || 0)
        return impressions > 0 && clicks === 0
      })
      .slice(0, 5)
  }, [topKeywords])

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
  const pageClickDistribution = topPages.slice(0, 5).map((item) => ({
  name: item.page,
  value: Number(item.total_clicks || 0),
  impressions: Number(item.total_impressions || 0),
  position: Number(item.avg_position || 0),
}))

const pieColors = [
  "var(--brand-primary)",
  "var(--brand-secondary)",
  "var(--brand-tertiary)",
  "#0ea5e9",
  "#f97316",
]
  const seoPagesChartData = topPages.slice(0, 6).map((item) => ({
  page:
    item.page.length > 28
      ? `${item.page.slice(0, 28)}...`
      : item.page,
  fullPage: item.page,
  clicks: Number(item.total_clicks || 0),
  impressions: Number(item.total_impressions || 0),
}))

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
              Analyse GSC
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight">
              Google Search Console
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-semibold text-[var(--dashboard-muted)]">
              Analyse des clics, impressions, CTR, position moyenne, pages SEO et
              mots-clés.
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
            title="Clics"
            value={loading ? "..." : formatNumber(totalClicks)}
            subtitle="Trafic organique"
            icon={<MousePointerClick className="h-5 w-5" />}
            data={miniClicks}
            color="var(--brand-primary)"
            gradientId="gscClicksGradient"
          />

          <StatCard
            title="Impressions"
            value={loading ? "..." : formatNumber(totalImpressions)}
            subtitle="Apparitions Google"
            icon={<Eye className="h-5 w-5" />}
            data={miniImpressions}
            color="var(--brand-secondary)"
            gradientId="gscImpressionsGradient"
          />

          <StatCard
            title="CTR moyen"
            value={loading ? "..." : `${averageCtr.toFixed(2)}%`}
            subtitle="Clics / impressions"
            icon={<Percent className="h-5 w-5" />}
            data={miniCtr}
            color="var(--brand-tertiary)"
            gradientId="gscCtrGradient"
          />

          <StatCard
            title="Position moyenne"
            value={loading ? "..." : averagePosition.toFixed(1)}
            subtitle="Classement Google"
            icon={<TrendingUp className="h-5 w-5" />}
            data={miniPosition}
            color="var(--brand-primary)"
            gradientId="gscPositionGradient"
          />
        </div>
<Card className="p-5">
  <SectionTitle
    title="Répartition des clics par page"
    rightText="Top 5"
  />

  {pageClickDistribution.length === 0 ? (
    <div className="flex h-[340px] items-center justify-center">
      <p className="text-sm font-bold text-[var(--dashboard-muted)]">
        Aucune page disponible.
      </p>
    </div>
  ) : (
    <div className="h-[380px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pageClickDistribution}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="43%"
            innerRadius={0}
            outerRadius={120}
            paddingAngle={2}
            label={({ value }) => `${value}`}
          >
            {pageClickDistribution.map((_, index) => (
              <Cell
                key={`page-cell-${index}`}
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
            formatter={(value: any, name: any, props: any) => {
              const item = props.payload

              return [
                `${formatNumber(Number(value))} clics | ${formatNumber(
                  Number(item.impressions || 0)
                )} impressions | position ${Number(item.position || 0).toFixed(1)}`,
                "Page",
              ]
            }}
          />

          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="square"
            wrapperStyle={{
              color: "var(--dashboard-text)",
              fontSize: "12px",
              fontWeight: 700,
              paddingTop: "12px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )}
</Card>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card className="p-5">
            <SectionTitle title="CTR et position" rightText="Qualité SEO" />

            {!hasData ? (
              <div className="flex h-[270px] items-center justify-center">
                <p className="text-sm font-bold text-[var(--dashboard-muted)]">
                  Aucune donnée disponible.
                </p>
              </div>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ctrPositionData}>
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
                      dataKey="ctr"
                      name="CTR %"
                      radius={[10, 10, 0, 0]}
                      fill="var(--brand-primary)"
                    />

                    <Bar
                      dataKey="position"
                      name="Position"
                      radius={[10, 10, 0, 0]}
                      fill="var(--brand-secondary)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <SectionTitle title="Opportunités SEO" rightText="Impressions sans clics" />

            {opportunities.length === 0 ? (
              <div className="flex h-[270px] items-center justify-center">
                <p className="text-sm font-bold text-[var(--dashboard-muted)]">
                  Aucune opportunité détectée pour le moment.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {opportunities.map((item, index) => (
                  <div
                    key={`${item.query}-${index}`}
                    className="rounded-2xl bg-[var(--dashboard-card-soft)] p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-[13px] font-black">
                        {item.query}
                      </p>

                      <span className="shrink-0 text-[12px] font-black text-[var(--brand-primary)]">
                        {formatNumber(item.total_impressions)} impr.
                      </span>
                    </div>

                    <p className="mt-1 text-[10px] font-semibold text-[var(--dashboard-muted)]">
                      Beaucoup d’impressions mais aucun clic. Améliorer le title
                      et la meta description.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card className="p-5">
            <SectionTitle title="Mots-clés performants" rightText="Top 5" />

            {topKeywords.length === 0 ? (
              <div className="flex h-[240px] items-center justify-center">
                <p className="text-sm font-bold text-[var(--dashboard-muted)]">
                  Aucun mot-clé disponible.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {topKeywords.slice(0, 5).map((item, index) => {
                  const ctr =
                    Number(item.total_impressions || 0) > 0
                      ? (Number(item.total_clicks || 0) /
                          Number(item.total_impressions || 0)) *
                        100
                      : 0

                  return (
                    <div
                      key={`${item.query}-${index}`}
                      className="grid grid-cols-[32px_minmax(0,1fr)_70px_80px_60px] items-center gap-3 border-b pb-2 last:border-b-0"
                      style={{ borderColor: "var(--dashboard-border)" }}
                    >
                      <div
                        className="grid h-8 w-8 place-items-center rounded-xl text-[11px] font-black"
                        style={{
                          backgroundColor:
                            "color-mix(in srgb, var(--brand-primary) 18%, transparent)",
                          color: "var(--brand-primary)",
                        }}
                      >
                        {index + 1}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-bold">
                          {item.query}
                        </p>

                        <p className="text-[10px] text-[var(--dashboard-muted)]">
                          Position moy. :{" "}
                          {Number(item.avg_position || 0).toFixed(1)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[11px] font-black">
                          {formatNumber(Number(item.total_clicks || 0))}
                        </p>
                        <p className="text-[9px] text-[var(--dashboard-muted)]">
                          clics
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[11px] font-black">
                          {formatNumber(Number(item.total_impressions || 0))}
                        </p>
                        <p className="text-[9px] text-[var(--dashboard-muted)]">
                          impr.
                        </p>
                      </div>

                      <div className="text-right">
                        <p
                          className="text-[11px] font-black"
                          style={{ color: "var(--brand-secondary)" }}
                        >
                          {ctr.toFixed(1)}%
                        </p>
                        <p className="text-[9px] text-[var(--dashboard-muted)]">
                          CTR
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card className="p-5">
  <SectionTitle
    title="Performance SEO par page"
    rightText="Clics vs impressions"
  />

  {seoPagesChartData.length === 0 ? (
    <div className="flex h-[280px] items-center justify-center">
      <p className="text-sm font-bold text-[var(--dashboard-muted)]">
        Aucune page disponible.
      </p>
    </div>
  ) : (
    <div className="h-[340px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={seoPagesChartData}
          layout="vertical"
          margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
        >
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
            width={165}
            tick={{ fill: "var(--dashboard-muted)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{
              background: "var(--dashboard-card)",
              border: "1px solid var(--dashboard-border)",
              borderRadius: "14px",
              color: "var(--dashboard-text)",
            }}
            formatter={(value: any, name: any) => [
              formatNumber(Number(value)),
              name === "clicks" ? "Clics" : "Impressions",
            ]}
            labelFormatter={(_, payload) => {
              const item = payload?.[0]?.payload
              return item?.fullPage || ""
            }}
          />

          <Bar
            dataKey="impressions"
            name="Impressions"
            radius={[0, 10, 10, 0]}
            fill="var(--brand-secondary)"
          />

          <Bar
            dataKey="clicks"
            name="Clics"
            radius={[0, 10, 10, 0]}
            fill="var(--brand-primary)"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )}
</Card>
        </div>
      </div>
    </div>
  )
}